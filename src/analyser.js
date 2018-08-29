class AudioAnalyser {
  constructor() {
    const audioContext = new AudioContext()
    const analyser = audioContext.createAnalyser()

    this.audioContext = audioContext
    this.analyser = analyser
  }

  analyse( audioElm, { fftSize = 64 } = {} ) {
    if ( this.source ) {
      this.source.disconnect()
      this.source = null
    }

    const source = this.source = this.audioContext.createMediaElementSource( audioElm )
    const analyser = this.analyser

    // connect to analyser
    source.connect( analyser )
    // output to sound card
    analyser.disconnect()
    analyser.connect( this.audioContext.destination )
    analyser.fftSize = fftSize

    this.data = new Uint8Array( analyser.frequencyBinCount )

    return this
  }

  getFrequency() {
    const analyser = this.analyser

    if ( !analyser ) {
      throw new Error( 'Expect invoke after analyse' )
    }

    analyser.getByteFrequencyData( this.data )

    return this.data
  }

  getTimeDomain() {
    const analyser = this.analyser

    if ( !analyser ) {
      throw new Error( 'Expect invoke after analyse' )
    }

    analyser.getByteTimeDomainData( this.data )

    return this.data
  }
}

export default AudioAnalyser
