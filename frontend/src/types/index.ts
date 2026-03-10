/**
 * 会話ステータス
 */
export type ConversationStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

/**
 * メッセージソース
 */
export type MessageSource = 'user' | 'agent'

/**
 * アバター状態
 */
export type AvatarState = 'idle' | 'talking'

/**
 * 会話メッセージ
 */
export interface ConversationMessage {
  id: string
  source: MessageSource
  text: string
  timestamp: number
}

/**
 * AvatarStageコンポーネントのプロパティ
 */
export interface AvatarStageProps {
  avatarState: AvatarState
  className?: string
}

/**
 * ConversationUIコンポーネントのプロパティ
 */
export interface ConversationUIProps {
  agentId: string
  className?: string
}
