import {
	ACESFilmicToneMapping,
	BoxGeometry,
	type BufferGeometry,
	Color,
	FogExp2,
	InstancedBufferAttribute,
	InstancedMesh,
	type Material,
	type Matrix4,
	MeshBasicMaterial,
	MeshPhysicalMaterial,
	Object3D,
	PerspectiveCamera,
	PMREMGenerator,
	Scene,
	SRGBColorSpace,
	Vector2,
	type WebGLProgramParametersWithUniforms,
	WebGLRenderer,
} from "three"
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js"
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js"
import { OutputPass } from "three/addons/postprocessing/OutputPass.js"
import { RenderPass } from "three/addons/postprocessing/RenderPass.js"
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js"
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js"
import type { Rgb } from "./css-color"

type WorldFrame = {
	time: number
	travel: number
	look: { x: number; y: number }
	roll: number
	twist: number
	palette: readonly [Rgb, Rgb]
	fade: number
	streak: number
	slow: number
	grain: number
}

export type TesseractWorld = {
	render: (frame: WorldFrame) => void
	resize: (width: number, height: number) => void
	dispose: () => void
}

const CELL = 2
const HALF_LINES = 5
const CHUNK_CELLS = 4
const CHUNK_DEPTH = CELL * CHUNK_CELLS
const CHUNKS = 6
const START_Z = 1
const RECYCLE_MARGIN = 0.5
const GLASS_CULL_DEPTH = 28
const WRAP_DEPTH = CHUNKS * CHUNK_DEPTH * 64
const BEAM_WIDTH = 0.07
const WALL_BEAM_SCALE = 2.4
const CORNER_SHARE = 0.35
const CORNER_BRIGHT_SHARE = 0.32
const PANEL_RINGS = [
	{ half: CELL, perCell: 10 },
	{ half: CELL * 2, perCell: 6 },
] as const
const STRIP_WIDTH_MIN = 0.04
const STRIP_WIDTH_RANGE = 0.26
const STRIP_LENGTH_MIN = 0.3
const STRIP_LENGTH_RANGE = 1.4
const STRIP_WAVE_PERIOD = 24
const STRIP_WAVE_FREQUENCY = (2 * Math.PI) / STRIP_WAVE_PERIOD
const STRIP_WAVE_SPEED = 0.9
const STRIP_STEP_RATE = 3.5
const STRIP_HIDE_SHARE = 0.35
const STRIP_SLIDE = 1.6
const STRIP_LIFT = 0.12
const TINT_GLASS = 0.45
const TINT_FOG = 0.018
const PANEL_THICKNESS = 0.012
const PANEL_OPACITY = 0.35
const PANEL_SHADE = 0.1
const PANEL_GLOW = 0.025
const PANEL_SEED = 97
const BLOCKS_PER_CHUNK = 550
const NEAR_WALL = CELL * 2
const NEAR_WALL_SHARE = 0.75
const NODE_BIAS = 0.6
const BRIGHT_SHARE = 0.12
const FOG_DENSITY = 0.055
const BACKGROUND = 0x050505
const FOV = 74
const SLOW_FOV_DROP = 12
const NEAR = 0.05
const FAR = 70
const MAX_PIXEL_RATIO = 1.25
const SWAY_X = 0.25
const SWAY_Y = 0.2
const LOOK_PITCH = 0.12
const LOOK_YAW = 0.18
const BLOOM_STRENGTH = 0.75
const BLOOM_RADIUS = 0.4
const BLOOM_THRESHOLD = 0.85
const ENV_BLUR = 0.04
const GLASS_SHADE = 0.12
const EXPOSURE = 0.9

type Segment = { x: number; y: number; z: number; axis: 0 | 1 | 2 }

const TWIST_UNIFORM = "uniform float uTwist;"

const TWISTED_NORMAL = /* glsl */ `
vec4 twistProbe = vec4( position, 1.0 );
#ifdef USE_INSTANCING
	twistProbe = instanceMatrix * twistProbe;
#endif
twistProbe = modelMatrix * twistProbe;
float normalTwist = ( twistProbe.z - cameraPosition.z ) * uTwist;
transformedNormal.xy = vec2(
	cos( normalTwist ) * transformedNormal.x - sin( normalTwist ) * transformedNormal.y,
	sin( normalTwist ) * transformedNormal.x + cos( normalTwist ) * transformedNormal.y
);
#include <normal_vertex>
`

