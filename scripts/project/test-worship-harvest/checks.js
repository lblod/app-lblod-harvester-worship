import {
  VIRTUOSO, JOB_SUCCESS, JOB_FAILED, DL_COLLECTED, DL_FAILURE, TASK_OPS,
  PUBLIC_GRAPH, PUBLICATION_GRAPH, POLL_INTERVAL, POLL_TIMEOUT,
  PUBLISH_INTERVAL, PUBLISH_TIMEOUT,
} from "./config.js";
import { sparql, label } from "./sparql.js";
import { pollQuery, tasksQuery, jobStatusQuery, sameAsInGraphQuery } from "./queries.js";

export async function runChecks(jobUri, rdoMandatarissen, rdoBedienaren, uris) {
  const poll = await pollJob(jobUri, rdoMandatarissen, rdoBedienaren);

  let passed = 0;
  if (logCheck(1, "pages downloaded", checkPagesDownloaded(poll))) passed++;
  if (logCheck(2, "all tasks succeeded", await checkAllTasksSucceeded(jobUri, poll.timedOut))) passed++;
  if (logCheck(3, "job succeeded", await checkJobSucceeded(jobUri, poll.timedOut))) passed++;
  if (logCheck(4, "data in graphs/public", await checkSubjectsInGraph(uris, PUBLIC_GRAPH))) passed++;
  if (logCheck(5, "data published", await checkPublished(uris))) passed++;
  return passed;
}

async function checkPublished(uris) {
  const start = Date.now();
  let result;
  do {
    result = await checkSubjectsInGraph(uris, PUBLICATION_GRAPH);
    if (result.ok) break;
    await new Promise((resolve) => setTimeout(resolve, PUBLISH_INTERVAL));
  } while (Date.now() - start < PUBLISH_TIMEOUT);
  return { ...result, ms: Date.now() - start };
}

async function pollJob(jobUri, rdoMandatarissen, rdoBedienaren) {
  const start = Date.now();
  while (Date.now() - start < POLL_TIMEOUT) {
    const rows = await sparql(VIRTUOSO, pollQuery(jobUri, rdoMandatarissen, rdoBedienaren));
    if (Array.isArray(rows) && rows.length > 0) {
      const row = rows[0];
      const jobStatus = row.jobStatus ? row.jobStatus.value : null;
      if (jobStatus === JOB_SUCCESS || jobStatus === JOB_FAILED) {
        return {
          timedOut: false,
          mandatarissenStatus: row.mandatarissenStatus ? row.mandatarissenStatus.value : null,
          bedienarenStatus: row.bedienarenStatus ? row.bedienarenStatus.value : null,
        };
      }
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
  }
  return { timedOut: true };
}

function logCheck(id, name, result) {
  const tag = result.ok ? "ok  " : "FAIL";
  const elapsed = result.ms ? " " + result.ms + "ms" : "";
  console.log("");
  console.log("[" + id + "/5] " + tag + "  " + name + " - " + result.detail + elapsed);
  return result.ok;
}

function checkPagesDownloaded(poll) {
  if (poll.timedOut) return { ok: false, detail: "timed out before the job finished" };
  const statuses = [poll.mandatarissenStatus, poll.bedienarenStatus];
  if (statuses.every((status) => status === DL_COLLECTED)) return { ok: true, detail: "2/2 collected" };
  if (statuses.some((status) => status === DL_FAILURE)) {
    return { ok: false, detail: "download failed - page server unreachable, or basic auth rejected by download-url-service" };
  }
  return { ok: false, detail: "download statuses: " + statuses.map(label).join(", ") };
}

async function checkAllTasksSucceeded(jobUri, timedOut) {
  const start = Date.now();
  if (timedOut) return { ok: false, detail: "timed out before the job finished" };
  const rows = await sparql(VIRTUOSO, tasksQuery(jobUri));
  if (!Array.isArray(rows)) return { ok: false, detail: "task query failed", ms: Date.now() - start };
  const statusByOperation = new Map(rows.map((row) => [row.operation.value, row.status.value]));
  const missing = [];
  const failed = [];
  for (const operation of TASK_OPS) {
    const status = statusByOperation.get(operation);
    if (!status) missing.push(label(operation));
    else if (status !== JOB_SUCCESS) failed.push(label(operation) + ": " + label(status));
  }
  if (missing.length || failed.length) {
    const parts = [rows.length + "/11 present"];
    if (missing.length) parts.push("missing: " + missing.join(", "));
    if (failed.length) parts.push("failed: " + failed.join(", "));
    return { ok: false, detail: parts.join(" - "), ms: Date.now() - start };
  }
  return { ok: true, detail: "11/11 success", ms: Date.now() - start };
}

async function checkJobSucceeded(jobUri, timedOut) {
  const start = Date.now();
  if (timedOut) return { ok: false, detail: "timed out before the job finished" };
  const rows = await sparql(VIRTUOSO, jobStatusQuery(jobUri));
  if (!Array.isArray(rows) || rows.length === 0) return { ok: false, detail: "job not found", ms: Date.now() - start };
  const status = rows[0].status.value;
  if (status === JOB_SUCCESS) return { ok: true, detail: "success", ms: Date.now() - start };
  return { ok: false, detail: "job status is " + label(status) + " (expected success)", ms: Date.now() - start };
}

async function checkSubjectsInGraph(uris, graph) {
  const start = Date.now();
  const rows = await sparql(VIRTUOSO, sameAsInGraphQuery(uris, graph));
  if (!Array.isArray(rows)) return { ok: false, detail: "sameAs query failed", ms: Date.now() - start };
  const found = new Set(rows.map((row) => row.original.value));
  if (found.size === uris.length) {
    return { ok: true, detail: uris.length + "/" + uris.length + " subjects", ms: Date.now() - start };
  }
  const missing = uris.filter((subjectUri) => !found.has(subjectUri));
  return {
    ok: false,
    detail: found.size + "/" + uris.length + " subjects, missing " + missing.join(", "),
    ms: Date.now() - start,
  };
}
