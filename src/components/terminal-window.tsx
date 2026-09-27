import { type RefObject, useEffect, useMemo, useRef, useState } from "react"
import type { TerminalSession } from "../hooks/use-terminal-session"
import type { OutputLine } from "../lib/terminal-commands"
import { getVisitorId } from "../lib/visitor-id"

const HINTS = ["ls projects", "ls orgs", "neofetch", "cat overbot", "help"] as const
const HINT_ROTATE_MS = 3500
const TOUCH_COMMANDS = ["help", "ls projects", "ls orgs", "neofetch"] as const

type Props = {
	session: TerminalSession
	onExpand: () => void
	expandRef: RefObject<HTMLButtonElement | null>
}

export function Line({ line }: { line: OutputLine }) {
	const style = line.color ? { color: line.color } : undefined
	if (line.href) {
		return (
			<div className="whitespace-pre-wrap wrap-break-word">
				<a
					href={line.href}
					target="_blank"
					rel="noopener noreferrer"
					style={style}
					className="hover:underline"
				>
					{line.text}
				</a>
			</div>
		)
	}
	return (
		<div className="whitespace-pre-wrap wrap-break-word text-sys-text" style={style}>
			{line.text || " "}
		</div>
	)
}

function Prompt({ id }: { id: string }) {
	return (
		<>
			<span className="text-sys-green">{id}@smyile</span>
			<span className="text-sys-text-dim"> : </span>
			<span className="text-sys-accent">~$ </span>
		</>
	)
}

export function TerminalWindow({ session, onExpand, expandRef }: Props) {
	const visitorId = useMemo(() => getVisitorId(), [])
	const { history, input } = session
	const [focused, setFocused] = useState(false)
	const [hintIndex, setHintIndex] = useState(0)
	const windowRef = useRef<HTMLDivElement>(null)
	const scrollRef = useRef<HTMLDivElement>(null)
	const inputRef = useRef<HTMLInputElement>(null)

	// biome-ignore lint/correctness/useExhaustiveDependencies: scroll on history change
	useEffect(() => {
		if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
	}, [history])

	useEffect(() => {
		const interval = setInterval(() => setHintIndex((i) => (i + 1) % HINTS.length), HINT_ROTATE_MS)
		return () => clearInterval(interval)
	}, [])

	function run(command: string) {
		session.run(command, { anchor: windowRef.current })
	}

	const hint = `try: ${HINTS[hintIndex]}`

	return (
		<div
			ref={windowRef}
			className="brackets w-full max-w-[860px] border border-sys-border-strong bg-[rgba(6,6,10,0.86)] shadow-[0_0_60px_rgba(137,207,240,0.05),0_30px_80px_rgba(0,0,0,0.6)]"
		>
			<div className="flex items-center gap-3 border-b border-sys-border px-4 py-2.5 font-mono text-[0.7rem] tracking-[0.2em]">
				<span className="text-sys-text-dim">
					{"TTY // "}
					{visitorId}@smyile
				</span>
				<button
					ref={expandRef}
					type="button"
					onClick={onExpand}
					aria-label="Open fullscreen terminal"
					title="Fullscreen (ctrl+k)"
					className="ml-auto px-1 text-base leading-none tracking-normal text-sys-text-dim transition-colors hover:text-sys-accent"
				>
					⤢
				</button>
				<span className="flex items-center gap-2 text-sys-green">
					<span className="led" />
					connected
				</span>
			</div>

			<div className="px-5 pt-5 pb-4 font-mono text-sm leading-relaxed">
				{/* biome-ignore lint/a11y/useKeyWithClickEvents: click-to-focus delegates to input */}
				{/* biome-ignore lint/a11y/noStaticElementInteractions: click-to-focus delegates to input */}
				<div
					ref={scrollRef}
					aria-live="polite"
					className="terminal-glow max-h-[300px] overflow-x-hidden overflow-y-auto select-text"
					onClick={() => inputRef.current?.focus({ preventScroll: true })}
				>
					{history.map((entry) => (
						<div key={entry.id} className="mb-2">
							{entry.command && (
								<div className="whitespace-pre-wrap wrap-break-word">
									<Prompt id={visitorId} />
									<span className="text-sys-text">{entry.command}</span>
								</div>
							)}
							{entry.output.map((line, j) => (
								// biome-ignore lint/suspicious/noArrayIndexKey: output lines are static per entry
								<Line key={j} line={line} />
							))}
						</div>
					))}

					<form
						onSubmit={(e) => {
							e.preventDefault()
							run(input)
						}}
						className="relative"
					>
						<input
							ref={inputRef}
							type="text"
							value={input}
							aria-label="Terminal command"
							data-terminal-input=""
							onChange={(e) => session.setInput(e.target.value)}
							onKeyDown={session.handleKeyDown}
							onFocus={() => setFocused(true)}
							onBlur={() => setFocused(false)}
							maxLength={200}
							className="absolute inset-0 z-10 w-full bg-transparent text-base text-transparent caret-transparent outline-none"
							spellCheck={false}
							autoComplete="off"
							autoCapitalize="none"
						/>
						<div aria-hidden="true" className="whitespace-pre-wrap wrap-break-word">
							<Prompt id={visitorId} />
							<span className="text-sys-text">{input}</span>
							{focused && <span className="cursor-blink" />}
							{!input && <span className="text-sys-text-faint"> {hint}</span>}
						</div>
					</form>
				</div>

				<div className="mt-3 hidden flex-wrap gap-1.5 pointer-coarse:flex">
					{TOUCH_COMMANDS.map((cmd) => (
						<button
							key={cmd}
							type="button"
							onClick={() => run(cmd)}
							className="border border-sys-border-strong px-2.5 py-2 font-mono text-[0.7rem] text-sys-text-dim"
						>
							{cmd}
						</button>
					))}
				</div>

				<div className="mt-3.5 flex flex-wrap justify-between gap-2.5 border-t border-dashed border-sys-border-strong pt-3 font-mono text-[0.7rem] tracking-wider text-sys-text-faint">
					<span>
						<kbd className="kbd">tab</kbd> complete · <kbd className="kbd">↑</kbd>
						<kbd className="kbd">↓</kbd> history
					</span>
					<span>{hint}</span>
				</div>
			</div>
		</div>
	)
}
