# Phạm vi rà soát bảo mật trước release v0.1.0

Không phải chứng nhận hệ thống không có lỗ hổng. Gate tự động trên đúng revision được lưu ở PR/Actions và release notes; không lấy kết quả local cũ để thay cho gate của tag.

## Mã ứng dụng và dữ liệu

Đã đọc lại AuthorizationService/OrganizationPermissionGuard, JWT/session boundary, seed demo và file storage boundary. API kiểm tra actor được xác thực, account/membership/organization ACTIVE, role ACTIVE cùng tenant và permission key cụ thể. UI chỉ ẩn chức năng, không thay kiểm tra server. Không thêm permission grant, bypass role-name hoặc chính sách mới trong lượt release.

Full backend suite hiện có kiểm tra anonymous 401, thiếu quyền/inactive/foreign tenant 403, identifier tampering và privilege injection; frontend kiểm tra actor/org request isolation, URL trực tiếp, logout và role:read không suy ra role:assign. Các gate cần PASS lại cho revision release. Smoke demo bổ sung login thực, profile, business API, file bytes, foreign-org denial, member chưa có quyền role:read bị 403 và token bị thu hồi sau logout.

Không sửa Prisma schema hoặc migration lịch sử. CI replay database tạm và kiểm tra drift. Demo hạ tầng có MySQL 8.0.44 volume riêng; bootstrap kết nối localhost trong namespace của container MySQL để giữ ràng buộc seed, không dùng database host. Backup phải gồm DB, file volume và cấu hình private tương ứng; không reset dữ liệu thật.

## Secrets và chuỗi cung ứng

- Demo sinh độc lập database password, root password, JWT secret và admin password từ crypto.randomBytes, lưu .secrets/ ignored. Không dùng password mẫu, không commit/log giá trị, không tự thay ACL. Chạy init lại không xoay secret của DB đang tồn tại.
- Container backend không nhận demo admin/root DB password. Tài khoản ứng dụng MySQL chỉ có database demo; bootstrap tool image tách khỏi runtime, runtime prune dev dependencies và bỏ npm binary như cấu hình hiện có.
- npm ci từ hai lockfile; Prisma giữ 6.19.3; base MySQL và Node/image hiện có dùng digest. apk upgrade cập nhật bản vá OS tại build, nên không cam kết binary bit-for-bit.
- CI production npm audit và catalog/legal evidence nghiêm ngặt. Giữ notices/bằng chứng bên thứ ba nguyên bản. Một số package được ghi rõ reviewed publisher declaration thay vì bịa standalone LICENSE; inventory được thu lại đúng nền tảng Linux.
- Trivy 0.76.0 kiểm tra source vulnerability/misconfiguration và runtime HIGH/CRITICAL, tạo CycloneDX SBOM. Không ignore CVE hoặc giảm severity gate để phát hành. Không skip module backend/src/modules/work.
- Publication checker kiểm tra tracked/history và các mẫu secret có độ tin cậy cao. Công cụ không chứng minh tuyệt đối không có mọi secret/PII trong mọi file, ảnh hoặc log; release archive chỉ lấy committed paths và từ chối đường dẫn private/generated.

## Phân tách mạng và giới hạn

Demo bind HTTP trên 127.0.0.1, không public MySQL/backend port; mạng ứng dụng/data nội bộ, chỉ frontend có thêm ingress bridge để host truy cập cổng loopback đã publish. Backend/frontend chạy non-root, read-only filesystem với /tmp và private file volume riêng, cap_drop ALL và no-new-privileges. CORS theo cổng demo, reverse proxy cùng origin. Bootstrap fail thì backend không start.

Demo dùng development mode, process-local rate limit, AI mock; SSO/ClamAV/OpenBao không bật ở compose demo đơn giản. Không công khai/tunnel hay đưa dữ liệu thật vào compose này. Upload ở demo không có antivirus. Full security stack riêng vẫn có Valkey shared limit, Keycloak OIDC, ClamAV fail-closed, OpenBao TLS/KV/Raft/agent, APISIX/Coraza; live tích hợp cũ không được giả là đã chạy lại trong lượt release nếu chưa có bằng chứng mới.

Chưa có domain/máy chủ production, HA/DR hoặc credential custody ngoài host. Keycloak start-dev/H2 và OpenBao một node trong full stack chỉ phục vụ local. Production cần đánh giá riêng, TLS, DB/IdP production, shared limits, secret rotation/custody, backup-restore đã diễn tập và giám sát. Release ghi rõ phạm vi local/demo.

## Release integrity

Làm qua nhánh và PR riêng, tự kiểm tra diff và automated gate; không tuyên bố đã có human approval độc lập. Annotated tag cố định commit main đã kiểm chứng; source ZIP/manifest/SHA256SUMS đi cùng release. Tag chưa ký số không được mô tả là signed release. Không force-update tag để che sửa lỗi; lỗi sau release dùng patch version/PR mới.
