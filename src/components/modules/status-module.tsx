import { useUptime } from "../../hooks/use-uptime"
import { IDENTITY, STATUS } from "../../lib/constants"
import { formatRelativeTime, type GitHubRelease } from "../../lib/github-api"
import { ModulePanel } from "../module-panel"

type Props = {
	latestRelease: GitHubRelease | null
	cached: boolean
	delay?: number
}

export function StatusModule({ latestRelease, cached, delay = 0 }: Props) {
	const uptime = useUptime()

	const rows = [
		{ label: "STATUS", value: "ONLINE", color: "text-sys-green" },
		{ label: "PROJECT", value: STATUS.currentProject, color: "text-sys-text" },
		{
			label: "LAST DEPLOY",
			value: latestRelease
				? `${latestRelease.tag_name} • ${formatRelativeTime(latestRelease.published_at)}`
				: "—",
			color: "text-sys-text",
		},
		{ label: "UPTIME", value: uptime, color: "text-sys-cyan" },
		{ label: "TIMEZONE", value: IDENTITY.timezone, color: "text-sys-text" },
	]

	return (
		<ModulePanel title="SYSTEM_STATUS" status={cached ? "CACHED" : "SYNCED"} delay={delay}>
			<div className="flex flex-col gap-1.5">
				{rows.map((row) => (
					<div key={row.label} className="flex items-center justify-between">
						<span className="font-mono text-[0.75rem] tracking-wider text-sys-text-dim">
							{row.label}:
						</span>
						<span className={`font-mono text-[0.75rem] tracking-wider ${row.color}`}>
							{row.value}
						</span>
					</div>
				))}
			</div>
		</ModulePanel>
	)
}
