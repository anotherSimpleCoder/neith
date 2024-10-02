import { join } from "jsr:@std/path/join";
import {DependencyGraph} from '../ioc/dependencyGraph.ts'
import { NeithComponent } from "../compiler/component.ts";
import { NeithCompiler } from "../compiler/compiler.ts";
import { NeithElement } from "../mod.ts";
import { transform } from "https://deno.land/x/esbuild@v0.18.10/mod.js";
import { NeithJSCompiler } from "../compiler/js.ts";

export class NeithIOC {
    files: string[] = []
    neithFiles: string[] = []
    tsFiles: string[] = []
    dependencyGraph: DependencyGraph = new DependencyGraph()
    container: Map<string, new (...args: any[]) => NeithComponent> = new Map()

    private constructor() {}

    static init() {
        const ioc: NeithIOC = new NeithIOC()
        ioc.setup()

        return ioc
    }

    private setup() {
        Deno.writeTextFileSync(join(Deno.cwd(), 'static/script.js'), `import {NeithIOC} from './core.js'\n`)

        this.fetchFiles('src')
        this.buildServices()
        this.constructDependencyGraph()
        this.setupIOC()
    }

    get(name: string) {
        const component = this.container.get(name)
        if(!component) {
            throw new Error(`InjectionError: ${name} not found!`)
        }

        return component
    }

    private fetchFiles(directory: string) {
        const dir = Deno.readDirSync(directory)
        for(const entry of dir) {
            if(entry.isFile) {[
                this.files.push(join(directory, entry.name))
            ]} else if (entry.isDirectory){
                this.fetchFiles(join(directory, entry.name))
            }
        }

        this.tsFiles = this.files.filter(filename => filename.match(/.ts$/) ? true : false)
        this.neithFiles = this.files.filter(filename => filename.match(/.neith$/) ? true : false)
    }

    private async buildServices() {
        let counter = 0

        for(const file of this.tsFiles) {
            const content = Deno.readTextFileSync(file)
            
            const isService = content.split(/\n/)
                .filter(line => line.match(/'@service'/) ? true : false)
                .map(line => line.match(/'@service'/) ? true : false)
                .reduce((acc, line) => acc && line, true)

            if(!isService) {
                continue
            }

            const ts = content.split(/\n/)
                .filter(line => line.match(/'@service'/) ? false : true)

            ts[0] = `NeithIOC.import(${ts[0]}`
            ts.push(`)`)
            const jsObj = await transform(ts.join('\n'), {loader: 'ts', format: 'esm'})

            Deno.writeTextFileSync(join(Deno.cwd(), 'static/script.js'), jsObj.code, {append: true})
            counter++
        }
    }

    private constructDependencyGraph() {
        this.dependencyGraph = new DependencyGraph(this.neithFiles)
        
        for(const file of this.neithFiles) {
            const content = Deno.readTextFileSync(file)

            const importList = content.split(/\n/)
                .filter(line => line.match(/^@import/) ? true : false)
                .map(line => line.match(/@import\('([^']+)'\)/)?.[1])

            importList.forEach((filename) => {
                this.dependencyGraph.import(join(file,'..' ,filename ?? ''), file)
            })
        }
    }

    private setupIOC() {
        const order = this.dependencyGraph.sorted()
            .map(file => join(Deno.cwd(), file))
        const ioc = this.container

        for(const path of order) {
            const component = class extends NeithComponent {
                constructor() {
                    super(path, Deno.readTextFileSync(path))
                }
    
                async render(): Promise<NeithElement> {
                    const jsCompiler = new NeithJSCompiler()
                    const compiler = new NeithCompiler(ioc, jsCompiler)
                    const element = compiler.compile(this)
                    await jsCompiler.compile()
                    return element
                }
            }

            if(!this.container.has(path)) {
                this.container.set(path, component)
            }
        }
    } 
}