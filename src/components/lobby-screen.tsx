import { useNavigate } from "@tanstack/react-router"
import { useCallback, useState } from "react"
import { useKeyboard } from "../hooks/use-keyboard"
import { MENU_ITEMS, SITE_VERSION, STEAM_PROFILE_URL } from "../lib/menu-items"
import { Footer } from "./footer"
import { MainMenu } from "./main-menu"
import { PartyPanel } from "./party-panel"

export function LobbyScreen() {
	const navigate = useNavigate()
	const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null)

	const handleMenuClick = useCallback(
		(item: (typeof MENU_ITEMS)[number]) => {
			switch (item.action.type) {
				case "link":
					window.open(item.action.url, "_blank", "noopener")
					break
				case "route":
					navigate({ to: item.action.path })
					break
				case "submenu":
					setActiveSubmenu(activeSubmenu === item.label ? null : item.label)
					break
			}
		},
		[navigate, activeSubmenu],
	)

	useKeyboard([
		{
			key: "Escape",
			action: () => setActiveSubmenu(null),
		},
		{
			key: "F1",
			action: () => window.open(STEAM_PROFILE_URL, "_blank", "noopener"),
		},
	])

	return (
		<div className="relative flex h-full w-full justify-between">
			{/* Left column */}
			<div className="flex w-[38%] flex-col justify-between pb-12 pt-[5%] pl-[8%]">
				<div>
					<h1 className="mb-3 font-michroma text-[2.5rem] font-normal tracking-wider text-mw2-highlight drop-shadow-lg">
						Smyile
					</h1>

					<MainMenu
						items={MENU_ITEMS}
						activeSubmenu={activeSubmenu}
						onItemClick={handleMenuClick}
					/>

					<p className="mt-10 font-barlow text-base tracking-wide text-mw2-text-dim">
						Your NAT Type: <span className="font-semibold text-mw2-text">Open</span>
					</p>
				</div>

				<Footer />
			</div>

			{/* Right column — fixed width, right-aligned */}
			<div className="flex w-[30%] flex-col pt-[5%] pr-[3%]">
				<PartyPanel />
			</div>

			{/* Version tag — bottom-right */}
			<div className="absolute right-[3%] bottom-4 font-barlow text-xs tracking-wider text-mw2-text-dim">
				{SITE_VERSION}
			</div>
		</div>
	)
}
