import { useCallback, useEffect, useRef, useState } from "react"
import { getVisitorId } from "../../lib/visitor-id"
import { ModulePanel } from "../module-panel"

type LogEntry = {
	id: number
	time: string
	module: string
	message: string
}

type GitHubState = {
	events: unknown[]
	loading: boolean
	cached: boolean
	error: string | null
}

type Props = {
	github: GitHubState
	delay?: number
}

function timestamp(): string {
	const now = new Date()
	return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`
}

export function SystemLog({ github, delay = 0 }: Props) {
	const [logs, setLogs] = useState<LogEntry[]>([])
	const scrollRef = useRef<HTMLDivElement>(null)
	const initializedRef = useRef(false)
	const counterRef = useRef(0)

	const addLog = useCallback((module: string, message: string) => {
		counterRef.current++
		const id = counterRef.current
		setLogs((prev) => [...prev.slice(-30), { id, time: timestamp(), module, message }])
	}, [])

	useEffect(() => {
		if (initializedRef.current) return
		initializedRef.current = true

		addLog("CORE", "system initialized")
		addLog("AUTH", `visitor ${getVisitorId()} connected`)
		addLog("RENDER", "dashboard mounted")
		addLog("GITHUB", "fetching user data...")
	}, [addLog])

	useEffect(() => {
		if (github.loading) return

		if (github.error) {
			addLog("GITHUB", `error: ${github.error}`)
		} else {
			const count = github.events.length
			addLog("GITHUB", `${count} events ${github.cached ? "(cached)" : "synced"}`)
		}
	}, [github.loading, github.error, github.events.length, github.cached, addLog])

	useEffect(() => {
		const messages = [
			["HEARTBEAT", "system nominal"],
			["MONITOR", "all modules responsive"],
			["NETWORK", "latency: <1ms"],
			["CACHE", "store integrity OK"],
		]

		const interval = setInterval(() => {
			const [module, message] = messages[Math.floor(Math.random() * messages.length)]
			addLog(module, message)
		}, 12000)

		return () => clearInterval(interval)
	}, [addLog])

	const prevCountRef = useRef(0)

	useEffect(() => {
		if (logs.length !== prevCountRef.current) {
			prevCountRef.current = logs.length
			scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
		}
	})

	return (
		<ModulePanel title="SYSTEM_LOG" status="ONLINE" delay={delay}>
			<div ref={scrollRef} className="flex max-h-32 flex-col gap-0.5 overflow-y-auto">
				{logs.map((log) => (
					<div key={log.id} className="font-mono text-[0.75rem] leading-tight">
						<span className="text-sys-text-dim">[{log.time}]</span>{" "}
						<span className="text-sys-accent">{log.module}</span>{" "}
						<span className="text-sys-text-dim">::</span>{" "}
						<span className="text-sys-text">{log.message}</span>
					</div>
				))}
			</div>
		</ModulePanel>
	)
}
