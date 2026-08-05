import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { URI_BASE, ENTRIES_PER_PAGE } from "./config.js";

function substitute(template, values) {
  let out = template;
  for (const [placeholder, value] of Object.entries(values)) {
    out = out.split("{{" + placeholder + "}}").join(value);
  }
  const left = out.match(/\{\{[^}]+\}\}/);
  if (left) throw new Error("unreplaced placeholder " + left[0] + " - check template and values");
  return out;
}

export function buildSubjects(path, familyName) {
  const subjects = [];
  for (let number = 1; number <= ENTRIES_PER_PAGE; number++) {
    const uuid = randomUUID();
    subjects.push({
      uuid,
      NUMBER: number,
      URI: URI_BASE + path + "/" + uuid,
      PERSON_URI: URI_BASE + "personen/" + randomUUID(),
      IDENTIFIER_URI: URI_BASE + "identificatoren/" + randomUUID(),
      GEBOORTE_URI: URI_BASE + "geboortes/" + randomUUID(),
      CONTACT_URI: URI_BASE + "contact-punten/" + randomUUID(),
      ADDRESS_URI: URI_BASE + "adressen/" + randomUUID(),
      FAMILYNAME: familyName,
      FIRSTNAME: "Test" + number,
      RRN: "0000000000" + number,
      BIRTHDATE: "1970-01-0" + number,
      EMAIL: "test" + number + "@test-worship-harvest.local",
      PHONE: "003200000000" + number,
    });
  }
  return subjects;
}

export async function renderPage(name, runId, bestuur, subjects, holds) {
  const page = await readFile("/script/templates/" + name + ".template.html", "utf8");
  const entry = await readFile("/script/templates/" + name + "-entry.template.html", "utf8");
  const entries = subjects
    .map((subject, index) => substitute(entry, { ...subject, ...holds[index % holds.length] }))
    .join("\n");
  return substitute(page, { RUN_ID: runId, BESTUUR_LABEL: bestuur.label, ENTRIES: entries });
}
