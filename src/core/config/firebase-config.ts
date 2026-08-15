import type { FirebaseOptions } from 'firebase/app'

const DEFAULTS: Required<Pick<
  FirebaseOptions,
  'apiKey' | 'authDomain' | 'projectId' | 'storageBucket' | 'messagingSenderId' | 'appId'
>> & { measurementId: string } = {
  apiKey: 'AIzaSyC5V8ApA2ueCpASKw1mCH6knKb4SCgd3R0',
  authDomain: 'apiforge-dev.firebaseapp.com',
  projectId: 'apiforge-dev',
  storageBucket: 'apiforge-dev.firebasestorage.app',
  messagingSenderId: '118826558998',
  appId: '1:118826558998:web:a6e7ca03778dd6003d7737',
  measurementId: 'G-QHT48540YC',
}

function pick(value: string | undefined, fallback: string): string {
  const trimmed = value?.trim()
  return trimmed ? trimmed : fallback
}

export const firebaseConfig: FirebaseOptions = {
  apiKey: pick(import.meta.env.VITE_FIREBASE_API_KEY, DEFAULTS.apiKey),
  authDomain: pick(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN, DEFAULTS.authDomain),
  projectId: pick(import.meta.env.VITE_FIREBASE_PROJECT_ID, DEFAULTS.projectId),
  storageBucket: pick(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET, DEFAULTS.storageBucket),
  messagingSenderId: pick(
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    DEFAULTS.messagingSenderId,
  ),
  appId: pick(import.meta.env.VITE_FIREBASE_APP_ID, DEFAULTS.appId),
  measurementId: pick(import.meta.env.VITE_FIREBASE_MEASUREMENT_ID, DEFAULTS.measurementId),
}

export const functionsRegion = pick(import.meta.env.VITE_FUNCTIONS_REGION, 'europe-west3')

export const useEmulators = import.meta.env.VITE_USE_EMULATORS === 'true'
