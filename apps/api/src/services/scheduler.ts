import { getServiceClient } from './supabase.js';
import { getValidAccessToken, uploadVideoToYouTube } from './youtube.js';

const POLL_INTERVAL_MS = 60_000;

export function startScheduler() {
  console.log('[scheduler] YouTube auto-publish scheduler started (polls every 60s)');
  setInterval(processScheduledPublishes, POLL_INTERVAL_MS);
  processScheduledPublishes();
}

async function processScheduledPublishes() {
  const supa = getServiceClient();

  const { data: dueProjects, error } = await supa
    .from('projects')
    .select('id, user_id, title, final_video_path, yt_title, yt_description, yt_tags, yt_privacy, yt_scheduled_at')
    .not('yt_scheduled_at', 'is', null)
    .is('yt_video_id', null)
    .eq('status', 'ready')
    .not('final_video_path', 'is', null)
    .lte('yt_scheduled_at', new Date().toISOString());

  if (error) {
    console.error('[scheduler] Failed to query scheduled projects:', error.message);
    return;
  }

  if (!dueProjects || dueProjects.length === 0) return;

  console.log(`[scheduler] ${dueProjects.length} video(s) due for publishing`);

  for (const project of dueProjects) {
    try {
      await publishScheduledVideo(project);
    } catch (e) {
      console.error(`[scheduler] Failed to publish project ${project.id}:`, e instanceof Error ? e.message : e);
    }
  }
}

async function publishScheduledVideo(project: {
  id: string;
  user_id: string;
  title: string;
  final_video_path: string | null;
  yt_title: string | null;
  yt_description: string | null;
  yt_tags: string[] | null;
  yt_privacy: string | null;
  yt_scheduled_at: string | null;
}) {
  const supa = getServiceClient();

  console.log(`[scheduler] Publishing project ${project.id} (scheduled at ${project.yt_scheduled_at})`);

  const accessToken = await getValidAccessToken(project.user_id);

  const { data: videoBlob, error: dlErr } = await supa.storage
    .from('project-assets')
    .download(project.final_video_path!);

  if (dlErr || !videoBlob) {
    throw new Error(`Failed to download video: ${dlErr?.message ?? 'no blob'}`);
  }

  const videoBuffer = Buffer.from(await videoBlob.arrayBuffer());

  const title = project.yt_title ?? project.title;
  const description = project.yt_description ?? '';
  const tags = project.yt_tags ?? [];
  const privacy = (project.yt_privacy as 'public' | 'unlisted' | 'private') ?? 'public';

  const { videoId } = await uploadVideoToYouTube({
    accessToken,
    videoBuffer,
    title,
    description,
    tags,
    privacyStatus: privacy,
  });

  await supa
    .from('projects')
    .update({
      yt_video_id: videoId,
      yt_published_at: new Date().toISOString(),
      yt_scheduled_at: null,
    })
    .eq('id', project.id);

  console.log(`[scheduler] Published project ${project.id} → youtube.com/shorts/${videoId}`);
}
