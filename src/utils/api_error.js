export class api_error extends Error {
  constructor(status_code, message, errors = [], stack = "") {
    super(message);
    this.status_code = status_code;
    this.errors = errors;
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
} 