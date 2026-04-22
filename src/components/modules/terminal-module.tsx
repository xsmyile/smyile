import { useEffect, useMemo, useRef, useState } from "react"
import { getUptime } from "../../hooks/use-uptime"
import type { GitHubEvent, GitHubUser } from "../../lib/github-api"
import {
	ALLOWED_IMAGES,
	executeCommand,
	getWelcomeMessage,
	type OutputLine,
} from "../../lib/terminal-commands"
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
	const [focused, setFocused] = useState(false)
	const scrollRef = useRef<HTMLDivElement>(null)
	const inputRef = useRef<HTMLInputElement>(null)
	const entryIdRef = useRef(0)
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

		const ctx = { user, totalStars, events, uptime: getUptime() }
		const result = executeCommand(trimmed, ctx)

		if (result.clear) {
			setHistory([])
		} else {
			const nextId = ++entryIdRef.current
			setHistory((prev) => [...prev, { id: nextId, command: trimmed, output: result.output }])
		}

		setCmdHistory((prev) => [trimmed, ...prev])
		setHistoryIndex(-1)
		setInput("")
	}

	function handleKeyDown(e: React.KeyboardEvent) {
		if (e.key === "c" && (e.ctrlKey || e.metaKey) && input && !window.getSelection()?.toString()) {
			e.preventDefault()
			const nextId = ++entryIdRef.current
			setHistory((prev) => [...prev, { id: nextId, command: `${input}^C`, output: [] }])
			setHistoryIndex(-1)
			setInput("")
			return
		}
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
				className="max-h-64 overflow-y-auto overflow-x-hidden font-mono text-sm"
				onClick={() => inputRef.current?.focus()}
			>
				{history.map((entry) => (
					<div key={entry.id} className="mb-2">
						{entry.command && (
							<div className="whitespace-pre-wrap wrap-break-word">
								<span className="text-sys-green">{prompt}</span>
								<span className="text-sys-text-dim"> : </span>
								<span className="text-sys-accent">~$ </span>
								<span className="text-sys-text">{entry.command}</span>
							</div>
						)}
						{entry.output.map((line, j) =>
							line.image && ALLOWED_IMAGES.has(line.image) ? (
								<img
									// biome-ignore lint/suspicious/noArrayIndexKey: output lines are static per entry
									key={j}
									src={line.image}
									alt="Claude pixel art logo"
									className="pointer-events-none my-2 h-24 w-auto select-none"
									draggable={false}
									style={{ imageRendering: "pixelated" }}
								/>
							) : (
								<div
									// biome-ignore lint/suspicious/noArrayIndexKey: output lines are static per entry
									key={j}
									className="whitespace-pre-wrap wrap-break-word text-sys-text"
									style={line.color ? { color: line.color } : undefined}
								>
									{line.text || "\u00A0"}
								</div>
							),
						)}
					</div>
				))}

				<form onSubmit={handleSubmit} className="relative">
					<input
						ref={inputRef}
						type="text"
						value={input}
						onChange={(e) => setInput(e.target.value.toLowerCase())}
						onKeyDown={handleKeyDown}
						onFocus={() => setFocused(true)}
						onBlur={() => setFocused(false)}
						maxLength={200}
						className="absolute inset-0 z-10 w-full bg-transparent text-base text-transparent caret-transparent outline-none"
						spellCheck={false}
						autoComplete="off"
						autoCapitalize="none"
					/>
					<div aria-hidden="true" className="whitespace-pre-wrap wrap-break-word">
						<span className="text-sys-green">{prompt}</span>
						<span className="text-sys-text-dim"> : </span>
						<span className="text-sys-accent">~$ </span>
						<span className="text-sys-text">{input}</span>
						{focused && <span className="cursor-blink" />}
					</div>
				</form>
			</div>
		</ModulePanel>
	)
}
