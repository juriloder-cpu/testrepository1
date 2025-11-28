export interface Project {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at?: string;
}

export interface Script {
  id: number;
  project_id: number;
  content: string;
  ai_provider?: string;
  tone?: string;
  genre?: string;
  length?: string;
  created_at: string;
  updated_at?: string;
}

export interface Image {
  id: number;
  project_id: number;
  prompt: string;
  file_path: string;
  scene_number?: number;
  provider: string;
  created_at: string;
}

export interface VoiceOver {
  id: number;
  script_id: number;
  file_path: string;
  voice_id?: string;
  voice_provider?: string;
  duration?: number;
  created_at: string;
}

export interface Setting {
  id: number;
  key_name: string;
  description?: string;
}

export interface SettingValue extends Setting {
  value: string;
}

export interface ScriptGenerateRequest {
  project_id: number;
  provider: 'claude' | 'openai';
  tone?: string;
  length?: string;
  genre?: string;
  custom_prompt?: string;
}

export interface ImageGenerateRequest {
  project_id: number;
  script_id?: number;
  prompts?: string[];
  providers: string[];
  auto_generate_from_script: boolean;
}

export interface ImagePrompt {
  scene_number: number;
  prompt: string;
  description: string;
}
