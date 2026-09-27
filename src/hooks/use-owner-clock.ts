import { useEffect, useState } from "react"
import { IDENTITY } from "../lib/constants"

const CLOCK_TICK_MS = 10_000

const OWNER_CLOCK = new Intl.DateTimeFormat("en-GB", {
	timeZone: IDENTITY.timezone,
	hour: "2-digit",
	minute: "2-digit",
})

function formatOwnerTime(): string {
	return OWNER_CLOCK.format(new Date())
}

export function useOwnerClock(): string {
	const [time, setTime] = useState(formatOwnerTime)

	useEffect(() => {
		const interval = setInterval(() => setTime(formatOwnerTime()), CLOCK_TICK_MS)
		return () => clearInterval(interval)
	}, [])

	return time
}
