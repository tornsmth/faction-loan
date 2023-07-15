import { getSheetData } from './feishu';

const NAME_COLUMN = 0;
const MAX_LOAN_AMOUNT = 10e9; // 10b

export type LoanData = { [uid: string]: number };

async function fetchLoanTable(spreadsheet: string, sheet: string, accessToken: string): Promise<object> {
  const sheetData = await getSheetData(spreadsheet, sheet, accessToken);
  let headerRow;
  let amountColumn;
  for (let i = 0; i < sheetData.length; i++) {
    if (sheetData[i][NAME_COLUMN] === '游戏昵称+ID') {
      for (let j = 0; j < sheetData[0].length; j++) {
        const cell = sheetData[i][j];
        if (typeof cell === 'string' && cell.startsWith('贷款金额(M)')) {
          amountColumn = j;
          break;
        }
      }
      headerRow = i;
      break;
    }
  }
  if (headerRow === undefined || amountColumn === undefined) {
    throw new Error(`Cannot find header in sheet ${sheet}`);
  }

  const loan: LoanData = {};
  for (let i = headerRow + 1; i < sheetData.length; i++) {
    const nameCell = sheetData[i][NAME_COLUMN];
    const amountCell = sheetData[i][amountColumn];
    if (typeof nameCell !== 'string' || typeof amountCell !== 'number') {
      continue;
    }
    const match = nameCell.match(/\[(\d+)\]/);
    const amount = amountCell * 1e6;
    if (match && amount >= 0 && amount <= MAX_LOAN_AMOUNT) {
      loan[match[1]] = amount;
    }
  }
  return loan;
}

export async function fetchLoan(spreadsheet: string, sheets: Array<string>, accessToken: string): Promise<LoanData> {
  const subLoans = await Promise.all(sheets.map((sheet) => fetchLoanTable(spreadsheet, sheet, accessToken)));
  return Object.assign({}, ...subLoans);
}
