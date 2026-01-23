// 牌デザイン関連
export interface TileDesign {
  id: string;
  name: string;
  author: string;
  createdAt: number;
  baseColor: string;
  pattern: string;
  texture: string;
  numberStyle: 'classic' | 'modern' | 'elegant' | 'bold' | 'minimal';
  decoration: string;
  glowEffect: GlowEffect;
  border: TileBorder;
  parts: TilePart[];
  preview: string;
  tags?: string[];
}

export interface TilePart {
  id: string;
  name: string;
  category: string;
  type: 'pattern' | 'decoration' | 'texture';
  svg: string;
  color: string;
  size: { width: number; height: number };
  position: { x: number; y: number };
  rotation: number;
  opacity: number;
  isCustom?: boolean;
  fileSize?: number;
}

export interface TilePartCategory {
  id: string;
  name: string;
  icon: string;
  parts: TilePart[];
}

export interface TileDesignPreset {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  settings: Partial<TileDesign>;
  tags: string[];
}

export interface GlowEffect {
  enabled: boolean;
  color: string;
  intensity: number;
  animation: 'none' | 'pulse' | 'breath' | 'wave';
}

export interface TileBorder {
  style: 'none' | 'simple' | 'double' | 'pattern';
  color: string;
  width: number;
  pattern?: string;
}

// BGM関連
export interface MusicTrack {
  id: string;
  name: string;
  bpm: number;
  timeSignature: string;
  key: string;
  mood: MusicMood;
  layers: MusicLayer[];
  volume: number;
  effects: MusicEffect[];
  duration: number;
  createdAt: number;
  thumbnail?: string;
}

export type MusicMood = 'calm' | 'mysterious' | 'joyful' | 'tense' | 'epic';

export type InstrumentType = 'koto' | 'shakuhachi' | 'taiko' | 'shamisen' | 'shinobue' | 'kane' | 'voice';

export interface MusicLayer {
  id: string;
  instrument: InstrumentType;
  volume: number;
  pan: number;
  pattern: MusicPattern;
  effects: MusicEffect[];
  muted: boolean;
  solo: boolean;
}

export interface MusicPattern {
  id: string;
  name: string;
  notes: MusicNote[];
  length: number;
}

export interface MusicNote {
  id: string;
  pitch: string;
  time: number;
  duration: number;
  velocity: number;
  effects?: NoteEffect[];
}

export interface MusicEffect {
  type: 'reverb' | 'delay' | 'filter' | 'chorus' | 'distortion';
  parameters: Record<string, any>;
}

export interface NoteEffect {
  type: 'vibrato' | 'slide' | 'bend';
  parameters: Record<string, any>;
}

export interface MusicPreset {
  id: string;
  name: string;
  mood: MusicMood;
  icon: string;
  settings: Partial<MusicTrack>;
}

// エフェクト関連
export type EffectType = 'win' | 'riichi' | 'draw' | 'discard' | 'general';

export interface VisualEffect {
  id: string;
  name: string;
  type: EffectType;
  intensity: number;
  duration: number;
  colorTheme: string;
  particleSystem?: ParticleSystem;
  animations: AnimationEffect[];
  shaders: ShaderEffect[];
  conditions: EffectCondition[];
  tags: string[];
  thumbnail?: string;
  createdAt: number;
}

export interface ParticleSystem {
  emitter: ParticleEmitter;
  particles: ParticleProperties;
  behavior: ParticleBehavior;
}

export interface ParticleEmitter {
  x: number;
  y: number;
  rate: number;
  maxParticles: number;
  speed: { min: number; max: number };
  spread?: number;
}

export interface ParticleProperties {
  shape: 'circle' | 'square' | 'star' | 'triangle' | 'custom';
  size: { min: number; max: number };
  startColor: string;
  endColor: string;
  colorOverLifetime: boolean;
  lifetime: { min: number; max: number };
  fadeOut: boolean;
  rotation?: { min: number; max: number };
  rotationSpeed?: { min: number; max: number };
}

export interface ParticleBehavior {
  gravity: number;
  wind?: { x: number; y: number };
  turbulence: number;
  attractors?: ParticleAttractor[];
  collisions?: boolean;
}

export interface ParticleAttractor {
  x: number;
  y: number;
  strength: number;
  radius: number;
}

export interface AnimationEffect {
  id: string;
  type: 'scale' | 'rotate' | 'translate' | 'fade' | 'shake';
  target: 'tile' | 'table' | 'player' | 'all';
  duration: number;
  easing: string;
  parameters: Record<string, any>;
  keyframes: AnimationKeyframe[];
}

export interface AnimationKeyframe {
  time: number;
  values: Record<string, number>;
}

export interface ShaderEffect {
  id: string;
  type: 'glow' | 'blur' | 'distortion' | 'colorize' | 'custom';
  vertexShader: string;
  fragmentShader: string;
  uniforms: Record<string, any>;
  enabled: boolean;
}

export interface EffectCondition {
  type: 'always' | 'onWin' | 'onRiichi' | 'onYakuman' | 'onDora';
  parameters: Record<string, any>;
}

export interface EffectPreset {
  id: string;
  name: string;
  icon: string;
  settings: Partial<VisualEffect>;
  tags: string[];
}

// UIスキン関連
export interface UISkin {
  id: string;
  name: string;
  author: string;
  baseTheme: 'dark' | 'light' | 'colorful' | 'minimal';
  colors: ColorScheme;
  typography: TypographySettings;
  components: ComponentStyles;
  textures: TextureSettings;
  animations: UISkinAnimation[];
  createdAt: number;
}

export interface ColorScheme {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  accent: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

export interface TypographySettings {
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  lineHeight: number;
  letterSpacing: number;
  fontStyle: 'normal' | 'italic';
}

export interface ComponentStyles {
  buttons: ButtonStyles;
  cards: CardStyles;
  inputs: InputStyles;
  modals: ModalStyles;
  tables: TableStyles;
}

export interface ButtonStyles {
  borderRadius: number;
  padding: { x: number; y: number };
  shadow: ShadowSettings;
  hoverEffect: string;
  activeEffect: string;
}

export interface CardStyles {
  borderRadius: number;
  padding: number;
  shadow: ShadowSettings;
  border: BorderSettings;
}

export interface ShadowSettings {
  enabled: boolean;
  color: string;
  blur: number;
  offset: { x: number; y: number };
}

export interface BorderSettings {
  enabled: boolean;
  color: string;
  width: number;
  style: 'solid' | 'dashed' | 'dotted';
}

// 共通
export interface ShareData {
  id: string;
  type: 'tile' | 'music' | 'effect' | 'skin';
  data: any;
  shareCode: string;
  url: string;
  views: number;
  likes: number;
  createdAt: number;
}

export interface CreativeAsset {
  id: string;
  name: string;
  type: 'tile' | 'music' | 'effect' | 'skin';
  thumbnail: string;
  author: string;
  downloads: number;
  rating: number;
  tags: string[];
  createdAt: number;
}

export interface UserLibrary {
  userId: string;
  tiles: TileDesign[];
  music: MusicTrack[];
  effects: VisualEffect[];
  skins: UISkin[];
  favorites: string[];
  createdAt: number;
  updatedAt: number;
}
