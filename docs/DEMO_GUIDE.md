# DX-OS Enterprise Demo Guide (Phase 2)

This document provides a guided walkthrough for demonstrating the complete DX-OS Enterprise HR & Business Management platform. It covers key user personas, standard test credentials, navigation flows, and feature highlights across all 9 core operational domains.

---

## 1. System Overview & Architecture

DX-OS is an enterprise-grade Human Resource and Operations platform designed for strict multi-tenant isolation, organizational compliance, and scalable business workflows.

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons, date-fns.
- **Backend**: NestJS, TypeScript, Prisma ORM 6.19.3, MySQL 8.0+.
- **Security**: Argon2id password hashing, rotating refresh tokens, organization-scoped RBAC with 81 granular permissions, path traversal guard, SQL injection prevention, formula injection sanitization.
- **Timezone**: Canonical Asia/Ho_Chi_Minh (UTC+07:00).

---

## 2. Environment Startup

Ensure both backend and frontend servers are running:

```bash
# 1. Backend server (Port 3000)
npm --workspace @dx-os/backend run start

# 2. Frontend client (Port 5173)
npm --prefix frontend run dev
```

Navigate your browser to: `http://localhost:5173`

---

## 3. Demo Personas & Credentials

| Role / Persona | Email | Default Password | Primary Permissions & Responsibilities |
| :--- | :--- | :--- | :--- |
| **System Admin** | `admin.demo@dxos.local` | `<lấy từ DEMO_ADMIN_PASSWORD trong local env, không công khai>` | Full platform control: settings, employees, payroll runs, compliance, audits. |
| **HR Manager** | `hr.manager@dxos.local` | *(Organization HR)* | Approvals, review cycles, leave requests, employee compliance, workforce reports. |
| **Standard Employee** | `emp.demo@dxos.local` | *(Organization Member)* | Self-service: check-in/out, leave requests, self-evaluations, personal documents. |

> **Target Demo Organization**:
> - **Name**: `DX-OS Demo Organization`
> - **Organization ID**: `ba4540d1-f418-485b-a69e-8a5633cb3ba3`
> - **Slug**: `dxos-demo`

---

## 4. End-to-End Demo Script (10 Key Stops)

### Stop 1: Dashboard Overview (`/dashboard`)
- **Action**: Log in with Admin credentials.
- **Highlight**:
  - Top header displays organization switcher with active tenant (`DX-OS Demo Organization`).
  - Metric summary cards: Active Departments (5), Headcount (5), On-time Rate, Pending Approvals.
  - Quick action shortcuts to register employees, create events, log attendance, review tasks, and launch AI Assistant.
  - Responsive collapse on smaller viewports.

### Stop 2: Employee Directory (`/people`)
- **Action**: Click **Nhân sự** on the sidebar navigation.
- **Highlight**:
  - Employee list with live Vietnamese text search, department filtering, and sort by name/code.
  - Badges displaying employment status (`Hoạt động`, `Ngừng hoạt động`).
  - Action buttons to open detail drawer or edit modal.
  - Role-based button **Thêm nhân sự** guarded by `employee:create`.

### Stop 3: Time & Attendance Management (`/attendance`)
- **Action**: Click **Chấm công** on the sidebar navigation.
- **Highlight**:
  - Real-time Vietnam Time clock (UTC+07:00).
  - One-click Check-in and Check-out controls with automatic shift detection (`Ca hành chính 09:00 - 18:00`).
  - Attendance history table showing check-in/out timestamps, tardiness minutes, and status badges (`Đúng giờ`, `Đi muộn`, `Vắng mặt`).
  - Monthly aggregated metrics (Standard work days, On-time count, Late count).

### Stop 4: Leave Management (`/leave`)
- **Action**: Click **Nghỉ phép** on the sidebar navigation.
- **Highlight**:
  - Leave entitlement quotas (Annual leave, Sick leave, Unpaid leave).
  - Leave request submission form with date range picker and reason input.
  - Tabbed overview of pending, approved, and rejected leave requests with manager comments.

### Stop 5: Approval Workflows (`/approvals`)
- **Action**: Click **Phê duyệt** on the sidebar navigation.
- **Highlight**:
  - Centralized enterprise approval inbox for multi-step workflows (Leave, Overtime, Expenses).
  - Instant One-Click Approve / Reject actions with audit trail tracking who approved and when.
  - Filter by pending, processed, and type of request.

### Stop 6: Payroll & Compensation (`/payroll`)
- **Action**: Click **Tiền lương** on the sidebar navigation.
- **Highlight**:
  - Monthly payroll cycles (`Bảng lương tháng`).
  - Salary structure breakdown: Base salary, allowances, overtime pay, social insurance deductions, net pay.
  - Strict lifecycle states: `DRAFT` -> `PROCESSING` -> `CALCULATED` -> `PENDING_APPROVAL` -> `APPROVED` -> `FINALIZED`.
  - Export capabilities for financial audits.

### Stop 7: Performance Management (`/performance`)
- **Action**: Click **Hiệu suất** on the sidebar navigation.
- **Highlight**:
  - 4 sub-tabs: *Tổng quan & Chỉ số*, *Chu kỳ đánh giá*, *Phiếu đánh giá*, *Mục tiêu & KPI*.
  - Visual rating distribution (1 to 5 stars) with percentage breakdown.
  - Goal completion and KPI achievement meters.
  - Review workflows supporting Self-Review, Peer Review, and Manager Review.

### Stop 8: HR Reports & Analytics (`/reports`)
- **Action**: Click **Báo cáo & Phân tích** on the sidebar navigation.
- **Highlight**:
  - Vietnam-timezone date range filter (e.g., `2026-07-01` to `2026-09-30`) and department selector.
  - Aggregated metrics: Headcount, Attendance rate, Leave volume, Gross compensation.
  - Interactive SVG visual breakdown and one-click CSV export with formula injection sanitization.

### Stop 9: Documents & HR Compliance (`/documents`)
- **Action**: Click **Hồ sơ & Tuân thủ** on the sidebar navigation.
- **Highlight**:
  - KPI overview: Total documents stored, Overall compliance percentage, Expiring soon (30 days), Mandatory missing count.
  - Tab 1 (*Tất cả hồ sơ*): Document table with category tags, sensitivity levels (`PUBLIC`, `INTERNAL`, `CONFIDENTIAL`, `RESTRICTED`), version history, and secure download links.
  - Tab 2 (*Hết hạn & Sắp hết hạn*): Proactive expiration tracker.
  - Tab 3 (*Tuân thủ & Hồ sơ còn thiếu*): Department compliance progress bars and one-click upload shortcuts for missing employee documents.
  - Tab 4 (*Quy định hồ sơ*): Organization-level mandatory document policy configuration.

### Stop 10: Mobile Responsive Verification
- **Action**: Resize browser to 375x812 (iPhone view) or open mobile devtools.
- **Highlight**:
  - Adaptive hamburger navigation drawer.
  - Sticky topbar with organization switcher and profile badge.
  - Card-based layouts replacing horizontal tables without clipping or horizontal overflow.

---

## 5. Security Demonstration Points

1. **Multi-tenant Isolation**: Attempting to query resources across organizations returns HTTP 403/404 with zero data leakage.
2. **Granular RBAC**: Non-admin employees attempting to access administrative endpoints or confidential files receive HTTP 403 Forbidden.
3. **Audit Trails**: All modifications to employee profiles, salary sheets, document uploads, and approvals are logged in the tamper-resistant audit log.
