# AGENTS.md — タスク実行フロー & ガードレール

このドキュメントは GitHub Copilot Agent mode / Claude Code が従うべきルールを定義する。

## ガードレール

### 1. 影響範囲の要約

変更を行う前に、以下を明示すること:

```
【影響範囲】
- 変更ファイル: src/components/AvatarStage.tsx
- 影響する機能: PNGTuber表示
- テスト対象: AvatarStage.test.tsx
```

### 2. 最小変更原則

- **必要最小限の変更のみ** を行う
- 「ついでに」のリファクタリングは禁止
- スコープ外の改善を見つけた場合は別Issueとして報告

### 3. 確認優先

不明点がある場合は**推測せず質問**する:
- 仕様の曖昧さ
- 複数の実装アプローチ
- 既存コードとの整合性

## 禁止事項

| 禁止 | 理由 |
|------|------|
| 大規模リファクタリング | スコープ外。別Issueで対応 |
| テストの削除・無効化 | カバレッジ低下を防ぐ |
| `any` 型の使用 | 型安全性を維持 |
| `export default` (pages以外) | プロジェクト規約 |
| Mantine / App Router | 技術選定に反する |
| 環境変数のハードコード | セキュリティリスク |

## タスク実行フロー（TDD）

### 新機能追加

```
1. 要件確認
   └─ 不明点があれば質問

2. 型/インターフェース定義
   └─ types/index.ts に追加

3. テスト作成（RED）
   └─ テストが失敗することを確認

4. 最小実装（GREEN）
   └─ テストが通る最小コードを書く

5. リファクタリング（REFACTOR）
   └─ テストが通ったままコード改善

6. カバレッジ確認
   └─ 80%以上を維持
```

### バグ修正

```
1. 再現テスト作成
   └─ バグを再現するテストを書く

2. テスト失敗確認
   └─ REDであることを確認

3. バグ修正
   └─ 最小限の変更で修正

4. テスト成功確認
   └─ GREENになったことを確認

5. 回帰テスト追加（必要に応じて）
```

### 複数ファイル変更

```
1. 変更計画の提示
   └─ 全ファイルと変更内容をリストアップ

2. ユーザー承認を得る

3. ファイルごとに TDD サイクル実行

4. 統合テスト実行

5. 変更サマリーを報告
```

## テスト作成ガイド

### Frontend コンポーネント

```typescript
// src/components/__tests__/MyComponent.test.tsx
import { render, screen } from '@testing-library/react';
import { MyComponent } from '../MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
```

### Frontend フック

```typescript
// src/hooks/__tests__/useMyHook.test.ts
import { renderHook, act } from '@testing-library/react';
import { useMyHook } from '../useMyHook';

describe('useMyHook', () => {
  it('returns initial state', () => {
    const { result } = renderHook(() => useMyHook());
    expect(result.current.value).toBe(0);
  });
});
```

### Backend ルーター

```python
# backend/tests/test_tools.py
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_search_courses_returns_list():
    response = client.post("/tools/search-courses", json={"area": "tokyo"})
    assert response.status_code == 200
    assert isinstance(response.json(), list)
```

### Backend サービス

```python
# backend/tests/test_course_service.py
import pytest
from app.services.course import search_courses

def test_search_by_area():
    result = search_courses(area="tokyo")
    assert all(c.area == "tokyo" for c in result)
```

## コミットメッセージ規約

```
<種類>: <要約（50文字以内）>

<詳細説明（必要に応じて）>

種類:
- 機能追加: 新機能
- 修正: バグ修正
- リファクタ: コード改善（機能変更なし）
- テスト: テスト追加・修正
- ドキュメント: ドキュメント更新
- 設定: 設定ファイル変更
```

例:
```
機能追加: PNGTuber リップシンク実装

- isSpeaking 状態で idle/talking 画像を切り替え
- CSS transition で滑らかなアニメーション
```

## 質問すべきタイミング

以下の場合は**必ず確認**を取る:

1. **仕様が曖昧** — 「〜かもしれない」で実装しない
2. **複数アプローチがある** — パフォーマンス vs 可読性 など
3. **破壊的変更** — 既存APIの変更、型定義の変更
4. **スコープ拡大** — 依存関係の追加、新ライブラリ導入
5. **セキュリティ関連** — 認証、環境変数、外部API連携

## 関連ドキュメント

- `.github/copilot-instructions.md` — プロジェクト概要・技術スタック
- `.github/instructions/frontend.instructions.md` — Frontend詳細ガイド
- `.github/instructions/backend.instructions.md` — Backend詳細ガイド
