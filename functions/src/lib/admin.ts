import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const app = getApps()[0] ?? initializeApp();

// Em produção o banco é "natalsolidario" (functions/.env.grupo-natal-solidario);
// os emuladores usam o banco padrão.
export const db = getFirestore(app, process.env.FIRESTORE_DATABASE || '(default)');
export const auth = getAuth(app);
