import { AnimatePresence, motion } from "framer-motion"
import type { MenuItem } from "../lib/menu-items"

type Props = {
	items: MenuItem[]
	activeSubmenu: string | null
	onItemClick: (item: MenuItem) => void
}

export function MainMenu({ items, activeSubmenu, onItemClick }: Props) {
	return (
		<nav className="flex flex-col items-end gap-0.5">
			{items.map((item) => (
				<div key={item.label} className="flex w-full flex-col items-end border-b border-mw2-separator/30">
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

					<AnimatePresence>
						{item.action.type === "submenu" && activeSubmenu === item.label && (
							<motion.div
								initial={{ height: 0, opacity: 0 }}
								animate={{ height: "auto", opacity: 1 }}
								exit={{ height: 0, opacity: 0 }}
								transition={{ duration: 0.2, ease: "easeInOut" }}
								className="overflow-hidden"
							>
								<div className="flex flex-col items-end gap-1 border-r border-mw2-separator py-2 pr-4">
									{item.action.items.map((sub) => (
										<a
											key={sub.label}
											href={sub.url}
											target="_blank"
											rel="noopener noreferrer"
											className="font-barlow text-base tracking-wider text-mw2-text-dim transition-colors hover:text-mw2-highlight"
										>
											{sub.label}
										</a>
									))}
								</div>
							</motion.div>
						)}
					</AnimatePresence>
				</div>
			))}
		</nav>
	)
}
