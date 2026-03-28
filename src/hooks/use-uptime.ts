import { useEffect, useState } from "react"

const sessionStart = Date.now()

export function useUptime(): string {
	const [elapsed, setElapsed] = useState(0)

	useEffect(() => {
		const interval = setInterval(() => {
			setElapsed(Date.now() - sessionStart)
		}, 1000)
		return () => clearInterval(interval)
	}, [])

	const totalSeconds = Math.floor(elapsed / 1000)
	const hours = Math.floor(totalSeconds / 3600)
	const minutes = Math.floor((totalSeconds % 3600) / 60)
	const seconds = totalSeconds % 60

	return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
}
