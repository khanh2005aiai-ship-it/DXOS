import { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Bot,
  Send,
  Loader2,
  RotateCcw,
  AlertCircle,
  Trash2,
  Sparkles,
  Users,
  Clock,
  Award,
  FileCheck,
  TrendingUp,
  BarChart2,
  GitMerge,
  ArrowRight,
} from 'lucide-react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';
import { useOrgBootstrapGuard } from '@/hooks/useOrgBootstrapGuard';
import { usePermission } from '@/hooks/usePermission';
import { generateAi, getAiConfig, getAiInsights } from '@/api/ai';
import { isApiError } from '@/api/client';
import { PageHeader } from '@/components/ui/PageHeader';
import { LoadingState } from '@/components/ui/LoadingState';
import { ForbiddenState } from '@/components/ui/ForbiddenState';
import type { AiMessage, AiInsightsResponse } from '@/api/types';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  status?: 'sent' | 'error';
  requestId?: string;
}

function formatProviderLabel(provider: string, model: string): string {
  const p = provider.toLowerCase();
  if (p === 'openai') {
    return `OpenAI: ${model}`;
  }
  if (p === 'gemini') {
    return `Gemini: ${model}`;
  }
  return `${provider}:${model}`;
}

function formatInlineText(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={idx} className="font-semibold text-slate-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

function AssistantMessageContent({ content }: { content: string }) {
  const lines = content.split('\n');

  return (
    <div className="space-y-1.5 text-xs leading-relaxed text-slate-800">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} className="h-1" />;
        }

        if (trimmed.startsWith('## ')) {
          return (
            <h3
              key={idx}
              className="text-xs font-bold text-slate-900 mt-2.5 mb-1 pb-0.5 border-b border-slate-200/60 flex items-center gap-1.5"
            >
              <TrendingUp className="h-3 w-3 text-brand-600" />
              <span>{trimmed.slice(3)}</span>
            </h3>
          );
        }

        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={idx} className="text-[11px] font-semibold text-slate-800 mt-2 mb-0.5">
              {trimmed.slice(4)}
            </h4>
          );
        }

        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <div key={idx} className="flex items-start gap-1.5 ml-1">
              <span className="text-brand-500 font-bold select-none">•</span>
              <span className="flex-1">{formatInlineText(trimmed.slice(2))}</span>
            </div>
          );
        }

        return <p key={idx}>{formatInlineText(trimmed)}</p>;
      })}
    </div>
  );
}

