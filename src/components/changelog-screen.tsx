import { useNavigate } from "@tanstack/react-router"
import { useKeyboard } from "../hooks/use-keyboard"
import { PageLayout } from "./page-layout"

const CHANGELOG = [
	{
		version: "0.4.0",
		changes: [
			"Add favicon and icons from custom logo",
			"Add SEO meta tags, Open Graph, and Twitter cards",
			"Add web app manifest",
			"Add website link to menu",
		],
	},
	{
		version: "0.3.0",
		changes: [
			"Add changelog screen and menu entry",
			"Highlight visitor in party panel instead of host",
			"Flatten player bar style",
			"Set visitor level to 1",
		],
	},
	{
		version: "0.2.0",
		changes: [
			"Add About and Barracks screens",
			"Add main menu with navigation",
			"Add custom domain support",
			"Set up GitHub Pages deployment",
		],
	},
	{
		version: "0.1.0",
		changes: [
			"Initial MW2 lobby UI replica",
			"Party panel with visitor detection",
			"Rank icons and prestige system",
		],
	},
]

export function ChangelogScreen() {
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
				CHANGELOG
			</h1>

			<div className="flex flex-col gap-6">
				{CHANGELOG.map((release) => (
					<div key={release.version} className="flex flex-col gap-2">
						<span className="font-michroma text-lg tracking-[0.2em] text-mw2-highlight">
							v{release.version}
						</span>
						<ul className="flex flex-col gap-1">
							{release.changes.map((change) => (
								<li key={change} className="font-barlow text-sm tracking-wide text-mw2-text-dim">
									— {change}
								</li>
							))}
						</ul>
					</div>
				))}
			</div>
		</PageLayout>
	)
}
