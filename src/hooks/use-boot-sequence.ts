import { useCallback, useEffect, useState } from "react"

export type BootPhase = "booting" | "ready"

type BootLog = {
	time: string
	module: string
	message: string
}

const BOOT_LOGS: BootLog[] = [
	{ time: "00:00.0", module: "CORE", message: "initializing system..." },
	{ time: "00:00.1", module: "THEME", message: "loading cyberpunk interface" },
	{ time: "00:00.2", module: "MODULES", message: "mounting 7 modules..." },
	{ time: "00:00.4", module: "GITHUB", message: "connecting to api.github.com..." },
	{ time: "00:00.6", module: "STATUS", message: "runtime checks passed" },
	{ time: "00:00.8", module: "RENDER", message: "compositing dashboard..." },
	{ time: "00:01.0", module: "SYSTEM", message: "all modules ONLINE" },
]

const LOG_INTERVAL = 180
const BOOT_KEY = "smyile_boot_seen"

function hasSeenBoot(): boolean {
	try {
		return sessionStorage.getItem(BOOT_KEY) === "1"
	} catch {
		return false
	}
}

function markBootSeen() {
	try {
		sessionStorage.setItem(BOOT_KEY, "1")
	} catch {
		// ignore
	}
}

export function useBootSequence() {
	const skipBoot = hasSeenBoot()
	const [phase, setPhase] = useState<BootPhase>(skipBoot ? "ready" : "booting")
	const [visibleLogs, setVisibleLogs] = useState<BootLog[]>(skipBoot ? BOOT_LOGS : [])

	const skip = useCallback(() => {
		setPhase("ready")
		setVisibleLogs(BOOT_LOGS)
		markBootSeen()
	}, [])

	useEffect(() => {
		if (skipBoot) return

		let index = 0
		let readyTimeout: ReturnType<typeof setTimeout>
		const interval = setInterval(() => {
			if (index < BOOT_LOGS.length) {
				setVisibleLogs((prev) => [...prev, BOOT_LOGS[index]])
				index++
			} else {
				clearInterval(interval)
				readyTimeout = setTimeout(() => {
					setPhase("ready")
					markBootSeen()
				}, 400)
			}
		}, LOG_INTERVAL)

		return () => {
			clearInterval(interval)
			clearTimeout(readyTimeout)
		}
	}, [skipBoot])

	return { phase, visibleLogs, skip }
}
