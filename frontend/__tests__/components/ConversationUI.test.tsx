import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Provider } from 'jotai'
import { createStore } from 'jotai'
import { ConversationUI } from '@/components/ConversationUI'
import { useConversation } from '@elevenlabs/react'

// ElevenLabs useConversation フックをモック
vi.mock('@elevenlabs/react', () => ({
  useConversation: vi.fn(),
}))

const mockUseConversation = useConversation as Mock

describe('ConversationUI', () => {
  let store: ReturnType<typeof createStore>

  const defaultMockReturn = {
    status: 'disconnected',
    isSpeaking: false,
    startSession: vi.fn(),
    endSession: vi.fn(),
  }

  beforeEach(() => {
    store = createStore()
    vi.clearAllMocks()
    mockUseConversation.mockReturnValue(defaultMockReturn)
  })

  const renderWithProvider = (ui: React.ReactElement) => {
    return render(<Provider store={store}>{ui}</Provider>)
  }

  describe('開始/停止ボタン', () => {
    it('disconnected状態で開始ボタンを表示する', () => {
      mockUseConversation.mockReturnValue({
        ...defaultMockReturn,
        status: 'disconnected',
      })

      renderWithProvider(<ConversationUI agentId="test-agent-id" />)

      const startButton = screen.getByRole('button', { name: /開始/i })
      expect(startButton).toBeInTheDocument()
    })

    it('connected状態で停止ボタンを表示する', () => {
      mockUseConversation.mockReturnValue({
        ...defaultMockReturn,
        status: 'connected',
      })

      renderWithProvider(<ConversationUI agentId="test-agent-id" />)

      const stopButton = screen.getByRole('button', { name: /停止/i })
      expect(stopButton).toBeInTheDocument()
    })

    it('開始ボタンクリックでstartSessionが呼ばれる', async () => {
      const mockStartSession = vi.fn()
      mockUseConversation.mockReturnValue({
        ...defaultMockReturn,
        status: 'disconnected',
        startSession: mockStartSession,
      })

      renderWithProvider(<ConversationUI agentId="test-agent-id" />)

      const startButton = screen.getByRole('button', { name: /開始/i })
      fireEvent.click(startButton)

      expect(mockStartSession).toHaveBeenCalledWith({
        agentId: 'test-agent-id',
        connectionType: 'websocket',
        inputDeviceId: undefined,
      })
    })

    it('停止ボタンクリックでendSessionが呼ばれる', () => {
      const mockEndSession = vi.fn()
      mockUseConversation.mockReturnValue({
        ...defaultMockReturn,
        status: 'connected',
        endSession: mockEndSession,
      })

      renderWithProvider(<ConversationUI agentId="test-agent-id" />)

      const stopButton = screen.getByRole('button', { name: /停止/i })
      fireEvent.click(stopButton)

      expect(mockEndSession).toHaveBeenCalled()
    })
  })

  describe('接続状態バッジ', () => {
    it('disconnected状態で未接続バッジを表示する', () => {
      mockUseConversation.mockReturnValue({
        ...defaultMockReturn,
        status: 'disconnected',
      })

      renderWithProvider(<ConversationUI agentId="test-agent-id" />)

      expect(screen.getByText('未接続')).toBeInTheDocument()
    })

    it('connecting状態で接続中バッジを表示する', () => {
      mockUseConversation.mockReturnValue({
        ...defaultMockReturn,
        status: 'connecting',
      })

      renderWithProvider(<ConversationUI agentId="test-agent-id" />)

      // ステータスバッジのテキストを確認（ボタンではなくバッジ部分）
      const statusTexts = screen.getAllByText('接続中...')
      expect(statusTexts.length).toBeGreaterThanOrEqual(1)
    })

    it('connected状態で接続済みバッジを表示する', () => {
      mockUseConversation.mockReturnValue({
        ...defaultMockReturn,
        status: 'connected',
      })

      renderWithProvider(<ConversationUI agentId="test-agent-id" />)

      expect(screen.getByText('接続済み')).toBeInTheDocument()
    })
  })

  describe('アバター表示', () => {
    it('isSpeakingに応じてアバターが表示される', () => {
      mockUseConversation.mockReturnValue({
        ...defaultMockReturn,
        status: 'connected',
        isSpeaking: true,
      })

      renderWithProvider(<ConversationUI agentId="test-agent-id" />)

      const avatar = screen.getByRole('img', { name: /avatar/i })
      expect(avatar).toBeInTheDocument()
    })
  })

  describe('カスタムクラス', () => {
    it('カスタムclassNameを適用できる', () => {
      const { container } = renderWithProvider(
        <ConversationUI agentId="test-agent-id" className="custom-class" />
      )

      expect(container.firstChild).toHaveClass('custom-class')
    })
  })
})
