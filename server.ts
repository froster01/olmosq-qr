import { createServer } from "node:http";
import next from "next";

import { attachOrderWebSocketServer } from "@/server/order-websocket-server";

const dev = process.env.NODE_ENV !== "production";
const port = Number(process.env.PORT || getArgValue("--port") || 3000);
const hostname = process.env.HOSTNAME || getArgValue("--hostname") || "0.0.0.0";

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

void main();

async function main() {
  await app.prepare();
  const handleUpgrade = app.getUpgradeHandler();

  const server = createServer((request, response) => {
    handle(request, response);
  });

  attachOrderWebSocketServer(server, handleUpgrade);

  server.listen(port, hostname, () => {
    console.log(
      `> Server listening at http://${hostname}:${port} as ${
        dev ? "development" : process.env.NODE_ENV
      }`
    );
  });
}

function getArgValue(name: string) {
  const index = process.argv.indexOf(name);
  if (index === -1) {
    return undefined;
  }

  return process.argv[index + 1];
}
