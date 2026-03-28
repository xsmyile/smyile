import { useEffect, useState } from "react"
import { IDENTITY, ORGANIZATIONS, PROJECTS, SOCIAL_LINKS } from "../../lib/constants"
import { ModulePanel } from "../module-panel"

type Props = {
	delay?: number
}

export function HeroModule({ delay = 0 }: Props) {
	const [typed, setTyped] = useState("")
	const [showName, setShowName] = useState(false)
	const command = "whoami"

	useEffect(() => {
		let i = 0
		const interval = setInterval(() => {
			if (i < command.length) {
				setTyped(command.slice(0, i + 1))
				i++
			} else {
				clearInterval(interval)
				setTimeout(() => setShowName(true), 300)
			}
		}, 80)
		return () => clearInterval(interval)
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

				{/* Name with glitch */}
				{showName && (
					<>
						<h1 className="glitch-text font-michroma text-4xl tracking-[0.3em] text-sys-accent lg:text-6xl">
							{IDENTITY.name}
						</h1>

						<div className="flex flex-col items-center gap-2">
							<p className="font-mono text-sm tracking-wider text-sys-text-dim">
								{">"} {IDENTITY.role}
							</p>
							<p className="max-w-sm font-barlow text-base leading-relaxed tracking-wide text-sys-text-dim">
								{IDENTITY.bio}
							</p>
						</div>

						{/* CTA links */}
						<div className="flex flex-wrap justify-center gap-2">
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
						</div>

						{/* Projects */}
						<div className="mt-4 w-full max-w-md text-left">
							<div className="mb-2 font-mono text-[0.8rem] tracking-[0.15em] text-sys-text-dim">
								[ DEPLOYED_SYSTEMS ]
							</div>
							<div className="flex flex-col gap-1">
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
											<span className="font-barlow text-[0.8rem] text-sys-text-dim">
												{project.description}
											</span>
										</div>
										<span className="font-mono text-[0.8rem] tracking-wider text-sys-text-dim transition-colors group-hover:text-sys-green">
											ACTIVE
										</span>
									</a>
								))}
							</div>
						</div>

						{/* Organizations */}
						<div className="mt-2 w-full max-w-md text-left">
							<div className="mb-2 font-mono text-[0.8rem] tracking-[0.15em] text-sys-text-dim">
								[ ORGANIZATIONS ]
							</div>
							<div className="flex flex-col gap-1">
								{ORGANIZATIONS.map((org) => (
									<a
										key={org.name}
										href={org.url}
										target="_blank"
										rel="noopener noreferrer"
										className="group flex items-center justify-between border-b border-sys-border/50 py-1.5 transition-colors"
									>
										<span className="font-mono text-xs tracking-[0.15em] text-sys-text transition-colors group-hover:text-sys-accent">
											github.com/{org.name}
										</span>
										<span className="font-mono text-[0.8rem] tracking-wider text-sys-text-dim transition-colors group-hover:text-sys-accent">
											→
										</span>
									</a>
								))}
							</div>
						</div>
					</>
				)}
			</div>
		</ModulePanel>
	)
}
