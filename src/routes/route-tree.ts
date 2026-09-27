import { createRootRoute, createRoute } from "@tanstack/react-router"
import { SignalPage } from "../components/signal-page"

const rootRoute = createRootRoute()

const indexRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/",
	component: SignalPage,
})

export const routeTree = rootRoute.addChildren([indexRoute])
