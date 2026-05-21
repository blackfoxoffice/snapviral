import fetch from 'node-fetch';

const SUPABASE_URL = 'https://lzlbvtvlxqizkizxgpog.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6bGJ2dHZseHFpemtpenhncG9nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Njk4NDQ1MCwiZXhwIjoyMDkyNTYwNDUwfQ.Fa2VbldKfHMIe6A1qmDAEje9QrM8k1cgrhS2y0lks9E';

async function updateBucket() {
  const url = `${SUPABASE_URL}/storage/v1/bucket/project-assets`;
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
    },
    body: JSON.stringify({
      file_size_limit: 524288000 // 500MB
    })
  });
  
  if (!response.ok) {
    console.error('Failed:', await response.text());
    process.exit(1);
  }
  
  console.log('Success:', await response.json());
}

updateBucket();
