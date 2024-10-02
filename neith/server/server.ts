import { NeithRouter, Route } from "../router/router.ts";
import { banner } from "../utils/utils.ts";

export class NeithServer {
    private constructor(private router: NeithRouter) {}

    static fromRoutes(routes: Route[]): NeithServer {
        return new NeithServer(NeithRouter.fromRoutes(routes))
    }

    serve(port: number) {
        console.log("\x1b[A\x1b[2K")
        banner()
        Deno.serve({port: port}, (req: Request) => {
            return this.router.route(req)
        })
    }
}