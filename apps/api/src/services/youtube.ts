import { getServiceClient } from './supabase.js';
import { getSecret, requireSecret } from './secrets.js';

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const YT_UPLOAD_URL = 'https://www.googleapis.com/upload/youtube/v3/videos';
const YT_CHANNELS_URL = 'https://www.googleapis.com/youtube/v3/channels';

async function getClientCredentials() {
  // GOOGLE_CLIENT_ID is not secret (visible in OAuth URLs); read from env.
  // GOOGLE_CLIENT_SECRET is sensitive — read from vault, with env fallback.
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = (await getSecret('GOOGLE_CLIENT_SECRET')) ?? process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are required');
  return { clientId, clientSecret };
}

export async function getOAuthUrl(redirectUri: string, state: string): Promise<string> {
  const { clientId } = await getClientCredentials();
  const scopes = [
    'https://www.googleapis.com/auth/youtube.upload',
    'https://www.googleapis.com/auth/youtube.readonly',
  ].join(' ');
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: scopes,
    access_type: 'offline',
    prompt: 'consent',
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeCode(code: string, redirectUri: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const { clientId, clientSecret } = await getClientCredentials();
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token exchange failed: ${err}`);
  }
  return (await res.json()) as { access_token: string; refresh_token: string; expires_in: number };
}

export async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string;
  expires_in: number;
}> {
  const { clientId, clientSecret } = await getClientCredentials();
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token refresh failed: ${err}`);
  }
  return (await res.json()) as { access_token: string; expires_in: number };
}

export async function getValidAccessToken(userId: string): Promise<string> {
  const supa = getServiceClient();
  const { data } = await supa
    .from('profiles')
    .select('yt_access_token, yt_refresh_token, yt_token_expires_at')
    .eq('id', userId)
    .single();

  if (!data?.yt_refresh_token) throw new Error('YouTube not connected');

  const expiresAt = data.yt_token_expires_at ? new Date(data.yt_token_expires_at) : new Date(0);
  const now = new Date();

  if (data.yt_access_token && expiresAt > new Date(now.getTime() + 60_000)) {
    return data.yt_access_token;
  }

  const refreshed = await refreshAccessToken(data.yt_refresh_token);
  const newExpiry = new Date(now.getTime() + refreshed.expires_in * 1000);

  await supa
    .from('profiles')
    .update({
      yt_access_token: refreshed.access_token,
      yt_token_expires_at: newExpiry.toISOString(),
    })
    .eq('id', userId);

  return refreshed.access_token;
}

export async function fetchChannelInfo(accessToken: string): Promise<{
  channelId: string;
  channelName: string;
}> {
  const res = await fetch(`${YT_CHANNELS_URL}?part=snippet&mine=true`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Failed to fetch channel info: ${res.status}`);
  const json = (await res.json()) as {
    items?: { id: string; snippet: { title: string } }[];
  };
  const ch = json.items?.[0];
  if (!ch) throw new Error('No YouTube channel found for this account');
  return { channelId: ch.id, channelName: ch.snippet.title };
}

export async function uploadVideoToYouTube(args: {
  accessToken: string;
  videoBuffer: Buffer;
  title: string;
  description: string;
  tags: string[];
  categoryId?: string;
  privacyStatus?: 'public' | 'unlisted' | 'private';
}): Promise<{ videoId: string }> {
  const {
    accessToken,
    videoBuffer,
    title,
    description,
    tags,
    categoryId = '25',
    privacyStatus = 'public',
  } = args;

  const metadata = {
    snippet: {
      title: title.slice(0, 100),
      description: description.slice(0, 5000),
      tags: tags.slice(0, 30),
      categoryId,
    },
    status: {
      privacyStatus,
      selfDeclaredMadeForKids: false,
    },
  };

  const boundary = '----NewsflowUploadBoundary' + Date.now();
  const metadataJson = JSON.stringify(metadata);

  const header = [
    `--${boundary}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    metadataJson,
    `--${boundary}`,
    'Content-Type: video/mp4',
    '',
    '',
  ].join('\r\n');

  const footer = `\r\n--${boundary}--`;

  const headerBuf = Buffer.from(header, 'utf-8');
  const footerBuf = Buffer.from(footer, 'utf-8');
  const body = Buffer.concat([headerBuf, videoBuffer, footerBuf]);

  const params = new URLSearchParams({
    uploadType: 'multipart',
    part: 'snippet,status',
  });

  const res = await fetch(`${YT_UPLOAD_URL}?${params.toString()}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
      'Content-Length': String(body.length),
    },
    body,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`YouTube upload failed (${res.status}): ${errText}`);
  }

  const json = (await res.json()) as { id: string };
  return { videoId: json.id };
}
