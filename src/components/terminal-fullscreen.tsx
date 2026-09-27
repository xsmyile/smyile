import { useNavigate } from "@tanstack/react-router"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { type KeyboardEvent, type RefObject, useCallback, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { useOwnerClock } from "../hooks/use-owner-clock"
import type { HistoryEntry, TerminalSession } from "../hooks/use-terminal-session"
import { type GitHubEvent, summarizeActivity } from "../lib/github-api"
import { SLASH_COMMANDS } from "../lib/terminal-commands"
import { Line } from "./terminal-window"

const TERMINAL_HASH_ID = "terminal"
const TERMINAL_INPUT_ATTR = "data-terminal-input"
const OPEN_SHORTCUT_KEY = "k"
const SHORTCUTS_COMMAND = "?"
const ENTER_SCALE = 0.98
const TRANSITION_S = 0.18
const INPUT_MAX_LENGTH = 200
const MENU_ID = "slash-menu"

type Props = {
	open: boolean
	onOpenChange: (open: boolean) => void
	session: TerminalSession
	events: GitHubEvent[]
	returnFocusRef: RefObject<HTMLButtonElement | null>
}

function isOtherTextField(el: Element | null): boolean {
	if (!(el instanceof HTMLElement) || el.hasAttribute(TERMINAL_INPUT_ATTR)) return false
	return (
		el.isContentEditable ||
		el instanceof HTMLInputElement ||
		el instanceof HTMLTextAreaElement ||
		el instanceof HTMLSelectElement
	)
}

function isSlashQuery(value: string): boolean {
	return value.startsWith("/") && !/\s/.test(value)
}

function optionId(name: string): string {
	return `${MENU_ID}-${name.slice(1)}`
}

function Entry({ entry }: { entry: HistoryEntry }) {
	return (
		<div className="mb-3">
			{entry.command && (
				<div className="whitespace-pre-wrap wrap-break-word text-sys-text-soft">
					<span className="text-sys-text-faint">{"> "}</span>
					{entry.command}
				</div>
			)}
			{entry.output.length > 0 && (
				<div className="flex gap-x-2">
					{entry.command && (
						<span aria-hidden="true" className="text-sys-text-faint">
							⎿
						</span>
					)}
					<div className="min-w-0 flex-1">
						{entry.output.map((line, j) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: output lines are static per entry
							<Line key={j} line={line} />
						))}
					</div>
				</div>
			)}
		</div>
	)
}

type ViewProps = {
	session: TerminalSession
	events: GitHubEvent[]
	onClose: () => void
	reduceMotion: boolean
}

