import { useEffect, useRef, useState } from "react"
import type { GitHubUser } from "../../lib/github-api"
import { ModulePanel } from "../module-panel"

type Props = {
	user: GitHubUser | null
	totalStars: number
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

export function GithubStats({ user, totalStars, loading, delay = 0 }: Props) {
	const status = loading ? "LOADING" : user ? "SYNCED" : "ERROR"

	const stats = [
		{ label: "REPOS", value: user?.public_repos ?? 0 },
		{ label: "STARS", value: totalStars },
		{ label: "FOLLOWERS", value: user?.followers ?? 0 },
	]

	return (
		<ModulePanel title="GITHUB_METRICS" status={status} delay={delay}>
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
		</ModulePanel>
	)
}
