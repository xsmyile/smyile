import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import type { GitHubData } from "../hooks/use-github"
import { useTerminalSession } from "../hooks/use-terminal-session"
import { IDENTITY, SOCIAL_LINKS } from "../lib/constants"
import { formatRelativeTime, summarizeActivity } from "../lib/github-api"
import { TerminalWindow } from "./terminal-window"

const WHOAMI = "whoami"
const TYPE_STEP_MS = 80
const REVEAL_DELAY_MS = 300
const CLOCK_TICK_MS = 10_000

const fadeUp = {
	hidden: { opacity: 0, y: 12 },
	visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
}

function useTypedCommand(command: string): { typed: string; done: boolean } {
	const [typed, setTyped] = useState("")
	const [done, setDone] = useState(false)

	useEffect(() => {
		let i = 0
		let reveal: ReturnType<typeof setTimeout> | undefined
		const interval = setInterval(() => {
			i++
			setTyped(command.slice(0, i))
			if (i >= command.length) {
				clearInterval(interval)
				reveal = setTimeout(() => setDone(true), REVEAL_DELAY_MS)
			}
		}, TYPE_STEP_MS)
		return () => {
			clearInterval(interval)
			clearTimeout(reveal)
		}
	}, [command])

	return { typed, done }
}

const OWNER_CLOCK = new Intl.DateTimeFormat("en-GB", {
	timeZone: IDENTITY.timezone,
	hour: "2-digit",
	minute: "2-digit",
})

function formatOwnerTime(): string {
	return OWNER_CLOCK.format(new Date())
}

function useOwnerClock(): string {
	const [time, setTime] = useState(formatOwnerTime)

	useEffect(() => {
		const interval = setInterval(() => setTime(formatOwnerTime()), CLOCK_TICK_MS)
		return () => clearInterval(interval)
	}, [])

	return time
}

function Readout({ github }: { github: GitHubData }) {
	const time = useOwnerClock()
	const { lastPushAt, activeRepo } = summarizeActivity(github.events)
	const items = [
		{ label: "Rome", value: time },
		{ label: "Last push", value: lastPushAt ? formatRelativeTime(lastPushAt) : "--" },
		{ label: "Now", value: activeRepo ?? "--" },
	]

	return (
		<div className="flex flex-wrap justify-center gap-x-9 gap-y-2.5 font-mono text-xs tracking-[0.14em] text-sys-text-dim uppercase">
			{github.eventsFailed ? (
				<span className="flex items-center gap-2 text-sys-magenta">
					<span className="led" />
					signal lost
				</span>
			) : (
				<span className="flex items-center gap-2">
					<span className="led led-pulse text-sys-green" />
					online
				</span>
			)}
			{items.map((item) => (
				<span key={item.label}>
					{item.label} <b className="font-medium text-sys-text tabular-nums">{item.value}</b>
				</span>
			))}
		</div>
	)
}

type Props = {
	github: GitHubData
	sissyOut: boolean
	onSummonSissy: (terminal: DOMRect) => void
}

export function SignalHero({ github, sissyOut, onSummonSissy }: Props) {
	const { typed, done } = useTypedCommand(WHOAMI)
	const session = useTerminalSession({
		user: github.user,
		totalStars: github.totalStars,
		events: github.events,
		sissyOut,
		onSummonSissy,
	})

	return (
		<div className="grid justify-items-center gap-[clamp(28px,4vw,48px)] px-[clamp(16px,5vw,64px)] pt-[clamp(40px,7vw,96px)] pb-[clamp(36px,5vw,64px)]">
			<div className="grid justify-items-center gap-[clamp(20px,2.6vw,34px)] text-center">
				<div className="font-mono text-sm text-sys-text-dim">
					<span className="text-sys-green">root@smyile</span>:~${" "}
					<span className="text-sys-text">{typed}</span>
					{!done && <span className="cursor-blink" />}
				</div>
				<motion.h1
					variants={fadeUp}
					initial="hidden"
					animate={done ? "visible" : "hidden"}
					className="glitch-text font-display text-[clamp(46px,7.2vw,92px)] leading-none font-semibold text-sys-accent"
				>
					{IDENTITY.name}
				</motion.h1>
				<motion.p
					variants={fadeUp}
					initial="hidden"
					animate={done ? "visible" : "hidden"}
					className="font-mono text-sm tracking-[0.2em] text-sys-text-dim uppercase"
				>
					{IDENTITY.role}
				</motion.p>
			</div>

			<Readout github={github} />

			<TerminalWindow session={session} />

			<div className="flex flex-wrap justify-center gap-2.5">
				{SOCIAL_LINKS.map((link) => (
					<a
						key={link.label}
						href={link.url}
						target="_blank"
						rel="noopener noreferrer"
						className="cut-corners border border-sys-accent/30 bg-sys-accent/[0.03] px-3.5 py-2.5 font-mono text-[0.72rem] tracking-[0.18em] text-sys-accent transition-colors hover:border-sys-accent hover:bg-sys-accent/10"
					>
						{">> "}
						{link.label.toUpperCase()}
					</a>
				))}
			</div>

			<div className="font-mono text-[0.7rem] tracking-[0.2em] text-sys-text-faint uppercase">
				↓ scroll · projects · network
			</div>
		</div>
	)
}
