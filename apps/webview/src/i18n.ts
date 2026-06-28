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
  hintClaude: string
  hintAgents: string
  hintCursor: string
  hintMcp: string
  hintSkills: string
  hintHooks: string
  hintSubPackages: string
  allFilesPresent: string
  // Home — actions
  configureBtn: string
  configuringBtn: string
  doneBtn: string
  willGenerateTitle: string
  // Home — settings link
  settingsHint: string
  goToSettings: string
  // Generate confirm modal
  confirmTitle: string
  confirmDesc: string
  confirmBtn: string
  cancelBtn: string
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
  builtInSection: string
  githubSection: string
  sortedByStars: string
  githubUnavailable: string
  noPresets: string
  activePreset: string
  clearPreset: string
  selectedPresetLabel: string
  presetReadyNote: string
  // Guide tab
  docsTab: string
  tabDescDocs: string
  // Tab descriptions
  tabDescHome: string
  tabDescPresets: string
  tabDescSettings: string
  tabDescPreview: string
  // Tools section in Settings
  toolsTitle: string
  toolsNote: string
  cursorToolLabel: string
  // Preset card extras
  affectsLabel: string
  publishedLabel: string
  // GitHub loading
  githubLoadingLabel: string
  // Home tab cursor optional label
  cursorOptional: string
  // Home tab mandatory file label
  fileMandatory: string
  // Error
  errorPrefix: string
  // Share preset
  shareTitle: string
  shareDesc: string
  shareStep1: string
  shareStep1Detail: string
  shareStep2: string
  shareStep2Detail: string
  shareStep2Link: string
  shareStep3: string
  shareCopyBtn: string
  shareCopiedBtn: string
}

const en: UIStrings = {
  title: 'AI Workspace Configurator',
  subtitle: 'Auto-generate Claude Code & Codex optimization files.',
  homeTab: 'Run',
  settingsTab: 'Settings',
  previewTab: 'Preview',
  fileStatusTitle: 'Config files',
  noWorkspace: 'No workspace open',
  hintClaude: 'Claude Code session memory & coding guidelines',
  hintAgents: 'Multi-agent handoff protocol & task boundaries',
  hintCursor: 'Cursor / Codex inline rules (token-efficient)',
  hintMcp: 'MCP server auto-configuration',
  hintSkills: 'Slash commands  /run  /test  /review …',
  hintHooks: 'Claude Code hooks — rm -rf guard, lint auto-fix',
  hintSubPackages: 'Generate a minimal CLAUDE.md for each sub-package (monorepo detected)',
  allFilesPresent: 'All files present. Re-generate to update.',
  configureBtn: '⚡ Generate Config',
  configuringBtn: 'Scanning…',
  doneBtn: '✓ Done',
  willGenerateTitle: 'Will generate',
  settingsHint: 'Settings shape CLAUDE.md content',
  goToSettings: 'Change settings →',
  confirmTitle: 'Generate Config Files',
  confirmDesc: 'The following files will be written to your workspace:',
  confirmBtn: 'Generate',
  cancelBtn: 'Cancel',
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
  searchPlaceholder: 'Search by name, tag, or author…',
  builtInSection: 'Built-in',
  githubSection: 'GitHub',
  sortedByStars: 'highest stars first',
  githubUnavailable: 'GitHub unavailable — showing built-in presets only.',
  noPresets: 'No results found.',
  activePreset: 'Active',
  clearPreset: 'Clear',
  selectedPresetLabel: 'Active preset',
  presetReadyNote: 'Preset selected — click Generate Config to apply it.',
  docsTab: 'Docs',
  tabDescDocs: 'How each generated file works and tips for effective AI collaboration.',
  tabDescHome: 'Select files to generate, then run the AI workspace configuration.',
  tabDescPresets: 'Apply pre-built rule templates. Browse built-in or GitHub community presets.',
  tabDescSettings: 'Customize coding style, agent behavior, and tools. Settings affect CLAUDE.md content.',
  tabDescPreview: 'Preview the last generated configuration files.',
  toolsTitle: 'Tools  (Optional)',
  toolsNote: 'Only selected tools will have config files generated.',
  cursorToolLabel: 'Cursor AI  (.cursorrules)',
  affectsLabel: 'Overwrites:',
  publishedLabel: 'Added',
  githubLoadingLabel: 'Loading community presets…',
  cursorOptional: 'Optional',
  fileMandatory: 'Required',
  errorPrefix: 'Error',
  shareTitle: 'Share your config',
  shareDesc: 'Your preset will appear in this list for everyone using this extension.',
  shareStep1: '① Public GitHub repo',
  shareStep1Detail: 'Create a repo containing CLAUDE.md, AGENTS.md, or .cursorrules with your rules.',
  shareStep2: '② Add the topic',
  shareStep2Detail: 'Go to your repo → About → Topics and add:',
  shareStep2Link: 'Open GitHub Topics docs →',
  shareStep3: '③ Copy a README template',
  shareCopyBtn: 'Copy README template',
  shareCopiedBtn: '✓ Copied',
}