export function AiAssistantPage() {
  const { currentOrg } = useOrganization();
  const orgId = currentOrg?.id;

  const { hasPermission, isLoading: isPermissionLoading } = usePermission();
  const canUseAi = hasPermission('ai:use');

  let isAuthenticated = true;
  try {
    const auth = useAuth();
    isAuthenticated = auth?.isAuthenticated ?? true;
  } catch {
    isAuthenticated = true;
  }

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeProviderInfo, setActiveProviderInfo] = useState<{
    provider: string;
    model: string;
  } | null>(null);

  const [insights, setInsights] = useState<AiInsightsResponse | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const currentOrgIdRef = useRef<string | null>(null);

  // Auto-scroll to bottom whenever messages or loading state changes
  useEffect(() => {
    try {
      if (typeof messagesEndRef.current?.scrollIntoView === 'function') {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    } catch {
      // Ignored in test / JSDOM environment
    }
  }, [messages, isLoading, error]);

  // Load AI configuration on mount or when organization switches
  useEffect(() => {
    if (!orgId || !canUseAi) return;
    let isMounted = true;
    if (typeof getAiConfig === 'function') {
      getAiConfig(orgId)
        .then((cfg) => {
          if (isMounted && cfg) {
            setActiveProviderInfo({ provider: cfg.provider, model: cfg.model });
          }
        })
        .catch(() => {
          // Fallback silently if unconfigured or error
        });
    }
    return () => {
      isMounted = false;
    };
  }, [orgId, canUseAi]);

  // Load AI Insights summary
  useEffect(() => {
    if (!orgId || !canUseAi) return;
    let isMounted = true;
    if (typeof getAiInsights === 'function') {
      getAiInsights(orgId)
        .then((data) => {
          if (isMounted && data) {
            setInsights(data);
          }
        })
        .catch(() => {
          // Silently ignore if insights endpoint unavailable
        });
    }
    return () => {
      isMounted = false;
    };
  }, [orgId, canUseAi]);

  // Tenant isolation & logout guard: reset conversation when organization switches or user logs out
  useEffect(() => {
    if (!isAuthenticated || !orgId) {
      setMessages([]);
      setError(null);
      setActiveProviderInfo(null);
      setInsights(null);
      currentOrgIdRef.current = null;
      return;
    }

    if (currentOrgIdRef.current !== orgId) {
      currentOrgIdRef.current = orgId;
      setMessages([]);
      setError(null);
      setActiveProviderInfo(null);
      setInsights(null);
      setIsLoading(false);
    }
  }, [isAuthenticated, orgId]);

  // Focus textarea on load
  useEffect(() => {
    if (canUseAi && !isPermissionLoading) {
      textareaRef.current?.focus();
    }
  }, [canUseAi, isPermissionLoading]);

  const sendConversationTurn = useCallback(
    async (turnMessages: ChatMessage[], targetOrgId: string) => {
      setIsLoading(true);
      setError(null);

      try {
        // Send previous turns plus the current turn, bounded by the 16 messages contract limit
        const apiMessages: AiMessage[] = turnMessages
          .filter((m) => m.status !== 'error')
          .slice(-16)
          .map((m) => ({
            role: m.role,
            content: m.content,
          }));

        const response = await generateAi(targetOrgId, {
          messages: apiMessages,
          maxOutputTokens: 1024,
        });

        // Verify that targetOrgId matches the active organization (race condition guard)
        if (currentOrgIdRef.current !== targetOrgId) {
          return;
        }

        const assistantMsg: ChatMessage = {
          id: response.id || `ast-${Date.now()}`,
          role: 'assistant',
          content: response.text,
          timestamp: Date.now(),
          requestId: response.requestId,
        };

        setMessages((prev) => [...prev, assistantMsg]);
        if (response.provider && response.model) {
          setActiveProviderInfo({ provider: response.provider, model: response.model });
        }
      } catch (err: unknown) {
        if (currentOrgIdRef.current !== targetOrgId) return;

        let errorMsg = 'Không nhận được phản hồi từ hệ thống AI. Vui lòng thử lại.';

        if (isApiError(err)) {
          const code = err.error.code;

          if (code === 'AI_PROVIDER_NOT_CONFIGURED') {
            errorMsg = 'AI Provider chưa được cấu hình. Vui lòng thiết lập API key trên máy chủ.';
          } else if (code === 'AI_PROVIDER_UNAVAILABLE') {
            errorMsg = 'Dịch vụ AI hiện không khả dụng hoặc bị quá thời gian chờ. Vui lòng thử lại.';
          } else if (code === 'AI_LIMIT_EXCEEDED') {
            errorMsg = 'Tài khoản OpenAI đã hết số dư (credit balance exhausted) hoặc vượt quá hạn mức yêu cầu. Vui lòng nạp thêm credit tại platform.openai.com/settings/organization/billing để tiếp tục sử dụng model gpt-4o-mini.';
          } else if (code === 'FORBIDDEN') {
            errorMsg = 'Bạn không có quyền sử dụng Trợ lý AI trong tổ chức này (yêu cầu quyền ai:use).';
          } else if (code === 'UNAUTHORIZED') {
            errorMsg = 'Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.';
          } else if (code === 'VALIDATION_FAILED' || code === 'AI_INVALID_REQUEST') {
            errorMsg = 'Nội dung tin nhắn không hợp lệ hoặc vượt quá giới hạn.';
          } else if (err.error.message) {
            errorMsg = err.error.message;
          }
        }

        setError(errorMsg);

        // Mark the last user message as error status so user can retry
        setMessages((prev) => {
          if (prev.length === 0) return prev;
          const updated = [...prev];
          const lastIdx = updated.length - 1;
          if (updated[lastIdx].role === 'user') {
            updated[lastIdx] = { ...updated[lastIdx], status: 'error' };
          }
          return updated;
        });
      } finally {
        if (currentOrgIdRef.current === targetOrgId) {
          setIsLoading(false);
          // Auto refocus input on finish
          setTimeout(() => textareaRef.current?.focus(), 50);
        }
      }
    },
    []
  );

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || !orgId || isLoading || !canUseAi) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      role: 'user',
      content: trimmed,
      timestamp: Date.now(),
      status: 'sent',
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    sendConversationTurn(nextMessages, orgId);
  };

  const handleRetry = () => {
    if (!orgId || isLoading || !canUseAi || messages.length === 0) return;

    const lastMsg = messages[messages.length - 1];
    if (lastMsg.role !== 'user') return;

    const cleanedMessages = messages.map((m, idx) =>
      idx === messages.length - 1 ? { ...m, status: 'sent' as const } : m
    );

    setMessages(cleanedMessages);
    sendConversationTurn(cleanedMessages, orgId);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearConversation = () => {
    if (isLoading) return;
    setMessages([]);
    setError(null);
    textareaRef.current?.focus();
  };

  const orgGuard = useOrgBootstrapGuard();
  if (orgGuard) return orgGuard;
  if (isPermissionLoading) return <LoadingState message="Đang kiểm tra quyền hạn..." />;
  if (!canUseAi) {
    return <ForbiddenState message="Bạn không có quyền sử dụng Trợ lý AI trong tổ chức này (yêu cầu quyền ai:use)." />;
  }

  const hasFailedTurn = error !== null && messages.length > 0 && messages[messages.length - 1].role === 'user';

  const analyticsPrompts = [
    { label: 'Những workflow nào đang cần xử lý?', icon: '⚡' },
    { label: 'Những hợp đồng nào sắp hết hạn trong 30 ngày?', icon: '📋' },
    { label: 'Đề xuất các automation HR cần thiết', icon: '🤖' },
    { label: 'Có automation nào bị lỗi?', icon: '🛡️' },
    { label: 'Phân tích tình hình nhân sự hiện tại', icon: '👥' },
    { label: 'Phân tích chấm công tháng này', icon: '⏰' },
    { label: 'Phân tích hiệu suất nhân sự', icon: '🎯' },
    { label: 'Phân tích tình trạng hồ sơ & tuân thủ', icon: '📄' },
    { label: 'Tổng quan HR tháng này', icon: '📈' },
    { label: 'So sánh tháng này với tháng trước', icon: '🔄' },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <PageHeader
        title={
          <div className="flex items-center gap-2">
            <span>Trợ lý AI</span>
            {activeProviderInfo ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-full bg-brand-50 text-brand-700 border border-brand-200 shadow-sm">
                <Sparkles className="h-3.5 w-3.5 text-brand-600" />
                {formatProviderLabel(activeProviderInfo.provider, activeProviderInfo.model)}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full bg-slate-100 text-slate-600">
                Sẵn sàng
              </span>
            )}
          </div>
        }
        description="Trợ lý thông minh hỗ trợ xử lý công việc và phân tích dữ liệu HR tổ chức"
        actions={
          messages.length > 0 ? (
            <button
              type="button"
              onClick={handleClearConversation}
              disabled={isLoading}
              className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
              title="Xóa lịch sử hội thoại hiện tại"
            >
              <Trash2 className="h-3.5 w-3.5 text-slate-500" />
              <span>Xóa hội thoại</span>
            </button>
          ) : undefined
        }
      />

      {/* Main chat window */}
      <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden min-h-0">
        <div
          className="flex-1 overflow-y-auto p-4 space-y-4"
          role="log"
          aria-label="Lịch sử trò chuyện với AI"
        >
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center py-6 px-4">
              <div className="h-16 w-16 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mb-3 shadow-inner">
                <Bot className="h-8 w-8" />
              </div>
              <h3 className="text-base font-semibold text-slate-800 mb-1">
                Trợ lý AI & Phân tích Doanh nghiệp
              </h3>
              <p className="text-xs text-slate-500 max-w-md mb-4">
                Tra cứu, phân tích xu hướng và giải đáp thông tin HR thời gian thực cho tổ chức {currentOrg?.name}.
              </p>

              {/* AI Insights Panel */}
              {insights && (
                <div className="w-full max-w-2xl bg-slate-50 border border-slate-200/80 rounded-xl p-3 mb-4 text-left shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                      <BarChart2 className="h-3.5 w-3.5 text-brand-600" />
                      <span>AI Insights (Thời gian thực)</span>
                    </div>
                    <span className="text-[10px] text-slate-400">Dữ liệu tháng hiện tại</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {/* Workforce card */}
                    <button
                      type="button"
                      onClick={() => setInput('Phân tích tình hình nhân sự hiện tại')}
                      className="p-2.5 rounded-lg bg-white border border-slate-200/60 hover:border-brand-300 hover:shadow-xs transition-all text-left group"
                    >
                      <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500 mb-0.5">
                        <Users className="h-3 w-3 text-blue-500" />
                        <span>Nhân sự</span>
                      </div>
                      <div className="text-sm font-bold text-slate-900">
                        {insights.workforce ? `${insights.workforce.active} người` : '—'}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {insights.workforce?.topDepartment ? `Top: ${insights.workforce.topDepartment}` : 'Đang hoạt động'}
                      </div>
                    </button>

                    {/* Attendance card */}
                    <button
                      type="button"
                      onClick={() => setInput('Phân tích chấm công tháng này')}
                      className="p-2.5 rounded-lg bg-white border border-slate-200/60 hover:border-brand-300 hover:shadow-xs transition-all text-left group"
                    >
                      <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500 mb-0.5">
                        <Clock className="h-3 w-3 text-amber-500" />
                        <span>Chấm công</span>
                      </div>
                      <div className="text-sm font-bold text-slate-900">
                        {insights.attendance?.attendanceRate !== null && insights.attendance?.attendanceRate !== undefined
                          ? `${insights.attendance.attendanceRate}%`
                          : '—'}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {insights.attendance ? `Đi muộn: ${insights.attendance.lateCount} lượt` : 'Đang theo dõi'}
                      </div>
                    </button>

                    {/* Performance card */}
                    <button
                      type="button"
                      onClick={() => setInput('Phân tích hiệu suất nhân sự')}
                      className="p-2.5 rounded-lg bg-white border border-slate-200/60 hover:border-brand-300 hover:shadow-xs transition-all text-left group"
                    >
                      <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500 mb-0.5">
                        <Award className="h-3 w-3 text-purple-500" />
                        <span>Hiệu suất</span>
                      </div>
                      <div className="text-sm font-bold text-slate-900">
                        {insights.performance?.averageRating !== null && insights.performance?.averageRating !== undefined
                          ? `${insights.performance.averageRating}/5 ⭐`
                          : '—'}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {insights.performance?.completionRate ? `Hoàn thành: ${insights.performance.completionRate}%` : 'Chu kỳ hiện tại'}
                      </div>
                    </button>

                    {/* Compliance card */}
                    <button
                      type="button"
                      onClick={() => setInput('Phân tích tình trạng hồ sơ & tuân thủ')}
                      className="p-2.5 rounded-lg bg-white border border-slate-200/60 hover:border-brand-300 hover:shadow-xs transition-all text-left group"
                    >
                      <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500 mb-0.5">
                        <FileCheck className="h-3 w-3 text-emerald-500" />
                        <span>Tuân thủ</span>
                      </div>
                      <div className="text-sm font-bold text-slate-900">
                        {insights.compliance?.complianceRate !== null && insights.compliance?.complianceRate !== undefined
                          ? `${insights.compliance.complianceRate}%`
                          : '—'}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {insights.compliance ? `Sắp hết hạn: ${insights.compliance.expiringSoonCount}` : 'Hồ sơ bắt buộc'}
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* Quick Analytics Prompts */}
              <div className="flex flex-wrap gap-2 justify-center max-w-2xl">
                {analyticsPrompts.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => setInput(p.label)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs text-slate-700 transition-colors shadow-xs flex items-center gap-1.5"
                  >
                    <span>{p.icon}</span>
                    <span>&ldquo;{p.label}&rdquo;</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                  msg.role === 'user'
                    ? msg.status === 'error'
                      ? 'bg-red-50 text-red-900 border border-red-200 rounded-br-none'
                      : 'bg-brand-600 text-white rounded-br-none shadow-sm'
                    : 'bg-slate-100 text-slate-800 rounded-bl-none border border-slate-200/60'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1.5 opacity-75 text-[11px]">
                  {msg.role === 'user' ? (
                    <span>Bạn</span>
                  ) : (
                    <span className="flex items-center gap-1 font-medium text-slate-900">
                      <Bot className="h-3 w-3 text-brand-600" />
                      Trợ lý AI
                    </span>
                  )}
                  <span>•</span>
                  <span>
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  {msg.status === 'error' && (
                    <span className="text-red-600 font-semibold flex items-center gap-0.5">
                      <AlertCircle className="h-3 w-3" /> Lỗi gửi
                    </span>
                  )}
                </div>

                {msg.role === 'assistant' ? (
                  <>
                    <AssistantMessageContent content={msg.content} />
                    {(msg.content.toLowerCase().includes('workflow') ||
                      msg.content.toLowerCase().includes('quy trình') ||
                      msg.content.toLowerCase().includes('gia hạn')) && (
                      <div className="mt-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-brand-200 dark:border-brand-800/60 shadow-xs flex items-center justify-between gap-3" data-testid="ai-workflow-recommendation-card">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-brand-50 text-brand-600">
                            <GitMerge className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-slate-900 dark:text-white">Quy trình nhân sự cần phê duyệt</div>
                            <div className="text-[10px] text-slate-500">Xem danh sách các bước đang chờ xác nhận từ HR</div>
                          </div>
                        </div>
                        <Link
                          to="/workflows"
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white shadow-xs transition-colors shrink-0"
                          data-testid="ai-link-to-workflows"
                        >
                          <span>Mở Workflows</span>
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="whitespace-pre-wrap break-words leading-relaxed">
                    {msg.content}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-2xl rounded-bl-none px-4 py-3 bg-slate-100 text-slate-800 border border-slate-200/60 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-brand-600" />
                <span className="text-xs text-slate-500">Trợ lý AI đang xử lý câu trả lời...</span>
              </div>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2 min-w-0">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                <span className="truncate">{error}</span>
              </div>
              {hasFailedTurn && (
                <button
                  type="button"
                  onClick={handleRetry}
                  disabled={isLoading}
                  className="btn-secondary text-xs py-1 px-2.5 bg-white shrink-0 flex items-center gap-1 hover:bg-red-50 border-red-200 text-red-700"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Thử lại</span>
                </button>
              )}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="p-3 border-t border-slate-200 bg-slate-50/50">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-end gap-2"
          >
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Nhập câu hỏi hoặc yêu cầu phân tích (Nhấn Enter để gửi, Shift + Enter để xuống dòng)..."
                disabled={isLoading}
                rows={2}
                maxLength={4000}
                className="input w-full resize-none py-2 pr-12 text-sm max-h-32"
                aria-label="Khung nhập tin nhắn gửi tới Trợ lý AI"
                data-testid="ai-chat-input"
              />
              <span className="absolute right-2 bottom-2 text-[10px] text-slate-400 select-none">
                {input.length}/4000
              </span>
            </div>

            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="btn-primary p-2.5 h-[42px] aspect-square flex items-center justify-center shrink-0 mb-0.5"
              title="Gửi tin nhắn (Enter)"
              aria-label="Gửi tin nhắn"
              data-testid="ai-chat-send"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </form>

          <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400 px-1">
            <span>Dữ liệu AI được giới hạn nghiêm ngặt trong tổ chức của bạn.</span>
            <span>Enter gửi • Shift+Enter xuống dòng</span>
          </div>
        </div>
      </div>
    </div>
  );
}
