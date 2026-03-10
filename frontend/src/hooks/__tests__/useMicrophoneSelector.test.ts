import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useMicrophoneSelector } from '../useMicrophoneSelector'

/**
 * navigator.mediaDevices のモック
 */
const mockEnumerateDevices = vi.fn()

const mockMediaDevices = {
  enumerateDevices: mockEnumerateDevices,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
}

describe('useMicrophoneSelector', () => {
  beforeEach(() => {
    vi.stubGlobal('navigator', {
      mediaDevices: mockMediaDevices,
    })
    mockEnumerateDevices.mockReset()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('初期状態ではisLoadingがtrueである', () => {
    mockEnumerateDevices.mockResolvedValue([])

    const { result } = renderHook(() => useMicrophoneSelector())

    expect(result.current.isLoading).toBe(true)
    expect(result.current.devices).toEqual([])
    expect(result.current.selectedDeviceId).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('マイクデバイス一覧を取得できる', async () => {
    const mockDevices: MediaDeviceInfo[] = [
      {
        deviceId: 'mic1',
        label: 'MacBook Pro Microphone',
        kind: 'audioinput',
        groupId: 'group1',
        toJSON: () => ({}),
      },
      {
        deviceId: 'mic2',
        label: 'External USB Microphone',
        kind: 'audioinput',
        groupId: 'group2',
        toJSON: () => ({}),
      },
      {
        deviceId: 'speaker1',
        label: 'MacBook Pro Speakers',
        kind: 'audiooutput',
        groupId: 'group1',
        toJSON: () => ({}),
      },
    ]
    mockEnumerateDevices.mockResolvedValue(mockDevices)

    const { result } = renderHook(() => useMicrophoneSelector())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // audioinputのみがフィルタリングされる
    expect(result.current.devices).toHaveLength(2)
    expect(result.current.devices[0]).toEqual({
      deviceId: 'mic1',
      label: 'MacBook Pro Microphone',
    })
    expect(result.current.devices[1]).toEqual({
      deviceId: 'mic2',
      label: 'External USB Microphone',
    })
  })

  it('デバイスを選択できる', async () => {
    const mockDevices: MediaDeviceInfo[] = [
      {
        deviceId: 'mic1',
        label: 'MacBook Pro Microphone',
        kind: 'audioinput',
        groupId: 'group1',
        toJSON: () => ({}),
      },
    ]
    mockEnumerateDevices.mockResolvedValue(mockDevices)

    const { result } = renderHook(() => useMicrophoneSelector())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    act(() => {
      result.current.selectDevice('mic1')
    })

    expect(result.current.selectedDeviceId).toBe('mic1')
  })

  it('nullを選択するとデフォルト（システム標準）になる', async () => {
    mockEnumerateDevices.mockResolvedValue([])

    const { result } = renderHook(() => useMicrophoneSelector())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    act(() => {
      result.current.selectDevice('some-device')
    })

    expect(result.current.selectedDeviceId).toBe('some-device')

    act(() => {
      result.current.selectDevice(null)
    })

    expect(result.current.selectedDeviceId).toBeNull()
  })

  it('enumerateDevicesが失敗した場合エラーを設定する', async () => {
    mockEnumerateDevices.mockRejectedValue(new Error('Permission denied'))

    const { result } = renderHook(() => useMicrophoneSelector())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBe('マイクの一覧を取得できませんでした')
    expect(result.current.devices).toEqual([])
  })

  it('navigator.mediaDevicesが存在しない場合エラーを設定する', async () => {
    vi.stubGlobal('navigator', {})

    const { result } = renderHook(() => useMicrophoneSelector())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBe('このブラウザはマイク選択に対応していません')
  })

  it('ラベルが空の場合「不明なマイク」と表示する', async () => {
    const mockDevices: MediaDeviceInfo[] = [
      {
        deviceId: 'mic1',
        label: '',
        kind: 'audioinput',
        groupId: 'group1',
        toJSON: () => ({}),
      },
    ]
    mockEnumerateDevices.mockResolvedValue(mockDevices)

    const { result } = renderHook(() => useMicrophoneSelector())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.devices[0].label).toBe('不明なマイク 1')
  })

  it('デバイス変更イベントで一覧を更新する', async () => {
    const initialDevices: MediaDeviceInfo[] = [
      {
        deviceId: 'mic1',
        label: 'MacBook Pro Microphone',
        kind: 'audioinput',
        groupId: 'group1',
        toJSON: () => ({}),
      },
    ]
    mockEnumerateDevices.mockResolvedValue(initialDevices)

    const { result } = renderHook(() => useMicrophoneSelector())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.devices).toHaveLength(1)

    // devicechangeイベントのリスナーが登録されていることを確認
    expect(mockMediaDevices.addEventListener).toHaveBeenCalledWith(
      'devicechange',
      expect.any(Function)
    )
  })

  it('アンマウント時にイベントリスナーを解除する', async () => {
    mockEnumerateDevices.mockResolvedValue([])

    const { unmount } = renderHook(() => useMicrophoneSelector())

    await waitFor(() => {
      expect(mockEnumerateDevices).toHaveBeenCalled()
    })

    unmount()

    expect(mockMediaDevices.removeEventListener).toHaveBeenCalledWith(
      'devicechange',
      expect.any(Function)
    )
  })
})
