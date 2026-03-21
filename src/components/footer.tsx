import { STEAM_PROFILE_URL } from "../lib/menu-items"

export function Footer() {
	return (
		<div className="flex flex-col gap-1.5">
			<a
				href={STEAM_PROFILE_URL}
				target="_blank"
				rel="noopener noreferrer"
				className="font-barlow text-base tracking-wider text-mw2-text-dim transition-colors hover:text-mw2-highlight"
			>
				GAME SUMMARY - <span className="font-bold text-mw2-hotkey">F1</span>
			</a>
			<p className="font-barlow text-base tracking-wider text-mw2-text-dim">
				BACK - <span className="font-bold text-mw2-hotkey">ESC</span>
			</p>
		</div>
	)
}
