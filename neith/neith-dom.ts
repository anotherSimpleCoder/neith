import {NeithElement} from './neith.ts'
import {JSDOM} from 'npm:jsdom'

class NeithDOM {
    private static isHTMLTag(tag: string): boolean {
        const dom = new JSDOM()
        const element = dom.window.document.createElement(tag)
        return !(element instanceof dom.window.HTMLUnknownElement)
    }

    static toHTML(element: NeithElement): string {
        //Check for script section first for any preprocessor statements

        return ''
    }
}