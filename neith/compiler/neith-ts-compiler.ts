export class NeithTsCompiler {
    static async compile(path: string) {
        await import(`../../${path}`)
    }
}