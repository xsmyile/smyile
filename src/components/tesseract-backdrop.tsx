import { useEffect, useRef } from "react"
import { readCssColor } from "../lib/css-color"
import { REDUCED_MOTION_QUERY } from "../lib/motion"
import type { TesseractWorld } from "../lib/tesseract-world"
import { baseSpeed, fadeIn, paletteAt, streakFor, twistAt } from "../lib/tunnel-timeline"

const MAX_STEP_S = 0.1
const POINTER_RATE_PER_S = 3
const MIN_FRAME_MS = 15
const WHEEL_GAIN = 0.03
const MAX_BOOST = 28
const BOOST_DECAY_PER_S = 1.4
const BOOST_EASE_PER_S = 6
const ROLL_FOLLOW = 0.6
const STILL_TIME_S = 6
const STILL_TRAVEL = 24
const BEAM_COLOR_PROPERTY = "--scene"

const WHEEL_LINE_PX = 16

function wheelUnit(deltaMode: number): number {
	if (deltaMode === WheelEvent.DOM_DELTA_LINE) return WHEEL_LINE_PX
	if (deltaMode === WheelEvent.DOM_DELTA_PAGE) return window.innerHeight
	return 1
}

type Props = {
	paused: boolean
}

/**
 * The page backdrop: a three.js fall through the inside of a tesseract, loaded on demand.
 * Scrolling the wheel speeds the fall up. Renders nothing when WebGL is unavailable.
 */
export function TesseractBackdrop({ paused }: Props) {
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const pausedRef = useRef(paused)

	useEffect(() => {
		pausedRef.current = paused
	}, [paused])

	useEffect(() => {
		const canvas = canvasRef.current
		if (!canvas) return
		const reduced = window.matchMedia(REDUCED_MOTION_QUERY).matches
		const look = { x: 0, y: 0 }
		const target = { x: 0, y: 0 }
		let world: TesseractWorld | null = null
		let cancelled = false
		let raf = 0
		let last = 0
		let seconds = 0
		let travel = 0
		let roll = 0
		let boost = 0
		let boostTarget = 0

		function drawStill() {
			world?.render({
				time: STILL_TIME_S,
				travel: STILL_TRAVEL,
				look,
				roll: 0,
				twist: 0,
				palette: paletteAt(STILL_TIME_S),
				fade: 1,
				streak: 0,
			})
		}

		function fit() {
			if (!canvas || !world) return
			const { width, height } = canvas.getBoundingClientRect()
			if (width < 1 || height < 1) return
			world.resize(width, height)
			if (reduced) drawStill()
		}

		function frame(now: number) {
			raf = requestAnimationFrame(frame)
			if (last && now - last < MIN_FRAME_MS) return
			const elapsed = last ? Math.min((now - last) / 1000, MAX_STEP_S) : 0
			last = now
			if (pausedRef.current || !world) return
			seconds += elapsed
			boostTarget *= Math.exp(-BOOST_DECAY_PER_S * elapsed)
			boost += (boostTarget - boost) * Math.min(1, BOOST_EASE_PER_S * elapsed)
			const speed = baseSpeed(seconds) + boost
			const twist = twistAt(seconds)
			travel += speed * elapsed
			roll += twist * speed * ROLL_FOLLOW * elapsed
			const ease = 1 - Math.exp(-POINTER_RATE_PER_S * elapsed)
			look.x += (target.x - look.x) * ease
			look.y += (target.y - look.y) * ease
			world.render({
				time: seconds,
				travel,
				look,
				roll,
				twist,
				palette: paletteAt(seconds),
				fade: fadeIn(seconds),
				streak: streakFor(speed),
			})
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

		function handleWheel(e: WheelEvent) {
			if (pausedRef.current) return
			const pixels = Math.abs(e.deltaY) * wheelUnit(e.deltaMode)
			boostTarget = Math.min(MAX_BOOST, boostTarget + pixels * WHEEL_GAIN)
		}

		const observer = new ResizeObserver(fit)
		import("../lib/tesseract-world")
			.then(({ createTesseractWorld }) => {
				if (cancelled) return
				world = createTesseractWorld(canvas, readCssColor(BEAM_COLOR_PROPERTY))
				observer.observe(canvas)
				fit()
				if (reduced) return
				raf = requestAnimationFrame(frame)
				window.addEventListener("pointermove", handleMove)
				document.documentElement.addEventListener("pointerleave", handleLeave)
				window.addEventListener("wheel", handleWheel, { passive: true })
			})
			.catch((error: unknown) => {
				console.warn("Backdrop: the 3D scene could not start, showing a plain background", error)
			})

		return () => {
			cancelled = true
			cancelAnimationFrame(raf)
			observer.disconnect()
			window.removeEventListener("pointermove", handleMove)
			document.documentElement.removeEventListener("pointerleave", handleLeave)
			window.removeEventListener("wheel", handleWheel)
			world?.dispose()
		}
	}, [])

	return (
		<div aria-hidden="true" className="pointer-events-none fixed inset-0">
			<canvas ref={canvasRef} className="block size-full" />
		</div>
	)
}
