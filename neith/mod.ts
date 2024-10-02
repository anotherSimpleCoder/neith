import { NeithServer } from "./server/server.ts"
import { Route, NeithRouter } from "./router/router.ts"
import {Import, DependencyGraph} from "./ioc/dependencyGraph.ts"
import { NeithIOC } from "./ioc/ioc.ts"
import { NeithDOM } from "./dom/dom.ts"
import { NeithCompiler } from "./compiler/compiler.ts"
import { NeithComponent } from "./compiler/component.ts"
import { NeithJSCompiler } from "./compiler/js.ts"
import { isNeithProp, handleNeithProp } from "./compiler/props.ts"

interface NeithProp {
    name: string, 
    value: string
}

interface NeithElement {
    tag: string,
    props: NeithProp[],
    text: string,
    children: NeithElement[],
}


export type {
    NeithProp,
    NeithElement,
    Route,
    Import
}
  
export {
    NeithServer,
    NeithRouter,
    DependencyGraph,
    NeithIOC,
    NeithDOM,
    NeithCompiler,
    NeithComponent,
    NeithJSCompiler,
    isNeithProp,
    handleNeithProp
}