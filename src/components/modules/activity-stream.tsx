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

function EventTypeBar({ events }: { events: GitHubEvent[] }) {
	if (events.length === 0) return null

	const counts = new Map<string, number>()
	for (const e of events) {
		counts.set(e.type, (counts.get(e.type) ?? 0) + 1)
	}

	const total = events.length
	const segments = [...counts.entries()].sort((a, b) => b[1] - a[1])

	return (
		<div className="flex h-1.5 w-full overflow-hidden rounded-full">
			{segments.map(([type, count]) => (
				<div
					key={type}
					style={{
						width: `${(count / total) * 100}%`,
						backgroundColor: getEventColor(type),
						opacity: 0.7,
					}}
				/>
			))}
		</div>
	)
}

export function ActivityStream({ events, loading, delay = 0 }: Props) {
	const status = loading ? "LOADING" : events.length > 0 ? "SYNCED" : "IDLE"
	const displayed = events.slice(0, 8)

	return (
		<ModulePanel title="ACTIVITY_STREAM" status={status} delay={delay}>
			<div className="flex flex-col gap-1">
				{events.length > 0 && (
					<div className="mb-1">
						<EventTypeBar events={events} />
					</div>
				)}
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
			</div>
		</ModulePanel>
	)
}
