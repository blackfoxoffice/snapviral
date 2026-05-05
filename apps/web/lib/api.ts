import { supabase } from './supabase';
import type {
  AdminOverview,
  AdminSecret,
  AutomationSettings,
  AutomationStatus,
  BillingMe,
  Currency,
  Plan,
  PlanDef,
  Project,
  ProjectWithRelations,
  SecretAccessLogEntry,
  SocialHandles,
  TopicQueueItem,
  YouTubeConnection,
} from '@newsflow/shared';
import type { CreateProjectInput } from '@newsflow/shared';

export interface YouTubeMetadata {
  title: string;
  description: string;
  tags: string[];
}

export interface YouTubePublishResult {
  video_id?: string;
  url?: string;
  scheduled?: boolean;
  scheduled_at?: string;
  message?: string;
}

export interface VoiceOption {
  voice_id: string;
  name: string;
  gender: string;
  age: string;
  accent: string;
  use_case: string;
  description: string | null;
  preview_url: string;
  category: string;
}

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('Not authenticated');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

async function parseResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const body = (await res.json()) as { error?: string; message?: string };
      if (body.message) message = body.message;
      else if (body.error) message = body.error;
    } catch {
      // non-json body
    }
    throw new Error(message);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export interface DashboardStats {
  total_projects: number;
  ready_projects: number;
  failed_projects: number;
  running_projects: number;
  published_to_youtube: number;
  scheduled_youtube: number;
  created_this_month: number;
  created_this_week: number;
  ready_this_month: number;
  total_voiceover_seconds: number;
  by_language: Record<string, number>;
  by_input_mode: Record<string, number>;
  by_status: Record<string, number>;
  recent_projects: Array<{
    id: string;
    status: string;
    duration_seconds: number;
    created_at: string;
    yt_video_id: string | null;
    yt_published_at: string | null;
    language: string;
    input_mode: string;
  }>;
}

