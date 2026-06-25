import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  increment,
  serverTimestamp,
  type DocumentData,
} from 'firebase/firestore'
import { getFirebaseApp } from './config'
import type { CommunityPreset } from '@ai-workspace-configurator/core'

function db() {
  return getFirestore(getFirebaseApp())
}

// ─── 타입 ────────────────────────────────────────────────────────────────────

export interface PresetDoc extends CommunityPreset {
  authorUid: string
  stars: number
  appliedCount: number
  isPublic: boolean
  createdAt: unknown
  updatedAt: unknown
}

// ─── 읽기 (인증 불필요) ──────────────────────────────────────────────────────

export async function searchPresets(queryStr: string, limitCount = 20): Promise<PresetDoc[]> {
  const ref = collection(db(), 'presets')

  const q = queryStr
    ? query(
        ref,
        where('isPublic', '==', true),
        where('tags', 'array-contains', queryStr.toLowerCase()),
        orderBy('stars', 'desc'),
        limit(limitCount),
      )
    : query(ref, where('isPublic', '==', true), orderBy('stars', 'desc'), limit(limitCount))

  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as PresetDoc))
}

export async function getPreset(presetId: string): Promise<PresetDoc | null> {
  const ref = doc(db(), 'presets', presetId)
  const snapshot = await getDoc(ref)
  if (!snapshot.exists()) return null
  return { id: snapshot.id, ...snapshot.data() } as PresetDoc
}

// ─── 쓰기 (인증 필요) ────────────────────────────────────────────────────────

export async function publishPreset(
  preset: Omit<PresetDoc, 'id' | 'stars' | 'appliedCount' | 'createdAt' | 'updatedAt'>,
): Promise<string> {
  const ref = collection(db(), 'presets')
  const docRef = await addDoc(ref, {
    ...preset,
    stars: 0,
    appliedCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return docRef.id
}

export async function updatePreset(
  presetId: string,
  updates: Partial<Omit<PresetDoc, 'id' | 'authorUid' | 'createdAt'>>,
): Promise<void> {
  const ref = doc(db(), 'presets', presetId)
  await updateDoc(ref, { ...updates, updatedAt: serverTimestamp() } as DocumentData)
}

// ─── 스타 ─────────────────────────────────────────────────────────────────────

export async function starPreset(presetId: string, uid: string): Promise<void> {
  const starId = `${uid}_${presetId}`
  const starRef = doc(db(), 'presetStars', starId)
  const existing = await getDoc(starRef)

  if (existing.exists()) {
    // 이미 스타 → 취소
    await deleteDoc(starRef)
    await updateDoc(doc(db(), 'presets', presetId), { stars: increment(-1) } as DocumentData)
  } else {
    // 스타 추가
    await setDoc(starRef, { uid, presetId, starredAt: serverTimestamp() })
    await updateDoc(doc(db(), 'presets', presetId), { stars: increment(1) } as DocumentData)
  }
}

export async function isStarred(presetId: string, uid: string): Promise<boolean> {
  const starRef = doc(db(), 'presetStars', `${uid}_${presetId}`)
  const snapshot = await getDoc(starRef)
  return snapshot.exists()
}

// ─── 적용 횟수 카운트 ────────────────────────────────────────────────────────

export async function incrementApplied(presetId: string): Promise<void> {
  try {
    await updateDoc(doc(db(), 'presets', presetId), {
      appliedCount: increment(1),
    } as DocumentData)
  } catch {
    // 카운트 실패는 무시 (인증 없이도 apply 가능하게)
  }
}
