import { NeithRouter } from "../neith/router.ts";

export class NeithServer {
    constructor(
        private router: NeithRouter
    ) {}

    serve(port: number) {
        Deno.serve({port: port}, async (req: Request) => {
            return await this.router.route(req)
        })
    }
}