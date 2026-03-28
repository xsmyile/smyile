import { SOCIAL_LINKS } from "../../lib/constants"
import { ModulePanel } from "../module-panel"

type Props = {
	delay?: number
}

export function SocialModule({ delay = 0 }: Props) {
	return (
		<ModulePanel title="NETWORKS" status="ONLINE" delay={delay}>
			<div className="flex flex-col gap-1">
				{SOCIAL_LINKS.map((link) => (
					<a
						key={link.label}
						href={link.url}
						target="_blank"
						rel="noopener noreferrer"
						className="group flex items-center justify-between py-0.5 transition-colors"
					>
						<span className="font-mono text-[0.75rem] tracking-wider text-sys-text transition-colors group-hover:text-sys-accent">
							{link.label.toUpperCase()}
						</span>
						<span className="font-mono text-[0.75rem] tracking-wider text-sys-text-dim transition-colors group-hover:text-sys-accent">
							→
						</span>
					</a>
				))}
			</div>
		</ModulePanel>
	)
}
