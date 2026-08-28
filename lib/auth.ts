import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE_NAME = "invoice_session";

function getSecret() {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SECRET is not configured.");
  }

  if (secret.length < 32) {
    throw new Error("AUTH_SECRET must be at least 32 characters.");
  }

  return new TextEncoder().encode(secret);
}

export async function verifyCredentials(
  username: string,
  password: string
) {
  const expectedUsername = process.env.APP_USERNAME;
  const passwordHash = process.env.APP_PASSWORD_HASH;
  const expectedPassword = process.env.APP_PASSWORD;

  if (!expectedUsername || (!passwordHash && !expectedPassword)) {
    return false;
  }

  if (username !== expectedUsername) return false;

  if (passwordHash) {
    return bcrypt.compare(password, passwordHash);
  }

  return password === expectedPassword;
}

export async function createSession() {
  const token = await new SignJWT({
    role: "owner",
  })
    .setProtectedHeader({
      alg: "HS256",
    })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());

  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function isAuthenticated() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;

  if (!token) {
    return false;
  }

  try {
    await jwtVerify(token, getSecret());
    return true;
  } catch {
    return false;
  }
}

export async function requirePageAuth() {
  if (!(await isAuthenticated())) {
    redirect("/login");
  }
}

export async function requireApiAuth() {
  return await isAuthenticated();
}
