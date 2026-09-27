import { type KeyboardEvent, useRef, useState } from "react"
import type { GitHubEvent, GitHubUser } from "../lib/github-api"
import {
	completeInput,
	executeCommand,
	getWelcomeMessage,
	type OutputLine,
} from "../lib/terminal-commands"
import { getUptime } from "./use-uptime"

export type HistoryEntry = {
	id: number
	command: string
	output: OutputLine[]
}

export type TerminalView = {
	anchor: HTMLElement | null
	onExit?: () => void
}

type Options = {
	user: GitHubUser | null
	totalStars: number
	events: GitHubEvent[]
	sissyOut: boolean
	onSummonSissy: (anchor: DOMRect) => void
}

export type TerminalSession = {
	history: HistoryEntry[]
	input: string
	setInput: (value: string) => void
	run: (command: string, view: TerminalView) => void
	handleKeyDown: (e: KeyboardEvent) => void
}

export function useTerminalSession({
	user,
	totalStars,
	events,
	sissyOut,
	onSummonSissy,
}: Options): TerminalSession {
	const [history, setHistory] = useState<HistoryEntry[]>(() => [
		{ id: 0, command: "", output: getWelcomeMessage() },
	])
	const [input, setRawInput] = useState("")
	const [cmdHistory, setCmdHistory] = useState<string[]>([])
	const [historyIndex, setHistoryIndex] = useState(-1)
	const entryIdRef = useRef(0)

	function append(command: string, output: OutputLine[]) {
		const nextId = ++entryIdRef.current
		setHistory((prev) => [...prev, { id: nextId, command, output }])
	}

	function setInput(value: string) {
		setRawInput(value.toLowerCase())
	}

	function run(command: string, view: TerminalView) {
		const trimmed = command.trim()
		if (!trimmed) return

		const result = executeCommand(trimmed, {
			user,
			totalStars,
			events,
			uptime: getUptime(),
			sissyOut,
			fullscreen: view.onExit !== undefined,
		})

		if (result.clear) setHistory([])
		else if (!result.exit) append(trimmed, result.output)

		if (result.summonSissy && view.anchor) {
			onSummonSissy(view.anchor.getBoundingClientRect())
		}

		setCmdHistory((prev) => [trimmed, ...prev])
		setHistoryIndex(-1)
		setRawInput("")

		if (result.exit) view.onExit?.()
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === "c" && (e.ctrlKey || e.metaKey) && input && !window.getSelection()?.toString()) {
			e.preventDefault()
			append(`${input}^C`, [])
			setHistoryIndex(-1)
			setRawInput("")
			return
		}
		if (e.key === "Tab" && !e.shiftKey && input) {
			const { value, candidates } = completeInput(input)
			if (value === input && candidates.length === 0) return
			e.preventDefault()
			if (candidates.length > 1)
				append(input, [{ text: candidates.join("   "), color: "var(--color-sys-text-dim)" }])
			setRawInput(value)
		} else if (e.key === "ArrowUp") {
			e.preventDefault()
			const next = Math.min(historyIndex + 1, cmdHistory.length - 1)
			setHistoryIndex(next)
			setRawInput(cmdHistory[next] ?? "")
		} else if (e.key === "ArrowDown") {
			e.preventDefault()
			const next = historyIndex - 1
			setHistoryIndex(Math.max(next, -1))
			setRawInput(next < 0 ? "" : (cmdHistory[next] ?? ""))
		}
	}

	return { history, input, setInput, run, handleKeyDown }
}
