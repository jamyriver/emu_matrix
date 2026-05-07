import {
  isValidPlatform,
  PLATFORM_CORE_MAP,
  PLATFORM_LABELS,
  VALID_PLATFORMS,
  PLATFORM_SYSTEM_MAP,
  PLATFORM_ROM_EXTENSIONS,
  PLATFORM_NATIVE_RESOLUTION,
  PLATFORM_CONTROL_MAPPINGS,
  PLATFORM_TARGET_FPS,
} from '@emu-matrix/shared';

describe('GB/GBA Platform Validation', () => {
  it('should validate gb as a valid platform', () => {
    expect(isValidPlatform('gb')).toBe(true);
  });

  it('should validate gba as a valid platform', () => {
    expect(isValidPlatform('gba')).toBe(true);
  });

  it('should include gb and gba in VALID_PLATFORMS', () => {
    expect(VALID_PLATFORMS).toContain('gb');
    expect(VALID_PLATFORMS).toContain('gba');
    expect(VALID_PLATFORMS.length).toBe(5);
  });
});

describe('GB/GBA Core Mapping', () => {
  it('should map gb to gambatte core', () => {
    expect(PLATFORM_CORE_MAP.gb).toBe('gambatte');
  });

  it('should map gba to mgba core', () => {
    expect(PLATFORM_CORE_MAP.gba).toBe('mgba');
  });

  it('should have core for every valid platform', () => {
    for (const platform of VALID_PLATFORMS) {
      expect(PLATFORM_CORE_MAP[platform]).toBeDefined();
      expect(typeof PLATFORM_CORE_MAP[platform]).toBe('string');
    }
  });
});

describe('GB/GBA System Mapping', () => {
  it('should map gb to gb system', () => {
    expect(PLATFORM_SYSTEM_MAP.gb).toBe('gb');
  });

  it('should map gba to gba system', () => {
    expect(PLATFORM_SYSTEM_MAP.gba).toBe('gba');
  });
});

describe('GB/GBA Labels', () => {
  it('should have correct label for gb', () => {
    expect(PLATFORM_LABELS.gb).toBe('Game Boy / GBC');
  });

  it('should have correct label for gba', () => {
    expect(PLATFORM_LABELS.gba).toBe('Game Boy Advance');
  });
});

describe('GB/GBA ROM Extensions', () => {
  it('should support .gb and .gbc for gb platform', () => {
    expect(PLATFORM_ROM_EXTENSIONS.gb).toContain('.gb');
    expect(PLATFORM_ROM_EXTENSIONS.gb).toContain('.gbc');
  });

  it('should support .gba for gba platform', () => {
    expect(PLATFORM_ROM_EXTENSIONS.gba).toContain('.gba');
    expect(PLATFORM_ROM_EXTENSIONS.gba.length).toBe(1);
  });
});

describe('GB/GBA Native Resolution', () => {
  it('should have correct resolution for gb (160x144)', () => {
    expect(PLATFORM_NATIVE_RESOLUTION.gb).toEqual({ width: 160, height: 144 });
  });

  it('should have correct resolution for gba (240x160)', () => {
    expect(PLATFORM_NATIVE_RESOLUTION.gba).toEqual({ width: 240, height: 160 });
  });

  it('gb should have 10:9 aspect ratio', () => {
    const res = PLATFORM_NATIVE_RESOLUTION.gb;
    expect(res.width / res.height).toBeCloseTo(160 / 144, 2);
  });

  it('gba should have 3:2 aspect ratio', () => {
    const res = PLATFORM_NATIVE_RESOLUTION.gba;
    expect(res.width / res.height).toBeCloseTo(240 / 160, 2);
  });
});

describe('GB/GBA Control Mappings', () => {
  it('gb should have D-pad, A, B, Start, Select', () => {
    const controls = PLATFORM_CONTROL_MAPPINGS.gb;
    expect(controls.dpad).toBe(true);
    expect(controls.buttons).toContain('A');
    expect(controls.buttons).toContain('B');
    expect(controls.buttons.length).toBe(2);
    expect(controls.startSelect).toBe(true);
    expect(controls.triggers).toBeUndefined();
  });

  it('gba should have D-pad, A, B, L, R, Start, Select', () => {
    const controls = PLATFORM_CONTROL_MAPPINGS.gba;
    expect(controls.dpad).toBe(true);
    expect(controls.buttons).toContain('A');
    expect(controls.buttons).toContain('B');
    expect(controls.buttons.length).toBe(2);
    expect(controls.startSelect).toBe(true);
    expect(controls.triggers).toBeDefined();
    expect(controls.triggers).toContain('L');
    expect(controls.triggers).toContain('R');
  });
});

describe('GB/GBA Target FPS', () => {
  it('gb should target 60 fps', () => {
    expect(PLATFORM_TARGET_FPS.gb).toBe(60);
  });

  it('gba should target 60 fps', () => {
    expect(PLATFORM_TARGET_FPS.gba).toBe(60);
  });
});
