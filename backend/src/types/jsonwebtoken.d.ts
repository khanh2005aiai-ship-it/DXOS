declare module 'jsonwebtoken' {
  export interface JwtPayload {
    [key: string]: unknown;
  }

  export interface SignOptions {
    algorithm?: 'HS256';
    expiresIn?: number;
  }

  export interface VerifyOptions {
    algorithms?: Array<'HS256'>;
  }

  export function sign(payload: object, secret: string, options: SignOptions): string;
  export function verify(token: string, secret: string, options: VerifyOptions): string | JwtPayload;
}
