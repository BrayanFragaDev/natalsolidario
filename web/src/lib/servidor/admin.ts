import 'server-only';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// No App Hosting as credenciais vêm da conta de serviço do backend;
// nos emuladores, de FIRESTORE_EMULATOR_HOST.
const app = getApps()[0] ?? initializeApp({ projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID });

export const dbServidor = getFirestore(app, process.env.NEXT_PUBLIC_FIRESTORE_DATABASE || '(default)');
