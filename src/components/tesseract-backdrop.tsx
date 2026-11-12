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
const SLOW_TIME_SCALE = 0.12
const SLOW_IN_PER_S = 5
const SLOW_OUT_PER_S = 8
const HOLD_MOUSE_MS = 180
const HOLD_TOUCH_MS = 250
const SWIPE_SLOP_PX = 8
const TOUCH_GAIN = 0.06
const RELEASE_KICK = 7
const TOUCH_LOOK_GAIN = 2
const HOLD_EXEMPT = "a, button, input, .sissy-cat"
const BEAM_COLOR_PROPERTY = "--scene"

const WHEEL_LINE_PX = 16

function wheelUnit(deltaMode: number): number {
	if (deltaMode === WheelEvent.DOM_DELTA_LINE) return WHEEL_LINE_PX
	if (deltaMode === WheelEvent.DOM_DELTA_PAGE) return window.innerHeight
	return 1
}

/** Look offset for a finger dragged across a share of the screen: the view follows the drag. */
function dragLook(deltaPx: number, sizePx: number): number {
	return Math.max(-1, Math.min(1, (deltaPx / sizePx) * TOUCH_LOOK_GAIN))
}

type Props = {
	paused: boolean
}

/**
 * The page backdrop: a three.js fall through the inside of a tesseract, loaded on demand.
 * Scrolling the wheel or swiping speeds the fall up; holding the mouse button or a finger still
 * slows time until release, and dragging a finger turns the view. Renders nothing when WebGL is
 * unavailable.
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
		let clock = 0
		let timeScale = 1
		let holding = false
		let holdTimer = 0
		let swiping = false
		const touch = { startX: 0, startY: 0, x: 0, y: 0 }

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
				slow: 0,
				grain: 0,
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
			clock += elapsed
			const scaleTarget = holding ? SLOW_TIME_SCALE : 1
			const scaleRate = holding ? SLOW_IN_PER_S : SLOW_OUT_PER_S
			timeScale += (scaleTarget - timeScale) * Math.min(1, scaleRate * elapsed)
			const scaled = elapsed * timeScale
			seconds += scaled
			boostTarget *= Math.exp(-BOOST_DECAY_PER_S * elapsed)
			boost += (boostTarget - boost) * Math.min(1, BOOST_EASE_PER_S * elapsed)
			const speed = baseSpeed(seconds) + boost
			const twist = twistAt(seconds)
			travel += speed * scaled
			roll += twist * speed * ROLL_FOLLOW * scaled
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
				streak: streakFor(speed) * timeScale,
				slow: (1 - timeScale) / (1 - SLOW_TIME_SCALE),
				grain: clock,
			})
		}

		function handleMove(e: PointerEvent) {
			if (e.pointerType !== "mouse") return
			if (e.buttons === 0) release()
			target.x = (e.clientX / window.innerWidth) * 2 - 1
			target.y = (e.clientY / window.innerHeight) * 2 - 1
		}

		function handleLeave() {
			target.x = 0
			target.y = 0
		}

		function addBoost(amount: number) {
			boostTarget = Math.min(MAX_BOOST, boostTarget + amount)
		}

		function handleWheel(e: WheelEvent) {
			if (pausedRef.current) return
			addBoost(Math.abs(e.deltaY) * wheelUnit(e.deltaMode) * WHEEL_GAIN)
		}

		function armHold(target: EventTarget | null, delayMs: number) {
			clearTimeout(holdTimer)
			if (pausedRef.current) return
			if (target instanceof Element && target.closest(HOLD_EXEMPT)) return
			holdTimer = window.setTimeout(() => {
				holding = true
			}, delayMs)
		}

		function release() {
			clearTimeout(holdTimer)
			if (!holding) return
			holding = false
			addBoost(RELEASE_KICK)
		}

		function handleDown(e: PointerEvent) {
			if (e.pointerType === "mouse" && e.button === 0) armHold(e.target, HOLD_MOUSE_MS)
		}

		function handleUp(e: PointerEvent) {
			if (e.pointerType === "mouse") release()
		}

		function handleTouchStart(e: TouchEvent) {
			if (e.touches.length !== 1) {
				release()
				return
			}
			const { clientX, clientY } = e.touches[0]
			touch.startX = touch.x = clientX
			touch.startY = touch.y = clientY
			swiping = false
			armHold(e.target, HOLD_TOUCH_MS)
		}

		function handleTouchMove(e: TouchEvent) {
			if (e.touches.length !== 1 || pausedRef.current) return
			const { clientX, clientY } = e.touches[0]
			target.x = dragLook(touch.startX - clientX, window.innerWidth)
			target.y = dragLook(touch.startY - clientY, window.innerHeight)
			if (holding) return
			if (!swiping) {
				if (Math.hypot(clientX - touch.startX, clientY - touch.startY) < SWIPE_SLOP_PX) return
				swiping = true
				clearTimeout(holdTimer)
			}
			addBoost(Math.hypot(clientX - touch.x, clientY - touch.y) * TOUCH_GAIN)
			touch.x = clientX
			touch.y = clientY
		}

		function handleTouchEnd() {
			release()
			handleLeave()
		}

		function handleHidden() {
			if (document.hidden) release()
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
				window.addEventListener("pointerdown", handleDown)
				window.addEventListener("pointerup", handleUp)
				window.addEventListener("pointercancel", handleUp)
				window.addEventListener("touchstart", handleTouchStart, { passive: true })
				window.addEventListener("touchmove", handleTouchMove, { passive: true })
				window.addEventListener("touchend", handleTouchEnd)
				window.addEventListener("touchcancel", handleTouchEnd)
				window.addEventListener("blur", release)
				document.addEventListener("visibilitychange", handleHidden)
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
			window.removeEventListener("pointerdown", handleDown)
			window.removeEventListener("pointerup", handleUp)
			window.removeEventListener("pointercancel", handleUp)
			window.removeEventListener("touchstart", handleTouchStart)
			window.removeEventListener("touchmove", handleTouchMove)
			window.removeEventListener("touchend", handleTouchEnd)
			window.removeEventListener("touchcancel", handleTouchEnd)
			window.removeEventListener("blur", release)
			document.removeEventListener("visibilitychange", handleHidden)
			clearTimeout(holdTimer)
			world?.dispose()
		}
	}, [])

	return (
		<div aria-hidden="true" className="pointer-events-none fixed inset-0">
			<canvas ref={canvasRef} className="block size-full" />
		</div>
	)
}
