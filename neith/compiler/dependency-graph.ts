export class DependencyGraph {
    adjacencyList: Map<string, string[]> = new Map()

    import(from: string, to: string) {
        if(this.adjacencyList.has(from)) {
            if(this.adjacencyList.has(to) && this.adjacencyList.get(to)?.includes(from)) {
                throw new Error("DependencyError: Circular dependencies not possible!")
            }

            this.adjacencyList.get(from)?.push(to)
            return
        }

        if(!this.adjacencyList.has(to)) {
            this.adjacencyList.set(to, [])
        }
        this.adjacencyList.set(from, [to])
    }

    sort() {
        const order = Array.from(this.adjacencyList.keys())
        console.log(order)
    }

    private dfs() {

    }
}