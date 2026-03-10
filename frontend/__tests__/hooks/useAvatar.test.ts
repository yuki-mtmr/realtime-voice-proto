import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useAvatar } from '@/hooks/useAvatar'

describe('useAvatar', () => {
  describe('avatarState', () => {
    it('isSpeakingがfalseの場合、avatarStateは"idle"を返す', () => {
      const { result } = renderHook(() => useAvatar(false))
      expect(result.current.avatarState).toBe('idle')
    })

    it('isSpeakingがtrueの場合、avatarStateは"talking"を返す', () => {
      const { result } = renderHook(() => useAvatar(true))
      expect(result.current.avatarState).toBe('talking')
    })
  })

  describe('currentImage', () => {
    it('isSpeakingがfalseの場合、idle.svgのパスを返す', () => {
      const { result } = renderHook(() => useAvatar(false))
      expect(result.current.currentImage).toBe('/characters/idle.svg')
    })

    it('isSpeakingがtrueの場合、talking.svgのパスを返す', () => {
      const { result } = renderHook(() => useAvatar(true))
      expect(result.current.currentImage).toBe('/characters/talking.svg')
    })
  })

  describe('状態変更への反応', () => {
    it('isSpeakingがfalseからtrueに変わると、状態が更新される', () => {
      const { result, rerender } = renderHook(
        ({ isSpeaking }) => useAvatar(isSpeaking),
        { initialProps: { isSpeaking: false } }
      )

      expect(result.current.avatarState).toBe('idle')
      expect(result.current.currentImage).toBe('/characters/idle.svg')

      rerender({ isSpeaking: true })

      expect(result.current.avatarState).toBe('talking')
      expect(result.current.currentImage).toBe('/characters/talking.svg')
    })
  })
})
