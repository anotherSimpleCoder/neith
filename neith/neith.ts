import * as xml from "https://deno.land/x/xml@5.4.16/mod.ts";
import { NeithEnv } from "./neith-env.ts";

export interface NeithElement {
    tag: string,
    props: any[],
    text: string,
    children: NeithElement[],
}

export type NeithDocument = [string[], NeithElement]

export class Neith {
    constructor(
        private componentDir: string
    ) {}

    read(content: string): NeithDocument {
        //Extract preprocessor directives
        const {directives, template} = this.extractDirectives(content)

        //Parse HTML
        const parsed =  xml.parse(template, {
            mode: 'html'
        })['']

        const root: NeithElement = {
            tag: '',
            text: '',
            props: [],
            children: []
        }

        const constructed = this.construct(parsed, root)
        return [directives, constructed]
    }

    render([directives, _code]: NeithDocument) { 
        const env = new NeithEnv(this.componentDir)
        env.executeDirectives(directives)
    }

    private construct(xmlObject: any, element: NeithElement): NeithElement {         
        const props = Object.keys(xmlObject).filter(name => name.includes('@'))
        const nested = Object.keys(xmlObject).filter(name => !name.includes('@'))
        for(const prop of props) {
            const propMap: Map<string, string> = new Map()
            propMap.set(prop.split('@')[1], xmlObject[prop])
            element.props.push(Object.fromEntries(propMap))
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

    private extractDirectives(code: string): {directives: string[], template: string} {
        const directives = code.split('\n')
            .filter(line => line[0] === '@')
            .map(line => line.replace('\r', ''))

        const templateLines = code.split('\n')
            .filter(line => line[0] !== '@')
            
        templateLines.shift()

        let template = templateLines.join('\n')
        template = '<>' + template
        template += '</>'
        return {
            directives: directives,
            template: template
        }
    }
}