import { DATABASE } from "./config.js";

export function uri(value) {
  return "<" + String(value).replace(/[<>"]/g, (match) => "\\" + match) + ">";
}

export function lit(value) {
  const escaped = String(value)
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r");
  return '"' + escaped + '"';
}

export function label(value) {
  return value ? value.split("/").pop() : "<none>";
}

// Every query is logged, but the poll loops send the same one over and over - printing it
// in full each time buries the progress lines, so repeats collapse to one short line.
let lastQuery = null;
let repeatingSince = 0;

function logQuery(kind, query) {
  if (query === lastQuery) {
    console.log("  │ … same query, " + Math.round((Date.now() - repeatingSince) / 1000) + "s waiting");
    return;
  }
  lastQuery = query;
  repeatingSince = Date.now();
  console.log("  · SPARQL " + kind);
  for (const line of query.trim().split("\n")) console.log("  │ " + line);
}

export async function sparql(endpoint, query) {
  logQuery("query", query);
  const response = await fetch(endpoint + "?query=" + encodeURIComponent(query), {
    headers: { Accept: "application/sparql-results+json" },
  });
  const text = await response.text();
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (parseError) {
    return { error: "unparseable: " + text.slice(0, 200) };
  }
  if (typeof parsed.boolean === "boolean") return { boolean: parsed.boolean };
  return parsed.results ? parsed.results.bindings : [];
}

export async function update(query) {
  logQuery("update", query);
  const response = await fetch(DATABASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "mu-auth-sudo": "true",
    },
    body: "query=" + encodeURIComponent(query),
  });
  return response.status === 200 || response.status === 204;
}
