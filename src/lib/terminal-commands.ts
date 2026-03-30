import { IDENTITY, ORGANIZATIONS, PROJECTS, SITE_VERSION, SPECIALIZATIONS } from "./constants"
import type { GitHubEvent, GitHubUser } from "./github-api"
import { getVisitorId } from "./visitor-id"

export type OutputLine = {
	text: string
	color?: string
	image?: string
}

export const ALLOWED_IMAGES = new Set(["/claude.png"])

export type TerminalContext = {
	user: GitHubUser | null
	totalStars: number
	events: GitHubEvent[]
	uptime: string
}

const LAST_LOGIN_KEY = `smyile_${SITE_VERSION}_last_login`

function formatLoginDate(date: Date): string {
	return date.toLocaleString("en-US", {
		weekday: "short",
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hour12: false,
	})
}

export function getWelcomeMessage(): OutputLine[] {
	let lastLogin: string | null = null
	try {
		lastLogin = localStorage.getItem(LAST_LOGIN_KEY)
	} catch {}

	const displayDate = lastLogin ? new Date(lastLogin) : new Date()
	const loginLine = `Last login: ${formatLoginDate(displayDate)} on ttys040`

	try {
		localStorage.setItem(LAST_LOGIN_KEY, new Date().toISOString())
	} catch {}

	return [
		{ text: loginLine },
		{ text: 'Type "help" to list available commands.', color: "var(--color-sys-text-dim)" },
	]
}

type CommandHandler = (args: string, ctx: TerminalContext) => OutputLine[]

const COMMANDS: Record<string, CommandHandler> = {
	help: () => [
		{ text: "Available commands:", color: "var(--color-sys-accent)" },
		{ text: "  help             show this message" },
		{ text: "  whoami           display visitor identity" },
		{ text: "  ls projects      list active projects" },
		{ text: "  cat <project>    show project details" },
		{ text: "  stats            github statistics" },
		{ text: "  uptime           session uptime" },
		{ text: "  neofetch         system information" },
		{ text: "  ping <project>   check project status" },
		{ text: "  clear            clear terminal" },
	],

	whoami: () => {
		const id = getVisitorId()
		const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
		return [
			{ text: `visitor_id: ${id}`, color: "var(--color-sys-accent)" },
			{ text: `user_agent: ${navigator.userAgent.slice(0, 60)}...` },
			{ text: `language:   ${navigator.language}` },
			{ text: `timezone:   ${tz}` },
			{ text: `resolution: ${screen.width}x${screen.height}` },
		]
	},

	ls: (args) => {
		if (args.trim().toLowerCase() === "projects") {
			return PROJECTS.map((p) => ({
				text: `  ${p.name.padEnd(12)} ${p.description}`,
			}))
		}
		return [
			{
				text: `ls: cannot access '${args.trim().slice(0, 40)}': No such file or directory`,
				color: "var(--color-sys-magenta)",
			},
		]
	},

	cat: (args) => {
		const name = args.trim().toUpperCase()
		const project = PROJECTS.find((p) => p.name === name)
		if (!project) {
			return [
				{
					text: `cat: ${args.trim().slice(0, 40) || "?"}: No such file or directory`,
					color: "var(--color-sys-magenta)",
				},
			]
		}
		return [
			{ text: project.name, color: "var(--color-sys-accent)" },
			{ text: `  ${project.description}` },
			{ text: `  repo: ${project.repo}` },
			{ text: `  url:  ${project.url}`, color: "var(--color-sys-cyan)" },
		]
	},

	stats: (_args, ctx) => {
		if (!ctx.user) return [{ text: "fetching...", color: "var(--color-sys-amber)" }]
		return [
			{ text: "GITHUB STATISTICS", color: "var(--color-sys-accent)" },
			{ text: `  repos:     ${ctx.user.public_repos}` },
			{ text: `  stars:     ${ctx.totalStars}`, color: "var(--color-sys-amber)" },
			{ text: `  followers: ${ctx.user.followers}` },
			{ text: `  events:    ${ctx.events.length} recent` },
		]
	},

	uptime: (_args, ctx) => [
		{ text: `session uptime: ${ctx.uptime}`, color: "var(--color-sys-green)" },
	],

	neofetch: (_args, ctx) => {
		const specs = SPECIALIZATIONS.map((s) => s.name).join(", ")
		const orgs = ORGANIZATIONS.map((o) => o.name).join(", ")
		return [
			{ text: "  smyile@blackbird", color: "var(--color-sys-accent)" },
			{ text: "  ─────────────────" },
			{ text: `  role:    ${IDENTITY.role}` },
			{ text: `  version: v${SITE_VERSION}` },
			{ text: `  uptime:  ${ctx.uptime}` },
			{ text: `  repos:   ${ctx.user?.public_repos ?? "?"}` },
			{ text: `  stars:   ${ctx.totalStars}`, color: "var(--color-sys-amber)" },
			{ text: `  skills:  ${specs}` },
			{ text: `  orgs:    ${orgs}` },
			{ text: `  tz:      ${IDENTITY.timezone}` },
		]
	},

	ping: (args) => {
		const name = args.trim().toUpperCase()
		const project = PROJECTS.find((p) => p.name === name)
		if (!project) {
			return [
				{
					text: `ping: unknown host '${args.trim().slice(0, 40) || "?"}'`,
					color: "var(--color-sys-magenta)",
				},
			]
		}
		const ms = Math.floor(Math.random() * 30) + 5
		return [
			{ text: `PING ${project.name.toLowerCase()} (${project.url})` },
			{ text: `64 bytes: time=${ms}ms`, color: "var(--color-sys-green)" },
			{ text: `--- ${project.name.toLowerCase()} ping statistics ---` },
			{ text: `1 packet transmitted, 1 received, 0% packet loss` },
		]
	},

	claude: () => [{ text: "", image: "/claude.png" }],

	secret: () => [
		{ text: "ACCESS GRANTED", color: "var(--color-sys-green)" },
		{ text: "" },
		{ text: "  > the cake is a lie" },
		{ text: "  > but the code is real", color: "var(--color-sys-accent)" },
	],
}

export function executeCommand(
	input: string,
	ctx: TerminalContext,
): { output: OutputLine[]; clear: boolean } {
	const trimmed = input.trim()
	if (!trimmed) return { output: [], clear: false }

	const [cmd, ...rest] = trimmed.split(" ")
	const args = rest.join(" ")

	if (cmd === "clear") return { output: [], clear: true }

	const handler = COMMANDS[cmd]
	if (!handler) {
		return {
			output: [
				{ text: `command not found: ${cmd.slice(0, 40)}`, color: "var(--color-sys-magenta)" },
			],
			clear: false,
		}
	}

	return { output: handler(args, ctx), clear: false }
}
