type WebAudioWindow = Window &
  typeof globalThis & {
    readonly webkitAudioContext?: typeof AudioContext
  }

let audioContext: AudioContext | null = null
let muted = false

/** 効果音のオン/オフ。UI（設定・ワンタップ静かモード）から切り替える。 */
export const setSoundMuted = (value: boolean): void => {
  muted = value
}

const getAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') {
    return null
  }

  const audioWindow = window as WebAudioWindow
  const AudioContextConstructor = audioWindow.AudioContext ?? audioWindow.webkitAudioContext

  if (!AudioContextConstructor) {
    return null
  }

  audioContext ??= new AudioContextConstructor()

  return audioContext
}

const createNoiseBuffer = (context: AudioContext, duration: number): AudioBuffer => {
  const frameCount = Math.floor(context.sampleRate * duration)
  const buffer = context.createBuffer(1, frameCount, context.sampleRate)
  const output = buffer.getChannelData(0)

  for (let frame = 0; frame < frameCount; frame += 1) {
    const decay = 1 - frame / frameCount
    output[frame] = (Math.random() * 2 - 1) * decay
  }

  return buffer
}

/** 移動成功: レンガが滑って軽く当たる短い打音。 */
const renderMove = (context: AudioContext) => {
  const now = context.currentTime
  const duration = 0.075

  const noise = context.createBufferSource()
  noise.buffer = createNoiseBuffer(context, duration)

  const filter = context.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.setValueAtTime(420, now)
  filter.frequency.exponentialRampToValueAtTime(180, now + duration)
  filter.Q.setValueAtTime(1.8, now)

  const noiseGain = context.createGain()
  noiseGain.gain.setValueAtTime(0.0001, now)
  noiseGain.gain.exponentialRampToValueAtTime(0.22, now + 0.005)
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + duration)

  const thump = context.createOscillator()
  thump.type = 'triangle'
  thump.frequency.setValueAtTime(150, now)
  thump.frequency.exponentialRampToValueAtTime(75, now + 0.045)

  const thumpGain = context.createGain()
  thumpGain.gain.setValueAtTime(0.0001, now)
  thumpGain.gain.exponentialRampToValueAtTime(0.12, now + 0.004)
  thumpGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.055)

  noise.connect(filter).connect(noiseGain).connect(context.destination)
  thump.connect(thumpGain).connect(context.destination)

  noise.start(now)
  noise.stop(now + duration)
  thump.start(now)
  thump.stop(now + 0.06)
}

/** 壁ヒット（動けない手）: 主張しすぎない、こもった低い当たり。 */
const renderWallHit = (context: AudioContext) => {
  const now = context.currentTime
  const duration = 0.09

  const noise = context.createBufferSource()
  noise.buffer = createNoiseBuffer(context, duration)

  const filter = context.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(220, now)
  filter.Q.setValueAtTime(0.7, now)

  const gain = context.createGain()
  gain.gain.setValueAtTime(0.0001, now)
  gain.gain.exponentialRampToValueAtTime(0.13, now + 0.006)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)

  noise.connect(filter).connect(gain).connect(context.destination)
  noise.start(now)
  noise.stop(now + duration)
}

/** クリア: 短い2音の上昇。派手すぎない達成感。 */
const renderClear = (context: AudioContext) => {
  const now = context.currentTime
  const notes = [
    { freq: 392, start: 0, dur: 0.13 }, // G4
    { freq: 587, start: 0.1, dur: 0.22 }, // D5
  ]

  for (const note of notes) {
    const start = now + note.start
    const osc = context.createOscillator()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(note.freq, start)

    const gain = context.createGain()
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(0.16, start + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + note.dur)

    osc.connect(gain).connect(context.destination)
    osc.start(start)
    osc.stop(start + note.dur + 0.02)
  }
}

const play = (render: (context: AudioContext) => void) => {
  if (muted) {
    return
  }

  const context = getAudioContext()

  if (!context) {
    return
  }

  if (context.state === 'suspended') {
    void context.resume().then(() => render(context))
    return
  }

  render(context)
}

export const playMoveSound = () => play(renderMove)
export const playWallHitSound = () => play(renderWallHit)
export const playClearSound = () => play(renderClear)
