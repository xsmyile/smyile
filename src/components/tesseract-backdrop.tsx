import { useEffect, useRef } from "react"
import { readCssColor } from "../lib/dither"
import { REDUCED_MOTION_QUERY } from "../lib/motion"
import {
	advanceScene,
	createScene,
	kickScene,
	type Point,
	paintScene,
	type QuietZone,
	type Scene,
	setQuietZones,
	settleScene,
} from "../lib/tesseract-scene"

const FRAME_MS = 33
const MAX_STEP_MS = 100
const POINTER_EASE = 0.05
const CELL_PX = 2
const COARSE_CELL_PX = 3
const COARSE_BREAKPOINT_PX = 700
const MAX_CELLS = 360_000
const INK_PROPERTY = "--ink"
const INTERACTIVE = "a, button, input, label, [role='dialog']"
const QUIET_SELECTOR = "[data-quiet]"

type Props = {
	paused: boolean
}

function cellSize(width: number, height: number): number {
	const base = window.innerWidth < COARSE_BREAKPOINT_PX ? COARSE_CELL_PX : CELL_PX
	return Math.max(base, Math.ceil(Math.sqrt((width * height) / MAX_CELLS)))
}

function quietZones(origin: DOMRect, cell: number): QuietZone[] {
	return [...document.querySelectorAll(QUIET_SELECTOR)].map((el) => {
		const r = el.getBoundingClientRect()
		return {
			left: (r.left - origin.left) / cell,
			top: (r.top - origin.top) / cell,
			right: (r.right - origin.left) / cell,
			bottom: (r.bottom - origin.top) / cell,
		}
	})
}

export function TesseractBackdrop({ paused }: Props) {
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const pausedRef = useRef(paused)
	pausedRef.current = paused

	useEffect(() => {
		const canvas = canvasRef.current
		const ctx = canvas?.getContext("2d")
		if (!canvas || !ctx) return

		const reduced = window.matchMedia(REDUCED_MOTION_QUERY).matches
		const ink = readCssColor(INK_PROPERTY)
		const pointer: Point = { x: 0, y: 0 }
		const target: Point = { x: 0, y: 0 }
		let scene: Scene | null = null
		let image: ImageData | null = null
		let raf = 0
		let last = 0
		let pendingRebuild = 0

		function paint() {
			if (!scene || !image || !ctx) return
			paintScene(scene, image.data, ink)
			ctx.putImageData(image, 0, 0)
		}

		function rebuild() {
			if (!canvas || !ctx) return
			const rect = canvas.getBoundingClientRect()
			const { width, height } = rect
			const cell = cellSize(width, height)
			const cols = Math.ceil(width / cell)
			const rows = Math.ceil(height / cell)
			if (cols < 2 || rows < 2) return
			if (scene && scene.cols === cols && scene.rows === rows) {
				setQuietZones(scene, quietZones(rect, cell))
				if (reduced) paint()
				return
			}
			const clock = scene?.clock ?? 0
			canvas.width = cols
			canvas.height = rows
			scene = createScene(cols, rows, quietZones(rect, cell))
			scene.clock = clock
			image = ctx.createImageData(cols, rows)
			if (reduced) settleScene(scene, pointer)
			else advanceScene(scene, FRAME_MS, pointer)
			paint()
		}

		function scheduleRebuild() {
			if (pendingRebuild) return
			pendingRebuild = requestAnimationFrame(() => {
				pendingRebuild = 0
				rebuild()
			})
		}

		function frame(now: number) {
			raf = requestAnimationFrame(frame)
			if (pausedRef.current || !scene) return
			const elapsed = last ? now - last : FRAME_MS
			if (elapsed < FRAME_MS) return
			last = now
			pointer.x += (target.x - pointer.x) * POINTER_EASE
			pointer.y += (target.y - pointer.y) * POINTER_EASE
			advanceScene(scene, Math.min(elapsed, MAX_STEP_MS), pointer)
			paint()
		}

		function handleMove(e: PointerEvent) {
			if (e.pointerType !== "mouse") return
			target.x = (e.clientX / window.innerWidth) * 2 - 1
			target.y = (e.clientY / window.innerHeight) * 2 - 1
		}

		function handleLeave() {
			target.x = 0
			target.y = 0
		}

		function handleDown(e: PointerEvent) {
			if (e.pointerType !== "mouse" || pausedRef.current || !scene) return
			if (e.target instanceof Element && e.target.closest(INTERACTIVE)) return
			kickScene(scene)
		}

		const observer = new ResizeObserver(scheduleRebuild)
		observer.observe(canvas)
		for (const el of document.querySelectorAll(QUIET_SELECTOR)) observer.observe(el)
		rebuild()
		if (!reduced) {
			raf = requestAnimationFrame(frame)
			window.addEventListener("pointermove", handleMove)
			document.documentElement.addEventListener("pointerleave", handleLeave)
			window.addEventListener("pointerdown", handleDown)
		}
		return () => {
			cancelAnimationFrame(raf)
			cancelAnimationFrame(pendingRebuild)
			observer.disconnect()
			window.removeEventListener("pointermove", handleMove)
			document.documentElement.removeEventListener("pointerleave", handleLeave)
			window.removeEventListener("pointerdown", handleDown)
		}
	}, [])

	return (
		<div aria-hidden="true" className="pointer-events-none absolute inset-0">
			<canvas ref={canvasRef} className="block size-full [image-rendering:pixelated]" />
		</div>
	)
}
