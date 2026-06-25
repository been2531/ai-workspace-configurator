import type { ComposeInput } from '../types'

export function buildClaudeMd({ stack, profile }: ComposeInput): string {
  const { language, frameworks, packageManager } = stack
  const fw = frameworks.join(', ') || language

  const typeRule =
    profile?.codingStyle.typeStrictness === 'strict'
      ? '- `any` 금지. 불확실한 타입은 `unknown` + narrowing.'
      : profile?.codingStyle.typeStrictness === 'moderate'
        ? '- `any`는 외부 API 경계에서만 허용.'
        : '- 타입은 필요한 곳에 명시.'

  const paradigmRule =
    profile?.codingStyle.paradigm === 'functional'
      ? '- 순수 함수 우선. 사이드이펙트는 경계로 격리.'
      : profile?.codingStyle.paradigm === 'oop'
        ? '- 클래스 기반 캡슐화. 단일 책임 원칙.'
        : '- 함수형/OOP 혼용. 컨텍스트에 맞게 선택.'

  const commentRule =
    profile?.codingStyle.commentStyle === 'none'
      ? '- 주석 금지. 코드가 스스로 설명하게.'
      : profile?.codingStyle.commentStyle === 'jsdoc'
        ? '- public API는 JSDoc 필수. 내부 로직은 WHY만.'
        : '- 주석은 WHY만. WHAT은 코드 자체가 설명.'

  return `# 프로젝트 가이드라인

## 기술 스택
- **언어**: ${language}
- **프레임워크**: ${fw || '미감지'}
- **패키지 매니저**: ${packageManager}

## 빌드 명령어
${buildCommands(stack)}

## 코드 규칙

### 타이핑
${typeRule}
- 모든 public API 타입은 명시적으로 정의.

### 패러다임
${paradigmRule}

### 주석
${commentRule}

### 보안
- API 키는 환경변수로만. 코드 하드코딩 절대 금지.
- 사용자 입력은 시스템 경계에서만 검증.
${frameworkRules(stack)}
`
}

function buildCommands({ manifests, frameworks, packageManager }: ComposeInput['stack']): string {
  const pm = packageManager === 'pnpm' ? 'pnpm' : packageManager === 'yarn' ? 'yarn' : 'npm'

  if (manifests.includes('package.json')) {
    const hasDev = frameworks.some((f) => ['Vite', 'Next.js', 'React', 'Vue'].includes(f))
    return `\`\`\`bash
${hasDev ? `${pm} run dev      # 개발 서버\n` : ''}\
${pm} run build    # 프로덕션 빌드
${pm} run lint     # 린트
${pm} test         # 테스트
\`\`\``
  }

  if (manifests.includes('pom.xml')) {
    return `\`\`\`bash
./mvnw spring-boot:run   # 개발 서버
./mvnw package           # 빌드
./mvnw test              # 테스트
\`\`\``
  }

  if (
    manifests.includes('requirements.txt') ||
    manifests.includes('pyproject.toml') ||
    manifests.includes('Pipfile')
  ) {
    const isDjango = frameworks.includes('Django')
    const isFastApi = frameworks.includes('FastAPI')
    if (isDjango) {
      return `\`\`\`bash
python manage.py runserver   # 개발 서버
python manage.py test        # 테스트
\`\`\``
    }
    if (isFastApi) {
      return `\`\`\`bash
uvicorn main:app --reload    # 개발 서버
pytest                       # 테스트
\`\`\``
    }
    return `\`\`\`bash
python -m flask run          # 개발 서버 (Flask)
pytest                       # 테스트
\`\`\``
  }

  if (manifests.includes('Cargo.toml')) {
    return `\`\`\`bash
cargo run       # 실행
cargo build     # 빌드
cargo test      # 테스트
\`\`\``
  }

  if (manifests.includes('go.mod')) {
    return `\`\`\`bash
go run .        # 실행
go build .      # 빌드
go test ./...   # 테스트
\`\`\``
  }

  return '빌드 명령어를 직접 입력해주세요.'
}

function frameworkRules({ frameworks }: ComposeInput['stack']): string {
  const rules: string[] = []

  if (frameworks.includes('Next.js')) {
    rules.push(
      '\n### Next.js\n- Server / Client Component 경계를 명확히.\n- 환경변수는 `NEXT_PUBLIC_` 규칙 준수.\n- 데이터 페칭은 Server Component 우선.',
    )
  } else if (frameworks.includes('React')) {
    rules.push(
      '\n### React\n- 함수형 컴포넌트 + Hooks만 사용.\n- 사이드이펙트는 `useEffect`로 격리.\n- 150줄 초과 컴포넌트는 분리.',
    )
  }

  if (frameworks.includes('Vue')) {
    rules.push(
      '\n### Vue\n- Composition API 사용.\n- `<script setup>` 권장.',
    )
  }

  if (frameworks.includes('NestJS')) {
    rules.push(
      '\n### NestJS\n- 모듈 단위 캡슐화.\n- 서비스 레이어에서만 비즈니스 로직.',
    )
  }

  if (frameworks.includes('Firebase')) {
    rules.push(
      '\n### Firebase\n- SDK 직접 호출은 `services/firebase.ts`에서만.\n- 컴포넌트에서 직접 호출 금지.',
    )
  }

  if (frameworks.includes('Prisma') || frameworks.includes('Drizzle')) {
    const orm = frameworks.includes('Prisma') ? 'Prisma' : 'Drizzle'
    rules.push(
      `\n### ${orm}\n- DB 접근은 전용 repository 레이어로 격리.\n- 마이그레이션 파일은 직접 편집 금지.`,
    )
  }

  return rules.join('\n')
}
