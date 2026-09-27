import {
	ARCHIVED_PROJECTS,
	IDENTITY,
	NETWORK,
	type NetworkNode,
	PROJECTS,
	type Project,
	SITE_VERSION,
	SPECIALIZATIONS,
} from "./constants"
import type { GitHubEvent, GitHubUser } from "./github-api"
import { getVisitorId } from "./visitor-id"

export type OutputLine = {
	text: string
	color?: string
	href?: string
}

export type TerminalContext = {
	user: GitHubUser | null
	totalStars: number
	events: GitHubEvent[]
	uptime: string
	sissyOut: boolean
}

export type CommandResult = {
	output: OutputLine[]
	clear: boolean
	summonSissy: boolean
}

const ACCENT = "var(--color-sys-accent)"
const DIM = "var(--color-sys-text-dim)"
const ERROR = "var(--color-sys-magenta)"
const LINK = "var(--color-sys-cyan)"
const OK = "var(--color-sys-green)"
const STARS = "var(--color-sys-amber)"

const SISSY_URL = "https://sissy.smyile.com"
const SISSY_BREW = "brew install --cask xsmyile/sissy/sissy"
const LAST_LOGIN_KEY = `smyile_${SITE_VERSION}_last_login`
const ARG_ECHO_LIMIT = 40

const LINK_LABELS: Record<NetworkNode["links"][number]["kind"], string> = {
	web: "web",
	github: "github",
	huggingface: "hf",
}

function host(url: string): string {
	return url.replace(/^https?:\/\//, "").replace(/\/$/, "")
}

function echoArg(args: string): string {
	return args.trim().slice(0, ARG_ECHO_LIMIT) || "?"
}

function findProject(args: string): Project | undefined {
	const id = args.trim().toLowerCase()
	return [...PROJECTS, ...ARCHIVED_PROJECTS].find((p) => p.id === id)
}

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

	try {
		localStorage.setItem(LAST_LOGIN_KEY, new Date().toISOString())
	} catch {}

	return [
		{ text: `Last login: ${formatLoginDate(displayDate)} on ttys040` },
		{ text: 'Type "help" to list available commands.', color: DIM },
	]
}

function projectLine(p: Project): OutputLine {
	return {
		text: `  ${p.name.padEnd(12)} ${`[${p.status.toUpperCase()}]`.padEnd(11)} ${p.description}`,
		color: p.status === "archived" ? DIM : undefined,
	}
}

function networkLines(node: NetworkNode, depth: number): OutputLine[] {
	const indent = depth === 0 ? "" : "└─ "
	const head: OutputLine = {
		text: `${indent}${node.label.padEnd(14 - indent.length)} ${node.role}`,
		color: ACCENT,
	}
	const links = node.links.map((l) => ({
		text: `${"   ".repeat(depth + 1)}${LINK_LABELS[l.kind].padEnd(7)} ${host(l.url)}`,
		color: LINK,
		href: l.url,
	}))
	const children = NETWORK.filter((n) => n.parent === node.id).flatMap((n) =>
		networkLines(n, depth + 1),
	)
	return [head, ...links, ...children]
}

type CommandHandler = (args: string, ctx: TerminalContext) => OutputLine[]

