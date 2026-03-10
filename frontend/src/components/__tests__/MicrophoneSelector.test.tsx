import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { MicrophoneSelector } from '../MicrophoneSelector'
import type { MicrophoneDevice } from '@/hooks/useMicrophoneSelector'

describe('MicrophoneSelector', () => {
  const mockDevices: MicrophoneDevice[] = [
    { deviceId: 'mic1', label: 'MacBook Pro Microphone' },
    { deviceId: 'mic2', label: 'External USB Microphone' },
  ]

  it('読み込み中は「読み込み中...」と表示する', () => {
    render(
      <MicrophoneSelector
        devices={[]}
        selectedDeviceId={null}
        onDeviceSelect={vi.fn()}
        isLoading={true}
        error={null}
      />
    )

    expect(screen.getByText('読み込み中...')).toBeInTheDocument()
  })

  it('エラー時はエラーメッセージを表示する', () => {
    render(
      <MicrophoneSelector
        devices={[]}
        selectedDeviceId={null}
        onDeviceSelect={vi.fn()}
        isLoading={false}
        error="マイクの一覧を取得できませんでした"
      />
    )

    expect(screen.getByText('マイクの一覧を取得できませんでした')).toBeInTheDocument()
  })

  it('マイク一覧をドロップダウンに表示する', () => {
    render(
      <MicrophoneSelector
        devices={mockDevices}
        selectedDeviceId={null}
        onDeviceSelect={vi.fn()}
        isLoading={false}
        error={null}
      />
    )

    const select = screen.getByRole('combobox', { name: 'マイク選択' })
    expect(select).toBeInTheDocument()

    // デフォルトオプション
    expect(screen.getByText('デフォルト（システム標準）')).toBeInTheDocument()

    // マイク一覧
    expect(screen.getByText('MacBook Pro Microphone')).toBeInTheDocument()
    expect(screen.getByText('External USB Microphone')).toBeInTheDocument()
  })

  it('選択されたデバイスが正しく表示される', () => {
    render(
      <MicrophoneSelector
        devices={mockDevices}
        selectedDeviceId="mic2"
        onDeviceSelect={vi.fn()}
        isLoading={false}
        error={null}
      />
    )

    const select = screen.getByRole('combobox', { name: 'マイク選択' })
    expect(select).toHaveValue('mic2')
  })

  it('デフォルト選択時はvalueが空文字になる', () => {
    render(
      <MicrophoneSelector
        devices={mockDevices}
        selectedDeviceId={null}
        onDeviceSelect={vi.fn()}
        isLoading={false}
        error={null}
      />
    )

    const select = screen.getByRole('combobox', { name: 'マイク選択' })
    expect(select).toHaveValue('')
  })

  it('デバイス選択時にコールバックが呼ばれる', async () => {
    const user = userEvent.setup()
    const onDeviceSelect = vi.fn()

    render(
      <MicrophoneSelector
        devices={mockDevices}
        selectedDeviceId={null}
        onDeviceSelect={onDeviceSelect}
        isLoading={false}
        error={null}
      />
    )

    const select = screen.getByRole('combobox', { name: 'マイク選択' })
    await user.selectOptions(select, 'mic1')

    expect(onDeviceSelect).toHaveBeenCalledWith('mic1')
  })

  it('デフォルト選択時はnullでコールバックが呼ばれる', async () => {
    const user = userEvent.setup()
    const onDeviceSelect = vi.fn()

    render(
      <MicrophoneSelector
        devices={mockDevices}
        selectedDeviceId="mic1"
        onDeviceSelect={onDeviceSelect}
        isLoading={false}
        error={null}
      />
    )

    const select = screen.getByRole('combobox', { name: 'マイク選択' })
    await user.selectOptions(select, '')

    expect(onDeviceSelect).toHaveBeenCalledWith(null)
  })

  it('読み込み中はドロップダウンが無効化される', () => {
    render(
      <MicrophoneSelector
        devices={[]}
        selectedDeviceId={null}
        onDeviceSelect={vi.fn()}
        isLoading={true}
        error={null}
      />
    )

    const select = screen.queryByRole('combobox')
    expect(select).not.toBeInTheDocument()
  })

  it('disabledプロパティでドロップダウンを無効化できる', () => {
    render(
      <MicrophoneSelector
        devices={mockDevices}
        selectedDeviceId={null}
        onDeviceSelect={vi.fn()}
        isLoading={false}
        error={null}
        disabled={true}
      />
    )

    const select = screen.getByRole('combobox', { name: 'マイク選択' })
    expect(select).toBeDisabled()
  })
})
