import { NextResponse } from 'next/server';

/**
 * Safely parses a JSON array of photo URLs/Base64 strings.
 * Returns empty array [] on null, undefined, malformed JSON, or non-array payloads.
 */
export function safeParsePhotos(value: any): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string') return [];
  const trimmed = value.trim();
  if (!trimmed || trimmed === '[]') return [];
  try {
    const parsed = JSON.parse(trimmed);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Handles route errors, classifying client input / constraint errors as HTTP 400
 * and unexpected system errors as HTTP 500.
 */
export function handleRouteError(error: any): NextResponse {
  const message = error?.message || 'Internal Server Error';
  const isClientError =
    /FOREIGN KEY constraint failed/i.test(message) ||
    /CHECK constraint failed/i.test(message) ||
    /NOT NULL constraint failed/i.test(message) ||
    /datatype mismatch/i.test(message) ||
    /UNIQUE constraint failed/i.test(message);

  if (isClientError) {
    return NextResponse.json({ error: message }, { status: 400 });
  }
  return NextResponse.json({ error: message }, { status: 500 });
}
