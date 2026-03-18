import { config } from 'dotenv';
import { Dropbox } from 'dropbox';

config();
const dbx = new Dropbox({ accessToken: process.env.VITE_DROPBOX_ACCESS_TOKEN });

async function check() {
  try {
    const res = await dbx.filesDownload({ path: '/data/inward.json' });
    const buf = (res.result as any).fileBinary;
    console.log("INWARD:", buf.toString());
  } catch(e: any) {
    console.log("INWARD ERROR:", e?.error || e);
  }
}
check();
