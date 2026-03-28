import { useState } from "react"
import { SPECIALIZATIONS } from "../../lib/constants"
import { ModulePanel } from "../module-panel"

type Props = {
	delay?: number
}

export function SpecsModule({ delay = 0 }: Props) {
	const [hovered, setHovered] = useState<string | null>(null)

	return (
		<ModulePanel title="SPECIALIZATIONS" status="ONLINE" delay={delay}>
			<ul className="flex flex-col gap-0.5">
				{SPECIALIZATIONS.map((spec) => (
					<li
						key={spec.name}
						className="flex cursor-default items-center gap-2 py-1 transition-colors"
						onMouseEnter={() => setHovered(spec.name)}
						onMouseLeave={() => setHovered(null)}
					>
						<div
							className="h-full w-0.5 self-stretch transition-all"
							style={{
								backgroundColor: hovered === spec.name ? spec.color : `${spec.color}40`,
								boxShadow: hovered === spec.name ? `0 0 6px ${spec.color}40` : "none",
							}}
						/>
						<span
							className="font-mono text-xs tracking-[0.1em] transition-colors"
							style={{
								color: hovered === spec.name ? spec.color : "var(--color-sys-text)",
							}}
						>
							{spec.name.toUpperCase()}
						</span>
					</li>
				))}
			</ul>
		</ModulePanel>
	)
}
