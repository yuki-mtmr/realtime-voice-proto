'use client'

import Image from 'next/image'
import type { AvatarStageProps } from '@/types'

/**
 * アバター画像パス
 */
const AVATAR_IMAGES = {
  idle: '/characters/idle.svg',
  talking: '/characters/talking.svg',
} as const

/**
 * PNGTuberアバターを表示するコンポーネント
 * CSS transitionでスムーズな状態切替を実現
 */
export function AvatarStage({ avatarState, className = '' }: AvatarStageProps) {
  const imageSrc = AVATAR_IMAGES[avatarState]

  return (
    <div
      className={`relative flex items-center justify-center transition-opacity duration-300 ${className}`}
    >
      <Image
        src={imageSrc}
        alt="avatar"
        width={512}
        height={512}
        priority
        className="object-contain"
      />
    </div>
  )
}
