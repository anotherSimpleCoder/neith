import {INeithComponent} from '../../neith/component.ts'

export class Home implements INeithComponent {
    name: string = 'home'
    templatePath: string = 'home.neith'
    stylePath: string = 'home.css'
}