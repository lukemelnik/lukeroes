export interface RequestMetadata {
  ipAddress: string | null;
  userAgent: string | null;
}

function getFirstHeaderValue(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const [firstValue] = value
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  return firstValue ?? null;
}

export function getClientIpAddress(request: Request): string | null {
  const headers = request.headers;

  return (
    getFirstHeaderValue(headers.get("cf-connecting-ip")) ??
    getFirstHeaderValue(headers.get("x-forwarded-for")) ??
    getFirstHeaderValue(headers.get("x-real-ip"))
  );
}

export function getRequestMetadata(request: Request): RequestMetadata {
  return {
    ipAddress: getClientIpAddress(request),
    userAgent: request.headers.get("user-agent"),
  };
}
