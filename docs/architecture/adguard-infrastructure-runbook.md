# Runbook hạ tầng AdGuard: thiết kế và PoC

Trạng thái: **tài liệu chưa thực thi trên mạng thật**. Đọc [quyết định kiến trúc](adguard-integration-assessment.md) trước. Các địa chỉ và domain dưới đây chỉ dùng cho lab; không phải cấu hình hiện hành của DX-OS hoặc đơn vị cung cấp tài liệu.

## 1. Topology và cổng

| Môi trường | DNS | Quản trị | Trạng thái |
| --- | --- | --- | --- |
| Lab trên một máy | 127.0.0.1:15353 TCP/UDP | 127.0.0.1:13000 TCP | Đề xuất; dùng high ports, không đổi DNS hệ thống |
| Mạng tổ chức | Interface LAN chuyên dụng:53 TCP/UDP | Management network qua HTTPS/VPN | Cần phê duyệt vận hành và kiểm thử firewall |
| DX-OS hiện tại | Giữ resolver hiện có | Không có AdGuard endpoint/UI | Không bị phụ thuộc vào lab |

Không publish DNS/quản trị trên 0.0.0.0 hoặc Internet. Không mở DHCP server của AdGuard trong lab; giữ DHCP hiện hữu. Không mở DoH/DoT/DoQ/pprof chỉ vì ví dụ Docker upstream liệt kê các cổng đó. Container port và host mapping phải ghi riêng trong PR triển khai, đặc biệt nếu dùng bridge NAT.

Mỗi tổ chức có config, work volume và credential riêng. Không mount socket Docker, database DX-OS hay thư mục chứa secret của tổ chức khác vào AdGuard. Chỉ adapter phía server được truy cập management network. Backend hiện tại chưa nối vào mạng này.

## 2. Chuẩn bị PoC

1. Chốt OS/architecture, tag và commit upstream. Tải artifact từ release chính thức, đối chiếu checksum và chữ ký theo hướng dẫn upstream. Lưu phiên bản công cụ, digest và kết quả; không gọi checksum là chữ ký số.
2. Quét đúng artifact/image sẽ chạy, cả OS lẫn dependency ngôn ngữ; HIGH/CRITICAL phải xử lý trước khi gọi là bản được chấp nhận. Lưu CycloneDX SBOM và báo cáo gắn digest. Scan runtime hiện tại của DX-OS không bao gồm AdGuard.
3. Chọn thư mục lab riêng dưới ignored `.secrets/` hoặc vùng riêng của operator. Config có password hash, danh bạ hay query log không được đưa vào Git/CI artifact. Sinh mật khẩu quản trị ngẫu nhiên riêng; không dùng credential demo DX-OS hoặc token OpenBao root.
4. Khởi động bằng tài khoản thường/UID phù hợp trên high ports. Hạn chế quyền ghi vào config/work volume. Trong thiết kế container: non-root, no-new-privileges, cap_drop ALL, read-only rootfs nếu phiên bản đã kiểm thử hỗ trợ; không tự cấp privileged để xử lý lỗi.
5. Cấu hình chỉ loopback và tài khoản quản trị. Chỉ đọc trang quản trị qua loopback trong lab; dùng TLS/VPN cho management qua mạng. Không truyền Basic Auth qua mạng LAN dạng HTTP.

