import http from "node:http";
import os from "node:os";
import { PAGE_PORT } from "./config.js";

// download-url-service fetches the RDFa pages over HTTP, so this container serves them
// itself: the URL must be reachable from the other containers on the docker network,
// hence 0.0.0.0 and the non-internal IPv4 rather than localhost. The pages are behind
// basic auth on purpose - that is what the dgftSec credential chain is tested on.
export async function startServer(pages, user, pass, runId) {
  const ip = Object.values(os.networkInterfaces())
    .flat()
    .find((address) => address.family === "IPv4" && !address.internal).address;
  const expected = "Basic " + Buffer.from(user + ":" + pass).toString("base64");
  const paths = {};
  for (const name of Object.keys(pages)) paths[name] = "/" + name + "-" + runId + ".html";

  const server = http.createServer((request, response) => {
    if (request.headers.authorization !== expected) return response.writeHead(401).end();
    const name = Object.keys(paths).find((key) => paths[key] === request.url);
    if (!name) return response.writeHead(404).end();
    response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    response.end(pages[name]);
  });
  await new Promise((resolve) => server.listen(PAGE_PORT, "0.0.0.0", resolve));

  // Self-fetch both pages before handing the URLs to the harvest: catches a wiring
  // mistake here instead of five minutes later as a failed download task.
  const urls = {};
  for (const [name, path] of Object.entries(paths)) {
    urls[name] = "http://" + ip + ":" + PAGE_PORT + path;
    const anonymous = await fetch(urls[name]);
    const authenticated = await fetch(urls[name], { headers: { Authorization: expected } });
    if (anonymous.status !== 401 || authenticated.status !== 200) {
      throw new Error(
        name + " self-fetch: " + anonymous.status + " without auth (expected 401), " +
        authenticated.status + " with auth (expected 200)"
      );
    }
  }
  return { server, urls };
}
