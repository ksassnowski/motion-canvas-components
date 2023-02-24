/**
 * Wraps a value into an array if it isn't already.
 *
 * @param value - The value to wrap
 */
export function wrapArray<T>(value: T | T[]): T[] {
  if (Array.isArray(value)) {
    return value;
  }
  return [value];
}
