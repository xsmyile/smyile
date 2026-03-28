export function CyberBackground() {
	return (
		<div className="pointer-events-none fixed inset-0 z-0">
			<div className="absolute inset-0 bg-sys-bg" />
			<div className="flicker-grid absolute inset-0" />
		</div>
	)
}
