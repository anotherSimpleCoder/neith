import * as xml from "https://deno.land/x/xml@5.4.16/mod.ts";
import {build, transform} from "https://deno.land/x/esbuild@v0.18.10/mod.js";
import {JSDOM} from 'npm:jsdom'
import { DOMParser, Element } from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";
import { join, isAbsolute } from "@std/path";
import { NeithComponent } from "./component.ts";
import { NeithIOC } from "./neith-ioc.ts";

interface NeithProp {
    name: string, 
    value: string
}

export interface NeithElement {
    tag: string,
    props: NeithProp[],
    text: string,
    children: NeithElement[],
}

const neithProps = new Map([
    ['input', [/bind:value=\s*([^\s]+)/]],
    ['button', [/on:click=\s*([^\s]+)/]]
])

export type NeithDocument = [string[], NeithElement]

export class Neith {
    private componentFile: string
    private envDir: string = `${Deno.cwd()}/src`
    private static ioc: NeithIOC = new NeithIOC()
    constructor(
        private componentDir: string,
    ) {
        if(isAbsolute(componentDir)) {
            this.componentFile = componentDir
        } else {
            this.componentFile = join(this.envDir, componentDir)
        }
        
        this.componentDir = join(this.componentFile, '..')
    }

    static async build(path: string): Promise<NeithComponent> {
        //Instantiate Neith
        const neith = new Neith(path)
        const documentContent = neith.openDocument()
        const [directives, template] = neith.extractDirectives(documentContent)
        await neith.setupIOC(directives)
        const element = neith.read(template)
        element.children = await Promise.all(element.children.map(async node => await neith.purify(node)))
        
        
        return {
            html: neith.render(element),
            css: '',
            js: ''
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

        for(const prop of node.props) {
            if(this.isNeithProp(node.tag, `${prop.name}=${prop.value}`)) {
                this.compileNeithProps(node)
            }
        }

        if(node.tag === 'script') {
            return this.compileTypescript(node.text)
        }

        for(let i = 0; i < pureNode.children.length; i++) {
            pureNode.children[i] = await this.purify(pureNode.children[i])
        }

        return pureNode
    }

    render(node: NeithElement): string {
        //Construct component html
        let html = ''
        const props = node.props.map(prop => (`${prop.name}=${prop.value}`)).join(' ')

        html += `<${node.tag}`
        if(props !== '') {
            html += ` ${props}`
        }
        html += `>`

        html += node.text

        for(const child of node.children) {
            html += this.render(child)
        }

        html += `</${node.tag}>`

        //Get index.html
        const indexHtml = new TextDecoder().decode(Deno.readFileSync(join(Deno.cwd(), 'src/index.html')))
        const indexDoc = new DOMParser().parseFromString(indexHtml, 'text/html')

        const neithBody = indexDoc.getElementById('neith')
        if(!neithBody) {
            throw Error("Error: Invalid index.html!")
        }

        return html
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

    private isNeithProp(elementName: string, prop: string) {
        const props =  neithProps.get(elementName)
        if(!props) {
            throw Error("SyntaxError: Wrong prop used for element " + elementName)
        }

        for(const neithProp of props) {
            if(prop.match(neithProp))
                return true
        }

        return false
    }

    private compileNeithProps(_element: NeithElement) {
        throw Error("Not yet implemented!")
    }

    private async compileTypescript(typescript: string): Promise<NeithElement> {
        return {
            tag: 'script',
            text: (await transform(typescript, {loader: 'ts', format: 'esm'})).code,
            children: [],
            props: []
        }
    }
}