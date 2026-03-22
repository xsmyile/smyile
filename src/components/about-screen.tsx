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
			<h1 className="mb-8 font-michroma text-[2rem] tracking-wider text-mw2-highlight">ABOUT</h1>

			<p className="max-w-xl font-barlow text-lg leading-relaxed tracking-wide text-mw2-text">
				MW2 lobby replica turned personal hub. If you know, you know.
			</p>
		</PageLayout>
	)
}
