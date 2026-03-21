import { createRootRoute, createRoute } from "@tanstack/react-router"
import { AboutScreen } from "../components/about-screen"
import { BarracksScreen } from "../components/barracks-screen"
import { ChangelogScreen } from "../components/changelog-screen"
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

const aboutRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/about",
	component: AboutScreen,
})

const barracksRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/barracks",
	component: BarracksScreen,
})

const changelogRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/changelog",
	component: ChangelogScreen,
})

export const routeTree = rootRoute.addChildren([indexRoute, aboutRoute, barracksRoute, changelogRoute])
