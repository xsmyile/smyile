import { useEffect, useState } from "react"
import { ORGANIZATIONS } from "../lib/constants"
import type { GitHubEvent, GitHubRelease, GitHubRepo, GitHubUser } from "../lib/github-api"
import {
	fetchLatestRelease,
	fetchOrgRepos,
	fetchUserEvents,
	fetchUserProfile,
	fetchUserRepos,
} from "../lib/github-api"

type GitHubData = {
	user: GitHubUser | null
	totalStars: number
	repos: GitHubRepo[]
	events: GitHubEvent[]
	latestRelease: GitHubRelease | null
	loading: boolean
	cached: boolean
	error: string | null
}

const FILTERED_EVENTS = new Set(["WatchEvent", "IssueCommentEvent"])

const GITHUB_ORG_NAMES = Array.from(
	new Set(ORGANIZATIONS.filter((o) => o.platform === "github").map((o) => o.name)),
)

function filterEvents(events: GitHubEvent[]): GitHubEvent[] {
	return events.filter((e) => !FILTERED_EVENTS.has(e.type))
}

function sumStars(repoSets: GitHubRepo[][]): number {
	return repoSets.flat().reduce((sum, repo) => sum + repo.stargazers_count, 0)
}

export function useGitHub(): GitHubData {
	const [state, setState] = useState<GitHubData>({
		user: null,
		totalStars: 0,
		repos: [],
		events: [],
		latestRelease: null,
		loading: true,
		cached: false,
		error: null,
	})

	useEffect(() => {
		let cancelled = false

		async function run() {
			const orgRepoFetches = GITHUB_ORG_NAMES.map((name) => fetchOrgRepos(name))

			const results = await Promise.allSettled([
				fetchUserProfile(),
				fetchUserRepos(),
				fetchUserEvents(),
				fetchLatestRelease(),
				...orgRepoFetches,
			])

			if (cancelled) return

			const [userResult, userReposResult, eventsResult, releaseResult, ...orgResults] = results

			const user = userResult.status === "fulfilled" ? userResult.value.data : null
			const userRepos = userReposResult.status === "fulfilled" ? userReposResult.value.data : []
			const events =
				eventsResult.status === "fulfilled" ? filterEvents(eventsResult.value.data) : []
			const releases = releaseResult.status === "fulfilled" ? releaseResult.value.data : []

			const allRepoSets = [userRepos]
			for (const result of orgResults) {
				if (result.status === "fulfilled") {
					allRepoSets.push(result.value.data)
				}
			}

			const cached = results.some((r) => r.status === "fulfilled" && r.value.cached)

			const criticalFailure =
				userResult.status === "rejected"
					? userResult.reason
					: userReposResult.status === "rejected"
						? userReposResult.reason
						: null
			const error = criticalFailure
				? criticalFailure instanceof Error
					? criticalFailure.message
					: "GitHub API unavailable"
				: null

			setState({
				user,
				totalStars: sumStars(allRepoSets),
				repos: allRepoSets.flat(),
				events,
				latestRelease: releases[0] ?? null,
				loading: false,
				cached,
				error,
			})
		}

		run()

		return () => {
			cancelled = true
		}
	}, [])

	return state
}
