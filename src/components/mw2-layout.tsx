import { Outlet } from "@tanstack/react-router"
import { SmokeBackground } from "./smoke-background"

export function MW2Layout() {
	return (
		<div className="relative h-screen w-screen overflow-hidden bg-mw2-bg">
			<SmokeBackground />
			<div className="relative z-10 h-full w-full">
				<Outlet />
			</div>
		</div>
	)
}
