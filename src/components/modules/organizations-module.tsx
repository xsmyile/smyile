import { ORGANIZATIONS } from "../../lib/constants"
import { ModulePanel } from "../module-panel"

type Props = {
	delay?: number
}

const PLATFORM_HOSTS: Record<(typeof ORGANIZATIONS)[number]["platform"], string> = {
	github: "github.com",
	huggingface: "huggingface.co",
}

function OrgLink({ org }: { org: (typeof ORGANIZATIONS)[number] }) {
	const host = PLATFORM_HOSTS[org.platform]
	return (
		<a
			href={org.url}
			target="_blank"
			rel="noopener noreferrer"
			className="group flex items-center justify-between border-b border-sys-border/50 py-1.5 transition-colors"
		>
			<span className="font-mono text-xs tracking-[0.15em] text-sys-text transition-colors group-hover:text-sys-accent">
				{host}/{org.name}
			</span>
			<span className="font-mono text-[0.8rem] tracking-wider text-sys-text-dim transition-colors group-hover:text-sys-accent">
				→
			</span>
		</a>
	)
}

export function OrganizationsModule({ delay = 0 }: Props) {
	return (
		<ModulePanel title="ORGANIZATIONS" status="ONLINE" delay={delay}>
			<div className="flex flex-col text-left">
				{ORGANIZATIONS.filter((org) => org.showcase).map((org) => (
					<OrgLink key={org.url} org={org} />
				))}
			</div>
		</ModulePanel>
	)
}
