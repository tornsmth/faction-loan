const MAX_PARSED_COLUMN = 10;
const MAX_PARSED_ROW = 1000;
const NAME_COLUMN = 0;
const MAX_LOAN_AMOUNT = 10e9; // 10b

export type LoanData = { [uid: string]: number };

type TableData = Map<number, string>;
interface LoanTable {
  data: TableData;
  row: number;
  column: number;
}

function parseTable(tableName: string, data: any): LoanTable {
  const tableData: TableData = new Map();
  const maxRow = data.clientVars.collab_client_vars.maxRow;
  const maxCol = data.clientVars.collab_client_vars.maxCol;
  const maxParsedRow = Math.min(maxRow, MAX_PARSED_ROW);
  for (const wrapper of data.clientVars.collab_client_vars.initialAttributedText
    .text[0]) {
    if (
      wrapper[0].t === 3 &&
      wrapper[0].c[0][0] === tableName &&
      typeof wrapper[0].c[1] === "object"
    ) {
      for (const [k, v] of Object.entries(wrapper[0].c[1])) {
        const index = parseInt(k);
        const row = Math.floor(index / maxCol);
        const column = index % maxCol;
        if (row < maxParsedRow && column < MAX_PARSED_COLUMN) {
          const cellData = (<any>v)["2"];
          if (cellData && cellData.length >= 2) {
            tableData.set(index, cellData[1]);
          }
        }
      }
    }
  }
  return { data: tableData, row: maxParsedRow, column: maxCol };
}

async function fetchLoanTable(
  qqDocId: string,
  tableName: string
): Promise<object> {
  const rsp = await fetch(
    `https://docs.qq.com/dop-api/opendoc?tab=${tableName}&id=${qqDocId}&outformat=1&normal=1`,
    {
      headers: { Referer: "https://docs.qq.com/" },
    }
  );
  const table = parseTable(tableName, <any>await rsp.json());
  let headerRow;
  let amountColumn;
  for (let i = 0; i < table.row; i++) {
    if (table.data.get(i * table.column + NAME_COLUMN) === "游戏昵称+ID") {
      for (let j = 0; j < MAX_PARSED_COLUMN; j++) {
        if (table.data.get(i * table.column + j)?.startsWith("贷款金额(M)")) {
          amountColumn = j;
          break;
        }
      }
      headerRow = i;
      break;
    }
  }
  if (headerRow === undefined || amountColumn === undefined) {
    throw new Error(`Cannot find header in table ${tableName}`);
  }

  const loan: LoanData = {};
  for (let i = headerRow + 1; i < table.row; i++) {
    const match = table.data
      .get(i * table.column + NAME_COLUMN)
      ?.match(/\[(\d+)\]/);
    const amount =
      parseInt(table.data.get(i * table.column + amountColumn) ?? "") * 1e6;
    if (match && amount >= 0 && amount <= MAX_LOAN_AMOUNT) {
      loan[match[1]] = amount;
    }
  }
  return loan;
}

export async function fetchLoan(
  qqDocId: string,
  tableNames: Array<string>
): Promise<LoanData> {
  const subLoans = await Promise.all(
    tableNames.map((name) => fetchLoanTable(qqDocId, name))
  );
  return Object.assign({}, ...subLoans);
}
