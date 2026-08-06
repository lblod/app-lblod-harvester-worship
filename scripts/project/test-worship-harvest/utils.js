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

export function config(path) {
  return JSON.parse(readFileSync(APP + path, "utf8"));
}

export function setupEnvVariables() {
  return {
    VIRTUOSO: env("database", "MU_SPARQL_ENDPOINT"),
    HARVEST_GRAPH: env("harvest_download-url", "DEFAULT_GRAPH"),
    PUBLIC_GRAPH: env("harvest_sameas", "TARGET_GRAPH"),
  };
}