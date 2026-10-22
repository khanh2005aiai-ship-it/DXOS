# Vá ứng viên AdGuard: kế hoạch và phạm vi

Ngày 21/10/2026. Người phụ trách dự án yêu cầu xử lý các phát hiện HIGH trong [bản kiểm chứng đầu tiên](adguard-artifact-verification-2026-10-21.md).

## Quyết định trước implementation

Upstream chưa có stable mới hơn v0.107.79 tại thời điểm kiểm tra. Không đổi sang beta/edge và không suppress CVE. Giữ source commit `05ba17b282da1c4393d6a4ba4db0cf519194a362`, rebuild với Go 1.26.10 và các phiên bản tương thích do `golang.org/x/net v0.60.0` yêu cầu: x/crypto v0.57.0, x/text v0.42.0, x/sys v0.48.0, x/term v0.46.0. DHCP được ghim commit vá `v0.0.0-20260719225207-c76316d4aa82`. Không sửa mã nghiệp vụ upstream, API, schema, frontend DX-OS hoặc cấu hình mạng thật.

Bản build có tên riêng **v0.107.79-dxos.1**, channel candidate. Đây là bản sửa dependency của DX-OS, **không phải release/chữ ký chính thức AdGuard**. Giữ verifier cũ để artifact chính thức còn lỗi tiếp tục bị từ chối. Chỉ chấp nhận ứng viên rebuild khi test upstream, hai lần build cùng hash, CLI version, inventory/version assertions, quét HIGH/CRITICAL, SBOM và govulncheck đều đạt.

Dependency closure đã đối chiếu thêm: x/text v0.42.0 yêu cầu x/tools v0.49.0, x/mod v0.41.0 và x/sync v0.23.0; x/tools yêu cầu x/telemetry `v0.0.0-20260811182544-a038080d80e5`. Allowlist ghim đúng các bản này, không cho phép module khác tự nâng/hạ/xóa. Không chạy tidy để dọn manifest ngoài phạm vi; test/build dùng `-mod=readonly`. Các module/tooling không mặc định được coi là nằm trong production binary.

Asset frontend upstream cùng v0.107.79 được giữ nguyên, ghim SHA-256 `30184c157d4aefe5371b575a43c0ab5a7314aef039a820cc421ea67bab994ce8`; không thay giao diện. Build trên runner tạm, chỉ contents:read, không dùng secret hoặc dữ liệu thật. Không chạy service DNS trên máy người dùng và không thay router/DHCP/firewall/ACL.

Source/patch, go.mod/go.sum, build recipe, provenance, SBOM và báo cáo phải đi cùng artifact. Bản phân phối giữ LICENSE GPL v3 và notices upstream, có ghi nhận thay đổi; không đổi nhãn sang Apache-2.0 của DX-OS. Bản source kèm vendor Go dependencies và source stdlib để tái dựng; client sources và asset frontend vẫn giữ trong source. Rà giấy phép toàn bộ bản phân phối và các gate vận hành vẫn là điều kiện riêng, không đồng nhất zero HIGH với production-ready.

GO-2026-5932 (UNKNOWN) liên quan `x/crypto/openpgp` không có bản sửa theo version. Không ignore/suppress advisory này: kiểm production import graph và govulncheck để xác định package lỗi có nằm trong chương trình không, giữ nguyên phát hiện trong báo cáo dependency.

