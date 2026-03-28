import { AnimatePresence, motion } from "framer-motion"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useState } from "react"
import { useBootSequence } from "../hooks/use-boot-sequence"
import { useGitHub } from "../hooks/use-github"
import { useMediaQuery } from "../hooks/use-media-query"
import { BootSequence } from "./boot-sequence"
import { CyberBackground } from "./cyber-background"
import { ActivityStream } from "./modules/activity-stream"
import { GithubStats } from "./modules/github-stats"
import { HeroModule } from "./modules/hero-module"
import { SocialModule } from "./modules/social-module"
import { SpecsModule } from "./modules/specs-module"
import { StatusModule } from "./modules/status-module"
import { SystemLog } from "./modules/system-log"

const DRAWER_SPRING = { type: "spring", damping: 26, stiffness: 220 } as const

const GLASS = "border-[#1a1a1a] bg-[rgba(8,8,12,0.65)] backdrop-blur-[4px]"

export function DashboardLayout() {
	const { phase, visibleLogs, skip } = useBootSequence()
	const github = useGitHub()
	const isDesktop = useMediaQuery("(min-width: 1024px)")
	const [leftOpen, setLeftOpen] = useState(false)
	const [rightOpen, setRightOpen] = useState(false)

	const leftContent = (baseDelay: number) => (
		<>
			<GithubStats
				user={github.user}
				totalStars={github.totalStars}
				loading={github.loading}
				delay={baseDelay}
			/>
			<ActivityStream events={github.events} loading={github.loading} delay={baseDelay + 100} />
			<SocialModule delay={baseDelay + 200} />
		</>
	)

	const rightContent = (baseDelay: number) => (
		<>
			<SystemLog github={github} delay={baseDelay} />
			<StatusModule
				latestRelease={github.latestRelease}
				cached={github.cached}
				delay={baseDelay + 100}
			/>
			<SpecsModule delay={baseDelay + 200} />
		</>
	)

	return (
		<>
			<BootSequence phase={phase} logs={visibleLogs} onSkip={skip} />

			<div className="scanlines relative min-h-screen w-full">
				<CyberBackground />

				<div className="isolate mx-auto flex min-h-screen w-full max-w-[1400px] flex-col gap-3 p-3 md:p-4 lg:grid lg:grid-cols-[280px_1fr_300px]">
					{isDesktop && <div className="flex flex-col gap-3">{leftContent(100)}</div>}
					<div className="flex flex-col gap-3">
						<HeroModule delay={0} />
					</div>
					{isDesktop && <div className="flex flex-col gap-3">{rightContent(50)}</div>}
				</div>

				{/* Left drawer (mobile only) */}
				<AnimatePresence>
					{leftOpen && (
						<>
							<motion.div
								key="left-backdrop"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								transition={{ duration: 0.2 }}
								className="fixed inset-0 z-40 bg-black/20 lg:hidden"
								onClick={() => setLeftOpen(false)}
							/>
							<motion.aside
								key="left-drawer"
								initial={{ x: "-100%" }}
								animate={{ x: 0 }}
								exit={{ x: "-100%" }}
								transition={DRAWER_SPRING}
								className={`fixed inset-y-0 left-0 z-40 flex w-[280px] flex-col gap-3 overflow-y-auto border-r p-3 lg:hidden ${GLASS}`}
							>
								{leftContent(0)}
							</motion.aside>
						</>
					)}
				</AnimatePresence>

				{/* Right drawer (mobile only) */}
				<AnimatePresence>
					{rightOpen && (
						<>
							<motion.div
								key="right-backdrop"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								transition={{ duration: 0.2 }}
								className="fixed inset-0 z-40 bg-black/20 lg:hidden"
								onClick={() => setRightOpen(false)}
							/>
							<motion.aside
								key="right-drawer"
								initial={{ x: "100%" }}
								animate={{ x: 0 }}
								exit={{ x: "100%" }}
								transition={DRAWER_SPRING}
								className={`fixed inset-y-0 right-0 z-40 flex w-[300px] flex-col gap-3 overflow-y-auto border-l p-3 lg:hidden ${GLASS}`}
							>
								{rightContent(0)}
							</motion.aside>
						</>
					)}
				</AnimatePresence>

				{/* Floating toolbar (mobile only) */}
				<div
					className={`fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-full border px-3 py-2 lg:hidden ${GLASS}`}
				>
					<button
						type="button"
						aria-label="Toggle left panel"
						onClick={() => setLeftOpen((v) => !v)}
						className="rounded-full p-1.5 transition-colors hover:bg-white/5"
					>
						<ChevronLeft className="h-4 w-4 text-sys-accent" />
					</button>
					<button
						type="button"
						aria-label="Toggle right panel"
						onClick={() => setRightOpen((v) => !v)}
						className="rounded-full p-1.5 transition-colors hover:bg-white/5"
					>
						<ChevronRight className="h-4 w-4 text-sys-accent" />
					</button>
				</div>
			</div>
		</>
	)
}
