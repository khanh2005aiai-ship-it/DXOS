# Kế hoạch release và hạ tầng v0.1.0

Phạm vi: mã nguồn DX-OS tại tag cố định có thể clone, compile và chạy demo với dữ liệu giả lập. Đây là release local/demo, không phải chứng nhận production.

1. Làm trên nhánh release/v0.1.0-readiness và mở Pull Request vào main. Không gộp các Dependabot major upgrades vào release này.
2. Giữ nguyên API, RBAC, Prisma 6.19.3, MySQL 8.0.44 và lịch sử migration. Không thay đổi backend business contracts/schema. Chỉ bổ sung tooling/Docker/deployment/docs/CI.
3. Tái sử dụng backend/frontend Dockerfile. Tách target tools để Prisma và seed chạy một lần trước runtime; runtime không mang dev dependencies.
4. Thêm compose demo độc lập: MySQL riêng, volume DB/file riêng, backend không public port, nginx proxy cùng origin, HTTP chỉ bind 127.0.0.1. Secret tự sinh lưu trong .secrets/ ignored, không lấy credential từ máy tác giả. AI mock; SSO/ClamAV/OpenBao dùng security stack hiện có khi cần demo riêng.
5. Seed hiện tại chỉ chấp nhận MySQL localhost. Container bootstrap dùng network namespace của MySQL để giữ nguyên ràng buộc này; không nới seed guard hoặc tự cấp quyền ngoài seed demo vốn có.
6. Kiểm tra từ archive nguồn sạch: build images, init DB, migrate/status/drift, seed, đăng nhập qua proxy, API RBAC/tenant isolation/logout, compile/lint/tests, dependency/legal/Trivy scans. Log không chứa mật khẩu/token.
7. Merge PR sau khi các gate đạt; tạo annotated tag v0.1.0 trên commit main đã kiểm chứng. GitHub Release có SHA nguồn, source archive/checksum, hướng dẫn và giới hạn. Không di chuyển tag đã phát hành.

Rollback code bằng tag trước; rollback database bằng backup tương ứng, không tự chạy migrate reset hoặc down -v trên dữ liệu thật. Hạ tầng demo này không truy cập host dx_os và không thay cấu hình ứng dụng đang chạy.
