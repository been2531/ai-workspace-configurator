import { initializeApp, getApps } from 'firebase/app'
import {
  getFirestore, collection, doc, getDoc, getDocs,
  query, where, orderBy, limit,
} from 'firebase/firestore'
import type { CommunityPreset } from '@ai-workspace-configurator/core'

const FIREBASE_CONFIG = {
  apiKey:            'AIzaSyDzJaOqjPshPFJ4_6ES5AVmlthzPgokzFA',
  authDomain:        'ai-workspace-configurator.firebaseapp.com',
  projectId:         'ai-workspace-configurator',
  storageBucket:     'ai-workspace-configurator.firebasestorage.app',
  messagingSenderId: '1039429232744',
  appId:             '1:1039429232744:web:99d3686654de3e347f33dd',
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
