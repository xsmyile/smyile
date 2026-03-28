import { createRootRoute, createRoute } from "@tanstack/react-router"
import { ActivityScreen } from "../components/activity-screen"
import { DashboardLayout } from "../components/dashboard-layout"

const rootRoute = createRootRoute()

const indexRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/",
	component: DashboardLayout,
})

const activityRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/activity",
	component: ActivityScreen,
})

export const routeTree = rootRoute.addChildren([indexRoute, activityRoute])
