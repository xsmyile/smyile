import { NETWORK, type NetworkNode, PROJECTS, type Project } from "../lib/constants"

const STATUS_CLASSES: Record<Project["status"], string> = {
	shipping: "text-sys-green",
	live: "text-sys-cyan",
	archived: "text-sys-text-dim",
}

const LINK_LABELS: Record<NetworkNode["links"][number]["kind"], (url: string) => string> = {
	web: (url) => url.replace(/^https?:\/\//, ""),
	github: (url) => `github/${url.split("/").pop()}`,
	huggingface: (url) => `huggingface/${url.split("/").pop()}`,
}

function SectionLabel({ children }: { children: string }) {
	return (
		<div className="mb-4.5 font-mono text-[0.66rem] tracking-[0.2em] text-sys-text-dim uppercase">
			{"// "}
			{children}
		</div>
	)
}

function ProjectRow({ project }: { project: Project }) {
	return (
		<div className="grid grid-cols-[1fr_auto] gap-x-4.5 gap-y-1.5 border-b border-sys-border py-4.5 first:border-t">
			<h3 className="font-display text-[1.05rem] leading-tight font-semibold tracking-[0.22em]">
				{project.name}
			</h3>
			<span
				className={`border border-current px-1.75 py-1.25 font-mono text-[0.62rem] leading-none tracking-[0.16em] uppercase ${STATUS_CLASSES[project.status]}`}
			>
				{project.status}
			</span>
			<p className="col-span-full font-barlow text-[1.05rem] leading-snug text-sys-text-soft">
				{project.description}.
			</p>
			<div className="col-span-full flex flex-wrap gap-x-4 gap-y-1 font-mono text-[0.72rem] text-sys-text-dim">
				<span>{project.stack}</span>
				<a
					href={project.url}
					target="_blank"
					rel="noopener noreferrer"
					className="text-sys-accent hover:underline"
				>
					{LINK_LABELS.web(project.url)} ↗
				</a>
			</div>
		</div>
	)
}

function NetworkEntry({ node }: { node: NetworkNode }) {
	const children = NETWORK.filter((n) => n.parent === node.id)
	return (
		<div className="grid gap-5.5">
			<div
				className={`grid gap-1.5 ${node.parent ? "ml-1.5 border-l border-sys-border-strong pl-5.5" : ""}`}
			>
				<h3
					className={`flex items-center gap-2.5 font-display text-sm font-semibold tracking-[0.2em] ${node.parent ? "" : "text-sys-accent"}`}
				>
					{node.label}
					{node.parent && (
						<span className="border border-current px-1.75 py-1.25 font-mono text-[0.62rem] leading-none tracking-[0.16em] text-sys-violet uppercase">
							{node.role}
						</span>
					)}
				</h3>
				<p className="font-barlow text-base leading-snug text-sys-text-soft">{node.tagline}</p>
				<div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[0.72rem] font-medium">
					{node.links.map((link) => (
						<a
							key={link.url}
							href={link.url}
							target="_blank"
							rel="noopener noreferrer"
							className="text-sys-accent hover:underline"
						>
							{LINK_LABELS[link.kind](link.url)} ↗
						</a>
					))}
				</div>
			</div>
			{children.map((child) => (
				<NetworkEntry key={child.id} node={child} />
			))}
		</div>
	)
}

export function SignalSections() {
	return (
		<div className="grid border-t border-sys-border min-[900px]:grid-cols-[1.4fr_1fr]">
			<section className="p-[clamp(24px,4vw,44px)]">
				<SectionLabel>projects</SectionLabel>
				<div className="grid">
					{PROJECTS.map((project) => (
						<ProjectRow key={project.id} project={project} />
					))}
				</div>
			</section>
			<section className="border-t border-sys-border p-[clamp(24px,4vw,44px)] min-[900px]:border-t-0 min-[900px]:border-l">
				<SectionLabel>network</SectionLabel>
				{NETWORK.filter((n) => n.parent === null).map((node) => (
					<NetworkEntry key={node.id} node={node} />
				))}
			</section>
		</div>
	)
}
