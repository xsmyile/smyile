import { STEAM_PROFILE_URL } from "../lib/menu-items"

export function Footer() {
	return (
		<a
			href={STEAM_PROFILE_URL}
			target="_blank"
			rel="noopener noreferrer"
			className="font-barlow text-base tracking-wider text-mw2-text-dim transition-colors hover:text-mw2-highlight"
		>
			GAME SUMMARY - <span className="font-bold text-mw2-hotkey">F1</span>
		</a>
	)
}
