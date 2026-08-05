export const CP = "https://centrale-vindplaats.lblod.info/sparql";
// Reads go straight to Virtuoso (sees every graph, no auth). Writes must go through
// mu-authorization instead: it is what emits the deltas that drive the harvest chain.
export const VIRTUOSO = "http://virtuoso:8890/sparql";
export const DATABASE = "http://database:8890/sparql";

export const HARVEST_GRAPH = "http://mu.semte.ch/graphs/harvesting";
export const PUBLIC_GRAPH = "http://mu.semte.ch/graphs/public";
export const PUBLICATION_GRAPH = "http://redpencil.data.gift/id/deltas/producer/lblod-harvester-worship-producer";

export const CREATOR = "http://lblod.data.gift/services/job-self-service";
export const VENDOR = "http://data.lblod.info/vendors/b1e41693-639a-4f61-92a9-5b9a3e0b924e";
export const ACCEPT_HTML = "http://data.lblod.info/request-headers/accept/text/html";

export const JOB_OPERATION = "http://lblod.data.gift/id/jobs/concept/JobOperation/lblodHarvestWorshipAndPublish";
export const SINGLETON_JOB = "http://lblod.data.gift/id/jobs/concept/TaskOperation/singleton-job";

export const JOB_BUSY = "http://redpencil.data.gift/id/concept/JobStatus/busy";
export const JOB_SCHEDULED = "http://redpencil.data.gift/id/concept/JobStatus/scheduled";
export const JOB_SUCCESS = "http://redpencil.data.gift/id/concept/JobStatus/success";
export const JOB_FAILED = "http://redpencil.data.gift/id/concept/JobStatus/failed";

// download-url-service sets `success` when the page is fetched; harvest-collector-service
// then sets `collected` once it is part of the collection. `collected` is the end state.
export const DL_COLLECTED = "http://lblod.data.gift/file-download-statuses/collected";
export const DL_FAILURE = "http://lblod.data.gift/file-download-statuses/failure";

export const TASK_OPS = [
  "http://lblod.data.gift/id/jobs/concept/TaskOperation/singleton-job",
  "http://lblod.data.gift/id/jobs/concept/TaskOperation/collecting",
  "http://lblod.data.gift/id/jobs/concept/TaskOperation/importing",
  "http://lblod.data.gift/id/jobs/concept/TaskOperation/filtering",
  "http://lblod.data.gift/id/jobs/concept/TaskOperation/mirroring",
  "http://lblod.data.gift/id/jobs/concept/TaskOperation/add-uuids",
  "http://lblod.data.gift/id/jobs/concept/TaskOperation/add-harvesting-tag",
  "http://lblod.data.gift/id/jobs/concept/TaskOperation/add-vendor-tag",
  "http://lblod.data.gift/id/jobs/concept/TaskOperation/diff",
  "http://lblod.data.gift/id/jobs/concept/TaskOperation/publishHarvestedTriplesWithDeletes",
  "http://lblod.data.gift/id/jobs/concept/TaskOperation/checking-urls",
];

export const URI_BASE = "http://test-worship-harvest.local/id/";
// One mandataris and one bedienaar is enough to prove the chain end to end, and publication
// is slow enough that more only costs wall-clock.
export const ENTRIES_PER_PAGE = 1;
export const PAGE_PORT = 8888;
export const POLL_INTERVAL = 2000;
export const POLL_TIMEOUT = 300000;
// Publication happens well after the job is done: writes to graphs/public are forwarded to
// the publication-graph-maintainer by delta (config/delta/rules.js), which batches on its own
// `deltaInterval` and can lag by minutes. Check 5 waits it out, polling at the maintainer's
// own interval rather than the 2s used for the job itself.
export const PUBLISH_INTERVAL = 10000;
export const PUBLISH_TIMEOUT = 600000;
