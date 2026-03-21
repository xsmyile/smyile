import { useEffect } from "react"

type KeyBinding = {
	key: string
	action: () => void
}

export function useKeyboard(bindings: KeyBinding[]) {
	useEffect(() => {
		function handleKeyDown(e: KeyboardEvent) {
			for (const binding of bindings) {
				if (e.key === binding.key) {
					e.preventDefault()
					binding.action()
				}
			}
		}

		window.addEventListener("keydown", handleKeyDown)
		return () => window.removeEventListener("keydown", handleKeyDown)
	}, [bindings])
}
