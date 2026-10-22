# Kết quả chấm công theo vị trí — 22/10/2026

## Đã triển khai local

- Bán kính cố định 100 m cho cả check-in và check-out, backend tự tính Haversine, tính thêm sai số GPS. Sai số tối đa 50 m; mẫu tối đa 60 giây, tối đa 5 giây tương lai; giờ chấm công do server xác định. Dung sai số thực tại ranh giới chỉ 0,000001 m.
- Cấu hình công ty riêng từng organization: GET `/api/v1/organizations/:organizationId/attendance/location` cần `attendance:read`; PUT cần `attendance:manage`. JWT, membership ACTIVE và quyền kiểm lại trong transaction ghi. Không tự cấp quyền hoặc có ngoại lệ admin.
- Mọi lần chấm lấy mẫu GPS mới. UI hiển thị vị trí hiện tại, khoảng cách, sai số và lỗi từ chối/timeout. Đổi tổ chức hủy hiệu lực GPS và response cũ. Không theo dõi nền, không lưu tọa độ nhân viên vào record/audit/log; không nhúng dịch vụ bản đồ ngoài.
- Đồng hồ kim và số dùng múi giờ Asia/Ho_Chi_Minh; có trạng thái ca, bố cục desktop và màn hình hẹp. Giữ nguyên quy tắc phân ca, ngày nghỉ, nghỉ phép, trùng chấm công, tenant/RBAC.
- Migration mới `20261022000100_attendance_location` chỉ thêm bảng `attendance_locations`. Local đã áp dụng đủ 25 migrations; status up to date, drift không khác. MySQL 8.0.44 / Prisma 6.19.3 giữ nguyên.

## Bằng chứng kiểm thử

| Kiểm tra | Kết quả thực tế |
| --- | --- |
| Targeted backend (MySQL HTTP, location policy, attendance domain) | 3 suites, 57/57 PASS |
| Full backend trên DB MySQL disposable | 62 suites, 1.323/1.323 PASS |
| Full frontend, một worker để tiết kiệm bộ nhớ | 35 files, 292/292 PASS |
| Ca UI chấm công + đồng hồ trong bộ full | 18/18 PASS |
| Backend/frontend build | PASS |
| Backend/frontend lint, max-warnings=0 | PASS |
| Prisma generate/validate 6.19.3 | PASS (đã dừng backend để giải phóng DLL rồi generate lại thành công) |
| Migration replay và drift disposable | PASS |
| Migration deploy/status/drift local | PASS |
| API local thật | Login 200, GET location 200, thiếu GPS 400, OpenAPI 200 |
| UI local | Xác nhận đồng hồ, form quản lý, trạng thái chưa cấu hình, nút chấm bị khóa; desktop và màn hình hẹp |

HTTP tests kiểm 401, thiếu quyền 403, foreign/inactive membership 403, cấu hình không nhận radius/organizationId từ body, khoảng cách xa và biên/sai số, timestamp cũ/tương lai, thiếu GPS, check-out kiểm lại vị trí, audit không chứa GPS. Unit tests kiểm tọa độ không hợp lệ và đường đổi ngày quốc tế. UI tests kiểm GPS permission denied/timeout, vị trí xa, chưa cấu hình, manager lưu vị trí và response GPS chậm sau đổi tổ chức.

Full frontend vẫn có cảnh báo `act(...)` và jsdom XHR từ một số test module cũ, nhưng tất cả assertions pass. Build vẫn cảnh báo bundle lớn hơn 500 kB; không thêm dependency hay tăng ngưỡng để giấu cảnh báo.

## Tệp thuộc thay đổi này

- `database/schema.prisma`; `database/migrations/20261022000100_attendance_location/migration.sql`.
- `backend/src/modules/attendance/attendance-location.service.ts`, `attendance.openapi.ts`, `attendance.dto.ts`, `attendance.controller.ts`, `attendance.module.ts`, `dichVuChamCong.ts`.
- `backend/src/modules/audit/audit-catalog.ts`; `backend/src/modules/api-documentation/api-documentation.controller.ts`.
- `frontend/src/api/attendance.ts`; `frontend/src/features/attendance/QuanLyChamCong.tsx`, `AttendanceClock.tsx`, `useAttendanceLocation.tsx`.
- `tests/backend/attendance-location.spec.ts`, `attendance.mysql-spec.ts`; `frontend/src/__tests__/attendance.test.tsx`, `attendance-clock.test.tsx`.
- `contracts/api/business-v1.md`; `docs/architecture/attendance-location-100m.md`; báo cáo này.

Checkout gốc có nhiều thay đổi từ các tác vụ trước. Chỉ chỉnh các phần liên quan nêu trên; không reset, commit hoặc push toàn bộ working tree. Baseline của các tệp đã có được sao lưu riêng trong workspace tác vụ.

## Cần cấu hình trước sử dụng thực tế

Người dùng đã chọn **100 m**, chưa cung cấp tọa độ công ty. Vì vậy office local vẫn null: không tự nhập vị trí thử nghiệm. Vào **Chấm công → Thiết lập vị trí công ty**, nhập nhãn/vĩ độ/kinh độ thật rồi lưu bằng tài khoản có `attendance:manage`. Nhân viên cần hồ sơ ACTIVE, phân ca hợp lệ và cho phép định vị khi bấm chấm công. Máy tính có định vị kém có thể bị từ chối; thử thiết bị GPS chính xác hơn. Chưa thực hiện ca GPS vật lý tại văn phòng thực.

GPS trình duyệt có thể giả mạo; đây không phải attestation hoặc bảo đảm chống chấm công hộ tuyệt đối. Trình duyệt cần secure context và quyền người dùng; xem [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/getCurrentPosition). Ngoài localhost cần HTTPS. Chính sách yêu cầu location là thay đổi input có chủ đích, cần triển khai backend/frontend cùng nhau; client cũ nhận 400, không bypass.

Không đổi credentials/ACL; không commit secrets. Khi ổ C báo ENOSPC, chỉ chuyển artifact CI AdGuard đã tải/giải nén sang `A:\DXOS-Temporary-Artifacts-20261022`, giữ lại báo cáo và giữ nguyên mã nguồn/database. Không xóa dữ liệu dự án.
