# Đặt công ty bằng Google Maps — 22/10/2026

Thay ô nhập vĩ độ/kinh độ bằng **Địa chỉ công ty** và **Link địa điểm Google Maps**.

1. Vào Chấm công → Thiết lập vị trí công ty (cần quyền `attendance:manage`).
2. Nhập địa chỉ cụ thể. Bấm **Tìm địa chỉ trên Google Maps** để mở tìm kiếm trong tab mới.
3. Chọn đúng địa điểm hoặc thả một ghim tại công ty. Sao chép URL đầy đủ từ thanh địa chỉ và dán vào DX-OS.
4. Khi hiện **Đã nhận ghim địa điểm**, mở **Xem ghim đã chọn trên Google Maps** để kiểm tra rồi lưu.

Không cần tự đọc hoặc nhập tọa độ. Nếu sửa địa chỉ, link đã chọn được xóa để tránh giữ nhầm ghim của địa chỉ cũ. Bán kính cố định 100 m và toàn bộ kiểm tra GPS/RBAC ở backend giữ nguyên. API, schema, database, credential và ACL không đổi trong đợt chỉnh giao diện này.

Nhận link chứa ghim `!3d…!4d…` hoặc query tọa độ cụ thể. Không lấy `@…` làm vị trí công ty vì đó có thể chỉ là tâm màn hình đang xem. Từ chối link đường đi, nhiều ghim, host giả, link thiếu vị trí và tọa độ ngoài phạm vi. Không fetch link tùy ý, không thêm iframe/tracker, không dùng dịch vụ geocoding để đoán địa điểm. Chỉ khi người dùng bấm liên kết mới mở Google Maps với địa chỉ/ghim đã chọn; không tự gửi GPS của nhân viên sang Google Maps.

**Giới hạn rõ ràng:** không có autocomplete/geocoding nhúng. Link `maps.app.goo.gl` hoặc `goo.gl/maps` cần mở trước rồi sao chép link đầy đủ của địa điểm. Không tự resolve link rút gọn bằng backend. Các định dạng URL ghim nội bộ của Google có thể thay đổi; khi không xác định được ghim, không cho lưu nhầm vị trí.

Liên kết tìm kiếm và xem ghim dùng [Google Maps URLs chính thức](https://developers.google.com/maps/documentation/urls/get-started) với `api=1&query=…`. Không thêm dependency hoặc API key.
