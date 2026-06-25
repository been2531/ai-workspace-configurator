/**
 * End-to-end 테스트: signup → publish → search → star → apply
 */
import { initializeApp as initAdmin, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { initializeApp } from 'firebase/app'
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  deleteUser,
} from 'firebase/auth'
import {
  getFirestore as getClientFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
  increment,
} from 'firebase/firestore'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const serviceAccount = require('../service-account.json')

// Admin SDK (Firestore 검증 전용 — Auth는 Client SDK 사용)
initAdmin({ credential: cert(serviceAccount) })
const adminDb = getFirestore()

// Client SDK
const clientApp = initializeApp({
  apiKey:            'AIzaSyDzJaOqjPshPFJ4_6ES5AVmlthzPgokzFA',
  authDomain:        'ai-workspace-configurator.firebaseapp.com',
  projectId:         'ai-workspace-configurator',
  storageBucket:     'ai-workspace-configurator.firebasestorage.app',
  messagingSenderId: '1039429232744',
  appId:             '1:1039429232744:web:99d3686654de3e347f33dd',
})
const clientAuth = getAuth(clientApp)
const clientDb = getClientFirestore(clientApp)

const TEST_EMAIL = `test-${Date.now()}@ai-workspace-test.dev`
const TEST_PASSWORD = 'Test1234!'

let pass = 0
let fail = 0

const ok  = (label) => { console.log(`  ✅ ${label}`); pass++ }
const err = (label, e) => { console.log(`  ❌ ${label}: ${e.message}`); fail++ }

async function run() {
  console.log('\n━━━ AI Workspace E2E 테스트 ━━━\n')
  let user = null
  let publishedDocId = null

  // ── 1. 회원가입 ────────────────────────────────────────────────────────────
  console.log('① 회원가입')
  try {
    const cred = await createUserWithEmailAndPassword(clientAuth, TEST_EMAIL, TEST_PASSWORD)
    user = cred.user
    ok(`계정 생성 — uid: ${user.uid}`)
  } catch (e) { err('회원가입', e); return cleanup(user, publishedDocId) }

  // ── 2. 재로그인 ────────────────────────────────────────────────────────────
  console.log('\n② 로그인')
  try {
    const cred = await signInWithEmailAndPassword(clientAuth, TEST_EMAIL, TEST_PASSWORD)
    const idToken = await cred.user.getIdToken()
    ok(`로그인 — token: ${idToken.slice(0, 24)}...`)
  } catch (e) { err('로그인', e) }

  // ── 3. 퍼블리시 ────────────────────────────────────────────────────────────
  console.log('\n③ 프리셋 퍼블리시')
  try {
    const docRef = await addDoc(collection(clientDb, 'presets'), {
      name: 'E2E Test Preset',
      author: 'e2e-tester',
      authorUid: user.uid,
      description: 'E2E 테스트용 프리셋.',
      tags: ['test', 'e2e'],
      overrides: { agentsMd: '# Test\n\n테스트 에이전트 지침\n' },
      stars: 0,
      appliedCount: 0,
      isPublic: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    publishedDocId = docRef.id
    ok(`퍼블리시 완료 — ${publishedDocId}`)
  } catch (e) { err('퍼블리시', e) }

  // ── 4. 검색 ────────────────────────────────────────────────────────────────
  console.log('\n④ 태그 검색')
  try {
    const q = query(
      collection(clientDb, 'presets'),
      where('isPublic', '==', true),
      where('tags', 'array-contains', 'e2e'),
      orderBy('stars', 'desc'),
      limit(5),
    )
    const snap = await getDocs(q)
    const found = snap.docs.find(d => d.id === publishedDocId)
    if (found) ok(`검색 결과에 포함 — "${found.data().name}"`)
    else err('검색', new Error('퍼블리시한 프리셋이 없음'))
  } catch (e) { err('검색', e) }

  // ── 5. 스타 추가 ───────────────────────────────────────────────────────────
  console.log('\n⑤ 스타 추가')
  if (publishedDocId) {
    try {
      const starId = `${user.uid}_${publishedDocId}`
      await setDoc(doc(clientDb, 'presetStars', starId), {
        uid: user.uid,
        presetId: publishedDocId,
        starredAt: serverTimestamp(),
      })
      await updateDoc(doc(clientDb, 'presets', publishedDocId), { stars: increment(1) })
      ok('스타 추가')
    } catch (e) { err('스타 추가', e) }

    // ── 6. Admin 검증 ───────────────────────────────────────────────────────
    console.log('\n⑥ Admin SDK 검증')
    try {
      const presetSnap = await adminDb.collection('presets').doc(publishedDocId).get()
      const stars = presetSnap.data().stars
      stars === 1 ? ok(`stars === 1`) : err('stars', new Error(`기대 1, 실제 ${stars}`))

      const starSnap = await adminDb.collection('presetStars').doc(`${user.uid}_${publishedDocId}`).get()
      starSnap.exists ? ok('presetStars 도큐먼트 존재') : err('presetStars', new Error('없음'))
    } catch (e) { err('Admin 검증', e) }

    // ── 7. 스타 취소 ────────────────────────────────────────────────────────
    console.log('\n⑦ 스타 취소')
    try {
      await deleteDoc(doc(clientDb, 'presetStars', `${user.uid}_${publishedDocId}`))
      await updateDoc(doc(clientDb, 'presets', publishedDocId), { stars: increment(-1) })
      const snap = await adminDb.collection('presets').doc(publishedDocId).get()
      const stars = snap.data().stars
      stars === 0 ? ok(`취소 후 stars === 0`) : err('스타 취소', new Error(`stars = ${stars}`))
    } catch (e) { err('스타 취소', e) }
  }

  await cleanup(user, publishedDocId)
}

async function cleanup(user, publishedDocId) {
  console.log('\n🧹 테스트 데이터 정리...')
  try {
    if (publishedDocId) {
      await adminDb.collection('presets').doc(publishedDocId).delete()
      ok('테스트 프리셋 삭제')
    }
    // Client SDK로 현재 로그인 유저 삭제 (admin/auth 의존성 제거)
    if (user) {
      await deleteUser(user)
      ok('테스트 계정 삭제')
    }
  } catch (e) {
    console.log(`  ⚠ 정리 오류 (무시): ${e.message}`)
  }

  console.log(`\n━━━ 결과: ${pass} passed / ${fail} failed ━━━\n`)
  process.exit(fail > 0 ? 1 : 0)
}

run().catch(e => { console.error('예상치 못한 오류:', e.message); process.exit(1) })
