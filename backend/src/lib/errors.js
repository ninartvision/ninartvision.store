// Typed error hierarchy. Throwing one of these from anywhere in the
// codebase lets the central error handler render a clean, consistent
// HTTP response without each route having to know the right status code.
//
//   throw new NotFoundError('Order not found');
//   throw new ValidationError('amount must be > 0', { field: 'amount' });
//   throw new InvalidSignatureError();
//
// The base AppError carries an `expose` flag — when true the message is
// safe to return to clients, when false the handler returns a generic
// message and logs the real one.

export class AppError extends Error {
  /**
   * @param {string} message
   * @param {{ status?: number, code?: string, expose?: boolean, details?: unknown, cause?: unknown }} [opts]
   */
  constructor(message, opts = {}) {
    super(message, opts.cause ? { cause: opts.cause } : undefined);
    this.name = this.constructor.name;
    this.status = opts.status ?? 500;
    this.code = opts.code ?? 'internal_error';
    this.expose = opts.expose ?? this.status < 500;
    this.details = opts.details;
  }
}

export class ValidationError extends AppError {
  constructor(message, details) {
    super(message, { status: 400, code: 'validation_error', expose: true, details });
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, { status: 401, code: 'unauthorized', expose: true });
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, { status: 403, code: 'forbidden', expose: true });
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Not found') {
    super(message, { status: 404, code: 'not_found', expose: true });
  }
}

export class ConflictError extends AppError {
  constructor(message, details) {
    super(message, { status: 409, code: 'conflict', expose: true, details });
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, { status: 429, code: 'rate_limited', expose: true });
  }
}

export class NotImplementedError extends AppError {
  constructor(message = 'Not implemented') {
    super(message, { status: 501, code: 'not_implemented', expose: true });
  }
}

// Webhook signature mismatch — kept separate from generic Unauthorized
// because it must never be retried by the bank's webhook system.
export class InvalidSignatureError extends AppError {
  constructor(message = 'Invalid webhook signature') {
    super(message, { status: 400, code: 'invalid_signature', expose: true });
  }
}
