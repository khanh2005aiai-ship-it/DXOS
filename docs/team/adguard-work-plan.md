# Bàn giao phần bảo mật và hạ tầng AdGuard

Ngày: 21/10/2026. Chủ repository yêu cầu thực hiện tập trung phần kỹ thuật trước đây dự định chia cho hai thành viên. Tài liệu này ghi đúng người/tài khoản thực hiện; không dùng tên hoặc tài khoản của thành viên khác để tạo commit hay bằng chứng đóng góp.

## Kết quả theo yêu cầu nhóm

| Đầu việc | Deliverable | Trạng thái |
| --- | --- | --- |
| Đọc tài liệu kỹ thuật đã gửi | Đã đọc 14 trang; tài liệu gốc giữ private | DONE |
| Đánh giá ghép AdGuard với DX-OS | [Quyết định kiến trúc](../architecture/adguard-integration-assessment.md) | DONE: GO thiết kế/PoC, NO-GO production/tenant API hiện tại |
| Thiết kế hạ tầng, vận hành và phục hồi | [Runbook](../architecture/adguard-infrastructure-runbook.md) | DONE tài liệu; chưa cài mạng thật |
| Rà bảo mật, dữ liệu, giấy phép và tenant | [Security review](../architecture/adguard-security-review.md) | DONE review thiết kế; chưa duyệt artifact triển khai |
| Chuẩn bị nghiệm thu | [24 case có kỳ vọng cụ thể](../architecture/adguard-validation-plan.md) | DONE kế hoạch; test AdGuard NOT_EXECUTED |
| Quét/test bản DX-OS hiện có | [CI release v0.1.0](https://github.com/nt6175790-afk/DXOS/actions/runs/39447966497) và CI đúng revision PR hiện tại | Baseline có bằng chứng; không gọi là scan AdGuard |
| Nhánh/commit/PR | `feat/adguard-integration-assessment` vào main | Xem PR/commit thực tế trên GitHub |
| Hai thành viên cập nhật GitHub bằng tài khoản riêng mỗi tuần | Commit/PR có nội dung thực của từng người | Chưa được thay thế bởi lượt thực hiện tập trung này |

## Đầu việc sau khi chấp thuận thiết kế

Các đầu việc sau chưa giao dưới tên người khác và chưa được coi là đã triển khai:

1. **Hạ tầng lab:** chốt OS/arch, dựng AdGuard riêng trên loopback/high ports với domain synthetic; xác minh artifact và scan, ghi ADG-01..09. Không đổi DNS/router host để demo.
2. **Security verification:** thử tenant/SSRF/redaction/cache/credential boundary theo ADG-10..17 khi có adapter; trước đó chỉ review thiết kế. Đề xuất quyền mới phải qua catalog/contracts và provisioning rõ ràng.
3. **Adapter chỉ đọc:** chỉ bắt đầu sau PR contract và binding instance-per-org được review. Giữ modular monolith và RBAC hiện có; không dùng raw global stats cho tenant.
4. **Operations:** owner mạng phê duyệt topology, retention, custody/rotation, backup/restore/failover; thực thi ADG-18..24 trên lab được phép.

Tạo đầu việc bằng [work-item template hiện có](../../.github/ISSUE_TEMPLATE/work-item.yml); không tạo thêm hệ thống phân quyền hoặc tracker thứ hai. Mỗi PR có phạm vi, expected/actual evidence, giới hạn và người review thực tế. Nếu chỉ self-review thì ghi đúng như vậy.

## Quy trình đóng góp cá nhân

Khi thành viên tham gia, chủ repository xác nhận đúng GitHub username rồi mới cấp quyền cần thiết qua quy trình của GitHub. Không dùng token/mật khẩu của người khác, không đặt author/co-author khi họ chưa thực sự đóng góp. Nếu chưa có quyền write, dùng fork và Pull Request.

```text
git switch main
git pull --ff-only
git switch -c docs/adguard-<pham-vi-cu-the>
# Đọc tài liệu và thực hiện phần việc thật của mình.
git add <cac-file-da-review>
git commit -m "Mo ta thay doi thuc te"
git push -u origin docs/adguard-<pham-vi-cu-the>
```

Git identity phải là tài khoản/email của chính người thực hiện. Trước push: kiểm tra diff, secret, privacy, license và test phù hợp; mở PR theo CONTRIBUTING.md. Cập nhật ít nhất một lần/tuần theo yêu cầu nhóm bằng tiến độ hoặc deliverable thực, không tạo commit rỗng để đủ số lượng.

Mốc thi đã được nhắc là còn 9 ngày trong trao đổi ngày 21/10; trước đó có mốc dự kiến khác. Chủ nhóm cần chốt lịch chính thức; tài liệu này không tự đổi thành một ngày thi đã xác nhận. Ưu tiên đóng phần đánh giá/docs trước, sau đó lab và kiểm chứng an toàn, không đưa một integration chưa qua gate vào sát ngày demo.
