import type { MenuItem } from "../lib/menu-items"

type Props = {
	items: MenuItem[]
	onItemClick: (item: MenuItem) => void
}

export function MainMenu({ items, onItemClick }: Props) {
	return (
		<nav className="flex flex-col items-end gap-0.5">
			{items.map((item) => (
				<div
					key={item.label}
					className="flex w-full flex-col items-end border-b border-mw2-separator/30"
				>
					<button
						type="button"
						onClick={() => onItemClick(item)}
						className="group flex items-center gap-3 border-none bg-transparent py-2 text-right"
					>
						<span className="font-michroma text-[1.2rem] font-bold tracking-[0.2em] text-mw2-text transition-colors group-hover:text-mw2-highlight">
							{item.label}
						</span>
						{item.badge === "new" && (
							<span className="rounded-sm border border-mw2-new-badge px-2 py-0.5 font-barlow text-[0.7rem] font-bold text-mw2-new-badge">
								new
							</span>
						)}
					</button>
				</div>
			))}
		</nav>
	)
}
