import rough from 'roughjs'
import Analyser from './analyser'
import constant from './constant'

class Painter {
  constructor( el ) {
    this.analyser = new Analyser()
    this.analyser.analyse( el )
    this.paint = this.paint.bind( this )
    this.audioElement = el
    this.canvasElement = document.createElement( 'canvas' )
    this.canvasElement.id = 'moonlight-player'
    this.canvasElement.width = constant.CANVAS_WIDTH
    this.canvasElement.height = constant.CANVAS_HEIGHT
    this.canvasElement.style.width = constant.CANVAS_WIDTH + 'px'
    this.canvasElement.style.height = constant.CANVAS_HEIGHT + 'px'
    document.body.appendChild( this.canvasElement )
    this.canvasContext = this.canvasElement.getContext( '2d' )
    this.rc = rough.canvas( this.canvasElement )
    this.rcg = this.rc.generator
    this.prepare_shapes()
  }

  prepare_shapes() {
    const color = this.get_color()

    this.shapes = {}
    this.shapes.circle = this.rcg.circle(
      constant.CANVAS_WIDTH / 2,
      constant.CANVAS_HEIGHT / 2,
      constant.INNER_R * 2,
      {
        stroke: color,
      }
    )
    const cx = constant.CANVAS_WIDTH / 2
    const cy = constant.CANVAS_HEIGHT / 2
    const r = constant.INNER_R / 2
    this.shapes.play = this.rcg.polygon( [
      [
        cx - Math.cos( Math.PI / 3 ) * r,
        cy - Math.sin( Math.PI / 3 ) * r
      ],
      [
        cx - Math.cos( Math.PI / 3 ) * r,
        cy + Math.sin( Math.PI / 3 ) * r
      ],
      [
        cx + r,
        cy
      ],
    ], {
      stroke: color,
      fill: color
    } )

    const distance = constant.INNER_R / 5
    const rectWidth = constant.INNER_R / 4
    const rectHeight = constant.INNER_R / 3 * 2
    this.shapes.pause_left = this.rcg.polygon( [
      [
        cx - distance / 2 - rectWidth,
        cy + rectHeight / 2
      ],
      [
        cx - distance / 2,
        cy + rectHeight / 2
      ],
      [
        cx - distance / 2,
        cy - rectHeight / 2
      ],
      [
        cx - distance / 2 - rectWidth,
        cy - rectHeight / 2
      ],
    ], {
      stroke: color,
      fill: color
    } )
    this.shapes.pause_right = this.rcg.polygon( [
      [
        cx + distance / 2 + rectWidth,
        cy + rectHeight / 2
      ],
      [
        cx + distance / 2,
        cy + rectHeight / 2
      ],
      [
        cx + distance / 2,
        cy - rectHeight / 2
      ],
      [
        cx + distance / 2 + rectWidth,
        cy - rectHeight / 2
      ],
    ], {
      stroke: color,
      fill: color
    } )
  }

  init() {
    this.isPaused = true

    this.canvasElement.addEventListener( 'click', e => {
      if ( !this.is_in_circle( e.offsetX, e.offsetY ) ) {
        return
      }

      // toggle play / pause
      if ( this.isPaused ) {
        this.audioElement.play()
      } else {
        this.audioElement.pause()
      }
    } )

    this.canvasElement.addEventListener( 'mousemove', e => {
      if ( this.is_in_circle( e.offsetX, e.offsetY ) ) {
        this.canvasElement.style.cursor = 'pointer'
      } else {
        this.canvasElement.style.cursor = 'default'
      }
    } )

    this.audioElement.addEventListener( 'play', () => {
      this.isPaused = false
    } )

    this.audioElement.addEventListener( 'pause', () => {
      this.isPaused = true
    } )

    this.minHeight = 0

    this.paint()
  }

