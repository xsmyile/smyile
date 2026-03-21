function hashCode(str: string): number {
	let hash = 0
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i)
		hash = (hash << 5) - hash + char
		hash |= 0
	}
	return Math.abs(hash)
}

function getFingerprint(): string {
	const components = [
		navigator.userAgent,
		navigator.language,
		screen.width.toString(),
		screen.height.toString(),
		screen.colorDepth.toString(),
		Intl.DateTimeFormat().resolvedOptions().timeZone,
		navigator.hardwareConcurrency?.toString() ?? "unknown",
	]
	return components.join("|")
}

export function getVisitorId(): string {
	const stored = sessionStorage.getItem("mw2-visitor-id")
	if (stored) return stored

	const fingerprint = getFingerprint()
	const hash = hashCode(fingerprint)
	const id = hash.toString(16).toUpperCase().padStart(8, "0").slice(0, 8)
	sessionStorage.setItem("mw2-visitor-id", id)
	return id
}

export function getVisitorLevel(): number {
	const fingerprint = getFingerprint()
	const hash = hashCode(fingerprint + "level-salt")
	return (hash % 70) + 1
}
