# Kết quả kiểm chứng local — 15/10/2026

Kết quả dưới đây là snapshot kiểm thử local, không phải chứng nhận production hoặc cam kết không có lỗi trong tương lai.

| Hạng mục | Kết quả đã ghi nhận |
| --- | --- |
| Backend disposable MySQL suite | 1.295 tests PASS |
| Frontend suite | 270 tests PASS |
| Build / lint | Backend và frontend PASS, zero warnings |
| npm production audit | Không có vulnerability tại thời điểm kiểm tra |
| Trivy runtime | 9 service, zero HIGH/CRITICAL; CycloneDX SBOM riêng |
| Trivy filesystem | Zero HIGH/CRITICAL và misconfiguration được báo |
| WAF/APISIX/SSO/logout live | 23 checks PASS |
| Keycloak live | 10 checks PASS |
| OIDC protocol fixture | 8 checks PASS, tách biệt kiểm tra live |
| ClamAV / OpenBao | Clean/EICAR, KV isolation và agent auto-renew đã kiểm tra live |
| Shared rate-limit store | Hai adapter dùng chung counter Valkey, atomic increment PASS |
| Database | MySQL 8.0.44, Prisma 6.19.3; 24 migration, không lệch schema |
| Legal evidence | 936/936 installed entries; 12 publisher declarations được ghi rõ, 110 optional entries cần rà đúng nền tảng |

Evidence máy local nằm trong thư mục ignored `security-artifacts/`, không kèm secret hoặc backup trong repository. Lệnh tái kiểm tra được mô tả tại [hướng dẫn vận hành](security-devsecops-setup.md).

CI GitHub là kết quả riêng theo từng commit. Xem [Actions](https://github.com/nt6175790-afk/DXOS/actions); không suy diễn PASS trên remote từ kết quả local.

## Giới hạn triển khai

Chưa triển khai domain/máy chủ production. Keycloak start-dev/H2, OpenBao Raft một node và seal custody cùng máy chỉ dành local/demo. ClamAV không có libunrar, không bảo đảm quét RAR. Binary distribution cần source/notices đúng phiên bản và nền tảng. Xem [third-party notices](../../THIRD_PARTY_NOTICES.md).

## Kiểm tra cài đặt từ bản clone sạch

Đã cài root/frontend bằng npm ci từ lockfile; Prisma generate/validate, build và lint cả hai phần đạt. Backend 1.295 tests, frontend 270 tests đạt; 6 kiểm tra hồi quy bộ lọc source và lượt export thực tế giữ đủ 15 file module work. Backend image đã build trong Linux Docker.

Trên database MySQL tạm có tên riêng: replay đủ 24 migration, không drift, chạy seed:demo-admin/seed:demo, khởi động frontend/backend ở port tạm, đăng nhập qua proxy HTTP 200, đọc profile/tổ chức/phòng ban/nhân sự/công việc/tài liệu/thông báo/vai trò HTTP 200. Foreign organization bị từ chối 403; logout 204 và session cũ 401. Database tạm được dọn sau kiểm thử; không reset dx_os. AI trong lượt này dùng mock, không xác nhận provider thật.

Bộ lọc export chỉ loại /work ở root; không loại backend/src/modules/work. Git giữ nguyên byte của licenses/ để checksum không bị đổi theo kiểu xuống dòng của hệ điều hành. File Vite .js/.d.ts sinh tự động không được đưa vào source; vite.config.ts là cấu hình gốc.
