/**
 * Type-safe error handling helper.
 * Avoids `(err as any).message` / `(err as any).code` anti-patterns.
 *
 * Usage:
 *   catch (err: unknown) {
 *     this.logger.error(isRecordError(err)?.message);
 *     return { success: false, message: isRecordError(err)?.message, code: isRecordError(err)?.code };
 *   }
 */

export interface RecordError {
  message: string
  code?: string | number
  stack?: string
}

/** Check if an unknown value is an object with at least a message property. */
export function isRecordError(value: unknown): RecordError | null {
  if (typeof value === 'object' && value !== null) {
    const rec = value as Record<string, unknown>
    if (typeof rec.message === 'string') {
      return {
        message: rec.message,
        code: typeof rec.code === 'string' || typeof rec.code === 'number' ? rec.code : undefined,
        stack: typeof rec.stack === 'string' ? rec.stack : undefined,
      }
    }
  }
  return null
}
