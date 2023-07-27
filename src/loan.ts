import { getBitableData } from './feishu';

const UID_ROW = '数字ID';
const AMOUNT_ROW = '贷款金额';
const START_ROW = '放款日期';
const PERIOD_ROW = '贷款期限';
const MAX_LOAN_AMOUNT = 10e9; // 10b
const MAX_PERIOD = 24; // 24 months

export type LoanData = { [uid: string]: number };

export async function fetchLoan(bitable: string, table: string, accessToken: string): Promise<LoanData> {
  const data = await getBitableData(bitable, table, accessToken);
  const loan: LoanData = {};
  const now = new Date().getTime();
  for (const record of data) {
    const fields = record.fields;
    const uid = fields[UID_ROW];
    const amount = parseInt(fields[AMOUNT_ROW]) * 1e6;
    const start = parseInt(fields[START_ROW]);
    const period = parseInt(fields[PERIOD_ROW]);
    if (typeof uid !== 'string' || isNaN(amount) || isNaN(start) || isNaN(period)) {
      continue;
    }
    if (amount < 0 || amount > MAX_LOAN_AMOUNT) {
      continue;
    }
    if (start >= now || period > MAX_PERIOD) {
      continue;
    }
    const expiryDate = new Date(start);
    expiryDate.setMonth(expiryDate.getMonth() + period);
    if (expiryDate.getTime() < now) {
      continue;
    }
    loan[uid] = amount;
  }
  return loan;
}
