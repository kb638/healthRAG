import { Router } from "express";

import type { SourceService } from "../services/sources/sourceService.js";

export function createSourcesRouter(sourceService: SourceService) {
  const router = Router();

  router.get("/", async (_req, res, next) => {
    try {
      res.json(await sourceService.listSources());
    } catch (error) {
      next(error);
    }
  });

  return router;
}
