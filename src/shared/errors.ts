export class AppError extends Error {
  constructor(message: string, public readonly code: number = 1) {
    super(message);
    this.name = 'AppError';
  }
}

export class UnknownSchemaError extends AppError {
  constructor(version: number) {
    super(`Unknown schema version: ${version}`, 1);
    this.name = 'UnknownSchemaError';
  }
}

export class ChainIntegrityError extends AppError {
  constructor(public readonly line: number, expected: string, got: string) {
    super(`Chain break at line ${line}: expected ${expected}, got ${got}`, 1);
    this.name = 'ChainIntegrityError';
  }
}

export class SchemaValidationError extends AppError {
  constructor(public readonly errors: string[]) {
    super(`Schema validation failed: ${errors.join('; ')}`, 1);
    this.name = 'SchemaValidationError';
  }
}

export class UsageError extends AppError {
  constructor(message: string) {
    super(message, 2);
    this.name = 'UsageError';
  }
}
