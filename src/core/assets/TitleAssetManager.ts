import { Tile, Suit } from '../../types/game.types';

export class TileAssetManager {
  private tileImageCache: Map<string, HTMLImageElement> = new Map();
  private tileSoundCache: Map<string, HTMLAudioElement> = new Map();
  private isInitialized: boolean = false;
  private assetBaseUrl: string;

  constructor(assetBaseUrl: string = '/assets') {
    this.assetBaseUrl = assetBaseUrl;
  }

  // アセット初期化
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // 牌画像のプリロード
      await this.preloadTileImages();
      
      // 効果音のプリロード
      await this.preloadSounds();
      
      this.isInitialized = true;
      console.log('Tile assets initialized successfully');
    } catch (error) {
      console.error('Failed to initialize tile assets:', error);
      throw error;
    }
  }

  // 牌画像のプリロード
  private async preloadTileImages(): Promise<void> {
    const tilePromises: Promise<void>[] = [];
    
    // 萬子 (1-9)
    for (let i = 1; i <= 9; i++) {
      tilePromises.push(this.loadTileImage('man', i));
    }
    
    // 筒子 (1-9)
    for (let i = 1; i <= 9; i++) {
      tilePromises.push(this.loadTileImage('pin', i));
    }
    
    // 索子 (1-9)
    for (let i = 1; i <= 9; i++) {
      tilePromises.push(this.loadTileImage('sou', i));
    }
    
    // 風牌
    const winds = ['east', 'south', 'west', 'north'] as const;
    for (const wind of winds) {
      tilePromises.push(this.loadTileImage('wind', wind));
    }
    
    // 三元牌
    const dragons = ['white', 'green', 'red'] as const;
    for (const dragon of dragons) {
      tilePromises.push(this.loadTileImage('dragon', dragon));
    }
    
    // 赤五牌（特別バージョン）
    tilePromises.push(this.loadTileImage('man', 5, true));
    tilePromises.push(this.loadTileImage('pin', 5, true));
    tilePromises.push(this.loadTileImage('sou', 5, true));
    
    await Promise.all(tilePromises);
  }

  // 個別の牌画像をロード
  private async loadTileImage(suit: Suit, value: number | string, isRedFive: boolean = false): Promise<void> {
    return new Promise((resolve, reject) => {
      const key = this.getTileImageKey(suit, value, isRedFive);
      
      // キャッシュをチェック
      if (this.tileImageCache.has(key)) {
        resolve();
        return;
      }
      
      const img = new Image();
      
      // 画像パスを生成
      const path = this.getTileImagePath(suit, value, isRedFive);
      
      img.onload = () => {
        this.tileImageCache.set(key, img);
        resolve();
      };
      
      img.onerror = () => {
        console.warn(`Failed to load tile image: ${path}`);
        // フォールバック画像を使用
        this.loadFallbackTile(suit, value, isRedFive);
        resolve();
      };
      
      img.src = path;
    });
  }

  // 牌画像のパスを生成
  private getTileImagePath(suit: Suit, value: number | string, isRedFive: boolean = false): string {
    let fileName: string;
    
    if (suit === 'wind') {
      fileName = `wind_${value}.png`;
    } else if (suit === 'dragon') {
      fileName = `dragon_${value}.png`;
    } else {
      const suffix = isRedFive ? '_red' : '';
      fileName = `${suit}_${value}${suffix}.png`;
    }
    
    return `${this.assetBaseUrl}/tiles/${fileName}`;
  }

  // 牌画像のキーを生成
  private getTileImageKey(suit: Suit, value: number | string, isRedFive: boolean = false): string {
    return `${suit}_${value}_${isRedFive ? 'red' : 'normal'}`;
  }

  // フォールバック牌の生成
  private loadFallbackTile(suit: Suit, value: number | string, isRedFive: boolean = false): void {
    const key = this.getTileImageKey(suit, value, isRedFive);
    
    // Canvasでフォールバック画像を生成
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 140;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    // 背景
    const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGradient.addColorStop(0, '#4a5568');
    bgGradient.addColorStop(1, '#2d3748');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 枠線
    ctx.strokeStyle = isRedFive ? '#e53e3e' : '#4a5568';
    ctx.lineWidth = 2;
    ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
    
    // 牌の種類に応じた色
    let color: string;
    switch (suit) {
      case 'man': color = '#e53e3e'; break; // 赤
      case 'pin': color = '#38a169'; break; // 緑
      case 'sou': color = '#3182ce'; break; // 青
      case 'wind': color = '#9f7aea'; break; // 紫
      case 'dragon': color = '#ed8936'; break; // 橙
      default: color = '#ffffff'; break;
    }
    
    // 牌の文字を描画
    ctx.fillStyle = color;
    ctx.font = 'bold 40px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    let displayText = '';
    if (suit === 'wind') {
      const windChars = { east: '東', south: '南', west: '西', north: '北' };
      displayText = windChars[value as keyof typeof windChars];
    } else if (suit === 'dragon') {
      const dragonChars = { white: '白', green: '發', red: '中' };
      displayText = dragonChars[value as keyof typeof dragonChars];
    } else {
      const suitChars = { man: '萬', pin: '筒', sou: '索' };
      displayText = `${value}${suitChars[suit]}`;
    }
    
    ctx.fillText(displayText, canvas.width / 2, canvas.height / 2);
    
    // 赤五の場合は赤丸を追加
    if (isRedFive) {
      ctx.fillStyle = '#e53e3e';
      ctx.beginPath();
      ctx.arc(canvas.width - 15, 15, 6, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // 画像として保存
    const img = new Image();
    img.src = canvas.toDataURL('image/png');
    this.tileImageCache.set(key, img);
  }

  // 牌画像を取得
  getTileImage(tile: Tile): HTMLImageElement | null {
    const key = this.getTileImageKey(tile.suit, tile.value, tile.isRedFive);
    return this.tileImageCache.get(key) || null;
  }

  // 牌のデータURLを取得（Canvas用）
  getTileDataURL(tile: Tile): string {
    const img = this.getTileImage(tile);
    if (!img) {
      // フォールバックとして単色の矩形を生成
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 140;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#2d3748';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      return canvas.toDataURL('image/png');
    }
    
    // 既存のCanvasからデータURLを取得
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = img.width;
    tempCanvas.height = img.height;
    const ctx = tempCanvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(img, 0, 0);
    }
    return tempCanvas.toDataURL('image/png');
  }

  // 牌のスプライトシートを生成
  generateSpriteSheet(): HTMLCanvasElement {
    const tileWidth = 100;
    const tileHeight = 140;
    const columns = 10;
    const rows = Math.ceil(41 / columns); // 全牌数
    
    const canvas = document.createElement('canvas');
    canvas.width = tileWidth * columns;
    canvas.height = tileHeight * rows;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return canvas;
    
    // 背景
    ctx.fillStyle = '#1a202c';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    let x = 0;
    let y = 0;
    
    // 萬子 (1-9)
    for (let i = 1; i <= 9; i++) {
      const img = this.getTileImage({ suit: 'man', value: i, id: `temp_man_${i}` } as Tile);
      if (img) {
        ctx.drawImage(img, x * tileWidth, y * tileHeight, tileWidth, tileHeight);
      }
      x++;
      if (x >= columns) {
        x = 0;
        y++;
      }
    }
    
    // 筒子 (1-9)
    for (let i = 1; i <= 9; i++) {
      const img = this.getTileImage({ suit: 'pin', value: i, id: `temp_pin_${i}` } as Tile);
      if (img) {
        ctx.drawImage(img, x * tileWidth, y * tileHeight, tileWidth, tileHeight);
      }
      x++;
      if (x >= columns) {
        x = 0;
        y++;
      }
    }
    
    // 索子 (1-9)
    for (let i = 1; i <= 9; i++) {
      const img = this.getTileImage({ suit: 'sou', value: i, id: `temp_sou_${i}` } as Tile);
      if (img) {
        ctx.drawImage(img, x * tileWidth, y * tileHeight, tileWidth, tileHeight);
      }
      x++;
      if (x >= columns) {
        x = 0;
        y++;
      }
    }
    
    // 風牌
    const winds = ['east', 'south', 'west', 'north'] as const;
    for (const wind of winds) {
      const img = this.getTileImage({ suit: 'wind', value: wind, id: `temp_wind_${wind}` } as Tile);
      if (img) {
        ctx.drawImage(img, x * tileWidth, y * tileHeight, tileWidth, tileHeight);
      }
      x++;
      if (x >= columns) {
        x = 0;
        y++;
      }
    }
    
    // 三元牌
    const dragons = ['white', 'green', 'red'] as const;
    for (const dragon of dragons) {
      const img = this.getTileImage({ suit: 'dragon', value: dragon, id: `temp_dragon_${dragon}` } as Tile);
      if (img) {
        ctx.drawImage(img, x * tileWidth, y * tileHeight, tileWidth, tileHeight);
      }
      x++;
      if (x >= columns) {
        x = 0;
        y++;
      }
    }
    
    // 赤五牌
    const redFives = [
      { suit: 'man' as Suit, value: 5, isRedFive: true },
      { suit: 'pin' as Suit, value: 5, isRedFive: true },
      { suit: 'sou' as Suit, value: 5, isRedFive: true }
    ];
    
    for (const tile of redFives) {
      const img = this.getTileImage({ ...tile, id: `temp_${tile.suit}_5_red` } as Tile);
      if (img) {
        ctx.drawImage(img, x * tileWidth, y * tileHeight, tileWidth, tileHeight);
      }
      x++;
      if (x >= columns) {
        x = 0;
        y++;
      }
    }
    
    return canvas;
  }

  // 効果音のプリロード
  private async preloadSounds(): Promise<void> {
    const soundFiles = [
      'tile_draw.mp3',
      'tile_discard.mp3',
      'riichi.mp3',
      'win.mp3',
      'pon.mp3',
      'chi.mp3',
      'kan.mp3',
      'click.mp3',
      'menu_select.mp3'
    ];
    
    const soundPromises = soundFiles.map(filename => 
      this.loadSound(`${this.assetBaseUrl}/sounds/${filename}`)
    );
    
    await Promise.all(soundPromises);
  }

  // 効果音をロード
  private async loadSound(path: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.tileSoundCache.has(path)) {
        resolve();
        return;
      }
      
      const audio = new Audio();
      audio.preload = 'auto';
      
      audio.oncanplaythrough = () => {
        this.tileSoundCache.set(path, audio);
        resolve();
      };
      
      audio.onerror = () => {
        console.warn(`Failed to load sound: ${path}`);
        resolve(); // エラーでも続行
      };
      
      audio.src = path;
    });
  }

  // 効果音を再生
  playSound(soundName: string, volume: number = 1.0): void {
    const path = `${this.assetBaseUrl}/sounds/${soundName}`;
    const audio = this.tileSoundCache.get(path);
    
    if (audio) {
      audio.currentTime = 0;
      audio.volume = Math.max(0, Math.min(1, volume));
      audio.play().catch(e => {
        console.warn(`Failed to play sound ${soundName}:`, e);
      });
    }
  }

  // 牌の3Dモデルをロード（将来的な拡張用）
  async loadTile3DModel(suit: Suit, value: number | string): Promise<any> {
    // Three.jsなどの3Dライブラリと連携
    // ここではプレースホルダー実装
    return new Promise((resolve) => {
      console.log(`Loading 3D model for ${suit}_${value}`);
      resolve(null);
    });
  }

  // パフォーマンス最適化：画像品質の調整
  adjustImageQuality(quality: 'low' | 'medium' | 'high'): void {
    // 将来的に画像の解像度を調整するロジック
    console.log(`Setting image quality to: ${quality}`);
  }

  // メモリ管理
  clearCache(): void {
    this.tileImageCache.clear();
    this.tileSoundCache.clear();
    this.isInitialized = false;
  }

  // アセットの状態を取得
  getAssetStatus(): {
    imagesLoaded: number;
    soundsLoaded: number;
    totalAssets: number;
    memoryUsage: number;
  } {
    const totalTiles = 34; // 通常の牌の種類
    const redFiveTiles = 3; // 赤五牌
    const totalImages = totalTiles + redFiveTiles;
    const totalSounds = 9; // 効果音ファイル数
    
    // 簡易的なメモリ使用量計算
    let memoryUsage = 0;
    this.tileImageCache.forEach(img => {
      memoryUsage += img.width * img.height * 4; // RGBA
    });
    
    memoryUsage = Math.round(memoryUsage / (1024 * 1024)); // MBに変換
    
    return {
      imagesLoaded: this.tileImageCache.size,
      soundsLoaded: this.tileSoundCache.size,
      totalAssets: totalImages + totalSounds,
      memoryUsage
    };
  }
}
