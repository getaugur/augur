// src/server/trpc/router/index.ts
import { t } from "../trpc";
import { exampleRouter } from "./example";
import { authRouter } from "./auth";
import { mediaRouter } from "./media";

export const appRouter = t.router({
  example: exampleRouter,
  auth: authRouter,
  media: mediaRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
