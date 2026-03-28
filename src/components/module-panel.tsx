import type { ReactNode } from "react"

type ModuleStatus = "ONLINE" | "SYNCED" | "LOADING" | "CACHED" | "ERROR" | "IDLE"

type Props = {
	title: string
	status?: ModuleStatus
	children: ReactNode
	className?: string
	delay?: number
}

const STATUS_COLORS: Record<ModuleStatus, string> = {
	ONLINE: "text-sys-green",
	SYNCED: "text-sys-cyan",
	LOADING: "text-sys-amber",
	CACHED: "text-sys-amber",
	ERROR: "text-sys-magenta",
	IDLE: "text-sys-text-dim",
}

export function ModulePanel({
	title,
	status = "ONLINE",
	children,
	className = "",
	delay = 0,
}: Props) {
	return (
		<div
			className={`module-enter border border-sys-border bg-sys-surface/60 backdrop-blur-sm ${className}`}
			style={{ animationDelay: `${delay}ms` }}
		>
			<div className="flex items-center justify-between border-b border-sys-border px-4 py-2">
				<span className="font-mono text-[0.7rem] tracking-[0.15em] text-sys-text-dim">
					[ {title} ]
				</span>
				{status && (
					<span className={`font-mono text-[0.7rem] tracking-wider ${STATUS_COLORS[status]}`}>
						{status}
					</span>
				)}
			</div>
			<div className="p-4">{children}</div>
		</div>
	)
}
