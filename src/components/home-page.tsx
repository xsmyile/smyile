import { useRef, useState } from "react"
import { useGitHub } from "../hooks/use-github"
import { useTerminalSession } from "../hooks/use-terminal-session"
import { IDENTITY } from "../lib/constants"
import { Elsewhere, ProjectList } from "./home-sections"
import { PromptLine } from "./prompt-line"
import { type PetOrigin, SissyPet } from "./sissy-pet"
import { TerminalFullscreen } from "./terminal-fullscreen"
import { TesseractBackdrop } from "./tesseract-backdrop"

const PET_OFFSET_X_PX = 56
const PET_OFFSET_Y_PX = 92
const PET_GAP_PX = 12
const EDGE_MARGIN_PX = 8

export function HomePage() {
	const github = useGitHub()
	const [petOrigin, setPetOrigin] = useState<PetOrigin | null>(null)
	const [fullscreen, setFullscreen] = useState(false)
	const openRef = useRef<HTMLButtonElement>(null)
	const session = useTerminalSession({
		user: github.user,
		totalStars: github.totalStars,
		events: github.events,
		sissyOut: petOrigin !== null,
		onSummonSissy: (anchor) => {
			const above = anchor.top - PET_OFFSET_Y_PX
			const y = above >= EDGE_MARGIN_PX ? above : anchor.bottom + PET_GAP_PX
			setPetOrigin({ x: anchor.right - PET_OFFSET_X_PX, y })
		},
	})

	return (
		<div className="relative">
			<TesseractBackdrop paused={fullscreen} />

			<main className="halo relative flex min-h-svh flex-col justify-between gap-[30vh] p-[clamp(20px,4vw,56px)] text-sm leading-relaxed">
				<div className="flex flex-wrap items-start justify-between gap-6">
					<header data-quiet="">
						<h1 className="font-display text-[clamp(30px,3vw,42px)] leading-none">
							{IDENTITY.name}
						</h1>
						<p className="mt-3.5 text-muted">{IDENTITY.role}</p>
					</header>
					<PromptLine
						session={session}
						openRef={openRef}
						sissyOut={petOrigin !== null}
						onOpen={() => setFullscreen(true)}
					/>
				</div>
				<div className="flex flex-wrap items-end justify-between gap-8">
					<ProjectList />
					<Elsewhere />
				</div>
			</main>

			<TerminalFullscreen
				open={fullscreen}
				onOpenChange={setFullscreen}
				session={session}
				returnFocusRef={openRef}
			/>

			{petOrigin && <SissyPet origin={petOrigin} />}
		</div>
	)
}
