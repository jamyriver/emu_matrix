import { Platform, RomFormat, PlatformControlMapping } from './types';

export const PLATFORM_CORE_MAP: Record<Platform, string> = {
  nes: 'fceumm',
  md: 'genesis_plus_gx',
  snes: 'snes9x',
  gb: 'gambatte',
  gba: 'mgba',
};

export const PLATFORM_LABELS: Record<Platform, string> = {
  nes: 'FC / NES',
  md: 'Sega Genesis / MD',
  snes: 'Super Nintendo / SFC',
  gb: 'Game Boy / GBC',
  gba: 'Game Boy Advance',
};

export const VALID_PLATFORMS: Platform[] = ['nes', 'md', 'snes', 'gb', 'gba'];

export const PLATFORM_SYSTEM_MAP: Record<Platform, string> = {
  nes: 'nes',
  md: 'segaMD',
  snes: 'snes',
  gb: 'gb',
  gba: 'gba',
};

export const ROM_FORMAT_PLATFORM_MAP: Record<RomFormat, Platform> = {
  gb: 'gb',
  gbc: 'gb',
  gba: 'gba',
  nes: 'nes',
  md: 'md',
  sfc: 'snes',
  smc: 'snes',
};

export const PLATFORM_ROM_EXTENSIONS: Record<Platform, string[]> = {
  nes: ['.nes'],
  md: ['.md', '.gen', '.smd', '.bin'],
  snes: ['.sfc', '.smc'],
  gb: ['.gb', '.gbc'],
  gba: ['.gba'],
};

export const PLATFORM_ROM_MAGIC_BYTES: Record<Platform, Array<{ offset: number; bytes: number[] }>> = {
  nes: [{ offset: 0, bytes: [0x4E, 0x45, 0x53, 0x1A] }],
  md: [{ offset: 0x100, bytes: [0x53, 0x45, 0x47, 0x41] }],
  snes: [],
  gb: [{ offset: 0x104, bytes: [0xCE, 0xED, 0x66, 0x66, 0xCC, 0x0D, 0x00, 0x0B] }],
  gba: [{ offset: 0, bytes: [0x24, 0xFF, 0xAE, 0x51, 0x69, 0x9A, 0xA2, 0x21] }],
};

export const PLATFORM_CONTROL_MAPPINGS: Record<Platform, PlatformControlMapping> = {
  nes: {
    platform: 'nes',
    dpad: true,
    buttons: ['A', 'B'],
    startSelect: true,
  },
  md: {
    platform: 'md',
    dpad: true,
    buttons: ['A', 'B', 'C'],
    triggers: ['X', 'Y', 'Z'],
    startSelect: true,
  },
  snes: {
    platform: 'snes',
    dpad: true,
    buttons: ['A', 'B', 'X', 'Y'],
    triggers: ['L', 'R'],
    startSelect: true,
  },
  gb: {
    platform: 'gb',
    dpad: true,
    buttons: ['A', 'B'],
    startSelect: true,
  },
  gba: {
    platform: 'gba',
    dpad: true,
    buttons: ['A', 'B'],
    triggers: ['L', 'R'],
    startSelect: true,
  },
};

export const PLATFORM_NATIVE_RESOLUTION: Record<Platform, { width: number; height: number }> = {
  nes: { width: 256, height: 240 },
  md: { width: 320, height: 224 },
  snes: { width: 256, height: 224 },
  gb: { width: 160, height: 144 },
  gba: { width: 240, height: 160 },
};

export const PLATFORM_TARGET_FPS: Record<Platform, number> = {
  nes: 60,
  md: 60,
  snes: 60,
  gb: 60,
  gba: 60,
};

export const GAME_CATEGORIES = [
  'action',
  'shooting',
  'rpg',
  'sports',
  'strategy',
  'puzzle',
  'racing',
  'fighting',
  'platform',
  'adventure',
] as const;

export const MAX_SAVE_SLOTS = 5;
export const AUTO_SAVE_SLOT = 0;
export const AUTO_SAVE_INTERVAL_MS = 60000;
export const MAX_RECORDING_DURATION_SEC = 1800;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_ERROR: 500,
} as const;
