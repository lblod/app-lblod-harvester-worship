import { randomUUID } from "node:crypto";
import {
  CENTRALE_VINDPLAATS, HARVEST_GRAPH, PUBLIC_GRAPH, PUBLICATION_GRAPH, TASK_OPS, PAGE_PORT,
} from "./config.js";
import { sparql } from "./sparql.js";
import { mandaatQuery, positieQuery } from "./queries.js";
import { chooseBestuur } from "./input.js";
import { buildSubject, renderPage } from "./template.js";
import { startServer } from "./server.js";
import { startJob } from "./start.js";
import { runChecks } from "./checks.js";

const runId = randomUUID();

function section(title) {
  console.log("\n── " + title + " " + "─".repeat(Math.max(3, 58 - title.length)));
}

// node is PID 1 in the mu-script container, so the kernel drops signals it has no
// handler for - without these, ctrl-c cannot stop the poll loops.
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => process.exit(130));

let server = null;
try {
  section("stack");
  console.log("harvesting graph:  " + HARVEST_GRAPH);
  console.log("public graph:      " + PUBLIC_GRAPH);
  console.log("publication graph: " + PUBLICATION_GRAPH);
  console.log("task chain:        " + TASK_OPS.length + " tasks");

  section("bestuur");
  const bestuur = await chooseBestuur(process.argv.slice(2));
  console.log("\n" + bestuur.label + "\n" + bestuur.uri);

  const [mandaat] = await sparql(CENTRALE_VINDPLAATS, mandaatQuery(bestuur.uri));
  const [positie] = await sparql(CENTRALE_VINDPLAATS, positieQuery(bestuur.uri));
  if (!mandaat) throw new Error("no mandaat on Centrale Vindplaats for " + bestuur.uri);
  if (!positie) throw new Error("no positie on Centrale Vindplaats for " + bestuur.uri);

  const mandataris = buildSubject("mandatarissen", "Testmandataris");
  const bedienaar = buildSubject("rollenBedienaar", "Testbedienaar");
  const page = { RUN_ID: runId, BESTUUR_LABEL: bestuur.label };
  const pages = {
    mandatarissen: await renderPage("mandataris", {
      ...page, ...mandataris,
      MANDAAT_URI: mandaat.mandaat.value,
      ROL_LABEL: mandaat.rolLabel.value,
    }),
    bedienaren: await renderPage("bedienaar", {
      ...page, ...bedienaar,
      POSITIE_URI: positie.positie.value,
    }),
  };

  section("pages");
  const user = "test-" + runId.slice(0, 8);
  const pass = randomUUID();
  const started = await startServer(pages, user, pass, runId);
  server = started.server;
  console.log("serving on port " + PAGE_PORT + ", basic auth " + user + " / " + pass);
  for (const [name, url] of Object.entries(started.urls)) console.log("  " + name + ": " + url);

  section("job");
  const job = await startJob(runId, started.urls, user, pass);
  console.log("\njob started: " + job.jobUri);

  section("checks");
  const passed = await runChecks(job, [mandataris.URI, bedienaar.URI]);
  console.log("\nTEST: " + (passed === 5 ? "PASS" : "FAIL") + " (" + passed + "/5 checks)");
} catch (error) {
  console.error("\nFATAL: " + (error?.stack || error));
  console.log("\nTEST: FAIL");
} finally {
  server?.close();
}