  is_in_circle( x, y ) {
    const cx = constant.CANVAS_WIDTH / 2
    const cy = constant.CANVAS_HEIGHT / 2

    const distance = Math.sqrt(
      ( cx - x ) * ( cx - x ) +
      ( cy - y ) * ( cy - y )
    )

    if ( distance < constant.INNER_R ) {
      return true
    }

    return false
  }

  paint() {
    requestAnimationFrame( this.paint )

    const analyser = this.analyser
    const data = analyser.getTimeDomain()

    const barSpaceAlpha = Math.PI * 2 / data.length
    const barPaddingAlpha = barSpaceAlpha * .3

    if ( this.isPaused && this.minHeight > 0 ) {
      this.minHeight = this.minHeight - 5
    } else if ( !this.isPaused && this.minHeight < constant.BAR_MIN_HEIGHT ) {
      this.minHeight = this.minHeight + 5
    }

    this.clear_canvas()
    this.paint_button()
    this.paint_bars(
      data,
      constant.INNER_R + 7,
      this.minHeight,
      barSpaceAlpha,
      barPaddingAlpha
    )
    if ( !this.isPaused ) {
      this.paint_curves(
        data,
        constant.INNER_R + 7,
        this.minHeight,
        barSpaceAlpha,
        barPaddingAlpha
      )
    }
  }

  clear_canvas() {
    this.canvasContext.clearRect( 0, 0, constant.CANVAS_WIDTH, constant.CANVAS_HEIGHT )
  }

  get_color() {
    return '#130CB7'
  }

  paint_button() {
    this.rc.draw( this.shapes.circle )
    if ( this.isPaused ) {
      this.rc.draw( this.shapes.play )
    } else {
      this.rc.draw( this.shapes.pause_left )
      this.rc.draw( this.shapes.pause_right )
    }
  }

  paint_bars( data, innerR, barMinHeight, barSpaceAlpha, barPaddingAlpha ) {
    const cx = constant.CANVAS_WIDTH / 2
    const cy = constant.CANVAS_HEIGHT / 2
    const color = this.get_color()

    for ( let i = 0; i < data.length; i++ ) {
      const value = ( data[ i ] || 128 ) / 128
      const rectHeight = Math.max( barMinHeight * value, 0 )
      if ( rectHeight === 0 ) {
        continue
      }
      const alpha = barSpaceAlpha * i + Math.PI
      const cos0 = Math.cos( alpha - barPaddingAlpha )
      const sin0 = Math.sin( alpha - barPaddingAlpha )
      const cos1 = Math.cos( alpha + barPaddingAlpha )
      const sin1 = Math.sin( alpha + barPaddingAlpha )

      this.rc.polygon( [
          [
            cx + cos0 * innerR,
            cy + sin0 * innerR
          ],
          [
            cx + cos0 * ( innerR + rectHeight ),
            cy + sin0 * ( innerR + rectHeight )
          ],
          [
            cx + cos1 * ( innerR + rectHeight ),
            cy + sin1 * ( innerR + rectHeight )
          ],
          [
            cx + cos1 * innerR,
            cy + sin1 * innerR
          ],
      ], {
        bowing: 3,
        stroke: color,
        fill: color,
      } )
    }
  }

  paint_curves( data, innerR, barMinHeight, barSpaceAlpha, barPaddingAlpha ) {
    const cx = constant.CANVAS_WIDTH / 2
    const cy = constant.CANVAS_HEIGHT / 2

    const points = []

    for ( let i = 0; i < data.length; i++ ) {
      const value = ( data[ i ] || 128 ) / 128
      const rectHeight = Math.max( barMinHeight * value, 0 )
        const alpha = barSpaceAlpha * i + Math.PI
        points.push( [
          cx + Math.cos( alpha ) * ( innerR + rectHeight ) * 1.1,
          cy + Math.sin( alpha ) * ( innerR + rectHeight ) * 1.1
        ] )
    }

    points.push( points[ 0 ] )

    this.rc.curve( points, {
      stroke: this.get_color(),
      strokeWidth: 1,
      roughness: 6,
    } )
  }
}

export default Painter
