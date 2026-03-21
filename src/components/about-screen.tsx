import { useNavigate } from "@tanstack/react-router"
import { useKeyboard } from "../hooks/use-keyboard"
import { PageLayout } from "./page-layout"

export function AboutScreen() {
	const navigate = useNavigate()

	useKeyboard([
		{
			key: "Escape",
			action: () => navigate({ to: "/" }),
		},
	])

	return (
		<PageLayout backHint>
			<h1 className="mb-8 font-michroma text-[2rem] tracking-wider text-mw2-highlight">
				ABOUT
			</h1>

			<div className="flex max-w-xl flex-col gap-6 font-barlow text-lg leading-relaxed tracking-wide text-mw2-text">
				<p>
					Hey, I&apos;m <span className="font-semibold text-mw2-player-name">Davide</span> — a
					developer who builds things for fun and for real.
				</p>
				<p>
					This site is a replica of the MW2 lobby UI, built as a personal hub. If you grew up
					staring at this screen waiting for a match, you know the vibe.
				</p>
				<p className="text-mw2-text-dim">
					Built with React, TypeScript, Tailwind, and too much nostalgia.
				</p>
			</div>
		</PageLayout>
	)
}
