# Bản vá dependency follow-redirects ngày 21/10/2026

CI PR AdGuard phát hiện frontend/package-lock.json dùng follow-redirects 1.16.0 qua Axios 1.20.0. Trivy báo hai HIGH: CVE-2026-111755 và CVE-2026-111756, fixed version 1.16.1. Kết quả scan baseline ngày trước không chứng minh dependency vẫn không có cảnh báo ở ngày hiện tại.

Phạm vi sửa: nâng riêng lock entry của follow-redirects lên 1.16.1 theo range `^1.16.0` của Axios. Không nâng Axios/React hoặc thay UI, auth, API contract, schema hay migration. Không thêm direct dependency/override nếu npm có thể resolve bản vá trong range hiện tại. Kiểm tra diff để không kéo cập nhật ngoài phạm vi.

Đây là lỗi thư viện redirect trong môi trường Node. Không suy diễn rằng browser adapter của DX-OS đã bị khai thác; đồng thời không dùng khác biệt adapter làm lý do bỏ gate dependency. Không có bằng chứng khai thác dự án được xác nhận trong lượt review này.

Validation cần có trên revision cuối: npm ci theo lockfile, frontend lint/284 tests/build/audit, full backend suite, source Trivy và runtime scans, legal evidence; giữ HIGH/CRITICAL exit-code 1. Trạng thái thực tế nằm trong CI của PR, không ghi trước PASS.

Tarball npm 1.16.1 đã được đối chiếu SHA-512 theo lockfile. LICENSE trong tarball có SHA-256 `bfa8a54bb952ccda79f0f1889721d108f5b605babbb2b8a3705ffb52f4132eb7`, khớp nguyên byte với text MIT đang lưu; inventory/notice được cập nhật version, không sửa nội dung giấy phép.

Bổ sung `backend/scripts/redirect-dependency-security.test.js`: hai HTTP origins loopback dùng hoàn toàn header giả, kiểm tra custom sensitive header có metacharacter và raw header array bị loại bỏ khi redirect chéo origin; cùng origin vẫn giữ authentication đúng mục đích. Cả 3 case đã PASS local với dependency đã cài. CI chạy lại chúng sau npm ci frontend; không gọi các case này là test AdGuard.

Release v0.1.0 giữ nguyên tag và checksum nhưng chứa lockfile cũ. Khi bản vá được merge, dùng revision đã vá và đã qua CI để dựng lại; không mô tả v0.1.0 là đã có bản vá. Nếu xuất bản bundle/tag cập nhật, dùng patch version mới và kiểm chứng lại theo release-process.md. Thay đổi ghi chú cảnh báo không được thay thế binary/source asset cũ bằng asset khác cùng tên.

Nguồn: [upstream v1.16.1](https://github.com/follow-redirects/follow-redirects/releases/tag/v1.16.1), [advisory regex-sensitive-headers](https://github.com/follow-redirects/follow-redirects/security/advisories/GHSA-8r9p-f939-6h3c) và [bản sửa upstream](https://github.com/follow-redirects/follow-redirects/commit/080a76d0e125b37bf81717368a61d5dc37aa56c8). Không có secret hoặc dữ liệu exploit thật trong tài liệu này.
