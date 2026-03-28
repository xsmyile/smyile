import { useCallback, useEffect, useState } from "react"
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
	events: GitHubEvent[]
	latestRelease: GitHubRelease | null
	loading: boolean
	cached: boolean
	error: string | null
}

const FILTERED_EVENTS = new Set(["WatchEvent", "IssueCommentEvent"])

function filterEvents(events: GitHubEvent[]): GitHubEvent[] {
	return events.filter((e) => !FILTERED_EVENTS.has(e.type))
}

function sumStars(repoSets: GitHubRepo[][]): number {
	return repoSets.flat().reduce((sum, repo) => sum + repo.stargazers_count, 0)
}

export function useGitHub(): GitHubData & { refetch: () => void } {
	const [state, setState] = useState<GitHubData>({
		user: null,
		totalStars: 0,
		events: [],
		latestRelease: null,
		loading: true,
		cached: false,
		error: null,
	})

	const fetchAll = useCallback(async () => {
		setState((prev) => ({ ...prev, loading: true, error: null }))

		try {
			const orgRepoFetches = ORGANIZATIONS.map((org) => fetchOrgRepos(org.name))

			const [userResult, userReposResult, eventsResult, releaseResult, ...orgResults] =
				await Promise.allSettled([
					fetchUserProfile(),
					fetchUserRepos(),
					fetchUserEvents(),
					fetchLatestRelease(),
					...orgRepoFetches,
				])

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

			const anyCached =
				(userResult.status === "fulfilled" && userResult.value.cached) ||
				(eventsResult.status === "fulfilled" && eventsResult.value.cached)

			setState({
				user,
				totalStars: sumStars(allRepoSets),
				events,
				latestRelease: releases[0] ?? null,
				loading: false,
				cached: anyCached,
				error: null,
			})
		} catch (err) {
			setState((prev) => ({
				...prev,
				loading: false,
				error: err instanceof Error ? err.message : "Unknown error",
			}))
		}
	}, [])

	useEffect(() => {
		fetchAll()
	}, [fetchAll])

	return { ...state, refetch: fetchAll }
}
