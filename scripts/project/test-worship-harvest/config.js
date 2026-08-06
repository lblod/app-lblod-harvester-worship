import { config, setupEnvVariables } from "./utils.js";

export const CENTRALE_VINDPLAATS = "https://centrale-vindplaats.lblod.info/sparql";

const env = setupEnvVariables();
// Reads go straight to Virtuoso (sees every graph, no auth). Writes must go through
// mu-authorization: it is what emits the deltas that drive the harvest chain.
export const VIRTUOSO = env.VIRTUOSO;
export const DATABASE = "http://database:8890/sparql";

// download-url-service reads the remote data objects from its DEFAULT_GRAPH, so that is
// where the job has to be written. The sameas service is what lands the harvested data.
export const HARVEST_GRAPH = env.HARVEST_GRAPH;
export const PUBLIC_GRAPH = env.PUBLIC_GRAPH;

const [producer] = Object.values(config("config/delta-producer/publication-graph-maintainer/config.json"));
export const PUBLICATION_GRAPH = producer.publicationGraph;
// The maintainer batches deltas on this interval, so publication lands minutes after the
// job is done - check 5 polls at the same rate.
export const PUBLISH_INTERVAL = producer.deltaInterval;

export const JOB_OPERATION = process.env.JOB_OPERATION
  ?? "http://lblod.data.gift/id/jobs/concept/JobOperation/lblodHarvestWorship";
export const PUBLISH_OPERATION = "http://lblod.data.gift/id/jobs/concept/JobOperation/lblodHarvestWorshipAndPublish";
export const PUBLISHES = JOB_OPERATION === PUBLISH_OPERATION;
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
