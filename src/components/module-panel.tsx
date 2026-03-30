import { motion } from "framer-motion"
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

const FLICKER_KEYFRAMES = [0, 0.4, 0.1, 0.7, 0.3, 1]

const materialize = {
	hidden: {
		opacity: 0,
		y: 8,
		scaleY: 0.97,
		x: -2,
	},
	visible: (delay: number) => ({
		opacity: FLICKER_KEYFRAMES,
		y: 0,
		scaleY: 1,
		x: 0,
		transition: {
			delay: delay / 1000,
			duration: 0.35,
			ease: [0.22, 0.68, 0.35, 1.0] as [number, number, number, number],
			opacity: {
				delay: delay / 1000,
				duration: 0.3,
				times: [0, 0.2, 0.35, 0.5, 0.7, 1],
			},
		},
	}),
}

export function ModulePanel({
	title,
	status = "ONLINE",
	children,
	className = "",
	delay = 0,
}: Props) {
	return (
		<motion.div
			className={`module-panel-card border border-[#1a1a1a] ${className}`}
			variants={materialize}
			initial="hidden"
			animate="visible"
			custom={delay}
		>
			<div className="flex items-center justify-between border-b border-[#1a1a1a] px-4 py-2">
				<span className="font-mono text-[0.7rem] tracking-[0.15em] text-sys-text-dim">
					[ {title} ]
				</span>
				{status && (
					<span
						className={`status-pulse font-mono text-[0.7rem] tracking-wider ${STATUS_COLORS[status]}`}
					>
						{status}
					</span>
				)}
			</div>
			<div className="p-4">{children}</div>
		</motion.div>
	)
}