function FullscreenView({ session, events, onClose, reduceMotion }: ViewProps) {
	const time = useOwnerClock()
	const { activeRepo } = summarizeActivity(events)
	const { history, input } = session
	const [menuActive, setMenuActive] = useState(() => isSlashQuery(session.input))
	const [menuIndex, setMenuIndex] = useState(0)
	const scrollRef = useRef<HTMLDivElement>(null)
	const inputRef = useRef<HTMLInputElement>(null)
	const closeRef = useRef<HTMLButtonElement>(null)
	const boxRef = useRef<HTMLDivElement>(null)

	const matches = isSlashQuery(input) ? SLASH_COMMANDS.filter((c) => c.name.startsWith(input)) : []
	const menuOpen = menuActive && matches.length > 0
	const activeIndex = Math.min(menuIndex, matches.length - 1)
	const picked = menuOpen ? matches[activeIndex] : undefined

	useEffect(() => {
		inputRef.current?.focus({ preventScroll: true })
	}, [])

	// biome-ignore lint/correctness/useExhaustiveDependencies: scroll on history or menu change
	useEffect(() => {
		if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
	}, [history, menuOpen])

	useEffect(() => {
		function handleEscape(e: globalThis.KeyboardEvent) {
			if (e.key !== "Escape") return
			e.preventDefault()
			if (menuOpen) setMenuActive(false)
			else onClose()
		}
		window.addEventListener("keydown", handleEscape)
		return () => window.removeEventListener("keydown", handleEscape)
	}, [menuOpen, onClose])

	function run(command: string) {
		setMenuActive(false)
		session.run(command, { anchor: boxRef.current, onExit: onClose })
	}

	function handleChange(value: string) {
		session.setInput(value)
		setMenuActive(isSlashQuery(value))
		setMenuIndex(0)
	}

	function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
		if (picked && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
			e.preventDefault()
			const step = e.key === "ArrowDown" ? 1 : -1
			setMenuIndex((activeIndex + step + matches.length) % matches.length)
			return
		}
		if (picked && e.key === "Tab" && !e.shiftKey) {
			e.preventDefault()
			session.setInput(`${picked.name} `)
			setMenuActive(false)
			return
		}
		if (picked && e.key === "Enter") {
			e.preventDefault()
			run(picked.name)
			return
		}
		if (e.key === SHORTCUTS_COMMAND && !input) {
			e.preventDefault()
			run(SHORTCUTS_COMMAND)
			return
		}
		session.handleKeyDown(e)
	}

	function trapFocus(e: KeyboardEvent<HTMLDivElement>) {
		if (e.key !== "Tab" || e.defaultPrevented) return
		const first = closeRef.current
		const last = inputRef.current
		if (!first || !last) return
		if (e.shiftKey && document.activeElement === first) {
			e.preventDefault()
			last.focus()
		} else if (!e.shiftKey && document.activeElement === last) {
			e.preventDefault()
			first.focus()
		}
	}

	const transition = reduceMotion
		? { duration: 0 }
		: { duration: TRANSITION_S, ease: "easeOut" as const }
	const hidden = { opacity: 0, scale: reduceMotion ? 1 : ENTER_SCALE }

	return (
		<motion.div
			role="dialog"
			aria-modal="true"
			aria-label="smyile terminal"
			initial={hidden}
			animate={{ opacity: 1, scale: 1 }}
			exit={hidden}
			transition={transition}
			onKeyDown={trapFocus}
			className="fixed inset-0 z-50 bg-sys-bg font-mono text-sm leading-relaxed text-sys-text"
		>
			<div className="mx-auto flex h-full w-full max-w-[1100px] flex-col gap-4 px-4 py-4 sm:px-6 sm:py-6">
				<div className="shrink-0 rounded-md border border-sys-accent/40 px-4 py-3">
					<div className="flex items-center gap-2">
						<span className="text-sys-accent">✻</span>
						<span>
							Welcome to <b className="font-semibold text-sys-accent">smyile</b>
						</span>
						<button
							ref={closeRef}
							type="button"
							onClick={onClose}
							aria-label="Close fullscreen terminal"
							className="ml-auto px-1.5 text-xs text-sys-text-faint transition-colors hover:text-sys-text"
						>
							esc ×
						</button>
					</div>
					<div className="mt-3 pl-[2ch] text-sys-text-dim">/help for commands · esc to exit</div>
					<div className="mt-1 pl-[2ch] text-sys-text-faint">cwd: ~/smyile</div>
				</div>

				{/* biome-ignore lint/a11y/useKeyWithClickEvents: click-to-focus delegates to input */}
				{/* biome-ignore lint/a11y/noStaticElementInteractions: click-to-focus delegates to input */}
				<div
					ref={scrollRef}
					aria-live="polite"
					className="terminal-glow min-h-0 flex-1 overflow-x-hidden overflow-y-auto select-text"
					onClick={() => {
						if (!window.getSelection()?.toString()) inputRef.current?.focus({ preventScroll: true })
					}}
				>
					{history.map((entry) => (
						<Entry key={entry.id} entry={entry} />
					))}
				</div>

				<form
					onSubmit={(e) => {
						e.preventDefault()
						run(input)
					}}
					className="shrink-0"
				>
					<div
						ref={boxRef}
						className="flex items-center gap-2 rounded-lg border border-sys-border-strong px-3 py-2 transition-colors focus-within:border-sys-text-faint"
					>
						<span aria-hidden="true" className="text-sys-text-dim">
							{">"}
						</span>
						<input
							ref={inputRef}
							type="text"
							value={input}
							data-terminal-input=""
							role="combobox"
							aria-label="Terminal command"
							aria-expanded={menuOpen}
							aria-controls={menuOpen ? MENU_ID : undefined}
							aria-autocomplete="list"
							aria-activedescendant={picked ? optionId(picked.name) : undefined}
							onChange={(e) => handleChange(e.target.value)}
							onKeyDown={handleKeyDown}
							maxLength={INPUT_MAX_LENGTH}
							placeholder={'Try "/projects" or "neofetch"'}
							className="min-w-0 flex-1 bg-transparent text-base text-sys-text caret-sys-accent outline-none placeholder:text-sys-text-faint sm:text-sm"
							spellCheck={false}
							autoComplete="off"
							autoCapitalize="none"
						/>
					</div>

					{menuOpen ? (
						<div
							id={MENU_ID}
							role="listbox"
							aria-label="Slash commands"
							className="px-1 pt-1.5 text-xs"
						>
							{matches.map((c, i) => (
								<div
									key={c.name}
									id={optionId(c.name)}
									role="option"
									tabIndex={-1}
									aria-selected={i === activeIndex}
									onMouseDown={(e) => {
										e.preventDefault()
										run(c.name)
									}}
									className={`flex cursor-pointer gap-4 px-2 py-0.5 ${i === activeIndex ? "text-sys-accent" : "text-sys-text-dim"}`}
								>
									<span className="w-[10ch] shrink-0">{c.name}</span>
									<span className="min-w-0 truncate">{c.description}</span>
								</div>
							))}
						</div>
					) : (
						<div className="flex flex-wrap justify-between gap-x-4 gap-y-1 px-1 pt-1.5 text-xs text-sys-text-faint">
							<span>
								smyile · Rome {time} · now {activeRepo ?? "--"}
							</span>
							<span>? for shortcuts</span>
						</div>
					)}
				</form>
			</div>
		</motion.div>
	)
}

