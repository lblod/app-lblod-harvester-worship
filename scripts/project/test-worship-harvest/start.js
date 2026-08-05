import { randomUUID } from "node:crypto";
import {
  HARVEST_GRAPH, CREATOR, VENDOR, JOB_OPERATION, SINGLETON_JOB, ACCEPT_HTML,
  JOB_BUSY, JOB_SCHEDULED,
} from "./config.js";
import { uri, lit, update } from "./sparql.js";

export async function startJob(runId, pageUrls, user, pass) {
  const now = new Date().toISOString();
  const dateTime = (value) => `"${value}"^^<http://www.w3.org/2001/XMLSchema#dateTime>`;

  const jobUri = "http://data.lblod.info/id/jobs/" + randomUUID();
  const rdoMandatarissen = "http://data.lblod.info/id/remote-data-objects/" + randomUUID();
  const rdoBedienaren = "http://data.lblod.info/id/remote-data-objects/" + randomUUID();
  const authConfig = "http://data.lblod.info/id/authentication-configurations/" + randomUUID();
  const securityScheme = "http://data.lblod.info/id/basic-security-schemes/" + randomUUID();
  const credentials = "http://data.lblod.info/id/basic-authentication-credentials/" + randomUUID();
  const collection = "http://data.lblod.info/id/harvesting-collections/" + randomUUID();
  const container = "http://data.lblod.info/id/data-containers/" + randomUUID();
  const taskUri = "http://data.lblod.info/id/tasks/" + randomUUID();

  const query = `
PREFIX adms: <http://www.w3.org/ns/adms#>
PREFIX cogs: <http://vocab.deri.ie/cogs#>
PREFIX dct: <http://purl.org/dc/terms/>
PREFIX dgftSec: <http://lblod.data.gift/vocabularies/security/>
PREFIX hrvst: <http://lblod.data.gift/vocabularies/harvesting/>
PREFIX meb: <http://rdf.myexperiment.org/ontologies/base/>
PREFIX mu: <http://mu.semte.ch/vocabularies/core/>
PREFIX muAccount: <http://mu.semte.ch/vocabularies/account/>
PREFIX nie: <http://www.semanticdesktop.org/ontologies/2007/01/19/nie#>
PREFIX nfo: <http://www.semanticdesktop.org/ontologies/2007/03/22/nfo#>
PREFIX prov: <http://www.w3.org/ns/prov#>
PREFIX rpioHttp: <http://redpencil.data.gift/vocabularies/http/>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
PREFIX task: <http://redpencil.data.gift/vocabularies/tasks/>
PREFIX wotSec: <https://www.w3.org/2019/wot/security#>
INSERT DATA {
  GRAPH ${uri(HARVEST_GRAPH)} {
    ${uri(jobUri)} a cogs:Job ;
        adms:status ${uri(JOB_BUSY)} ;
        task:operation ${uri(JOB_OPERATION)} ;
        dct:creator ${uri(CREATOR)} ;
        prov:wasAssociatedWith ${uri(VENDOR)} ;
        skos:comment ${lit("test " + runId)} ;
        dct:created ${dateTime(now)} ; dct:modified ${dateTime(now)} ;
        mu:uuid ${lit(randomUUID())} .
    ${uri(rdoMandatarissen)} a nfo:RemoteDataObject ;
        nie:url ${uri(pageUrls.mandatarissen)} ;
        rpioHttp:requestHeader ${uri(ACCEPT_HTML)} ;
        dct:creator ${uri(CREATOR)} ;
        dct:created ${dateTime(now)} ; dct:modified ${dateTime(now)} ;
        mu:uuid ${lit(randomUUID())} .
    ${uri(rdoBedienaren)} a nfo:RemoteDataObject ;
        nie:url ${uri(pageUrls.bedienaren)} ;
        rpioHttp:requestHeader ${uri(ACCEPT_HTML)} ;
        dct:creator ${uri(CREATOR)} ;
        dct:created ${dateTime(now)} ; dct:modified ${dateTime(now)} ;
        mu:uuid ${lit(randomUUID())} .
    ${uri(authConfig)} a dgftSec:AuthenticationConfiguration ;
        dgftSec:securityConfiguration ${uri(securityScheme)} ;
        dgftSec:secrets ${uri(credentials)} ;
        mu:uuid ${lit(randomUUID())} .
    ${uri(securityScheme)} a wotSec:BasicSecurityScheme ;
        mu:uuid ${lit(randomUUID())} .
    ${uri(credentials)} a dgftSec:BasicAuthenticationCredentials ;
        meb:username ${lit(user)} ;
        muAccount:password ${lit(pass)} ;
        mu:uuid ${lit(randomUUID())} .
    ${uri(collection)} a hrvst:HarvestingCollection ;
        dct:creator ${uri(CREATOR)} ;
        dct:hasPart ${uri(rdoMandatarissen)}, ${uri(rdoBedienaren)} ;
        dgftSec:targetAuthenticationConfiguration ${uri(authConfig)} ;
        dct:created ${dateTime(now)} ; dct:modified ${dateTime(now)} ;
        mu:uuid ${lit(randomUUID())} .
    ${uri(container)} a nfo:DataContainer ;
        task:hasHarvestingCollection ${uri(collection)} ;
        mu:uuid ${lit(randomUUID())} .
    ${uri(taskUri)} a task:Task ;
        adms:status ${uri(JOB_SCHEDULED)} ;
        task:operation ${uri(SINGLETON_JOB)} ;
        task:index "0" ;
        dct:isPartOf ${uri(jobUri)} ;
        task:inputContainer ${uri(container)} ;
        dct:created ${dateTime(now)} ; dct:modified ${dateTime(now)} ;
        mu:uuid ${lit(randomUUID())} .
  }
}`;

  if (!(await update(query))) throw new Error("job INSERT failed");
  return { jobUri, rdoMandatarissen, rdoBedienaren };
}
