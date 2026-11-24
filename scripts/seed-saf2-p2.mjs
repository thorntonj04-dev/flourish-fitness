// One-time loader for StrongAF 2.0 — Phase 2. The same import is available in the app:
// Workout Builder → "Import StrongAF 2.0 Phase 2" (admin only, uses your browser sign-in).
//
// Usage (from the repo root, as an ADMIN account):
//   node scripts/seed-saf2-p2.mjs
// You'll be prompted for your admin email and password (not stored anywhere).

import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { ref as dbRef, get } from 'firebase/database';
import { auth, db } from '../src/firebase.js';
import { importSaf2Phase2, PHASE_NAME } from '../src/data/saf2Phase2.js';

async function main() {
  let email = process.env.FLOURISH_EMAIL;
  let password = process.env.FLOURISH_PASSWORD;
  if (!email || !password) {
    const rl = readline.createInterface({ input, output });
    email = email || (await rl.question('Admin email: '));
    password = password || (await rl.question('Password: '));
    rl.close();
  }

  const { user } = await signInWithEmailAndPassword(auth, email.trim(), password);
  const role = (await get(dbRef(db, `users/${user.uid}/role`))).val();
  if (role !== 'admin') throw new Error(`Signed in, but this account's role is "${role}" — admin is required.`);

  const { programName, log } = await importSaf2Phase2(db);
  log.forEach(line => console.log(`✓ ${line}`));
  await signOut(auth);
  console.log(`\n4 workouts saved and added to ${programName} → ${PHASE_NAME}. Refresh the app to see them.`);
  process.exit(0);
}

main().catch(err => { console.error('✗ Failed:', err.message); process.exit(1); });
