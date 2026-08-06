import { DATABASE } from "./config.js";

export function uri(value) {
  return "<" + String(value).replace(/[<>"]/g, (match) => "\\" + match) + ">";
}

export function lit(value) {
  return '"' + String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"';
}

export function label(value) {
  return value ? value.split("/").pop() : "<none>";
}

// Every query is logged, but the poll loops send the same one over and over - printing it
// in full each time buries the progress, so repeats print a dot.
let lastQuery = null;

function log(query) {
  if (query === lastQuery) {
    process.stdout.write(".");
    return;
  }
  lastQuery = query;
  console.log("\n" + query.trim());
}

export async function sparql(endpoint, query) {
  log(query);
  const response = await fetch(endpoint + "?query=" + encodeURIComponent(query), {
    headers: { Accept: "application/sparql-results+json" },
  });
  const text = await response.text();
  if (!response.ok) throw new Error("SPARQL " + response.status + " from " + endpoint + ": " + text.slice(0, 200));
  return JSON.parse(text).results.bindings;
}

export async function update(query) {
  log(query);
  const response = await fetch(DATABASE, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "mu-auth-sudo": "true" },
    body: "query=" + encodeURIComponent(query),
  });
  if (!response.ok) throw new Error("SPARQL update " + response.status + ": " + (await response.text()).slice(0, 200));
}
