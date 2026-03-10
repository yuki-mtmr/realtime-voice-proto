'use client'

import type { MicrophoneDevice } from '@/hooks/useMicrophoneSelector'

/**
 * MicrophoneSelectorコンポーネントのプロパティ
 */
export interface MicrophoneSelectorProps {
  /** 利用可能なマイクデバイス一覧 */
  devices: MicrophoneDevice[]
  /** 選択されたデバイスID（nullはシステム標準） */
  selectedDeviceId: string | null
  /** デバイス選択時のコールバック */
  onDeviceSelect: (deviceId: string | null) => void
  /** 読み込み中かどうか */
  isLoading: boolean
  /** エラーメッセージ */
  error: string | null
  /** 無効化状態 */
  disabled?: boolean
  /** 追加のCSSクラス */
  className?: string
}

/**
 * マイク選択ドロップダウンコンポーネント
 * ユーザーが使用するマイクを明示的に選択できる
 */
export function MicrophoneSelector({
  devices,
  selectedDeviceId,
  onDeviceSelect,
  isLoading,
  error,
  disabled = false,
  className = '',
}: MicrophoneSelectorProps) {
  /**
   * 選択変更ハンドラ
   */
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    onDeviceSelect(value === '' ? null : value)
  }

  // 読み込み中
  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className="text-sm text-gray-500">読み込み中...</span>
      </div>
    )
  }

  // エラー
  if (error) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className="text-sm text-red-500">{error}</span>
      </div>
    )
  }

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label
        htmlFor="microphone-select"
        className="text-sm font-medium text-gray-700"
      >
        マイク選択
      </label>
      <select
        id="microphone-select"
        aria-label="マイク選択"
        value={selectedDeviceId ?? ''}
        onChange={handleChange}
        disabled={disabled}
        className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
      >
        <option value="">デフォルト（システム標準）</option>
        {devices.map((device) => (
          <option key={device.deviceId} value={device.deviceId}>
            {device.label}
          </option>
        ))}
      </select>
    </div>
  )
}
