export interface AnalysisResult {
  is_food: boolean;
  dish_name: string;
  short_description: string;
  visible_ingredients: string[];
  portion_estimate: string;
  estimated_calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  confidence_score: number;
  healthy_or_indulgent: 'healthy' | 'balanced' | 'indulgent';
  one_short_health_note: string;
  one_healthier_alternative: string;
  error_message?: string;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  imageData: string; // Base64 dataURL
  result: AnalysisResult;
}
