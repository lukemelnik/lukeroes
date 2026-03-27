export function getUtcNowIso(): string {
  return new Date().toISOString();
}

export function toUtcIso(value: Date | number | string): string {
  if (value instanceof Date) {
    return value.toISOString();
  }

  return new Date(value).toISOString();
}

export function isUtcIso(value: string): boolean {
  const parsed = Date.parse(value);

  if (Number.isNaN(parsed)) {
    return false;
  }

  return new Date(parsed).toISOString() === value;
}

export function addMillisecondsToUtcIso(value: string, milliseconds: number): string {
  return toUtcIso(Date.parse(value) + milliseconds);
}

export function subtractMillisecondsFromUtcIso(value: string, milliseconds: number): string {
  return toUtcIso(Date.parse(value) - milliseconds);
}
