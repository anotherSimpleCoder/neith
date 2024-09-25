import {NeithElement} from './neith.ts'

export class NeithIOC {
    private container: Map<string, any> = new Map()

    injetable(alias: string, node: NeithElement) {
        if(!this.container.has(alias)) {
            this.container.set(alias, node)
        }
    }

    inject(alias: string) {
        const node = this.container.get(alias)
        if(!node) {
            throw Error(`InjectionError: Dependency '${alias}' not found!`)
        }

        return node
    }
}