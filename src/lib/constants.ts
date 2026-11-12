export const GITHUB_USERNAME = "xsmyile"
export const SITE_VERSION = __APP_VERSION__

export const IDENTITY = {
	name: "Smyile",
	role: "Software Engineer",
} as const

export type ProjectStatus = "development" | "shipping" | "live" | "archived"

export type Project = {
	id: string
	name: string
	status: ProjectStatus
	stack: string
	url: string
	description: string
	repo: string | null
	online: boolean
}

export const PROJECTS: readonly Project[] = [
	{
		id: "blackbird",
		name: "Blackbird",
		status: "development",
		stack: "Rust · Swift",
		url: "https://blackbird.codes",
		description: "Drive your coding agents from your iPhone and your Mac",
		repo: null,
		online: false,
	},
	{
		id: "overbot",
		name: "Overbot",
		status: "live",
		stack: "Discord",
		url: "https://overbot.net",
		description: "Discord bot for Overwatch 2 stats and rankings",
		repo: "xsmyile/overbot",
		online: true,
	},
	{
		id: "rustmail",
		name: "Rustmail",
		status: "shipping",
		stack: "Rust · nvim plugin",
		url: "https://rustmail.app",
		description: "Self-hosted SMTP mail catcher with web UI",
		repo: "rustmailapp/rustmail",
		online: true,
	},
	{
		id: "sissy",
		name: "Sissy",
		status: "shipping",
		stack: "Swift · brew cask",
		url: "https://sissy.smyile.com",
		description: "The numbers you keep checking, in the macOS menu bar",
		repo: "xsmyile/sissy",
		online: true,
	},
]

export const ARCHIVED_PROJECTS: readonly Project[] = [
	{
		id: "pygicord",
		name: "Pygicord",
		status: "archived",
		stack: "Python",
		url: "https://pypi.org/project/pygicord/",
		description: "Pagination wrapper for discord.py",
		repo: "xsmyile/pygicord",
		online: true,
	},
	{
		id: "tmux-ccradar",
		name: "tmux-ccradar",
		status: "archived",
		stack: "Shell",
		url: "https://github.com/xsmyile/tmux-ccradar",
		description: "Claude Code status in the tmux status bar",
		repo: "xsmyile/tmux-ccradar",
		online: true,
	},
	{
		id: "pathfinding-visualizer",
		name: "pathfinding-visualizer",
		status: "archived",
		stack: "Python · pygame",
		url: "https://github.com/xsmyile/pathfinding-visualizer",
		description: "Dijkstra, A*, BFS and DFS drawn step by step",
		repo: "xsmyile/pathfinding-visualizer",
		online: true,
	},
]

export const SOCIAL_LINKS = [
	{ label: "GitHub", url: `https://github.com/${GITHUB_USERNAME}` },
	{ label: "Hugging Face", url: "https://huggingface.co/smyile" },
	{ label: "Steam", url: "https://steamcommunity.com/id/Smyile/" },
] as const

export type NetworkLinkKind = "web" | "github" | "huggingface"

export type NetworkNode = {
	id: string
	label: string
	role: string
	tagline: string
	parent: string | null
	links: readonly { kind: NetworkLinkKind; url: string }[]
}

export const NETWORK: readonly NetworkNode[] = [
	{
		id: "radonforge",
		label: "Radon Forge",
		role: "studio",
		tagline: "Independent studio.",
		parent: null,
		links: [
			{ kind: "web", url: "https://radonforge.com" },
			{ kind: "github", url: "https://github.com/radonforge" },
		],
	},
	{
		id: "obliolabs",
		label: "Oblio Labs",
		role: "research",
		tagline: "Measuring what models forget.",
		parent: "radonforge",
		links: [
			{ kind: "web", url: "https://obliolabs.com" },
			{ kind: "github", url: "https://github.com/obliolabs" },
			{ kind: "huggingface", url: "https://huggingface.co/obliolabs" },
		],
	},
]

export const STAR_SOURCE_ORGS = ["radonforge", "obliolabs", "rustmailapp"] as const

export const ACTIVITY_OWNERS: ReadonlySet<string> = new Set([GITHUB_USERNAME, ...STAR_SOURCE_ORGS])
