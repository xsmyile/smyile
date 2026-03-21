export function SmokeBackground() {
	return (
		<div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
			<div className="absolute inset-0 bg-gradient-to-b from-[#4a4a4a] via-[#3a3a3a] to-[#1a1a1a]" />

			<div
				className="absolute inset-[-20%] opacity-30"
				style={{
					background:
						"radial-gradient(ellipse 80% 60% at 30% 40%, rgba(180,170,150,0.4), transparent)",
					animation: "smoke-drift 12s ease-in-out infinite",
				}}
			/>
			<div
				className="absolute inset-[-20%] opacity-20"
				style={{
					background:
						"radial-gradient(ellipse 70% 50% at 70% 60%, rgba(160,155,140,0.3), transparent)",
					animation: "smoke-drift-alt 15s ease-in-out infinite",
				}}
			/>
			<div
				className="absolute inset-[-20%] opacity-25"
				style={{
					background:
						"radial-gradient(ellipse 90% 70% at 50% 30%, rgba(140,135,120,0.35), transparent)",
					animation: "smoke-drift 18s ease-in-out infinite reverse",
				}}
			/>

			{/* Amber/golden haze at the bottom — MW2 signature look */}
			<div
				className="absolute inset-[-20%] opacity-40"
				style={{
					background:
						"radial-gradient(ellipse 120% 50% at 40% 95%, rgba(180,140,50,0.5), transparent 70%)",
					animation: "smoke-drift 14s ease-in-out infinite",
				}}
			/>
			<div
				className="absolute inset-[-20%] opacity-30"
				style={{
					background:
						"radial-gradient(ellipse 100% 40% at 60% 100%, rgba(200,160,60,0.4), transparent 60%)",
					animation: "smoke-drift-alt 18s ease-in-out infinite",
				}}
			/>
			<div
				className="absolute inset-[-20%] opacity-20"
				style={{
					background:
						"radial-gradient(ellipse 80% 35% at 25% 90%, rgba(160,120,40,0.45), transparent 65%)",
					animation: "smoke-drift 20s ease-in-out infinite reverse",
				}}
			/>

			<div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/15 to-transparent" />
			<div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
		</div>
	)
}
