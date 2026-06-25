import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'

// Firebase web config 는 공개값 — 보안은 Firestore Rules 로 처리
const FIREBASE_CONFIG = {
  apiKey:            process.env['FIREBASE_API_KEY']            ?? 'AIzaSyDzJaOqjPshPFJ4_6ES5AVmlthzPgokzFA',
  authDomain:        process.env['FIREBASE_AUTH_DOMAIN']        ?? 'ai-workspace-configurator.firebaseapp.com',
  projectId:         process.env['FIREBASE_PROJECT_ID']         ?? 'ai-workspace-configurator',
  storageBucket:     process.env['FIREBASE_STORAGE_BUCKET']     ?? 'ai-workspace-configurator.firebasestorage.app',
  messagingSenderId: process.env['FIREBASE_MESSAGING_SENDER_ID'] ?? '1039429232744',
  appId:             process.env['FIREBASE_APP_ID']             ?? '1:1039429232744:web:99d3686654de3e347f33dd',
}

let _app: FirebaseApp | null = null

export function getFirebaseApp(): FirebaseApp {
  if (!_app) {
    _app = getApps().length === 0
      ? initializeApp(FIREBASE_CONFIG)
      : getApps()[0]
  }
  return _app
}

export function isFirebaseConfigured(): boolean {
  return !!(FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.projectId)
}

export const PROJECT_ID = FIREBASE_CONFIG.projectId
