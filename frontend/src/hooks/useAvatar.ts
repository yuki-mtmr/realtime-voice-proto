import { useMemo } from 'react'
import type { AvatarState } from '@/types'

/**
 * アバター画像パス
 */
const AVATAR_IMAGES = {
  idle: '/characters/idle.svg',
  talking: '/characters/talking.svg',
} as const

/**
 * useAvatarフックの戻り値
 */
interface UseAvatarReturn {
  avatarState: AvatarState
  currentImage: string
}

/**
 * アバター状態を管理するカスタムフック
 * @param isSpeaking - エージェントが話しているかどうか
 * @returns アバター状態と現在の画像パス
 */
export function useAvatar(isSpeaking: boolean): UseAvatarReturn {
  const avatarState: AvatarState = isSpeaking ? 'talking' : 'idle'

  const currentImage = useMemo(() => {
    return AVATAR_IMAGES[avatarState]
  }, [avatarState])

  return {
    avatarState,
    currentImage,
  }
}
