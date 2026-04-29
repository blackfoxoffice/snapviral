import 'dotenv/config';

async function main() {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    console.error('ELEVENLABS_API_KEY is not set');
    process.exit(1);
  }

  const res = await fetch(
    'https://api.elevenlabs.io/v1/shared-voices?language=ta&category=professional&page_size=20',
    { headers: { 'xi-api-key': apiKey } },
  );
  if (!res.ok) {
    console.error(await res.text());
    process.exit(1);
  }
  const json = (await res.json()) as {
    voices: { voice_id: string; name: string; description?: string; preview_url?: string }[];
  };

  for (const v of json.voices.slice(0, 10)) {
    console.log(`${v.voice_id}\t${v.name}`);
    if (v.description) console.log(`  ${v.description}`);
    if (v.preview_url) console.log(`  preview: ${v.preview_url}`);
    console.log();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