Lần rebuild với Go 1.26.9 đã qua 2.004 test/31 package nhưng bị govulncheck chặn. Advisory mới [GO-2026-6809](https://pkg.go.dev/vuln/GO-2026-6809) yêu cầu Go 1.26.10; [GO-2026-6237](https://pkg.go.dev/vuln/GO-2026-6237) yêu cầu commit DHCP đã ghim ở trên. Giữ symbol table trong candidate và kiểm bằng `go tool nm`, rồi chạy govulncheck cả binary và source: binary stripped có thể khiến công cụ fallback bảo thủ sang toàn module, không chứng minh OpenPGP thực sự được link. Không ignore kết quả fallback; dùng binary đủ symbol, import graph và source analysis để kiểm chứng đúng phạm vi. Xem [giới hạn công cụ chính thức](https://pkg.go.dev/golang.org/x/vuln/cmd/govulncheck).

## Trạng thái

**EXECUTED / VERIFIED BY CI: PASS cho gate vá dependency HIGH/CRITICAL.** [Workflow rebuild](https://github.com/nt6175790-afk/DXOS/actions/runs/39566871471) chạy đúng source DX-OS `0899b9d20758739ec8d2a68f3c0780af1a3a768e` đã thành công. Các thay đổi sau revision này ở báo cáo hoặc compiler image khác không sửa recipe/binary AdGuard đã kiểm chứng. Chữ ký của bản chính thức không được dùng để chứng nhận binary đã sửa. Các case DNS lab, tenant API, restore/failover và review độc lập chưa được thực hiện bởi tài liệu này.

Trong regression, CVE-2026-111943 cũng được xác nhận ở `gosu` của image MySQL (stdlib Go 1.27.2). Các builder gosu/OpenBao/Coraza-Caddy còn dùng Go 1.27.2 được nâng bản vá compiler lên 1.27.3 trước khi quét lại. Giữ MySQL 8.0.44, các source commit/version của helper, runtime base, schema và migration; không sửa authentication/RBAC. Đây là cập nhật bảo mật toolchain liên quan advisory TLS vừa phát hiện, không phải nâng phiên bản database.

## Bằng chứng của candidate đã vá

- 2.004 upstream tests / 31 packages: PASS. Verifier/gate unit tests: 18/18 PASS.
- Hai lần build trên cùng runner có cùng SHA-256; CLI xác nhận `v0.107.79-dxos.1`. Không suy thành reproducibility trên mọi máy/OS.
- Binary SHA-256: `764607a27ba4bfa6eda27a0a9123e58cc88fb1de3df28f7339e2c9bee82962d6`.
- Trivy 0.76.0, CVE DB cập nhật `2026-10-21T07:13:45.702547343Z`: **0 HIGH, 0 CRITICAL, 1 MEDIUM, 1 UNKNOWN**; 50 packages / 51 CycloneDX components. Xem [review JSON](adguard-v0.107.79-dxos.1-review.json) và [SBOM](adguard-v0.107.79-dxos.1.cdx.json). Không suppress/ignore bất kỳ finding nào.
- Govulncheck trên binary đủ symbol và source: **0 affected vulnerabilities**, 0 affected imported packages; còn 1 module advisory không có lời gọi được phát hiện. Production import graph không có `x/crypto/openpgp`; UNKNOWN GO-2026-5932 vẫn được giữ trong module scan.
- MEDIUM CVE-2022-32175 được scanner gán cho main module theo version range `<0.108.0-b.16`. Không đổi version giả để tránh advisory. Source/changelog v0.107.79 đã ghi nhận các kiểm soát CSRF (SameSite Lax, bỏ plain-text APIs, JSON Content-Type); riêng đánh giá khả năng khai thác MEDIUM trên topology thực chưa được nghiệm thu. Không gọi candidate là zero-vulnerability hoặc production-ready.
- [Artifact binary cùng corresponding source/notices](https://github.com/nt6175790-afk/DXOS/actions/runs/39566871471/artifacts/12330601298), retention CI 14 ngày. ZIP SHA-256: `dc170dc6d61f01aabe95f8b625dd34520394121ddefddec7552eb5370afe253c`. Đã tải bằng API và đối chiếu checksum từng file; không commit binary/source archive hoặc tải lên release production.
- Frontend asset upstream giữ nguyên checksum đã ghim. Mã frontend DX-OS, database/schema/migration, API contracts, DNS/router/DHCP/firewall/ACL và credential không bị thay đổi.

Artifact là **Linux amd64**, không chạy trực tiếp trên Windows. Giữ binary, corresponding-source archive, LICENSE, DXOS-CHANGES, reports và SHA256SUMS cùng nhau khi bàn giao. Không dùng GPG signature của bản gốc để xác minh bản rebuild. Theo thời gian retention, phải dựng lại/scan lại trước lần sử dụng sau; không mặc định advisory database mãi giữ nguyên.

Nguồn: [stable release](https://github.com/AdguardTeam/AdGuardHome/releases/tag/v0.107.79), [Go HTTP/2 advisory](https://pkg.go.dev/vuln/GO-2026-6611), [OpenPGP advisory](https://pkg.go.dev/vuln/GO-2026-5932), [Go releases](https://go.dev/dl/).
