import { existsSync, readFileSync } from "node:fs";

// mu-cli mounts the project folder here (see the "mounts" in scripts/project/config.json).
// Anything that differs per deployment - graphs, endpoints, the task chain - is read from
// the running stack's own configuration instead of being hardcoded.
const APP = "/data/app/";

const composeFiles = ["docker-compose.yml", "docker-compose.override.yml"]
  .filter((name) => existsSync(APP + name))
  .map((name) => readFileSync(APP + name, "utf8"));
if (!composeFiles.length) throw new Error("no docker-compose files under " + APP);

function serviceLines(yaml, service) {
  const lines = yaml.split("\n");
  const start = lines.findIndex((line) => line.trim() === service + ":");
  if (start === -1) return [];
  const indent = lines[start].search(/\S/);
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (lines[i].trim() && lines[i].search(/\S/) <= indent) { end = i; break; }
  }
  return lines.slice(start + 1, end);
}

// Later file wins, the way docker compose merges the override.
function env(service, key) {
  let value;
  for (const yaml of composeFiles) {
    for (const line of serviceLines(yaml, service)) {
      const match = line.match(new RegExp("^\\s+" + key + ":\\s*(.*)$"));
      if (match) value = match[1].trim().replace(/^["']|["']$/g, "");
    }
  }
  if (!value) throw new Error("no " + key + " on service " + service + " in the compose files");
  return value;
}

function config(path) {
  return JSON.parse(readFileSync(APP + path, "utf8"));
}

export const CENTRALE_VINDPLAATS = "https://centrale-vindplaats.lblod.info/sparql";
// Reads go straight to Virtuoso (sees every graph, no auth). Writes must go through
// mu-authorization: it is what emits the deltas that drive the harvest chain.
export const VIRTUOSO = env("database", "MU_SPARQL_ENDPOINT");
export const DATABASE = "http://database:8890/sparql";

// download-url-service reads the remote data objects from its DEFAULT_GRAPH, so that is
// where the job has to be written. The sameas service is what lands the harvested data.
export const HARVEST_GRAPH = env("harvest_download-url", "DEFAULT_GRAPH");
export const PUBLIC_GRAPH = env("harvest_sameas", "TARGET_GRAPH");

const [producer] = Object.values(config("config/delta-producer/publication-graph-maintainer/config.json"));
export const PUBLICATION_GRAPH = producer.publicationGraph;
// The maintainer batches deltas on this interval, so publication lands minutes after the
// job is done - check 5 polls at the same rate.
export const PUBLISH_INTERVAL = producer.deltaInterval;

export const JOB_OPERATION = "http://lblod.data.gift/id/jobs/concept/JobOperation/lblodHarvestWorshipAndPublish";
const chain = config("config/job-controller/config.json")[JOB_OPERATION];
if (!chain) throw new Error(JOB_OPERATION + " is not in config/job-controller/config.json");
export const TASK_OPS = chain.tasksConfiguration.map((step) => step.nextOperation);
export const SINGLETON_JOB = TASK_OPS[0];

export const CREATOR = "http://lblod.data.gift/services/job-self-service";
export const ACCEPT_HTML = "http://data.lblod.info/request-headers/accept/text/html";

export const JOB_BUSY = "http://redpencil.data.gift/id/concept/JobStatus/busy";
export const JOB_SCHEDULED = "http://redpencil.data.gift/id/concept/JobStatus/scheduled";
export const JOB_SUCCESS = "http://redpencil.data.gift/id/concept/JobStatus/success";
export const JOB_FAILED = "http://redpencil.data.gift/id/concept/JobStatus/failed";

// download-url-service sets `success` when the page is fetched; harvest-collector-service
// then sets `collected` once it is part of the collection. `collected` is the end state.
export const DL_COLLECTED = "http://lblod.data.gift/file-download-statuses/collected";
export const DL_FAILURE = "http://lblod.data.gift/file-download-statuses/failure";

export const URI_BASE = "http://test-worship-harvest.local/id/";
// add-vendor-tag only copies this URI onto the harvested subjects, so the test brings its
// own rather than depending on a vendor that happens to exist in this environment.
export const VENDOR = URI_BASE + "vendors/test";

export const PAGE_PORT = 8888;
export const POLL_INTERVAL = 2000;
export const POLL_TIMEOUT = 300000;
export const PUBLISH_TIMEOUT = 600000;
