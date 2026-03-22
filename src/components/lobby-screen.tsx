import { useNavigate } from "@tanstack/react-router"
import { useCallback } from "react"
import { useKeyboard } from "../hooks/use-keyboard"
import { MENU_ITEMS, SITE_VERSION, STEAM_PROFILE_URL } from "../lib/menu-items"
import { Footer } from "./footer"
import { MainMenu } from "./main-menu"
import { PageLayout } from "./page-layout"
import { PartyPanel } from "./party-panel"

export function LobbyScreen() {
	const navigate = useNavigate()

	const handleMenuClick = useCallback(
		(item: (typeof MENU_ITEMS)[number]) => {
			switch (item.action.type) {
				case "link":
					window.open(item.action.url, "_blank", "noopener")
					break
				case "route":
					navigate({ to: item.action.path })
					break
			}
		},
		[navigate],
	)

	useKeyboard([
		{
			key: "F1",
			action: () => window.open(STEAM_PROFILE_URL, "_blank", "noopener"),
		},
	])

	return (
		<PageLayout showVersion={false}>
			<div className="flex flex-1 justify-between">
				<div className="flex flex-col items-end justify-between">
					<div className="flex w-full flex-col items-end">
						<h1 className="mb-3 font-michroma text-[2.5rem] font-normal tracking-wider text-mw2-highlight drop-shadow-lg">
							Smyile
						</h1>

						<MainMenu items={MENU_ITEMS} onItemClick={handleMenuClick} />

						<p className="mt-[6vh] font-barlow text-base tracking-wide text-mw2-text-dim">
							Your NAT Type: <span className="font-semibold text-mw2-text">Open</span>
						</p>
					</div>

					<Footer />
				</div>

				<div className="flex w-[30%] flex-col justify-between">
					<PartyPanel />
					<span className="text-right font-barlow text-xs tracking-wider text-mw2-text-dim">
						{SITE_VERSION}
					</span>
				</div>
			</div>
		</PageLayout>
	)
}
