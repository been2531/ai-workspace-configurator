import { initializeApp, getApps } from 'firebase/app'
import {
  getFirestore, collection, doc, getDoc, getDocs,
  query, where, orderBy, limit,
} from 'firebase/firestore'
import type { CommunityPreset } from '@ai-workspace-configurator/core'

// Firebase web config는 공개값 — 보안은 Firestore Rules로 처리
// https://firebase.google.com/docs/projects/api-keys
const FIREBASE_CONFIG = {
  apiKey:            process.env['FIREBASE_API_KEY']             ?? 'AIzaSyDzJaOqjPshPFJ4_6ES5AVmlthzPgokzFA',
  authDomain:        process.env['FIREBASE_AUTH_DOMAIN']         ?? 'ai-workspace-configurator.firebaseapp.com',
  projectId:         process.env['FIREBASE_PROJECT_ID']          ?? 'ai-workspace-configurator',
  storageBucket:     process.env['FIREBASE_STORAGE_BUCKET']      ?? 'ai-workspace-configurator.firebasestorage.app',
  messagingSenderId: process.env['FIREBASE_MESSAGING_SENDER_ID'] ?? '1039429232744',
  appId:             process.env['FIREBASE_APP_ID']              ?? '1:1039429232744:web:99d3686654de3e347f33dd',
}

function db() {
  const app = getApps().length === 0 ? initializeApp(FIREBASE_CONFIG) : getApps()[0]
  return getFirestore(app)
}

export async function searchPresets(queryStr: string, max = 10): Promise<CommunityPreset[]> {
  const ref = collection(db(), 'presets')
  const tag = queryStr.trim().toLowerCase()
  const q = tag
    ? query(ref, where('isPublic', '==', true), where('tags', 'array-contains', tag), orderBy('stars', 'desc'), limit(max))
    : query(ref, where('isPublic', '==', true), orderBy('stars', 'desc'), limit(max))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as CommunityPreset)
}

export async function getPreset(presetId: string): Promise<CommunityPreset | null> {
  const snap = await getDoc(doc(db(), 'presets', presetId))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() } as CommunityPreset
}
