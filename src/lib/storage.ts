/**
 * Runs a Web Storage call. Storage can be missing or full (private browsing, quota, blocked site
 * data) and the site works without it, so a failure returns `fallback` instead of throwing.
 */
export function tryStorage<T>(operation: () => T, fallback: T): T {
	try {
		return operation()
	} catch {
		return fallback
	}
}
