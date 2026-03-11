# Frontend Instructions — realtime-voice-proto

このファイルはFrontend開発時に参照される詳細ガイドです。

## コンポーネント作成テンプレート

### 基本コンポーネント

```typescript
// src/components/MyComponent.tsx
import { FC } from 'react';

interface MyComponentProps {
  title: string;
  onClick?: () => void;
}

export const MyComponent: FC<MyComponentProps> = ({ title, onClick }) => {
  return (
    <div className="flex items-center p-4">
      <h2 className="text-lg font-bold">{title}</h2>
      {onClick && (
        <button
          type="button"
          className="ml-2 px-4 py-2 bg-blue-500 text-white rounded"
          onClick={onClick}
        >
          Click
        </button>
      )}
    </div>
  );
};
```

### 状態を持つコンポーネント

```typescript
// src/components/Counter.tsx
import { FC, useState, useCallback } from 'react';

interface CounterProps {
  initialValue?: number;
}

export const Counter: FC<CounterProps> = ({ initialValue = 0 }) => {
  const [count, setCount] = useState(initialValue);

  const increment = useCallback(() => {
    setCount((prev) => prev + 1);
  }, []);

  return (
    <div className="flex items-center gap-2">
      <span className="text-xl">{count}</span>
      <button
        type="button"
        className="px-3 py-1 bg-green-500 text-white rounded"
        onClick={increment}
      >
        +1
      </button>
    </div>
  );
};
```

## フック作成テンプレート

### 基本フック

```typescript
// src/hooks/useToggle.ts
import { useState, useCallback } from 'react';

interface UseToggleReturn {
  value: boolean;
  toggle: () => void;
  setTrue: () => void;
  setFalse: () => void;
}

export const useToggle = (initialValue = false): UseToggleReturn => {
  const [value, setValue] = useState(initialValue);

  const toggle = useCallback(() => setValue((v) => !v), []);
  const setTrue = useCallback(() => setValue(true), []);
  const setFalse = useCallback(() => setValue(false), []);

  return { value, toggle, setTrue, setFalse };
};
```

### 非同期フック

```typescript
// src/hooks/useFetch.ts
import { useState, useEffect } from 'react';

interface UseFetchReturn<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export const useFetch = <T>(url: string): UseFetchReturn<T> => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(url);
        if (!response.ok) throw new Error('Fetch failed');
        const json = await response.json();
        setData(json);
      } catch (e) {
        setError(e instanceof Error ? e : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [url]);

  return { data, loading, error };
};
```

## Jotai ストア パターン

### Atom 定義

```typescript
// src/store/conversation.ts
import { atom } from 'jotai';
import type { ConversationMessage } from '@/types';

// プリミティブatom
export const messagesAtom = atom<ConversationMessage[]>([]);
export const isConnectedAtom = atom(false);
export const isSpeakingAtom = atom(false);

// 派生atom（読み取り専用）
export const messageCountAtom = atom((get) => get(messagesAtom).length);

// 書き込み可能な派生atom
export const addMessageAtom = atom(
  null,
  (get, set, message: ConversationMessage) => {
    set(messagesAtom, [...get(messagesAtom), message]);
  }
);
```

### Atom 使用例

```typescript
// src/components/MessageList.tsx
import { useAtomValue } from 'jotai';
import { messagesAtom } from '@/store/conversation';

export const MessageList: FC = () => {
  const messages = useAtomValue(messagesAtom);

  return (
    <ul>
      {messages.map((msg, i) => (
        <li key={i}>{msg.message}</li>
      ))}
    </ul>
  );
};
```

## ElevenLabs モック（テスト用）

```typescript
// src/__mocks__/elevenlabs.ts
export const mockConversation = {
  status: 'disconnected' as const,
  isSpeaking: false,
  startSession: jest.fn().mockResolvedValue(undefined),
  endSession: jest.fn().mockResolvedValue(undefined),
  setVolume: jest.fn(),
};

export const useConversation = jest.fn(() => mockConversation);

// テストでの使用
jest.mock('@elevenlabs/react', () => ({
  useConversation: jest.fn(() => mockConversation),
}));
```

## テスト作成テンプレート

### コンポーネントテスト

```typescript
// src/components/__tests__/AvatarStage.test.tsx
import { render, screen } from '@testing-library/react';
import { AvatarStage } from '../AvatarStage';

describe('AvatarStage', () => {
  describe('isSpeaking=false の場合', () => {
    it('idle画像を表示する', () => {
      render(<AvatarStage isSpeaking={false} />);
      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('src', expect.stringContaining('idle'));
    });
  });

  describe('isSpeaking=true の場合', () => {
    it('talking画像を表示する', () => {
      render(<AvatarStage isSpeaking={true} />);
      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('src', expect.stringContaining('talking'));
    });
  });
});
```

### フックテスト

```typescript
// src/hooks/__tests__/useToggle.test.ts
import { renderHook, act } from '@testing-library/react';
import { useToggle } from '../useToggle';

describe('useToggle', () => {
  it('初期値がfalse', () => {
    const { result } = renderHook(() => useToggle());
    expect(result.current.value).toBe(false);
  });

  it('toggleで値が反転する', () => {
    const { result } = renderHook(() => useToggle());
    act(() => result.current.toggle());
    expect(result.current.value).toBe(true);
  });
});
```

## Tailwind CSS パターン

### よく使うクラス組み合わせ

```typescript
// ボタン
const buttonClasses = "px-4 py-2 rounded font-medium transition-colors";
const primaryButton = `${buttonClasses} bg-blue-500 hover:bg-blue-600 text-white`;
const secondaryButton = `${buttonClasses} bg-gray-200 hover:bg-gray-300 text-gray-800`;

// カード
const card = "bg-white rounded-lg shadow-md p-6";

// フレックスセンタリング
const flexCenter = "flex items-center justify-center";

// レスポンシブグリッド
const responsiveGrid = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4";
```

## 型定義パターン

```typescript
// src/types/index.ts

// ElevenLabs関連
export interface ConversationMessage {
  message: string;
  source: 'user' | 'ai';
  timestamp?: Date;
}

export type ConversationStatus = 'connected' | 'disconnected' | 'connecting';

// コンポーネントProps
export interface AvatarStageProps {
  isSpeaking: boolean;
  className?: string;
}

export interface ConversationUIProps {
  status: ConversationStatus;
  messages: ConversationMessage[];
  onStart: () => void;
  onStop: () => void;
}
```
