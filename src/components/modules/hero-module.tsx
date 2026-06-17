import { AnimatePresence, motion } from "framer-motion"
import { useEffect, useRef, useState } from "react"
import { IDENTITY, PROJECTS, SOCIAL_LINKS } from "../../lib/constants"
import { ModulePanel } from "../module-panel"

type Props = {
	delay?: number
}

const stagger = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: { staggerChildren: 0.12 },
	},
}

const fadeUp = {
	hidden: { opacity: 0, y: 12 },
	visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
}

export function HeroModule({ delay = 0 }: Props) {
	const [typed, setTyped] = useState("")
	const [showName, setShowName] = useState(false)
	const revealTimeout = useRef<ReturnType<typeof setTimeout>>(undefined)
	const command = "whoami"

	useEffect(() => {
		let i = 0
		const interval = setInterval(() => {
			if (i < command.length) {
				setTyped(command.slice(0, i + 1))
				i++
			} else {
				clearInterval(interval)
				revealTimeout.current = setTimeout(() => setShowName(true), 300)
			}
		}, 80)
		return () => {
			clearInterval(interval)
			clearTimeout(revealTimeout.current)
		}
	}, [])

	return (
		<ModulePanel title="CORE_IDENTITY" status="ONLINE" delay={delay}>
			<div className="flex flex-col items-center gap-6 py-4 text-center lg:py-8">
				{/* Terminal prompt */}
				<div className="w-full max-w-md rounded border border-sys-border bg-sys-bg/80 px-4 py-2.5">
					<div className="flex items-center gap-2 font-mono text-sm">
						<span className="text-sys-green">root@smyile</span>
						<span className="text-sys-text-dim">:</span>
						<span className="text-sys-accent">~$</span>
						<span className="text-sys-text">{typed}</span>
						{!showName && <span className="cursor-blink" />}
					</div>
				</div>

				{/* Post-whoami content — morphs in */}
				<AnimatePresence>
					{showName && (
						<motion.div
							key="hero-reveal"
							initial={{ height: 0, opacity: 0 }}
							animate={{ height: "auto", opacity: 1 }}
							transition={{ duration: 0.5, ease: "easeOut" }}
							className="w-full overflow-hidden"
						>
							<motion.div
								className="flex flex-col items-center gap-6 text-center"
								variants={stagger}
								initial="hidden"
								animate="visible"
							>
								<motion.h1
									variants={fadeUp}
									className="glitch-text font-display text-4xl font-semibold tracking-[0.3em] text-sys-accent lg:text-6xl"
								>
									{IDENTITY.name}
								</motion.h1>

								<motion.div variants={fadeUp} className="flex flex-col items-center gap-2">
									<p className="font-mono text-sm tracking-wider text-sys-text-dim">
										{">"} {IDENTITY.role}
									</p>
								</motion.div>

								{/* CTA links */}
								<motion.div variants={fadeUp} className="flex flex-wrap justify-center gap-2">
									{SOCIAL_LINKS.map((link) => (
										<a
											key={link.label}
											href={link.url}
											target="_blank"
											rel="noopener noreferrer"
											className="border border-sys-accent/30 px-4 py-1.5 font-mono text-xs tracking-[0.15em] text-sys-accent transition-all hover:border-sys-accent hover:bg-sys-accent/10 hover:shadow-[0_0_12px_rgba(137,207,240,0.15)]"
										>
											{">> "}
											{link.label.toUpperCase()}
										</a>
									))}
								</motion.div>

								{/* Projects */}
								<motion.div variants={fadeUp} className="mt-4 w-full max-w-md">
									<div className="mb-2 text-center font-mono text-[0.8rem] tracking-[0.15em] text-sys-text-dim">
										[ PROJECTS ]
									</div>
									<div className="flex flex-col gap-1 text-left">
										{PROJECTS.map((project) => (
											<a
												key={project.name}
												href={project.url}
												target="_blank"
												rel="noopener noreferrer"
												className="group flex items-center justify-between border-b border-sys-border/50 py-1.5 transition-colors"
											>
												<div className="flex flex-col gap-0.5">
													<span className="font-mono text-xs tracking-[0.15em] text-sys-text transition-colors group-hover:text-sys-accent">
														{project.name}
													</span>
													<span className="font-barlow text-sm text-sys-text-dim">
														{project.description}
													</span>
												</div>
												<span className="font-mono text-[0.8rem] tracking-wider text-sys-text-dim transition-colors group-hover:text-sys-green">
													ACTIVE
												</span>
											</a>
										))}
										<div className="flex items-center justify-between border-b border-sys-border/50 py-1.5">
											<span className="font-mono text-xs tracking-[0.15em] text-sys-text-dim">
												████████
											</span>
											<span className="font-mono text-[0.8rem] tracking-wider text-sys-magenta">
												CLASSIFIED
											</span>
										</div>
									</div>
								</motion.div>
							</motion.div>
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		</ModulePanel>
	)
}
