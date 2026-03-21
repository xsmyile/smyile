import { useEffect, useState } from "react"

export function usePageVisibility(): boolean {
	const [isVisible, setIsVisible] = useState(!document.hidden)

	useEffect(() => {
		function handleChange() {
			setIsVisible(!document.hidden)
		}

		document.addEventListener("visibilitychange", handleChange)
		return () => document.removeEventListener("visibilitychange", handleChange)
	}, [])

	return isVisible
}
