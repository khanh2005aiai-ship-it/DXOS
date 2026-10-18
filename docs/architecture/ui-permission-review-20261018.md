# Rà soát phân quyền và giao diện — 18/10/2026

## Thay đổi

- Quyền frontend gắn với cặp actor/tổ chức và từng request riêng. Bỏ phản hồi cũ khi chuyển A → B → A, đổi actor, logout hoặc refresh chồng lấn. Phản hồi organizationId không khớp bị từ chối.
- Danh sách tổ chức cũng gắn với actor, bỏ request cũ sau logout/đổi actor; lựa chọn chỉ chấp nhận ID trong danh sách đã tải từ server.
- Menu chia ba nhóm và chỉ hiện phân hệ có quyền phù hợp. Boundary chặn mount trang bị hạn chế khi truy cập trực tiếp URL; loading/error/403 được phân biệt. Quyền đọc vai trò không suy ra quyền gán vai trò.
- Tác vụ nhanh hiển thị theo quyền tương ứng; KPI không có quyền không dẫn sang trang hạn chế. Các khóa document/workflow/automation bổ sung vào kiểu TypeScript là khóa đã tồn tại trong catalog backend, không phải quyền mới.
- Chỉnh sidebar/header, spacing, thẻ KPI, tác vụ nhanh, trạng thái từ chối, focus bàn phím và mobile. Giữ chủ đề theo mùa và chế độ sáng/tối; sửa tương phản khung cảnh báo trong dark mode. Menu mobile đóng bằng Escape, có skip link, không focus vào sidebar đang ẩn.
- Huy hiệu header chỉ báo có thông báo chưa đọc vì API phân trang không trả tổng chính xác. KPI dashboard tiếp tục dùng aggregate chính xác của backend.

## Phạm vi bảo mật

Backend AuthorizationService/OrganizationPermissionGuard đã được rà: authenticated actor, ACTIVE account/membership/organization, role ACTIVE trong cùng tổ chức và permission key cụ thể. Không suy quyền từ tên role; không có administrator bypass. Không thay backend authorization, API, Prisma schema/migration, thông tin đăng nhập, ACL hoặc cấp thêm quyền trong database. Frontend chỉ kiểm soát hiển thị; API vẫn là nơi thực thi phân quyền.

## Kiểm chứng

- Full frontend: 284/284 PASS, gồm 14 ca bổ sung cho actor/request isolation, navigation và tác vụ nhanh. Chạy với tối đa hai worker để phù hợp RAM máy local.
- Backend authentication/RBAC/provisioning: 7 suites, 68/68 PASS trên database MySQL tạm. Migration replay và schema diff không lệch trong lượt này.
- Frontend production build và lint: PASS. Build còn cảnh báo bundle lớn hơn 500 kB; không làm build thất bại.
- Live preview: login/profile qua proxy HTTP 200; dashboard có dữ liệu. Chuyển sang tổ chức thiếu quyền tiền lương: menu ẩn phân hệ, URL /payroll hiện Truy cập bị từ chối. Quay lại tổ chức demo bình thường.
- Desktop 1440px và mobile 390px không tràn ngang; đã kiểm tra hai chế độ sáng/tối và đóng menu mobile bằng Escape. Đã trả viewport về mặc định sau kiểm tra.

## Giới hạn

Lượt full backend local đã dừng do máy thiếu RAM (khoảng 480 MB trống), không ghi nhận là PASS. Thay bằng bộ backend mục tiêu nêu trên; CI remote cần kiểm tra riêng theo commit. Không coi kết quả cũ 1.295 tests là kết quả của lượt này.

Port 3000 trên máy local đang thuộc ứng dụng khác. Preview dùng backend 3001 và frontend 5173 với proxy config riêng trong outputs/ ignored; cấu hình public mặc định không đổi. Không dừng ứng dụng khác, không reset dx_os. SSO/AI provider thật và full security stack không được chạy lại trong phạm vi tinh chỉnh giao diện.
