import { NeithElement } from "../index.ts";

export abstract class NeithComponent {
    constructor(
        public name: string,
        protected code: string,
    ) {}

    get template() {
        return this.code;
    }

    abstract render(): Promise<NeithElement>
}