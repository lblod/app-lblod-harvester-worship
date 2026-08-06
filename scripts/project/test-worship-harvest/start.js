import { randomUUID } from "node:crypto";
import {
  HARVEST_GRAPH, CREATOR, VENDOR, JOB_OPERATION, SINGLETON_JOB, ACCEPT_HTML,
  JOB_BUSY, JOB_SCHEDULED,
} from "./config.js";
import { uri, lit, update } from "./sparql.js";

export async function startJob(runId, pageUrls, user, pass) {
  const now = new Date().toISOString();
  const dateTime = (value) => `"${value}"^^<http://www.w3.org/2001/XMLSchema#dateTime>`;

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

  await update(query);
  return { jobUri, rdoMandatarissen, rdoBedienaren };
}
