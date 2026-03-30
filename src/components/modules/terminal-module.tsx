import { useEffect, useMemo, useRef, useState } from "react"
import { useUptime } from "../../hooks/use-uptime"
import type { GitHubEvent, GitHubUser } from "../../lib/github-api"
import { executeCommand, getWelcomeMessage, type OutputLine } from "../../lib/terminal-commands"
import { getVisitorId } from "../../lib/visitor-id"
import { ModulePanel } from "../module-panel"

type Props = {
	user: GitHubUser | null
	totalStars: number
	events: GitHubEvent[]
	delay?: number
}

type HistoryEntry = {
	id: number
	command: string
	output: OutputLine[]
}

export function TerminalModule({ user, totalStars, events, delay = 0 }: Props) {
	const visitorId = useMemo(() => getVisitorId(), [])
	const prompt = `${visitorId}@smyile`
	const [history, setHistory] = useState<HistoryEntry[]>(() => [
		{ id: 0, command: "", output: getWelcomeMessage() },
	])
	const [input, setInput] = useState("")
	const [cmdHistory, setCmdHistory] = useState<string[]>([])
	const [historyIndex, setHistoryIndex] = useState(-1)
	const scrollRef = useRef<HTMLDivElement>(null)
	const inputRef = useRef<HTMLInputElement>(null)
	const entryIdRef = useRef(0)
	const uptime = useUptime()
	// biome-ignore lint/correctness/useExhaustiveDependencies: scroll on history change
	useEffect(() => {
		if (scrollRef.current) {
			scrollRef.current.scrollTop = scrollRef.current.scrollHeight
		}
	}, [history])

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		const trimmed = input.trim()
		if (!trimmed) return

		const ctx = { user, totalStars, events, uptime }
		const result = executeCommand(trimmed, ctx)

		if (result.clear) {
			setHistory([])
		} else {
			setHistory((prev) => [
				...prev,
				{ id: ++entryIdRef.current, command: trimmed, output: result.output },
			])
		}

		setCmdHistory((prev) => [trimmed, ...prev])
		setHistoryIndex(-1)
		setInput("")
	}

	function handleKeyDown(e: React.KeyboardEvent) {
		if (e.key === "ArrowUp") {
			e.preventDefault()
			const next = Math.min(historyIndex + 1, cmdHistory.length - 1)
			setHistoryIndex(next)
			setInput(cmdHistory[next] ?? "")
		} else if (e.key === "ArrowDown") {
			e.preventDefault()
			const next = historyIndex - 1
			if (next < 0) {
				setHistoryIndex(-1)
				setInput("")
			} else {
				setHistoryIndex(next)
				setInput(cmdHistory[next] ?? "")
			}
		}
	}

	return (
		<ModulePanel title="TERMINAL" status="ONLINE" delay={delay}>
			{/* biome-ignore lint/a11y/useKeyWithClickEvents: click-to-focus delegates to input */}
			{/* biome-ignore lint/a11y/noStaticElementInteractions: click-to-focus delegates to input */}
			<div
				ref={scrollRef}
				className="max-h-64 overflow-y-auto font-mono text-sm"
				onClick={() => inputRef.current?.focus()}
			>
				{history.map((entry) => (
					<div key={entry.id} className="mb-2">
						{entry.command && (
							<div>
								<span className="text-sys-green">{prompt}</span>
								<span className="text-sys-text-dim"> : </span>
								<span className="text-sys-accent">~$ </span>
								<span className="text-sys-text">{entry.command}</span>
							</div>
						)}
						{entry.output.map((line, j) => (
							<div
								// biome-ignore lint/suspicious/noArrayIndexKey: output lines are static per entry
								key={j}
								className="whitespace-pre text-sys-text"
								style={line.color ? { color: line.color } : undefined}
							>
								{line.text || "\u00A0"}
							</div>
						))}
					</div>
				))}

				<form onSubmit={handleSubmit} className="relative">
					<input
						ref={inputRef}
						type="text"
						value={input}
						onChange={(e) => setInput(e.target.value)}
						onKeyDown={handleKeyDown}
						className="absolute inset-0 z-10 w-full bg-transparent text-transparent caret-transparent outline-none"
						spellCheck={false}
						autoComplete="off"
					/>
					<div aria-hidden="true">
						<span className="text-sys-green">{prompt}</span>
						<span className="text-sys-text-dim"> : </span>
						<span className="text-sys-accent">~$ </span>
						<span className="text-sys-text">{input}</span>
						<span className="cursor-blink" />
					</div>
				</form>
			</div>
		</ModulePanel>
	)
}
