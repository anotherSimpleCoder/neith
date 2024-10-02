import { DOMParser, HTMLDocument, Element } from "jsr:@b-fuze/deno-dom";
import { NeithElement } from "../../mod.ts";;
import { join } from "jsr:@std/path/join";
import { isNeithProp } from "../compiler/props.ts";

export class NeithDOM {
    private indexDoc: HTMLDocument | undefined
    private constructor() {}

    static build(node: NeithElement) {
        const dom = new NeithDOM()
        dom.init()
        return dom.domBuild(node)
    }

    get index() {
        if(!this.indexDoc) {
            throw new Error("DOMError: index.html not loaded")
        }

        return this.indexDoc
    }

    set index(newIndex: HTMLDocument) {
        this.indexDoc = newIndex
    }

    private init() {
        const file = Deno.readFileSync(join(Deno.cwd(), 'index.html'))
        const content = new TextDecoder().decode(file)
        this.index = new DOMParser().parseFromString(content, 'text/html')
    }

    private domBuild(node: NeithElement) {
        const neithBody = this.index.getElementById('neith')
        if(!neithBody) {
            throw new Error("DOMError: Invalid index.html")
        }


        const domConstructed = this._domConstruct(node, neithBody)
        neithBody.appendChild(domConstructed)
        const docElement = this.index.documentElement
        if(!docElement) {
            throw new Error("DOMError: Invalid index.html")
        }

        return docElement.outerHTML
    }

    private _domConstruct(node: NeithElement, _parent: Element): Element {
        const htmlNode = this.index.createElement(node.tag)
        htmlNode.textContent = node.text
        for(const prop of node.props) {
            if(isNeithProp(node, prop)) {
                console.log(prop)
            } else {
                htmlNode.setAttribute(prop.name, prop.value)
            }
        }

        for(const child of node.children) {
            htmlNode.appendChild(this._domConstruct(child, htmlNode))
        }

        return htmlNode
    }
}