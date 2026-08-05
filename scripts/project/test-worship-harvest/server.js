import http from "node:http";
import os from "node:os";
import { PAGE_PORT } from "./config.js";

// download-url-service fetches the RDFa pages over HTTP, so this container serves them
// itself on its own IP: the URL must be reachable from other containers on the docker
// network, hence 0.0.0.0 and the non-internal IPv4 rather than localhost. The pages are
// behind basic auth on purpose - that is what the dgftSec credential chain is tested on.

function pickOwnIp() {
  const ipv4s = [];
  for (const [, addresses] of Object.entries(os.networkInterfaces())) {
    for (const address of addresses) {
      if (address.family === "IPv4" && !address.internal) ipv4s.push(address.address);
    }
  }
  if (ipv4s.length !== 1) {
    throw new Error("expected exactly 1 non-internal IPv4, found " + ipv4s.length + " (" + ipv4s.join(", ") + ")");
  }
  return ipv4s[0];
}

export async function startServer(pages, user, pass, runId) {
  const ownIp = pickOwnIp();
  const paths = {
    mandatarissen: "/mandatarissen-" + runId + ".html",
    bedienaren: "/bedienaren-" + runId + ".html",
  };
  const expected = "Basic " + Buffer.from(user + ":" + pass).toString("base64");

  const server = http.createServer((request, response) => {
    if (request.headers.authorization !== expected) {
      response.writeHead(401);
      response.end();
      return;
    }
    const name = Object.keys(paths).find((key) => paths[key] === request.url);
    if (!name) {
      response.writeHead(404);
      response.end();
      return;
    }
    response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    response.end(pages[name]);
  });
  await new Promise((resolve) => server.listen(PAGE_PORT, "0.0.0.0", resolve));

  // Self-fetch both pages before handing the URLs to the harvest: catches a wiring
  // mistake here instead of five minutes later as a failed download task.
  const urls = {};
  for (const [name, path] of Object.entries(paths)) {
    urls[name] = "http://" + ownIp + ":" + PAGE_PORT + path;
    const withoutAuth = await fetch(urls[name]);
    if (withoutAuth.status !== 401) {
      throw new Error(name + " self-fetch without auth returned " + withoutAuth.status + " (expected 401)");
    }
    const withAuth = await fetch(urls[name], { headers: { Authorization: expected } });
    if (withAuth.status !== 200) {
      throw new Error(name + " self-fetch with auth returned " + withAuth.status + " (expected 200)");
    }
  }
  return { server, urls, ownIp };
}
