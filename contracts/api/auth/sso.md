# Đăng nhập SSO (OIDC)

Các endpoint mới, không đổi login/refresh/logout cũ:

- `GET /api/v1/auth/sso/config` → `{ enabled, providerName }`, không trả secret.
- `POST /api/v1/auth/sso/start` → `{ authorizationUrl, state, challenge, expiresIn: 300 }`.
  Browser giữ state/challenge trong sessionStorage của tab rồi chuyển đến authorizationUrl.
- Callback frontend `/auth/sso/callback` kiểm tra state với tab, xóa query, gửi
  `POST /api/v1/auth/sso/complete` với `{ code, state, challenge, iss? }` → AuthResponse hiện có.
  Giữ nguyên tham số `iss` nếu IdP trả về; kiểm tra issuer chống authorization-server mix-up.

POST cần Origin đúng origin của SSO_REDIRECT_URI, dùng auth login rate limit và no-store.
400: DTO không hợp lệ; 401: origin/state/nonce/code/challenge/danh tính không hợp lệ;
403: user DX-OS inactive/suspended; 404: SSO tắt; 429: rate limit; 503: IdP unavailable.

Authorization Code + PKCE S256, state/nonce ngẫu nhiên, challenge AES-GCM 5 phút,
attempt dùng một lần trên database chung. ID token phải có chữ ký RS256 hợp lệ,
issuer/audience/nonce/expiry hợp lệ. Endpoint discovery/JWKS/token cùng origin issuer.
HTTP chỉ được phép cho localhost ngoài production.

Liên kết `(issuer, subject)` với user đã tồn tại bằng công cụ vận hành; so sánh
case-sensitive. Không tự tạo user, không tự nối theo email, không nhận role/group/
organization từ IdP. Session JWT DX-OS, logout/revocation và RBAC/membership cũ tiếp tục
áp dụng. Logout DX-OS chỉ thu hồi session DX-OS; chưa đăng xuất toàn bộ phiên Keycloak.

Không lưu/ghi log ID/access/refresh token từ provider. API chỉ trả token session DX-OS
như contract hiện có. Frontend phải giữ challenge ở tab hiện tại và không đưa vào URL.
# SSO logout extension

`GET /api/v1/auth/sso/logout-url` requires the existing active DX-OS JWT/session.
It returns `{ "logoutUrl": "<trusted IdP end-session URL>" }` with no-store headers.
The issuer endpoint is obtained from trusted discovery and must have the configured
issuer origin. The client ID and post-logout `/login` URL are server-derived;
client redirect/query parameters cannot change them. No IdP token is returned.

401 means missing/invalid/inactive session; 404 means SSO disabled; 503 means
discovery/end-session is unavailable or unsafe. This GET only discovers a URL.
The frontend revokes the DX-OS session through the existing POST /auth/logout,
then navigates SSO-authenticated tabs to the IdP to end its browser session.
Keycloak may require interactive logout confirmation because no id_token_hint
is retained. If discovery fails, local logout still revokes DX-OS; global IdP
logout cannot be claimed. Password-only login keeps its current local logout.

