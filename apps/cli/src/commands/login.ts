import * as p from '@clack/prompts'
import { loginWithEmail, signUpWithEmail, getStoredUser, logout } from '../firebase/auth'
import { isFirebaseConfigured } from '../firebase/config'

export async function loginCommand(): Promise<void> {
  p.intro('AI Workspace — 로그인')

  if (!isFirebaseConfigured()) {
    p.log.error('Firebase가 설정되지 않았습니다.')
    p.log.info('환경변수 FIREBASE_API_KEY, FIREBASE_PROJECT_ID 등을 설정해주세요.')
    process.exit(1)
  }

  const existing = getStoredUser()
  if (existing) {
    p.log.success(`이미 로그인됨: ${existing.email}`)
    const relogin = await p.confirm({ message: '다시 로그인하시겠습니까?' })
    if (p.isCancel(relogin) || !relogin) { p.outro('취소'); return }
    await logout()
  }

  const mode = await p.select({
    message: '계정이 있으신가요?',
    options: [
      { value: 'login', label: '로그인 (기존 계정)' },
      { value: 'signup', label: '회원가입 (새 계정)' },
    ],
  })
  if (p.isCancel(mode)) { p.cancel('취소'); return }

  const email = await p.text({
    message: '이메일',
    validate: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? undefined : '유효한 이메일을 입력하세요'),
  })
  if (p.isCancel(email)) { p.cancel('취소'); return }

  const password = await p.password({
    message: '비밀번호',
    validate: (v) => (v.length >= 6 ? undefined : '비밀번호는 6자 이상이어야 합니다'),
  })
  if (p.isCancel(password)) { p.cancel('취소'); return }

  const spinner = p.spinner()
  spinner.start(mode === 'login' ? '로그인 중...' : '계정 생성 중...')

  try {
    const { user } =
      mode === 'login'
        ? await loginWithEmail(email as string, password as string)
        : await signUpWithEmail(email as string, password as string)

    spinner.stop(`완료!`)
    p.outro(`환영합니다, ${user.email} — 이제 프리셋을 퍼블리시하고 스타를 남길 수 있습니다.`)
  } catch (err: unknown) {
    spinner.stop('실패')
    const code = (err as { code?: string }).code ?? ''
    if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
      p.log.error('이메일 또는 비밀번호가 올바르지 않습니다.')
    } else if (code === 'auth/email-already-in-use') {
      p.log.error('이미 사용 중인 이메일입니다.')
    } else {
      p.log.error(`오류: ${code || String(err)}`)
    }
    process.exit(1)
  }
}

export async function logoutCommand(): Promise<void> {
  p.intro('AI Workspace — 로그아웃')
  const user = getStoredUser()
  if (!user) { p.log.warn('로그인 상태가 아닙니다.'); return }
  await logout()
  p.outro(`${user.email} 로그아웃 완료`)
}
