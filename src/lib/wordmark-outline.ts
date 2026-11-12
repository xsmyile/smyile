import { bayerThreshold, type Rgb, writePixel } from "./dither"

/** Distance of every inside cell from the glyph outline, in cells; 0 outside the glyphs. */
export type DistanceField = {
	cols: number
	rows: number
	distance: Float32Array
}

const INSIDE_ALPHA = 110
const UNSET = Number.POSITIVE_INFINITY
const STRAIGHT = 1
const DIAGONAL = Math.SQRT2
const OUTLINE_WIDTH = 1.5
const REST_LIGHT = 0.5
const SWEEP_WIDTH = 0.012

/** Two-pass chamfer distance transform of the alpha channel of RGBA `pixels`. */
export function distanceField(
	pixels: Uint8ClampedArray,
	cols: number,
	rows: number,
): DistanceField {
	const distance = new Float32Array(cols * rows)
	for (let i = 0; i < distance.length; i++)
		distance[i] = pixels[i * 4 + 3] > INSIDE_ALPHA ? UNSET : 0

	for (let y = 0; y < rows; y++) {
		for (let x = 0; x < cols; x++) {
			const i = y * cols + x
			if (distance[i] === 0) continue
			let d = x === 0 || y === 0 ? STRAIGHT : distance[i]
			if (x > 0) d = Math.min(d, distance[i - 1] + STRAIGHT)
			if (y > 0) d = Math.min(d, distance[i - cols] + STRAIGHT)
			if (x > 0 && y > 0) d = Math.min(d, distance[i - cols - 1] + DIAGONAL)
			if (x < cols - 1 && y > 0) d = Math.min(d, distance[i - cols + 1] + DIAGONAL)
			distance[i] = d
		}
	}
	for (let y = rows - 1; y >= 0; y--) {
		for (let x = cols - 1; x >= 0; x--) {
			const i = y * cols + x
			if (distance[i] === 0) continue
			let d = x === cols - 1 || y === rows - 1 ? STRAIGHT : distance[i]
			if (x < cols - 1) d = Math.min(d, distance[i + 1] + STRAIGHT)
			if (y < rows - 1) d = Math.min(d, distance[i + cols] + STRAIGHT)
			if (x < cols - 1 && y < rows - 1) d = Math.min(d, distance[i + cols + 1] + DIAGONAL)
			if (x > 0 && y < rows - 1) d = Math.min(d, distance[i + cols - 1] + DIAGONAL)
			distance[i] = d
		}
	}
	return { cols, rows, distance }
}

/**
 * Paints the glyph outline, dithered: dim at rest, full where a soft band of light passes.
 * `sweep` is the band center as a fraction of the width; values outside 0..1 leave it at rest.
 */
export function paintOutline(
	field: DistanceField,
	pixels: Uint8ClampedArray,
	ink: Rgb,
	sweep: number,
) {
	const { cols, rows, distance } = field
	for (let y = 0; y < rows; y++) {
		for (let x = 0; x < cols; x++) {
			const i = y * cols + x
			const d = distance[i]
			const dx = x / cols - sweep
			const light = REST_LIGHT + (1 - REST_LIGHT) * Math.exp(-(dx * dx) / SWEEP_WIDTH)
			writePixel(pixels, i, ink, d > 0 && d < OUTLINE_WIDTH && light > bayerThreshold(x, y))
		}
	}
}
