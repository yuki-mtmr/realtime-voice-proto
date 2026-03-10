'use client'

import { useCallback } from 'react'
import { useConversation } from '@elevenlabs/react'
import { useAtom, useSetAtom } from 'jotai'
import { AvatarStage } from '@/components/AvatarStage'
import { MicrophoneSelector } from '@/components/MicrophoneSelector'
import { useAvatar } from '@/hooks/useAvatar'
import { useMicrophoneSelector } from '@/hooks/useMicrophoneSelector'
import {
  statusAtom,
  isSpeakingAtom,
  addMessageAtom,
  clearMessagesAtom,
  messagesAtom,
} from '@/stores/conversationAtoms'
import type { ConversationUIProps, ConversationStatus } from '@/types'

/**
 * ステータスバッジのテキスト
 */
const STATUS_TEXT: Record<ConversationStatus, string> = {
  disconnected: '未接続',
  connecting: '接続中...',
  connected: '接続済み',
  error: 'エラー',
}

/**
 * ステータスバッジのカラークラス
 */
const STATUS_COLOR: Record<ConversationStatus, string> = {
  disconnected: 'bg-gray-500',
  connecting: 'bg-yellow-500',
  connected: 'bg-green-500',
  error: 'bg-red-500',
}

/**
 * ElevenLabs Conversational AIと統合された会話UIコンポーネント
 */
export function ConversationUI({ agentId, className = '' }: ConversationUIProps) {
  const [, setStatus] = useAtom(statusAtom)
  const [, setIsSpeaking] = useAtom(isSpeakingAtom)
  const addMessage = useSetAtom(addMessageAtom)
  const clearMessages = useSetAtom(clearMessagesAtom)
  const [messages] = useAtom(messagesAtom)

  const conversation = useConversation({
    onConnect: () => {
      setStatus('connected')
    },
    onDisconnect: () => {
      setStatus('disconnected')
      setIsSpeaking(false)
    },
    onMessage: (message) => {
      addMessage({
        id: crypto.randomUUID(),
        source: message.source === 'user' ? 'user' : 'agent',
        text: message.message,
        timestamp: Date.now(),
      })
    },
    onError: () => {
      setStatus('error')
    },
  })

  const { status, isSpeaking, startSession, endSession } = conversation
  const { avatarState } = useAvatar(isSpeaking)
  const {
    devices,
    selectedDeviceId,
    selectDevice,
    isLoading: isMicLoading,
    error: micError,
  } = useMicrophoneSelector()

  const handleStart = useCallback(async () => {
    setStatus('connecting')
    clearMessages()
    await startSession({
      agentId,
      connectionType: 'websocket',
      inputDeviceId: selectedDeviceId || undefined,
    })
  }, [agentId, startSession, setStatus, clearMessages, selectedDeviceId])

  const handleStop = useCallback(() => {
    endSession()
  }, [endSession])

  const isConnected = status === 'connected'
  const currentStatus = status as ConversationStatus

  return (
    <div className={`flex flex-col items-center gap-6 p-6 ${className}`}>
      {/* ステータスバッジ */}
      <div className="flex items-center gap-2">
        <span
          className={`inline-block h-3 w-3 rounded-full ${STATUS_COLOR[currentStatus]}`}
        />
        <span className="text-sm font-medium text-gray-700">
          {STATUS_TEXT[currentStatus]}
        </span>
      </div>

      {/* アバター */}
      <AvatarStage avatarState={avatarState} className="w-64 h-64" />

      {/* マイク選択 */}
      <MicrophoneSelector
        devices={devices}
        selectedDeviceId={selectedDeviceId}
        onDeviceSelect={selectDevice}
        isLoading={isMicLoading}
        error={micError}
        disabled={isConnected}
        className="w-full max-w-xs"
      />

      {/* 開始/停止ボタン */}
      {!isConnected ? (
        <button
          onClick={handleStart}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          disabled={status === 'connecting'}
        >
          {status === 'connecting' ? '接続中...' : '会話を開始'}
        </button>
      ) : (
        <button
          onClick={handleStop}
          className="px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
        >
          会話を停止
        </button>
      )}

      {/* トランスクリプト */}
      {messages.length > 0 && (
        <div className="w-full max-w-md mt-4">
          <h3 className="text-sm font-medium text-gray-600 mb-2">
            トランスクリプト
          </h3>
          <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto space-y-2">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`p-2 rounded ${
                  msg.source === 'user'
                    ? 'bg-blue-100 text-blue-900 ml-8'
                    : 'bg-green-100 text-green-900 mr-8'
                }`}
              >
                <span className="text-xs font-medium uppercase">
                  {msg.source === 'user' ? 'あなた' : 'エージェント'}
                </span>
                <p className="text-sm mt-1">{msg.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
