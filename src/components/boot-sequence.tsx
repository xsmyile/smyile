import { AnimatePresence, motion } from "framer-motion"
import { useEffect, useRef } from "react"
import type { BootPhase } from "../hooks/use-boot-sequence"

type BootLog = {
	time: string
	module: string
	message: string
}

type Props = {
	phase: BootPhase
	logs: BootLog[]
	onSkip: () => void
}

export function BootSequence({ phase, logs, onSkip }: Props) {
	const containerRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		if (phase !== "booting") return
		containerRef.current?.focus()
	}, [phase])

	return (
		<AnimatePresence>
			{phase === "booting" && (
				<motion.div
					ref={containerRef}
					initial={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.4 }}
					className="scanlines fixed inset-0 z-50 flex flex-col justify-center bg-sys-bg px-8 outline-none"
					onClick={onSkip}
					onKeyDown={onSkip}
					role="button"
					tabIndex={0}
				>
					<div className="mx-auto w-full max-w-lg">
						<div className="mb-6 font-mono text-[0.8rem] tracking-wider text-sys-text-dim">
							SMYILE SYSTEM v0.5.0
						</div>

						<div className="flex flex-col gap-1">
							{logs.map((log) => (
								<div key={log.time} className="boot-line font-mono text-xs">
									<span className="text-sys-text-dim">[{log.time}]</span>{" "}
									<span className="text-sys-accent">{log.module}</span>{" "}
									<span className="text-sys-text-dim">::</span>{" "}
									<span className="text-sys-text">{log.message}</span>
								</div>
							))}
						</div>

						<div className="mt-8 font-mono text-[0.8rem] tracking-wider text-sys-text-dim">
							press any key to skip
						</div>
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	)
}
