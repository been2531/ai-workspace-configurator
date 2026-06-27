import { useState, useEffect, useRef } from 'react'
import { DEFAULT_PROFILE } from '@ai-workspace-configurator/core'
import type {
  UserProfile,
  FileStatus,
  GeneratedPreview,
  ExtensionMessage,
  PresetSummary,
} from '@ai-workspace-configurator/core'
import { t } from './i18n'
import type { Locale } from './i18n'
import GuideTab from './GuideTab'

declare function acquireVsCodeApi(): { postMessage: (msg: unknown) => void }
const vscodeApi =
  typeof acquireVsCodeApi !== 'undefined' ? acquireVsCodeApi() : null
const postMessage = (msg: unknown) => vscodeApi?.postMessage(msg)

type Tab = 'home' | 'presets' | 'settings' | 'preview' | 'guide'
type Status = 'idle' | 'scanning' | 'done' | 'error'
type PreviewFile = 'claudeMd' | 'agentsMd' | 'cursorRules' | 'mcpConfig' | 'skills'

const DEFAULT_FILE_STATUS: FileStatus = { claude: false, agents: false, cursor: false, mcp: false, skills: false }
const STATIC_PREVIEW_FILES: { key: PreviewFile; label: string }[] = [
  { key: 'claudeMd', label: 'CLAUDE.md' },
  { key: 'agentsMd', label: 'AGENTS.md' },
  { key: 'cursorRules', label: '.cursorrules' },
  { key: 'mcpConfig', label: '.mcp.json' },
]

