import { useMemo } from "react"
import { formatEventDescription, type GitHubEvent } from "../lib/github-api"

const FILLER = [
	"INTERCEPTING TRAFFIC",
	"DECRYPTING PAYLOAD",
	"KERNEL PANIC AVERTED",
	"FIREWALL BREACH DETECTED",
	"SCANNING PORT 443",
	"INJECTING SHELLCODE",
	"SPOOFING ARP TABLE",
	"BRUTE FORCE IN PROGRESS",
	"TUNNELING THROUGH SSH",
	"EXFILTRATING DATA",
	"PATCHING VULNERABILITY",
	"ROOT ACCESS GRANTED",
	"MEMORY DUMP COMPLETE",
	"REVERSE SHELL ACTIVE",
	"PROXY CHAIN ESTABLISHED",
]

function buildItems(events: GitHubEvent[]): string[] {
	const activity = events
		.slice(0, 8)
		.map(formatEventDescription)

	const shuffled = [...FILLER].sort(() => Math.random() - 0.5)
	const fillerSlice = shuffled.slice(0, Math.max(4, 8 - activity.length))

	const merged: string[] = []
	let ai = 0
	let fi = 0
	while (ai < activity.length || fi < fillerSlice.length) {
		if (ai < activity.length) merged.push(activity[ai++])
		if (fi < fillerSlice.length) merged.push(fillerSlice[fi++])
	}

	return merged.length > 0 ? merged : fillerSlice
}

type Props = {
	events: GitHubEvent[]
}

export function TickerStrip({ events }: Props) {
	const items = useMemo(() => buildItems(events), [events])
	const separator = "\u00A0\u00A0///\u00A0\u00A0"
	const text = items.join(separator)
	const repeated = `${text}${separator}`

	return (
		<div className="ticker-strip fixed inset-x-0 top-0 z-30 h-7 overflow-hidden bg-[rgba(8,8,12,0.65)] backdrop-blur-[4px]">
			<div className="ticker-scroll flex h-full items-center whitespace-nowrap">
				<span className="ticker-content font-mono text-[0.7rem] tracking-wider text-sys-green">
					{repeated}
				</span>
				<span className="ticker-content font-mono text-[0.7rem] tracking-wider text-sys-green">
					{repeated}
				</span>
			</div>
		</div>
	)
}
