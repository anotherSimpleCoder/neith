import {NeithServer} from '../neith/server.ts'
import {NeithRouter} from '../neith/router.ts'
import {routes} from './routes.ts'

const server = new NeithServer(new NeithRouter(routes));
server.serve(3000)