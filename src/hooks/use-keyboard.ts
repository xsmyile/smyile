import { useEffect, useRef } from "react"

type KeyBinding = {
	key: string
	action: () => void
}

export function useKeyboard(bindings: KeyBinding[]) {
	const bindingsRef = useRef(bindings)
	bindingsRef.current = bindings

	useEffect(() => {
		function handleKeyDown(e: KeyboardEvent) {
			for (const binding of bindingsRef.current) {
				if (e.key === binding.key) {
					e.preventDefault()
					binding.action()
				}
			}
		}

		window.addEventListener("keydown", handleKeyDown)
		return () => window.removeEventListener("keydown", handleKeyDown)
	}, [])
}
