import { auth } from "@lukeroes/auth";
import { getRequestMetadata, type RequestMetadata } from "@/server/request.server";

function getStringProperty(value: object | null | undefined, propertyName: string): string | null {
  if (!value) {
    return null;
  }

  const propertyValue = Reflect.get(value, propertyName);

  return typeof propertyValue === "string" ? propertyValue : null;
}

export interface AdminRequestContext {
  userId: string;
  requestMetadata: RequestMetadata | null;
}

export async function requireAdminRequestContext(request: Request): Promise<AdminRequestContext> {
  const session = await auth.api.getSession({
    headers: request.headers,
  });
  const user = session?.user;
  const userId = getStringProperty(user, "id");
  const userRole = getStringProperty(user, "role");

  if (!userId) {
    throw new Error("Unauthorized");
  }

  if (userRole !== "admin") {
    throw new Error("Forbidden");
  }

  return {
    userId,
    requestMetadata: getRequestMetadata(request),
  };
}
