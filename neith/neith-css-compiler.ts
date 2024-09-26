export class NeithCSSCompiler {
    private cssCode: string = ''

    include(filename: string) {
        this.cssCode += `\n${Deno.readTextFileSync(filename)}`
    }

    code() {
        return this.cssCode
    }
}