function twistedProject(offset: string): string {
	return /* glsl */ `
vec4 twistedWorld = vec4( transformed, 1.0 );
#ifdef USE_INSTANCING
	twistedWorld = instanceMatrix * twistedWorld;
#endif
twistedWorld = modelMatrix * twistedWorld;
twistedWorld.xyz += ${offset};
float twistAngle = ( twistedWorld.z - cameraPosition.z ) * uTwist;
float twistCos = cos( twistAngle );
float twistSin = sin( twistAngle );
twistedWorld.xy = vec2(
	twistCos * twistedWorld.x - twistSin * twistedWorld.y,
	twistSin * twistedWorld.x + twistCos * twistedWorld.y
);
vec4 mvPosition = viewMatrix * twistedWorld;
gl_Position = projectionMatrix * mvPosition;
`
}

const PANEL_DECLARATIONS =
	"attribute float aSeed;\nattribute vec3 aWallNormal;\nuniform float uTime;"

const PANEL_SHATTER = /* glsl */ `
#include <begin_vertex>
vec4 panelCenter = modelMatrix * instanceMatrix * vec4( 0.0, 0.0, 0.0, 1.0 );
float panelWave = 0.5 + 0.5 * sin( panelCenter.z * ${STRIP_WAVE_FREQUENCY.toFixed(3)} + uTime * ${STRIP_WAVE_SPEED.toFixed(3)} + aSeed * 2.0 );
float panelActivity = smoothstep( 0.35, 0.85, panelWave );
float panelStep = floor( uTime * ${STRIP_STEP_RATE.toFixed(3)} + aSeed * 7.0 );
float panelJump = fract( sin( panelStep * 12.9898 + aSeed * 78.233 ) * 43758.5453 );
float panelHidden = step( panelJump, ${STRIP_HIDE_SHARE.toFixed(3)} * panelActivity );
transformed *= 1.0 - panelHidden;
`

const PANEL_OFFSET = `vec3( 0.0, 0.0, ( panelJump - 0.5 ) * ${STRIP_SLIDE.toFixed(3)} * panelActivity ) + aWallNormal * panelActivity * ${STRIP_LIFT.toFixed(3)}`

const BLOCK_UNIFORMS = "uniform float uTime;\nuniform vec3 uColorA;\nuniform vec3 uColorB;"

const BLOCK_COLOR = /* glsl */ `
float blockSeed = vColor.r;
float blockLight = vColor.g;
float blockPick = vColor.b;
float sparkle = pow( 0.5 + 0.5 * sin( uTime * 6.0 + blockSeed * 90.0 ), 8.0 );
vec3 blockBase = mix( uColorA, uColorB, step( 0.5, blockPick ) );
diffuseColor.rgb = blockBase * ( blockLight + sparkle * 3.5 );
`

const LENS_SHADER = {
	name: "LensShader",
	uniforms: {
		tDiffuse: { value: null },
		uResolution: { value: new Vector2(1, 1) },
		uTime: { value: 0 },
		uFade: { value: 0 },
		uStreak: { value: 0 },
		uSlow: { value: 0 },
		uGrain: { value: 0 },
	},
	vertexShader: /* glsl */ `
		varying vec2 vUv;
		void main() {
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
		}
	`,
	fragmentShader: /* glsl */ `
		uniform sampler2D tDiffuse;
		uniform vec2 uResolution;
		uniform float uTime;
		uniform float uFade;
		uniform float uStreak;
		uniform float uSlow;
		uniform float uGrain;
		varying vec2 vUv;

		const int STREAK_SAMPLES = 8;
		const float ABERRATION = 0.014;
		const float RING_RADIUS = 0.44;
		const float RING_WIDTH = 0.07;
		const float RING_STRENGTH = 0.18;
		const float RING_SLOW_GAIN = 0.9;
		const float GRAIN = 0.03;
		const float VIGNETTE_FLOOR = 0.1;

		vec3 split( vec2 uv, vec2 shift ) {
			return vec3(
				texture2D( tDiffuse, uv + shift ).r,
				texture2D( tDiffuse, uv ).g,
				texture2D( tDiffuse, uv - shift ).b
			);
		}

		float noise( vec2 p ) {
			return fract( sin( dot( p, vec2( 12.9898, 78.233 ) ) ) * 43758.5453 );
		}

		void main() {
			vec2 centered = vUv - 0.5;
			vec2 aspect = vec2( uResolution.x / uResolution.y, 1.0 );
			float radius = length( centered * aspect );
			float reach = length( centered ) * uStreak * uResolution.y;
			int samples = int( clamp( ceil( reach * 0.5 ), 1.0, float( STREAK_SAMPLES ) ) );
			float jitter = noise( gl_FragCoord.xy );
			vec3 color = vec3( 0.0 );
			for ( int i = 0; i < STREAK_SAMPLES; i++ ) {
				if ( i >= samples ) break;
				float k = ( float( i ) + jitter ) / float( samples );
				color += split( vUv - centered * uStreak * k, centered * ABERRATION * radius );
			}
			color /= float( samples );

			float offset = ( radius - RING_RADIUS ) / RING_WIDTH;
			vec3 spectrum = 0.5 + 0.5 * cos( 6.2831 * ( offset * 0.35 + vec3( 0.0, 0.33, 0.67 ) ) );
			color += spectrum * exp( -offset * offset ) * RING_STRENGTH * ( 1.0 + uSlow * RING_SLOW_GAIN ) * ( 0.8 + 0.2 * sin( uTime * 0.6 ) );

			float vignette = smoothstep( 1.2, 0.3, length( centered * 2.0 ) );
			color *= mix( VIGNETTE_FLOOR, 1.0, vignette ) * uFade;
			color += ( noise( gl_FragCoord.xy + fract( uGrain ) * 100.0 ) - 0.5 ) * GRAIN;
			gl_FragColor = vec4( color, 1.0 );
		}
	`,
}

