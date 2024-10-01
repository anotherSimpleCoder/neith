import { NeithServer } from "./neith/server/server.ts";
import { routes } from "./routes.ts";

NeithServer
    .fromRoutes(routes)
    .serve(3000)