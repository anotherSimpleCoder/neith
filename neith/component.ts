export interface INeithComponent {
    name: string,
    templatePath: string,
    stylePath: string
}

export type NeithComponent = new () => INeithComponent