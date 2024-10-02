import { join } from "jsr:@std/path/join";
import { NeithIOC } from "../ioc/ioc.ts";
import { NeithDOM } from "../dom/dom.ts";

export interface Route {
    path: string,
    component: string
}

export class NeithRouter {
    private routes: Map<string, string> = new Map()
    private ioc: NeithIOC

    private constructor(routes: Route[]) {
        console.log("Building...")
        this.ioc = NeithIOC.init()

        routes
            .forEach(route => {
                this.routes.set(route.path, join(Deno.cwd(), 'src', route.component))
            })
    }

    static fromRoutes(routes: Route[]): NeithRouter {
        return new NeithRouter(routes)
    }

    error(code:number, message: string): Response {
        return new Response(message, {
            status: code,
        })
    }

    async route(req: Request): Promise<Response> {
        const url = new URL(req.url)
        if(this.routes.has(url.pathname)) {
            const componentPath = this.routes.get(url.pathname)
            if(!componentPath) {
                return this.error(404, "Page not found!")
            }

            const component = this.ioc.get(componentPath)
            const element = await new component().render()
            const html = NeithDOM.build(element)

            return new Response(new TextEncoder().encode(html))
        } else {
            const path = join(Deno.cwd(), 'static', url.pathname)
            const file = Deno.readFileSync(path)
            
            if(url.pathname.match(/.js?/)) {
                return new Response(file, {
                    headers: {
                        'Content-Type': 'text/javascript'
                    }
                })
            }

            return new Response(file)
        }
    }
}