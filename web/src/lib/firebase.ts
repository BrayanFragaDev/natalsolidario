import { getApp, getApps, initializeApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions';
import { connectStorageEmulator, getStorage } from 'firebase/storage';

const usarEmuladores = process.env.NEXT_PUBLIC_USAR_EMULADORES === 'true';

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? 'demo-api-key',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? 'demo-natal-solidario',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? 'demo-natal-solidario.appspot.com',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const primeiraVez = getApps().length === 0;

export const app = primeiraVez ? initializeApp(config) : getApp();
export const auth = getAuth(app);
// Em produção o banco é "natalsolidario"; os emuladores usam o banco padrão.
export const db = getFirestore(app, process.env.NEXT_PUBLIC_FIRESTORE_DATABASE || '(default)');
export const functions = getFunctions(app, 'southamerica-east1');
export const storage = getStorage(app);

// Executa uma vez por carregamento (o HMR reavalia o módulo, mas o app já existe).
if (primeiraVez && typeof window !== 'undefined') {
  if (usarEmuladores) {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
    connectFunctionsEmulator(functions, '127.0.0.1', 5001);
    connectStorageEmulator(storage, '127.0.0.1', 9199);
  } else if (process.env.NEXT_PUBLIC_RECAPTCHA_KEY) {
    initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(process.env.NEXT_PUBLIC_RECAPTCHA_KEY),
      isTokenAutoRefreshEnabled: true,
    });
  }
}
