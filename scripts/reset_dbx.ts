import { Dropbox } from 'dropbox';
import { loadEnv } from 'vite';

// Load env vars from the project root
const env = loadEnv('', process.cwd());

const dbx = new Dropbox({
  clientId: env.VITE_DROPBOX_CLIENT_ID,
  clientSecret: env.VITE_DROPBOX_CLIENT_SECRET,
  refreshToken: env.VITE_DROPBOX_REFRESH_TOKEN
});

async function reset() {
  console.log('Connecting to Dropbox to reset factory data...');
  const files = ['/data/inward.json', '/data/outward.json', '/data/orders.json'];

  for (const file of files) {
    try {
      await dbx.filesUpload({
        path: file,
        contents: JSON.stringify([], null, 2),
        mode: { '.tag': 'overwrite' }
      });
      console.log(`✅ Cleared ${file}`);
    } catch (e: any) {
      console.error(`❌ Failed to clear ${file}:`, e?.error || e);
    }
  }
}

reset();
