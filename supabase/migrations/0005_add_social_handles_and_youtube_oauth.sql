-- Social handles on profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS social_youtube TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS social_instagram TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS social_facebook TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS social_twitter TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS social_tiktok TEXT;

-- YouTube OAuth tokens on profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS yt_channel_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS yt_channel_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS yt_access_token TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS yt_refresh_token TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS yt_token_expires_at TIMESTAMPTZ;

-- YouTube publish metadata on projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS yt_video_id TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS yt_title TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS yt_description TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS yt_tags TEXT[];
ALTER TABLE projects ADD COLUMN IF NOT EXISTS yt_published_at TIMESTAMPTZ;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS yt_scheduled_at TIMESTAMPTZ;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS yt_privacy TEXT DEFAULT 'public';
