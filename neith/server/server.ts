import { NeithRouter, Route } from "../router/router.ts";

export class NeithServer {
    private constructor(private router: NeithRouter) {}

    static fromRoutes(routes: Route[]): NeithServer {
        return new NeithServer(NeithRouter.fromRoutes(routes))
    }

    serve(port: number) {
        Deno.serve({port: port}, (req: Request) => {
            return this.router.route(req)
        })
    }
}