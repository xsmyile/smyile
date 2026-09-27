import { useEffect, useState } from "react"
import { useBootSequence } from "../hooks/use-boot-sequence"
import { useGitHub } from "../hooks/use-github"
import { BootSequence } from "./boot-sequence"
import { CyberBackground } from "./cyber-background"
import { SignalHero } from "./signal-hero"
import { SignalSections } from "./signal-sections"
import { type PetOrigin, SissyPet } from "./sissy-pet"
import { TickerStrip } from "./ticker-strip"

const PET_OFFSET_X_PX = 56
const PET_OFFSET_Y_PX = 92

export function SignalPage() {
	const { phase, visibleLogs, skip } = useBootSequence()
	const github = useGitHub()
	const [petOrigin, setPetOrigin] = useState<PetOrigin | null>(null)

	useEffect(() => {
		document.body.style.overflow = phase === "booting" ? "hidden" : ""
		return () => {
			document.body.style.overflow = ""
		}
	}, [phase])

	function summonSissy(terminal: DOMRect) {
		setPetOrigin({ x: terminal.right - PET_OFFSET_X_PX, y: terminal.top - PET_OFFSET_Y_PX })
	}

	return (
		<>
			<BootSequence phase={phase} logs={visibleLogs} onSkip={skip} />

			{phase !== "ready" && <div className="fixed inset-0 bg-sys-bg" />}

			{phase === "ready" && (
				<div className="scanlines crt-sweep relative min-h-screen w-full">
					<CyberBackground />
					<TickerStrip events={github.events} />

					<main className="relative isolate mx-auto w-full max-w-[1440px] pt-8">
						<SignalHero github={github} sissyOut={petOrigin !== null} onSummonSissy={summonSissy} />
						<SignalSections />
					</main>

					{petOrigin && <SissyPet origin={petOrigin} />}
				</div>
			)}
		</>
	)
}
