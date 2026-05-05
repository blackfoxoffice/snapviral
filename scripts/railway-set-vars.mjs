// Read env values from apps/api/.env and push them to Railway via the public GraphQL API.
// Reads on every run; nothing sensitive is written by this script.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENV_PATH = path.join(__dirname, '..', 'apps', 'api', '.env');

const TOKEN = process.env.RAILWAY_TOKEN;
const PROJECT_ID = process.env.RAILWAY_PROJECT_ID;
const ENV_ID = process.env.RAILWAY_ENV_ID;
const SERVICE_ID = process.env.RAILWAY_SERVICE_ID;

if (!TOKEN || !PROJECT_ID || !ENV_ID || !SERVICE_ID) {
  console.error('Required env: RAILWAY_TOKEN, RAILWAY_PROJECT_ID, RAILWAY_ENV_ID, RAILWAY_SERVICE_ID');
  process.exit(1);
}

// Keys we want to push (skip dev-only / Expo-prefixed ones)
const KEEP = new Set([
  'NODE_ENV',
  'PORT',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_PUBLISHABLE_KEY',
  'SUPABASE_SECRET_KEY',
  'OPENROUTER_API_KEY',
  'OPENROUTER_REFERER',
  'OPENROUTER_TITLE',
  'ELEVENLABS_API_KEY',
  'ELEVENLABS_VOICE_ID_TAMIL',
  'ELEVENLABS_VOICE_ID_ENGLISH',
  'ELEVENLABS_VOICE_ID_HINDI',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GOOGLE_REDIRECT_URI',
  'YOUTUBE_API_KEY',
  'DATABASE_URL',
]);

// Production overrides (e.g., FFmpeg paths in the Linux container, prod URLs)
const OVERRIDES = {
  NODE_ENV: 'production',
  PORT: '4000',
  FFMPEG_PATH: '/usr/bin/ffmpeg',
  FFPROBE_PATH: '/usr/bin/ffprobe',
  OPENROUTER_REFERER: 'https://app.snapviral.in',
  // GOOGLE_REDIRECT_URI is set after we know the public Railway domain
};

// Parse .env (stripping inline comments after #, quotes around values)
function parseEnv(content) {
  const out = {};
  for (const raw of content.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1);
    // Strip inline comment if value isn't quoted
    if (!value.startsWith('"') && !value.startsWith("'")) {
      const hashIdx = value.indexOf(' #');
      if (hashIdx >= 0) value = value.slice(0, hashIdx);
    }
    value = value.trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

const envContent = fs.readFileSync(ENV_PATH, 'utf8');
const parsed = parseEnv(envContent);

const final = {};
for (const k of KEEP) {
  if (parsed[k]) final[k] = parsed[k];
}
Object.assign(final, OVERRIDES);

async function setVar(name, value) {
  const res = await fetch('https://backboard.railway.com/graphql/v2', {
    method: 'POST',
    headers: {
      'Project-Access-Token': TOKEN,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: 'mutation V($input: VariableUpsertInput!) { variableUpsert(input: $input) }',
      variables: {
        input: {
          projectId: PROJECT_ID,
          environmentId: ENV_ID,
          serviceId: SERVICE_ID,
          name,
          value,
        },
      },
    }),
  });
  const json = await res.json();
  if (json.errors) {
    console.error(`FAIL ${name}:`, JSON.stringify(json.errors));
    return false;
  }
  return true;
}

let ok = 0;
let fail = 0;
for (const [k, v] of Object.entries(final)) {
  const success = await setVar(k, v);
  console.log(`${success ? '✓' : '✗'} ${k}`);
  if (success) ok++;
  else fail++;
}
console.log(`\n${ok} set, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
