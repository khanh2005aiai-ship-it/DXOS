# Kế hoạch nghiệm thu AdGuard

Trạng thái: **PLANNED / NOT EXECUTED** cho tất cả case dưới đây. Đây là test plan cho bước triển khai tương lai, không phải báo cáo đã kiểm thử. Phần AdGuard trong PR là tài liệu; PR đồng thời vá dependency follow-redirects của frontend khi quét lại phát hiện cảnh báo. Kết quả CI của PR/tag phải đọc riêng và không thay thế test AdGuard.

## Gate 1: artifact và lab DNS

| ID | Bài thử | Kỳ vọng |
| --- | --- | --- |
| ADG-01 | Artifact đúng OS/arch/tag; kiểm checksum/signature và image digest | Nguồn khớp, sai checksum thì dừng trước chạy; không tự sửa checksum |
| ADG-02 | Scan đúng binary/image, OS + dependency ngôn ngữ; tạo SBOM | HIGH/CRITICAL được xử lý, bằng chứng gắn digest/time; không dùng kết quả runtime khác |
| ADG-03 | Đọc listen socket lab | DNS chỉ 127.0.0.1:15353 UDP/TCP; admin chỉ 127.0.0.1:13000; không mở DHCP/pprof |
| ADG-04 | Hỏi allowed.dxos.test qua DNS chỉ định, upstream giả | Trả TEST-NET IP đã cấu hình, cả UDP và TCP |
| ADG-05 | Hỏi denied.dxos.test sau thêm rule test | Kết quả chặn đúng mode; ghi nguyên nhân đúng instance, không gọi là block mọi traffic |
| ADG-06 | Allowlist xung đột blocklist và domain dùng chung | Kết quả theo precedence thực; business allowlist được giữ, có test chống false positive |
| ADG-07 | Cache đã có, TTL hết hạn, phiên kết nối đang mở | Ghi rõ độ trễ áp rule; không báo thành công chỉ từ một truy vấn cache |
| ADG-08 | Lịch thử với timezone Asia/Ho_Chi_Minh ở biên giờ mở/đóng | Xác nhận lịch chung/riêng; nhóm chặn ngoài dự kiến không bị mở theo |
| ADG-09 | Upstream chậm/dừng, candidate restart | Timeout hữu hạn, health/degraded rõ ràng; không tự fail-open qua DNS public |

## Gate 2: adapter tenant chỉ đọc (khi được triển khai)

| ID | Bài thử | Kỳ vọng |
| --- | --- | --- |
| ADG-10 | Không JWT; JWT hết hạn hoặc session revoked | 401 trước khi gọi AdGuard |
| ADG-11 | Account/org/membership inactive; thiếu quyền đọc network đã được phê duyệt | 403; không suy quyền từ role name hoặc client permission list |
| ADG-12 | Hai tổ chức có hai instance và dữ liệu canary khác nhau | A chỉ nhận aggregate của A; foreign org/instance không gây lộ tồn tại hoặc dữ liệu |
| ADG-13 | Tamper organizationId, instance ID, endpoint URL, credential | Registry server quyết định nguồn; request bị từ chối trước outbound call |
| ADG-14 | URL redirect/rebinding/IPv6/metadata/service nội bộ ngoài allowlist | Không SSRF, không gửi Authorization sang đích mới |
| ADG-15 | Đổi org, logout, revoke permission, thay binding khi có cache/in-flight request | Không trả lại dữ liệu scope cũ; cache key và invalidation đúng |
| ADG-16 | Response/bundle/log/error/audit chứa sentinel secret, cookie, IP/MAC hoặc raw query | DTO allowlist không làm lộ dữ liệu; error không chứa upstream body/URL có credential |
| ADG-17 | Admin upstream từ chối, network down hoặc response schema sai | Trạng thái unavailable có phân biệt; không giả zero-count hoặc trả raw error |

## Gate 3: định danh, vận hành và bàn giao

| ID | Bài thử | Kỳ vọng |
| --- | --- | --- |
| ADG-18 | Modem/proxy/NAT gom nhiều thiết bị | Ghi aggregate/unknown, không gán thành một nhân viên |
| ADG-19 | DHCP đổi IP, MAC ngẫu nhiên, thiết bị dùng chung, binding hết hạn | Không nối sai người; binding có thời gian và cùng tenant |
| ADG-20 | DoH/DoT/DoQ, DNS ngoài, IPv6, direct IP, VPN và mạng di động | Ghi khả năng bypass thực tế và lớp enforcement tương ứng; không hứa DNS chặn tất cả |
| ADG-21 | Kiểm tra retention, export, xóa theo policy | Dữ liệu tối thiểu, export có quyền, xóa đúng hạn; artifact công khai chỉ synthetic/aggregate an toàn |
| ADG-22 | Backup/restore instance mới và rollback qua config schema upgrade | Khôi phục đúng version/policy/secret; không ảnh hưởng nguồn đang chạy |
| ADG-23 | DNS chính dừng và DNS dự phòng hoạt động | Failure policy đúng phê duyệt; nếu yêu cầu giữ lọc thì không chuyển im lặng sang resolver không lọc |
| ADG-24 | Quy trình sửa policy và bàn giao | Có diff/owner/approval/rollback/audit riêng; mặc định adapter chỉ đọc không có quyền sửa |

## Mẫu ghi bằng chứng

Mỗi case ghi: ID, revision DX-OS, candidate AdGuard version/commit/digest, thời gian UTC, OS/topology lab, fixture synthetic, expected/actual, PASS/FAIL/BLOCKED/NOT_EXECUTED, người thực hiện và reviewer nếu có. Không ghi password, token, header, raw dữ liệu truy cập thật hoặc nội dung PDF nội bộ. Screenshot chỉ dùng fixture và đã rà thông tin nhạy cảm.

Điều kiện nghiệm thu: không còn case bắt buộc bị FAIL/NOT_EXECUTED, có review security và owner vận hành, baseline backend/frontend tests/build/lint/Prisma vẫn đạt khi adapter được đưa vào. Nhánh hạ tầng bằng tài liệu có thể merge sau review/CI, nhưng điều đó **không đóng gate triển khai AdGuard**.
