import type { BmiInfo } from '../types';

export function calculateBmi(weight: number, height: number): number {
  const heightM = height / 100;
  return Math.round((weight / (heightM * heightM)) * 10) / 10;
}

export function getBmiInfo(bmi: number): BmiInfo {
  if (bmi < 18.5) {
    return { value: bmi, category: 'Underweight', color: '#1677ff', description: 'BMI below 18.5' };
  } else if (bmi < 25) {
    return { value: bmi, category: 'Healthy Weight', color: '#52c41a', description: 'BMI 18.5 – 24.9' };
  } else if (bmi < 30) {
    return { value: bmi, category: 'Overweight', color: '#faad14', description: 'BMI 25 – 29.9' };
  } else if (bmi < 35) {
    return { value: bmi, category: 'Obese (Class I)', color: '#ff7a45', description: 'BMI 30 – 34.9' };
  } else if (bmi < 40) {
    return { value: bmi, category: 'Obese (Class II)', color: '#ff4d4f', description: 'BMI 35 – 39.9' };
  } else {
    return { value: bmi, category: 'Obese (Class III)', color: '#a8071a', description: 'BMI ≥ 40' };
  }
}

// Returns a 0-100 percentage for a progress gauge where 40 BMI = 100%
export function bmiToPercent(bmi: number): number {
  return Math.min(Math.round((bmi / 40) * 100), 100);
}
