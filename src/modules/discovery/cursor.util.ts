import { BadRequestException } from '@nestjs/common';

// Opaque, base64-encoded JSON cursors. Encoding keeps the ordering keys off the
// wire as an implementation detail; a malformed cursor is a clean 400, never a
// 500.
export function encodeCursor(payload: unknown): string {
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

export function decodeCursor<T>(cursor: string): T {
  try {
    const json = Buffer.from(cursor, 'base64url').toString('utf8');
    const parsed = JSON.parse(json) as unknown;
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Cursor is not an object');
    }
    return parsed as T;
  } catch {
    throw new BadRequestException('Invalid cursor');
  }
}
