import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { URI_BASE } from "./config.js";

export function buildSubject(path, familyName) {
  return {
    URI: URI_BASE + path + "/" + randomUUID(),
    PERSON_URI: URI_BASE + "personen/" + randomUUID(),
    IDENTIFIER_URI: URI_BASE + "identificatoren/" + randomUUID(),
    GEBOORTE_URI: URI_BASE + "geboortes/" + randomUUID(),
    CONTACT_URI: URI_BASE + "contact-punten/" + randomUUID(),
    ADDRESS_URI: URI_BASE + "adressen/" + randomUUID(),
    FAMILYNAME: familyName,
    FIRSTNAME: "Test",
    RRN: "00000000001",
    BIRTHDATE: "1970-01-01",
    EMAIL: "test@test-worship-harvest.local",
    PHONE: "0032000000001",
    NUMBER: "1",
  };
}

export async function renderPage(name, values) {
  let html = await readFile("/script/templates/" + name + ".template.html", "utf8");
  for (const [placeholder, value] of Object.entries(values)) {
    html = html.split("{{" + placeholder + "}}").join(value);
  }
  const left = html.match(/\{\{[^}]+\}\}/);
  if (left) throw new Error("unreplaced placeholder " + left[0] + " in " + name);
  return html;
}
