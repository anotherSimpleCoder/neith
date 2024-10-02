import { NeithServer } from "./neith/mod.ts";
import { routes } from "./routes.ts";

NeithServer
    .fromRoutes(routes)
    .serve(3000)