/** Deterministic PRNG so every chunk is built the same on every visit. */
function mulberry32(seed: number): () => number {
	let a = seed >>> 0
	return () => {
		a = (a + 0x6d2b79f5) >>> 0
		let t = a
		t = Math.imul(t ^ (t >>> 15), t | 1)
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296
	}
}

function insideShaft(x: number, y: number): boolean {
	return Math.max(Math.abs(x), Math.abs(y)) < CELL * 0.999
}

function chunkSegments(): Segment[] {
	const segments: Segment[] = []
	const lines = Array.from({ length: HALF_LINES * 2 + 1 }, (_, i) => (i - HALF_LINES) * CELL)
	for (let layer = 0; layer < CHUNK_CELLS; layer++) {
		const z = -layer * CELL
		for (const x of lines) {
			for (const y of lines) {
				if (!insideShaft(x, y)) segments.push({ x, y, z: z - CELL / 2, axis: 2 })
				if (x < HALF_LINES * CELL && !insideShaft(x + CELL / 2, y))
					segments.push({ x: x + CELL / 2, y, z, axis: 0 })
				if (y < HALF_LINES * CELL && !insideShaft(x, y + CELL / 2))
					segments.push({ x, y: y + CELL / 2, z, axis: 1 })
			}
		}
	}
	return segments
}

function injectTwist(
	shader: WebGLProgramParametersWithUniforms,
	twist: { value: number },
	offset = "vec3( 0.0 )",
) {
	shader.uniforms.uTwist = twist
	shader.vertexShader = shader.vertexShader
		.replace("void main() {", `${TWIST_UNIFORM}\nvoid main() {`)
		.replace("#include <normal_vertex>", TWISTED_NORMAL)
		.replace("#include <project_vertex>", twistedProject(offset))
}

/** Skips glass fragments deep in the fog, where they are invisible but still cost full shading. */
function cullFarGlass(shader: WebGLProgramParametersWithUniforms) {
	shader.fragmentShader = shader.fragmentShader.replace(
		"void main() {",
		`void main() {\n#ifdef USE_FOG\nif ( vFogDepth > ${GLASS_CULL_DEPTH.toFixed(1)} ) discard;\n#endif`,
	)
}

function ringOf(s: { x: number; y: number }): number {
	return Math.max(Math.abs(s.x), Math.abs(s.y))
}

function isCorner(s: Segment): boolean {
	const ax = Math.abs(s.x)
	const ay = Math.abs(s.y)
	if (s.axis === 2) return ax === CELL && ay === CELL
	if (s.axis === 0) return ax === CELL / 2 && ay === CELL
	return ay === CELL / 2 && ax === CELL
}

function buildBeams(
	segments: Segment[],
	geometry: BufferGeometry,
	material: Material,
): InstancedMesh {
	const mesh = new InstancedMesh(geometry, material, segments.length)
	const dummy = new Object3D()
	segments.forEach((s, i) => {
		dummy.position.set(s.x, s.y, s.z)
		dummy.rotation.set(s.axis === 1 ? Math.PI / 2 : 0, s.axis === 0 ? Math.PI / 2 : 0, 0)
		const thickness = ringOf(s) <= CELL ? WALL_BEAM_SCALE : 1
		dummy.scale.set(thickness, thickness, 1)
		dummy.updateMatrix()
		mesh.setMatrixAt(i, dummy.matrix)
	})
	mesh.instanceMatrix.needsUpdate = true
	mesh.frustumCulled = false
	return mesh
}

