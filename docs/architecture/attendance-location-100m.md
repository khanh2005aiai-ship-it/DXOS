# Chấm công trong bán kính 100 m

## Kế hoạch và thay đổi hợp đồng trước triển khai

Yêu cầu: chỉ cho check-in/check-out gần công ty, đồng hồ đẹp hơn. Bán kính cố định 100 m theo lựa chọn của người dùng; chưa có tọa độ công ty thực nên không tự đặt vị trí mẫu.

1. Thêm cấu hình vị trí công ty theo organization (nhãn, vĩ độ, kinh độ); một migration mới, không sửa lịch sử. Không lưu GPS của nhân viên vào bảng chấm công, audit hay log.
2. GET `/organizations/{organizationId}/attendance/location`: `attendance:read`; PUT cùng đường dẫn: `attendance:manage`. Dùng guard JWT/membership ACTIVE/RBAC hiện có, không tự cấp quyền.
3. Check-in/check-out yêu cầu `location: { latitude, longitude, accuracyMeters, capturedAt }` ngoài `note`. Đây là siết hợp đồng có chủ đích: client cũ không gửi vị trí nhận 400; frontend đi cùng bản backend này. Không có fallback bỏ kiểm tra.
4. Backend kiểm tọa độ hợp lệ, mẫu không quá 60 giây hoặc tương lai quá 5 giây, sai số tối đa 50 m. Khoảng cách Haversine + sai số phải <=100 m. Chưa cấu hình nhận 409; ngoài vùng/không chắc chắn nhận 403; mẫu lỗi/cũ nhận 400. Giữ nguyên kiểm tra ca làm/nghỉ phép/trùng chấm công và giờ do server quyết định.
5. UI xin GPS khi người dùng bấm cập nhật vị trí hoặc chấm công; mỗi lần chấm lấy mẫu mới. Hiển thị vị trí, khoảng cách, sai số, lỗi từ chối/timeout; không gọi dịch vụ bản đồ hoặc gửi GPS đến bên thứ ba từ ứng dụng. Đổi tổ chức phải bỏ vị trí và kết quả cũ; response chậm của tổ chức trước không được dùng cho tổ chức mới.
6. Đổi đồng hồ sang đồng hồ kim và số rõ ràng, luôn dùng Asia/Ho_Chi_Minh, bố cục gọn có trạng thái ca làm, responsive, hỗ trợ theme và reduced motion.

## Kiểm thử và vận hành

Test server khoảng cách/biên/sai số/mẫu cũ/missing; MySQL HTTP kiểm 401/403, quyền cấu hình, tenant, vị trí xa và check-in/out hợp lệ. Test UI quyền, lỗi GPS và dữ liệu gửi lên. Chạy full backend trên DB disposable, frontend tests, build/lint/Prisma. Kiểm migration status/drift trước và sau migration local. Rollback ứng dụng cần cân nhắc vì bản cũ không enforce vị trí; không tự rollback sang client bỏ kiểm tra. Table mới có thể giữ lại nếu rollback code, không xóa dữ liệu tự động.

## Giới hạn

GPS trình duyệt là dữ liệu do thiết bị cung cấp, có thể bị giả; không phải cơ chế chống gian lận tuyệt đối hoặc chứng minh hiện diện vật lý. Cần thiết bị quản lý/attestation hoặc kiểm tra bổ sung nếu dùng tính lương thực tế. Không tự động thay kết quả chấm công hay phê duyệt nhân sự. Cần HTTPS khi triển khai; localhost phục vụ phát triển. Tham khảo [MDN Geolocation](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/getCurrentPosition).
