import { Router } from "express";
import { z } from "zod";

import type { RagQueryService } from "../services/rag/types.js";

const queryRequestSchema = z.object({
  query: z.string().trim().min(1, "Query is required"),
  filters: z
    .object({
      topic: z.string().trim().min(1).optional(),
      sourceName: z.string().trim().min(1).optional()
    })
    .optional()
});

export function createQueryRouter(ragQueryService: RagQueryService) {
  const router = Router();

  router.post("/", async (req, res, next) => {
    const parsed = queryRequestSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        error: "validation_error",
        message: parsed.error.issues[0]?.message ?? "Invalid query request"
      });
      return;
    }

    try {
      res.json(await ragQueryService.answer(parsed.data));
    } catch (error) {
      next(error);
    }
  });

  return router;
}