function buildBlocks(
	segments: Segment[],
	geometry: BufferGeometry,
	material: Material,
	seed: number,
): InstancedMesh {
	const random = mulberry32(seed)
	const nearWall = segments.filter((s) => ringOf(s) <= NEAR_WALL)
	const corners = segments.filter(isCorner)
	const mesh = new InstancedMesh(geometry, material, BLOCKS_PER_CHUNK)
	const dummy = new Object3D()
	const color = new Color()
	for (let i = 0; i < BLOCKS_PER_CHUNK; i++) {
		const pick = random()
		const pool = pick < CORNER_SHARE ? corners : pick < NEAR_WALL_SHARE ? nearWall : segments
		const brightShare = pool === corners ? CORNER_BRIGHT_SHARE : BRIGHT_SHARE
		const s = pool[Math.floor(random() * pool.length)]
		const along =
			random() < NODE_BIAS ? (random() < 0.5 ? random() * 0.2 : 0.8 + random() * 0.2) : random()
		const length = 0.05 + random() ** 2 * 0.4
		const width = 0.03 + random() * 0.1
		const height = 0.03 + random() * 0.1
		const side = random() < 0.5 ? -1 : 1
		const lift = side * (BEAM_WIDTH / 2 + height / 2)
		const offset = (along - 0.5) * CELL
		if (s.axis === 2) {
			dummy.position.set(s.x + lift, s.y + (random() - 0.5) * BEAM_WIDTH, s.z + offset)
			dummy.scale.set(height, width, length)
		} else if (s.axis === 0) {
			dummy.position.set(s.x + offset, s.y + lift, s.z + (random() - 0.5) * BEAM_WIDTH)
			dummy.scale.set(length, height, width)
		} else {
			dummy.position.set(s.x + (random() - 0.5) * BEAM_WIDTH, s.y + offset, s.z + lift)
			dummy.scale.set(width, length, height)
		}
		dummy.updateMatrix()
		mesh.setMatrixAt(i, dummy.matrix)
		const light = random() < brightShare ? 1.6 + random() * 2.4 : 0.02 + random() * 0.1
		mesh.setColorAt(i, color.setRGB(random(), light, random()))
	}
	mesh.instanceMatrix.needsUpdate = true
	if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
	mesh.frustumCulled = false
	return mesh
}

type PanelLayout = { geometry: BufferGeometry; matrices: Matrix4[] }

/**
 * Thin glass strips lining the shaft walls and the next ring out, long along the fall. Each
 * carries a seed and its wall's outward normal; the vertex shader makes strips in a travelling
 * wave jump along the fall axis and blink out, so the walls break apart and reassemble.
 */
function buildPanelLayout(): PanelLayout {
	const random = mulberry32(PANEL_SEED)
	const dummy = new Object3D()
	const matrices: Matrix4[] = []
	const seeds: number[] = []
	const normals: number[] = []
	const walls = [
		[1, 0],
		[-1, 0],
		[0, 1],
		[0, -1],
	] as const
	for (const ring of PANEL_RINGS) {
		for (let layer = 0; layer < CHUNK_CELLS; layer++) {
			const zc = -layer * CELL - CELL / 2
			for (const [nx, ny] of walls) {
				for (let u = -ring.half + CELL / 2; u < ring.half; u += CELL) {
					for (let n = 0; n < ring.perCell; n++) {
						const w = STRIP_WIDTH_MIN + random() * STRIP_WIDTH_RANGE
						const d = STRIP_LENGTH_MIN + random() * STRIP_LENGTH_RANGE
						const along = u + (random() - 0.5) * (CELL - w)
						const z = zc + (random() - 0.5) * (CELL - d)
						const depth = (random() - 0.5) * 0.1
						if (nx !== 0) {
							dummy.position.set(nx * ring.half + depth, along, z)
							dummy.scale.set(PANEL_THICKNESS, w, d)
						} else {
							dummy.position.set(along, ny * ring.half + depth, z)
							dummy.scale.set(w, PANEL_THICKNESS, d)
						}
						dummy.updateMatrix()
						matrices.push(dummy.matrix.clone())
						seeds.push(random())
						normals.push(nx, ny, 0)
					}
				}
			}
		}
	}
	const geometry = new BoxGeometry(1, 1, 1)
	geometry.setAttribute("aSeed", new InstancedBufferAttribute(new Float32Array(seeds), 1))
	geometry.setAttribute("aWallNormal", new InstancedBufferAttribute(new Float32Array(normals), 3))
	return { geometry, matrices }
}

