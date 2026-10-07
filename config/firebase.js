import admin from "firebase-admin";
import { env } from "./env.js";

let firebaseApp = null;

const initFirebase = () => {
  if (!env.firebaseEnabled) return null;
  if (firebaseApp) return firebaseApp;

  if (!env.firebaseProjectId || !env.firebasePrivateKey || !env.firebaseClientEmail) {
    return null;
  }

  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert({
      projectId: env.firebaseProjectId,
      privateKey: env.firebasePrivateKey.replace(/\\n/g, "\n"),
      clientEmail: env.firebaseClientEmail,
    }),
    databaseURL: env.firebaseDatabaseUrl,
  });

  return firebaseApp;
};

const getFirebase = () => {
  if (!env.firebaseEnabled) return null;
  if (!firebaseApp) return null;
  return firebaseApp;
};

export { initFirebase, getFirebase };