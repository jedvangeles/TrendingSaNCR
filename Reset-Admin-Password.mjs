import { randomBytes } from 'node:crypto';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { createInterface } from 'node:readline/promises';

async function resetPassword() {
  process.chdir(dirname(fileURLToPath(import.meta.url)));
  if (!existsSync('backend/accounts.mjs')) throw Error('Place this file beside the dashboard package.json.');
  if (existsSync('.env')) process.loadEnvFile('.env');
  if (process.env.DB_DRIVER && process.env.DB_DRIVER !== 'sqlite') throw Error('This recovery tool is for the SQLite installation.');

  const file = resolve(process.env.DB_FILE || 'data/trendsancr.sqlite');
  if (!existsSync(file)) throw Error('The configured dashboard database could not be found.');
  const db = new DatabaseSync(file);
  try {
    const email = 'angelesjamesedwarddanielle_bsit@plmun.edu.ph';
    const admin = db.prepare("SELECT id, name, email, role, status FROM team_accounts WHERE email = ? AND role = 'Administrator' AND status = 'Active'").get(email);
    if (!admin) throw Error('The original active administrator account could not be found.');
    console.log('Account: ' + admin.email);
    console.log('Database: ' + file);
    const prompt = createInterface({input: process.stdin, output: process.stdout});
    let answer;
    try { answer = await prompt.question('Generate a replacement password? [y/N] '); }
    finally { prompt.close(); }
    if (answer.trim().toLowerCase() !== 'y') return console.log('Cancelled.');

    const { accountStore } = await import('./backend/accounts.mjs');
    const accounts = await accountStore({
      exec: async (sql, args = []) => db.prepare(sql).run(...args),
      all: async (sql, args = []) => db.prepare(sql).all(...args)
    });
    const password = randomBytes(18).toString('base64url');
    await accounts.change(admin.id, { ...admin, password });
    console.log('New password: ' + password);
    console.log('Save it privately, then sign in and change it in User Management.');
  } finally { db.close(); }
}
resetPassword().catch(error => { console.error(error.message); process.exitCode = 1; });
