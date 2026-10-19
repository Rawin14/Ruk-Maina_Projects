export type FlowerType = 'rose' | 'sunflower' | 'tulip' | 'daisy';

export interface FlowerCounts {
  rose: number;
  sunflower: number;
  tulip: number;
  daisy: number;
}

export interface FlowerConfig {
  counts: FlowerCounts;
  wrapperColor: string;
  wrapperName: string;
  ribbonColor: string;
  wrapperOpacity?: number;
  holderStyle: 'wrap' | 'vase';
  address: string;
  cardTheme?: 'pink' | 'cream' | 'lavender';
}

export interface QuizResponses {
  firstdate: string;
  doYouLoveMe: string;
  dodgeCount: number;
  loveLevel: number;
  partnerBirthday: string;
  birthDay: string;
  birthMonth: string;
  secretMessage: string;
}

export interface SubmissionPayload {
  id?: string;
  nickname: string;
  secret_code: string;
  responses: QuizResponses;
  flower_config: FlowerConfig;
  love_score: number;
  secret_message: string;
  address_info: string;
  bouquet_preview_data_url?: string;
  created_at?: string;
}