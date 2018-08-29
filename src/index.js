import Painter from './painter'
import musicSrc from './media/aLIEz.mp3'

loadMusic( musicSrc )

function loadMusic( src ) {
  const audio = document.createElement( 'audio' )
  audio.src = src
  audio.preload = true
  audio.style.display = 'none'
  document.body.appendChild( audio )

  new Painter( audio )
    .init()
}
