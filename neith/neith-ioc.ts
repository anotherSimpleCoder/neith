import {NeithElement} from './neith.ts'

export function Service(constr: any) {
    const instance = new constr()
    NeithIOC.injetable(constr.name, instance)
}

export class NeithIOC {
    static container: Map<string, any> = new Map()

    static injetable(alias: string, node: NeithElement | any) {
        if(!this.container.has(alias)) {
            this.container.set(alias, node)
        }
    }

    static inject(alias: string) {
        const node = this.container.get(alias)
        if(!node) {
            throw Error(`InjectionError: Dependency '${alias}' not found!`)
        }

        return node
    }
}