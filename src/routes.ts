import {Route} from '../neith/router.ts'
import { Home } from "./home/home.ts";

export const routes: Route[] = [
    {
        path: '/',
        component: Home
    }
]