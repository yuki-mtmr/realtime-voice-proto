import { useState, useEffect, useCallback } from 'react'

/**
 * マイクデバイス情報
 */
export interface MicrophoneDevice {
  deviceId: string
  label: string
}

/**
 * useMicrophoneSelectorフックの戻り値
 */
export interface UseMicrophoneSelectorResult {
  /** 利用可能なマイクデバイス一覧 */
  devices: MicrophoneDevice[]
  /** 選択されたデバイスID（nullはシステム標準） */
  selectedDeviceId: string | null
  /** デバイスを選択する関数 */
  selectDevice: (deviceId: string | null) => void
  /** デバイス一覧を読み込み中かどうか */
  isLoading: boolean
  /** エラーメッセージ */
  error: string | null
}

/**
 * マイク選択を管理するカスタムフック
 * @returns マイク選択の状態と操作関数
 */
export function useMicrophoneSelector(): UseMicrophoneSelectorResult {
  const [devices, setDevices] = useState<MicrophoneDevice[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /**
   * マイクデバイス一覧を取得
   */
  const fetchDevices = useCallback(async () => {
    // navigator.mediaDevicesが存在しない場合
    if (!navigator.mediaDevices?.enumerateDevices) {
      setError('このブラウザはマイク選択に対応していません')
      setIsLoading(false)
      return
    }

    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices()
      const audioInputDevices = allDevices.filter(
        (device) => device.kind === 'audioinput'
      )

      let unknownCount = 0
      const micDevices: MicrophoneDevice[] = audioInputDevices.map((device) => {
        let label = device.label
        if (!label) {
          unknownCount++
          label = `不明なマイク ${unknownCount}`
        }
        return {
          deviceId: device.deviceId,
          label,
        }
      })

      setDevices(micDevices)
      setError(null)
    } catch {
      setError('マイクの一覧を取得できませんでした')
      setDevices([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * デバイスを選択
   * @param deviceId - 選択するデバイスID（nullでシステム標準）
   */
  const selectDevice = useCallback((deviceId: string | null) => {
    setSelectedDeviceId(deviceId)
  }, [])

  useEffect(() => {
    fetchDevices()

    // デバイス変更イベントのリスナー
    const handleDeviceChange = () => {
      fetchDevices()
    }

    if (navigator.mediaDevices?.addEventListener) {
      navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange)
    }

    return () => {
      if (navigator.mediaDevices?.removeEventListener) {
        navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange)
      }
    }
  }, [fetchDevices])

  return {
    devices,
    selectedDeviceId,
    selectDevice,
    isLoading,
    error,
  }
}
