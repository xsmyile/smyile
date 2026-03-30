import { createRootRoute, createRoute } from "@tanstack/react-router"
import { DashboardLayout } from "../components/dashboard-layout"

const rootRoute = createRootRoute()

const indexRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/",
	component: DashboardLayout,
})

export const routeTree = rootRoute.addChildren([indexRoute])
