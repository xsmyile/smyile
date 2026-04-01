export const GITHUB_USERNAME = "xsmyile"
export const SITE_VERSION = "0.5.3"

export const IDENTITY = {
	name: "Smyile",
	role: "Software Engineer",
	timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
} as const

export const PROJECTS = [
	{
		name: "RUSTMAIL",
		url: "https://github.com/rustmailapp/rustmail",
		description: "Self-hosted SMTP mail catcher with web UI",
		repo: "rustmailapp/rustmail",
	},
	{
		name: "OVERBOT",
		url: "https://overbot.net",
		description: "Discord bot for Overwatch 2 stats and rankings",
		repo: "xsmyile/overbot",
	},
	{
		name: "MIZU",
		url: "https://mizu.davidet.com",
		description: "Smart watering system",
		repo: "mizu-systems/mizu-web",
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
	{ name: "Neural Architecture Design", color: "#38bdf8" },
	{ name: "Model Training & Optimization", color: "#f472b6" },
] as const

export const ORGANIZATIONS = [
	{ name: "obliolabs", url: "https://github.com/obliolabs", platform: "github" },
	{ name: "radonforge", url: "https://github.com/radonforge", platform: "github" },
	{ name: "rustmailapp", url: "https://github.com/rustmailapp", platform: "github" },
	{ name: "obliolabs", url: "https://huggingface.co/obliolabs", platform: "huggingface" },
] as const

export const STATUS = {
	currentProject: "smyile",
} as const
