class AppError extends Error {
  constructor(message, statusCode = 500, status = "error") {
    super(message);
    this.status = status;
    this.statusCode = statusCode;
  }
}

module.exports = AppError;
