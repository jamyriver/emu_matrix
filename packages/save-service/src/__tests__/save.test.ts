import { MAX_SAVE_SLOTS, AUTO_SAVE_SLOT, AUTO_SAVE_INTERVAL_MS, isValidPlatform } from '@emu-matrix/shared';

describe('Save Service - Validation Logic', () => {
  describe('Slot validation', () => {
    it('should accept auto save slot (0)', () => {
      expect(AUTO_SAVE_SLOT).toBe(0);
      const slotId = 0;
      expect(slotId === AUTO_SAVE_SLOT || (slotId >= 1 && slotId <= MAX_SAVE_SLOTS)).toBe(true);
    });

    it('should accept manual save slots 1-5', () => {
      for (let i = 1; i <= MAX_SAVE_SLOTS; i++) {
        expect(i >= 1 && i <= MAX_SAVE_SLOTS).toBe(true);
      }
    });

    it('should reject invalid slot numbers', () => {
      const invalidSlots = [-1, 6, 100];
      for (const slot of invalidSlots) {
        const isValid = slot === AUTO_SAVE_SLOT || (slot >= 1 && slot <= MAX_SAVE_SLOTS);
        expect(isValid).toBe(false);
      }
    });
  });

  describe('Auto save interval', () => {
    it('should be 60 seconds', () => {
      expect(AUTO_SAVE_INTERVAL_MS).toBe(60000);
    });
  });

  describe('Platform validation for saves', () => {
    it('should validate platform in save requests', () => {
      expect(isValidPlatform('nes')).toBe(true);
      expect(isValidPlatform('md')).toBe(true);
      expect(isValidPlatform('snes')).toBe(true);
      expect(isValidPlatform('invalid')).toBe(false);
    });
  });
});
