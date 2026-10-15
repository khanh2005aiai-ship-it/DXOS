# Data foundation API boundary

DXOS-DATA-001 adds no public HTTP endpoints and changes no existing API contract.

The database models are internal persistence foundations for later IAM, RBAC, and organization APIs. Frontend consumers must not rely on a direct database shape or infer endpoints from this document.

IAM authentication contracts now exist at `contracts/api/auth/authentication.md`. Role, permission, and organization endpoint contracts will be introduced by their respective implementation tasks with authorization, validation, error response, and pagination requirements documented under `contracts/api/`.
