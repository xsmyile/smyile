import { useCallback, useEffect, useLayoutEffect, useRef } from "react"
import {
	SISSY_BODY_PATH,
	SISSY_EYE_PATH,
	SISSY_INNER_TRANSFORM,
	SISSY_OUTER_TRANSFORM,
	SISSY_VIEWBOX,
} from "../lib/sissy-silhouette"

const BLINK_MIN_GAP_MS = 3000
const BLINK_MAX_GAP_MS = 7000
const EDGE_MARGIN_PX = 8
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)"

export type PetOrigin = { x: number; y: number }

type Props = {
	origin: PetOrigin
}

function SissySilhouette() {
	return (
		<svg viewBox={SISSY_VIEWBOX} aria-hidden="true" className="block size-full overflow-visible">
			<g className="sissy-breathe">
				<g fill="currentColor" transform={SISSY_OUTER_TRANSFORM}>
					<g transform={SISSY_INNER_TRANSFORM}>
						<path d={SISSY_BODY_PATH} />
					</g>
				</g>
				<g className="sissy-eye" fill="currentColor">
					<g transform={SISSY_OUTER_TRANSFORM}>
						<g transform={SISSY_INNER_TRANSFORM}>
							<path d={SISSY_EYE_PATH} />
						</g>
					</g>
				</g>
			</g>
		</svg>
	)
}

export function SissyPet({ origin }: Props) {
	const rootRef = useRef<HTMLDivElement>(null)
	const position = useRef<PetOrigin>(origin)
	const drag = useRef<{
		pointerX: number
		pointerY: number
		startX: number
		startY: number
	} | null>(null)

	const place = useCallback(() => {
		const el = rootRef.current
		if (!el) return
		const { width, height } = el.getBoundingClientRect()
		const p = position.current
		p.x = Math.min(Math.max(EDGE_MARGIN_PX, p.x), window.innerWidth - width - EDGE_MARGIN_PX)
		p.y = Math.min(Math.max(EDGE_MARGIN_PX, p.y), window.innerHeight - height - EDGE_MARGIN_PX)
		el.style.transform = `translate(${p.x}px, ${p.y}px)`
	}, [])

	const blink = useCallback(() => {
		const el = rootRef.current
		if (!el) return
		el.classList.remove("sissy-blink")
		void el.offsetWidth
		el.classList.add("sissy-blink")
	}, [])

	useLayoutEffect(() => {
		place()
		window.addEventListener("resize", place)
		return () => window.removeEventListener("resize", place)
	}, [place])

	useEffect(() => {
		const reduced = window.matchMedia(REDUCED_MOTION)
		let timer: ReturnType<typeof setTimeout> | undefined
		const schedule = () => {
			if (reduced.matches) return
			const gap = BLINK_MIN_GAP_MS + Math.random() * (BLINK_MAX_GAP_MS - BLINK_MIN_GAP_MS)
			timer = setTimeout(() => {
				if (!document.hidden) blink()
				schedule()
			}, gap)
		}
		schedule()
		return () => clearTimeout(timer)
	}, [blink])

	function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
		e.currentTarget.setPointerCapture(e.pointerId)
		drag.current = {
			pointerX: e.clientX,
			pointerY: e.clientY,
			startX: position.current.x,
			startY: position.current.y,
		}
		rootRef.current?.classList.add("sissy-dragging")
	}

	function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
		const d = drag.current
		if (!d) return
		position.current = {
			x: d.startX + e.clientX - d.pointerX,
			y: d.startY + e.clientY - d.pointerY,
		}
		place()
	}

	function handlePointerRelease() {
		if (!drag.current) return
		drag.current = null
		rootRef.current?.classList.remove("sissy-dragging")
		blink()
	}

	return (
		<div
			ref={rootRef}
			className="sissy-pet fixed top-0 left-0 z-60 w-[clamp(72px,8vw,104px)] touch-none select-none"
			onAnimationEnd={(e) => {
				if (e.animationName === "sissy-blink") e.currentTarget.classList.remove("sissy-blink")
			}}
		>
			<div
				role="img"
				aria-label="Sissy"
				className="sissy-cat aspect-square w-full cursor-grab"
				onPointerDown={handlePointerDown}
				onPointerMove={handlePointerMove}
				onLostPointerCapture={handlePointerRelease}
			>
				<div className="sissy-pop size-full">
					<SissySilhouette />
				</div>
			</div>
		</div>
	)
}
