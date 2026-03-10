'use client'

import { Provider } from 'jotai'
import { ConversationUI } from '@/components/ConversationUI'
import { config, validateConfig } from '@/lib/config'
import { useEffect } from 'react'

export default function Home() {
  useEffect(() => {
    validateConfig()
  }, [])

  return (
    <Provider>
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        {/* ヘッダー */}
        <header className="bg-white shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <h1 className="text-2xl font-bold text-gray-800">
              JTB AI コンシェルジュ
            </h1>
            <p className="text-sm text-gray-600">
              音声でお気軽にご相談ください
            </p>
          </div>
        </header>

        {/* メインコンテンツ */}
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <ConversationUI agentId={config.elevenlabs.agentId} />
          </div>

          {/* 使い方ガイド */}
          <div className="mt-8 text-center text-gray-600">
            <h2 className="text-lg font-medium mb-4">ご利用方法</h2>
            <ol className="space-y-2 text-sm">
              <li>1. 「会話を開始」ボタンをクリック</li>
              <li>2. マイクへのアクセスを許可</li>
              <li>3. AIコンシェルジュに話しかける</li>
            </ol>
          </div>
        </main>

        {/* フッター */}
        <footer className="mt-auto py-6 text-center text-sm text-gray-500">
          <p>Powered by ElevenLabs Conversational AI</p>
        </footer>
      </div>
    </Provider>
  )
}
