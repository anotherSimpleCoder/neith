import * as xml from "https://deno.land/x/xml@5.4.16/mod.ts";
import {JSDOM} from 'npm:jsdom'
import { DOMParser, HTMLDocument, Element } from "jsr:@b-fuze/deno-dom";
import { join, isAbsolute } from "@std/path";
import { NeithComponent } from "./component.ts";
import { NeithIOC } from "./neith-ioc.ts";
import { NeithCLI } from "./neith.cli.ts";
import { NeithServer } from "./server.ts";
import { NeithRouter } from "./router.ts";
import {routes} from '../src/routes.ts'
import { NeithProp, isNeithProp, handleNeithProp } from "./neith-props.ts";
import { NeithJSCompiler } from "./neith-js-compiler.ts";
import { NeithCSSCompiler } from "./neith-css-compiler.ts";


export interface NeithElement {
    tag: string,
    props: NeithProp[],
    text: string,
    children: NeithElement[],
}

export type NeithDocument = [string[], NeithElement]

export class Neith {
    private componentFile: string
    private envDir: string = `${Deno.cwd()}/src`
    private cssCompiler: NeithCSSCompiler = new NeithCSSCompiler()
    private jsCompiler: NeithJSCompiler = new NeithJSCompiler()
    private static ioc: NeithIOC = new NeithIOC()

    private indexDoc: HTMLDocument
    constructor(
        private componentDir: string,
    ) {
        if(isAbsolute(componentDir)) {
            this.componentFile = componentDir
        } else {
            this.componentFile = join(this.envDir, componentDir)
        }
        
        this.componentDir = join(this.componentFile, '..')
       
        const file = Deno.readFileSync(join(Deno.cwd(), 'src/index.html'))
        const content = new TextDecoder().decode(file)
        this.indexDoc = new DOMParser().parseFromString(content, 'text/html')
    }

    static serve(port: number) {
        NeithCLI.listen()
        const server = new NeithServer(new NeithRouter(routes));
        server.serve(port)
    }

    static async build(path: string): Promise<NeithComponent> {
        //Instantiate Neith
        const neith = new Neith(path)
        const documentContent = neith.openDocument()
        const [directives, template] = neith.extractDirectives(documentContent)
        await neith.setupIOC(directives)
        const element = neith.read(template)
        element.children = await Promise.all(element.children.map(async node => await neith.purify(node)))
        const body = neith.indexDoc.getElementById('neith')
        if(!body) throw Error("RuntimeError: Invalid index.html file!")
        const domConstructed = neith.domConstruct(element, body)
        neith.cssCompiler.include(join(Deno.cwd(), 'src/style.css'))
        
        return {
            html: neith.render(body, domConstructed),
            css: neith.cssCompiler.code(),
            js: await neith.jsCompiler.code()
        }
    }

    private async import(alias: string, filename: string) {
        const neith = new Neith(filename)
        const documentContent = neith.openDocument()
        const [directives, template] = neith.extractDirectives(documentContent)
        await neith.setupIOC(directives)
        const element = neith.read(template)

        
        Neith.ioc.injetable(alias, element)
    }

    openDocument() {
        const fileContents = Deno.readFileSync(this.componentFile)
        const content =  new TextDecoder().decode(fileContents)
        return content
    }

    extractDirectives(code: string): [string[], string] {
        const directives = code.split('\n')
            .filter(line => line[0] === '@')
            .map(line => line.replace('\r', ''))

        const templateLines = code.split('\n')
            .filter(line => line[0] !== '@')

        let template = templateLines.join('\n')
        template = '<>\n' + template
        template += '\n</>'

        return [
            directives,
            template
        ]
    }

