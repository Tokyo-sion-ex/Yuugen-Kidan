#!/bin/bash

echo "幽玄奇談プロジェクト初期化..."

# 1. プロジェクトディレクトリ作成
mkdir -p yugen-kitan
cd yugen-kitan

# 2. ViteでReact+TypeScriptプロジェクト作成
npm create vite@latest . -- --template react-ts

# 3. 追加パッケージインストール
echo "追加パッケージをインストール中..."
npm install zustand howler framer-motion clsx

# 開発依存パッケージ
npm install -D @types/howler tailwindcss autoprefixer postcss
npm install -D @tailwindcss/forms

# 4. ディレクトリ構造作成
echo "ディレクトリ構造を作成中..."
mkdir -p src/{components/{layout,menu,game,ui,effects},core/{game,rules,tiles,players},store,utils,hooks,styles,types,assets/{sounds,images,tiles}}

# 5. 必須ファイル作成
# TypeScript設定拡張
cat > tsconfig.extend.json << 'EOF'
{
  "compilerOptions": {
    "baseUrl": "src",
    "paths": {
      "@components/*": ["components/*"],
      "@core/*": ["core/*"],
      "@utils/*": ["utils/*"],
      "@styles/*": ["styles/*"],
      "@assets/*": ["assets/*"],
      "@types/*": ["types/*"]
    }
  }
}
EOF

# Tailwind設定
npx tailwindcss init -p

# 6. 初期ファイル作成
# 主要な初期ファイルを生成
touch src/App.tsx
touch src/types/game.types.ts
touch src/core/game/GameSettings.ts
touch src/components/menu/ModeSelector.tsx
touch src/components/game/Tile.tsx
touch src/styles/variables.css

echo "✅ プロジェクト初期化完了！"
echo "次のコマンドで開発サーバーを起動:"
echo "cd yugen-kitan && npm run dev"
