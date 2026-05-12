import {useEffect, useState} from 'react'
import {Card, Stack, Text, Grid, Box, Flex, Badge, Spinner} from '@sanity/ui'
import {useClient} from 'sanity'
import {IntentLink} from 'sanity/router'
import imageUrlBuilder from '@sanity/image-url'

interface Artwork {
  _id: string
  title: string
  year?: number
  status?: 'draft' | 'published' | 'sold' | 'hidden'
  image?: {
    asset: {
      _ref: string
    }
    alt?: string
    title?: string
  }
  medium?: string
  order?: number
}

export function ArtistArtworksView(props: {document: {displayed: {_id?: string}}}) {
  const {displayed} = props.document
  const artistId = displayed._id?.replace(/^drafts\./, '')

  const [artworks, setArtworks] = useState<Artwork[]>([])
  const [loading, setLoading] = useState(true)
  const client = useClient({apiVersion: '2025-02-05'})

  const builder = imageUrlBuilder(client)

  function urlFor(source: any) {
    return builder.image(source)
  }

  useEffect(() => {
    if (!artistId) return

    const query = `*[_type == "artwork" && artist._ref == $artistId && !(_id in path("drafts.**"))] | order(coalesce(order, 999) asc, _createdAt desc) {
      _id,
      title,
      year,
      status,
      order,
      image{
        asset->{_id, url},
        alt,
        title
      },
      medium
    }`

    client
      .fetch<Artwork[]>(query, {artistId})
      .then((data) => {
        setArtworks(data)
        setLoading(false)
      })
      .catch((error) => {
        console.error('Error fetching artworks:', error)
        setLoading(false)
      })
  }, [artistId, client])

  if (loading) {
    return (
      <Card padding={4}>
        <Flex align="center" justify="center" padding={5}>
          <Spinner />
        </Flex>
      </Card>
    )
  }

  if (artworks.length === 0) {
    return (
      <Card padding={4}>
        <Box padding={5}>
          <Text size={1} muted>
            No artworks found for this artist. Create artworks and reference this artist to see
            them here.
          </Text>
        </Box>
      </Card>
    )
  }

  return (
    <Card padding={4}>
      <Stack space={4}>
        <Box>
          <Text size={2} weight="semibold">
            {artworks.length} {artworks.length === 1 ? 'Artwork' : 'Artworks'}
          </Text>
        </Box>

        <Grid columns={[1, 2, 3]} gap={3}>
          {artworks.map((artwork) => (
            <IntentLink
              key={artwork._id}
              intent="edit"
              params={{type: 'artwork', id: artwork._id.replace(/^drafts\./, '')}}
            >
              <Card
                padding={3}
                radius={2}
                shadow={1}
                style={{cursor: 'pointer', transition: 'all 0.2s'}}
                tone="default"
              >
                <Stack space={3}>
                  {/* Artwork Image */}
                  {artwork.image?.asset ? (
                    <Box
                      style={{
                        aspectRatio: '4/3',
                        overflow: 'hidden',
                        borderRadius: '4px',
                        backgroundColor: '#f1f1f1',
                      }}
                    >
                      <img
                        src={urlFor(artwork.image).width(400).height(300).url()}
                        alt={artwork.title}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    </Box>
                  ) : (
                    <Box
                      style={{
                        aspectRatio: '4/3',
                        backgroundColor: '#f1f1f1',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text size={1} muted>
                        No image
                      </Text>
                    </Box>
                  )}

                  {/* Artwork Info */}
                  <Stack space={2}>
                    <Text size={1} weight="semibold">
                      {artwork.title}
                    </Text>

                    <Flex gap={2} wrap="wrap">
                      {artwork.year && (
                        <Badge tone="default" fontSize={0}>
                          {artwork.year}
                        </Badge>
                      )}
                      {artwork.status && (
                        <Badge
                          tone={
                            artwork.status === 'published' ? 'positive' :
                            artwork.status === 'sold' ? 'caution' :
                            artwork.status === 'draft' ? 'default' :
                            'critical'
                          }
                          fontSize={0}
                        >
                          {artwork.status === 'published' ? 'Published' :
                           artwork.status === 'sold' ? 'Sold' :
                           artwork.status === 'draft' ? 'Draft' :
                           'Hidden'}
                        </Badge>
                      )}
                    </Flex>

                    {artwork.medium && (
                      <Text size={0} muted>
                        {artwork.medium}
                      </Text>
                    )}
                  </Stack>
                </Stack>
              </Card>
            </IntentLink>
          ))}
        </Grid>
      </Stack>
    </Card>
  )
}
