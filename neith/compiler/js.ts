import { join } from "jsr:@std/path/join";
import {transform} from "https://deno.land/x/esbuild@v0.18.10/mod.js";
import { NeithElement } from "../mod.ts";
import { Document } from "jsr:@b-fuze/deno-dom";


export class NeithJSCompiler {
    private tsString: string = ''
    private templateCounter: number = 0
    private counter: number = 0

    provideService(alias: string, serviceName: string) {
        this.tsString = `const ${alias} = NeithIOC.inject('${serviceName}');\n` + this.tsString
    }

    handleScriptTag(element: NeithElement) {
        if(element.tag !== 'script') {
            throw Error("JSError: Invalid Tag!")
        }

        const stateDecRegex = /let\s+([a-zA-Z_]\w*)\s*:\s*([a-zA-Z_]\w*)\s*=\s*(.+);?/g
        const stateDeclarations = element.text.match(stateDecRegex)
        if(stateDeclarations) {
            // element.text = element.text.replace(stateDecRegex, '')
            for(const dec of stateDeclarations) {
                const nameMatches = (dec as string).match(/let\s+([a-zA-Z_]\w*)\s*:\s*[a-zA-Z_]\w*\s*=/)
                const valueMatches = (dec as string).match(/let\s+[a-zA-Z_]\w*\s*:\s*[a-zA-Z_]\w*\s*=\s*(['"].*?['"]|\S+);?/)
                if(!nameMatches || !valueMatches) {
                    throw new Error("SyntaxError: Invalid state declaration!")
                }
                const value = valueMatches[1]
                const name = nameMatches[1]
            }
        }

        this.tsString += `\n${element.text}`
    }

    addEventListener(id: string, event: string, method: string) {
        let code = `const element${this.counter} = document.getElementById('${id}');\n`;
        code += `element${this.counter}.addEventListener('${event}', ${method});\n`;

        this.tsString += `\n${code}`
        this.counter++
    }

    simpleBind(id: string, varname: string) {
        let code = `const element${this.counter} = document.getElementById('${id}');\n`
        code += `element${this.counter}.text = ${varname};`

        this.tsString += `\n${code}`
        this.counter++
    }

    handleBars(node: NeithElement) {
        const id = node.props
            .filter(prop => prop.name === 'id')[0]
            .value

        const varName = node.text.replace(/\{(\w+)\}/g, "$1")
        const html = `<${node.tag}>{${node.text}}</${node.tag}>`
        let code = `const template${this.templateCounter}=Handlebars.compile('${html}')\n`
        code += `document.getElementById('${id}').innerHTML=template${this.templateCounter}({${varName} : ${varName}});`
        this.tsString += `\n${code}`
        node.tag = 'div'
    }

    async compile() {
        const js = await transform(this.tsString, {loader: 'ts', format: 'esm'})
        Deno.writeTextFileSync(join(Deno.cwd(), 'static/script.js'), js.code, {append: true})
    }
}