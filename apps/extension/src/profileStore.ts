import * as vscode from 'vscode'
import { DEFAULT_PROFILE } from '@ai-workspace-configurator/core'
import type { UserProfile, CommunityPreset } from '@ai-workspace-configurator/core'

const PROFILE_KEY = 'aiWorkspace.userProfile'
const PRESET_KEY = 'aiWorkspace.selectedPreset'

export function getProfile(ctx: vscode.ExtensionContext): UserProfile {
  const stored = ctx.globalState.get<UserProfile>(PROFILE_KEY)
  if (!stored) return DEFAULT_PROFILE
  return {
    ...DEFAULT_PROFILE,
    ...stored,
    codingStyle: { ...DEFAULT_PROFILE.codingStyle, ...stored?.codingStyle },
    agentMode: { ...DEFAULT_PROFILE.agentMode, ...stored?.agentMode },
  }
}

export async function saveProfile(
  ctx: vscode.ExtensionContext,
  profile: UserProfile,
): Promise<void> {
  await ctx.globalState.update(PROFILE_KEY, profile)
}

export function getSelectedPreset(ctx: vscode.ExtensionContext): CommunityPreset | null {
  return ctx.globalState.get<CommunityPreset>(PRESET_KEY) ?? null
}

export async function saveSelectedPreset(
  ctx: vscode.ExtensionContext,
  preset: CommunityPreset | null,
): Promise<void> {
  await ctx.globalState.update(PRESET_KEY, preset ?? undefined)
}
