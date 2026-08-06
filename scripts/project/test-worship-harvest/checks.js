import {
  VIRTUOSO, JOB_SUCCESS, JOB_FAILED, DL_COLLECTED, DL_FAILURE, TASK_OPS,
  PUBLIC_GRAPH, PUBLICATION_GRAPH, POLL_INTERVAL, POLL_TIMEOUT,
  PUBLISH_INTERVAL, PUBLISH_TIMEOUT,
} from "./config.js";
import { sparql, label } from "./sparql.js";
import { pollQuery, tasksQuery, jobStatusQuery, sameAsInGraphQuery } from "./queries.js";

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function runChecks(job, uris) {
  const statuses = await pollJob(job);

  let passed = 0;
  passed += await report(1, "pages downloaded", () => checkDownloads(statuses));
  passed += await report(2, "all tasks succeeded", () => checkTasks(job.jobUri));
  passed += await report(3, "job succeeded", () => checkJob(job.jobUri));
  passed += await report(4, "data in " + PUBLIC_GRAPH, () => inGraph(uris, PUBLIC_GRAPH));
  passed += await report(5, "data published", () => checkPublished(uris));
  return passed;
}

// The job is inserted `busy`, so wait for a final status rather than for the first row.
// On a timeout the last known statuses are returned anyway: the checks below then report
// exactly where the chain got stuck.
async function pollJob(job) {
  const deadline = Date.now() + POLL_TIMEOUT;
  let row = {};
  while (Date.now() < deadline) {
    row = (await sparql(VIRTUOSO, pollQuery(job)))[0] || {};
    const status = row.jobStatus?.value;
    if (status === JOB_SUCCESS || status === JOB_FAILED) break;
    await wait(POLL_INTERVAL);
  }
  return row;
}

async function report(number, name, check) {
  try {
    console.log("\n[" + number + "/5] ok    " + name + " - " + (await check()));
    return 1;
  } catch (error) {
    console.log("\n[" + number + "/5] FAIL  " + name + " - " + error.message);
    return 0;
  }
}

function checkDownloads(statuses) {
  const values = [statuses.mandatarissenStatus?.value, statuses.bedienarenStatus?.value];
  if (values.every((value) => value === DL_COLLECTED)) return "2/2 collected";
  if (values.includes(DL_FAILURE)) {
    throw new Error("download failed - page server unreachable, or basic auth rejected by download-url-service");
  }
  throw new Error("download statuses: " + values.map(label).join(", "));
}

async function checkTasks(jobUri) {
  const rows = await sparql(VIRTUOSO, tasksQuery(jobUri));
  const statusByOperation = new Map(rows.map((row) => [row.operation.value, row.status.value]));
  const problems = TASK_OPS.flatMap((operation) => {
    const status = statusByOperation.get(operation);
    if (!status) return label(operation) + ": missing";
    if (status !== JOB_SUCCESS) return label(operation) + ": " + label(status);
    return [];
  });
  if (problems.length) throw new Error(problems.join(", "));
  return TASK_OPS.length + "/" + TASK_OPS.length + " success";
}

async function checkJob(jobUri) {
  const [row] = await sparql(VIRTUOSO, jobStatusQuery(jobUri));
  if (!row) throw new Error("job not found");
  if (row.status.value !== JOB_SUCCESS) throw new Error("job status is " + label(row.status.value));
  return "success";
}

async function inGraph(uris, graph) {
  const rows = await sparql(VIRTUOSO, sameAsInGraphQuery(uris, graph));
  const found = new Set(rows.map((row) => row.original.value));
  const missing = uris.filter((value) => !found.has(value));
  if (missing.length) throw new Error(found.size + "/" + uris.length + " subjects, missing " + missing.join(", "));
  return uris.length + "/" + uris.length + " subjects";
}

async function checkPublished(uris) {
  const deadline = Date.now() + PUBLISH_TIMEOUT;
  while (true) {
    try {
      return await inGraph(uris, PUBLICATION_GRAPH);
    } catch (error) {
      if (Date.now() > deadline) throw error;
      await wait(PUBLISH_INTERVAL);
    }
  }
}
