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

// VS Code API — available only inside a webview
declare function acquireVsCodeApi(): { postMessage: (msg: unknown) => void }
const vscodeApi =
  typeof acquireVsCodeApi !== 'undefined' ? acquireVsCodeApi() : null
const postMessage = (msg: unknown) => vscodeApi?.postMessage(msg)

type Tab = 'home' | 'settings' | 'preview' | 'presets'
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
  const [presets, setPresets] = useState<PresetSummary[]>([])
  const [selectedPreset, setSelectedPreset] = useState<{ id: string; name: string } | null>(null)
  const [presetQuery, setPresetQuery] = useState('')
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
          break
        case 'presetApplied':
          setSelectedPreset(msg.payload)
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
      postMessage({ command: 'searchPresets', query: '' })
    }
  }

  function handleConfigure() {
    setStatus('scanning')
    setErrorMsg(undefined)
    postMessage({ command: 'configure' })
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
      postMessage({ command: 'searchPresets', query: q })
    }, 400)
  }

  function handlePresetSelect(presetId: string | null) {
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
        {/* Language toggle */}
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
          ['settings', s.settingsTab],
          ['preview', s.previewTab],
          ['presets', s.presetsTab],
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

      {/* Content */}
      <main className="flex-1 px-5 py-4 overflow-y-auto">
        {tab === 'home' && (
          <HomeTab
            s={s}
            status={status}
            errorMsg={errorMsg}
            fileStatus={fileStatus}
            selectedPreset={selectedPreset}
            onConfigure={handleConfigure}
            onSyncTeam={() => postMessage({ command: 'syncTeam' })}
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
        {tab === 'presets' && (
          <PresetsTab
            s={s}
            presets={presets}
            selectedPreset={selectedPreset}
            searchQuery={presetQuery}
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

interface HomeTabProps {
  s: ReturnType<typeof t>
  status: Status
  errorMsg: string | undefined
  fileStatus: FileStatus
  selectedPreset: { id: string; name: string } | null
  onConfigure: () => void
  onSyncTeam: () => void
  onGoToPresets: () => void
}

function HomeTab({ s, status, errorMsg, fileStatus, selectedPreset, onConfigure, onSyncTeam, onGoToPresets }: HomeTabProps) {
  const fileEntries: { label: string; exists: boolean }[] = [
    { label: 'CLAUDE.md', exists: fileStatus.claude },
    { label: 'AGENTS.md', exists: fileStatus.agents },
    { label: '.cursorrules', exists: fileStatus.cursor },
    { label: '.mcp.json', exists: fileStatus.mcp },
    { label: s.skillsLabel, exists: fileStatus.skills },
  ]

  const allExist = fileEntries.every((f) => f.exists)
  const noneExist = fileEntries.every((f) => !f.exists)

  return (
    <div className="space-y-4">
      {/* Active preset banner */}
      {selectedPreset && (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-md border border-emerald-800/60 bg-emerald-950/30 cursor-pointer hover:bg-emerald-950/50 transition-colors"
          onClick={onGoToPresets}
        >
          <span className="text-emerald-400 text-xs">●</span>
          <span className="text-xs text-emerald-300 font-medium">{s.selectedPresetLabel}:</span>
          <span className="text-xs text-emerald-200">{selectedPreset.name}</span>
        </div>
      )}

      {/* File status */}
      <section>
        <p className="text-xs text-gray-500 font-medium mb-2 uppercase tracking-wide">
          {s.fileStatusTitle}
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {fileEntries.map(({ label, exists }) => (
            <div
              key={label}
              className={`flex items-center gap-2 px-3 py-2 rounded-md border text-xs font-mono ${
                exists
                  ? 'border-emerald-800/60 bg-emerald-950/40 text-emerald-400'
                  : 'border-white/8 bg-white/3 text-gray-500'
              }`}
            >
              <span className={exists ? 'text-emerald-400' : 'text-gray-600'}>
                {exists ? '●' : '○'}
              </span>
              {label}
            </div>
          ))}
        </div>
        {allExist && (
          <p className="text-xs text-gray-600 mt-2">
            All files present. Re-generate to overwrite.
          </p>
        )}
      </section>

      {/* Error */}
      {status === 'error' && errorMsg && (
        <div className="rounded-md border border-red-800/60 bg-red-950/40 px-3 py-2 text-xs text-red-400">
          <span className="font-semibold">{s.errorPrefix}: </span>
          {errorMsg}
        </div>
      )}

      {/* Actions */}
      <section className="space-y-2">
        <button
          onClick={onConfigure}
          disabled={status === 'scanning'}
          className={`w-full py-2.5 px-4 rounded-lg text-xs font-semibold transition-colors ${
            status === 'done'
              ? 'bg-emerald-700 hover:bg-emerald-600'
              : 'bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed'
          }`}
        >
          {status === 'scanning'
            ? s.configuringBtn
            : status === 'done'
              ? s.doneBtn
              : s.configureBtn}
        </button>

        <button
          onClick={onSyncTeam}
          className="w-full py-2.5 px-4 bg-white/5 hover:bg-white/8 border border-white/8
            rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-2"
        >
          {s.teamSyncBtn}
          <span className="text-indigo-400 text-[10px] font-bold uppercase tracking-wide">
            {s.proLabel}
          </span>
        </button>
      </section>

      {/* Files that will be generated */}
      {noneExist && (
        <section>
          <p className="text-xs text-gray-500 font-medium mb-2 uppercase tracking-wide">
            {s.willGenerateTitle}
          </p>
          <div className="border border-white/8 rounded-lg divide-y divide-white/5">
            {[
              ['CLAUDE.md', 'Claude Code agent guidelines'],
              ['AGENTS.md', 'Multi-agent handoff rules'],
              ['.cursorrules', 'Codex token diet'],
              ['.mcp.json', 'MCP server auto-config'],
              [s.skillsLabel, `${s.skillsNote} (/run /test /review …)`],
            ].map(([file, desc]) => (
              <div key={file} className="flex items-center gap-3 px-3 py-2">
                <span className="font-mono text-xs text-gray-300 w-28 shrink-0">{file}</span>
                <span className="text-xs text-gray-600">{desc}</span>
              </div>
            ))}
          </div>
        </section>
      )}
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
  onSave,
}: SettingsTabProps) {
  return (
    <div className="space-y-5">
      {/* Language */}
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

      {/* Coding style */}
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

      {/* Agent mode */}
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

      {/* Save */}
      <button
        onClick={onSave}
        className={`w-full py-2.5 rounded-lg text-xs font-semibold transition-colors ${
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
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{s.previewTitle}</p>

      {/* Main file picker */}
      <div className="flex gap-1 flex-wrap">
        {STATIC_PREVIEW_FILES.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => onFileChange(key)}
            className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
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
            className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
              previewFile === 'skills'
                ? 'bg-indigo-600 text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            {s.skillsLabel}
          </button>
        )}
      </div>

      {/* Skill sub-picker */}
      {previewFile === 'skills' && skillNames.length > 1 && (
        <div className="flex gap-1 flex-wrap pl-2 border-l-2 border-indigo-800">
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

      {/* Content */}
      <pre className="bg-black/30 border border-white/8 rounded-lg p-3 text-xs text-gray-300
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
  searchQuery: string
  onSearch: (q: string) => void
  onSelect: (presetId: string | null) => void
  onGenerate: () => void
}

function PresetsTab({ s, presets, selectedPreset, searchQuery, onSearch, onSelect, onGenerate }: PresetsTabProps) {
  return (
    <div className="space-y-3">
      {/* Active preset banner + generate CTA */}
      {selectedPreset && (
        <div className="rounded-md border border-emerald-800/60 bg-emerald-950/30 overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-emerald-400 text-xs shrink-0">●</span>
              <span className="text-xs text-emerald-300 font-medium shrink-0">{s.selectedPresetLabel}:</span>
              <span className="text-xs text-emerald-200 truncate">{selectedPreset.name}</span>
            </div>
            <button
              onClick={() => onSelect(null)}
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors shrink-0 ml-2"
            >
              {s.clearPreset}
            </button>
          </div>
          <div className="border-t border-emerald-800/40 px-3 py-2 flex items-center justify-between gap-3">
            <p className="text-[11px] text-emerald-700 flex-1">{s.presetReadyNote}</p>
            <button
              onClick={onGenerate}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded transition-colors shrink-0"
            >
              {s.configureBtn}
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
        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs
          text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
      />

      {/* Preset list */}
      {presets.length === 0 ? (
        <div className="flex items-center justify-center h-32 text-xs text-gray-600">
          {s.noPresets}
        </div>
      ) : (
        <div className="space-y-2">
          {presets.map((preset) => (
            <PresetCard
              key={preset.id}
              preset={preset}
              isSelected={selectedPreset?.id === preset.id}
              s={s}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface PresetCardProps {
  preset: PresetSummary
  isSelected: boolean
  s: ReturnType<typeof t>
  onSelect: (presetId: string | null) => void
}

function PresetCard({ preset, isSelected, s, onSelect }: PresetCardProps) {
  return (
    <div
      className={`border rounded-lg p-3 space-y-2 transition-colors ${
        isSelected
          ? 'border-indigo-600/70 bg-indigo-950/30'
          : 'border-white/8 bg-white/2 hover:bg-white/4'
      }`}
    >
      {/* Header row */}
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-gray-100">{preset.name}</span>
            {preset.isBuiltIn && (
              <span className="text-[10px] font-bold uppercase tracking-wide text-indigo-400 bg-indigo-950 border border-indigo-800/60 px-1.5 py-0.5 rounded">
                {s.builtInBadge}
              </span>
            )}
          </div>
          <p className="text-[11px] text-gray-600 mt-0.5">by {preset.author}</p>
        </div>
        <button
          onClick={() => onSelect(isSelected ? null : preset.id)}
          className={`px-3 py-1.5 rounded text-xs font-semibold shrink-0 transition-colors ${
            isSelected
              ? 'bg-indigo-700 text-white hover:bg-indigo-600'
              : 'bg-white/8 text-gray-300 hover:bg-white/14'
          }`}
        >
          {isSelected ? `✓ ${s.activePreset}` : s.usePreset}
        </button>
      </div>

      {/* Description */}
      <p className="text-[11px] text-gray-400 leading-relaxed">{preset.description}</p>

      {/* Tags */}
      {preset.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {preset.tags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] px-1.5 py-0.5 bg-white/5 text-gray-500 rounded"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer meta */}
      <div className="flex items-center gap-3 text-[10px] text-gray-600">
        {!preset.isBuiltIn && (
          <span>★ {preset.stars} {s.starsLabel}</span>
        )}
        {preset.overrideKeys.length > 0 && (
          <span className="font-mono">{preset.overrideKeys.join(', ')}</span>
        )}
      </div>
    </div>
  )
}

// ─── Shared UI Primitives ────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">{title}</p>
      <div className="border border-white/8 rounded-lg px-3 py-3 space-y-3">{children}</div>
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
    <div className="flex rounded-md overflow-hidden border border-white/10">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`flex-1 py-1.5 text-xs font-medium transition-colors ${
            value === opt.value
              ? 'bg-indigo-600 text-white'
              : 'bg-white/3 text-gray-400 hover:bg-white/8 hover:text-gray-300'
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
      className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-md border text-xs transition-colors ${
        checked
          ? 'border-indigo-700/60 bg-indigo-950/40 text-indigo-300'
          : 'border-white/8 bg-white/3 text-gray-500 hover:text-gray-400'
      }`}
    >
      <span
        className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center shrink-0 ${
          checked ? 'border-indigo-400 bg-indigo-500' : 'border-gray-600'
        }`}
      >
        {checked && <span className="text-white text-[9px] leading-none">✓</span>}
      </span>
      {label}
    </button>
  )
}
