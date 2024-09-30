import * as graphlib from 'npm:graphlib'

export interface Import {
    path: string,
    alias: string
}

export class DependencyGraph {
    graph: graphlib.Graph

    constructor(filenames?: string[] | undefined) {
        this.graph = new graphlib.Graph()

        if(filenames) {
            filenames.forEach(filename => {
                this.graph.setNode(filename)
            })
        }
    }

    import(from: string, to: string) {
        this.graph.setEdge(from, to)
        if(!graphlib.alg.isAcyclic(this.graph)) {
            throw new Error("DependencyError: Circular dependencies not possible!")
        }
    }

    sort() {
        return graphlib.alg.topsort(this.graph)
    }
}