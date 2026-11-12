import { Component, type ReactNode } from "react"
import { tryStorage } from "../lib/storage"

const RELOAD_KEY = "smyile_reload_attempted"

type Props = { children: ReactNode }
type State = { hasError: boolean; reloading: boolean }

function getSessionFlag(): boolean {
	return tryStorage(() => sessionStorage.getItem(RELOAD_KEY) === "1", false)
}

function setSessionFlag(value: boolean) {
	tryStorage(() => {
		if (value) sessionStorage.setItem(RELOAD_KEY, "1")
		else sessionStorage.removeItem(RELOAD_KEY)
	}, undefined)
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
				<div className="flex h-screen items-center justify-center bg-ground font-mono text-muted">
					<div className="text-center">
						<p className="text-sm">something went wrong</p>
						<button
							type="button"
							onClick={() => window.location.reload()}
							className="mt-3 text-xs text-ink underline"
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