export function TerminalFullscreen({ open, onOpenChange, session, events, returnFocusRef }: Props) {
	const reduceMotion = useReducedMotion() ?? false
	const navigate = useNavigate()
	const close = useCallback(() => onOpenChange(false), [onOpenChange])

	useEffect(() => {
		function openFromHash() {
			if (window.location.hash === `#${TERMINAL_HASH_ID}`) onOpenChange(true)
		}
		openFromHash()
		window.addEventListener("hashchange", openFromHash)
		return () => window.removeEventListener("hashchange", openFromHash)
	}, [onOpenChange])

	useEffect(() => {
		function handleShortcut(e: globalThis.KeyboardEvent) {
			if (e.key.toLowerCase() !== OPEN_SHORTCUT_KEY || !e.ctrlKey || e.metaKey || e.altKey) return
			if (isOtherTextField(document.activeElement)) return
			e.preventDefault()
			onOpenChange(true)
		}
		window.addEventListener("keydown", handleShortcut)
		return () => window.removeEventListener("keydown", handleShortcut)
	}, [onOpenChange])

	useEffect(() => {
		if (!open) return
		const { body } = document
		const previousOverflow = body.style.overflow
		const returnFocus = returnFocusRef.current
		const replaceHash = (hash: string) =>
			navigate({ to: ".", hash, replace: true, resetScroll: false, hashScrollIntoView: false })
		body.style.overflow = "hidden"
		replaceHash(TERMINAL_HASH_ID)
		return () => {
			body.style.overflow = previousOverflow
			replaceHash("")
			returnFocus?.focus({ preventScroll: true })
		}
	}, [open, returnFocusRef, navigate])

	return createPortal(
		<AnimatePresence>
			{open && (
				<FullscreenView
					key="terminal-fullscreen"
					session={session}
					events={events}
					onClose={close}
					reduceMotion={reduceMotion}
				/>
			)}
		</AnimatePresence>,
		document.body,
	)
}
