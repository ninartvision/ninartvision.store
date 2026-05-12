# Next.js + Sanity Integration Examples

Complete examples for integrating Sanity CMS with Next.js (Pages Router & App Router).

---

## 📁 Project Structure

```
your-nextjs-app/
├── app/                          # App Router (Next.js 13+)
│   ├── artists/
│   │   └── page.tsx
│   └── api/
│       └── revalidate/
│           └── route.ts
├── pages/                        # Pages Router (Next.js 12)
│   ├── artists.tsx
│   └── api/
│       └── revalidate.ts
├── lib/
│   ├── sanity.client.ts
│   └── sanity.queries.ts
├── .env.local
└── next.config.js
```

---

## 🔧 Setup Files

### 1. Environment Variables (.env.local)

```bash
# Sanity Configuration
NEXT_PUBLIC_SANITY_PROJECT_ID=8t5h923j
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2024-01-01

# Revalidation Secret (generate random string)
REVALIDATE_SECRET=your-random-secret-here-abc123
```

### 2. Sanity Client (lib/sanity.client.ts)

```typescript
import { createClient } from '@sanity/client';

export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION!,
  useCdn: true, // Use CDN for better performance
  perspective: 'published', // Only fetch published documents
});

// For real-time preview (draft content)
export const previewClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION!,
  useCdn: false,
  perspective: 'previewDrafts', // Include drafts
  token: process.env.SANITY_API_TOKEN, // Read token from Sanity
});
```

### 3. GROQ Queries (lib/sanity.queries.ts)

```typescript
// Get all artists
export const artistsQuery = `*[_type == "artist"] | order(_createdAt desc) {
  _id,
  name,
  "avatar": image.asset->url,
  whatsapp,
  country,
  style,
  about,
  bio_en,
  bio_ka,
  seoTitle,
  seoDescription,
  featured,
  "slug": slug.current
}`;

// Get single artist by slug
export const artistBySlugQuery = (slug: string) => `
  *[_type == "artist" && slug.current == "${slug}"][0] {
    _id,
    name,
    "avatar": image.asset->url,
    whatsapp,
    country,
    style,
    bio_en,
    bio_ka,
    seoTitle,
    seoDescription,
    "slug": slug.current
  }
`;

// Get artworks for an artist
export const artworksByArtistQuery = (artistSlug: string) => `
  *[_type == "artwork" && artist->slug.current == "${artistSlug}"] | order(_createdAt desc) {
    _id,
    title,
    "image": image.asset->url,
    price,
    "size": dimensions,
    medium,
    year,
    status,
    description,
    "slug": slug.current,
    "images": images[].asset->url
  }
`;
```

---

## 📄 Pages Router Examples (Next.js 12)

### Option 1: ISR (Incremental Static Regeneration) - Recommended

```typescript
// pages/artists.tsx
import { GetStaticProps } from 'next';
import { client } from '@/lib/sanity.client';
import { artistsQuery } from '@/lib/sanity.queries';

interface Artist {
  _id: string;
  name: string;
  avatar: string;
  slug: string;
  bio_en?: string;
  bio_ka?: string;
}

interface ArtistsPageProps {
  artists: Artist[];
}

export default function ArtistsPage({ artists }: ArtistsPageProps) {
  return (
    <div>
      <h1>Artists</h1>
      <div className="grid">
        {artists.map((artist) => (
          <div key={artist._id}>
            <img src={artist.avatar} alt={artist.name} />
            <h2>{artist.name}</h2>
            <a href={`/artists/${artist.slug}`}>View Profile</a>
          </div>
        ))}
      </div>
    </div>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const artists = await client.fetch(artistsQuery);

  return {
    props: {
      artists,
    },
    revalidate: 60, // Revalidate every 60 seconds ✅
  };
};
```

### Option 2: Server-Side Rendering (Always Fresh)

```typescript
// pages/artists-ssr.tsx
import { GetServerSideProps } from 'next';
import { client } from '@/lib/sanity.client';
import { artistsQuery } from '@/lib/sanity.queries';

export default function ArtistsSSRPage({ artists }: ArtistsPageProps) {
  return (
    <div>
      <h1>Artists (SSR - Always Fresh)</h1>
      <div className="grid">
        {artists.map((artist) => (
          <div key={artist._id}>
            <img src={artist.avatar} alt={artist.name} />
            <h2>{artist.name}</h2>
          </div>
        ))}
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  const artists = await client.fetch(artistsQuery);

  return {
    props: {
      artists,
    },
    // No revalidate - fetches on every request
  };
};
```

### Dynamic Routes with ISR

