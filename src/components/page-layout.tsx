import type { ReactNode } from "react"
import { SITE_VERSION } from "../lib/menu-items"

type Props = {
	children: ReactNode
	backHint?: boolean
	showVersion?: boolean
}

export function PageLayout({ children, backHint, showVersion = true }: Props) {
	return (
		<div className="relative mx-auto flex h-full w-full max-w-6xl flex-col px-12 py-16">
			{children}

			{(backHint || showVersion) && (
				<div className="mt-auto flex items-end justify-between pt-8">
					{backHint ? (
						<p className="font-barlow text-base tracking-wider text-mw2-text-dim">
							BACK - <span className="font-bold text-mw2-hotkey">ESC</span>
						</p>
					) : (
						<div />
					)}
					{showVersion && (
						<span className="font-barlow text-xs tracking-wider text-mw2-text-dim">
							{SITE_VERSION}
						</span>
					)}
				</div>
			)}
		</div>
	)
}
