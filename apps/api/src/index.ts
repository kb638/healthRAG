import { createApp, createDefaultServices } from "./app.js";
import { env } from "./config/env.js";

async function main() {
  const services = await createDefaultServices();
  const app = createApp(services);

  app.listen(env.API_PORT, () => {
    console.log(`HealthWise RAG API listening on http://localhost:${env.API_PORT}`);
  });
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