const COMMANDS: Record<string, CommandHandler> = {
	help: () => [
		{ text: "Available commands:", color: ACCENT },
		{ text: "  ls projects      list projects (-a for the archive)" },
		{ text: "  ls orgs          studios and labs" },
		{ text: "  cat <project>    project details" },
		{ text: "  open <project>   project link" },
		{ text: "  stats            github statistics" },
		{ text: "  neofetch         system information" },
		{ text: "  whoami           visitor identity" },
		{ text: "  uptime           session uptime" },
		{ text: "  clear            clear terminal" },
		{ text: "  ...and a few that aren't listed.", color: DIM },
	],

	whoami: () => [
		{ text: `visitor_id: ${getVisitorId()}`, color: ACCENT },
		{ text: `user_agent: ${navigator.userAgent.slice(0, 60)}...` },
		{ text: `language:   ${navigator.language}` },
		{ text: `timezone:   ${Intl.DateTimeFormat().resolvedOptions().timeZone}` },
		{ text: `resolution: ${screen.width}x${screen.height}` },
	],

	ls: (args) => {
		const parts = args.trim().toLowerCase().split(/\s+/).filter(Boolean)
		const all = parts.includes("-a")
		const target = parts.find((p) => p !== "-a")
		if (!target) return [{ text: "projects/  orgs/", color: ACCENT }]
		if (target === "projects") {
			const lines = PROJECTS.map(projectLine)
			if (all) return [...lines, ...ARCHIVED_PROJECTS.map(projectLine)]
			return [...lines, { text: "  (ls -a projects for the archive)", color: DIM }]
		}
		if (target === "orgs") {
			return NETWORK.filter((n) => n.parent === null).flatMap((n) => networkLines(n, 0))
		}
		return [
			{
				text: `ls: cannot access '${echoArg(target)}': No such file or directory`,
				color: ERROR,
			},
		]
	},

	cat: (args) => {
		const project = findProject(args)
		if (!project) {
			return [{ text: `cat: ${echoArg(args)}: No such file or directory`, color: ERROR }]
		}
		return [
			{ text: `${project.name}  [${project.status.toUpperCase()}]`, color: ACCENT },
			{ text: `  ${project.description}` },
			{ text: `  stack: ${project.stack}` },
			{ text: `  repo:  ${project.repo}` },
			{ text: `  url:   ${host(project.url)}`, color: LINK, href: project.url },
		]
	},

	open: (args) => {
		const project = findProject(args)
		if (!project) return [{ text: `open: unknown target '${echoArg(args)}'`, color: ERROR }]
		return [{ text: `→ ${host(project.url)}`, color: LINK, href: project.url }]
	},

	stats: (_args, ctx) => {
		if (!ctx.user) return [{ text: "fetching...", color: STARS }]
		return [
			{ text: "GITHUB STATISTICS", color: ACCENT },
			{ text: `  repos:  ${ctx.user.public_repos}` },
			{ text: `  stars:  ${ctx.totalStars}`, color: STARS },
			{ text: `  events: ${ctx.events.length} recent` },
		]
	},

	uptime: (_args, ctx) => [{ text: `session uptime: ${ctx.uptime}`, color: OK }],

	neofetch: (_args, ctx) => [
		{ text: "  smyile@blackbird", color: ACCENT },
		{ text: "  ─────────────────" },
		{ text: `  role:    ${IDENTITY.role}` },
		{ text: `  version: v${SITE_VERSION}` },
		{ text: `  uptime:  ${ctx.uptime}` },
		{ text: `  stars:   ${ctx.totalStars}`, color: STARS },
		{ text: `  skills:  ${SPECIALIZATIONS.join(", ")}` },
		{ text: `  orgs:    ${NETWORK.map((n) => n.id).join(", ")}` },
		{ text: `  tz:      ${IDENTITY.timezone}` },
	],

	ping: (args) => {
		const project = findProject(args)
		if (!project) return [{ text: `ping: unknown host '${echoArg(args)}'`, color: ERROR }]
		const ms = Math.floor(Math.random() * 30) + 5
		return [
			{ text: `PING ${project.id} (${host(project.url)})` },
			{ text: `64 bytes: time=${ms}ms`, color: OK },
			{ text: `--- ${project.id} ping statistics ---` },
			{ text: "1 packet transmitted, 1 received, 0% packet loss" },
		]
	},

	sissy: (_args, ctx) => {
		if (ctx.sissyOut) return [{ text: "sissy is already out.", color: DIM }]
		return [
			{ text: "resolving sissy.smyile.com ... 200 OK", color: OK },
			{ text: "  SISSY  macOS menu bar · free & open-source", color: ACCENT },
			{ text: "  The numbers you keep checking, in the macOS menu bar." },
			{ text: `  $ ${SISSY_BREW}`, color: STARS },
			{ text: `  → ${host(SISSY_URL)}`, color: LINK, href: SISSY_URL },
			{ text: "  sissy is out. drag to move.", color: DIM },
		]
	},

	secret: () => [
		{ text: "ACCESS GRANTED", color: OK },
		{ text: "" },
		{ text: "  > the cake is a lie" },
		{ text: "  > but the code is real", color: ACCENT },
	],
}

const COMPLETION_ARGS: Record<string, readonly string[]> = {
	ls: ["projects", "orgs", "-a projects"],
	cat: [...PROJECTS, ...ARCHIVED_PROJECTS].map((p) => p.id),
	open: [...PROJECTS, ...ARCHIVED_PROJECTS].map((p) => p.id),
	ping: PROJECTS.map((p) => p.id),
}

const LISTED_COMMANDS = [
	"help",
	"ls",
	"cat",
	"open",
	"stats",
	"neofetch",
	"whoami",
	"uptime",
	"clear",
]

export function completeInput(input: string): { value: string; candidates: string[] } {
	const [cmd, ...rest] = input.trimStart().split(/\s+/)
	if (rest.length === 0) {
		const hits = LISTED_COMMANDS.filter((c) => c.startsWith(cmd))
		return hits.length === 1
			? { value: `${hits[0]} `, candidates: [] }
			: { value: input, candidates: hits }
	}
	const prefix = rest.join(" ")
	const hits = (COMPLETION_ARGS[cmd] ?? []).filter((a) => a.startsWith(prefix))
	return hits.length === 1
		? { value: `${cmd} ${hits[0]}`, candidates: [] }
		: { value: input, candidates: hits }
}

export function executeCommand(input: string, ctx: TerminalContext): CommandResult {
	const trimmed = input.trim()
	if (!trimmed) return { output: [], clear: false, summonSissy: false }

	const [cmd, ...rest] = trimmed.split(/\s+/)

	if (cmd === "clear") return { output: [], clear: true, summonSissy: false }

	const handler = COMMANDS[cmd]
	if (!handler) {
		return {
			output: [{ text: `command not found: ${cmd.slice(0, ARG_ECHO_LIMIT)}`, color: ERROR }],
			clear: false,
			summonSissy: false,
		}
	}

	return {
		output: handler(rest.join(" "), ctx),
		clear: false,
		summonSissy: cmd === "sissy" && !ctx.sissyOut,
	}
}
