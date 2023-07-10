import { writeFileSync } from "fs";
import { fetchLoan } from "./loan";

const EXPIRATION = 3600 * 4; // 4 hours
const QQ_DOC_ID = "DQU5aYnZQRE1mVWVW";
const TABLE_NAMES = ["9mr8fo", "w5wcwz", "w03t1a"];

async function main() {
  console.log("Loading the loan table");
  try {
    const loanData = await fetchLoan(QQ_DOC_ID, TABLE_NAMES);
    console.log(`${Object.keys(loanData).length} entried loaded`);
    const now = Math.floor(new Date().getTime() / 1000);
    const data = {
      data: loanData,
      timestamp: now,
      expire: now + EXPIRATION,
    };
    console.log("Writing data to file");
    writeFileSync("docs/data.json", JSON.stringify(data));
  } catch (err) {
    console.log("Error:", err);
    process.exit(-1);
  }
}

main();
