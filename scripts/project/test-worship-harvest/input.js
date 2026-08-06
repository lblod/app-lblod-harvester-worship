import readline from "node:readline/promises";
import { CENTRALE_VINDPLAATS } from "./config.js";
import { sparql } from "./sparql.js";
import { bestuurByUriQuery, besturenSearchQuery } from "./queries.js";

export async function chooseBestuur(argv) {
  if (argv[0]) {
    const [row] = await sparql(CENTRALE_VINDPLAATS, bestuurByUriQuery(argv[0]));
    if (!row) throw new Error("bestuur not found on Centrale Vindplaats: " + argv[0]);
    return { uri: argv[0], label: row.label.value };
  }
  const reader = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    const search = (await reader.question("search bestuur by name (or part of it): ")).trim();
    const rows = await sparql(CENTRALE_VINDPLAATS, besturenSearchQuery(search));
    if (!rows.length) throw new Error("no besturen found for '" + search + "'");
    rows.forEach((row, index) => console.log("[" + (index + 1) + "] " + row.label.value + " (" + row.uri.value + ")"));
    const chosen = rows[Number((await reader.question("pick a number: ")).trim()) - 1];
    if (!chosen) throw new Error("invalid choice");
    return { uri: chosen.uri.value, label: chosen.label.value };
  } finally {
    reader.close();
  }
}
