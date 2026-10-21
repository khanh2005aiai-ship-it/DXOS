# Kiểm chứng bảo mật artifact AdGuard Home

Ngày 21/10/2026. Phần việc bảo mật được thực hiện theo ủy quyền của chủ dự án và bàn giao qua fork/PR của thành viên. **Chưa có reviewer độc lập**; không coi tài khoản tạo commit là bằng chứng thành viên đã tự chạy hoặc review các bài thử.

**Kết luận: NO-GO cho artifact v0.107.79 Linux amd64.** Xác minh nguồn và chữ ký đạt, nhưng quét dependency có 6 phát hiện HIGH (5 CVE phân biệt), 0 CRITICAL, 15 MEDIUM, 1 LOW và 1 UNKNOWN. Không suppress/ignore các phát hiện để đạt gate. Đây là kiểm chứng một binary công khai, không phải triển khai AdGuard hay kiểm thử tenant API.

## Artifact và bằng chứng đã chạy

| Thuộc tính | Giá trị |
| --- | --- |
| DX-OS base | `ab75bb33b5e850bfd869cc3b13b5071327fa13f7` |
| Release | [AdGuard Home v0.107.79](https://github.com/AdguardTeam/AdGuardHome/releases/tag/v0.107.79) |
| Upstream commit | `05ba17b282da1c4393d6a4ba4db0cf519194a362` |
| Artifact | `AdGuardHome_linux_amd64.tar.gz` — Linux amd64, không phải image/container hoặc Windows build |
| Archive SHA-256 | `c48f4a43000665484c5ec28177de11a004759b620dae8f77b2aabefc9ef3687f` |
| Binary SHA-256 | `7e247573e63ce771a5925d16ca4ca9344e6e888673244289dc302f0fdfdfbf4e` |
| GPG fingerprint | `28645AC9776EC4C00BCE2AFC0FE641E7235E2EC6` |
| Scanner | Trivy 0.76.0, Windows amd64; scanner ZIP đối chiếu official release digest và checksums |
| Scanner ZIP SHA-256 | `7b4762a5a5326cb4b83dfd2bb5d9aaf15a1ed867c75cad7dd8b38840a28e7be6` |
| CVE DB cập nhật | `2026-10-21T01:19:53.032404989Z`, schema 2 |
| Inventory | 50 Go packages; CycloneDX gồm 51 components |

SHA-256 archive được đối chiếu với digest GitHub release API và `checksums.txt` cùng release. Chữ ký detached của binary được GPG kiểm tra thành công và so đúng fingerprint trong [hướng dẫn upstream](https://adguard-dns.io/kb/adguard-home/running-securely/). Cảnh báo GPG chưa chứng thực danh tính qua web-of-trust không được gọi là chứng nhận của DX-OS; key được đối chiếu fingerprint từ nguồn upstream qua HTTPS.

Các kết quả máy đọc được: [review đã bỏ đường dẫn cá nhân](adguard-v0.107.79-review.json), [CycloneDX SBOM](adguard-v0.107.79-linux-amd64.cdx.json). Chỉ đổi `metadata.component.name` của SBOM để bỏ đường dẫn máy thực hiện; không đổi package/version. SHA-256 trước/sau chuẩn hóa được ghi trong review. Không commit binary, keyring, CVE database, log cá nhân hoặc tài liệu nội bộ.

## HIGH cần xử lý trước triển khai

| Advisory | Package hiện tại | Bản sửa theo scanner | Quyết định |
| --- | --- | --- | --- |
| [CVE-2026-56854 / GO-2026-6303](https://pkg.go.dev/vuln/GO-2026-6303) | `golang.org/x/crypto v0.54.0` | `0.55.0` | Chặn artifact; inventory còn MEDIUM cần bản mới hơn |
| [CVE-2026-78669 / GO-2026-6611](https://pkg.go.dev/vuln/GO-2026-6611) | `golang.org/x/net v0.57.0` và `stdlib v1.26.6` | `x/net 0.60.0`; Go `1.26.9` hoặc `1.27.2` | Hai package findings, một CVE |
| [CVE-2026-56851 / GO-2026-6629](https://pkg.go.dev/vuln/GO-2026-6629) | `golang.org/x/text v0.40.0` | `0.41.0` | Chặn artifact |
| [CVE-2026-78667 / GO-2026-6609](https://pkg.go.dev/vuln/GO-2026-6609) | `stdlib v1.26.6` | Go `1.26.9` hoặc `1.27.2` | Chặn artifact |
| [CVE-2026-97031 / GO-2026-6607](https://pkg.go.dev/vuln/GO-2026-6607) | `stdlib v1.26.6` | Go `1.26.9` hoặc `1.27.2` | Chặn artifact |

Đây là phát hiện theo package/version, **chưa chứng minh đường khai thác thực tế của AdGuard**. Trivy không thay thế phân tích reachability; xem [giới hạn Go binary scanner](https://trivy.dev/docs/v0.76/guide/coverage/language/golang/). Chưa có căn cứ để bỏ qua CVE nào. Không thay Go/dependency trong source DX-OS để giả sửa binary upstream: cần release AdGuard được sửa hoặc bản rebuild có provenance/license riêng, rồi xác minh và quét lại. Không tự chọn beta/edge hoặc thay kiến trúc trong PR này.

## Cách kiểm tra lại

1. Tải archive và checksums đúng release chính thức nêu trên; dừng nếu hash khác. Giải nén vào thư mục riêng. Lấy public key theo fingerprint upstream và import vào **keyring riêng**, không dùng keyring cá nhân.
2. Cài Trivy 0.76.0 từ [release chính thức](https://github.com/aquasecurity/trivy/releases/tag/v0.76.0), đối chiếu checksum/digest đúng OS. Bản Windows scanner đã kiểm ở bảng trên; nếu dùng Linux phải kiểm digest của artifact Linux riêng. Không dùng checksum Windows cho Linux.
3. Chạy script từ source DX-OS. Ví dụ PowerShell dưới dùng các đường dẫn lab do người chạy đặt, không chứa credential:

```powershell
node backend/scripts/check-adguard-artifact.js `
  --archive "$lab/AdGuardHome_linux_amd64.tar.gz" `
  --binary "$lab/AdGuardHome/AdGuardHome" `
  --signature "$lab/AdGuardHome/AdGuardHome.sig" `
  --gpg-home "$lab/gpg" --gpg "$gpgExecutable" `
  --trivy "$trivyExecutable" --cache "$lab/trivy-cache" `
  --output security-artifacts/adguard-verification
```

Các biến `$lab`, `$gpgExecutable`, `$trivyExecutable` là đường dẫn operator tự đặt. Binary, signature và keyring phải cùng volume khi dùng GPG đi kèm Git trên Windows. Script không tự tải/chạy AdGuard, cài service hoặc sửa DNS/firewall/ACL. Chỉ kiểm artifact được ghim trong source; đổi candidate phải qua review.

Exit code: `0` = gate dependency scan đạt với inventory/SBOM hợp lệ; `1` = có HIGH/CRITICAL; `2` = kiểm chứng thiếu/lỗi (BLOCKED). Với candidate hiện tại, **exit 1 là kết quả đúng**. PASS của script cũng không phê duyệt production.

Trong lượt kiểm tra, `trivy fs` và lần `rootfs` đầu trên Windows không nhận diện binary extensionless, trả inventory rỗng. Kết quả đó **không được tính là scan sạch**. Đã đối chiếu [analyzer executable filter đúng v0.76.0](https://github.com/aquasecurity/trivy/blob/v0.76.0/pkg/fanal/analyzer/language/golang/binary/binary.go): bản sao byte-identical có đuôi `.exe` cho Windows nhận diện, sau đó `rootfs` nhận 50 package. File vẫn là Linux ELF, không được chạy. Script kiểm SHA-256 trước/sau copy và từ chối inventory/SBOM rỗng, signature sai hoặc CVE DB quá 72 giờ.

## Kiểm soát đã rà và phần chưa thực hiện

| Nội dung | Kết quả |
| --- | --- |
| ADG-01 nguồn/tag/commit/hash/signature của binary Linux | VERIFIED BY TOOL / PASS cho binary đã nêu; chưa xác minh image digest/container |
| ADG-02 quét dependency và tạo SBOM | EXECUTED / FAIL gate HIGH; có bằng chứng và hướng xử lý |
| Tenant, JWT/RBAC, SSRF, cache, credential boundary | VERIFIED BY DESIGN; ADG-10..17 NOT EXECUTED vì adapter chưa có |
| Port binding, DNS allow/block, lịch/cache/upstream | ADG-03..09 NOT EXECUTED; chưa có lab runtime |
| NAT/identity, bypass, retention, backup/restore, failover | ADG-18..24 NOT EXECUTED thực nghiệm; yêu cầu giữ trong runbook |
| Giấy phép artifact | GPL v3 theo LICENSE trong archive; khớp LICENSE upstream; không phân phối binary hoặc relicensing sang Apache-2.0 |
| Giấy phép transitive Go deps | SBOM có inventory; chưa có bộ LICENSE/source/notices đầy đủ cho việc phân phối AdGuard; không claim legal clearance |
| Rà dữ liệu công khai | Chỉ package/version/advisory và evidence đã bỏ đường dẫn cá nhân; không dùng dữ liệu DNS thật |
| Reviewer độc lập | PENDING; không ghi nhận review bằng tên người chưa review |

Adapter tương lai phải dùng actor/JWT và ACTIVE membership/organization hiện có, permission tường minh đã được catalog/contracts phê duyệt; instance và secret riêng từng tổ chức. Không dùng role name/client permission list làm bypass, không cấp quyền ngầm. Không xuất admin credentials, raw query log, IP/MAC hoặc upstream error vào frontend/audit.

Về vận hành: management private/loopback, không thêm public resolver fail-open, backup/restore/version rollback có owner. NAT/DHCP/MAC ngẫu nhiên không xác định chắc một người; DNS query count không phải byte, thời gian làm việc hoặc hiệu suất. Không tự tạo attendance/performance hay quyết định nhân sự từ dữ liệu DNS.

Xem [security review thiết kế](../architecture/adguard-security-review.md), [24 case nghiệm thu](../architecture/adguard-validation-plan.md) và [runbook](../architecture/adguard-infrastructure-runbook.md). Bản ghi này bổ sung bằng chứng artifact cho kế hoạch cũ, không đánh dấu toàn bộ 24 case là PASS.

## Kiểm tra thay đổi DX-OS

- 12 test mới của verifier: PASS; gồm inventory rỗng, thiếu stdlib/SBOM, CVE chưa có fix, severity sai, signature sai/expired/revoked, CLI input và database CVE cũ/tương lai.
- Bộ công cụ liên quan: 26/26 PASS (12 test mới và 14 test publication/demo/redirect hiện có). Ba bài HTTP loopback ban đầu bị sandbox trả EACCES; sau khi được phép localhost, chạy lại cả bộ đạt, không sửa ACL hoặc bỏ test.
- Verifier chạy trên artifact thật: chữ ký/hash/inventory/SBOM đạt; exit 1 / FAIL đúng gate do 6 HIGH. Không đổi expected result để coi artifact sạch.
- Publication check: PASS trên 1.195 file hiện tại và 1.262 history blobs có thể truy cập tại thời điểm kiểm tra; không bảo đảm phát hiện mọi secret chưa biết hoặc nội dung ảnh.
- [CI main tại base ab75bb3](https://github.com/nt6175790-afk/DXOS/actions/runs/39531818647): ba job verify/scan/source-demo SUCCESS. Đây là baseline; CI của PR mới phải được đọc tại đúng head commit, không thay bằng kết quả baseline này.
- Chưa chạy lại full backend/build/lint/MySQL local trong lượt artifact-only này. CI PR chạy full gate hiện có và thêm 12 test mới; kết quả cuối lấy từ GitHub Actions.

FRONTEND CHANGED: NO. DATABASE CHANGED: NO. CONTRACTS CHANGED: NO. ACL CHANGED: NO. CREDENTIALS COMMITTED: NO.
