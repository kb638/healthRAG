import { Router } from "express";

import type { HealthResponse } from "@healthwise/shared";

export const healthRouter = Router();

healthRouter.get("/", (_req, res) => {
  const response: HealthResponse = {
    status: "ok",
    service: "healthwise-rag-api"
  };

  res.json(response);
});
