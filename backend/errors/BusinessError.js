export class BusinessError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "BusinessError";
    this.code = code;
  }
}
