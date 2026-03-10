/**
 * 環境変数設定
 */
export const config = {
  elevenlabs: {
    agentId: process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID || '',
  },
} as const

/**
 * 設定の検証
 */
export function validateConfig(): void {
  if (!config.elevenlabs.agentId) {
    console.warn(
      'Warning: NEXT_PUBLIC_ELEVENLABS_AGENT_ID is not set. Please configure it in .env.local'
    )
  }
}
