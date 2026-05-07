import { Platform, ApiResponse, RomFormat, RomValidationResult } from './types';
import { VALID_PLATFORMS, PLATFORM_ROM_EXTENSIONS, PLATFORM_ROM_MAGIC_BYTES, ROM_FORMAT_PLATFORM_MAP } from './constants';

export function isValidPlatform(value: string): value is Platform {
  return VALID_PLATFORMS.includes(value as Platform);
}

export function createApiResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    data,
    message,
  };
}

export function createErrorResponse(error: string, message?: string): ApiResponse {
  return {
    success: false,
    error,
    message,
  };
}

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function sanitizeUsername(username: string): string {
  return username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPassword(password: string): boolean {
  return password.length >= 6;
}

export function detectRomFormatByExtension(filename: string): RomFormat | null {
  const lowerName = filename.toLowerCase();
  const ext = lowerName.substring(lowerName.lastIndexOf('.'));
  const extToFormat: Record<string, RomFormat> = {
    '.nes': 'nes',
    '.md': 'md',
    '.gen': 'md',
    '.smd': 'md',
    '.bin': 'md',
    '.sfc': 'sfc',
    '.smc': 'smc',
    '.gb': 'gb',
    '.gbc': 'gbc',
    '.gba': 'gba',
  };
  return extToFormat[ext] || null;
}

export function detectRomPlatformByExtension(filename: string): Platform | null {
  const format = detectRomFormatByExtension(filename);
  if (!format) return null;
  return ROM_FORMAT_PLATFORM_MAP[format] || null;
}

export function detectRomPlatformByMagicBytes(data: Uint8Array): Platform | null {
  for (const [platform, signatures] of Object.entries(PLATFORM_ROM_MAGIC_BYTES) as [Platform, Array<{ offset: number; bytes: number[] }>][] ) {
    for (const sig of signatures) {
      if (sig.offset + sig.bytes.length <= data.length) {
        let match = true;
        for (let i = 0; i < sig.bytes.length; i++) {
          if (data[sig.offset + i] !== sig.bytes[i]) {
            match = false;
            break;
          }
        }
        if (match) return platform;
      }
    }
  }
  return null;
}

export function validateRomFile(filename: string, data: Uint8Array): RomValidationResult {
  const extPlatform = detectRomPlatformByExtension(filename);
  const magicPlatform = detectRomPlatformByMagicBytes(data);

  if (!extPlatform) {
    return {
      valid: false,
      platform: null,
      format: null,
      error: `Unsupported ROM file extension: ${filename.substring(filename.lastIndexOf('.'))}`,
    };
  }

  const format = detectRomFormatByExtension(filename);

  if (magicPlatform && magicPlatform !== extPlatform) {
    return {
      valid: false,
      platform: null,
      format: format,
      error: `ROM header indicates platform "${magicPlatform}" but extension indicates "${extPlatform}"`,
    };
  }

  const validExtensions = PLATFORM_ROM_EXTENSIONS[extPlatform] || [];
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  if (!validExtensions.includes(ext)) {
    return {
      valid: false,
      platform: extPlatform,
      format: format,
      error: `Invalid extension "${ext}" for platform "${extPlatform}"`,
    };
  }

  if (extPlatform === 'gb') {
    if (data.length < 0x150) {
      return {
        valid: false,
        platform: extPlatform,
        format: format,
        error: 'GB/GBC ROM file is too small to be valid',
      };
    }
  }

  if (extPlatform === 'gba') {
    if (data.length < 192) {
      return {
        valid: false,
        platform: extPlatform,
        format: format,
        error: 'GBA ROM file is too small to be valid',
      };
    }
  }

  return {
    valid: true,
    platform: extPlatform,
    format: format,
  };
}

export function getRomFileFilter(platform: Platform): string {
  const extensions = PLATFORM_ROM_EXTENSIONS[platform] || [];
  return extensions.map(ext => `*${ext}`).join(',');
}
