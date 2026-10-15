# Chuyển kho secret local từ file sang Raft — kế hoạch và kiểm chứng

OpenBao 2.7 không còn đăng ký storage `file`. Rebuild bằng Go đã vá không khôi phục
backend đã bị upstream loại bỏ. Giữ bản 2.4 có CVE hoặc sửa registry để dùng storage
không được hỗ trợ không giải quyết việc hoàn thiện local.

Thay đổi có chủ đích: chỉ kho dữ liệu OpenBao chuyển sang Raft một node. NestJS vẫn
là modular monolith; không đổi MySQL dx_os, schema/migration Prisma, API KV-v2,
JWT/AI/database credentials, AppRole hoặc quyền nghiệp vụ.

Quy trình:

1. Snapshot nhất quán các volume Keycloak/OpenBao đã được lưu private trong outputs.
2. Tính hash canonical của hai KV path và policy/role ID; không lưu plaintext secret.
3. Dừng backend/agent/OpenBao. Copy volume file vào volume clone riêng.
4. Dùng `bao operator migrate` của 2.4 để copy ciphertext từ clone sang volume Raft
   mới, chưa initialized. Migration lock chỉ tác động clone; volume gốc được giữ.
5. Cập nhật riêng HCL/volume mount sang Raft và cluster_addr internal.
6. Khởi động 2.7.1+dxos.1, unseal bằng material gốc, xác nhận hash KV/policy/role ID
   không thay đổi trước khi khởi động backend/agent lại.
7. Nếu bất kỳ bước xác minh nào thất bại: phục hồi HCL/compose trước đó và khởi động
   image 2.4 trên volume gốc. Không xóa volume hoặc tạo lại root/seal material.

Helper từ chối overwrite volume Raft đã có, không reset dx_os hoặc tự init secret
store rỗng. Kết quả chỉ ghi hash/status vào security-artifacts, không ghi giá trị.
Raft một node là cấu hình local, không được gọi là HA production.

Nguồn: https://openbao.org/docs/commands/operator/migrate/ và
https://openbao.org/docs/configuration/storage/raft/.
