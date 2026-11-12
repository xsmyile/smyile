import { NETWORK, PROJECTS, type Project, type ProjectStatus, SOCIAL_LINKS } from "../lib/constants"

const STATUS_LABELS: Record<ProjectStatus, string> = {
	development: "in development",
	live: "live",
	shipping: "shipping",
	archived: "archived",
}

function host(url: string): string {
	return url.replace(/^https?:\/\//, "").replace(/\/$/, "")
}

function ProjectLink({ project }: { project: Project }) {
	if (!project.online) return <span className="text-xs text-faint">{host(project.url)}</span>
	return (
		<a href={project.url} target="_blank" rel="noopener noreferrer" className="link">
			{host(project.url)}
		</a>
	)
}

export function ProjectList() {
	const [featured, ...rest] = PROJECTS
	return (
		<section
			aria-label="Projects"
			data-quiet=""
			className="flex w-full max-w-[400px] flex-col gap-3.5 text-[13px]"
		>
			<article className="flex flex-col gap-0.5 border-b border-line pb-3">
				<div className="flex items-baseline justify-between gap-3">
					<h2 className="text-lg font-medium">{featured.name}</h2>
					<span className="flex items-center gap-2 text-xs text-muted">
						<span className="size-1.5 rounded-full bg-ink" />
						{STATUS_LABELS[featured.status]}
					</span>
				</div>
				<p className="text-muted">{featured.description}.</p>
				<ProjectLink project={featured} />
			</article>
			{rest.map((project) => (
				<div key={project.id} className="flex justify-between gap-3">
					<span title={project.description}>
						{project.name}
						<span className="sr-only">: {project.description}</span>
					</span>
					<ProjectLink project={project} />
				</div>
			))}
		</section>
	)
}

export function Elsewhere() {
	const orgs = NETWORK.flatMap((node) => {
		const web = node.links.find((link) => link.kind === "web")
		return web ? [{ id: node.id, label: node.label, url: web.url }] : []
	})
	return (
		<nav
			aria-label="Elsewhere"
			data-quiet=""
			className="flex flex-col gap-1 text-[13px] sm:items-end sm:text-right"
		>
			<span>
				{orgs.map((org, i) => (
					<span key={org.id}>
						{i > 0 && <span className="text-muted"> · </span>}
						<a href={org.url} target="_blank" rel="noopener noreferrer" className="link">
							{org.label}
						</a>
					</span>
				))}
			</span>
			<span>
				{SOCIAL_LINKS.map((link, i) => (
					<span key={link.label}>
						{i > 0 && <span className="text-muted"> · </span>}
						<a href={link.url} target="_blank" rel="noopener noreferrer" className="link">
							{link.label}
						</a>
					</span>
				))}
			</span>
		</nav>
	)
}
