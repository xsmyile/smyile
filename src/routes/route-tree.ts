import { createRootRoute, createRoute } from "@tanstack/react-router"
import { LobbyScreen } from "../components/lobby-screen"
import { MW2Layout } from "../components/mw2-layout"

const rootRoute = createRootRoute({
	component: MW2Layout,
})

const indexRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/",
	component: LobbyScreen,
})

export const routeTree = rootRoute.addChildren([indexRoute])
