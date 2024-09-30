import { join } from "jsr:@std/path/join";
import {DependencyGraph} from './dependencyGraph.ts'

export class DependencyResolver {
    files: string[] = []
    dependencyGraph: DependencyGraph = new DependencyGraph()

    resolve() {
        this.fetchFiles('src')
        this.constructDependencyGraph()
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

        this.files = this.files.filter(filename => filename.match(/.neith$/) ? true : false)
    }

    private constructDependencyGraph() {
        this.dependencyGraph = new DependencyGraph(this.files)
        
        for(const file of this.files) {
            const content = Deno.readTextFileSync(file)
            content.split(/\n/)
                .filter(line => line.match(/^@import/) ? true : false)
                .map(line => line.match(/@import\('([^']+)'\)/)?.[1])
                .forEach(dep => this.dependencyGraph.import(join(file,'..' ,dep ?? ''), file))
        }

        this.dependencyGraph.sort()
    }
}