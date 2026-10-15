# DX-OS — Hệ điều hành doanh nghiệp số

Ứng dụng quản lý doanh nghiệp đa tổ chức, giao diện tiếng Việt. Backend kiểm soát xác thực, quyền và phạm vi dữ liệu của từng tổ chức.

## Chức năng

- Tổng quan, phòng ban, nhân sự, công việc/Kanban, lịch và tìm kiếm.
- Chấm công, nghỉ phép, ca làm, tiền lương, hiệu suất và báo cáo.
- Tài liệu, thông báo, phê duyệt, workflow, automation và audit.
- Quản trị thành viên/vai trò và trợ lý AI (mock offline hoặc provider cấu hình riêng).
- Demo bảo mật: Keycloak SSO, APISIX, Coraza WAF, ClamAV, OpenBao và Valkey.

## Công nghệ và cấu trúc

Node.js 22.21.1 trở lên · NestJS · React 18/Vite/TypeScript · MySQL Community 8.0.44 · Prisma 6.19.3.

| Thư mục | Nội dung |
| --- | --- |
| `backend/` | API, nghiệp vụ, RBAC và script vận hành |
| `frontend/` | Giao diện tiếng Việt |
| `database/` | Prisma schema và migration MySQL; PostgreSQL cũ được lưu riêng |
| `contracts/api/` | Hợp đồng API, gồm xác thực và SSO |
| `tests/backend/` | Unit/integration/security tests |
| `docs/architecture/` | Kiến trúc, hướng dẫn security stack và checklist kỹ thuật |
| `licenses/` | Bằng chứng giấy phép và notices bên thứ ba |
| `.github/` | CI, templates và Dependabot |

## Chạy từ bản clone mới

**Dành cho giảng viên/người chấm:** làm theo [hướng dẫn mở và test demo từ máy mới](docs/architecture/teacher-demo-quickstart.md), gồm cấu hình, tạo tài khoản và xử lý lỗi thường gặp. Repository này là mã nguồn; chưa có website demo công khai.

Cần Node/npm và MySQL đang chạy. Docker chỉ cần cho security stack đầy đủ.

```powershell
npm ci
npm --prefix frontend ci
Copy-Item backend/.env.example backend/.env
```

Sửa **file local `backend/.env`**: đặt DATABASE_URL trỏ tới database development `dx_os`, JWT_ACCESS_SECRET ngẫu nhiên riêng, và AI_PROVIDER=mock nếu chỉ demo offline. Không đưa secret lên Git/chat hoặc dùng placeholder ngoài test. Tạo database rỗng và tài khoản MySQL phù hợp trước khi chạy migration. Không dùng database có dữ liệu quan trọng để thử seed/test.

```powershell
npm run db:generate
npm run db:validate
npm run db:migrate:deploy
npm run db:migrate:status
npm run dev:backend
```

Mở terminal thứ hai:

```powershell
npm --prefix frontend run dev
```

Frontend: http://localhost:5173 · Health: http://localhost:3000/api/v1/health · OpenAPI local: http://localhost:3000/api/v1/docs/openapi.json.

### Dữ liệu demo

Đặt DEMO_ADMIN_PASSWORD riêng (ít nhất 16 ký tự) trong `.env` local, không dùng mật khẩu mặc định công khai. Các script seed hiện có được gọi bằng:

```powershell
npm --workspace @dx-os/backend run seed:demo-admin
npm --workspace @dx-os/backend run seed:demo
```

Chỉ chạy trên database development/test. Đọc code seed trước khi chạy; seed không phải migration production. Email mặc định: `admin.demo@dxos.local`. Người clone tự đặt password, repository không chứa credential của máy chủ dự án.

### Security stack đầy đủ

Xem [hướng dẫn local](docs/architecture/security-devsecops-setup.md). Giao diện qua WAF: http://localhost:8088. Stack này dùng MySQL trên host, OpenBao TLS/KV-v2/Raft và AppRole agent; không chứa secret/volume của máy gốc. Keycloak chỉ liên kết danh tính, không tự cấp quyền DX-OS. Sonar/SonarJS đã thay bằng quality gate mã nguồn mở.

## Kiểm thử

```powershell
npm run lint:backend
npm run build:backend
npm --prefix frontend run lint
npm --prefix frontend test
npm --prefix frontend run build
npm --workspace @dx-os/backend run test:rbac:mysql
```

Full backend suite tạo/replay/xóa database **tạm có tên riêng**; tài khoản chạy test cần quyền tạo/xóa database tạm. Không reset `dx_os`. Xem script `backend/scripts/test-rbac-mysql.js` trước khi dùng account ngoài local.

Kết quả local ngày 15/10/2026: **1.295 backend tests, 270 frontend tests PASS**, build/lint đạt (zero warnings), production npm audit không có lỗ hổng. Chín service đang chạy được quét Trivy: zero HIGH/CRITICAL và có CycloneDX SBOM. Live edge/SSO/logout: 23 checks; Keycloak: 10; OIDC fixture: 8; ClamAV/OpenBao/agent renewal/Valkey đã kiểm tra riêng. Đây là bằng chứng theo thời điểm, không bảo đảm không có lỗ hổng tương lai hoặc CI remote đã chạy.

## Giới hạn và giấy phép

Đã hoàn thiện local, **chưa phải triển khai production**. Chưa có domain/máy chủ; Keycloak start-dev/H2, Raft một node và seal custody cùng máy cần thay đổi khi triển khai. ClamAV image không chứa libunrar và không bảo đảm quét RAR. Không đưa database dump, dữ liệu cá nhân hoặc credential vào repository.

Mã nguồn gốc: [Apache-2.0](LICENSE), [NOTICE](NOTICE). Thư viện/font/image giữ giấy phép riêng: [THIRD_PARTY_NOTICES](THIRD_PARTY_NOTICES.md). Snapshot Windows: evidence 936/936 package đã cài, gồm 12 publisher declarations phân biệt với standalone LICENSE; 110 package optional cần rà đúng nền tảng nếu phân phối. Binary release cần source/notices tương ứng.

Xem [kết quả kiểm chứng local](docs/architecture/validation-status.md), [hướng dẫn đóng góp](CONTRIBUTING.md), [bảo mật](SECURITY.md) và [chuẩn bị Git](docs/architecture/git-publication.md).
