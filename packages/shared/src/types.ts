export type ProjectStatus = 'draft' | 'queued' | 'running' | 'ready' | 'failed';
export type ProjectLanguage = 'ta' | 'en' | 'hi';
export type InputMode = 'urls' | 'script' | 'topic' | 'research';
export type ImageStyle = 'cartoon' | 'illustrated' | 'realistic' | 'ultra_realistic';

export interface ResearchResult {
  summary: string;
  citations: string[];
}
export type AssetType = 'transcript' | 'script' | 'image' | 'audio' | 'subtitle' | 'video';
export type PipelineStep = 'ingest' | 'script' | 'images' | 'voice' | 'align' | 'compose';
export type JobStatus = 'pending' | 'running' | 'done' | 'failed';

export interface SocialHandles {
  youtube: string | null;
  instagram: string | null;
  facebook: string | null;
  twitter: string | null;
  tiktok: string | null;
}

export interface YouTubeConnection {
  channel_id: string | null;
  channel_name: string | null;
  connected: boolean;
}

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  logo_path: string | null;
  social_youtube: string | null;
  social_instagram: string | null;
  social_facebook: string | null;
  social_twitter: string | null;
  social_tiktok: string | null;
  yt_channel_id: string | null;
  yt_channel_name: string | null;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminSecret {
  key_name: string;
  description: string | null;
  last4: string | null;
  created_at: string;
  rotated_at: string | null;
}

export interface SecretAccessLogEntry {
  id: string;
  key_name: string;
  action: 'read' | 'create' | 'rotate' | 'delete';
  actor_id: string | null;
  actor_role: string | null;
  created_at: string;
}

export interface AdminOverview {
  user_count: number;
  project_count: number;
  ready_videos: number;
  published_videos: number;
  scheduled_videos: number;
  failed_videos: number;
  active_jobs: number;
  total_storage_seconds: number;
}

export type Plan = 'free' | 'starter' | 'creator' | 'pro' | 'studio';
export type PlanStatus = 'active' | 'past_due' | 'canceled' | 'paused' | 'trialing';
export type Currency = 'USD' | 'INR';

export interface PlanDef {
  key: Plan;
  name: string;
  description: string;
  monthlyPriceUsdCents: number;
  monthlyPriceInrPaise: number;
  monthlyVideoLimit: number;
  maxDurationSeconds: number;
  features: string[];
}

export interface BillingMe {
  plan: Plan;
  plan_status: PlanStatus;
  current_period_end: string | null;
  has_active_subscription: boolean;
  quota: {
    monthly_video_limit: number;
    max_duration_seconds: number;
    used_this_month: number;
  } | null;
}

export interface Project {
  id: string;
  user_id: string;
  title: string;
  topic: string | null;
  language: ProjectLanguage;
  duration_seconds: number;
  input_mode: InputMode;
  source_urls: string[] | null;
  user_script: string | null;
  voice_id: string | null;
  image_style: ImageStyle;
  logo_path: string | null;
  status: ProjectStatus;
  current_step: string | null;
  progress_pct: number;
  final_video_path: string | null;
  error: string | null;
  yt_video_id: string | null;
  yt_title: string | null;
  yt_description: string | null;
  yt_tags: string[] | null;
  yt_published_at: string | null;
  yt_scheduled_at: string | null;
  yt_privacy: string | null;
  created_at: string;
  updated_at: string;
}

export interface PipelineJob {
  id: string;
  project_id: string;
  step: PipelineStep | string;
  status: JobStatus;
  input: unknown;
  output: unknown;
  error: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
}

export interface Asset {
  id: string;
  project_id: string;
  type: AssetType;
  storage_path: string | null;
  content: unknown;
  scene_index: number | null;
  metadata: unknown;
  created_at: string;
}

export interface Scene {
  narration: string;
  visual_prompt: string;
}

export interface ScriptOutput {
  title: string;
  hook: string;
  scenes: Scene[];
  cta: string;
}

export interface ElevenLabsAlignment {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
}

export interface ProjectWithRelations extends Project {
  jobs: PipelineJob[];
  assets: Asset[];
}
