import {transform} from "https://deno.land/x/esbuild@v0.18.10/mod.js";
import { NeithElement } from "./neith.ts";

export class NeithJSCompiler {
    private tsString: string = ''
    private counter: number = 0

    handleScriptTag(element: NeithElement) {
        if(element.tag !== 'script') {
            throw Error("JSError: Invalid Tag!")
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