import { join } from "jsr:@std/path/join";
import { NeithTsCompiler } from "./neith-ts-compiler.ts";
import { NeithTemplateCompiler } from "./neith-template-compiler.ts";

export class NeithCompiler {
    static compile() {
        this.openDir('src')
    }

    private static openDir(path: string) {
        const dir = Deno.readDirSync(path)
        for(const entry of dir) {
            if(entry.isFile) {
                this.openFile(join(path, entry.name))
            } else if(entry.isDirectory) {
                this.openDir(join(path, entry.name))
            }
        }
    }

    private static async openFile(path: string) {
        if(path.match(/.neith$/)) {
            this.compileNeith(path)
        } else if(path.match(/.ts$/)) {
            await this.compileTypescript(path)
        }
    }

    private static compileNeith(path: string) {
        NeithTemplateCompiler.compile(path)
    }

    private static async compileTypescript(path: string) {
        await NeithTsCompiler.compile(path)
    }
}