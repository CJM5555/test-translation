export interface StringResource {
  key: string;
  value: string;
  translatedValue?: string;
}

export interface TranslationProject {
  originalStrings: StringResource[];
  targetLanguages: string[];
  translations: Record<string, StringResource[]>;
}

export interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
}
