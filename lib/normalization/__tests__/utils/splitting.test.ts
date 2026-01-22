/**
 * Tests for name splitting utilities
 */

import { describe, expect, it } from 'vitest';
import { splitFullName } from '../../utils/splitting';

describe('splitFullName', () => {
  describe('2-word names', () => {
    it('splits firstName and lastName', () => {
      const result = splitFullName('Juan Pérez');
      expect(result.firstName).toBe('Juan');
      expect(result.lastName).toBe('Pérez');
    });

    it('handles names with accents', () => {
      const result = splitFullName('María García');
      expect(result.firstName).toBe('María');
      expect(result.lastName).toBe('García');
    });

    it('handles names with ñ', () => {
      const result = splitFullName('José Núñez');
      expect(result.firstName).toBe('José');
      expect(result.lastName).toBe('Núñez');
    });
  });

  describe('3-word names (LATAM 2-apellido)', () => {
    it('splits firstName and 2 apellidos', () => {
      const result = splitFullName('María García López');
      expect(result.firstName).toBe('María');
      expect(result.lastName).toBe('García López');
    });

    it('handles different 3-word combinations', () => {
      const result = splitFullName('Juan Pérez Martínez');
      expect(result.firstName).toBe('Juan');
      expect(result.lastName).toBe('Pérez Martínez');
    });

    it('handles names with accents', () => {
      const result = splitFullName('José Rodríguez García');
      expect(result.firstName).toBe('José');
      expect(result.lastName).toBe('Rodríguez García');
    });
  });

  describe('4+ word names (compound firstName)', () => {
    it('splits compound firstName and 2 apellidos', () => {
      const result = splitFullName('Ana Sofía Rodríguez Martínez');
      expect(result.firstName).toBe('Ana Sofía');
      expect(result.lastName).toBe('Rodríguez Martínez');
    });

    it('handles 5-word names', () => {
      const result = splitFullName('María José García López Pérez');
      expect(result.firstName).toBe('María José');
      expect(result.lastName).toBe('García López Pérez');
    });

    it('handles common compound names', () => {
      const result = splitFullName('Juan Carlos Rodríguez García');
      expect(result.firstName).toBe('Juan Carlos');
      expect(result.lastName).toBe('Rodríguez García');
    });
  });

  describe('single-word names', () => {
    it('treats single word as firstName only', () => {
      const result = splitFullName('Juan');
      expect(result.firstName).toBe('Juan');
      expect(result.lastName).toBe('');
    });

    it('handles single word with accents', () => {
      const result = splitFullName('María');
      expect(result.firstName).toBe('María');
      expect(result.lastName).toBe('');
    });
  });

  describe('edge cases', () => {
    it('handles empty string', () => {
      const result = splitFullName('');
      expect(result.firstName).toBe('');
      expect(result.lastName).toBe('');
    });

    it('handles multiple spaces', () => {
      const result = splitFullName('Juan  Pérez   García');
      expect(result.firstName).toBe('Juan');
      expect(result.lastName).toBe('Pérez García');
    });

    it('handles leading and trailing spaces', () => {
      const result = splitFullName('  María García  ');
      expect(result.firstName).toBe('María');
      expect(result.lastName).toBe('García');
    });

    it('handles tab characters', () => {
      const result = splitFullName('Juan\tPérez');
      expect(result.firstName).toBe('Juan');
      expect(result.lastName).toBe('Pérez');
    });

    it('handles newline characters', () => {
      const result = splitFullName('María\nGarcía López');
      expect(result.firstName).toBe('María');
      expect(result.lastName).toBe('García López');
    });

    it('handles mixed whitespace', () => {
      const result = splitFullName('Ana  \t\nSofía   García');
      expect(result.firstName).toBe('Ana');
      expect(result.lastName).toBe('Sofía García');
    });
  });

  describe('real-world LATAM examples', () => {
    it('handles common Colombian names', () => {
      const result = splitFullName('Carlos Andrés Pérez Ramírez');
      expect(result.firstName).toBe('Carlos Andrés');
      expect(result.lastName).toBe('Pérez Ramírez');
    });

    it('handles common Mexican names', () => {
      const result = splitFullName('María Guadalupe Rodríguez García');
      expect(result.firstName).toBe('María Guadalupe');
      expect(result.lastName).toBe('Rodríguez García');
    });

    it('handles common Argentine names', () => {
      const result = splitFullName('Juan Martín González López');
      expect(result.firstName).toBe('Juan Martín');
      expect(result.lastName).toBe('González López');
    });
  });
});
