export class NeithIOC {
    constructor() {
        if(NeithIOC.instance) {
            throw new Error("NeithIOC must be used statically!")
        }
    } 
    static #toImport = []
    static container = new Map()

    static import(service) {
        if(!this.container.has(service.name)) {
            this.container.set(service.name, new service())
        }
    }

    static inject(serviceName) {
        const serviceInstance = this.container.get(serviceName)
        if(!serviceInstance) {
            throw new Error(`InjectionError: ${serviceName} not found!`)
        }

        return serviceInstance
    }
}