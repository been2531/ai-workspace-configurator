# Security Policy

## Supported Versions

| Version | Supported |
| ------- | --------- |
| latest (master) | ✅ |

## Reporting a Vulnerability

보안 취약점을 발견하셨다면 **GitHub Issues에 공개하지 말고** 아래 방법으로 제보해 주세요.

**이메일:** daily25310@gmail.com  
**제목 형식:** `[SECURITY] <한 줄 요약>`

제보 후 72시간 이내에 확인 메일을 드립니다. 패치 완료 후 제보자를 CHANGELOG에 기록합니다 (원하시는 경우).

## Scope

### In Scope
- Firestore Security Rules 우회
- Firebase Auth 관련 취약점
- CLI / MCP 서버의 민감 정보 노출
- Cloudflare Workers LLM 프록시 인증 우회

### Out of Scope
- 이미 알려진 third-party 라이브러리 취약점 (Dependabot이 관리)
- Firebase 플랫폼 자체의 취약점 (Google에 직접 제보)

## Security Design Notes

- **Firebase Web API Key** (`AIzaSy...`): 공개 설계된 값입니다. 보안은 Firestore Security Rules로 처리합니다. ([Firebase 공식 문서](https://firebase.google.com/docs/projects/api-keys))
- **LLM API Key**: Cloudflare Workers 환경변수에만 존재하며 클라이언트로 절대 노출되지 않습니다.
- **service-account.json**: `.gitignore`로 보호되며 git 히스토리에 존재하지 않습니다.
