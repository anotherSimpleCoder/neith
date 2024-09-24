import {NeithComponent} from './component.ts'
import {Neith} from './neith.ts'
import { DOMParser, Element } from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";

export class Renderer {
    static async renderHTML(componentClass: NeithComponent): Promise<Uint8Array> {
        const decoder = new TextDecoder()

        const pagePath = './src/index.html'
        const pageMeta = await Deno.stat(pagePath)
        const pageFile = Deno.openSync(pagePath, {read:true})
        const pageBuffer = new Uint8Array(pageMeta.size)
        await pageFile.read(pageBuffer)
        const pageContent = decoder.decode(pageBuffer)

        const document = new DOMParser().parseFromString(pageContent, 'text/html')
        const body = document.getElementById('neith')

        //Add rendered tree in here
        const component = new componentClass()
        const componentDir = `./src/${component.name}`
        const path = `./${componentDir}/${component.name}.neith`
        const meta = await Deno.stat(path)
        const file = Deno.openSync(path)
        const buffer = new Uint8Array(meta.size)
        await file.read(buffer)

        const neith = new Neith(componentDir)
        const syntaxTree = neith.read(decoder.decode(buffer))
        const html = neith.render(syntaxTree)

        if(!body) {
            throw Error("Invalid index.html!")
        }

        // body.appendChild(htmlNode)
        const docElement = document.lastChild as Element
        return new TextEncoder().encode(docElement.outerHTML)
    }

    static async renderCSS(): Promise<Uint8Array> {
        const cssPath = './src/style.css'
        const cssMeta = await Deno.stat(cssPath)
        const cssFile = Deno.openSync(cssPath, {read:true})
        const cssBuffer = new Uint8Array(cssMeta.size)
        await cssFile.read(cssBuffer)

        return cssBuffer
    }
}