```typescript
// pages/artists/[slug].tsx
import { GetStaticPaths, GetStaticProps } from 'next';
import { client } from '@/lib/sanity.client';
import { artistBySlugQuery, artistsQuery, artworksByArtistQuery } from '@/lib/sanity.queries';

interface ArtistPageProps {
  artist: Artist;
  artworks: Artwork[];
}

export default function ArtistPage({ artist, artworks }: ArtistPageProps) {
  return (
    <div>
      <img src={artist.avatar} alt={artist.name} />
      <h1>{artist.name}</h1>
      <p>{artist.bio_en}</p>

      <h2>Artworks</h2>
      <div className="gallery">
        {artworks.map((artwork) => (
          <div key={artwork._id}>
            <img src={artwork.image} alt={artwork.title} />
            <h3>{artwork.title}</h3>
            <p>{artwork.price ? `₾${artwork.price}` : 'Contact for price'}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const artists = await client.fetch(artistsQuery);

  const paths = artists.map((artist: Artist) => ({
    params: { slug: artist.slug },
  }));

  return {
    paths,
    fallback: 'blocking', // Generate new pages on-demand ✅
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = params?.slug as string;
  
  const artist = await client.fetch(artistBySlugQuery(slug));
  const artworks = await client.fetch(artworksByArtistQuery(slug));

  if (!artist) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      artist,
      artworks,
    },
    revalidate: 60, // Revalidate every 60 seconds ✅
  };
};
```

---

## 📱 App Router Examples (Next.js 13+)

### Option 1: Time-Based Revalidation

```typescript
// app/artists/page.tsx
import { client } from '@/lib/sanity.client';
import { artistsQuery } from '@/lib/sanity.queries';

// Revalidate every 60 seconds ✅
export const revalidate = 60;

export default async function ArtistsPage() {
  const artists = await client.fetch(artistsQuery);

  return (
    <div>
      <h1>Artists</h1>
      <div className="grid">
        {artists.map((artist: any) => (
          <div key={artist._id}>
            <img src={artist.avatar} alt={artist.name} />
            <h2>{artist.name}</h2>
            <a href={`/artists/${artist.slug}`}>View Profile</a>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Option 2: No Caching (Always Fresh)

```typescript
// app/artists-fresh/page.tsx
import { client } from '@/lib/sanity.client';
import { artistsQuery } from '@/lib/sanity.queries';

// Disable caching ✅
export const revalidate = 0;
// Or: export const dynamic = 'force-dynamic';

