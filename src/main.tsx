import { createRouter, RouterProvider } from "@tanstack/react-router"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { StaleReloadBoundary } from "./components/stale-reload-boundary"
import "./styles.css"
import { routeTree } from "./routes/route-tree"

const router = createRouter({ routeTree })

declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router
	}
}

// biome-ignore lint/style/noNonNullAssertion: root element guaranteed in index.html
createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<StaleReloadBoundary>
			<RouterProvider router={router} />
		</StaleReloadBoundary>
	</StrictMode>,
)
