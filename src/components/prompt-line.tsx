import { type RefObject, useMemo, useRef } from "react"
import type { TerminalSession } from "../hooks/use-terminal-session"
import { commandName, EXIT_COMMAND } from "../lib/terminal-commands"
import { getVisitorId } from "../lib/visitor-id"
import { Prompt } from "./terminal-output"

const INPUT_ID = "prompt-line"
const INPUT_MAX_LENGTH = 200
const TOUCH_COMMANDS = ["help", "ls projects", "neofetch"] as const

type Props = {
	session: TerminalSession
	openRef: RefObject<HTMLButtonElement | null>
	sissyOut: boolean
	onOpen: () => void
}

/** One-line prompt: a command runs in the session and opens the fullscreen terminal on its output. */
export function PromptLine({ session, openRef, sissyOut, onOpen }: Props) {
	const visitorId = useMemo(() => getVisitorId(), [])
	const formRef = useRef<HTMLFormElement>(null)

	function run(command: string) {
		const name = commandName(command)
		if (name === EXIT_COMMAND) {
			session.setInput("")
			return
		}
		session.run(command, { anchor: formRef.current })
		const inPlace = name === "clear" || (name === "sissy" && !sissyOut)
		if (!inPlace) onOpen()
	}

	return (
		<div className="flex w-full flex-col items-start gap-2.5 sm:w-auto sm:items-end">
			<form
				ref={formRef}
				onSubmit={(e) => {
					e.preventDefault()
					run(session.input)
				}}
				className="flex w-[min(100%,340px)] items-center gap-2.5 text-sm"
			>
				<label htmlFor={INPUT_ID} className="shrink-0 whitespace-pre">
					<Prompt id={visitorId} />
				</label>
				<input
					id={INPUT_ID}
					type="text"
					value={session.input}
					aria-label="Terminal command"
					data-terminal-input=""
					onChange={(e) => session.setInput(e.target.value)}
					onKeyDown={session.handleKeyDown}
					maxLength={INPUT_MAX_LENGTH}
					placeholder="help"
					className="min-w-0 flex-1 bg-transparent text-base text-ink caret-ink outline-none placeholder:text-faint sm:text-sm"
					spellCheck={false}
					autoComplete="off"
					autoCapitalize="none"
				/>
				<button
					ref={openRef}
					type="button"
					onClick={onOpen}
					aria-label="Open fullscreen terminal"
					title="Fullscreen (ctrl+k)"
					className="shrink-0 text-xs whitespace-nowrap text-faint transition-colors hover:text-ink"
				>
					ctrl+k
				</button>
			</form>
			<div className="hidden flex-wrap gap-1.5 pointer-coarse:flex sm:justify-end">
				{TOUCH_COMMANDS.map((command) => (
					<button
						key={command}
						type="button"
						onClick={() => run(command)}
						className="border border-line-strong bg-ground px-2.5 py-2 text-xs text-muted"
					>
						{command}
					</button>
				))}
			</div>
		</div>
	)
}
