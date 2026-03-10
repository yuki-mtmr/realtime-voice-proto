import { atom } from 'jotai'
import type { ConversationMessage, ConversationStatus } from '@/types'

/**
 * 会話メッセージのリスト
 */
export const messagesAtom = atom<ConversationMessage[]>([])

/**
 * 会話ステータス
 */
export const statusAtom = atom<ConversationStatus>('disconnected')

/**
 * エージェントが話しているかどうか
 */
export const isSpeakingAtom = atom<boolean>(false)

/**
 * メッセージを追加するwrite-only atom
 */
export const addMessageAtom = atom(
  null,
  (get, set, message: ConversationMessage) => {
    const messages = get(messagesAtom)
    set(messagesAtom, [...messages, message])
  }
)

/**
 * 全メッセージをクリアするwrite-only atom
 */
export const clearMessagesAtom = atom(null, (_get, set) => {
  set(messagesAtom, [])
})
