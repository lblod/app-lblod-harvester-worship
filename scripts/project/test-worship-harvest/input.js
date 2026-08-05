import readline from "node:readline/promises";
import { CP } from "./config.js";
import { sparql } from "./sparql.js";
import { bestuurByUriQuery, besturenSearchQuery } from "./queries.js";

export async function chooseBestuur(argv) {
  if (argv[0]) {
    const rows = await sparql(CP, bestuurByUriQuery(argv[0]));
    if (!Array.isArray(rows) || rows.length === 0) {
      throw new Error("bestuur not found on Centrale Vindplaats: " + argv[0]);
    }
    return { uri: argv[0], label: rows[0].label.value };
  }
  const reader = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    const search = (await reader.question("search bestuur by name (or part of it): ")).trim();
    const rows = await sparql(CP, besturenSearchQuery(search));
    if (!Array.isArray(rows) || rows.length === 0) throw new Error("no besturen found for '" + search + "'");
    rows.forEach((row, index) => console.log("[" + (index + 1) + "] " + row.label.value + " (" + row.uri.value + ")"));
    const picked = parseInt((await reader.question("pick a number: ")).trim(), 10) - 1;
    if (isNaN(picked) || picked < 0 || picked >= rows.length) throw new Error("invalid choice");
    return { uri: rows[picked].uri.value, label: rows[picked].label.value };
  } finally {
    reader.close();
  }
}
