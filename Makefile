.PHONY: init install setup dev build lint clean

# プロジェクト初期化
init:
	@echo "幽玄奇談プロジェクトを初期化します..."
	@npm create vite@latest yugen-kitan -- --template react-ts
	@cd yugen-kitan && $(MAKE) setup

# 依存関係インストール
install:
	@echo "依存パッケージをインストール中..."
	@npm install zustand howler framer-motion clsx
	@npm install -D @types/howler tailwindcss autoprefixer postcss @tailwindcss/forms

# プロジェクト設定
setup:
	@echo "ディレクトリ構造を作成中..."
	@mkdir -p src/{components/{layout,menu,game,ui,effects},core/{game,rules,tiles,players},store,utils,hooks,styles,types,assets/{sounds,images,tiles}}
	@touch src/App.tsx src/types/game.types.ts src/core/game/GameSettings.ts
	@touch src/components/menu/ModeSelector.tsx src/components/game/Tile.tsx
	@echo "✅ 設定完了！"

# 開発サーバー起動
dev:
	@npm run dev

# ビルド
build:
	@npm run build

# コードチェック
lint:
	@npm run lint

# クリーンアップ
clean:
	@rm -rf node_modules dist

# 全てのセットアップ
all: init install setup
	@echo "🎌 幽玄奇談プロジェクトの準備が完了しました！"
	@echo "開発サーバー起動: npm run dev"
