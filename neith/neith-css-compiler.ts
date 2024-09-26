import { NeithElement } from "./neith.ts";

export class NeithCSSCompiler {
    private cssCode: string = ''

    include(filename: string) {
        this.cssCode += `\n${Deno.readTextFileSync(filename)}`
    }

    handleStyleTag(element: NeithElement) {
        if(element.tag !== 'style') {
            throw Error("JSError: Invalid Tag!")
        }

        this.cssCode += `\n${element.text}`
    }

    code() {
        return this.cssCode
    }
}