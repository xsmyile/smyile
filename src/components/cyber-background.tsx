import { FlickeringGrid } from "./flickering-grid"

export function CyberBackground() {
	return (
		<div className="pointer-events-none fixed inset-0 z-0">
			<div className="absolute inset-0 bg-sys-bg" />
			<FlickeringGrid
				className="absolute inset-0 opacity-40"
				squareSize={4}
				gridGap={6}
				flickerChance={0.3}
				color="rgb(137, 207, 240)"
				maxOpacity={0.15}
			/>
		</div>
	)
}
