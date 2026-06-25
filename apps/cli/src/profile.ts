import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import type { UserProfile } from '@ai-workspace-configurator/core'
import { DEFAULT_PROFILE } from '@ai-workspace-configurator/core'

const PROFILE_DIR = path.join(os.homedir(), '.ai-workspace')
const PROFILE_PATH = path.join(PROFILE_DIR, 'profile.json')

export function loadProfile(): UserProfile {
  try {
    if (fs.existsSync(PROFILE_PATH)) {
      return JSON.parse(fs.readFileSync(PROFILE_PATH, 'utf-8')) as UserProfile
    }
  } catch {
    // 손상된 프로필이면 기본값 사용
  }
  return DEFAULT_PROFILE
}

export function saveProfile(profile: UserProfile): void {
  fs.mkdirSync(PROFILE_DIR, { recursive: true })
  fs.writeFileSync(PROFILE_PATH, JSON.stringify(profile, null, 2), 'utf-8')
}

export function profileExists(): boolean {
  return fs.existsSync(PROFILE_PATH)
}