function buildPanels(layout: PanelLayout, material: Material): InstancedMesh {
	const mesh = new InstancedMesh(layout.geometry, material, layout.matrices.length)
	layout.matrices.forEach((matrix, i) => {
		mesh.setMatrixAt(i, matrix)
	})
	mesh.instanceMatrix.needsUpdate = true
	mesh.frustumCulled = false
	return mesh
}

/**
 * The backdrop scene: an endless lattice of glass bars (the inside of a tesseract) with clusters
 * of glowing blocks, recycled in chunks as the camera falls through it, rendered through bloom
 * and a lens pass (radial streaks, chromatic aberration, spectral ring, vignette, grain).
 */
export function createTesseractWorld(canvas: HTMLCanvasElement, beamColor: Rgb): TesseractWorld {
	const renderer = new WebGLRenderer({
		canvas,
		antialias: false,
		powerPreference: "high-performance",
	})
	try {
		return buildWorld(renderer, beamColor)
	} catch (error) {
		renderer.forceContextLoss()
		renderer.dispose()
		throw error
	}
}

function buildWorld(renderer: WebGLRenderer, beamColor: Rgb): TesseractWorld {
	renderer.toneMapping = ACESFilmicToneMapping
	renderer.toneMappingExposure = EXPOSURE
	renderer.outputColorSpace = SRGBColorSpace
	renderer.setClearColor(BACKGROUND, 1)

	const scene = new Scene()
	const fog = new FogExp2(BACKGROUND, FOG_DENSITY)
	scene.fog = fog
	scene.background = fog.color
	const pmrem = new PMREMGenerator(renderer)
	const room = new RoomEnvironment()
	const environmentTarget = pmrem.fromScene(room, ENV_BLUR)
	const environment = environmentTarget.texture
	room.dispose()
	scene.environment = environment

	const camera = new PerspectiveCamera(FOV, 1, NEAR, FAR)
	camera.rotation.order = "ZXY"

	const twist = { value: 0 }
	const blockUniforms = {
		uTime: { value: 0 },
		uColorA: { value: new Color() },
		uColorB: { value: new Color() },
	}

	const glass = new MeshPhysicalMaterial({
		color: new Color(beamColor[0], beamColor[1], beamColor[2]).multiplyScalar(GLASS_SHADE),
		metalness: 0,
		roughness: 0.06,
		clearcoat: 1,
		clearcoatRoughness: 0.04,
		iridescence: 0.9,
		iridescenceIOR: 1.5,
		envMapIntensity: 0.16,
		transparent: true,
		opacity: 0.4,
		depthWrite: false,
	})
	glass.onBeforeCompile = (shader) => {
		injectTwist(shader, twist)
		cullFarGlass(shader)
	}
	glass.customProgramCacheKey = () => "tesseract-glass"

	const panelGlass = glass.clone()
	panelGlass.opacity = PANEL_OPACITY
	panelGlass.color.multiplyScalar(PANEL_SHADE / GLASS_SHADE)
	const glassBase = glass.color.clone()
	const panelBase = panelGlass.color.clone()
	const tintTarget = new Color()
	panelGlass.customProgramCacheKey = () => "tesseract-panel"
	panelGlass.onBeforeCompile = (shader) => {
		injectTwist(shader, twist, PANEL_OFFSET)
		cullFarGlass(shader)
		shader.uniforms.uTime = blockUniforms.uTime
		shader.vertexShader = shader.vertexShader
			.replace("void main() {", `${PANEL_DECLARATIONS}\nvoid main() {`)
			.replace("#include <begin_vertex>", PANEL_SHATTER)
	}

	const glow = new MeshBasicMaterial({ color: 0xffffff, toneMapped: false })
	glow.customProgramCacheKey = () => "tesseract-glow"
	glow.onBeforeCompile = (shader) => {
		injectTwist(shader, twist)
		Object.assign(shader.uniforms, blockUniforms)
		shader.fragmentShader = shader.fragmentShader
			.replace("void main() {", `${BLOCK_UNIFORMS}\nvoid main() {`)
			.replace("#include <color_fragment>", BLOCK_COLOR)
	}

	const segments = chunkSegments()
	const panelLayout = buildPanelLayout()
	const beamGeometry = new BoxGeometry(BEAM_WIDTH, BEAM_WIDTH, CELL)
	const blockGeometry = new BoxGeometry(1, 1, 1)
	const chunks = Array.from({ length: CHUNKS }, (_, k) => {
		const beams = buildBeams(segments, beamGeometry, glass)
		const blocks = buildBlocks(segments, blockGeometry, glow, k + 1)
		const panels = buildPanels(panelLayout, panelGlass)
		const group = new Object3D()
		group.add(beams, blocks, panels)
		group.position.z = START_Z - k * CHUNK_DEPTH
		scene.add(group)
		return { group, beams, blocks, panels }
	})

	const composer = new EffectComposer(renderer)
	const lens = new ShaderPass(LENS_SHADER)
	const passes = [
		new RenderPass(scene, camera),
		new UnrealBloomPass(new Vector2(1, 1), BLOOM_STRENGTH, BLOOM_RADIUS, BLOOM_THRESHOLD),
		lens,
		new OutputPass(),
	]
	for (const pass of passes) composer.addPass(pass)

	let wrapped = 0

	function wrap(travel: number): number {
		const depth = travel % WRAP_DEPTH
		if (depth < wrapped) {
			for (const chunk of chunks) chunk.group.position.z += WRAP_DEPTH
		}
		wrapped = depth
		return depth
	}

	function recycle() {
		for (const chunk of chunks) {
			if (chunk.group.position.z - CHUNK_DEPTH > camera.position.z + RECYCLE_MARGIN) {
				chunk.group.position.z -= CHUNKS * CHUNK_DEPTH
			}
		}
		const farFirst = [...chunks].sort((a, b) => a.group.position.z - b.group.position.z)
		farFirst.forEach((chunk, rank) => {
			chunk.beams.renderOrder = rank * 2
			chunk.panels.renderOrder = rank * 2 + 1
		})
	}

	return {
		render({ time, travel, look, roll, twist: twistAmount, palette, fade, streak, slow, grain }) {
			camera.fov = FOV - SLOW_FOV_DROP * slow
			camera.updateProjectionMatrix()
			camera.position.set(
				Math.sin(time * 0.31) * SWAY_X,
				Math.cos(time * 0.23) * SWAY_Y,
				START_Z - wrap(travel),
			)
			camera.rotation.set(-look.y * LOOK_PITCH, -look.x * LOOK_YAW, roll)
			recycle()
			twist.value = twistAmount
			blockUniforms.uTime.value = time
			blockUniforms.uColorA.value.setRGB(palette[0][0], palette[0][1], palette[0][2])
			blockUniforms.uColorB.value.setRGB(palette[1][0], palette[1][1], palette[1][2])
			const tint = blockUniforms.uColorA.value
			glass.color
				.copy(glassBase)
				.lerp(tintTarget.copy(tint).multiplyScalar(GLASS_SHADE), TINT_GLASS)
			panelGlass.color
				.copy(panelBase)
				.lerp(tintTarget.copy(tint).multiplyScalar(PANEL_SHADE), TINT_GLASS)
			panelGlass.emissive.copy(tint).multiplyScalar(PANEL_GLOW)
			fog.color.copy(tint).multiplyScalar(TINT_FOG)
			lens.uniforms.uTime.value = time
			lens.uniforms.uFade.value = fade
			lens.uniforms.uStreak.value = streak
			lens.uniforms.uSlow.value = slow
			lens.uniforms.uGrain.value = grain
			composer.render()
		},
		resize(width, height) {
			const ratio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO)
			renderer.setPixelRatio(ratio)
			renderer.setSize(width, height, false)
			composer.setPixelRatio(ratio)
			composer.setSize(width, height)
			camera.aspect = width / Math.max(1, height)
			camera.updateProjectionMatrix()
			lens.uniforms.uResolution.value.set(width, height)
		},
		dispose() {
			for (const chunk of chunks) {
				chunk.beams.dispose()
				chunk.blocks.dispose()
				chunk.panels.dispose()
			}
			panelGlass.dispose()
			beamGeometry.dispose()
			panelLayout.geometry.dispose()
			blockGeometry.dispose()
			glass.dispose()
			glow.dispose()
			environmentTarget.dispose()
			pmrem.dispose()
			for (const pass of passes) pass.dispose()
			composer.dispose()
			renderer.forceContextLoss()
			renderer.dispose()
		},
	}
}