export const api = {
  async getDashboardStats(): Promise<DashboardStats> {
    const res = await fetch(`${BASE_URL}/api/dashboard/stats`, { headers: await authHeaders() });
    return parseResponse<DashboardStats>(res);
  },

  async listProjects(): Promise<Project[]> {
    const res = await fetch(`${BASE_URL}/api/projects`, { headers: await authHeaders() });
    return parseResponse<Project[]>(res);
  },

  async getProject(id: string): Promise<ProjectWithRelations> {
    const res = await fetch(`${BASE_URL}/api/projects/${id}`, {
      headers: await authHeaders(),
    });
    return parseResponse<ProjectWithRelations>(res);
  },

  async createProject(input: CreateProjectInput): Promise<Project> {
    const res = await fetch(`${BASE_URL}/api/projects`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify(input),
    });
    return parseResponse<Project>(res);
  },

  async generate(id: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/api/projects/${id}/generate`, {
      method: 'POST',
      headers: await authHeaders(),
    });
    await parseResponse<{ projectId: string }>(res);
  },

  async getDownloadUrl(id: string): Promise<string> {
    const res = await fetch(`${BASE_URL}/api/projects/${id}/download`, {
      headers: await authHeaders(),
    });
    const { url } = await parseResponse<{ url: string }>(res);
    return url;
  },

  async deleteProject(id: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/api/projects/${id}`, {
      method: 'DELETE',
      headers: await authHeaders(),
    });
    await parseResponse<void>(res);
  },

  async getLogo(): Promise<{ logo_url: string | null; logo_path?: string }> {
    const res = await fetch(`${BASE_URL}/api/profile/logo`, {
      headers: await authHeaders(),
    });
    return parseResponse(res);
  },

  async uploadLogo(dataUrl: string): Promise<{ logo_url: string | null; logo_path: string }> {
    const res = await fetch(`${BASE_URL}/api/profile/logo`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify({ image: dataUrl }),
    });
    return parseResponse(res);
  },

  async deleteLogo(): Promise<void> {
    const res = await fetch(`${BASE_URL}/api/profile/logo`, {
      method: 'DELETE',
      headers: await authHeaders(),
    });
    await parseResponse(res);
  },

  async listVoices(language: string): Promise<VoiceOption[]> {
    const res = await fetch(`${BASE_URL}/api/voices?language=${language}&page_size=20`, {
      headers: await authHeaders(),
    });
    const data = await parseResponse<{ voices: VoiceOption[]; total_count: number }>(res);
    return data.voices;
  },

  async getSocialHandles(): Promise<SocialHandles> {
    const res = await fetch(`${BASE_URL}/api/profile/social`, { headers: await authHeaders() });
    return parseResponse<SocialHandles>(res);
  },

  async updateSocialHandles(handles: Partial<SocialHandles>): Promise<SocialHandles> {
    const res = await fetch(`${BASE_URL}/api/profile/social`, {
      method: 'PUT',
      headers: await authHeaders(),
      body: JSON.stringify(handles),
    });
    return parseResponse<SocialHandles>(res);
  },

  async getYouTubeStatus(): Promise<YouTubeConnection> {
    const res = await fetch(`${BASE_URL}/api/youtube/status`, { headers: await authHeaders() });
    return parseResponse<YouTubeConnection>(res);
  },

  async getYouTubeAuthUrl(): Promise<string> {
    const res = await fetch(`${BASE_URL}/api/youtube/auth-url`, { headers: await authHeaders() });
    const data = await parseResponse<{ url: string }>(res);
    return data.url;
  },

  async disconnectYouTube(): Promise<void> {
    const res = await fetch(`${BASE_URL}/api/youtube/disconnect`, {
      method: 'DELETE',
      headers: await authHeaders(),
    });
    await parseResponse(res);
  },

  async generateYouTubeMetadata(projectId: string): Promise<YouTubeMetadata> {
    const res = await fetch(`${BASE_URL}/api/youtube/generate-metadata/${projectId}`, {
      method: 'POST',
      headers: await authHeaders(),
    });
    return parseResponse<YouTubeMetadata>(res);
  },

  async publishToYouTube(projectId: string, opts?: {
    title?: string;
    description?: string;
    tags?: string[];
    privacy?: 'public' | 'unlisted' | 'private';
    scheduled_at?: string | null;
  }): Promise<YouTubePublishResult> {
    const res = await fetch(`${BASE_URL}/api/youtube/publish/${projectId}`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify(opts ?? {}),
    });
    return parseResponse<YouTubePublishResult>(res);
  },

  async scheduleYouTube(projectId: string, opts: {
    scheduled_at: string;
    title?: string;
    description?: string;
    tags?: string[];
    privacy?: 'public' | 'unlisted' | 'private';
  }): Promise<{ scheduled: boolean; scheduled_at: string }> {
    const res = await fetch(`${BASE_URL}/api/youtube/schedule/${projectId}`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify(opts),
    });
    return parseResponse(res);
  },

  async cancelSchedule(projectId: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/api/youtube/schedule/${projectId}`, {
      method: 'DELETE',
      headers: await authHeaders(),
    });
    await parseResponse(res);
  },

  // ===== Admin =====

  async getAdminOverview(): Promise<AdminOverview> {
    const res = await fetch(`${BASE_URL}/api/admin/overview`, { headers: await authHeaders() });
    return parseResponse<AdminOverview>(res);
  },

  async listAdminSecrets(): Promise<AdminSecret[]> {
    const res = await fetch(`${BASE_URL}/api/admin/secrets`, { headers: await authHeaders() });
    return parseResponse<AdminSecret[]>(res);
  },

  async createAdminSecret(args: {
    key_name: string;
    value: string;
    description?: string;
  }): Promise<{ ok: boolean }> {
    const res = await fetch(`${BASE_URL}/api/admin/secrets`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify(args),
    });
    return parseResponse(res);
  },

  async rotateAdminSecret(key_name: string, value: string): Promise<{ ok: boolean }> {
    const res = await fetch(`${BASE_URL}/api/admin/secrets/${encodeURIComponent(key_name)}/rotate`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify({ value }),
    });
    return parseResponse(res);
  },

  async deleteAdminSecret(key_name: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/api/admin/secrets/${encodeURIComponent(key_name)}`, {
      method: 'DELETE',
      headers: await authHeaders(),
    });
    await parseResponse(res);
  },

  async getAdminAuditLog(limit = 50): Promise<SecretAccessLogEntry[]> {
    const res = await fetch(`${BASE_URL}/api/admin/audit-log?limit=${limit}`, {
      headers: await authHeaders(),
    });
    return parseResponse<SecretAccessLogEntry[]>(res);
  },

  async listAdminUsers(): Promise<Array<{ id: string; email: string; full_name: string; is_admin: boolean; created_at: string }>> {
    const res = await fetch(`${BASE_URL}/api/admin/users`, { headers: await authHeaders() });
    return parseResponse(res);
  },

  // ===== Billing =====

  async listPlans(): Promise<PlanDef[]> {
    const res = await fetch(`${BASE_URL}/api/billing/plans`, { headers: await authHeaders() });
    return parseResponse<PlanDef[]>(res);
  },

  async getBillingMe(): Promise<BillingMe> {
    const res = await fetch(`${BASE_URL}/api/billing/me`, { headers: await authHeaders() });
    return parseResponse<BillingMe>(res);
  },

  async createBillingCheckout(args: {
    plan: Exclude<Plan, 'free'>;
    currency: Currency;
  }): Promise<{ url: string }> {
    const res = await fetch(`${BASE_URL}/api/billing/checkout`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify(args),
    });
    return parseResponse<{ url: string }>(res);
  },

  async openBillingPortal(): Promise<{ url: string }> {
    const res = await fetch(`${BASE_URL}/api/billing/portal`, {
      method: 'POST',
      headers: await authHeaders(),
    });
    return parseResponse<{ url: string }>(res);
  },

  // ===== Automation =====

  async getAutomationStatus(): Promise<AutomationStatus> {
    const res = await fetch(`${BASE_URL}/api/automation/status`, { headers: await authHeaders() });
    return parseResponse<AutomationStatus>(res);
  },

  async updateAutomationSettings(settings: Partial<AutomationSettings>): Promise<{ ok: boolean }> {
    const res = await fetch(`${BASE_URL}/api/automation/settings`, {
      method: 'PUT',
      headers: await authHeaders(),
      body: JSON.stringify(settings),
    });
    return parseResponse(res);
  },

  async addTopics(topics: string[]): Promise<{ added: number; topics: TopicQueueItem[] }> {
    const res = await fetch(`${BASE_URL}/api/automation/topics`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify({ topics }),
    });
    return parseResponse(res);
  },

  async deleteTopic(id: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/api/automation/topics/${id}`, {
      method: 'DELETE',
      headers: await authHeaders(),
    });
    await parseResponse(res);
  },

  async clearTopics(): Promise<void> {
    const res = await fetch(`${BASE_URL}/api/automation/topics`, {
      method: 'DELETE',
      headers: await authHeaders(),
    });
    await parseResponse(res);
  },
};
