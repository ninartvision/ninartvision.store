import {artist} from './artist'
import {artwork} from './artwork'
import {homepage} from './homepage'
import {page} from './page'
import {siteSettings} from './siteSettings'
import {slider} from './slider'
import {article} from './article'

// Objects
import {heroSection} from './objects/heroSection'
import {gallerySection} from './objects/gallerySection'
import {artistSection} from './objects/artistSection'
import {articleSection} from './objects/articleSection'
import {textSection} from './objects/textSection'
import {sliderSection} from './objects/sliderSection'
import {sliderReference} from './objects/sliderReference'
import {pageBuilder} from './objects/pageBuilder'
import {portableTextBlock} from './objects/portableTextBlock'
import {slide} from './objects/slide'
import {seoMeta} from './objects/seoMeta'

export const schemaTypes = [
  // Documents
  homepage,
  page,
  siteSettings,
  artist,
  artwork,
  slider,
  article,
  
  // Objects
  pageBuilder,
  portableTextBlock,
  heroSection,
  gallerySection,
  artistSection,
  articleSection,
  textSection,
  sliderSection,
  sliderReference,
  slide,
  seoMeta,
]
