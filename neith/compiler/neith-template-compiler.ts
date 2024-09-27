import { join } from "jsr:@std/path/join";
import { DependencyGraph } from "./dependency-graph.ts";

export class NeithTemplateCompiler {
    static dependencyGraph: DependencyGraph = new DependencyGraph()

    static compile(path: string) {
        const content = this.openFile(path)
        const [directives, template] = this.extractDirectives(content)
        this.dependencyScan(path, directives)
    }

    static openFile(path: string) {
        path = join(Deno.cwd(), path)
        return Deno.readTextFileSync(path)
    }

    static extractDirectives(code: string): [string[], string] {
        const directives = code.split('\n')
            .filter(line => line[0] === '@')
            .map(line => line.replace('\r', ''))

        const templateLines = code.split('\n')
            .filter(line => line[0] !== '@')

        let template = templateLines.join('\n')
        template = '<>\n' + template
        template += '\n</>'

        return [
            directives,
            template
        ]
    } 

    static dependencyScan(path: string, directives: string[]) {
        for(const directive of directives) {
            const matches = directive.match(/@import\(['"]([^'"]+)['"]\)/)
            if(matches) {
                const importPath = join(path, '..', matches[1])
                this.dependencyGraph.import(importPath, path)
            }
        }
    }
}