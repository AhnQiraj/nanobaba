import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { loadConfig } from "@/lib/config";
import { sessionCookieName, verifySessionToken } from "@/lib/session";

export async function isAuthenticatedRequest() {
  const token = (await cookies()).get(sessionCookieName)?.value;

  if (!token) {
    return false;
  }

  try {
    const config = loadConfig();
    const payload = await verifySessionToken(token, config.sessionSecret);

    return payload.loggedIn === true;
  } catch {
    return false;
  }
}

export async function redirectIfLoggedOut() {
  if (!(await isAuthenticatedRequest())) {
    redirect("/login");
  }
}
