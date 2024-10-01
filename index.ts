import { NeithServer } from "./neith/server/server.ts"
import { Route, NeithRouter } from "./neith/router/router.ts"
import {Import, DependencyGraph} from "./neith/ioc/dependencyGraph.ts"
import { NeithIOC } from "./neith/ioc/ioc.ts"
import { NeithDOM } from "./neith/dom/dom.ts"
import { NeithCompiler } from "./neith/compiler/compiler.ts"
import { NeithComponent } from "./neith/compiler/component.ts"
import { NeithJSCompiler } from "./neith/compiler/js.ts"
import { isNeithProp, handleNeithProp } from "./neith/compiler/props.ts"

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