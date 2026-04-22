import { useEffect, useState } from "react"

const sessionStart = Date.now()

function formatElapsed(ms: number): string {
	const totalSeconds = Math.floor(ms / 1000)
	const hours = Math.floor(totalSeconds / 3600)
	const minutes = Math.floor((totalSeconds % 3600) / 60)
	const seconds = totalSeconds % 60
	return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
}

export function getUptime(): string {
	return formatElapsed(Date.now() - sessionStart)
}

export function useUptime(): string {
	const [elapsed, setElapsed] = useState(0)

	useEffect(() => {
		const interval = setInterval(() => {
			setElapsed(Date.now() - sessionStart)
		}, 1000)
		return () => clearInterval(interval)
	}, [])

	return formatElapsed(elapsed)
}
