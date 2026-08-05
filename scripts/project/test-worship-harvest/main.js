import { randomUUID } from "node:crypto";
import { CP, PAGE_PORT } from "./config.js";
import { sparql } from "./sparql.js";
import { mandatenQuery, positiesQuery } from "./queries.js";
import { chooseBestuur } from "./input.js";
import { buildSubjects, renderPage } from "./template.js";
import { startServer } from "./server.js";
import { startJob } from "./start.js";
import { runChecks } from "./checks.js";

const runId = randomUUID();

function section(title) {
  console.log("");
  console.log("── " + title + " " + "─".repeat(Math.max(3, 58 - title.length)));
}

// node is PID 1 in the mu-script container, so the kernel drops signals it has no
// handler for - without these, ctrl-c cannot stop the poll loop.
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => process.exit(130));

let server = null;
try {
  section("bestuur");
  const bestuur = await chooseBestuur(process.argv.slice(2));
  console.log("");
  console.log("bestuur: " + bestuur.label);
  console.log("         " + bestuur.uri);

  const mandatenRows = await sparql(CP, mandatenQuery(bestuur.uri));
  const positiesRows = await sparql(CP, positiesQuery(bestuur.uri));
  if (!Array.isArray(mandatenRows) || mandatenRows.length === 0) {
    throw new Error("no mandaten on Centrale Vindplaats for " + bestuur.uri);
  }
  if (!Array.isArray(positiesRows) || positiesRows.length === 0) {
    throw new Error("no posities on Centrale Vindplaats for " + bestuur.uri);
  }
  const mandaten = mandatenRows.map((row) => ({ MANDAAT_URI: row.mandaat.value, ROL_LABEL: row.rolLabel.value }));
  const posities = positiesRows.map((row) => ({ POSITIE_URI: row.positie.value }));
  console.log("Centrale Vindplaats: " + mandaten.length + " mandaten, " + posities.length + " posities");

  const mandatarissen = buildSubjects("mandatarissen", "Testmandataris");
  const bedienaren = buildSubjects("rollenBedienaar", "Testbedienaar");
  const pages = {
    mandatarissen: await renderPage("mandataris", runId, bestuur, mandatarissen, mandaten),
    bedienaren: await renderPage("bedienaar", runId, bestuur, bedienaren, posities),
  };

  const user = "test-" + runId.slice(0, 8);
  const pass = randomUUID();
  section("pages");
  const started = await startServer(pages, user, pass, runId);
  server = started.server;
  console.log("serving on http://" + started.ownIp + ":" + PAGE_PORT + ", basic auth " + user + " / " + pass);
  for (const [name, url] of Object.entries(started.urls)) console.log("  " + name + ": " + url);

  section("job");
  const job = await startJob(runId, started.urls, user, pass);
  console.log("");
  console.log("job started: " + job.jobUri);

  section("checks");
  const uris = [...mandatarissen, ...bedienaren].map((subject) => subject.URI);
  const passed = await runChecks(job.jobUri, job.rdoMandatarissen, job.rdoBedienaren, uris);
  console.log("");
  console.log("TEST: " + (passed === 5 ? "PASS" : "FAIL") + " (" + passed + "/5 checks)");
} catch (error) {
  console.error("FATAL: " + (error && error.stack ? error.stack : error));
  console.log("");
  console.log("TEST: FAIL (0/5 checks)");
} finally {
  if (server) try { server.close(); } catch (closeError) {}
}
