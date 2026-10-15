import type { UserAccountStatus } from '@prisma/client';
import type { HttpRequestContext } from '../../common/http/request-context';

export interface AuthenticatedUser {
  id: string;
  email: string;
  displayName: string | null;
  accountStatus: UserAccountStatus;
}

export interface AuthenticatedRequestContext {
  user: AuthenticatedUser;
  sessionId: string;
}

export interface AuthenticatedRequest extends HttpRequestContext {
  auth?: AuthenticatedRequestContext;
}

export interface AccessTokenPayload {
  sub: string;
  sid: string;
  typ: 'access';
}