export default async function ArtistsFreshPage() {
  const artists = await client.fetch(artistsQuery);

  return (
    <div>
      <h1>Artists (Always Fresh)</h1>
      <div className="grid">
        {artists.map((artist: any) => (
          <div key={artist._id}>
            <img src={artist.avatar} alt={artist.name} />
            <h2>{artist.name}</h2>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Option 3: On-Demand Revalidation (Best for Production)

```typescript
// app/artists-ondemand/page.tsx
import { client } from '@/lib/sanity.client';
import { artistsQuery } from '@/lib/sanity.queries';

// Use CDN caching, revalidate via webhook ✅
export const revalidate = 3600; // Fallback: revalidate every hour

export default async function ArtistsOnDemandPage() {
  const artists = await client.fetch(artistsQuery);

  return (
    <div>
      <h1>Artists (On-Demand Revalidation)</h1>
      <p className="subtitle">Updates automatically when you publish in Sanity</p>
      <div className="grid">
        {artists.map((artist: any) => (
          <div key={artist._id}>
            <img src={artist.avatar} alt={artist.name} />
            <h2>{artist.name}</h2>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 🔄 On-Demand Revalidation API Routes

### Pages Router API Route

```typescript
// pages/api/revalidate.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Check for secret to confirm this is a valid request
  if (req.query.secret !== process.env.REVALIDATE_SECRET) {
    return res.status(401).json({ message: 'Invalid token' });
  }

  // Get the paths to revalidate from the request body
  const paths = req.body.paths || ['/artists', '/'];

  try {
    // Revalidate all specified paths
    await Promise.all(paths.map((path: string) => res.revalidate(path)));

    return res.json({ 
      revalidated: true, 
      paths,
      timestamp: new Date().toISOString() 
    });
  } catch (err) {
    return res.status(500).json({ message: 'Error revalidating', error: err });
  }
}
```

### App Router API Route

```typescript
// app/api/revalidate/route.ts
import { revalidatePath, revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret');

  // Validate secret
  if (secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json(
      { message: 'Invalid secret' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { paths = [], tags = [] } = body;

    // Revalidate by path
    if (paths.length > 0) {
      paths.forEach((path: string) => revalidatePath(path));
    }

    // Revalidate by tag (if you use cache tags)
    if (tags.length > 0) {
      tags.forEach((tag: string) => revalidateTag(tag));
    }

    // Default paths to revalidate
    if (paths.length === 0 && tags.length === 0) {
      revalidatePath('/artists');
      revalidatePath('/');
    }

    return NextResponse.json({
      revalidated: true,
      paths,
      tags,
      now: Date.now(),
    });
  } catch (err) {
    console.error('Revalidation error:', err);
    return NextResponse.json(
      { message: 'Error revalidating', error: String(err) },
      { status: 500 }
    );
  }
}
```

---

## 🪝 Sanity Webhook Configuration

### Setup in Sanity Studio

1. Go to https://sanity.io/manage
2. Select project: `8t5h923j`
3. Go to **API** → **Webhooks**
4. Click **Create webhook**

### Webhook Configuration

**For Pages Router:**
```
Name: Revalidate Next.js (Pages Router)
URL: https://your-site.vercel.app/api/revalidate?secret=your-random-secret-here-abc123
Dataset: production
Trigger on: Create, Update, Delete
Filter: _type in ["artist", "artwork"]
HTTP method: POST
API version: v2024-01-01

Payload (JSON):
{
  "paths": ["/artists", "/"]
}
```

**For App Router:**
```
Name: Revalidate Next.js (App Router)
URL: https://your-site.vercel.app/api/revalidate?secret=your-random-secret-here-abc123
Dataset: production
Trigger on: Create, Update, Delete
Filter: _type in ["artist", "artwork"]
HTTP method: POST
API version: v2024-01-01

Payload (JSON):
{
  "paths": ["/artists", "/"],
  "tags": ["artists"]
}
```

### Test Webhook

```bash
# Test your revalidation endpoint
curl -X POST "https://your-site.vercel.app/api/revalidate?secret=your-secret" \
  -H "Content-Type: application/json" \
  -d '{"paths": ["/artists"]}'

# Expected response:
# {"revalidated":true,"paths":["/artists"],"now":1707408000000}
```

---

## 📊 Caching Strategy Comparison

| Method | Speed | Freshness | Server Load | Best For |
|--------|-------|-----------|-------------|----------|
| **No Cache** (`revalidate: 0`) | Slow | Always fresh | High | Admin dashboards |
| **ISR** (`revalidate: 60`) | Fast | 60s stale | Medium | Most sites ✅ |
| **On-Demand** (webhook) | Fast | Instant | Low | Production ⭐ |
| **Static** (no revalidate) | Fastest | Stale | None | Archived content |

---

## 🎨 Complete Artist Page Example with Loading & Error States

```typescript
// app/artists/[slug]/page.tsx
import { Suspense } from 'react';
import { client } from '@/lib/sanity.client';
import { artistBySlugQuery, artworksByArtistQuery } from '@/lib/sanity.queries';
import { notFound } from 'next/navigation';

// Revalidate every 60 seconds
export const revalidate = 60;

// Generate static params for known artists
export async function generateStaticParams() {
  const artists = await client.fetch(`*[_type == "artist"]{slug}`);
  
  return artists.map((artist: any) => ({
    slug: artist.slug.current,
  }));
}

// Artist page
export default async function ArtistPage({ 
  params 
}: { 
  params: { slug: string } 
}) {
  const artist = await client.fetch(artistBySlugQuery(params.slug));

  if (!artist) {
    notFound();
  }

  return (
    <div className="artist-page">
      <header>
        <img src={artist.avatar} alt={artist.name} />
        <h1>{artist.name}</h1>
        <p>{artist.bio_en || artist.bio_ka}</p>
      </header>

      <Suspense fallback={<ArtworksLoading />}>
        <ArtworksList artistSlug={params.slug} />
      </Suspense>
    </div>
  );
}

// Separate component for artworks (better loading states)
async function ArtworksList({ artistSlug }: { artistSlug: string }) {
  const artworks = await client.fetch(artworksByArtistQuery(artistSlug));

  return (
    <div className="artworks-grid">
      {artworks.map((artwork: any) => (
        <div key={artwork._id} className="artwork-card">
          <img src={artwork.image} alt={artwork.title} />
          <h3>{artwork.title}</h3>
          <p>{artwork.year} • {artwork.medium}</p>
          {artwork.price && <span className="price">₾{artwork.price}</span>}
        </div>
      ))}
    </div>
  );
}

function ArtworksLoading() {
  return (
    <div className="artworks-grid">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="artwork-skeleton">
          <div className="skeleton-image" />
          <div className="skeleton-text" />
        </div>
      ))}
    </div>
  );
}
```

---

## 🧪 Testing Checklist

- [ ] Changes in Sanity appear after 60 seconds (with ISR)
- [ ] Changes in Sanity appear immediately (with webhook)
- [ ] Force refresh works (Ctrl + Shift + R)
- [ ] Webhook returns 200 status in Sanity dashboard
- [ ] API route returns `{"revalidated": true}`
- [ ] 404 pages work correctly (invalid slugs)
- [ ] Loading states display during fetch

---

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables
vercel env add REVALIDATE_SECRET
vercel env add NEXT_PUBLIC_SANITY_PROJECT_ID
vercel env add NEXT_PUBLIC_SANITY_DATASET
```

### Netlify

```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

---

## ✅ Final Production Setup

1. **Use ISR for baseline**: `revalidate: 60`
2. **Add webhook for instant updates**: Sanity → Vercel/Netlify
3. **Use CDN**: `useCdn: true` in Sanity client
4. **Monitor performance**: Check Vercel/Netlify analytics
5. **Test regularly**: Publish in Sanity, verify on site

**Your site will now update within 1-2 minutes of publishing in Sanity! 🎉**
