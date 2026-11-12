import { tryStorage } from "./storage"

const VISITOR_ID_KEY = "smyile_visitor_id"

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

function fingerprintId(): string {
	return hashCode(getFingerprint()).toString(16).toUpperCase().padStart(8, "0").slice(0, 8)
}

export function getVisitorId(): string {
	const id = fingerprintId()
	return tryStorage(() => {
		const stored = sessionStorage.getItem(VISITOR_ID_KEY)
		if (stored) return stored
		sessionStorage.setItem(VISITOR_ID_KEY, id)
		return id
	}, id)
}
