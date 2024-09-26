import { NeithComponent } from "./component.ts";
import { Neith } from "./neith.ts";
import { Renderer } from "./renderer.ts";

export interface Route {
    path: string,
    component: string
}

export class NeithRouter {
    routes: Map<string, string>
    document: NeithComponent = {html: '', css: '', js: ''}

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
            const css = this.document.css
            return new Response(new TextEncoder().encode(css))
        }

        if(url.pathname === '/script.js') {
            const js = this.document.js
            return new Response(new TextEncoder().encode(js))
        }

        const documentPath = this.routes.get(url.pathname)
        if(!documentPath) {
            return new Response("404: Not Found!")
        }
        this.document = await Neith.build(documentPath)

        return new Response(new TextEncoder().encode(this.document.html))
    }
}