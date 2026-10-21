# Security review: ranh giới tích hợp AdGuard

Review thiết kế ngày 21/10/2026. Kết luận: **chưa đủ điều kiện tích hợp runtime/production**; các kiểm soát dưới đây là yêu cầu cho PR triển khai, không phải chức năng đã có.

## Mô hình đe dọa và kiểm soát

| Rủi ro | Hệ quả | Kiểm soát bắt buộc | Bằng chứng cần có |
| --- | --- | --- | --- |
| Instance dùng chung trả thống kê/query log tổng | Tenant A thấy hoạt động tenant B | Instance và credential riêng; binding server-side, fail-closed khi thiếu binding | Fixture hai tổ chức, response và cache không giao thoa |
| Client gửi URL upstream hoặc instance ID khác | SSRF, truy cập metadata hoặc nguồn khác tenant | Endpoint registry do operator quản lý; không nhận URL từ request; allowlist scheme/host/port, không follow redirect ngoài binding | Test redirect, DNS rebinding, IP literal, IPv6 và foreign instance |
| Frontend giữ AdGuard credential | Lộ quyền quản trị mạng | Chỉ adapter server có secret; không iframe/admin proxy/copy Basic Auth xuống browser | Kiểm tra response, bundle, network, error và audit |
| Tin role name hoặc permission list từ client | Vượt quyền | JWT/session và ACTIVE account/org/membership; permission catalog, AuthorizationService và OrganizationPermissionGuard hiện có | 401/403, inactive, forged permissions, role assignment chéo tenant |
| NAT, DHCP, MAC giả/ngẫu nhiên, thiết bị dùng chung | Gán sai người, báo cáo sai | Binding xác minh và có thời gian hiệu lực; unknown/aggregate khi không đủ dữ kiện | Không suy nhân viên từ một IP/MAC đơn lẻ |
| DNS query bị coi là vi phạm hoặc thước đo năng suất | Quyết định nhân sự thiếu căn cứ | Nhãn số truy vấn, không byte/phút; không ghi attendance/performance; người có quyền xác minh tín hiệu | Review schema/UI/câu chữ, không có tự động kỷ luật |
| Endpoint quản trị DNS mở ra Internet | Chiếm quyền, open resolver, amplification | Management private/loopback, TLS qua mạng, ACL đúng nguồn, từ chối ANY/rate limit theo đo tải | Port scan trong lab được phép; xác nhận UDP/TCP/IPv6 |
| Rule/filter bị sửa hoặc tải từ URL tùy ý | Chặn sai, SSRF, supply-chain | PoC chỉ đọc; write flow tương lai có quyền riêng, validate destination, diff/approval/rollback và audit | Egress allowlist, update provenance, test thất bại không đổi policy |
| Secret/raw query trong log, report hoặc CI artifact | Lộ dữ liệu truy cập | Output DTO allowlist; redact Authorization, password/hash, cookies, IP/MAC/raw domain; aggregate mặc định | Sentinel-secret và dữ liệu tenant canary không xuất hiện |
| Timeout/502 hoặc secret lỗi trả dữ liệu cache cũ của tenant khác | Rò rỉ hoặc hiểu sai trạng thái | Cache key bao gồm organization+binding+window; TTL, invalidation; unavailable khác zero-count | Test switch org, revoke permission, binding/credential rotation |
| Upstream/candidate binary hoặc image có lỗ hổng | Chiếm quyền dịch vụ DNS | Chốt version/commit/checksum/signature/digest; scan OS và Go deps; SBOM; không ignore CVE để đạt gate | Scan chính artifact triển khai và ghi timestamp |
| Config rollback không tương thích hoặc mất secret | Mất dịch vụ/lọc | Backup versioned, private; restore vào instance riêng; owner chọn failure policy | Diễn tập restore/failover, không dùng reset/xóa volume làm shortcut |

## Rà lại hạ tầng DX-OS hiện có

Đã đọc `AuthorizationService` và permission catalog trong backend hiện tại: quyền gắn actor, organization, ACTIVE membership và role cùng tenant. Không tìm thấy permission AdGuard/network-security trong catalog tại thời điểm review. Không tận dụng role:read làm quyền đọc DNS, không tự grant quyền mới.

Security stack hiện tại dùng Coraza/APISIX cho HTTP, Keycloak cho identity, OpenBao cho secrets, Valkey cho shared limits và ClamAV cho file. AdGuard quản trị DNS là một trust boundary mới; không mặc định được bảo vệ chỉ vì backend đã có WAF/SSO. Các network edge/app/security/identity/secrets đang tồn tại cần threat review trước khi nối thêm dịch vụ DNS.

## Phạm vi API tương lai

Giai đoạn đầu chỉ nên có health/aggregate counters cần thiết; raw query log, client inventory, thay rule và lịch chặn nằm ngoài PoC chỉ đọc. Read thành công không tự tạo audit event mới nếu kiến trúc hiện hành không yêu cầu. Thay binding, credential, policy, export dữ liệu nhạy cảm cần quyết định audit riêng, không ghi secret/raw query vào audit payload.

Không có endpoint mới trong bản tài liệu này. Trước implementation phải ghi contract và status semantics: anonymous 401, authenticated nhưng thiếu membership/quyền 403, instance chưa cấu hình hoặc upstream không khả dụng có trạng thái rõ ràng, không tiết lộ tồn tại nguồn foreign tenant. Quyết định 404/503 cụ thể phải được review trong PR contract, không đoán response hiện đã tồn tại.

## Bảo mật tài liệu và nguồn

Tài liệu tham chiếu nội bộ không được phân phối lại. Không copy log, inventory người/thiết bị, địa chỉ/URL quản trị hoặc policy kinh doanh thật sang fixture public. Domain thử dùng `.test`, IP tài liệu dùng TEST-NET; không quét hệ thống bên ngoài hay đổi DNS/firewall host trong lượt này.

[Hướng dẫn upstream](https://adguard-dns.io/kb/adguard-home/running-securely/), [API đúng tag](https://github.com/AdguardTeam/AdGuardHome/blob/v0.107.79/openapi/openapi.yaml) và [license GPL v3](https://github.com/AdguardTeam/AdGuardHome/blob/v0.107.79/LICENSE.txt) đã được đối chiếu. Không phân phối binary/source AdGuard trong PR này, không gắn lại giấy phép Apache-2.0 cho AdGuard. Tính phù hợp giấy phép của bản đóng gói tương lai vẫn cần review riêng.

## Trạng thái bằng chứng

- **EXECUTED:** đọc nguồn nội bộ, rà code và topology DX-OS, đối chiếu upstream, viết threat model/runbook/test plan, kiểm tra tài liệu trước commit.
- **VERIFIED BY CODE:** authorization hiện có của DX-OS; không có adapter/network permission AdGuard mới.
- **VERIFIED BY CI (baseline):** [tag v0.1.0](https://github.com/nt6175790-afk/DXOS/actions/runs/39447966497), chỉ phạm vi DX-OS và runtime đã có tại tag đó. Không bao gồm AdGuard.
- **NOT EXECUTED:** DNS live, integration API AdGuard, port/firewall, NAT/client attribution, restore và failover trên mạng thật.
- **BLOCKED FOR PRODUCTION:** chưa chốt deployment owner/topology/secret custody, chưa có bản artifact ứng viên được quét và bộ kiểm thử tenant/DNS live đạt.

Các test chưa chạy không được ghi PASS. Không thay quyền, secret, ACL hoặc policy đang vận hành chỉ để đóng các gate trong báo cáo.
