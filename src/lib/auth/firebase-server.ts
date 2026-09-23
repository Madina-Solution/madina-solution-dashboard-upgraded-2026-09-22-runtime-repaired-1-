import { decodeProtectedHeader, jwtVerify, createRemoteJWKSet } from "jose";

const GOOGLE_JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com")
);

export type FirebaseIdentity = {
  uid: string;
  email: string;
  name: string;
  picture: string | null;
};

export async function verifyFirebaseIdToken(idToken: string): Promise<FirebaseIdentity> {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) throw new Error("Firebase project ID belum dikonfigurasi");

  const header = decodeProtectedHeader(idToken);
  if (header.alg !== "RS256") throw new Error("Firebase token algorithm tidak valid");

  const { payload } = await jwtVerify(idToken, GOOGLE_JWKS, {
    algorithms: ["RS256"],
    issuer: `https://securetoken.google.com/${projectId}`,
    audience: projectId,
  });

  if (!payload.sub || typeof payload.sub !== "string") throw new Error("Firebase UID tidak valid");
  const authTime = typeof payload.auth_time === "number" ? payload.auth_time : 0;
  if (!authTime) throw new Error("Firebase auth_time tidak valid");

  const email = typeof payload.email === "string" ? payload.email.toLowerCase() : "";
  const name = typeof payload.name === "string" && payload.name.trim() ? payload.name : email.split("@")[0] || "Customer";
  const picture = typeof payload.picture === "string" ? payload.picture : null;
  if (!email) throw new Error("Akun Firebase tidak memiliki email");

  return { uid: payload.sub, email, name, picture };
}
