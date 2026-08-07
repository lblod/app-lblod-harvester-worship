import readline from "node:readline/promises";
import { CENTRALE_VINDPLAATS, VENDOR } from "./config.js";
import { sparql } from "./sparql.js";
import { bestuurByUriQuery, besturenSearchQuery } from "./queries.js";

export async function chooseBestuur(argv) {
  const reader = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    console.log("");
    console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    console.log("!!  WARNING: this script writes a real harvest job into the  !!");
    console.log("!!  worship harvester stack. It will create real data.       !!");
    console.log("!!  DO NOT run this against a production stack.              !!");
    console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    console.log("");
    const safety = (await reader.question("Are you in production? type NO to continue: ")).trim();
    if (safety !== "NO") {
      console.log("Aborting - type NO (CAPS) to confirm you are not in production.");
      process.exit(0);
    }

    const sourcePrompt = "SPARQL endpoint to query besturen from [enter = " + CENTRALE_VINDPLAATS + "]";
    const sourceInput = (await reader.question(sourcePrompt + ": ")).trim();
    const endpoint = sourceInput || CENTRALE_VINDPLAATS;
    if (endpoint !== CENTRALE_VINDPLAATS) console.log("using custom endpoint: " + endpoint);

    const vendorPrompt = "Vendor URI [enter = " + VENDOR + "]";
    const vendorInput = (await reader.question(vendorPrompt + ": ")).trim();
    const vendor = vendorInput || VENDOR;
    if (vendor !== VENDOR) console.log("using custom vendor: " + vendor);

    if (argv[0]) {
      const [row] = await sparql(endpoint, bestuurByUriQuery(argv[0]));
      if (!row) throw new Error("bestuur not found at " + endpoint + ": " + argv[0]);
      return { uri: argv[0], label: row.label.value, endpoint, vendor };
    }
    const search = (await reader.question("search bestuur by name (or part of it): ")).trim();
    const rows = await sparql(endpoint, besturenSearchQuery(search));
    if (!rows.length) throw new Error("no besturen found for '" + search + "'");
    rows.forEach((row, index) => console.log("[" + (index + 1) + "] " + row.label.value + " (" + row.uri.value + ")"));
    const chosen = rows[Number((await reader.question("pick a number: ")).trim()) - 1];
    if (!chosen) throw new Error("invalid choice");
    return { uri: chosen.uri.value, label: chosen.label.value, endpoint, vendor };
  } finally {
    reader.close();
  }
}
