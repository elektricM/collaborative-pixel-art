/**
 * Basic tests for the collaborative pixel art server
 * Run with: npm test
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');

// Import server module (we can test the exported helpers)
// Note: In a real project, you'd extract validation functions to a separate module

describe('Validation Functions', () => {
  
  describe('Color Validation', () => {
    const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;
    
    const isValidColor = (color) => {
      return typeof color === 'string' && HEX_COLOR_REGEX.test(color);
    };
    
    it('should accept valid hex colors', () => {
      assert.strictEqual(isValidColor('#FF0000'), true);
      assert.strictEqual(isValidColor('#00ff00'), true);
      assert.strictEqual(isValidColor('#0000FF'), true);
      assert.strictEqual(isValidColor('#FFFFFF'), true);
      assert.strictEqual(isValidColor('#000000'), true);
      assert.strictEqual(isValidColor('#AbCdEf'), true);
    });
    
    it('should reject invalid colors', () => {
      assert.strictEqual(isValidColor('red'), false);
      assert.strictEqual(isValidColor('FF0000'), false);  // Missing #
      assert.strictEqual(isValidColor('#FFF'), false);     // Too short
      assert.strictEqual(isValidColor('#FFFFFFF'), false); // Too long
      assert.strictEqual(isValidColor('#GGGGGG'), false);  // Invalid chars
      assert.strictEqual(isValidColor(123), false);        // Not a string
      assert.strictEqual(isValidColor(null), false);
      assert.strictEqual(isValidColor(undefined), false);
    });
  });
  
  describe('Index Validation', () => {
    const CANVAS_SIZE = 200 * 200; // 40000
    
    const isValidIndex = (index) => {
      return Number.isInteger(index) && index >= 0 && index < CANVAS_SIZE;
    };
    
    it('should accept valid indices', () => {
      assert.strictEqual(isValidIndex(0), true);
      assert.strictEqual(isValidIndex(1000), true);
      assert.strictEqual(isValidIndex(39999), true);
    });
    
    it('should reject invalid indices', () => {
      assert.strictEqual(isValidIndex(-1), false);
      assert.strictEqual(isValidIndex(40000), false);
      assert.strictEqual(isValidIndex(50000), false);
      assert.strictEqual(isValidIndex(1.5), false);
      assert.strictEqual(isValidIndex('100'), false);
      assert.strictEqual(isValidIndex(null), false);
      assert.strictEqual(isValidIndex(undefined), false);
    });
  });
});

describe('Color Conversion', () => {
  
  const rgbToHex = (rgb) => {
    if (rgb.startsWith('#')) {
      return rgb.toUpperCase();
    }
    
    const match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    if (!match) {
      return '#000000';
    }
    
    const r = parseInt(match[1], 10);
    const g = parseInt(match[2], 10);
    const b = parseInt(match[3], 10);
    
    return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase();
  };
  
  it('should convert RGB to hex', () => {
    assert.strictEqual(rgbToHex('rgb(255, 0, 0)'), '#FF0000');
    assert.strictEqual(rgbToHex('rgb(0, 255, 0)'), '#00FF00');
    assert.strictEqual(rgbToHex('rgb(0, 0, 255)'), '#0000FF');
    assert.strictEqual(rgbToHex('rgb(255, 255, 255)'), '#FFFFFF');
    assert.strictEqual(rgbToHex('rgb(0, 0, 0)'), '#000000');
  });
  
  it('should pass through hex colors (uppercase)', () => {
    assert.strictEqual(rgbToHex('#ff0000'), '#FF0000');
    assert.strictEqual(rgbToHex('#FFFFFF'), '#FFFFFF');
  });
  
  it('should fallback to black for invalid input', () => {
    assert.strictEqual(rgbToHex('invalid'), '#000000');
    assert.strictEqual(rgbToHex(''), '#000000');
  });
});
