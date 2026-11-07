import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<{ status: (code: number) => { json: (body: unknown) => void } }>();
    const request = ctx.getRequest<{ url?: string; method?: string }>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const message =
      exception instanceof HttpException ? exception.getResponse() : "Internal server error";

    if (status >= 500) {
      this.logger.error(`${request.method} ${request.url} -> ${status}: ${String(exception)}`);
    }

    response.status(status).json({
      statusCode: status,
      path: request.url,
      message,
      timestamp: new Date().toISOString(),
    });
  }
}