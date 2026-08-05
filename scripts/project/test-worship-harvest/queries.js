import { uri, lit } from "./sparql.js";

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

export function mandatenQuery(bestuurUri) {
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
} ORDER BY DESC(?bindingStart) ?rolLabel LIMIT 5`;
}

export function positiesQuery(bestuurUri) {
  return `PREFIX ere: <http://data.lblod.info/vocabularies/erediensten/>
SELECT ?positie WHERE {
  ${uri(bestuurUri)} ere:wordtBediendDoor ?positie . ?positie a ere:PositieBedienaar .
} ORDER BY ?positie LIMIT 5`;
}

export function pollQuery(jobUri, rdoMandatarissen, rdoBedienaren) {
  return `PREFIX adms: <http://www.w3.org/ns/adms#>
PREFIX cogs: <http://vocab.deri.ie/cogs#>
SELECT ?jobStatus ?mandatarissenStatus ?bedienarenStatus WHERE {
  ${uri(jobUri)} a cogs:Job ; adms:status ?jobStatus .
  OPTIONAL { ${uri(rdoMandatarissen)} adms:status ?mandatarissenStatus . }
  OPTIONAL { ${uri(rdoBedienaren)} adms:status ?bedienarenStatus . }
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
