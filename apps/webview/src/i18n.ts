export type Locale = 'en' | 'ko'

export interface UIStrings {
  // Header
  title: string
  subtitle: string
  // Tabs
  homeTab: string
  settingsTab: string
  previewTab: string
  // Home — file status
  fileStatusTitle: string
  noWorkspace: string
  // Home — actions
  configureBtn: string
  configuringBtn: string
  doneBtn: string
  teamSyncBtn: string
  proLabel: string
  willGenerateTitle: string
  // Settings
  settingsTitle: string
  uiLang: string
  generatedLang: string
  codingStyleTitle: string
  typeStrictness: string
  typeStrict: string
  typeModerate: string
  typeLoose: string
  paradigm: string
  paradigmFunctional: string
  paradigmOop: string
  paradigmMixed: string
  commentStyle: string
  commentNone: string
  commentJsdoc: string
  commentMinimal: string
  agentModeTitle: string
  autonomyLevel: string
  autonomyAskFirst: string
  autonomyProceed: string
  autonomyAutonomous: string
  preReasoning: string
  omissionGuard: string
  saveBtn: string
  savedBtn: string
  // Preview
  previewTitle: string
  previewEmpty: string
  // Skills
  skillsLabel: string
  skillsNote: string
  // Presets tab
  presetsTab: string
  searchPlaceholder: string
  builtInBadge: string
  starsLabel: string
  overridesLabel: string
  usePreset: string
  activePreset: string
  clearPreset: string
  noPresets: string
  selectedPresetLabel: string
  presetReadyNote: string
  // Error
  errorPrefix: string
}

const en: UIStrings = {
  title: 'AI Workspace Configurator',
  subtitle: 'Auto-generate Claude Code & Codex optimization files.',
  homeTab: 'Home',
  settingsTab: 'Settings',
  previewTab: 'Preview',
  fileStatusTitle: 'Config files',
  noWorkspace: 'No workspace open',
  configureBtn: '⚡ Generate Config',
  configuringBtn: 'Scanning…',
  doneBtn: '✓ Done',
  teamSyncBtn: '☁ Team Sync',
  proLabel: 'Pro',
  willGenerateTitle: 'Will generate',
  settingsTitle: 'Settings',
  uiLang: 'UI language',
  generatedLang: 'Generated file language',
  codingStyleTitle: 'Coding Style',
  typeStrictness: 'Type strictness',
  typeStrict: 'Strict',
  typeModerate: 'Moderate',
  typeLoose: 'Loose',
  paradigm: 'Paradigm',
  paradigmFunctional: 'Functional',
  paradigmOop: 'OOP',
  paradigmMixed: 'Mixed',
  commentStyle: 'Comment style',
  commentNone: 'None',
  commentJsdoc: 'JSDoc',
  commentMinimal: 'Minimal',
  agentModeTitle: 'Agent Mode',
  autonomyLevel: 'Autonomy level',
  autonomyAskFirst: 'Ask first',
  autonomyProceed: 'Proceed',
  autonomyAutonomous: 'Autonomous',
  preReasoning: 'Pre-reasoning',
  omissionGuard: 'No-omission guard',
  saveBtn: 'Save Settings',
  savedBtn: '✓ Saved',
  previewTitle: 'Generated Files Preview',
  previewEmpty: 'Run "Generate Config" to see a preview.',
  skillsLabel: '.claude/skills/',
  skillsNote: 'Slash commands (always English)',
  presetsTab: 'Presets',
  searchPlaceholder: 'Search presets…',
  builtInBadge: 'Built-in',
  starsLabel: 'stars',
  overridesLabel: 'overrides',
  usePreset: 'Use Preset',
  activePreset: 'Active',
  clearPreset: 'Clear',
  noPresets: 'No presets found.',
  selectedPresetLabel: 'Active preset',
  presetReadyNote: 'Preset selected — click Generate Config to apply it to your files.',
  errorPrefix: 'Error',
}

const ko: UIStrings = {
  title: 'AI Workspace Configurator',
  subtitle: 'Claude Code & Codex 최적화 파일을 자동으로 생성합니다.',
  homeTab: '홈',
  settingsTab: '설정',
  previewTab: '미리보기',
  fileStatusTitle: '설정 파일',
  noWorkspace: '열려 있는 워크스페이스 없음',
  configureBtn: '⚡ 설정 파일 생성',
  configuringBtn: '스캔 중…',
  doneBtn: '✓ 완료',
  teamSyncBtn: '☁ 팀 동기화',
  proLabel: 'Pro',
  willGenerateTitle: '생성할 파일',
  settingsTitle: '설정',
  uiLang: 'UI 언어',
  generatedLang: '생성 파일 언어',
  codingStyleTitle: '코딩 스타일',
  typeStrictness: '타입 엄격도',
  typeStrict: '엄격',
  typeModerate: '보통',
  typeLoose: '느슨',
  paradigm: '패러다임',
  paradigmFunctional: '함수형',
  paradigmOop: 'OOP',
  paradigmMixed: '혼합',
  commentStyle: '주석 스타일',
  commentNone: '없음',
  commentJsdoc: 'JSDoc',
  commentMinimal: '최소',
  agentModeTitle: '에이전트 모드',
  autonomyLevel: '자율성 수준',
  autonomyAskFirst: '승인 후 진행',
  autonomyProceed: '바로 진행',
  autonomyAutonomous: '완전 자율',
  preReasoning: '사전 추론',
  omissionGuard: '코드 생략 방지',
  saveBtn: '설정 저장',
  savedBtn: '✓ 저장됨',
  previewTitle: '생성 파일 미리보기',
  previewEmpty: '"설정 파일 생성"을 실행하면 여기서 미리볼 수 있습니다.',
  skillsLabel: '.claude/skills/',
  skillsNote: '슬래시 커맨드 (항상 영어)',
  presetsTab: '프리셋',
  searchPlaceholder: '프리셋 검색…',
  builtInBadge: '기본 제공',
  starsLabel: '스타',
  overridesLabel: '덮어쓰기',
  usePreset: '프리셋 사용',
  activePreset: '적용 중',
  clearPreset: '해제',
  noPresets: '검색 결과 없음.',
  selectedPresetLabel: '적용 프리셋',
  presetReadyNote: '프리셋이 선택되었습니다. 설정 파일 생성을 클릭하면 적용됩니다.',
  errorPrefix: '오류',
}

export const UI: Record<Locale, UIStrings> = { en, ko }
export const t = (locale: Locale): UIStrings => UI[locale]
