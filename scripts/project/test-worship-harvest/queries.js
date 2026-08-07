import { randomUUID } from "node:crypto";
import { uri, lit } from "./sparql.js";
import {
  HARVEST_GRAPH, CREATOR, JOB_OPERATION, SINGLETON_JOB, ACCEPT_HTML,
  JOB_BUSY, JOB_SCHEDULED,
} from "./config.js";

export function bestuurByUriQuery(bestuurUri) {
  return `PREFIX erediensten: <http://data.lblod.info/vocabularies/erediensten/>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
SELECT ?label WHERE {
  ${uri(bestuurUri)} a erediensten:BestuurVanDeEredienst ; skos:prefLabel ?label .
} LIMIT 1`;
}

export function besturenSearchQuery(search) {
  return `PREFIX erediensten: <http://data.lblod.info/vocabularies/erediensten/>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
SELECT ?uri ?label WHERE {
  ?uri a erediensten:BestuurVanDeEredienst ; skos:prefLabel ?label .
  FILTER(CONTAINS(LCASE(?label), LCASE(${lit(search)})))
} ORDER BY ?label LIMIT 10`;
}

export function mandaatQuery(bestuurUri) {
  // hasPost sits on the time-specialised orgaan, not on the abstract one - querying the abstract one returns nothing.
  return `PREFIX org: <http://www.w3.org/ns/org#>
PREFIX besluit: <http://data.vlaanderen.be/ns/besluit#>
PREFIX mandaat: <http://data.vlaanderen.be/ns/mandaat#>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
SELECT ?mandaat ?rolLabel WHERE {
  ${uri(bestuurUri)} ^besluit:bestuurt ?abstractOrgaan .
  ?tijdspecOrgaan mandaat:isTijdspecialisatieVan ?abstractOrgaan ;
                  mandaat:bindingStart ?bindingStart ; org:hasPost ?mandaat .
  ?mandaat org:role/skos:prefLabel ?rolLabel .
  OPTIONAL { ?tijdspecOrgaan mandaat:bindingEinde ?bindingEinde . }
  FILTER(!BOUND(?bindingEinde) || ?bindingEinde > NOW())
} ORDER BY DESC(?bindingStart) ?rolLabel LIMIT 1`;
}

export function positieQuery(bestuurUri) {
  return `PREFIX ere: <http://data.lblod.info/vocabularies/erediensten/>
SELECT ?positie WHERE {
  ${uri(bestuurUri)} ere:wordtBediendDoor ?positie . ?positie a ere:PositieBedienaar .
} ORDER BY ?positie LIMIT 1`;
}

export function startJobQuery({
  runId, pageUrls, user, pass, now,
  jobUri, rdoMandatarissen, rdoBedienaren, authConfig, securityScheme,
  credentials, collection, container, taskUri, vendor,
}) {
  const dateTime = (value) => `"${value}"^^<http://www.w3.org/2001/XMLSchema#dateTime>`;
  return `
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
        prov:wasAssociatedWith ${uri(vendor)} ;
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
}

export function pollQuery(job) {
  return `PREFIX adms: <http://www.w3.org/ns/adms#>
PREFIX cogs: <http://vocab.deri.ie/cogs#>
SELECT ?jobStatus ?mandatarissenStatus ?bedienarenStatus WHERE {
  ${uri(job.jobUri)} a cogs:Job ; adms:status ?jobStatus .
  OPTIONAL { ${uri(job.rdoMandatarissen)} adms:status ?mandatarissenStatus . }
  OPTIONAL { ${uri(job.rdoBedienaren)} adms:status ?bedienarenStatus . }
}`;
}

export function tasksQuery(jobUri) {
  return `PREFIX adms: <http://www.w3.org/ns/adms#>
PREFIX dct: <http://purl.org/dc/terms/>
PREFIX task: <http://redpencil.data.gift/vocabularies/tasks/>
SELECT ?operation ?status WHERE {
  ?task dct:isPartOf ${uri(jobUri)} ; task:operation ?operation ; adms:status ?status .
}`;
}

export function jobStatusQuery(jobUri) {
  return `PREFIX adms: <http://www.w3.org/ns/adms#>
PREFIX cogs: <http://vocab.deri.ie/cogs#>
SELECT ?status WHERE { ${uri(jobUri)} a cogs:Job ; adms:status ?status . }`;
}

// import-with-sameas renames every harvested subject to RENAME_DOMAIN + a hash of the old
// URI, and records <new> owl:sameAs <old>. So the minted URIs are gone from the data, but
// the sameAs triple still points back at them - and it is exported to the publication
// graph for all 8 types, so the same lookup works in both graphs.
export function sameAsInGraphQuery(uris, graph) {
  return `PREFIX owl: <http://www.w3.org/2002/07/owl#>
SELECT ?original WHERE {
  VALUES ?original { ${uris.map(uri).join(" ")} }
  GRAPH ${uri(graph)} { ?renamed owl:sameAs ?original . }
}`;
}
