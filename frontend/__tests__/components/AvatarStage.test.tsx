import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AvatarStage } from '@/components/AvatarStage'

describe('AvatarStage', () => {
  describe('レンダリング', () => {
    it('idle状態でアバター画像をレンダリングする', () => {
      render(<AvatarStage avatarState="idle" />)

      const avatar = screen.getByRole('img', { name: /avatar/i })
      expect(avatar).toBeInTheDocument()
      expect(avatar).toHaveAttribute('src', expect.stringContaining('idle.svg'))
    })

    it('talking状態でアバター画像をレンダリングする', () => {
      render(<AvatarStage avatarState="talking" />)

      const avatar = screen.getByRole('img', { name: /avatar/i })
      expect(avatar).toBeInTheDocument()
      expect(avatar).toHaveAttribute('src', expect.stringContaining('talking.svg'))
    })
  })

  describe('スタイリング', () => {
    it('カスタムclassNameを適用できる', () => {
      const { container } = render(
        <AvatarStage avatarState="idle" className="custom-class" />
      )

      expect(container.firstChild).toHaveClass('custom-class')
    })
  })

  describe('トランジション', () => {
    it('transition用のCSSクラスを持つ', () => {
      const { container } = render(<AvatarStage avatarState="idle" />)

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass('transition-opacity')
    })
  })
})
