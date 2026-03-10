import { describe, it, expect, beforeEach } from 'vitest'
import { createStore } from 'jotai'
import {
  messagesAtom,
  statusAtom,
  isSpeakingAtom,
  addMessageAtom,
  clearMessagesAtom,
} from '@/stores/conversationAtoms'
import type { ConversationMessage, ConversationStatus } from '@/types'

describe('conversationAtoms', () => {
  let store: ReturnType<typeof createStore>

  beforeEach(() => {
    store = createStore()
  })

  describe('messagesAtom', () => {
    it('初期値は空の配列', () => {
      const messages = store.get(messagesAtom)
      expect(messages).toEqual([])
    })
  })

  describe('statusAtom', () => {
    it('初期値は"disconnected"', () => {
      const status = store.get(statusAtom)
      expect(status).toBe('disconnected')
    })

    it('ステータスを変更できる', () => {
      store.set(statusAtom, 'connected' as ConversationStatus)
      expect(store.get(statusAtom)).toBe('connected')
    })
  })

  describe('isSpeakingAtom', () => {
    it('初期値はfalse', () => {
      const isSpeaking = store.get(isSpeakingAtom)
      expect(isSpeaking).toBe(false)
    })

    it('値を変更できる', () => {
      store.set(isSpeakingAtom, true)
      expect(store.get(isSpeakingAtom)).toBe(true)
    })
  })

  describe('addMessageAtom', () => {
    it('新しいメッセージを追加できる', () => {
      const message: ConversationMessage = {
        id: 'test-id',
        source: 'user',
        text: 'こんにちは',
        timestamp: Date.now(),
      }

      store.set(addMessageAtom, message)
      const messages = store.get(messagesAtom)

      expect(messages).toHaveLength(1)
      expect(messages[0]).toEqual(message)
    })

    it('複数のメッセージを追加できる', () => {
      const message1: ConversationMessage = {
        id: 'test-id-1',
        source: 'user',
        text: 'こんにちは',
        timestamp: Date.now(),
      }
      const message2: ConversationMessage = {
        id: 'test-id-2',
        source: 'agent',
        text: 'お問い合わせありがとうございます',
        timestamp: Date.now() + 1000,
      }

      store.set(addMessageAtom, message1)
      store.set(addMessageAtom, message2)
      const messages = store.get(messagesAtom)

      expect(messages).toHaveLength(2)
      expect(messages[0]).toEqual(message1)
      expect(messages[1]).toEqual(message2)
    })
  })

  describe('clearMessagesAtom', () => {
    it('全てのメッセージをクリアできる', () => {
      const message: ConversationMessage = {
        id: 'test-id',
        source: 'user',
        text: 'テスト',
        timestamp: Date.now(),
      }

      store.set(addMessageAtom, message)
      expect(store.get(messagesAtom)).toHaveLength(1)

      store.set(clearMessagesAtom)
      expect(store.get(messagesAtom)).toEqual([])
    })
  })
})
