import { SetMetadata } from '@nestjs/common';
import type { PermissionKey } from '../permission-catalog';

export const REQUIRED_PERMISSION = 'dx-os:required-permission';

export function RequirePermission(permission: PermissionKey): MethodDecorator & ClassDecorator {
  return SetMetadata(REQUIRED_PERMISSION, permission);
}
