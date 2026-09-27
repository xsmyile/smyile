import { useEffect, useState } from "react"
import { ACTIVITY_OWNERS, STAR_SOURCE_ORGS } from "../lib/constants"
import type { GitHubEvent, GitHubRepo, GitHubUser } from "../lib/github-api"
import { fetchOrgRepos, fetchUserEvents, fetchUserProfile, fetchUserRepos } from "../lib/github-api"

export type GitHubData = {
	user: GitHubUser | null
	totalStars: number
	events: GitHubEvent[]
	eventsFailed: boolean
}

const FILTERED_EVENTS = new Set(["WatchEvent", "IssueCommentEvent"])

function filterEvents(events: GitHubEvent[]): GitHubEvent[] {
	return events.filter(
		(e) => !FILTERED_EVENTS.has(e.type) && ACTIVITY_OWNERS.has(e.repo.name.split("/")[0]),
	)
}

function sumStars(repoSets: GitHubRepo[][]): number {
	return repoSets.flat().reduce((sum, repo) => sum + repo.stargazers_count, 0)
}

export function useGitHub(): GitHubData {
	const [state, setState] = useState<GitHubData>({
		user: null,
		totalStars: 0,
		events: [],
		eventsFailed: false,
	})

	useEffect(() => {
		let cancelled = false

		async function run() {
			const [userResult, eventsResult, ...repoResults] = await Promise.allSettled([
				fetchUserProfile(),
				fetchUserEvents(),
				fetchUserRepos(),
				...STAR_SOURCE_ORGS.map((name) => fetchOrgRepos(name)),
			])

			if (cancelled) return

			const repoSets = repoResults.flatMap((r) => (r.status === "fulfilled" ? [r.value.data] : []))

			setState({
				user: userResult.status === "fulfilled" ? userResult.value.data : null,
				totalStars: sumStars(repoSets),
				events: eventsResult.status === "fulfilled" ? filterEvents(eventsResult.value.data) : [],
				eventsFailed: eventsResult.status === "rejected",
			})
		}

		run()

		return () => {
			cancelled = true
		}
	}, [])

	return state
}
