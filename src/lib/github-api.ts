import { GITHUB_USERNAME, SITE_VERSION } from "./constants"

const BASE_URL = "https://api.github.com"
const CACHE_TTL = 5 * 60 * 1000
const CACHE_PREFIX = `smyile_${SITE_VERSION}_`

type CacheEntry<T> = {
	data: T
	timestamp: number
}

function prefixedKey(key: string): string {
	return `${CACHE_PREFIX}${key}`
}

function purgeStaleVersions() {
	try {
		const purgedKey = `${CACHE_PREFIX}purged`
		if (localStorage.getItem(purgedKey)) return
		for (let i = localStorage.length - 1; i >= 0; i--) {
			const k = localStorage.key(i)
			if (k?.startsWith("smyile_") && !k.startsWith(CACHE_PREFIX)) {
				localStorage.removeItem(k)
			}
		}
		localStorage.setItem(purgedKey, "1")
	} catch {
		// localStorage unavailable
	}
}

purgeStaleVersions()

function readCache<T>(key: string, { allowStale }: { allowStale: boolean }): T | null {
	try {
		const raw = localStorage.getItem(prefixedKey(key))
		if (!raw) return null
		const entry: CacheEntry<T> = JSON.parse(raw)
		if (allowStale || Date.now() - entry.timestamp < CACHE_TTL) return entry.data
		return null
	} catch {
		return null
	}
}

function setCache<T>(key: string, data: T) {
	try {
		const entry: CacheEntry<T> = { data, timestamp: Date.now() }
		localStorage.setItem(prefixedKey(key), JSON.stringify(entry))
	} catch {
		// localStorage full or unavailable
	}
}

async function fetchWithCache<T>(
	endpoint: string,
	cacheKey: string,
): Promise<{ data: T; cached: boolean }> {
	const hit = readCache<T>(cacheKey, { allowStale: false })
	if (hit) return { data: hit, cached: true }

	try {
		const response = await fetch(`${BASE_URL}${endpoint}`, {
			headers: { Accept: "application/vnd.github.v3+json" },
		})

		if (!response.ok) {
			const stale = readCache<T>(cacheKey, { allowStale: true })
			if (stale) return { data: stale, cached: true }
			throw new Error(`GitHub API ${response.status}`)
		}

		const text = await response.text()
		let data: T
		try {
			data = JSON.parse(text)
		} catch {
			const stale = readCache<T>(cacheKey, { allowStale: true })
			if (stale) return { data: stale, cached: true }
			throw new Error("GitHub API returned non-JSON response")
		}

		setCache(cacheKey, data)
		return { data, cached: false }
	} catch (err) {
		const stale = readCache<T>(cacheKey, { allowStale: true })
		if (stale) return { data: stale, cached: true }
		throw err instanceof Error ? err : new Error("GitHub API unavailable")
	}
}

export type GitHubUser = {
	public_repos: number
	followers: number
}

export type GitHubEvent = {
	id: string
	type: string
	repo: { name: string }
	created_at: string
	payload: {
		action?: string
		commits?: Array<{ message: string; sha: string }>
		ref?: string
		ref_type?: string
		release?: { tag_name: string }
	}
}

export type GitHubRepo = {
	name: string
	stargazers_count: number
}

export type GitHubRelease = {
	tag_name: string
	published_at: string
	html_url: string
}

export async function fetchUserProfile() {
	return fetchWithCache<GitHubUser>(`/users/${GITHUB_USERNAME}`, "gh_user")
}

export async function fetchUserEvents(page = 1) {
	return fetchWithCache<GitHubEvent[]>(
		`/users/${GITHUB_USERNAME}/events/public?per_page=30&page=${page}`,
		`gh_events_${page}`,
	)
}

export async function fetchUserRepos() {
	return fetchWithCache<GitHubRepo[]>(
		`/users/${GITHUB_USERNAME}/repos?per_page=100&sort=updated`,
		"gh_repos",
	)
}

export async function fetchOrgRepos(org: string) {
	return fetchWithCache<GitHubRepo[]>(
		`/orgs/${org}/repos?per_page=100&sort=updated`,
		`gh_org_repos_${org}`,
	)
}

export async function fetchLatestRelease() {
	return fetchWithCache<GitHubRelease[]>(
		`/repos/${GITHUB_USERNAME}/smyile/releases?per_page=1`,
		"gh_releases",
	)
}

export function formatEventDescription(event: GitHubEvent): string {
	const repo = event.repo.name.replace(`${GITHUB_USERNAME}/`, "")

	switch (event.type) {
		case "PushEvent": {
			const count = event.payload.commits?.length ?? 0
			if (count === 0) return `[${repo}] synced branch`
			const msg = event.payload.commits?.[0]?.message.split("\n")[0] ?? ""
			return `[${repo}] pushed ${count} commit${count !== 1 ? "s" : ""}: ${msg}`
		}
		case "CreateEvent":
			return `[${repo}] created ${event.payload.ref_type} ${event.payload.ref ?? ""}`
		case "DeleteEvent":
			return `[${repo}] deleted ${event.payload.ref_type} ${event.payload.ref ?? ""}`
		case "ReleaseEvent":
			return `[${repo}] released ${event.payload.release?.tag_name ?? ""}`
		case "IssuesEvent":
			return `[${repo}] ${event.payload.action} issue`
		case "PullRequestEvent":
			return `[${repo}] ${event.payload.action} pull request`
		case "WatchEvent":
			return `[${repo}] starred`
		case "ForkEvent":
			return `[${repo}] forked`
		default:
			return `[${repo}] ${event.type.replace("Event", "").toLowerCase()}`
	}
}

export function formatRelativeTime(dateStr: string): string {
	const diff = Date.now() - new Date(dateStr).getTime()
	const minutes = Math.floor(diff / 60000)
	if (minutes < 1) return "just now"
	if (minutes < 60) return `${minutes}m ago`
	const hours = Math.floor(minutes / 60)
	if (hours < 24) return `${hours}h ago`
	const days = Math.floor(hours / 24)
	if (days < 30) return `${days}d ago`
	return `${Math.floor(days / 30)}mo ago`
}

export function getEventColor(type: string): string {
	switch (type) {
		case "PushEvent":
			return "#89CFF0"
		case "ReleaseEvent":
			return "#00ff88"
		case "CreateEvent":
			return "#00d4ff"
		case "IssuesEvent":
		case "PullRequestEvent":
			return "#ff0080"
		default:
			return "#666"
	}
}
