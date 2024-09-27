import {transform} from "https://deno.land/x/esbuild@v0.18.10/mod.js";
import { NeithElement } from "./neith.ts";

export class NeithJSCompiler {
    private tsString: string = ''
    private counter: number = 0

    provideCode(code: string) {
        this.tsString = code + this.tsString
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

    async code(): Promise<string> {
        const js = await transform(this.tsString, {loader: 'ts', format: 'esm'})
        return js.code
    }
}