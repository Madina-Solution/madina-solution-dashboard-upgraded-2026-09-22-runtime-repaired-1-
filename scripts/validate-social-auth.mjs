import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const required = [
  "src/lib/auth/firebase-client.ts",
  "src/lib/auth/firebase-server.ts",
  "src/app/api/auth/firebase/route.ts",
  "src/components/auth-social-buttons.tsx",
];
const errors = [];
for (const file of required) {
  if (!fs.existsSync(path.join(root, file))) errors.push(`${file}: missing`);
}
const login = fs.readFileSync(path.join(root, "src/app/(auth)/login/login-form.tsx"), "utf8");
if (!login.includes("SocialAuthButtons")) errors.push("login-form.tsx: missing SocialAuthButtons");
const client = fs.readFileSync(path.join(root, "src/lib/auth/firebase-client.ts"), "utf8");
for (const marker of ["GoogleAuthProvider", "FacebookAuthProvider", "/api/auth/firebase"]) {
  if (!client.includes(marker)) errors.push(`firebase-client.ts: missing ${marker}`);
}
const server = fs.readFileSync(path.join(root, "src/app/api/auth/firebase/route.ts"), "utf8");
for (const marker of ["verifyFirebaseIdToken", "firebaseUid", "createSession"]) {
  if (!server.includes(marker)) errors.push(`firebase auth route: missing ${marker}`);
}
if (errors.length) {
  console.error("Social auth validation failed:");
  errors.forEach((e) => console.error(`- ${e}`));
  process.exit(1);
}
console.log("Social auth validation passed: Google/Facebook client providers and server session bridge are present.");
