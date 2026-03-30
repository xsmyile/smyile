import { useEffect, useMemo, useRef, useState } from "react"
import type { GitHubEvent, GitHubRepo, GitHubUser } from "../../lib/github-api"
import { ModulePanel } from "../module-panel"

type Props = {
	user: GitHubUser | null
	totalStars: number
	repos: GitHubRepo[]
	events: GitHubEvent[]
	loading: boolean
	delay?: number
}

function AnimatedNumber({ target, duration = 1200 }: { target: number; duration?: number }) {
	const [current, setCurrent] = useState(0)
	const fromRef = useRef(0)

	useEffect(() => {
		if (target === 0) return
		const from = fromRef.current
		const start = performance.now()
		let raf: number

		function step(now: number) {
			const progress = Math.min((now - start) / duration, 1)
			const eased = 1 - (1 - progress) ** 3
			const value = progress >= 1 ? target : Math.round(from + eased * (target - from))
			setCurrent(value)
			if (progress < 1) {
				raf = requestAnimationFrame(step)
			} else {
				fromRef.current = target
			}
		}

		raf = requestAnimationFrame(step)
		return () => cancelAnimationFrame(raf)
	}, [target, duration])

	return <>{current.toLocaleString()}</>
}

function buildSparkline(events: GitHubEvent[]): number[] {
	const now = Date.now()
	const days = Array.from({ length: 7 }, () => 0)
	for (const e of events) {
		const age = now - new Date(e.created_at).getTime()
		const dayIndex = Math.floor(age / (24 * 60 * 60 * 1000))
		if (dayIndex >= 0 && dayIndex < 7) days[6 - dayIndex]++
	}
	return days
}

function Sparkline({ data }: { data: number[] }) {
	const max = Math.max(...data, 1)
	return (
		<div className="flex items-end gap-[3px]">
			{data.map((v, i) => (
				<div
					// biome-ignore lint/suspicious/noArrayIndexKey: fixed-length sparkline bars
					key={i}
					className="w-full rounded-sm bg-sys-accent/70"
					style={{ height: `${Math.max((v / max) * 24, 2)}px` }}
				/>
			))}
		</div>
	)
}

function StarBars({ repos }: { repos: GitHubRepo[] }) {
	const starred = useMemo(
		() =>
			repos
				.filter((r) => r.stargazers_count > 0)
				.sort((a, b) => b.stargazers_count - a.stargazers_count)
				.slice(0, 5),
		[repos],
	)

	if (starred.length === 0) return null
	const max = starred[0].stargazers_count

	return (
		<div className="flex flex-col gap-1">
			{starred.map((repo) => (
				<div key={repo.name} className="flex items-center gap-2">
					<span className="w-20 shrink-0 truncate font-mono text-[0.65rem] tracking-wider text-sys-text-dim">
						{repo.name}
					</span>
					<div className="flex-1">
						<div
							className="h-1.5 rounded-full bg-sys-amber/70"
							style={{ width: `${(repo.stargazers_count / max) * 100}%` }}
						/>
					</div>
					<span className="font-mono text-[0.65rem] text-sys-amber">{repo.stargazers_count}</span>
				</div>
			))}
		</div>
	)
}

export function GithubStats({ user, totalStars, repos, events, loading, delay = 0 }: Props) {
	const status = loading ? "LOADING" : user ? "SYNCED" : "ERROR"
	const sparkData = useMemo(() => buildSparkline(events), [events])

	const stats = [
		{ label: "REPOS", value: user?.public_repos ?? 0 },
		{ label: "STARS", value: totalStars },
		{ label: "FOLLOWERS", value: user?.followers ?? 0 },
	]

	return (
		<ModulePanel title="GITHUB_METRICS" status={status} delay={delay}>
			<div className="flex flex-col gap-3">
				<div className="flex flex-col gap-1.5">
					{stats.map((stat) => (
						<div key={stat.label} className="flex items-center justify-between">
							<span className="font-mono text-[0.75rem] tracking-wider text-sys-text-dim">
								{stat.label}:
							</span>
							<span className="font-mono text-[0.75rem] tracking-wider text-sys-accent">
								<AnimatedNumber target={stat.value} />
							</span>
						</div>
					))}
				</div>
				{events.length > 0 && (
					<div className="flex flex-col gap-1">
						<span className="font-mono text-[0.65rem] tracking-wider text-sys-text-dim">
							ACTIVITY (7d)
						</span>
						<Sparkline data={sparkData} />
					</div>
				)}
				{repos.length > 0 && (
					<div className="flex flex-col gap-1">
						<span className="font-mono text-[0.65rem] tracking-wider text-sys-text-dim">
							TOP REPOS
						</span>
						<StarBars repos={repos} />
					</div>
				)}
			</div>
		</ModulePanel>
	)
}
