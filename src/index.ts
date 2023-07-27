import assert from 'assert';
import dotenv from 'dotenv';
import { writeFileSync } from 'fs';
import { getTenantAccessToken } from './feishu';
import { fetchLoan } from './loan';

dotenv.config();

function requireEnv(name: string): string {
  const value = process.env[name];
  assert.ok(value, `FATAL: environment variable "${name}" is required`);
  return value;
}

const FEISHU_APP_ID = requireEnv('FEISHU_APP_ID');
const FEISHU_APP_SECRET = requireEnv('FEISHU_APP_SECRET');
const LOAN_BITABLE = requireEnv('LOAN_BITABLE');
const LOAN_TABLE = requireEnv('LOAN_TABLE');

const EXPIRATION = 3600 * 4; // 4 hours

async function main() {
  console.log('Loading the loan table');

  try {
    const accessToken = await getTenantAccessToken(FEISHU_APP_ID, FEISHU_APP_SECRET);
    const loanData = await fetchLoan(LOAN_BITABLE, LOAN_TABLE, accessToken);
    console.log(`${Object.keys(loanData).length} entried loaded`);
    const now = Math.floor(new Date().getTime() / 1000);
    const data = {
      data: loanData,
      timestamp: now,
      expire: now + EXPIRATION,
    };
    console.log('Writing data to file');
    writeFileSync('docs/data.json', JSON.stringify(data));
  } catch (err) {
    console.log('Error:', err);
    process.exit(-1);
  }
}

main();
