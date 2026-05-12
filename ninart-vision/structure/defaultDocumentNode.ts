import type {DefaultDocumentNodeResolver} from 'sanity/structure'
import {ArtistArtworksView} from './views/ArtistArtworksView'

export const defaultDocumentNode: DefaultDocumentNodeResolver = (S, {schemaType}) => {
  switch (schemaType) {
    case 'artist':
      return S.document().views([
        S.view.form(),
        S.view
          .component(ArtistArtworksView)
          .title('Artworks')
          .icon(() => '🎨'),
      ])
    default:
      return S.document()
  }
}
