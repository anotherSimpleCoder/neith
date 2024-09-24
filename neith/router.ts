import { NeithComponent } from "./component.ts";
import { Renderer } from "./renderer.ts";

export interface Route {
    path: string,
    component: NeithComponent
}

export class NeithRouter {
    routes: Map<string, NeithComponent>

    constructor(
        routeArray: Route[]
    ) {
        this.routes = new Map()

        routeArray.forEach(route => {
            this.routes.set(route.path, route.component)
        })
    }
    

    async route(req: Request): Promise<Response> {
        const url: URL = new URL(req.url)
        if(url.pathname === '/style.css') {
            return new Response(await Renderer.renderCSS(), {
                headers: {
                    'Content-Type': 'text/css'
                }
            })
        }

        const pathComponent = this.routes.get(url.pathname)
        if(!pathComponent) {
            return new Response("404: Not Found!")
        }

        return new Response(await Renderer.renderHTML(pathComponent), {
            headers: {
                'Content-Type': 'text/html'
            }
        })
    }
}