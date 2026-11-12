import { createRootRoute, createRoute } from "@tanstack/react-router"
import { HomePage } from "../components/home-page"

const rootRoute = createRootRoute()

const indexRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/",
	component: HomePage,
})

export const routeTree = rootRoute.addChildren([indexRoute])
