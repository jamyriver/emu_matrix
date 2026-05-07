import {
  detectRomFormatByExtension,
  detectRomPlatformByExtension,
  validateRomFile,
} from '@emu-matrix/shared';

describe('ROM Format Detection by Extension', () => {
  it('should detect .gb as gb format', () => {
    expect(detectRomFormatByExtension('pokemon.gb')).toBe('gb');
  });

  it('should detect .gbc as gbc format', () => {
    expect(detectRomFormatByExtension('pokemon_gold.gbc')).toBe('gbc');
  });

  it('should detect .gba as gba format', () => {
    expect(detectRomFormatByExtension('pokemon_ruby.gba')).toBe('gba');
  });

  it('should detect .nes as nes format', () => {
    expect(detectRomFormatByExtension('smb.nes')).toBe('nes');
  });

  it('should detect .sfc as sfc format', () => {
    expect(detectRomFormatByExtension('zelda.sfc')).toBe('sfc');
  });

  it('should detect .md as md format', () => {
    expect(detectRomFormatByExtension('sonic.md')).toBe('md');
  });

  it('should return null for unknown extensions', () => {
    expect(detectRomFormatByExtension('game.iso')).toBeNull();
    expect(detectRomFormatByExtension('game.zip')).toBeNull();
    expect(detectRomFormatByExtension('game')).toBeNull();
  });

  it('should be case insensitive', () => {
    expect(detectRomFormatByExtension('POKEMON.GB')).toBe('gb');
    expect(detectRomFormatByExtension('Pokemon.Gba')).toBe('gba');
  });
});

describe('ROM Platform Detection by Extension', () => {
  it('should map .gb to gb platform', () => {
    expect(detectRomPlatformByExtension('pokemon.gb')).toBe('gb');
  });

  it('should map .gbc to gb platform', () => {
    expect(detectRomPlatformByExtension('pokemon_gold.gbc')).toBe('gb');
  });

  it('should map .gba to gba platform', () => {
    expect(detectRomPlatformByExtension('pokemon_ruby.gba')).toBe('gba');
  });

  it('should return null for unknown extensions', () => {
    expect(detectRomPlatformByExtension('game.iso')).toBeNull();
  });
});

describe('ROM File Validation', () => {
  it('should validate a valid .gb file with sufficient size', () => {
    const data = new Uint8Array(0x200);
    const result = validateRomFile('pokemon.gb', data);
    expect(result.valid).toBe(true);
    expect(result.platform).toBe('gb');
    expect(result.format).toBe('gb');
  });

  it('should validate a valid .gbc file', () => {
    const data = new Uint8Array(0x200);
    const result = validateRomFile('pokemon_gold.gbc', data);
    expect(result.valid).toBe(true);
    expect(result.platform).toBe('gb');
    expect(result.format).toBe('gbc');
  });

  it('should validate a valid .gba file with sufficient size', () => {
    const data = new Uint8Array(256);
    const result = validateRomFile('pokemon_ruby.gba', data);
    expect(result.valid).toBe(true);
    expect(result.platform).toBe('gba');
    expect(result.format).toBe('gba');
  });

  it('should reject .gb file that is too small', () => {
    const data = new Uint8Array(100);
    const result = validateRomFile('pokemon.gb', data);
    expect(result.valid).toBe(false);
    expect(result.platform).toBe('gb');
    expect(result.error).toContain('too small');
  });

  it('should reject .gba file that is too small', () => {
    const data = new Uint8Array(100);
    const result = validateRomFile('pokemon_ruby.gba', data);
    expect(result.valid).toBe(false);
    expect(result.platform).toBe('gba');
    expect(result.error).toContain('too small');
  });

  it('should reject unsupported file extension', () => {
    const data = new Uint8Array(1000);
    const result = validateRomFile('game.iso', data);
    expect(result.valid).toBe(false);
    expect(result.platform).toBeNull();
    expect(result.error).toContain('Unsupported');
  });

  it('should validate .nes files', () => {
    const data = new Uint8Array(1000);
    const result = validateRomFile('smb.nes', data);
    expect(result.valid).toBe(true);
    expect(result.platform).toBe('nes');
  });

  it('should detect GB ROM by magic bytes (Nintendo logo)', () => {
    const data = new Uint8Array(0x200);
    const nintendoLogo = [0xCE, 0xED, 0x66, 0x66, 0xCC, 0x0D, 0x00, 0x0B];
    for (let i = 0; i < nintendoLogo.length; i++) {
      data[0x104 + i] = nintendoLogo[i];
    }
    const result = validateRomFile('pokemon.gb', data);
    expect(result.valid).toBe(true);
    expect(result.platform).toBe('gb');
  });

  it('should detect GBA ROM by magic bytes', () => {
    const data = new Uint8Array(256);
    const gbaHeader = [0x24, 0xFF, 0xAE, 0x51, 0x69, 0x9A, 0xA2, 0x21];
    for (let i = 0; i < gbaHeader.length; i++) {
      data[i] = gbaHeader[i];
    }
    const result = validateRomFile('pokemon_ruby.gba', data);
    expect(result.valid).toBe(true);
    expect(result.platform).toBe('gba');
  });
});
