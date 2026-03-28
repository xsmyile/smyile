export const GITHUB_USERNAME = "xsmyile"
export const SITE_VERSION = "0.5.0"

export const IDENTITY = {
	name: "Smyile",
	role: "Software Engineer",
	bio: "Building tools, breaking systems, shipping code.",
	timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
} as const

export const PROJECTS = [
	{
		name: "RUSTMAIL",
		url: "https://github.com/rustmailapp/rustmail",
		description: "Email infrastructure in Rust",
		repo: "rustmailapp/rustmail",
	},
	{
		name: "OVERBOT",
		url: "https://overbot.net",
		description: "Overwatch stats and tracking bot",
		repo: "xsmyile/overbot",
	},
	{
		name: "MIZU",
		url: "https://mizu.davidet.com",
		description: "Water tracking app",
		repo: "mizu-systems/mizu-web",
	},
] as const

export const SOCIAL_LINKS = [
	{ label: "GitHub", url: `https://github.com/${GITHUB_USERNAME}` },
	{ label: "Steam", url: "https://steamcommunity.com/id/Smyile/" },
] as const

export const SPECIALIZATIONS = [
	{ name: "Python", color: "#00d4ff" },
	{ name: "TypeScript", color: "#89CFF0" },
	{ name: "Reverse Engineering", color: "#ff0080" },
	{ name: "Systems Architecture", color: "#00ff88" },
	{ name: "AI & Machine Learning", color: "#ffaa00" },
] as const

export const ORGANIZATIONS = [
	{ name: "radonforge", url: "https://github.com/radonforge" },
	{ name: "rustmailapp", url: "https://github.com/rustmailapp" },
] as const

export const STATUS = {
	currentProject: "smyile",
	currentFocus: "system interface redesign",
} as const
