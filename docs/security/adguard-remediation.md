# Vá ứng viên AdGuard: kế hoạch và phạm vi

Ngày 21/10/2026. Người phụ trách dự án yêu cầu xử lý các phát hiện HIGH trong [bản kiểm chứng đầu tiên](adguard-artifact-verification-2026-10-21.md).

## Quyết định trước implementation

Upstream chưa có stable mới hơn v0.107.79 tại thời điểm kiểm tra. Không đổi sang beta/edge và không suppress CVE. Giữ source commit `05ba17b282da1c4393d6a4ba4db0cf519194a362`, rebuild với Go 1.26.9 và các phiên bản tương thích do `golang.org/x/net v0.60.0` yêu cầu: x/crypto v0.57.0, x/text v0.42.0, x/sys v0.48.0, x/term v0.46.0. Không sửa mã nghiệp vụ upstream, API, schema, frontend DX-OS hoặc cấu hình mạng thật.

Bản build có tên riêng **v0.107.79-dxos.1**, channel candidate. Đây là bản sửa dependency của DX-OS, **không phải release/chữ ký chính thức AdGuard**. Giữ verifier cũ để artifact chính thức còn lỗi tiếp tục bị từ chối. Chỉ chấp nhận ứng viên rebuild khi test upstream, hai lần build cùng hash, CLI version, inventory/version assertions, quét HIGH/CRITICAL, SBOM và govulncheck đều đạt.

Asset frontend upstream cùng v0.107.79 được giữ nguyên, ghim SHA-256 `30184c157d4aefe5371b575a43c0ab5a7314aef039a820cc421ea67bab994ce8`; không thay giao diện. Build trên runner tạm, chỉ contents:read, không dùng secret hoặc dữ liệu thật. Không chạy service DNS trên máy người dùng và không thay router/DHCP/firewall/ACL.

Source/patch, go.mod/go.sum, build recipe, provenance, SBOM và báo cáo phải đi cùng artifact. Bản phân phối giữ LICENSE GPL v3 và notices upstream, có ghi nhận thay đổi; không đổi nhãn sang Apache-2.0 của DX-OS. Bản source kèm vendor Go dependencies và source stdlib để tái dựng; client sources và asset frontend vẫn giữ trong source. Rà giấy phép toàn bộ bản phân phối và các gate vận hành vẫn là điều kiện riêng, không đồng nhất zero HIGH với production-ready.

GO-2026-5932 (UNKNOWN) liên quan `x/crypto/openpgp` không có bản sửa theo version. Không ignore/suppress advisory này: kiểm production import graph và govulncheck để xác định package lỗi có nằm trong chương trình không, giữ nguyên phát hiện trong báo cáo dependency.

## Trạng thái

Implementation/scan rebuild: **PENDING** cho đến khi CI đúng revision có artifact và bằng chứng. Chữ ký của bản chính thức không được dùng để chứng nhận binary đã sửa. Các case DNS lab, tenant API, restore/failover và review độc lập chưa được thực hiện bởi tài liệu này.

Nguồn: [stable release](https://github.com/AdguardTeam/AdGuardHome/releases/tag/v0.107.79), [Go HTTP/2 advisory](https://pkg.go.dev/vuln/GO-2026-6611), [OpenPGP advisory](https://pkg.go.dev/vuln/GO-2026-5932), [Go releases](https://go.dev/dl/).