Tài liệu upstream về [secure setup](https://adguard-dns.io/kb/adguard-home/running-securely/) và [Docker](https://adguard-dns.io/kb/adguard-home/docker/) là căn cứ triển khai, nhưng ví dụ public port phải được thu hẹp theo topology ở trên. Bản này không thực thi lệnh cài service hay thay quyền/ACL hệ điều hành.

## 3. Bài thử DNS không dùng mạng thật

Dùng một DNS upstream giả trong lab, trả 192.0.2.10 cho `allowed.dxos.test`. Tạo rule chặn `||denied.dxos.test^`; cấu hình blocking mode rõ ràng. Cả hai domain thuộc namespace test, không phải tên miền mã độc. Không tải bộ rule nội bộ hay dùng danh sách nhân viên thật.

Sau khi lab được triển khai và cấu hình, có thể truy vấn **đích DNS được chỉ định**, không đổi resolver hệ thống, bằng Node có sẵn:

```javascript
const { Resolver } = require('node:dns/promises');
const resolver = new Resolver({ timeout: 2000, tries: 1 });
resolver.setServers(['127.0.0.1:15353']);
// Chạy trong lab đã cấu hình; ví dụ này chưa phải kết quả thực thi.
resolver.resolve4('allowed.dxos.test').then(console.log);
resolver.resolve4('denied.dxos.test').then(console.log);
```

Kỳ vọng: domain allowed trả TEST-NET IP từ upstream giả; denied trả null IP hoặc trạng thái chặn theo cấu hình đã chốt. Chạy cả UDP và TCP bằng công cụ DNS phù hợp. DNS response không chứng minh trang web đã bị chặn trên mọi giao thức, cache hoặc đường truyền.

Đọc `/control/status` bằng operator credential và kiểm tra query xuất hiện đúng instance. Chỉ sau kiểm thử mới dùng aggregate `/control/stats`; không đưa credential hoặc raw response vào tài liệu công khai. Không dùng curl với password trong command line hoặc shell history. Không tự bật collector query log trong production.

## 4. Chính sách mạng thật cần review riêng

- Cho thiết bị hỏi trực tiếp DNS đúng tổ chức để tránh mất nguồn qua proxy/NAT; Wi-Fi AP thay NAT cần người quản trị mạng phê duyệt.
- Egress policy bao gồm IPv4/IPv6, DNS TCP/UDP 53, DoT và DoQ. DNS-over-HTTPS dùng chung HTTPS nên rule DNS đơn lẻ không bảo đảm ngăn bypass.
- Managed browser/endpoint và firewall egress là các lớp bổ sung; AdGuard không phải firewall L7 hoặc công cụ quét nội dung gói tin. Không tắt IPv6 hoặc đổi router thực trong lượt tài liệu này.
- Định nghĩa failure policy: fail-closed hay chấp nhận mất lọc tạm thời phải được chủ mạng phê duyệt. Public resolver dự phòng có thể bỏ qua lọc; không tự thêm nó làm fallback im lặng. HA cần resolver thứ hai có policy đồng bộ và bài thử failover.
- Theo dõi health, độ trễ, lỗi upstream, độ mới filter và disk; đo QPS trước khi chọn rate limit. Không sao chép việc tắt rate limit từ một mạng đang có NAT sang mọi mạng khác.

## 5. Dữ liệu, backup và phục hồi

Thiết kế khởi đầu với báo cáo aggregate; chỉ bật raw query log khi có mục đích, quyền truy cập và hạn lưu được chấp thuận. Domain/IP/MAC/client ID có thể nhạy cảm. Không nhúng báo cáo vào trang public hoặc gửi Telegram/email trong lượt này. Không dùng dữ liệu DNS để chấm hiệu suất nhân sự.

Trước thay đổi, dừng collector (nếu có), ghi version/digest và sao lưu config/work data nhất quán vào vùng private. Backup có hash và quyền truy cập riêng; không chứa trong release. Kiểm tra cấu hình bằng `AdGuardHome --check-config` của đúng phiên bản, rồi khởi động lại trong lab trước. Chỉ ghi PASS khi đã chạy thành công.

Diễn tập restore trong instance riêng: khôi phục đúng phiên bản/config, kiểm tra đăng nhập và rule mẫu, đảm bảo log/secret tổ chức A không đọc được từ B. Sau nâng schema config, rollback code cần backup tương ứng, không mặc định binary cũ đọc được config mới. Không dùng down -v hoặc xóa volume để chữa lỗi khi dữ liệu cần giữ.

## 6. Tiêu chí bàn giao vận hành

Phải có owner/on-call, cấu hình đã redact, secret custody/rotation, hạn lưu, license/source provenance, SBOM/scan, kết quả [test plan](adguard-validation-plan.md), restore/failover và phê duyệt egress. Thiếu một gate thì trạng thái vẫn là **NOT READY**, không quảng bá là production-ready.
