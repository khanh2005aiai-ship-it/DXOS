# Bảo mật

DX-OS hiện được kiểm chứng cho môi trường local/demo, chưa có cam kết vận hành production hay chính sách SLA.

Không đăng password, JWT, API key, database URL có credential, dữ liệu nhân sự hay ảnh chứa thông tin riêng vào issue/PR công khai. Báo lỗi nhạy cảm trực tiếp cho chủ dự án qua kênh riêng đã được hai bên xác nhận; repository hiện chưa có địa chỉ tiếp nhận công khai. Nếu Git host hỗ trợ private vulnerability reporting, chủ repository cần bật chức năng đó trước khi công bố.

Khi phát hiện secret đã lộ: dừng phát hành, thu hồi/rotate secret liên quan; xóa khỏi file hiện tại không xóa khỏi Git history. Không tự viết lại lịch sử branch dùng chung. Phối hợp với chủ repository để chọn history cleanup hoặc snapshot source mới.

Giữ membership ACTIVE, permission tường minh và tenant isolation. Không cấp quyền từ tên role/claim IdP. OpenBao root token/seal shares và CA private key không nằm trong source. Signature ClamAV và advisory dependencies phải được cập nhật liên tục.
