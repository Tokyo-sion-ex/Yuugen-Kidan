## 🎴 ゲーム概要
* **名前:** 幽玄奇談 (Yūgen Kitan)
* **テーマ:** 幽玄・幻想・和風モダン
* **対戦形式:** 一局戦、東風戦、東南戦、一荘戦の4モード

## 🏮 デザインコンセプト
### ☄全体テーマ
**「幽玄」を基調としたデザイン：**
* 深みのある藍色、紫、銀色を基調カラー
* 墨流し、金箔、霞などの和風要素
* ほのかな発光効果と粒子エフェクト
* 月明かりや朧げな光を意識した照明

### ⚙️UIデザイン要素
1. 🀄牌デザイン

* 伝統的な牌の形状を保ちつつ、幽玄テーマを反映
* 通常時は落ち着いた色合い、選択時や強調時は幽かな発光
* ドラ表示牌は虹色の微光を放つ
* 牌卓デザイン
* 漆黒の牌卓に金の縁取り
* 四方に季節を表す装飾（春：桜、夏：蛍、秋：紅葉、冬：雪）
* 中央には朧月が浮かび、局が進むと満ち欠けする

2. 💺プレイヤー席デザイン

北家：冬のテーマ（雪・銀）
東家：春のテーマ（桜・淡紅）
南家：夏のテーマ（蛍・青緑）
西家：秋のテーマ（紅葉・金橙）

3. 🎨メニューUI
* 襖や巻物をモチーフにしたインターフェース
* ほのかな和紙テクスチャ背景
* 筆文字フォントを使用

## 🎮 特徴
- 一局戦、東風戦、東南戦、一荘戦の4モード
- 幽玄をテーマにした美しいビジュアル
- 季節に応じた演出の変化
- レスポンシブデザイン

## 🚀 開発開始
### 💾環境設定
```bash
# 方法1: シェルスクリプト使用
chmod +x init-project.sh
./init-project.sh

# 方法2: 手動で設定
npm create vite@latest yugen-kitan -- --template react-ts
cd yugen-kitan
npm install
npm run dev
```
## プロジェクト構成
```bash
yugen-kitan/
├── public/
│   ├── index.html
│   ├── favicon.ico
│   └── assets/
│       ├── tiles/              # 牌の画像
│       ├── sounds/             # 音声ファイル
│       ├── backgrounds/        # 背景画像
│       └── fonts/              # フォントファイル
│
├── src/
│   ├── main.tsx               # アプリケーションエントリーポイント
│   ├── App.tsx                # メインアプリケーション
│   ├── index.css              # グローバルスタイル
│   │
│   ├── components/            # Reactコンポーネント
│   │   ├── layout/
│   │   │   ├── Header.tsx     # ヘッダー
│   │   │   ├── Footer.tsx     # フッター
│   │   │   └── Sidebar.tsx    # サイドバー
│   │   │
│   │   ├── menu/
│   │   │   ├── MainMenu.tsx   # メインメニュー
│   │   │   ├── ModeSelector.tsx # 対戦モード選択
│   │   │   └── Settings.tsx   # 設定画面
│   │   │
│   │   ├── game/
│   │   │   ├── MahjongTable.tsx      # 牌卓全体
│   │   │   ├── PlayerHand.tsx        # 手牌表示
│   │   │   ├── Tile.tsx              # 単一の牌
│   │   │   ├── DiscardPile.tsx       # 捨て牌
│   │   │   ├── WallDisplay.tsx       # 牌山表示
│   │   │   ├── PlayerInfo.tsx        # プレイヤー情報
│   │   │   ├── ScoreBoard.tsx        # 点数板
│   │   │   └── ActionButtons.tsx     # 操作ボタン
│   │   │
│   │   ├── ui/
│   │   │   ├── Button.tsx            # 汎用ボタン
│   │   │   ├── Modal.tsx             # モーダルウィンドウ
│   │   │   └── Tooltip.tsx           # ツールチップ
│   │   │
│   │   └── effects/
│   │       ├── SeasonalEffects.tsx   # 季節エフェクト
│   │       ├── RippleEffect.tsx      # 波紋エフェクト
│   │       └── GlowEffect.tsx        # 発光エフェクト
│   │
│   ├── core/                  # ゲームロジック
│   │   ├── game/
│   │   │   ├── GameEngine.ts         # ゲームエンジン
│   │   │   ├── GameFlowManager.ts    # ゲーム進行管理
│   │   │   ├── GameSettings.ts       # ゲーム設定
│   │   │   └── GameState.ts          # ゲーム状態
│   │   │
│   │   ├── rules/
│   │   │   ├── HandCalculator.ts     # 手役計算
│   │   │   ├── PointCalculator.ts    # 点数計算
│   │   │   ├── WinValidator.ts       # 和了判定
│   │   │   └── RuleSet.ts            # ルールセット
│   │   │
│   │   ├── tiles/
│   │   │   ├── TileManager.ts        # 牌管理
│   │   │   ├── TileSet.ts            # 牌セット定義
│   │   │   └── TileGenerator.ts      # 牌生成
│   │   │
│   │   └── players/
│   │       ├── Player.ts             # プレイヤークラス
│   │       ├── AIPlayer.ts           # AIプレイヤー
│   │       └── PlayerManager.ts      # プレイヤー管理
│   │
│   ├── store/                 # 状態管理
│   │   ├── gameStore.ts              # ゲーム状態ストア
│   │   ├── playerStore.ts            # プレイヤーストア
│   │   └── uiStore.ts                # UI状態ストア
│   │
│   ├── utils/                 # ユーティリティ
│   │   ├── constants.ts              # 定数定義
│   │   ├── helpers.ts                # ヘルパー関数
│   │   └── animations.ts             # アニメーション関数
│   │
│   ├── hooks/                 # カスタムフック
│   │   ├── useGameLoop.ts            # ゲームループ
│   │   ├── useTileDrag.ts            # 牌ドラッグ処理
│   │   └── useMahjongSounds.ts       # 音声制御
│   │
│   ├── styles/               # スタイルファイル
│   │   ├── variables.css             # CSS変数
│   │   ├── components.css            # コンポーネントスタイル
│   │   ├── animations.css            # アニメーション
│   │   └── responsive.css            # レスポンシブデザイン
│   │
│   ├── types/                # TypeScript型定義
│   │   ├── game.types.ts            # ゲーム関連の型
│   │   ├── tile.types.ts            # 牌関連の型
│   │   └── player.types.ts          # プレイヤー関連の型
│   │
│   └── assets/               # プロジェクト内アセット
│       └── data/
│           └── yaku-list.json       # 役一覧データ
│
├── package.json
├── tsconfig.json
├── vite.config.ts           # ビルド設定（Viteの場合）
└── README.md
```

## その他
万一、システムに不具合があった場合はIssuesのコーナーまでご連絡ください。
