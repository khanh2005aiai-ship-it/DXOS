# Chuẩn bị đưa DX-OS lên Git

## Phạm vi bản source cho người xem

Bao gồm frontend/backend, schema/migration, contracts, tests, giấy phép, CI và hướng dẫn chạy. Không bao gồm node_modules, dist, coverage, local env/secret, logs, backup/database dump, outputs/work, ảnh chụp và báo cáo lịch sử từ máy cá nhân.

Các ghi chú kỹ thuật từng đợt được giữ tại docs/project-history trong checkout gốc; không cần để chạy ứng dụng. Không xóa dữ liệu MySQL hoặc volume bảo mật khi dọn source.

## Phát hiện trên checkout gốc ngày 15/10/2026

Source hiện tại không khớp credential local đã kiểm tra. Tuy nhiên một blob lịch sử docs/DEMO_GUIDE.md vẫn chứa credential demo đang dùng. Vì vậy **không push lịch sử checkout gốc**. File `.gitignore` không che dữ liệu đã commit. Kiểm tra read-only bằng:

```powershell
node backend/scripts/verify-git-publication.js
```

Bản source sạch được chuẩn bị riêng, không sao chép `.git` cũ. Repo mới chưa có commit, nên không tạo lịch sử hoặc tác giả giả. Giữ checkout cũ làm việc/đối chiếu; không force-push, không xóa lịch sử cũ. Trước khi triển khai public, rotate credential từng xuất hiện trong history kể cả khi chỉ công bố snapshot sạch.

## Trước commit/push từ bản source sạch

1. Xác nhận repository đích và quyền public/private; lần chuẩn bị này chưa thiết lập remote hay push.
2. Đọc README/LICENSE/NOTICE và chạy publication check. Rà lại mọi nội dung muốn thêm, đặc biệt screenshots và dữ liệu cá nhân.
3. Chạy npm ci ở root/frontend, cấu hình env riêng và kiểm thử theo README.
4. Xem git status và git diff --cached trước commit. Không add thư mục backup hay copy env từ máy gốc vào Git.
5. Commit thật với danh tính người thực hiện, sau đó chạy CI trên remote. Kết quả local không được gọi là remote CI PASS.

CI/SBOM không phải chứng nhận pháp lý. Binary release và package optional Linux cần bằng chứng giấy phép đúng nền tảng. Bản source sạch không chứa dữ liệu MySQL hay material phục hồi OpenBao.
