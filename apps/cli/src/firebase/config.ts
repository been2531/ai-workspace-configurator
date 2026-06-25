import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'

// Firebase web config 는 공개값 — 보안은 Firestore Rules 로 처리
// 실제 값은 Firebase 콘솔 → 프로젝트 설정 → 앱 → SDK 설정에서 복사
const FIREBASE_CONFIG = {
  apiKey:            process.env['FIREBASE_API_KEY']            ?? '',
  authDomain:        process.env['FIREBASE_AUTH_DOMAIN']        ?? 'ai-workspace-configurator.firebaseapp.com',
  projectId:         process.env['FIREBASE_PROJECT_ID']         ?? 'ai-workspace-configurator',
  storageBucket:     process.env['FIREBASE_STORAGE_BUCKET']     ?? 'ai-workspace-configurator.appspot.com',
  messagingSenderId: process.env['FIREBASE_MESSAGING_SENDER_ID'] ?? '',
  appId:             process.env['FIREBASE_APP_ID']             ?? '',
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
