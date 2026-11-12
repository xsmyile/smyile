import type { ReactNode } from "react"
import { NETWORK, PROJECTS, type Project, type ProjectStatus, SOCIAL_LINKS } from "../lib/constants"
import { displayHost } from "../lib/url"

const STATUS_LABELS: Record<ProjectStatus, string> = {
	development: "in development",
	live: "live",
	shipping: "shipping",
	archived: "archived",
}

type LinkItem = { key: string; label: string; url: string }

function ExternalLink({ url, children }: { url: string; children: ReactNode }) {
	return (
		<a href={url} target="_blank" rel="noopener noreferrer" className="link">
			{children}
		</a>
	)
}

function LinkRow({ items }: { items: readonly LinkItem[] }) {
	return (
		<span>
			{items.map((item, i) => (
				<span key={item.key}>
					{i > 0 && <span className="text-muted"> · </span>}
					<ExternalLink url={item.url}>{item.label}</ExternalLink>
				</span>
			))}
		</span>
	)
}

function ProjectLink({ project }: { project: Project }) {
	const label = displayHost(project.url)
	if (!project.online) return <span className="text-xs text-faint">{label}</span>
	return <ExternalLink url={project.url}>{label}</ExternalLink>
}

export function ProjectList() {
	const [featured, ...rest] = PROJECTS
	return (
		<section
			aria-label="Projects"
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
		return web ? [{ key: node.id, label: node.label, url: web.url }] : []
	})
	const social = SOCIAL_LINKS.map((link) => ({ key: link.label, label: link.label, url: link.url }))
	return (
		<nav
			aria-label="Elsewhere"
			className="flex flex-col gap-1 text-[13px] sm:items-end sm:text-right"
		>
			<LinkRow items={orgs} />
			<LinkRow items={social} />
		</nav>
	)
}
