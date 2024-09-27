import { join } from "jsr:@std/path/join";

export class DependencyResolver {
    files: string[] = []

    resolve() {
        this.fetchFiles('src')
    }

    private fetchFiles(directory: string) {
        const dir = Deno.readDirSync(directory)
        for(const entry of dir) {
            if(entry.isFile) {[
                this.files.push(entry.name)
            ]} else if (entry.isDirectory){
                this.fetchFiles(join(directory, entry.name))
            }
        }

        this.files = this.files.filter(filename => filename.match(/.neith$/) ? true : false)
    }

    private constructDependencyGraph() {
        
    }
}