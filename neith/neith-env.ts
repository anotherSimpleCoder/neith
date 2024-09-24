import {join} from '@std/path'

export class NeithEnv {
    constructor(
        private envDir: string
    ) {
        this.envDir = join(Deno.cwd(), envDir)
    }

    executeDirectives(directives: string[]): Map<string, any> {
        const env: Map<string, any> = new Map()

        for(const directive of directives) {
            if(directive.includes('@import')) {
                const matches = directive.match(/@import\('([^']+)'\)/)
                
                if(!matches) {
                    throw Error("Syntax error: Invalid import statement!")
                }

                const filename = join(this.envDir, matches[1])
            }

            else if(directive.includes('@provide')) {
                const matches = directive.match(/@provide\('([^']+)'\)/)
                
                if(!matches) {
                    throw Error("Syntax error: Invalid provide statement!")
                }

                const filename = join(this.envDir, matches[1])
                console.log(filename)
            }

            else {
                throw Error("Syntax error: Invalid preprocessor directive!")
            }
        }

        return env
    }

    private static import(path: string) {

    }

    private static provide(path: string) {

    }
}