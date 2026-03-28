import { useBootSequence } from "../hooks/use-boot-sequence"
import { useGitHub } from "../hooks/use-github"
import { BootSequence } from "./boot-sequence"
import { CyberBackground } from "./cyber-background"
import { ActivityStream } from "./modules/activity-stream"
import { GithubStats } from "./modules/github-stats"
import { HeroModule } from "./modules/hero-module"
import { SocialModule } from "./modules/social-module"
import { SpecsModule } from "./modules/specs-module"
import { StatusModule } from "./modules/status-module"
import { SystemLog } from "./modules/system-log"

export function DashboardLayout() {
	const { phase, visibleLogs, skip } = useBootSequence()
	const github = useGitHub()

	return (
		<>
			<BootSequence phase={phase} logs={visibleLogs} onSkip={skip} />

			<div className="scanlines relative min-h-screen w-full">
				<CyberBackground />

				<div className="isolate mx-auto grid min-h-screen w-full max-w-[1400px] grid-cols-1 gap-3 p-3 md:p-4 lg:grid-cols-[280px_1fr_300px]">
					{/* Left column — passive modules */}
					<div className="order-3 flex flex-col gap-3 lg:order-1">
						<GithubStats
							user={github.user}
							totalStars={github.totalStars}
							loading={github.loading}
							delay={100}
						/>
						<ActivityStream events={github.events} loading={github.loading} delay={200} />
						<SocialModule delay={300} />
					</div>

					{/* Center column — core */}
					<div className="order-1 flex flex-col gap-3 lg:order-2">
						<HeroModule delay={0} />
					</div>

					{/* Right column — runtime */}
					<div className="order-2 flex flex-col gap-3 lg:order-3">
						<SystemLog github={github} delay={50} />
						<StatusModule latestRelease={github.latestRelease} cached={github.cached} delay={150} />
						<SpecsModule delay={250} />
					</div>
				</div>
			</div>
		</>
	)
}
