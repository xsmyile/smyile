import { Link } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import {
	fetchUserEvents,
	formatEventDescription,
	formatRelativeTime,
	type GitHubEvent,
	getEventColor,
} from "../lib/github-api"
import { CyberBackground } from "./cyber-background"
import { ModulePanel } from "./module-panel"

export function ActivityScreen() {
	const [events, setEvents] = useState<GitHubEvent[]>([])
	const [loading, setLoading] = useState(true)
	const [filter, setFilter] = useState<string | null>(null)

	useEffect(() => {
		async function load() {
			try {
				const p1 = await fetchUserEvents(1)
				const p2 = p1.data.length === 30 ? await fetchUserEvents(2) : { data: [] as GitHubEvent[] }
				setEvents([...p1.data, ...p2.data])
			} catch {
				// fallback handled by cache
			} finally {
				setLoading(false)
			}
		}
		load()
	}, [])

	const eventTypes = [...new Set(events.map((e) => e.type))]
	const filtered = filter ? events.filter((e) => e.type === filter) : events

	return (
		<div className="scanlines relative min-h-screen w-full">
			<CyberBackground />

			<div className="relative z-10 mx-auto max-w-3xl px-4 py-8">
				<div className="mb-4 flex items-center justify-between">
					<Link
						to="/"
						className="font-mono text-xs tracking-wider text-sys-accent transition-colors hover:text-sys-text"
					>
						← DASHBOARD
					</Link>
					<span className="font-mono text-[0.8rem] tracking-wider text-sys-text-dim">
						{filtered.length} events
					</span>
				</div>

				{/* Filter bar */}
				<div className="mb-4 flex flex-wrap gap-1">
					<button
						type="button"
						onClick={() => setFilter(null)}
						className={`border px-2 py-0.5 font-mono text-[0.8rem] tracking-wider transition-colors ${
							filter === null
								? "border-sys-accent bg-sys-accent/10 text-sys-accent"
								: "border-sys-border text-sys-text-dim hover:border-sys-accent/50"
						}`}
					>
						ALL
					</button>
					{eventTypes.map((type) => (
						<button
							key={type}
							type="button"
							onClick={() => setFilter(type === filter ? null : type)}
							className={`border px-2 py-0.5 font-mono text-[0.8rem] tracking-wider transition-colors ${
								filter === type
									? "border-sys-accent bg-sys-accent/10 text-sys-accent"
									: "border-sys-border text-sys-text-dim hover:border-sys-accent/50"
							}`}
						>
							{type.replace("Event", "").toUpperCase()}
						</button>
					))}
				</div>

				<ModulePanel title="ACTIVITY_LOG" status={loading ? "LOADING" : "SYNCED"}>
					<div className="flex flex-col gap-1">
						{loading &&
							Array.from({ length: 10 }).map((_, i) => (
								<div
									// biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
									key={i}
									className="h-4 w-full animate-pulse rounded bg-sys-border/30"
								/>
							))}
						{filtered.map((event) => (
							<div
								key={event.id}
								className="flex flex-col gap-0.5 border-b border-sys-border/30 py-1"
							>
								<div className="flex items-center gap-2">
									<span
										className="font-mono text-[0.8rem]"
										style={{ color: getEventColor(event.type) }}
									>
										{event.type.replace("Event", "").toUpperCase()}
									</span>
									<span className="font-mono text-[0.75rem] text-sys-text-dim">
										{formatRelativeTime(event.created_at)}
									</span>
								</div>
								<span className="font-mono text-xs text-sys-text">
									{formatEventDescription(event)}
								</span>
							</div>
						))}
						{!loading && filtered.length === 0 && (
							<span className="font-mono text-[0.8rem] text-sys-text-dim">
								no events match filter
							</span>
						)}
					</div>
				</ModulePanel>
			</div>
		</div>
	)
}
