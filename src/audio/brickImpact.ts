type WebAudioWindow = Window &
  typeof globalThis & {
    readonly webkitAudioContext?: typeof AudioContext
  }

let audioContext: AudioContext | null = null

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

const playImpact = (context: AudioContext) => {
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

export const playBrickImpactSound = () => {
  const context = getAudioContext()

  if (!context) {
    return
  }

  if (context.state === 'suspended') {
    void context.resume().then(() => playImpact(context))
    return
  }

  playImpact(context)
}
