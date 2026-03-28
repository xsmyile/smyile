export function CyberBackground() {
	return (
		<div className="pointer-events-none fixed inset-0 z-0">
			<div className="absolute inset-0 bg-sys-bg" />
			<div className="dot-grid absolute inset-0" />
			<div
				className="absolute inset-0"
				style={{
					background:
						"radial-gradient(ellipse 60% 40% at 50% 50%, rgba(137,207,240,0.03), transparent)",
					animation: "bg-pulse 8s ease-in-out infinite",
				}}
			/>
		</div>
	)
}
