import { Component, type ReactNode } from "react"

const RELOAD_KEY = "smyile_reload_attempted"

type Props = { children: ReactNode }
type State = { hasError: boolean; reloading: boolean }

function getSessionFlag(): boolean {
	try {
		return sessionStorage.getItem(RELOAD_KEY) === "1"
	} catch {
		return false
	}
}

function setSessionFlag(value: boolean) {
	try {
		if (value) {
			sessionStorage.setItem(RELOAD_KEY, "1")
		} else {
			sessionStorage.removeItem(RELOAD_KEY)
		}
	} catch {
		// sessionStorage unavailable (private browsing, etc.)
	}
}

export class StaleReloadBoundary extends Component<Props, State> {
	state: State = { hasError: false, reloading: false }

	static getDerivedStateFromError(): State {
		const alreadyAttempted = getSessionFlag()
		return { hasError: true, reloading: !alreadyAttempted }
	}

	componentDidCatch() {
		if (this.state.reloading) {
			setSessionFlag(true)
			window.location.reload()
			return
		}
		setSessionFlag(false)
	}

	render() {
		if (this.state.reloading) return null
		if (this.state.hasError) {
			return (
				<div className="flex h-screen items-center justify-center bg-sys-bg font-mono text-sys-text-dim">
					<div className="text-center">
						<p className="text-sm">something went wrong</p>
						<button
							type="button"
							onClick={() => window.location.reload()}
							className="mt-3 text-xs text-sys-accent underline"
						>
							reload
						</button>
					</div>
				</div>
			)
		}
		return this.props.children
	}
}
