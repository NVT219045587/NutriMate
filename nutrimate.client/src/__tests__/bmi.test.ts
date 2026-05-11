import { calculateBmi, getBmiInfo, bmiToPercent } from '../utils/bmi';

describe('calculateBmi', () => {
  it('calculates BMI correctly for standard values', () => {
    expect(calculateBmi(70, 175)).toBe(22.9);
  });

  it('rounds to one decimal place', () => {
    expect(calculateBmi(80, 180)).toBe(24.7);
  });

  it('handles edge case of very low weight', () => {
    expect(calculateBmi(40, 170)).toBe(13.8);
  });
});

describe('getBmiInfo', () => {
  it('returns Underweight for BMI below 18.5', () => {
    expect(getBmiInfo(17).category).toBe('Underweight');
  });

  it('returns Healthy Weight for BMI 18.5–24.9', () => {
    expect(getBmiInfo(22).category).toBe('Healthy Weight');
  });

  it('returns Overweight for BMI 25–29.9', () => {
    expect(getBmiInfo(27).category).toBe('Overweight');
  });

  it('returns Obese (Class I) for BMI 30–34.9', () => {
    expect(getBmiInfo(32).category).toBe('Obese (Class I)');
  });

  it('returns Obese (Class II) for BMI 35–39.9', () => {
    expect(getBmiInfo(37).category).toBe('Obese (Class II)');
  });

  it('returns Obese (Class III) for BMI 40 and above', () => {
    expect(getBmiInfo(42).category).toBe('Obese (Class III)');
  });

  it('carries the input BMI value in the result', () => {
    const result = getBmiInfo(22.9);
    expect(result.value).toBe(22.9);
  });

  // Boundary values
  it('classifies exactly 18.5 as Healthy Weight', () => {
    expect(getBmiInfo(18.5).category).toBe('Healthy Weight');
  });

  it('classifies exactly 25 as Overweight', () => {
    expect(getBmiInfo(25).category).toBe('Overweight');
  });

  it('classifies exactly 30 as Obese (Class I)', () => {
    expect(getBmiInfo(30).category).toBe('Obese (Class I)');
  });
});

describe('bmiToPercent', () => {
  it('converts mid-range BMI to correct percentage', () => {
    expect(bmiToPercent(20)).toBe(50);
  });

  it('caps at 100 when BMI equals 40', () => {
    expect(bmiToPercent(40)).toBe(100);
  });

  it('caps at 100 when BMI exceeds 40', () => {
    expect(bmiToPercent(50)).toBe(100);
  });

  it('returns 0 for BMI of 0', () => {
    expect(bmiToPercent(0)).toBe(0);
  });
});
