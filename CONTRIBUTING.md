# Đóng góp

1. Đọc README.md, SECURITY.md và API contracts trước khi sửa. Thống nhất phạm vi thay đổi với người phụ trách dự án.
2. Tạo branch riêng cho thay đổi; giữ NestJS modular monolith và API tương thích.
3. Mọi truy cập nghiệp vụ phải kiểm tra membership, permission và organization ở server. Không dùng tên role hoặc client permission list làm bypass.
4. Không commit secret, dữ liệu khách hàng, database dump hay file sinh tự động. Dùng `.env.example` để mô tả cấu hình.
5. Chạy lint/build và test phù hợp. Thay đổi schema cần migration mới; không sửa migration lịch sử đã áp dụng.
6. Mở PR mô tả vấn đề, thay đổi và bằng chứng kiểm thử. Không tạo lịch sử đóng góp giả.

Trước khi công bố source: chạy `node backend/scripts/verify-git-publication.js`. Công cụ đọc source và các ref Git có thể truy cập, chỉ in tên file/loại phát hiện; không in giá trị secret. Kiểm tra này không thay thế rà ảnh/dữ liệu cá nhân hoặc unknown secrets.

Đóng góp phải là nội dung bạn có quyền cung cấp và giữ notices bên thứ ba. LICENSE dự án không chuyển quyền sở hữu thư viện/tài nguyên bên ngoài.