export default function App() {
  const [locale, setLocale] = useState<Locale>('en')
  const [tab, setTab] = useState<Tab>('home')
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState<string>()
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE)
  const [fileStatus, setFileStatus] = useState<FileStatus>(DEFAULT_FILE_STATUS)
  const [preview, setPreview] = useState<GeneratedPreview | null>(null)
  const [previewFile, setPreviewFile] = useState<PreviewFile>('claudeMd')
  const [previewSkill, setPreviewSkill] = useState<string>('')
  const [settingsSaved, setSettingsSaved] = useState(false)
  const [fileSelection, setFileSelection] = useState({ mcp: true, skills: true })
  const [presets, setPresets] = useState<PresetSummary[]>([])
  const [selectedPreset, setSelectedPreset] = useState<{ id: string; name: string } | null>(null)
  const [pendingPresetId, setPendingPresetId] = useState<string | null>(null)
  const [presetQuery, setPresetQuery] = useState('')
  const [presetsLoading, setPresetsLoading] = useState(false)
  const presetsLoadedRef = useRef(false)
  const searchTimerRef = useRef<ReturnType<typeof setTimeout>>()

  const s = t(locale)

  useEffect(() => {
    postMessage({ command: 'ready' })

    const handler = (event: MessageEvent) => {
      const msg = event.data as ExtensionMessage
      switch (msg.type) {
        case 'init':
          setProfile(msg.payload.profile)
          setLocale(msg.payload.profile.locale ?? 'en')
          setFileStatus(msg.payload.fileStatus)
          setSelectedPreset(msg.payload.selectedPreset)
          break
        case 'configured':
          if (msg.payload.success) {
            setStatus('done')
            setFileStatus(msg.payload.fileStatus)
            setPreview(msg.payload.preview)
            const firstSkill = Object.keys(msg.payload.preview.skills)[0] ?? ''
            setPreviewSkill(firstSkill)
            setTab('preview')
          } else {
            setStatus('error')
            setErrorMsg(msg.payload.error)
          }
          break
        case 'presetsResult':
          setPresets(msg.payload)
          setPresetsLoading(false)
          break
        case 'presetApplied':
          setSelectedPreset(msg.payload)
          setPendingPresetId(null)
          break
      }
    }

    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])

  function handleTabChange(newTab: Tab) {
    setTab(newTab)
    if (newTab === 'presets' && !presetsLoadedRef.current) {
      presetsLoadedRef.current = true
      setPresetsLoading(true)
      postMessage({ command: 'searchPresets', query: '' })
    }
  }

  function handleConfigure() {
    // Auto-save current settings so re-configuration always uses the latest selections
    const updated: UserProfile = { ...profile, locale }
    setProfile(updated)
    postMessage({ command: 'saveProfile', payload: updated })
    setStatus('scanning')
    setErrorMsg(undefined)
    postMessage({ command: 'configure', fileSelection })
  }

  function handleSaveSettings() {
    const updated: UserProfile = { ...profile, locale }
    setProfile(updated)
    postMessage({ command: 'saveProfile', payload: updated })
    setSettingsSaved(true)
    setTimeout(() => setSettingsSaved(false), 2000)
  }

  function handlePresetSearch(q: string) {
    setPresetQuery(q)
    clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(() => {
      setPresetsLoading(true)
      postMessage({ command: 'searchPresets', query: q })
    }, 400)
  }

  function handlePresetSelect(presetId: string | null) {
    if (presetId) setPendingPresetId(presetId)
    else setPendingPresetId(null)
    postMessage({ command: 'selectPreset', presetId })
  }

  function setProfileField<K extends keyof UserProfile>(key: K, value: UserProfile[K]) {
    setProfile((p) => ({ ...p, [key]: value }))
  }

  function setCodingStyle<K extends keyof UserProfile['codingStyle']>(
    key: K,
    value: UserProfile['codingStyle'][K],
  ) {
    setProfile((p) => ({ ...p, codingStyle: { ...p.codingStyle, [key]: value } }))
  }

  function setAgentMode<K extends keyof UserProfile['agentMode']>(
    key: K,
    value: UserProfile['agentMode'][K],
  ) {
    setProfile((p) => ({ ...p, agentMode: { ...p.agentMode, [key]: value } }))
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col text-sm">
      {/* Header */}
      <header className="px-5 pt-5 pb-3 flex items-start justify-between">
        <div>
          <h1 className="text-base font-bold tracking-tight leading-tight">{s.title}</h1>
          <p className="text-xs text-gray-500 mt-0.5">{s.subtitle}</p>
        </div>
        <div className="flex gap-1 mt-0.5 shrink-0">
          {(['en', 'ko'] as Locale[]).map((loc) => (
            <button
              key={loc}
              onClick={() => setLocale(loc)}
              className={`px-2 py-0.5 rounded text-xs font-semibold transition-colors ${
                locale === loc
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {loc.toUpperCase()}
            </button>
          ))}
        </div>
      </header>

      {/* Tab bar */}
      <nav className="flex border-b border-white/8 px-5">
        {([
          ['home', s.homeTab],
          ['presets', s.presetsTab],
          ['settings', s.settingsTab],
          ['preview', s.previewTab],
          ['guide', s.guideTab],
        ] as [Tab, string][]).map(([id, label]) => (
          <button
            key={id}
            onClick={() => handleTabChange(id)}
            className={`px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors ${
              tab === id
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            {label}
            {id === 'preview' && preview && (
              <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-indigo-400 align-middle" />
            )}
            {id === 'presets' && selectedPreset && (
              <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 align-middle" />
            )}
          </button>
        ))}
      </nav>

      {/* Tab description */}
      <div className="px-5 pt-2 pb-0">
        <p className="text-[11px] text-gray-600 leading-snug">
          {tab === 'home' ? s.tabDescHome
            : tab === 'presets' ? s.tabDescPresets
            : tab === 'settings' ? s.tabDescSettings
            : tab === 'guide' ? s.tabDescGuide
            : s.tabDescPreview}
        </p>
      </div>

      {/* Content */}
      <main className="flex-1 px-5 py-4 overflow-y-auto">
        {tab === 'home' && (
          <HomeTab
            s={s}
            status={status}
            errorMsg={errorMsg}
            fileStatus={fileStatus}
            selectedPreset={selectedPreset}
            cursorEnabled={profile.tools?.cursor ?? false}
            fileSelection={fileSelection}
            onFileSelectionChange={setFileSelection}
            onConfigure={handleConfigure}
            onGoToPresets={() => handleTabChange('presets')}
          />
        )}
        {tab === 'settings' && (
          <SettingsTab
            s={s}
            locale={locale}
            profile={profile}
            settingsSaved={settingsSaved}
            onLocaleChange={setLocale}
            onGeneratedLocaleChange={(loc) => setProfileField('generatedLocale', loc)}
            onCodingStyle={setCodingStyle}
            onAgentMode={setAgentMode}
            onTools={(tools) => setProfileField('tools', tools)}
            onSave={handleSaveSettings}
          />
        )}
        {tab === 'preview' && (
          <PreviewTab
            s={s}
            preview={preview}
            previewFile={previewFile}
            previewSkill={previewSkill}
            onFileChange={setPreviewFile}
            onSkillChange={setPreviewSkill}
          />
        )}
        {tab === 'guide' && (
          <GuideTab locale={locale} />
        )}
        {tab === 'presets' && (
          <PresetsTab
            s={s}
            presets={presets}
            selectedPreset={selectedPreset}
            pendingPresetId={pendingPresetId}
            searchQuery={presetQuery}
            presetsLoading={presetsLoading}
            onSearch={handlePresetSearch}
            onSelect={handlePresetSelect}
            onGenerate={handleConfigure}
          />
        )}
      </main>
    </div>
  )
}

// ─── Home Tab ────────────────────────────────────────────────────────────────

type FileRowKind = 'mandatory' | 'optional-toggle' | 'optional-cursor'

type FileRowEntry =
  | { kind: 'mandatory'; label: string; hint: string; exists: boolean }
  | { kind: 'optional-toggle'; label: string; hint: string; exists: boolean; selKey: 'mcp' | 'skills'; checked: boolean }
  | { kind: 'optional-cursor'; label: string; hint: string; exists: boolean; active: boolean }

interface HomeTabProps {
  s: ReturnType<typeof t>
  status: Status
  errorMsg: string | undefined
  fileStatus: FileStatus
  selectedPreset: { id: string; name: string } | null
  cursorEnabled: boolean
  fileSelection: { mcp: boolean; skills: boolean }
  onFileSelectionChange: (sel: { mcp: boolean; skills: boolean }) => void
  onConfigure: () => void
  onGoToPresets: () => void
}

function HomeTab({ s, status, errorMsg, fileStatus, selectedPreset, cursorEnabled, fileSelection, onFileSelectionChange, onConfigure, onGoToPresets }: HomeTabProps) {
  const fileRows: FileRowEntry[] = [
    { kind: 'mandatory', label: 'CLAUDE.md', hint: s.hintClaude, exists: fileStatus.claude },
    { kind: 'mandatory', label: 'AGENTS.md', hint: s.hintAgents, exists: fileStatus.agents },
    { kind: 'optional-toggle', label: '.mcp.json', hint: s.hintMcp, exists: fileStatus.mcp, selKey: 'mcp', checked: fileSelection.mcp },
    { kind: 'optional-toggle', label: s.skillsLabel, hint: s.hintSkills, exists: fileStatus.skills, selKey: 'skills', checked: fileSelection.skills },
    { kind: 'optional-cursor', label: '.cursorrules', hint: s.hintCursor, exists: fileStatus.cursor, active: cursorEnabled },
  ]

  const allExist = fileRows.every((f) => f.exists)

  return (
    <div className="space-y-4">
      {/* Active preset banner */}
      {selectedPreset && (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-emerald-800/50 bg-emerald-950/25 cursor-pointer hover:bg-emerald-950/40 transition-colors"
          onClick={onGoToPresets}
        >
          <span className="text-emerald-400 text-[10px]">●</span>
          <span className="text-xs text-emerald-300 font-medium">{s.selectedPresetLabel}:</span>
          <span className="text-xs text-emerald-200">{selectedPreset.name}</span>
        </div>
      )}

      {/* File status */}
      <section>
        <p className="text-[10px] text-gray-600 font-semibold mb-2 uppercase tracking-widest">
          {s.fileStatusTitle}
        </p>
        <div className="border border-white/6 rounded-xl overflow-hidden divide-y divide-white/[0.04]">
          {fileRows.map((row) => (
            <div
              key={row.label}
              className={`flex items-center gap-2 px-3 py-2.5 transition-colors ${
                row.exists ? 'bg-emerald-950/20' : 'bg-transparent'
              }`}
            >
              {/* Left control: locked checkbox (mandatory) or interactive checkbox (optional-toggle) or spacer */}
              {row.kind === 'mandatory' ? (
                <div
                  title={s.fileMandatory}
                  className="w-4 h-4 rounded-sm border border-gray-600/30 bg-gray-700/20 flex items-center justify-center shrink-0 cursor-not-allowed"
                >
                  <span className="text-gray-500 text-[9px] leading-none select-none">✓</span>
                </div>
              ) : row.kind === 'optional-toggle' ? (
                <button
                  onClick={() => onFileSelectionChange({ ...fileSelection, [row.selKey]: !row.checked })}
                  title={row.checked ? 'Will generate — click to skip' : 'Skipped — click to include'}
                  className={`w-4 h-4 rounded-sm border flex items-center justify-center shrink-0 transition-colors ${
                    row.checked
                      ? 'border-indigo-400/60 bg-indigo-500/30 hover:bg-indigo-500/45'
                      : 'border-white/15 bg-transparent hover:border-white/30 hover:bg-white/[0.04]'
                  }`}
                >
                  {row.checked && <span className="text-indigo-200 text-[9px] leading-none select-none">✓</span>}
                </button>
              ) : (
                <div className="w-4 h-4 shrink-0" />
              )}

              {/* Existence dot */}
              <span className={`text-[8px] shrink-0 ${row.exists ? 'text-emerald-400' : 'text-gray-700'}`}>
                {row.exists ? '●' : '○'}
              </span>

              {/* Filename */}
              <span className={`font-mono text-xs shrink-0 w-[6.5rem] ${row.exists ? 'text-emerald-300' : 'text-gray-500'}`}>
                {row.label}
              </span>

              {/* Badge */}
              {row.kind === 'mandatory' && (
                <span className="text-[9px] px-1.5 py-px rounded-full bg-white/[0.03] text-gray-700 border border-white/6 shrink-0">
                  {s.fileMandatory}
                </span>
              )}
              {row.kind === 'optional-cursor' && !row.active && (
                <span className="text-[9px] px-1.5 py-px rounded-full bg-white/[0.05] text-gray-600 border border-white/8 shrink-0">
                  {s.cursorOptional}
                </span>
              )}

              {/* Hint */}
              <span className="text-[11px] text-gray-600 leading-snug">{row.hint}</span>
            </div>
          ))}
        </div>
        {allExist && (
          <p className="text-[11px] text-gray-600 mt-2">{s.allFilesPresent}</p>
        )}
      </section>

      {/* Error */}
      {status === 'error' && errorMsg && (
        <div className="rounded-xl border border-red-800/50 bg-red-950/30 px-3 py-2.5 text-xs text-red-400">
          <span className="font-semibold">{s.errorPrefix}: </span>
          {errorMsg}
        </div>
      )}

      {/* Generate button */}
      <button
        onClick={onConfigure}
        disabled={status === 'scanning'}
        className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold transition-all ${
          status === 'done'
            ? 'bg-emerald-700 hover:bg-emerald-600 text-white'
            : 'bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white'
        }`}
      >
        {status === 'scanning'
          ? s.configuringBtn
          : status === 'done'
            ? s.doneBtn
            : s.configureBtn}
      </button>
    </div>
  )
}

// ─── Settings Tab ────────────────────────────────────────────────────────────

interface SettingsTabProps {
  s: ReturnType<typeof t>
  locale: Locale
  profile: UserProfile
  settingsSaved: boolean
  onLocaleChange: (l: Locale) => void
  onGeneratedLocaleChange: (l: Locale) => void
  onCodingStyle: <K extends keyof UserProfile['codingStyle']>(
    key: K,
    val: UserProfile['codingStyle'][K],
  ) => void
  onAgentMode: <K extends keyof UserProfile['agentMode']>(
    key: K,
    val: UserProfile['agentMode'][K],
  ) => void
  onTools: (tools: NonNullable<UserProfile['tools']>) => void
  onSave: () => void
}

function SettingsTab({
  s,
  locale,
  profile,
  settingsSaved,
  onLocaleChange,
  onGeneratedLocaleChange,
  onCodingStyle,
  onAgentMode,
  onTools,
  onSave,
}: SettingsTabProps) {
  return (
    <div className="space-y-5">
      <Section title={s.settingsTitle}>
        <Field label={s.uiLang}>
          <SegmentControl
            options={[
              { value: 'en', label: 'English' },
              { value: 'ko', label: '한국어' },
            ]}
            value={locale}
            onChange={(v) => onLocaleChange(v as Locale)}
          />
        </Field>
        <Field label={s.generatedLang}>
          <SegmentControl
            options={[
              { value: 'en', label: 'English' },
              { value: 'ko', label: '한국어' },
            ]}
            value={profile.generatedLocale ?? 'en'}
            onChange={(v) => onGeneratedLocaleChange(v as Locale)}
          />
        </Field>
      </Section>

      <Section title={s.codingStyleTitle}>
        <Field label={s.typeStrictness}>
          <SegmentControl
            options={[
              { value: 'strict', label: s.typeStrict },
              { value: 'moderate', label: s.typeModerate },
              { value: 'loose', label: s.typeLoose },
            ]}
            value={profile.codingStyle.typeStrictness}
            onChange={(v) =>
              onCodingStyle('typeStrictness', v as UserProfile['codingStyle']['typeStrictness'])
            }
          />
        </Field>
        <Field label={s.paradigm}>
          <SegmentControl
            options={[
              { value: 'functional', label: s.paradigmFunctional },
              { value: 'oop', label: s.paradigmOop },
              { value: 'mixed', label: s.paradigmMixed },
            ]}
            value={profile.codingStyle.paradigm}
            onChange={(v) =>
              onCodingStyle('paradigm', v as UserProfile['codingStyle']['paradigm'])
            }
          />
        </Field>
        <Field label={s.commentStyle}>
          <SegmentControl
            options={[
              { value: 'minimal', label: s.commentMinimal },
              { value: 'jsdoc', label: s.commentJsdoc },
              { value: 'none', label: s.commentNone },
            ]}
            value={profile.codingStyle.commentStyle}
            onChange={(v) =>
              onCodingStyle('commentStyle', v as UserProfile['codingStyle']['commentStyle'])
            }
          />
        </Field>
      </Section>

      <Section title={s.agentModeTitle}>
        <Field label={s.autonomyLevel}>
          <SegmentControl
            options={[
              { value: 'ask-first', label: s.autonomyAskFirst },
              { value: 'proceed', label: s.autonomyProceed },
              { value: 'autonomous', label: s.autonomyAutonomous },
            ]}
            value={profile.agentMode.autonomyLevel}
            onChange={(v) =>
              onAgentMode('autonomyLevel', v as UserProfile['agentMode']['autonomyLevel'])
            }
          />
        </Field>
        <div className="flex gap-3">
          <Toggle
            label={s.preReasoning}
            checked={profile.agentMode.preReasoning}
            onChange={(v) => onAgentMode('preReasoning', v)}
          />
          <Toggle
            label={s.omissionGuard}
            checked={profile.agentMode.codeOmissionGuard}
            onChange={(v) => onAgentMode('codeOmissionGuard', v)}
          />
        </div>
      </Section>

      <Section title={s.toolsTitle}>
        <p className="text-[11px] text-gray-600 -mt-0.5">{s.toolsNote}</p>
        <Toggle
          label={s.cursorToolLabel}
          checked={profile.tools?.cursor ?? false}
          onChange={(v) => onTools({ ...(profile.tools ?? { cursor: false }), cursor: v })}
        />
      </Section>

      <button
        onClick={onSave}
        className={`w-full py-2.5 rounded-xl text-xs font-semibold transition-colors ${
          settingsSaved
            ? 'bg-emerald-700 text-white'
            : 'bg-indigo-600 hover:bg-indigo-500 text-white'
        }`}
      >
        {settingsSaved ? s.savedBtn : s.saveBtn}
      </button>
    </div>
  )
}

// ─── Preview Tab ─────────────────────────────────────────────────────────────

interface PreviewTabProps {
  s: ReturnType<typeof t>
  preview: GeneratedPreview | null
  previewFile: PreviewFile
  previewSkill: string
  onFileChange: (f: PreviewFile) => void
  onSkillChange: (name: string) => void
}

function PreviewTab({ s, preview, previewFile, previewSkill, onFileChange, onSkillChange }: PreviewTabProps) {
  if (!preview) {
    return (
      <div className="flex items-center justify-center h-40 text-xs text-gray-600">
        {s.previewEmpty}
      </div>
    )
  }

  const skillNames = Object.keys(preview.skills)
  const activeSkill = previewSkill || skillNames[0] || ''

  const previewContent: string = previewFile === 'skills'
    ? (preview.skills[activeSkill] ?? '')
    : (preview[previewFile as keyof Omit<GeneratedPreview, 'skills'>] ?? '')

  return (
    <div className="space-y-3">
      <p className="text-[10px] text-gray-600 font-semibold uppercase tracking-widest">{s.previewTitle}</p>

      <div className="flex gap-1 flex-wrap">
        {STATIC_PREVIEW_FILES.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => onFileChange(key)}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors ${
              previewFile === key
                ? 'bg-indigo-600 text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            {label}
          </button>
        ))}
        {skillNames.length > 0 && (
          <button
            onClick={() => onFileChange('skills')}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors ${
              previewFile === 'skills'
                ? 'bg-indigo-600 text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            {s.skillsLabel}
          </button>
        )}
      </div>

      {previewFile === 'skills' && skillNames.length > 1 && (
        <div className="flex gap-1 flex-wrap pl-2 border-l-2 border-indigo-800/60">
          {skillNames.map((name) => (
            <button
              key={name}
              onClick={() => onSkillChange(name)}
              className={`px-2 py-0.5 rounded text-xs font-mono transition-colors ${
                activeSkill === name
                  ? 'bg-indigo-800 text-indigo-100'
                  : 'bg-white/3 text-gray-500 hover:text-gray-300'
              }`}
            >
              /{name}
            </button>
          ))}
        </div>
      )}

      <pre className="bg-black/20 border border-white/6 rounded-xl p-3 text-xs text-gray-300
        font-mono overflow-auto max-h-[60vh] leading-relaxed whitespace-pre-wrap">
        {previewContent}
      </pre>
    </div>
  )
}

// ─── Presets Tab ─────────────────────────────────────────────────────────────

interface PresetsTabProps {
  s: ReturnType<typeof t>
  presets: PresetSummary[]
  selectedPreset: { id: string; name: string } | null
  pendingPresetId: string | null
  searchQuery: string
  presetsLoading: boolean
  onSearch: (q: string) => void
  onSelect: (presetId: string | null) => void
  onGenerate: () => void
}

type PresetSubTab = 'builtin' | 'github'

function PresetsTab({ s, presets, selectedPreset, pendingPresetId, searchQuery, presetsLoading, onSearch, onSelect, onGenerate }: PresetsTabProps) {
  const [subTab, setSubTab] = useState<PresetSubTab>('builtin')
  const isSearching = searchQuery.trim().length > 0

  const builtIn = presets.filter((p) => p.isBuiltIn)
  const github = presets.filter((p) => !p.isBuiltIn)

  // Search: unified across both tabs, sorted by stars
  const searchResults = isSearching
    ? [...presets].sort((a, b) => b.stars - a.stars)
    : null

  const displayList = isSearching
    ? searchResults!
    : subTab === 'builtin' ? builtIn : github

  return (
    <div className="flex flex-col gap-3">
      {/* Active preset bar */}
      {selectedPreset && (
        <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl border border-indigo-500/30 bg-indigo-950/30">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-indigo-400 text-[10px] shrink-0">✓</span>
            <span className="text-xs text-indigo-200 font-medium truncate">{selectedPreset.name}</span>
            <span className="text-[10px] text-indigo-500 shrink-0">{s.activePreset}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onGenerate}
              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              {s.configureBtn}
            </button>
            <button
              onClick={() => onSelect(null)}
              className="text-[11px] text-gray-600 hover:text-gray-400 transition-colors"
            >
              {s.clearPreset}
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => onSearch(e.target.value)}
        placeholder={s.searchPlaceholder}
        className="w-full bg-white/[0.04] border border-white/8 rounded-xl px-3 py-2 text-xs
          text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500/60 transition-colors"
      />

      {/* Sub-tabs (hidden while searching) */}
      {!isSearching && (
        <div className="flex border-b border-white/8 -mb-1">
          {(['builtin', 'github'] as PresetSubTab[]).map((id) => {
            const label = id === 'builtin' ? s.builtInSection : s.githubSection
            const count = id === 'builtin' ? builtIn.length : github.length
            return (
              <button
                key={id}
                onClick={() => setSubTab(id)}
                className={`px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors flex items-center gap-1.5 ${
                  subTab === id
                    ? 'border-indigo-500 text-white'
                    : 'border-transparent text-gray-500 hover:text-gray-300'
                }`}
              >
                {id === 'github' && <span className="text-amber-400/70">★</span>}
                {label}
                {count > 0 && (
                  <span className={`text-[10px] px-1 py-px rounded-full ${
                    subTab === id ? 'bg-indigo-700 text-indigo-200' : 'bg-white/8 text-gray-600'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
          {!isSearching && subTab === 'github' && github.length > 0 && (
            <span className="ml-auto self-center text-[10px] text-gray-700 pr-1">
              {s.sortedByStars}
            </span>
          )}
        </div>
      )}

      {/* Card list */}
      {presetsLoading && displayList.length === 0 ? (
        <div className="flex items-center justify-center h-28 text-xs text-gray-600 animate-pulse">
          {s.githubLoadingLabel}
        </div>
      ) : displayList.length === 0 ? (
        <EmptyState label={subTab === 'github' && !isSearching ? s.githubUnavailable : s.noPresets} />
      ) : (
        <div className="space-y-2">
          {displayList.map((preset) => (
            <PresetCard
              key={preset.id}
              s={s}
              preset={preset}
              isSelected={selectedPreset?.id === preset.id}
              isPending={pendingPresetId === preset.id}
              onSelect={onSelect}
            />
          ))}
          {presetsLoading && subTab === 'github' && (
            <div className="py-3 text-center text-[11px] text-gray-700 animate-pulse">
              {s.githubLoadingLabel}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const OVERRIDE_KEY_TO_FILE: Record<string, string> = {
  claudeMd: 'CLAUDE.md',
  agentsMd: 'AGENTS.md',
  cursorRules: '.cursorrules',
  mcpServers: '.mcp.json',
}

interface PresetCardProps {
  s: ReturnType<typeof t>
  preset: PresetSummary
  isSelected: boolean
  isPending: boolean
  onSelect: (presetId: string | null) => void
}

function PresetCard({ s, preset, isSelected, isPending, onSelect }: PresetCardProps) {
  const active = isSelected || isPending

  return (
    <div
      onClick={() => !isPending && onSelect(isSelected ? null : preset.id)}
      className={`group relative rounded-xl border px-4 py-3 transition-all select-none ${
        isPending
          ? 'border-indigo-500/40 bg-indigo-950/20 cursor-wait opacity-70'
          : active
            ? 'border-indigo-500/60 bg-indigo-950/35 cursor-pointer shadow-[0_0_0_1px_rgba(99,102,241,0.15)]'
            : 'border-white/6 bg-white/[0.02] hover:border-white/14 hover:bg-white/[0.04] cursor-pointer'
      }`}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[13px] font-semibold text-gray-100 leading-snug">{preset.name}</span>
            {preset.isBuiltIn && (
              <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-300 bg-indigo-500/15 border border-indigo-500/25 px-1.5 py-px rounded-full">
                Built-in
              </span>
            )}
          </div>
          <p className="text-[11px] text-gray-600 mt-0.5">by {preset.author}</p>
        </div>

        {/* Stars + selector */}
        <div className="flex items-center gap-2 shrink-0">
          {!preset.isBuiltIn && preset.stars > 0 && (
            <span className="text-[11px] text-amber-400/80 font-medium tabular-nums">
              ★ {preset.stars.toLocaleString()}
            </span>
          )}
          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
            active
              ? 'border-indigo-400 bg-indigo-500'
              : 'border-white/20 group-hover:border-white/40'
          }`}>
            {isPending
              ? <span className="text-white text-[8px] leading-none">…</span>
              : active && <span className="text-white text-[8px] leading-none font-bold">✓</span>
            }
          </div>
        </div>
      </div>

      {/* Description */}
      {preset.description && (
        <p className="text-[12px] text-gray-400 mt-2 leading-relaxed line-clamp-2">
          {preset.description}
        </p>
      )}

      {/* Affects (overrideKeys) */}
      {preset.overrideKeys.length > 0 && (
        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
          <span className="text-[10px] text-gray-600 shrink-0">{s.affectsLabel}</span>
          {preset.overrideKeys.map((key) => (
            <span key={key} className="text-[10px] px-1.5 py-0.5 bg-indigo-500/10 text-indigo-400/80 rounded-md font-mono border border-indigo-500/15">
              {OVERRIDE_KEY_TO_FILE[key] ?? key}
            </span>
          ))}
        </div>
      )}

      {/* Tags + published date row */}
      <div className="flex items-center justify-between gap-2 mt-2 flex-wrap">
        {preset.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {preset.tags.slice(0, 5).map((tag) => (
              <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-white/4 text-gray-500 rounded-md">
                {tag}
              </span>
            ))}
          </div>
        )}
        {preset.publishedAt && (
          <span className="text-[10px] text-gray-700 shrink-0 ml-auto">
            {s.publishedLabel} {preset.publishedAt}
          </span>
        )}
      </div>

      {/* GitHub link */}
      {preset.githubUrl && (
        <div className="mt-2 pt-2 border-t border-white/[0.04]">
          <a
            href={preset.githubUrl}
            onClick={(e) => e.stopPropagation()}
            className="text-[10px] text-gray-600 hover:text-indigo-400 transition-colors font-mono"
          >
            ↗ {preset.githubUrl.replace('https://github.com/', '')}
          </a>
        </div>
      )}
    </div>
  )
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center h-28 text-xs text-gray-600">
      {label}
    </div>
  )
}

// ─── Shared UI Primitives ────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] text-gray-600 font-semibold uppercase tracking-widest mb-2">{title}</p>
      <div className="border border-white/6 rounded-xl px-3 py-3 space-y-3">{children}</div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs text-gray-400">{label}</p>
      {children}
    </div>
  )
}

function SegmentControl({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex rounded-lg overflow-hidden border border-white/8">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`flex-1 py-1.5 text-xs font-medium transition-colors ${
            value === opt.value
              ? 'bg-indigo-600 text-white'
              : 'bg-white/[0.02] text-gray-400 hover:bg-white/8 hover:text-gray-300'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-xl border text-xs transition-colors ${
        checked
          ? 'border-indigo-700/50 bg-indigo-950/35 text-indigo-300'
          : 'border-white/6 bg-white/[0.02] text-gray-500 hover:text-gray-400'
      }`}
    >
      <span
        className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center shrink-0 transition-colors ${
          checked ? 'border-indigo-400 bg-indigo-500' : 'border-gray-600'
        }`}
      >
        {checked && <span className="text-white text-[9px] leading-none">✓</span>}
      </span>
      {label}
    </button>
  )
}
