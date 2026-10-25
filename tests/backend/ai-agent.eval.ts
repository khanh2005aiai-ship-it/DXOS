import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { INestApplicationContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { PrismaClient } from '@prisma/client';

/**
 * DXOS-AI-003 evaluation (spec 11.3) — not part of the regular test run (file name does not match the test regex).
 * Asks the questions of fixtures/ai-agent-eval.json as the demo users through AiService (real permission checks,
 * tools, audit), records which tools ran and writes a report to security-artifacts/ (git-ignored). Local demo DB only.
 *
 *   npm --workspace @dx-os/backend run ai:eval                       # offline mock (default)
 *   AI_PROVIDER=ollama AI_BASE_URL=https://ollama.com/v1 AI_MODEL=gpt-oss:120b AI_API_KEY=… npm --workspace @dx-os/backend run ai:eval
 *   EVAL_ONLY=E31,E32 npm --workspace @dx-os/backend run ai:eval            # only these cases
 *
 * Pass criteria (spec mục 3): mock answers every case in its rule set; a real model selects the expected tools in
 * ≥ 85% of cases; never a permission leak.
 */
interface EvalCase {
  id: string; as: string; question: string; tools: string[]; allowExtra?: string[]; outcome: string; forbidden?: string[]; mock?: boolean;
  /** Each entry must appear in the answer; 'a|b' accepts either. `{next_week.from}` / `{next_week.to}` become dd/MM of that range. */
  mustInclude?: string[];
  /** Wording the answer must not use (pronouns, identity, phrasing). Fails the case but is not a permission leak. */
  avoid?: string[];
}
interface ToolRun { name: string; status: string }

const envPath = resolve(__dirname, '../../backend/.env');
if (!process.env.DATABASE_URL && existsSync(envPath)) process.loadEnvFile(envPath);
process.env.VAULT_ENABLED = 'false';

describe('AI agent evaluation set', () => {
  it('answers the evaluation questions with the expected tools and no permission leak', async () => {
    const { localDemoDatabase } = await import('../../backend/scripts/demo/seed-demo-dataset');
    const { DEMO_ORGANIZATION_SLUG } = await import('../../backend/scripts/demo/demo-fixtures');
    localDemoDatabase(process.env);
    const fixture = JSON.parse(readFileSync(resolve(__dirname, 'fixtures/ai-agent-eval.json'), 'utf8')) as
      { users: Record<string, string>; cases: EvalCase[] };
    const { AppModule } = await import('../../backend/src/app.module');
    const { AiService } = await import('../../backend/src/modules/ai/ai.service');
    const { AiToolRegistry } = await import('../../backend/src/modules/ai/tools/tool-registry');
    const { rangeView, resolveRange } = await import('../../backend/src/modules/ai/agent/period');
    // Date-dependent expectations, resolved like the tools do (Vietnam time, weeks start on Monday).
    const nextWeek = rangeView(resolveRange({ period: 'next_week' }, new Date(), 'next_week', 7));
    const dates: Record<string, string> = { '{next_week.from}': nextWeek.from.slice(0, 5), '{next_week.to}': nextWeek.to.slice(0, 5) };
    const expand = (text: string) => text.replace(/\{[a-z_.]+\}/g, (token) => dates[token] ?? token);
    // EVAL_LOG=1 also prints the structured agent/tool logs (no content: tool names, outcomes, invalid field names).
    const app: INestApplicationContext = await NestFactory.createApplicationContext(AppModule,
      { logger: process.env.EVAL_LOG === '1' ? ['error', 'warn', 'log'] : ['error'] });
    const config = app.get(ConfigService).getOrThrow<{ aiProvider: string; aiModel: string }>('app');
    const db = new PrismaClient();
    try {
      // Record tool runs without changing behaviour.
      const registry = app.get(AiToolRegistry);
      let runs: ToolRun[] = [];
      const execute = registry.execute.bind(registry);
      registry.execute = async (call, context) => {
        // EVAL_ARGS=1 prints the arguments the model sent (local demo data only), to debug tool selection.
        if (process.env.EVAL_ARGS === '1') process.stdout.write(`     call ${call.name} ${call.arguments}\n`);
        const result = await execute(call, context);
        runs.push({ name: result.name, status: result.status });
        return result;
      };

      const org = await db.organization.findUniqueOrThrow({ where: { slug: DEMO_ORGANIZATION_SLUG }, select: { id: true } });
      const userIds: Record<string, string> = {};
      for (const [role, email] of Object.entries(fixture.users)) userIds[role] = (await db.user.findUniqueOrThrow({ where: { email }, select: { id: true } })).id;
      const ai = app.get(AiService);
      const mock = config.aiProvider === 'mock';
      const rows = [];

      // EVAL_ONLY=E31,E32 runs a subset while iterating on the prompt; the full set is the reference result.
      const only = process.env.EVAL_ONLY?.split(',').map((id) => id.trim()).filter(Boolean);
      for (const item of fixture.cases) {
        if (mock && item.mock === false) continue;
        if (only?.length && !only.includes(item.id)) continue;
        runs = [];
        const started = Date.now();
        let text = '';
        let error: string | null = null;
        let numeric = 'NOT_APPLICABLE';
        let finishReason = '';
        try {
          const response = await ai.generate(userIds[item.as], org.id, { messages: [{ role: 'user', content: item.question }], maxOutputTokens: 1024, temperature: 0 });
          text = response.text;
          numeric = response.numericCheck.status;
          finishReason = response.finishReason;
        } catch (e) {
          error = e instanceof Error ? e.name + ':' + e.message : 'error';
        }
        const called = runs.map((r) => r.name);
        const allowed = new Set([...item.tools.flatMap((t) => t.split('|')), ...(item.allowExtra ?? [])]);
        const toolsOk = item.tools.every((t) => t.split('|').some((name) => called.includes(name))) && called.every((name) => allowed.has(name));
        const statuses = runs.map((r) => r.status);
        const outcome = !runs.length ? 'NO_TOOL' : statuses.includes('DENIED') ? 'DENIED' : statuses.includes('OK') ? 'OK'
          : statuses.includes('EMPTY') ? 'EMPTY' : statuses[0];
        const outcomeOk = item.outcome === 'ANY' || item.outcome === outcome || (item.outcome === 'NO_TOOL' && outcome === 'DENIED');
        // Models sometimes write non-breaking hyphens/spaces ("DX‑OS") or spaced dates ("26 / 10"); compare on plain characters.
        const plain = text.replace(/[\u2010\u2011]/g, '-').replace(/\u00a0/g, ' ').replace(/\s*\/\s*/g, '/');
        const forbiddenHit = (item.forbidden ?? []).filter((f) => plain.includes(f));
        const missing = (item.mustInclude ?? []).map(expand).filter((m) => !m.split('|').some((alt) => plain.includes(alt)));
        const avoidHit = (item.avoid ?? []).filter((a) => plain.includes(a));
        const pass = !error && toolsOk && outcomeOk && !forbiddenHit.length && !missing.length && !avoidHit.length && finishReason !== 'tool_limit';
        rows.push({ id: item.id, as: item.as, question: item.question, pass, toolsOk, outcome, expectedOutcome: item.outcome,
          tools: runs.map((r) => `${r.name}:${r.status}`), numericCheck: numeric, finishReason, forbiddenHit, missing, avoidHit, error, ms: Date.now() - started, answer: text });
        process.stdout.write(`${pass ? 'PASS' : 'FAIL'} ${item.id} [${item.as}] ${item.question}\n     tools=${rows.at(-1)!.tools.join(', ') || '-'}`
          + ` numeric=${numeric}${error ? ' error=' + error : ''}${forbiddenHit.length ? ' forbidden=' + forbiddenHit.join(',') : ''}`
          + `${missing.length ? ' missing=' + missing.join(',') : ''}${avoidHit.length ? ' avoid=' + avoidHit.join(',') : ''}\n`);
      }

      const applicable = rows.filter((r) => r.numericCheck !== 'NOT_APPLICABLE');
      const summary = {
        provider: config.aiProvider, model: config.aiModel, at: new Date().toISOString(), cases: rows.length,
        passed: rows.filter((r) => r.pass).length,
        toolSelection: Number((rows.filter((r) => r.toolsOk).length / rows.length).toFixed(3)),
        numericPass: applicable.length ? Number((applicable.filter((r) => r.numericCheck === 'PASS').length / applicable.length).toFixed(3)) : null,
        permissionLeaks: rows.filter((r) => r.forbiddenHit.length).length,
        wordingIssues: rows.filter((r) => r.avoidHit.length || r.missing.length).length,
        p95Ms: rows.map((r) => r.ms).sort((a, b) => a - b)[Math.max(0, Math.ceil(rows.length * 0.95) - 1)],
      };
      const dir = resolve(__dirname, '../../security-artifacts');
      mkdirSync(dir, { recursive: true });
      const file = resolve(dir, `ai-eval-${config.aiProvider}-${summary.at.slice(0, 19).replace(/[:T]/g, '-')}.json`);
      writeFileSync(file, JSON.stringify({ summary, rows }, null, 2) + '\n');
      process.stdout.write('\n' + JSON.stringify(summary, null, 2) + '\nReport: ' + file + '\n');

      expect(summary.permissionLeaks).toBe(0);
      if (mock) expect(summary.passed).toBe(summary.cases);
      else expect(summary.toolSelection).toBeGreaterThanOrEqual(0.85);
    } finally {
      await db.$disconnect();
      await app.close();
    }
  }, 20 * 60_000);
});
