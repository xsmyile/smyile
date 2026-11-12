import { useEffect, useRef } from "react"
import { type DistanceField, distanceField, paintContours } from "../lib/contour-wordmark"
import { readCssColor } from "../lib/dither"

const WORD_FONT_FAMILY = "Unbounded"
const WORD_FONT_WEIGHT = 800
const PROBE_FONT_PX = 100
const FONT_TIMEOUT_MS = 1500
const CELL_PX = 2
const FRAME_MS = 33
const MAX_STEP_MS = 100
const FLOW_PER_MS = 0.00088
const STILL_FLOW = 1
const INK_PROPERTY = "--ink"
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)"

type Props = {
	text: string
	paused: boolean
}

function font(sizePx: number): string {
	return `${WORD_FONT_WEIGHT} ${sizePx}px ${WORD_FONT_FAMILY}`
}

function waitForFont(timeoutMs: number): Promise<void> {
	return new Promise((resolve) => {
		const timer = setTimeout(resolve, timeoutMs)
		document.fonts
			.load(font(PROBE_FONT_PX))
			.catch((error: unknown) => {
				console.warn(`Wordmark font ${WORD_FONT_FAMILY} failed to load, using the fallback`, error)
			})
			.finally(() => {
				clearTimeout(timer)
				resolve()
			})
	})
}

function rasterize(text: string, cols: number, rows: number): DistanceField | null {
	const probe = document.createElement("canvas")
	probe.width = cols
	probe.height = rows
	const g = probe.getContext("2d", { willReadFrequently: true })
	if (!g) return null
	g.font = font(PROBE_FONT_PX)
	const m = g.measureText(text)
	const width = m.actualBoundingBoxLeft + m.actualBoundingBoxRight
	const height = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent
	const fit = Math.min((cols - 2) / width, (rows - 2) / height)
	g.font = font(PROBE_FONT_PX * fit)
	g.fillStyle = "#fff"
	g.fillText(text, 1 + m.actualBoundingBoxLeft * fit, 1 + m.actualBoundingBoxAscent * fit)
	return distanceField(g.getImageData(0, 0, cols, rows).data, cols, rows)
}

/** The name drawn as dithered concentric contours that flow inward. */
export function Wordmark({ text, paused }: Props) {
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const pausedRef = useRef(paused)
	pausedRef.current = paused

	useEffect(() => {
		const canvas = canvasRef.current
		const ctx = canvas?.getContext("2d")
		if (!canvas || !ctx) return

		const reduced = window.matchMedia(REDUCED_MOTION).matches
		const ink = readCssColor(INK_PROPERTY)
		let field: DistanceField | null = null
		let image: ImageData | null = null
		let raf = 0
		let last = 0
		let flow = STILL_FLOW
		let cancelled = false

		function paint() {
			if (!field || !image || !ctx) return
			paintContours(field, image.data, ink, flow)
			ctx.putImageData(image, 0, 0)
		}

		function rebuild(force: boolean) {
			if (!canvas || !ctx) return
			const { width, height } = canvas.getBoundingClientRect()
			const cols = Math.ceil(width / CELL_PX)
			const rows = Math.ceil(height / CELL_PX)
			if (cols < 4 || rows < 4) return
			if (!force && field && field.cols === cols && field.rows === rows) return
			canvas.width = cols
			canvas.height = rows
			field = rasterize(text, cols, rows)
			image = ctx.createImageData(cols, rows)
			paint()
		}

		function frame(now: number) {
			raf = requestAnimationFrame(frame)
			if (pausedRef.current) return
			const elapsed = last ? now - last : FRAME_MS
			if (elapsed < FRAME_MS) return
			last = now
			flow += Math.min(elapsed, MAX_STEP_MS) * FLOW_PER_MS
			paint()
		}

		const observer = new ResizeObserver(() => rebuild(false))
		const redraw = () => rebuild(true)
		document.fonts.addEventListener("loadingdone", redraw)
		waitForFont(FONT_TIMEOUT_MS).then(() => {
			if (cancelled) return
			rebuild(true)
			observer.observe(canvas)
			if (!reduced) raf = requestAnimationFrame(frame)
		})
		return () => {
			cancelled = true
			cancelAnimationFrame(raf)
			observer.disconnect()
			document.fonts.removeEventListener("loadingdone", redraw)
		}
	}, [text])

	return (
		<canvas
			ref={canvasRef}
			role="img"
			aria-label={text}
			className="block aspect-[4.2/1] w-[clamp(200px,28vw,440px)] [image-rendering:pixelated]"
		/>
	)
}
