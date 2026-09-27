export const GITHUB_USERNAME = "xsmyile"
export const SITE_VERSION = __APP_VERSION__

export const IDENTITY = {
	name: "Smyile",
	role: "Software Engineer / AI",
} as const

export type ProjectStatus = "shipping" | "live" | "archived"

export type Project = {
	id: string
	name: string
	status: ProjectStatus
	stack: string
	url: string
	description: string
	repo: string
}

export const PROJECTS: readonly Project[] = [
	{
		id: "sissy",
		name: "SISSY",
		status: "shipping",
		stack: "Swift · brew cask",
		url: "https://sissy.smyile.com",
		description: "The numbers you keep checking, in the macOS menu bar",
		repo: "xsmyile/sissy",
	},
	{
		id: "overbot",
		name: "OVERBOT",
		status: "live",
		stack: "Discord",
		url: "https://overbot.net",
		description: "Discord bot for Overwatch 2 stats and rankings",
		repo: "xsmyile/overbot",
	},
	{
		id: "rustmail",
		name: "RUSTMAIL",
		status: "shipping",
		stack: "Rust · nvim plugin",
		url: "https://rustmail.app",
		description: "Self-hosted SMTP mail catcher with web UI",
		repo: "rustmailapp/rustmail",
	},
]

export const ARCHIVED_PROJECTS: readonly Project[] = [
	{
		id: "pygicord",
		name: "PYGICORD",
		status: "archived",
		stack: "Python",
		url: "https://pypi.org/project/pygicord/",
		description: "Pagination wrapper for discord.py",
		repo: "xsmyile/pygicord",
	},
	{
		id: "tmux-ccradar",
		name: "TMUX-CCRADAR",
		status: "archived",
		stack: "Shell",
		url: "https://github.com/xsmyile/tmux-ccradar",
		description: "Claude Code status in the tmux status bar",
		repo: "xsmyile/tmux-ccradar",
	},
	{
		id: "pathfinding-visualizer",
		name: "PATHFINDING-VISUALIZER",
		status: "archived",
		stack: "Python · pygame",
		url: "https://github.com/xsmyile/pathfinding-visualizer",
		description: "Dijkstra, A*, BFS and DFS drawn step by step",
		repo: "xsmyile/pathfinding-visualizer",
	},
]

export const SOCIAL_LINKS = [
	{ label: "GitHub", url: `https://github.com/${GITHUB_USERNAME}` },
	{ label: "Hugging Face", url: "https://huggingface.co/smyile" },
	{ label: "Steam", url: "https://steamcommunity.com/id/Smyile/" },
] as const

export const SPECIALIZATIONS = [
	"Systems Architecture",
	"Reverse Engineering",
	"LLM Fine-Tuning",
	"Model Training & Optimization",
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
		label: "RADON FORGE",
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
		label: "OBLIO LABS",
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
