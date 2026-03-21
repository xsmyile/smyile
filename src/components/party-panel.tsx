import { AnimatePresence, motion } from "framer-motion"
import { usePageVisibility } from "../hooks/use-page-visibility"
import { getVisitorId, getVisitorLevel } from "../lib/visitor-id"

const SMYILE_LEVEL = 70

export function PartyPanel() {
	const visitorId = getVisitorId()
	const visitorLevel = getVisitorLevel()
	const isVisible = usePageVisibility()

	const playerCount = isVisible ? 2 : 1
	const visitorName = `[YOU] ${visitorId}`

	return (
		<div className="flex w-full flex-col gap-1.5">
			<p className="text-right font-barlow text-base tracking-wide text-mw2-text-dim">
				{playerCount} player(s) in{" "}
				<span className="font-semibold text-mw2-highlight">Smyile</span>&apos;s party.
			</p>

			<PlayerBar name="Smyile" level={SMYILE_LEVEL} />

			<AnimatePresence>
				{isVisible && (
					<motion.div
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: "auto", opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						transition={{ duration: 0.3, ease: "easeInOut" }}
						className="overflow-hidden"
					>
						<PlayerBar name={visitorName} level={visitorLevel} highlight />
					</motion.div>
				)}
			</AnimatePresence>

			<p className="text-right font-barlow text-xs tracking-wider text-mw2-text-dim">
				VID: {visitorId}
			</p>
		</div>
	)
}

type PlayerBarProps = {
	name: string
	level: number
	highlight?: boolean
}

function PlayerBar({ name, level, highlight }: PlayerBarProps) {
	return (
		<div className="flex w-full items-center justify-between bg-mw2-card-bg/80 px-4 py-2">
			<span
				className={`font-michroma text-base tracking-wide ${highlight ? "text-mw2-player-name" : "text-mw2-text"}`}
			>
				{name}
			</span>

			<div className="flex items-center gap-2">
				<RankIcon level={level} />
				<span className="font-michroma text-xl font-normal text-mw2-highlight">
					{level}
				</span>
			</div>
		</div>
	)
}

function RankIcon({ level }: { level: number }) {
	if (level >= 55) {
		return (
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
				<path
					d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
					fill="#c9a84c"
					stroke="#8b7532"
					strokeWidth="1"
				/>
			</svg>
		)
	}

	if (level >= 35) {
		return (
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
				<path d="M4 18L12 6L20 18H4Z" fill="#c9a84c" stroke="#8b7532" strokeWidth="1" />
				<path d="M8 18L12 10L16 18H8Z" fill="#a8882e" />
			</svg>
		)
	}

	if (level >= 15) {
		return (
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
				<path d="M6 18L12 8L18 18H6Z" fill="#c9a84c" stroke="#8b7532" strokeWidth="1" />
			</svg>
		)
	}

	const chevronCount = level < 5 ? 1 : level < 10 ? 2 : 3
	return (
		<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
			{Array.from({ length: chevronCount }).map((_, i) => (
				<path
					key={i}
					d={`M6 ${16 - i * 4}L12 ${12 - i * 4}L18 ${16 - i * 4}`}
					stroke="#c9a84c"
					strokeWidth="2"
					fill="none"
				/>
			))}
		</svg>
	)
}
