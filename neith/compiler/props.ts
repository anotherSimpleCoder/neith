import {NeithElement, NeithProp} from '../index.ts'
import {NeithJSCompiler} from './js.ts'
import hash from "https://deno.land/x/object_hash@2.0.3.1/mod.ts";

type propsObject = {
    handler: (element: NeithElement, compiler: NeithJSCompiler) => void
}

const buttonProps: Map<string, propsObject> = new Map([
    ['on:click', {handler: (element: NeithElement, compiler: NeithJSCompiler)=>{
        const id = hash(element)
        element.props.push({name: 'id', value: id})
        const propValue = element.props.filter(prop => prop.name === 'on:click')[0].value
        compiler.addEventListener(id, 'click', propValue)

        element.props = element.props.filter(prop => prop.name !== 'on:click')
    }}]
])

const inputProps: Map<string, propsObject> = new Map([
    ['bind:value', {handler: (element: NeithElement, compiler: NeithJSCompiler)=>{
        const id = hash(element)
        element.props.push({name: 'id', value: id})
        const varname = element.props.filter(prop => prop.name === 'bind:value')[0].value
        compiler.addEventListener(id, 'input', `(event)=>{${varname}=event.target.value;}`)

        element.props = element.props.filter(prop => prop.name !== 'bind:value')
    }}]
])

const neithProps = new Map([
    ['input', inputProps],
    ['button', buttonProps]
])

export function isNeithProp(element: NeithElement, prop: NeithProp): boolean {
    const props = neithProps.get(element.tag)
    if(!props) {
        return false
    }

    return props.has(prop.name)
}

export function handleNeithProp(element: NeithElement, prop: NeithProp, compiler: NeithJSCompiler) {
    const propsOfElement = neithProps.get(element.tag)
    if(!propsOfElement) {
        throw Error("SyntaxError: Invalid Neith Element!")
    }

    const propsObj = propsOfElement.get(prop.name)
    if(!propsObj) {
        throw Error("SyntaxError: Invalid Neith Prop!")
    }

    propsObj.handler(element, compiler)
}