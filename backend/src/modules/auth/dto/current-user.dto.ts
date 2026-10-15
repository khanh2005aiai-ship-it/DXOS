import type { UserAccountStatus } from '@prisma/client';

export class CurrentUserDto {
  id!: string;
  email!: string;
  displayName!: string | null;
  accountStatus!: UserAccountStatus;
}