    async setupIOC(directives: string[]) {
        for(const directive of directives) {
            if(directive.includes('@import')) {
                const fileNameMatch = directive.match(/@import\('([^']+)'\)/)
                const aliasMatch = directive.match(/@import\(['"].+?['"]\)\s+as\s+(\w+)/)
                
                if(!fileNameMatch) {
                    throw Error("Syntax error: Invalid import statement!")
                }

                if(!aliasMatch) {
                    throw Error("Syntax error: Alias missing!")
                }

                const filename = fileNameMatch[1]
                const alias = aliasMatch[1]
                if(isAbsolute(filename)) {
                    this.import(alias, filename)
                } else {
                    const path = join(this.componentDir, filename)
                    this.import(alias, path)
                }
            }

            else if(directive.includes('@provide')) {
                const matches = directive.match(/@provide\('([^']+)'\)/)
                
                if(!matches) {
                    throw Error("Syntax error: Invalid provide statement!")
                }

                const filename = matches[1]
                const content = await Deno.readFile(join(this.envDir, filename))
                // console.log(content)
                
                // this.container.set()
            }

            else {
                throw Error("Syntax error: Invalid preprocessor directive!")
            }
        }
    }

    read(content: string): NeithElement {
        //Parse HTML
        const parsed =  xml.parse(content, {
            mode: 'html'
        })['']

        const root: NeithElement = {
            tag: 'div',
            text: '',
            props: [],
            children: []
        }

        const constructed = this.construct(parsed, root)
        return constructed
    }

    async purify(node: NeithElement): Promise<NeithElement>{
        let pureNode = node
        if(!this.isHTMLTag(node.tag)) {
            pureNode = Neith.ioc.inject(node.tag)
            pureNode.tag = 'div'
        }

        if(node.tag === 'script') {
            return this.compileTypescript(node)
        }

        for(const prop of node.props) {
            if(isNeithProp(node, prop)) {
                handleNeithProp(node, prop, this.jsCompiler)
            }
        }

        for(let i = 0; i < pureNode.children.length; i++) {
            pureNode.children[i] = await this.purify(pureNode.children[i])
        }

        return pureNode
    }

    private domConstruct(node: NeithElement, _parent: Element): Element {
        const htmlNode = this.indexDoc.createElement(node.tag)
        htmlNode.textContent = node.text
        for(const prop of node.props) {
            if(isNeithProp(node, prop)) {
                console.log(prop)
            } else {
                htmlNode.setAttribute(prop.name, prop.value)
            }
        }

        for(const child of node.children) {
            htmlNode.appendChild(this.domConstruct(child, htmlNode))
        }

        return htmlNode
    }

    private render(doc: Element, constructedElement: Element): string {
        doc.appendChild(constructedElement)
        const docElement = this.indexDoc.documentElement
        
        if(!docElement) {
            throw Error("Runtime Error: Invalid index.html!")
        }

        return docElement.outerHTML
    }

    private construct(xmlObject: any, element: NeithElement): NeithElement {         
        const props = Object.keys(xmlObject).filter(name => name.includes('@'))
        const nested = Object.keys(xmlObject).filter(name => !name.includes('@'))
        for(const prop of props) {
            element.props.push({
                name: prop.split('@')[1],
                value: xmlObject[prop]
            })
        }

        for(const memberName of nested) {    
            const value = xmlObject[memberName]
            if(memberName === '#text') {
                element.text = value
                continue
            }

            if(!value) {
                element.children.push({tag: memberName, children: [], text: '', props: []})
                continue
            }
    
            if(typeof(value) === 'string') {
                element.children.push({tag: memberName, children: [], text: value, props: []})
                continue
            }
    
            if(typeof(value) === 'object') {
                element.children.push(this.construct(value, {tag: memberName, children: [], text: '', props: []}))
                continue
            }
        }

        return element
    }

    private isHTMLTag(tag: string): boolean {
        const dom = new JSDOM()
        const element = dom.window.document.createElement(tag)
        return !(element instanceof dom.window.HTMLUnknownElement)
    }

    private compileTypescript(node: NeithElement): NeithElement {
        // return {
        //     tag: 'script',
        //     text: (await transform(typescript, {loader: 'ts', format: 'esm'})).code,
        //     children: [],
        //     props: []
        // }
        this.jsCompiler.handleScriptTag(node)
        return {
            tag: 'div',
            text: '',
            children: [],
            props: []
        }
    }
}