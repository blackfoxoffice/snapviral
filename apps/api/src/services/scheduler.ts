import { getServiceClient } from './supabase.js';
import { getValidAccessToken, uploadVideoToYouTube } from './youtube.js';
import { runPipeline } from '../pipeline/runner.js';

const POLL_INTERVAL_MS = 60_000;
const AUTOMATION_TICK_MS = 5 * 60_000; // 5 min — auto-publish slots have minute granularity at most

export function startScheduler() {
  console.log('[scheduler] YouTube auto-publish scheduler started (polls every 60s)');
  setInterval(processScheduledPublishes, POLL_INTERVAL_MS);
  processScheduledPublishes();

  console.log('[scheduler] Automation worker started (ticks every 5 min)');
  setInterval(processAutomationQueue, AUTOMATION_TICK_MS);
  // Don't auto-run on boot — wait one tick so any in-flight deploys settle
}

// =====================================================================
// 1. Existing flow: publish projects whose yt_scheduled_at is due
// =====================================================================
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

// =====================================================================
// 2. New flow: auto-publish workflow
//    For each user with auto_publish_enabled, if it's a publish slot AND
//    they're under their daily quota AND they have unused topics queued,
//    pop a topic, create a project, kick off generation. The pipeline
//    runner sets yt_scheduled_at on completion so the existing publish
//    flow above handles upload to YouTube.
// =====================================================================
const SLOT_WINDOW_MIN = 5; // a slot is "active" if scheduler runs within +/- SLOT_WINDOW_MIN

interface AutomationProfile {
  id: string;
  plan: string;
  auto_publish_enabled: boolean;
  publish_times: string[];
  automation_language: string;
  automation_image_style: string;
  automation_voice_id: string | null;
  automation_duration_seconds: number;
  automation_input_mode: string;
  automation_privacy: string;
  daily_video_limit: number;
  used_today: number;
}

async function processAutomationQueue() {
  const supa = getServiceClient();

  // Pull users who have automation on AND a YouTube channel connected.
  // Join with plan_automation_limits to get the daily cap.
  const { data: users, error } = await supa
    .from('plan_automation_limits')
    .select('user_id, plan, daily_video_limit, used_today, auto_publish_enabled');
  if (error) {
    console.error('[automation] Failed to query candidates:', error.message);
    return;
  }

  const eligible = (users ?? []).filter(
    (u) => u.auto_publish_enabled && u.daily_video_limit > 0 && u.used_today < u.daily_video_limit,
  );
  if (eligible.length === 0) return;

  // Hydrate the per-user automation settings + verify YouTube is connected
  const ids = eligible.map((u) => u.user_id);
  const { data: profiles } = await supa
    .from('profiles')
    .select(
      'id, plan, auto_publish_enabled, publish_times, automation_language, automation_image_style, automation_voice_id, automation_duration_seconds, automation_input_mode, automation_privacy, yt_refresh_token',
    )
    .in('id', ids);

  if (!profiles) return;

  for (const p of profiles) {
    const limits = eligible.find((u) => u.user_id === p.id);
    if (!limits) continue;
    if (!p.yt_refresh_token) continue; // YouTube must be connected

    if (!isPublishSlotNow(p.publish_times)) continue;

    try {
      await tryGenerateNextForUser({
        ...(p as Omit<AutomationProfile, 'daily_video_limit' | 'used_today'>),
        daily_video_limit: limits.daily_video_limit,
        used_today: limits.used_today,
      });
    } catch (e) {
      console.error(`[automation] User ${p.id} failed:`, e instanceof Error ? e.message : e);
    }
  }
}

/**
 * Return true if NOW (in IST) is within ±SLOT_WINDOW_MIN minutes of any
 * configured publish time. We compare HH:MM in Asia/Kolkata.
 */
function isPublishSlotNow(publishTimes: string[] | null | undefined): boolean {
  if (!publishTimes || publishTimes.length === 0) return false;
  const fmt = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = fmt.formatToParts(new Date());
  const h = parseInt(parts.find((p) => p.type === 'hour')?.value ?? '0', 10);
  const m = parseInt(parts.find((p) => p.type === 'minute')?.value ?? '0', 10);
  const nowMin = h * 60 + m;

  for (const t of publishTimes) {
    const [hh, mm] = t.split(':').map((s) => parseInt(s, 10));
    if (Number.isNaN(hh) || Number.isNaN(mm)) continue;
    const slotMin = hh! * 60 + mm!;
    const delta = Math.abs(nowMin - slotMin);
    // Wrap-around: 23:58 vs 00:02 -> delta is 4, not 1436
    const wrapDelta = Math.min(delta, 1440 - delta);
    if (wrapDelta <= SLOT_WINDOW_MIN) return true;
  }
  return false;
}

async function tryGenerateNextForUser(profile: AutomationProfile) {
  const supa = getServiceClient();

  // Avoid stacking: if the user already has a project in 'queued' or 'running'
  // state right now, wait for the next slot. Prevents the worker firing
  // multiple generations during the 5-min slot window.
  const { count: inflight } = await supa
    .from('projects')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', profile.id)
    .in('status', ['queued', 'running']);
  if ((inflight ?? 0) > 0) {
    console.log(`[automation] ${profile.id}: skipping — already has in-flight generation`);
    return;
  }

  // Claim the next topic atomically
  const { data: claimed, error: claimErr } = await supa.rpc('claim_next_topic', {
    p_user_id: profile.id,
  });
  if (claimErr) {
    console.error(`[automation] ${profile.id}: claim_next_topic failed`, claimErr.message);
    return;
  }
  if (!claimed || claimed.length === 0) {
    // Queue empty — nothing to do this slot
    return;
  }

  const topicRow = claimed[0] as { id: string; topic: string };
  console.log(`[automation] ${profile.id}: starting "${topicRow.topic}"`);

  // Create the project
  const { data: profileLogo } = await supa
    .from('profiles')
    .select('logo_path')
    .eq('id', profile.id)
    .single();

  const { data: project, error: projErr } = await supa
    .from('projects')
    .insert({
      user_id: profile.id,
      title: topicRow.topic.slice(0, 80),
      topic: topicRow.topic,
      language: profile.automation_language,
      duration_seconds: profile.automation_duration_seconds,
      input_mode: profile.automation_input_mode,
      source_urls: null,
      user_script: null,
      voice_id: profile.automation_voice_id ?? null,
      image_style: profile.automation_image_style,
      logo_path: (profileLogo as { logo_path?: string } | null)?.logo_path ?? null,
      yt_privacy: profile.automation_privacy,
      status: 'queued',
    })
    .select('id')
    .single();

  if (projErr || !project) {
    console.error(`[automation] ${profile.id}: project insert failed`, projErr?.message);
    return;
  }

  // Link the topic to the project for auditability
  await supa.from('topic_queue').update({ project_id: project.id }).eq('id', topicRow.id);

  // Run the pipeline. On completion, our pipeline runner sets status='ready'
  // — we then patch yt_scheduled_at = now so the existing publish loop picks
  // it up immediately. (Could also stagger by N minutes; immediate is fine.)
  setImmediate(async () => {
    try {
      await runPipeline(project.id);
      // Pipeline succeeded — schedule for upload immediately
      await supa
        .from('projects')
        .update({ yt_scheduled_at: new Date().toISOString() })
        .eq('id', project.id)
        .eq('status', 'ready');
      console.log(`[automation] ${profile.id}: project ${project.id} ready, queued for YouTube`);
    } catch (e) {
      console.error(`[automation] pipeline failed for ${project.id}:`, e instanceof Error ? e.message : e);
    }
  });
}
