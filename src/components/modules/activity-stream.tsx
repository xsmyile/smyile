import { Link } from "@tanstack/react-router"
import {
	formatEventDescription,
	formatRelativeTime,
	type GitHubEvent,
	getEventColor,
} from "../../lib/github-api"
import { ModulePanel } from "../module-panel"

type Props = {
	events: GitHubEvent[]
	loading: boolean
	delay?: number
}

export function ActivityStream({ events, loading, delay = 0 }: Props) {
	const status = loading ? "LOADING" : events.length > 0 ? "SYNCED" : "IDLE"
	const displayed = events.slice(0, 8)

	return (
		<ModulePanel title="ACTIVITY_STREAM" status={status} delay={delay}>
			<div className="flex flex-col gap-1">
				{displayed.length === 0 && !loading && (
					<span className="font-mono text-[0.8rem] text-sys-text-dim">no recent events</span>
				)}
				{loading &&
					displayed.length === 0 &&
					Array.from({ length: 4 }).map((_, i) => (
						<div
							// biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
							key={i}
							className="h-3 w-full animate-pulse rounded bg-sys-border/50"
						/>
					))}
				{displayed.map((event) => (
					<div key={event.id} className="flex flex-col gap-0.5 border-b border-sys-border/30 pb-1">
						<span
							className="truncate font-mono text-[0.8rem] leading-tight"
							style={{ color: getEventColor(event.type) }}
						>
							{formatEventDescription(event)}
						</span>
						<span className="font-mono text-[0.75rem] text-sys-text-dim">
							{formatRelativeTime(event.created_at)}
						</span>
					</div>
				))}
				{events.length > 8 && (
					<Link
						to="/activity"
						className="mt-1 font-mono text-[0.8rem] tracking-wider text-sys-accent transition-colors hover:text-sys-text"
					>
						view all →
					</Link>
				)}
			</div>
		</ModulePanel>
	)
}
