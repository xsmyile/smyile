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
	try {
		const stored = sessionStorage.getItem("smyile_visitor_id")
		if (stored) return stored

		const fingerprint = getFingerprint()
		const hash = hashCode(fingerprint)
		const id = hash.toString(16).toUpperCase().padStart(8, "0").slice(0, 8)
		sessionStorage.setItem("smyile_visitor_id", id)
		return id
	} catch {
		const fingerprint = getFingerprint()
		const hash = hashCode(fingerprint)
		return hash.toString(16).toUpperCase().padStart(8, "0").slice(0, 8)
	}
}
