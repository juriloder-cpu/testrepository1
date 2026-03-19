import axios from 'axios';
import {
  Project,
  Script,
  Image,
  Setting,
  SettingValue,
  ScriptGenerateRequest,
  ImageGenerateRequest,
  ImagePrompt
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Projects
export const projectsApi = {
  getAll: () => api.get<Project[]>('/api/projects'),
  getById: (id: number) => api.get<Project>(`/api/projects/${id}`),
  create: (data: Omit<Project, 'id' | 'created_at' | 'updated_at'>) =>
    api.post<Project>('/api/projects', data),
  update: (id: number, data: Partial<Project>) =>
    api.put<Project>(`/api/projects/${id}`, data),
  delete: (id: number) => api.delete(`/api/projects/${id}`),
};

// Scripts
export const scriptsApi = {
  getAll: (projectId?: number) =>
    api.get<Script[]>('/api/scripts', { params: { project_id: projectId } }),
  getById: (id: number) => api.get<Script>(`/api/scripts/${id}`),
  create: (data: Omit<Script, 'id' | 'created_at' | 'updated_at'>) =>
    api.post<Script>('/api/scripts', data),
  generate: (data: ScriptGenerateRequest) =>
    api.post<Script>('/api/scripts/generate', data),
  update: (id: number, data: Partial<Script>) =>
    api.put<Script>(`/api/scripts/${id}`, data),
  delete: (id: number) => api.delete(`/api/scripts/${id}`),
  export: (id: number, format: 'txt' | 'md') =>
    api.get(`/api/scripts/${id}/export`, {
      params: { format },
      responseType: 'blob',
    }),
  generateDescription: (id: number, provider: string = 'claude') =>
    api.post<{ title: string; description: string; tags: string }>(
      `/api/scripts/${id}/generate-description`,
      null,
      { params: { provider } }
    ),
};

// Images
export const imagesApi = {
  getAll: (projectId?: number) =>
    api.get<Image[]>('/api/images', { params: { project_id: projectId } }),
  getById: (id: number) => api.get<Image>(`/api/images/${id}`),
  generatePrompts: (scriptId: number) =>
    api.post<{ prompts: ImagePrompt[] }>('/api/images/generate-prompts', null, {
      params: { script_id: scriptId }
    }),
  generate: (data: ImageGenerateRequest) =>
    api.post<Image[]>('/api/images/generate', data),
  download: (id: number) =>
    api.get(`/api/images/${id}/download`, { responseType: 'blob' }),
  downloadAll: (projectId: number) =>
    api.get(`/api/images/project/${projectId}/download-all`, { responseType: 'blob' }),
  delete: (id: number) => api.delete(`/api/images/${id}`),
};

// Settings
export const settingsApi = {
  getAll: () => api.get<Setting[]>('/api/settings'),
  getByKey: (key: string) => api.get<SettingValue>(`/api/settings/${key}`),
  create: (data: { key_name: string; value: string; description?: string }) =>
    api.post<Setting>('/api/settings', data),
  update: (key: string, data: { value: string; description?: string }) =>
    api.put<Setting>(`/api/settings/${key}`, data),
  delete: (key: string) => api.delete(`/api/settings/${key}`),
};

export default api;
