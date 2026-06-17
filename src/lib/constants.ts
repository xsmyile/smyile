export const GITHUB_USERNAME = "xsmyile"
export const SITE_VERSION = __APP_VERSION__

export const IDENTITY = {
	name: "Smyile",
	role: "Software Engineer",
	timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
} as const

export const PROJECTS = [
	{
		name: "SISSY",
		url: "https://github.com/xsmyile/sissy",
		description: "Menubar cat tracking AI-coding token spend",
		repo: "xsmyile/sissy",
	},
	{
		name: "RUSTMAIL",
		url: "https://rustmail.app",
		description: "Self-hosted SMTP mail catcher with web UI",
		repo: "rustmailapp/rustmail",
	},
	{
		name: "MIZUHUB",
		url: "https://mizuhub.com",
		description: "Smart watering system",
		repo: "mizu-systems/mizu-web",
	},
	{
		name: "OVERBOT",
		url: "https://overbot.net",
		description: "Discord bot for Overwatch 2 stats and rankings",
		repo: "xsmyile/overbot",
	},
] as const

export const SOCIAL_LINKS = [
	{ label: "GitHub", url: `https://github.com/${GITHUB_USERNAME}` },
	{ label: "Hugging Face", url: "https://huggingface.co/smyile" },
	{ label: "Steam", url: "https://steamcommunity.com/id/Smyile/" },
] as const

export const SPECIALIZATIONS = [
	{ name: "Systems Architecture", color: "#00ff88" },
	{ name: "Reverse Engineering", color: "#ff0080" },
	{ name: "LLM Fine-Tuning", color: "#c084fc" },
	{ name: "Model Training & Optimization", color: "#f472b6" },
] as const

export const ORGANIZATIONS = [
	{ name: "obliolabs", url: "https://github.com/obliolabs", platform: "github", showcase: true },
	{ name: "radonforge", url: "https://github.com/radonforge", platform: "github", showcase: true },
	{
		name: "rustmailapp",
		url: "https://github.com/rustmailapp",
		platform: "github",
		showcase: false,
	},
	{
		name: "obliolabs",
		url: "https://huggingface.co/obliolabs",
		platform: "huggingface",
		showcase: true,
	},
] as const

export const STATUS = {
	currentProject: "smyile",
} as const
