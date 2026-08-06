import { randomUUID } from "node:crypto";
import { update } from "./sparql.js";
import { startJobQuery } from "./queries.js";

export async function startJob(runId, pageUrls, user, pass) {
  const now = new Date().toISOString();
  const id = (type) => "http://data.lblod.info/id/" + type + "/" + randomUUID();
  const jobUri = id("jobs");
  const rdoMandatarissen = id("remote-data-objects");
  const rdoBedienaren = id("remote-data-objects");
  const authConfig = id("authentication-configurations");
  const securityScheme = id("basic-security-schemes");
  const credentials = id("basic-authentication-credentials");
  const collection = id("harvesting-collections");
  const container = id("data-containers");
  const taskUri = id("tasks");

  await update(startJobQuery({
    runId, pageUrls, user, pass, now,
    jobUri, rdoMandatarissen, rdoBedienaren, authConfig, securityScheme,
    credentials, collection, container, taskUri,
  }));
  return { jobUri, rdoMandatarissen, rdoBedienaren };
}