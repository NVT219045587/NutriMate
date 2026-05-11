export interface UserBrief {
  userId: string;
  username: string;
  fullName: string;
}

export interface UserProfile {
  userId: string;
  username: string;
  fullName: string;
  age: number;
  weight: number;
  height: number;
  gender: 'male' | 'female' | 'other';
  lastLoginAt: string | null;
  createdAt: string;
}

export interface AuthResponse {
  csrfToken: string;
  user: UserBrief;
}

export interface Food {
  foodId: string;
  foodName: string;
  foodType: string;
  caloriesPerUnit: number;
  unitOfMeasurement: string;
  standardWeight: number;
}

export interface NutritionLogDto {
  id: string;
  foodId: string;
  foodName: string;
  foodType: string;
  unitOfMeasurement: string;
  caloriesPerUnit: number;
  qty: number;
  totalCalories: number;
  logDate: string;
}

export interface DailyLogResponse {
  date: string;
  logs: NutritionLogDto[];
  totalConsumed: number;
  dailyGoal: number;
  remaining: number;
}

export interface WeeklyHistoryItem {
  date: string;
  calories: number;
  goal: number;
}

export interface WeeklyHistoryResponse {
  history: WeeklyHistoryItem[];
  dailyGoal: number;
}

export interface BmiInfo {
  value: number;
  category: string;
  color: string;
  description: string;
}
