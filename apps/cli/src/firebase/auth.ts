import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth'
import { getFirebaseApp } from './config'

const AUTH_PATH = path.join(os.homedir(), '.ai-workspace', 'auth.json')

interface StoredAuth {
  uid: string
  email: string
  displayName: string | null
  idToken: string
  expiresAt: number
}

export function loadStoredAuth(): StoredAuth | null {
  try {
    if (!fs.existsSync(AUTH_PATH)) return null
    const stored = JSON.parse(fs.readFileSync(AUTH_PATH, 'utf-8')) as StoredAuth
    // 토큰 만료 확인 (Firebase ID 토큰은 1시간)
    if (Date.now() > stored.expiresAt) return null
    return stored
  } catch {
    return null
  }
}

function saveAuth(user: User, idToken: string): void {
  const dir = path.dirname(AUTH_PATH)
  fs.mkdirSync(dir, { recursive: true })
  const stored: StoredAuth = {
    uid: user.uid,
    email: user.email ?? '',
    displayName: user.displayName,
    idToken,
    expiresAt: Date.now() + 55 * 60 * 1000,
  }
  fs.writeFileSync(AUTH_PATH, JSON.stringify(stored, null, 2), 'utf-8')
  // Unix에서 토큰 파일을 소유자만 읽을 수 있도록 (Windows는 무시)
  try { fs.chmodSync(AUTH_PATH, 0o600) } catch { /* Windows */ }
}

export async function loginWithEmail(
  email: string,
  password: string,
): Promise<{ user: User; idToken: string }> {
  const auth = getAuth(getFirebaseApp())
  const credential = await signInWithEmailAndPassword(auth, email, password)
  const idToken = await credential.user.getIdToken()
  saveAuth(credential.user, idToken)
  return { user: credential.user, idToken }
}

export async function signUpWithEmail(
  email: string,
  password: string,
): Promise<{ user: User; idToken: string }> {
  const auth = getAuth(getFirebaseApp())
  const credential = await createUserWithEmailAndPassword(auth, email, password)
  const idToken = await credential.user.getIdToken()
  saveAuth(credential.user, idToken)
  return { user: credential.user, idToken }
}

export async function logout(): Promise<void> {
  const auth = getAuth(getFirebaseApp())
  await signOut(auth)
  if (fs.existsSync(AUTH_PATH)) fs.unlinkSync(AUTH_PATH)
}

export function getStoredUser(): { uid: string; email: string; displayName: string | null } | null {
  const stored = loadStoredAuth()
  if (!stored) return null
  return { uid: stored.uid, email: stored.email, displayName: stored.displayName }
}
