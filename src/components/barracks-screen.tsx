import { useNavigate } from "@tanstack/react-router"
import { useKeyboard } from "../hooks/use-keyboard"
import { PageLayout } from "./page-layout"

const PROJECTS = [
	{
		name: "OVERBOT",
		url: "https://overbot.net",
		description: "Overwatch stats and tracking bot",
	},
	{
		name: "MIZU",
		url: "https://github.com/mizu-systems/mizu-web",
		description: "Water tracking app",
	},
	{
		name: "SMYILE",
		url: "https://github.com/davidetacchini/smyile",
		description: "This site — MW2 lobby UI replica",
	},
]

export function BarracksScreen() {
	const navigate = useNavigate()

	useKeyboard([
		{
			key: "Escape",
			action: () => navigate({ to: "/" }),
		},
	])

	return (
		<PageLayout backHint>
			<h1 className="mb-8 font-michroma text-[2rem] tracking-wider text-mw2-highlight">BARRACKS</h1>

			<div className="flex flex-col gap-4">
				{PROJECTS.map((project) => (
					<a
						key={project.name}
						href={project.url}
						target="_blank"
						rel="noopener noreferrer"
						className="group flex items-center justify-between border-b border-mw2-separator/30 py-3 transition-colors"
					>
						<div className="flex flex-col gap-1">
							<span className="font-michroma text-lg tracking-[0.2em] text-mw2-text transition-colors group-hover:text-mw2-highlight">
								{project.name}
							</span>
							<span className="font-barlow text-sm tracking-wide text-mw2-text-dim">
								{project.description}
							</span>
						</div>
						<span className="font-barlow text-sm tracking-wider text-mw2-text-dim transition-colors group-hover:text-mw2-highlight">
							DEPLOY →
						</span>
					</a>
				))}
			</div>
		</PageLayout>
	)
}
