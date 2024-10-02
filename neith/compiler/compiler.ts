import { join } from "jsr:@std/path/join";
import * as xml from "https://deno.land/x/xml@5.4.16/mod.ts";
import {JSDOM} from 'npm:jsdom'
import hash from "https://deno.land/x/object_hash@2.0.3.1/mod.ts";
import { NeithComponent } from "./component.ts";
import { NeithElement } from "../../mod.ts";
import { handleNeithProp, isNeithProp } from "./props.ts";
import { NeithJSCompiler } from "./js.ts";

export class NeithCompiler {
    neithComp: NeithComponent | undefined
    imported: Map<string, NeithElement> = new Map()

    constructor(
        private ioc: Map<string, new (...args: any[]) => NeithComponent>,
        private jsCompiler: NeithJSCompiler
    ) {}

    get component(): NeithComponent {
        if(!this.neithComp) {
            throw new Error("Invalid component")
        }

        return this.neithComp
    }

    set component(comp: NeithComponent) {
        this.neithComp = comp
    }

    compile(component: NeithComponent): NeithElement {
        this.component = component

        const [directives, template] = this.extractDirectives(component.template)
        this.runDirectives(directives)
        let element = this.read(template)
        element = this.purify(element)
        return element
    }

    private extractDirectives(code: string): [string[], string] {
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

    private runDirectives(directives: string[]) {
        for(const directive of directives) {
            if(directive.match(/^@import/)) {
                const path = directive.match(/@import\('([^']+)'\)/)?.[1]
                const alias = directive.match(/@import\(['"].+?['"]\)\s+as\s+(\w+)/)?.[1]
            
                if(!path || !alias) {
                    throw new Error("SyntaxError: Invalid import statement!")
                }

                const importedComponent = this.ioc.get(join(this.component.name, '..', path) )
                if(!importedComponent) {
                    throw new Error("InjectionError: Component not found!")
                }

                const compiler = new NeithCompiler(this.ioc, this.jsCompiler)
                this.imported.set(alias, compiler.compile(new importedComponent()))
            }

            if(directive.match(/^@provide/)) {
                const serviceName = directive.match(/@provide\(([^']+)\)/)?.[1]
                const alias = directive.match(/@provide\(([^']+)\)\s+as\s+(\w+)/)?.[2]
                if(!serviceName || !alias) {
                    throw new Error("SyntaxError: Invalid provide statement!")
                }

                this.jsCompiler.provideService(alias, serviceName)
            }
        }
    }

    private read(content: string): NeithElement {
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

    private purify(node: NeithElement): NeithElement{
        let pureNode = node
        if(!this.isHTMLTag(node.tag)) {
            const element = this.imported.get(node.tag)
            if(!element) {
                throw new Error(`InjectionError: ${node.tag} not found!`)
            }

            pureNode = element
            pureNode.tag = 'div'
        }

        if(node.tag === 'style') {
            return node
        }

        if(node.tag === 'script') {
            this.jsCompiler.handleScriptTag(node)
            return {
                tag: 'div',
                text: '',
                children: [],
                props: []
            }
        }
        
        if(node.text.match(/\{[^}]*\}/)) {
            const varName = node.text.replace(/\{(\w+)\}/g, "$1")
            const id = hash(varName)
            node.props.push({name: 'id', value: id})
            this.jsCompiler.simpleBind(id, varName)
            node.text = ''
        }

        for(const prop of node.props) {
            if(isNeithProp(node, prop)) {
                handleNeithProp(node, prop, this.jsCompiler)
            }
        }

        for(let i = 0; i < pureNode.children.length; i++) {
            pureNode.children[i] = this.purify(pureNode.children[i])
        }

        return pureNode
    }

    private isHTMLTag(tag: string): boolean {
        const dom = new JSDOM()
        const element = dom.window.document.createElement(tag)
        return !(element instanceof dom.window.HTMLUnknownElement)
    }
}