/** A URL without its scheme and trailing slash, for display: `https://rustmail.app/` → `rustmail.app`. */
export function displayHost(url: string): string {
	return url.replace(/^https?:\/\//, "").replace(/\/$/, "")
}
