import { HttpException, type HttpStatus } from '@nestjs/common';

export class ApiErrorException extends HttpException {
  constructor(
    status: HttpStatus,
    readonly code: string,
    readonly safeMessage: string,
  ) {
    super(safeMessage, status);
  }
}
