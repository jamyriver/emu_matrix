import { isValidPlatform, PLATFORM_CORE_MAP, PLATFORM_LABELS, VALID_PLATFORMS, GAME_CATEGORIES, MAX_SAVE_SLOTS, AUTO_SAVE_SLOT } from '@emu-matrix/shared';

describe('Platform Validation', () => {
  it('should validate correct platforms', () => {
    expect(isValidPlatform('nes')).toBe(true);
    expect(isValidPlatform('md')).toBe(true);
    expect(isValidPlatform('snes')).toBe(true);
  });

  it('should reject invalid platforms', () => {
    expect(isValidPlatform('gba')).toBe(false);
    expect(isValidPlatform('n64')).toBe(false);
    expect(isValidPlatform('')).toBe(false);
    expect(isValidPlatform('NES')).toBe(false);
  });
});

describe('Platform Core Map', () => {
  it('should have correct core for each platform', () => {
    expect(PLATFORM_CORE_MAP.nes).toBe('fceumm');
    expect(PLATFORM_CORE_MAP.md).toBe('genesis_plus_gx');
    expect(PLATFORM_CORE_MAP.snes).toBe('snes9x');
  });

  it('should have entry for every valid platform', () => {
    for (const platform of VALID_PLATFORMS) {
      expect(PLATFORM_CORE_MAP[platform]).toBeDefined();
    }
  });
});

describe('Platform Labels', () => {
  it('should have labels for all valid platforms', () => {
    for (const platform of VALID_PLATFORMS) {
      expect(PLATFORM_LABELS[platform]).toBeDefined();
      expect(PLATFORM_LABELS[platform].length).toBeGreaterThan(0);
    }
  });
});

describe('Game Categories', () => {
  it('should include expected categories', () => {
    expect(GAME_CATEGORIES).toContain('action');
    expect(GAME_CATEGORIES).toContain('shooting');
    expect(GAME_CATEGORIES).toContain('rpg');
    expect(GAME_CATEGORIES).toContain('sports');
    expect(GAME_CATEGORIES).toContain('strategy');
  });
});

describe('Save Constants', () => {
  it('should have correct max save slots', () => {
    expect(MAX_SAVE_SLOTS).toBe(5);
  });

  it('should have auto save slot as 0', () => {
    expect(AUTO_SAVE_SLOT).toBe(0);
  });
});