const ko: UIStrings = {
  title: 'AI Workspace Configurator',
  subtitle: 'Claude Code & Codex 최적화 파일을 자동으로 생성합니다.',
  homeTab: '실행',
  settingsTab: '설정',
  previewTab: '미리보기',
  fileStatusTitle: '설정 파일',
  noWorkspace: '열려 있는 워크스페이스 없음',
  hintClaude: 'Claude Code 세션 메모리 & 코딩 가이드라인',
  hintAgents: '멀티에이전트 핸드오프 프로토콜 & 역할 경계',
  hintCursor: 'Cursor / Codex 인라인 규칙 (토큰 절약형)',
  hintMcp: 'MCP 서버 자동 설정',
  hintSkills: '슬래시 커맨드  /run  /test  /review …',
  hintHooks: 'Claude Code 훅 — rm -rf 차단, 린트 자동 수정',
  hintSubPackages: '서브패키지별 최소 CLAUDE.md 생성 (모노레포 감지됨)',
  allFilesPresent: '모든 파일 존재. 재생성하면 업데이트됩니다.',
  configureBtn: '⚡ 설정 파일 생성',
  configuringBtn: '스캔 중…',
  doneBtn: '✓ 완료',
  willGenerateTitle: '생성할 파일',
  settingsHint: '설정값이 CLAUDE.md 내용에 반영됩니다',
  goToSettings: '설정 변경 →',
  confirmTitle: '설정 파일 생성',
  confirmDesc: '다음 파일이 워크스페이스에 작성됩니다:',
  confirmBtn: '생성',
  cancelBtn: '취소',
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
  searchPlaceholder: '이름, 태그, 작성자로 검색…',
  builtInSection: '기본 제공',
  githubSection: 'GitHub',
  sortedByStars: '별점 높은 순',
  githubUnavailable: 'GitHub 연결 불가 — 기본 프리셋만 표시됩니다.',
  noPresets: '검색 결과 없음.',
  activePreset: '적용 중',
  clearPreset: '해제',
  selectedPresetLabel: '적용 프리셋',
  presetReadyNote: '프리셋 선택됨 — 설정 파일 생성을 클릭하면 적용됩니다.',
  docsTab: '문서',
  tabDescDocs: '생성된 각 파일의 역할과 AI와 효과적으로 협업하는 방법을 알아보세요.',
  tabDescHome: '생성할 파일을 선택하고 AI 워크스페이스 설정을 실행합니다.',
  tabDescPresets: '프리셋 템플릿을 적용하세요. 기본 제공 또는 GitHub 커뮤니티 프리셋을 탐색하세요.',
  tabDescSettings: '코딩 스타일, 에이전트 동작, 도구를 커스터마이즈하세요. 설정값은 CLAUDE.md 내용에 반영됩니다.',
  tabDescPreview: '마지막으로 생성된 설정 파일을 미리봅니다.',
  toolsTitle: '사용 도구  (선택사항)',
  toolsNote: '선택한 도구만 설정 파일이 생성됩니다.',
  cursorToolLabel: 'Cursor AI  (.cursorrules)',
  affectsLabel: '덮어씀:',
  publishedLabel: '추가됨',
  githubLoadingLabel: '커뮤니티 프리셋 불러오는 중…',
  cursorOptional: '선택사항',
  fileMandatory: '필수',
  errorPrefix: '오류',
  shareTitle: '내 설정 공유하기',
  shareDesc: '이 목록에 등록되면 이 확장 프로그램 사용자 누구나 내 프리셋을 가져올 수 있습니다.',
  shareStep1: '① 공개 GitHub 레포',
  shareStep1Detail: 'CLAUDE.md, AGENTS.md, 또는 .cursorrules를 포함한 공개 레포를 만드세요.',
  shareStep2: '② 토픽 추가',
  shareStep2Detail: '레포 → About → Topics에 아래 토픽을 추가하세요:',
  shareStep2Link: 'GitHub Topics 설명 보기 →',
  shareStep3: '③ README 템플릿 복사',
  shareCopyBtn: 'README 템플릿 복사',
  shareCopiedBtn: '✓ 복사됨',
}

export const UI: Record<Locale, UIStrings> = { en, ko }
export const t = (locale: Locale): UIStrings => UI[locale]
