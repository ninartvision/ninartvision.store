/**
 * ARTISTS DATA
 * 
 * To add a new artist or replace a placeholder:
 * 1. Change the 'id' to a unique identifier (lowercase, no spaces)
 * 2. Update 'name' with the artist's full name
 * 3. Replace 'avatar' path with the artist's photo (recommended: 500x500px)
 * 4. Update 'whatsapp' with the artist's WhatsApp number
 * 5. Change 'style' to describe the artist's art style
 * 6. Optionally add 'about' field with artist biography
 * 
 * Example:
 * {
 *   id: "johndoe",
 *   name: "John Doe",
 *   avatar: "images/artists/johndoe.webp",
 *   whatsapp: "995123456789",
 *   country: "georgia",
 *   style: "Contemporary Abstract",
 *   about: "Artist biography here..."
 * }
 */

window.ARTISTS = [
  {
    id: "nini",
    name: "Nini Mzhavia",
    avatar: "images/artists/ninimzhavia.webp",
    whatsapp: "995579388833",
    country: "georgia",
    style: "Contemporary Abstract & Impressionist",
    about: "Nini Mzhavia is a contemporary abstract artist whose works explore modern visual language, emotion, and form."
  },
  {
    id: "mzia",
    name: "Mzia Kashia",
    avatar: "images/artists/mziakashia.webp",
    whatsapp: "995123456789",
    country: "georgia",
    style: "Impressionism with realism"
  },
  {
    id: "nanuli",
    name: "Nanuli Gogiberidze",
    avatar: "images/artists/nanuligogiberidze.webp",
    whatsapp: "995987654321",
    country: "georgia",
    style: "Decorative Impressionism"
  },
  {
    id: "artist4",
    name: "Artist 4",
    avatar: "images/artists/placeholder.webp",
    whatsapp: "995000000000",
    country: "georgia",
    style: "Impressionist painter"
  },
  {
    id: "artist5",
    name: "Artist 5",
    avatar: "images/artists/placeholder.webp",
    whatsapp: "995000000001",
    country: "georgia",
    style: "Impressionist painter"
  },
  {
    id: "artist6",
    name: "Artist Name",
    avatar: "images/artists/placeholder.webp",
    whatsapp: "995000000002",
    country: "georgia",
    style: "Artist Style"
  },
  {
    id: "artist7",
    name: "Artist Name",
    avatar: "images/artists/placeholder.webp",
    whatsapp: "995000000003",
    country: "georgia",
    style: "Artist Style"
  },
  {
    id: "artist8",
    name: "Artist Name",
    avatar: "images/artists/placeholder.webp",
    whatsapp: "995000000004",
    country: "georgia",
    style: "Artist Style"
  },
  {
    id: "artist9",
    name: "Artist Name",
    avatar: "images/artists/placeholder.webp",
    whatsapp: "995000000005",
    country: "georgia",
    style: "Artist Style"
  },
  {
    id: "artist10",
    name: "Artist Name",
    avatar: "images/artists/placeholder.webp",
    whatsapp: "995000000006",
    country: "georgia",
    style: "Artist Style"
  },
  {
    id: "artist11",
    name: "Artist Name",
    avatar: "images/artists/placeholder.webp",
    whatsapp: "995000000007",
    country: "georgia",
    style: "Artist Style"
  },
  {
    id: "artist12",
    name: "Artist Name",
    avatar: "images/artists/placeholder.webp",
    whatsapp: "995000000008",
    country: "georgia",
    style: "Artist Style"
  },
  {
    id: "artist13",
    name: "Artist Name",
    avatar: "images/artists/placeholder.webp",
    whatsapp: "995000000009",
    country: "georgia",
    style: "Artist Style"
  },
  {
    id: "artist14",
    name: "Artist Name",
    avatar: "images/artists/placeholder.webp",
    whatsapp: "995000000010",
    country: "georgia",
    style: "Artist Style"
  },
  {
    id: "artist15",
    name: "Artist Name",
    avatar: "images/artists/placeholder.webp",
    whatsapp: "995000000011",
    country: "georgia",
    style: "Artist Style"
  }
];


window.ARTWORKS = [
  {
    id: "nini_01",
    artist: "nini",
    status: "sale",
    title: "Painting 1",
    keywords: "still life, ??????????, naturmort, flowers, floral, vase, fruits, botanical, table arrangement, colorful, acrylic on canvas, contemporary, Georgian art, ??????? ?????????, Nini Mzhavia, ???? ??????, interior, decorative",
    price: 250,
    size: "40 x 50 cm",
    medium: "acrylic on canvas",
    year: "2025",
    
    img: "images/naturmort6.webp",
    photos: [
      "images/naturmort6.webp",
      "images/naturmort1.webp",
      "images/naturmort2.webp",
      "images/naturmort3.webp",
      "images/naturmort4.webp",
      "images/naturmort5.webp",
      "images/naturmort7.webp",
      "images/naturmort8.webp",
      "images/naturmort9.webp"
    ],
    showInShop: true
  },
  {
    id: "nini_02",
    artist: "nini",
    status: "sale",
    title: "Painting 2",
    keywords: "abstract, ??????????, abstract art, contemporary, modern, expressionism, emotion, color field, non-figurative, vibrant, bold colors, acrylic on canvas, Georgian art, ??????? ?????????, Nini Mzhavia, ???? ??????, dynamic, energetic",
    price: 250,
    size: "40 x 50 cm",
    medium: "acrylic on canvas",
    year: "2025",
    
    img: "images/abstract3.webp",
    photos: [
      "images/abstract3.webp",
      "images/abstract7.webp",
      "images/abstract6.webp",
      "images/abstract8.webp",
      "images/abstract9.webp",
      "images/abstract10.webp",
      "images/abstract1.webp",
      "images/abstract2.webp",
      "images/abstract4.webp"
    ],
    showInShop: true
  },
  {
    id: "nini_03",
    artist: "nini",
    status: "sale",
    title: "Painting 3",
    keywords: "garden, ????, flowers, floral, nature, landscape, botanical, green, trees, summer, outdoor, bloom, acrylic on canvas, Georgian art, ??????? ?????????, Nini Mzhavia, ???? ??????, impressionism, colorful, lush",
    price: 250,
    size: "40 x 50 cm",
    medium: "acrylic on canvas",
    year: "2025",
    
    img: "images/garden9.webp",
    photos: [
      "images/garden9.webp",
      "images/garden8.webp",
      "images/garden7.webp",
      "images/garden6.webp",
      "images/garden5.webp",
      "images/garden3.webp",
      "images/garden2.webp",
      "images/garden4.webp",
      "images/garden1.webp"
    ],
    showInShop: true
  },
  {
    id: "nini_04",
    artist: "nini",
    status: "sale",
    title: "Painting 4",
    keywords: "sea, ????, ocean, seascape, water, waves, blue, marine, coastal, Black Sea, ???? ????, landscape, nature, calm, horizon, acrylic on canvas, Georgian art, ??????? ?????????, Nini Mzhavia, ???? ??????",
    price: 250,
    size: "40 x 50 cm",
    medium: "Acrylic on canvas",
    year: "2025",
    
    img: "images/sea4.webp",
    photos: [
      "images/sea4.webp",
      "images/sea2.webp",
      "images/sea8.webp",
      "images/sea5.webp",
      "images/sea6.webp",
      "images/sea7.webp"
    ],
    showInShop: true
  },
  {
    id: "nini_05",
    artist: "nini",
    status: "sale",
    title: "Painting 5",
    keywords: "rose, ?????, roses, red rose, flowers, floral, botanical, still life, bloom, blossom, romantic, oil, oil on canvas, ????, Georgian art, ??????? ?????????, Nini Mzhavia, ???? ??????, classic, elegant",
    price: 300,
    size: "40 x 50 cm",
    medium: "Oil on canvas",
    year: "2025",
    
    img: "images/rose1.webp",
    photos: [
      "images/rose1.webp",
      "images/rose6.webp",
      "images/rose7.webp",
      "images/rose8.webp",
      "images/rose4.webp",
      "images/rose3.webp",
      "images/rose2.webp",
      "images/rose9.webp",
      "images/rose11.webp"
    ],
    showInShop: true
  },
  {
    id: "nini_06",
    artist: "nini",
    status: "sale",
    title: "Painting 6",
    keywords: "sea, ????, ocean, seascape, sunset, orange sunset, warm colors, dramatic sky, coastal, marine, dusk, evening, Black Sea, ???? ????, acrylic on canvas, Georgian art, ??????? ?????????, Nini Mzhavia, ???? ??????, vibrant, atmospheric",
    price: 350,
    size: "60 x 80 cm",
    medium: "Acrylic on canvas",
    year: "2025",
    
    img: "images/seaorange8.webp",
    photos: [
      "images/seaorange8.webp",
      "images/seaorange6.webp",
      "images/seaorange3.webp",
      "images/seaorange2.webp",
      "images/seaorange1.webp",
      "images/seaorange4.webp",
      "images/seaorange7.webp",
      "images/seaorange5.webp"
    ],
    showInShop: true
  },
  {
    id: "nini_07",
    artist: "nini",
    status: "sale",
    title: "Painting 7",
    keywords: "lily, ???????, ?????, lilies, lily flowers, flowers, floral, botanical, still life, pink, white, elegant, bloom, blossom, acrylic on canvas, Georgian art, ??????? ?????????, Nini Mzhavia, ???? ??????, delicate, spring",
    price: 250,
    size: "40 x 50 cm",
    medium: "acrylic on canvas",
    year: "2025",
    
    img: "images/lily8.webp",
    photos: [
      "images/lily8.webp",
      "images/lily9.webp",
      "images/lily14.webp",
      "images/lily12.webp",
      "images/lily15.webp",
      "images/lily10.webp",
      "images/lily11.webp"
    ],
    showInShop: true
  },
  {
    id: "nini_08",
    artist: "nini",
    status: "sale",
    title: "Painting 8",
    keywords: "swan, ????, bird, wildlife, water, lake, pond, white, graceful, elegant, peaceful, nature, aquatic, acrylic on canvas, Georgian art, ??????? ?????????, Nini Mzhavia, ???? ??????, small painting",
    price: 50,
    size: "20 x 30 cm",
    medium: "acrylic on canvas",
    year: "2025",
    
    img: "images/swan1.webp",
    photos: [
      "images/swan1.webp",
      "images/swan3.webp",
      "images/swan4.webp",
      "images/swan2.webp",
      "images/swan6.webp",
      "images/swan5.webp"
    ],
    showInShop: true
  },
  {
    id: "nini_09",
    artist: "nini",
    status: "sale",
    title: "Painting 9",
    keywords: "water lily, ?????????? ???????, lotus, ??????, waterlily, water flower, pond, aquatic, nature, pink, white, bloom, serene, peaceful, acrylic on canvas, Georgian art, ??????? ?????????, Nini Mzhavia, ???? ??????",
    price: 200,
    size: "30 x 40 cm",
    medium: "acrylic on canvas",
    year: "2025",
   
    img: "images/waterlily1.webp",
    photos: [
      "images/waterlily1.webp",
      "images/waterlily3.webp",
      "images/waterlily5.webp",
      "images/waterlily6.webp",
      "images/waterlily7.webp"
    ],
    showInShop: true
  },
  {
    id: "nini_10",
    artist: "nini",
    status: "sale",
    title: "Painting 10",
    keywords: "boat, ????, sea, ????, nautical, marine, water, coastal, vessel, seascape, river, sail, sailing, acrylic on canvas, Georgian art, ??????? ?????????, Nini Mzhavia, ???? ??????, small painting",
    price: 50,
    size: "20 x 30 cm",
    medium: "acrylic on canvas",
    year: "2025",
  
    img: "images/boat.webp",
    photos: [
      "images/boat.webp"
    ],
    showInShop: true
  },
  {
    id: "nini_14",
    artist: "nini",
    status: "sold",
    title: "Sold ",
    keywords: "deer, ?????, stag, animal, wildlife, forest, woodland, nature, fauna, autumn, wild, acrylic on canvas, Georgian art, ??????? ?????????, Nini Mzhavia, ???? ??????",
    price: 250,
    size: "30 x 40 cm",
    medium: "acrylic on canvas",
    year: "2025",
    img: "images/deer5.webp",
    photos: [
      "images/deer5.webp",
      "images/deer3.webp",
      "images/deer2.webp",
      "images/deer4.webp",
      
    ],
    showInShop: true
  },
  {
    id: "nini_16",
    artist: "nini",
    status: "sold",
    title: "sold ",
    keywords: "Jvari, ?????, Georgian cross, cross, church, Christian, religious, Georgia, Mtskheta, ??????, sacred, spiritual, landmark, architecture, acrylic on canvas, Georgian art, ??????? ?????????, Nini Mzhavia, ???? ??????, heritage",
    price: 350,
    size: "30 x 40 cm",
    medium: "acrylic on canvas",
    year: "2025",
    img: "images/jvari7.webp",
    photos: [
      "images/jvari7.webp",
      "images/jvari1.webp",
      "images/jvari3.webp",
      "images/jvari4.webp",
      "images/jvari2.webp",
      "images/jvari6.webp",
      "images/jvari5.webp"
    ],
    showInShop: true
  },
  {
    id: "nini_19",
    artist: "nini",
    status: "sold",
    title: "sold ",
    keywords: "children, ????????, kids, childhood, figurative, people, portrait, group scene, narrative, playful, acrylic on canvas, Georgian art, ??????? ?????????, Nini Mzhavia, ???? ??????",
    price: 300,
    size: "30 x 40 cm",
    medium: "acrylic on canvas",
    year: "2025",
    img: "images/kids3.webp",
    photos: [
      "images/kids3.webp",
      "images/kids1.webp",
      "images/kids2.webp",
      "images/kids8.webp",
      "images/kids5.webp",
      "images/kids4.webp"
    ],
    showInShop: true
  },
  {
    id: "nini_13",
    artist: "nini",
    status: "sold",
    title: "sold ",
    keywords: "daffodil, ???????, narcissus, daffodils, yellow flowers, floral, botanical, spring, still life, bloom, bright, acrylic on canvas, Georgian art, ??????? ?????????, Nini Mzhavia, ???? ??????",
    price: 250,
    size: "40 x 50 cm",
    medium: "Acrylic on canvas",
    year: "2025",
    img: "images/daffodils6.webp",
    photos: [
      "images/daffodils6.webp",
      "images/daffodils4.webp",
      "images/daffodils1.webp",
      "images/daffodils3.webp",
      "images/daffodils2.webp",
      "images/daffodils5.webp"
    ],
    showInShop: true
  },
  {
    id: "nini_18",
    artist: "nini",
    status: "sold",
    title: "sold ",
    keywords: "lilac, ????????, purple lilac, violet, flowers, floral, botanical, spring, still life, blossom, fragrant, acrylic on canvas, Georgian art, ??????? ?????????, Nini Mzhavia, ???? ??????",
    price: 250,
    size: "40 x 50 cm",
    medium: "acrylic on canvas",
    year: "2025",
    img: "images/lilac6.webp",
    photos: [
      "images/lilac6.webp",
      "images/lilac2.webp",
      "images/lilac3.webp",
      "images/lilac4.webp",
      "images/lilac5.webp",
      "images/lilac1.webp",
      
    ],
    showInShop: true
  },
  {
    id: "nini_11",
    artist: "nini",
    status: "sold",
    title: "sold ",
    keywords: "Svaneti, ???????, mountain, Georgian highlands, Caucasus, landscape, village, Svan tower, ??????? ?????, snow, alpine, travel, Georgia, nature, scenic, acrylic on canvas, Georgian art, ??????? ?????????, Nini Mzhavia, ???? ??????",
    price: 300,
    size: "50 x 70 cm",
    medium: "acrylic on canvas",
    year: "2026",
    img: "images/svaneti10.webp",
    photos: [
      "images/svaneti10.webp",
      "images/svaneti4.webp",
      "images/svaneti6.webp",
      "images/svaneti2.webp",
      "images/svaneti1.webp",
      "images/svaneti5.webp",
      "images/svaneti9.webp",
      "images/svaneti8.webp",
      "images/svaneti11.webp",
      "images/svaneti12.webp",
      "images/svaneti13.webp",
      "images/svaneti14.webp",
      "images/svaneti15.webp"
    ],
    showInShop: true
  },
  {
    id: "nini_12",
    artist: "nini",
    status: "sold",
    title: "sold",
    keywords: "grandfather, ?????, elder, old man, figurative, portrait, Georgian figure, village life, Georgian heritage, storytelling, traditional, acrylic on canvas, Georgian art, ??????? ?????????, Nini Mzhavia, ???? ??????",
    price: 350,
    size: "60 x 80 cm",
    medium: "acrylic on canvas",
    year: "2025",
    img: "images/babuacvera4.webp",
    photos: [
      "images/babuacvera4.webp",
      "images/babuacvera3.webp",
      "images/babuacvera2.webp",
      "images/babuacvera1.webp",
      "images/babuacvera5.webp",
      "images/babuacvera6.webp",
      "images/babuacvera7.webp"
    ],
    showInShop: true
  },
  {
    id: "nini_17",
    artist: "nini",
    status: "sold",
    title: "sold",
    keywords: "Jvari Monastery, ????? ?????????, monastery, church, Georgian Orthodox, architecture, Mtskheta, ??????, landmark, UNESCO, heritage, sacred, spiritual, historic, Georgia, acrylic on canvas, Georgian art, ??????? ?????????, Nini Mzhavia, ???? ??????",
    price: 400,
    size: "60 x 80 cm",
    medium: "acrylic on canvas",
    year: "2025",
    img: "images/jvarimonastery5.webp",
    photos: [
      "images/jvarimonastery5.webp",
      "images/jvarimonastery2.webp",
      "images/jvarimonastery1.webp",
      "images/jvarimonastery4.webp",
      "images/jvarimonastery3.webp"
    ],
    showInShop: true
  },
  {
    id: "nini_15",
    artist: "nini",
    status: "sold",
    title: "sold ",
    keywords: "dream, ??????, ???????, fantasy, surreal, imaginative, lyrical, emotional, visionary, colorful, abstract, expressive, large format, acrylic on canvas, Georgian art, ??????? ?????????, Nini Mzhavia, ???? ??????",
    price: 500,
    size: "80 x 100 cm",
    medium: "acrylic on canvas",
    year: "2025",
    img: "images/dream9.webp",
    photos: [
      "images/dream9.webp",
      "images/dream3.webp",
      "images/dream4.webp",
      "images/dream5.webp",
      "images/dream6.webp",
      "images/dream7.webp",
      "images/dream8.webp",
      "images/dream10.webp",
      "images/dream2.webp"
    ],
    showInShop: true
  },
  {
    id: "mzia_01",
    artist: "mzia",
    status: "sold",
    title: "sold",
    price: 300,
    size: "40 x 50 cm",
    medium: "Oil on canvas",
    year: "1980",
    desc: "This artwork has been sold.",
    img: "images/artists/mziakashia/mziakashia1.webp",
    photos: [
      "images/artists/mziakashia/mziakashia1.webp"
    ],
    keywords: "oil on canvas, ????, impressionism, realism, classic, figurative, Georgian art, ??????? ?????????, Mzia Kashia, ???? ?????, vintage, 1980s",
    showInShop: false
  },
  {
    id: "mzia_02",
    artist: "mzia",
    status: "sold",
    title: "sold",
    price: 350,
    size: "40 x 50 cm",
    medium: "Oil on canvas",
    year: "1980",
    desc: "This artwork has been sold.",
    img: "images/artists/mziakashia/mziakashia2.webp",
    photos: [
      "images/artists/mziakashia/mziakashia2.webp"
    ],
    keywords: "oil on canvas, ????, impressionism, realism, classic, Georgian art, ??????? ?????????, Mzia Kashia, ???? ?????, vintage, 1980s",
    showInShop: false
  },
  {
    id: "mzia_03",
    artist: "mzia",
    status: "sold",
    title: "sold",
    price: 350,
    size: "40 x 50 cm",
    medium: "acrylic on canvas",
    year: "2020",
    desc: "This artwork has been sold.",
    img: "images/artists/mziakashia/mziakashia3.webp",
    photos: [
      "images/artists/mziakashia/mziakashia3.webp"
    ],
    keywords: "acrylic on canvas, contemporary, impressionism, realism, colorful, Georgian art, ??????? ?????????, Mzia Kashia, ???? ?????",
    showInShop: false
  },
  {
    id: "mzia_04",
    artist: "mzia",
    status: "sold",
    title: "sold",
    price: 450,
    size: "50 x 60 cm",
    medium: "oil on canvas",
    year: "2020",
    desc: "his artwork has been sold.",
    img: "images/artists/mziakashia/mziakashia8.webp",
    photos: [
      "images/artists/mziakashia/mziakashia8.webp"
    ],
    keywords: "oil on canvas, ????, impressionism, realism, expressive, Georgian art, ??????? ?????????, Mzia Kashia, ???? ?????",
    showInShop: false
  },
  {
    id: "mzia_01",
    artist: "mzia",
    status: "sold",
    title: "sold",
    price: 300,
    size: "40 x 50 cm",
    medium: "acrylic on canvas",
    year: "2020",
    desc: "This artwork has been sold.",
    img: "images/artists/mziakashia/mziakashia5.webp",
    photos: [
      "images/artists/mziakashia/mziakashia5.webp"
    ],
    keywords: "acrylic on canvas, contemporary, impressionism, realism, colorful, Georgian art, ??????? ?????????, Mzia Kashia, ???? ?????",
    showInShop: false
  },
  {
    id: "mzia_02",
    artist: "mzia",
    status: "sold",
    title: "sold",
    price: 450,
    size: "40 x 50 cm",
    medium: "acrylic on canvas",
    year: "2020",
    desc: "This artwork has been sold.",
    img: "images/artists/mziakashia/mziakashia7.webp",
    photos: [
      "images/artists/mziakashia/mziakashia7.webp"
    ],
    keywords: "acrylic on canvas, contemporary, impressionism, realism, Georgian art, ??????? ?????????, Mzia Kashia, ???? ?????",
    showInShop: false
  },
  {
    id: "mzia_03",
    artist: "mzia",
    status: "sold",
    title: "sold",
    price: 350,
    size: "40 x 50 cm",
    medium: "acrylic on canvas",
    year: "2020",
    desc: "This artwork has been sold.",
    img: "images/artists/mziakashia/mziakashia4.webp",
    photos: [
      "images/artists/mziakashia/mziakashia4.webp"
    ],
    keywords: "acrylic on canvas, contemporary, impressionism, Georgian art, ??????? ?????????, Mzia Kashia, ???? ?????",
    showInShop: false
  },
  {
    id: "mzia_04",
    artist: "mzia",
    status: "sold",
    title: "sold",
    price: 450,
    size: "50 x 60 cm",
    medium: "oil on canvas",
    year: "2020",
    desc: "his artwork has been sold.",
    img: "images/artists/mziakashia/mziakashia6.webp",
    photos: [
      "images/artists/mziakashia/mziakashia6.webp"
    ],
    keywords: "oil on canvas, ????, impressionism, realism, expressive, Georgian art, ??????? ?????????, Mzia Kashia, ???? ?????",
    showInShop: false
  },
  {
    id: "mzia_01",
    artist: "mzia",
    status: "sold",
    title: "sold",
    price: 300,
    size: "40 x 50 cm",
    medium: "Watercolour on paper",
    year: "1985",
    desc: "This artwork has been sold.",
    img: "images/artists/mziakashia/mziakashia12.webp",
    photos: [
      "images/artists/mziakashia/mziakashia12.webp"
    ],
    keywords: "watercolour, watercolor, ????????, on paper, transparent, delicate, impressionism, Georgian art, ??????? ?????????, Mzia Kashia, ???? ?????, 1985, vintage",
    showInShop: false
  },
  {
    id: "mzia_02",
    artist: "mzia",
    status: "sold",
    title: "sold",
    price: 300,
    size: "40 x 50 cm",
    medium: "Watercolour on paper",
    year: "1985",
    desc: "This artwork has been sold.",
    img: "images/artists/mziakashia/mziakashia13.webp",
    photos: [
      "images/artists/mziakashia/mziakashia13.webp"
    ],
    keywords: "watercolour, watercolor, ????????, on paper, transparent, impressionism, Georgian art, ??????? ?????????, Mzia Kashia, ???? ?????, 1985, vintage",
    showInShop: false
  },
  {
    id: "mzia_03",
    artist: "mzia",
    status: "sold",
    title: "sold",
    price: 200,
    size: "20 x 30 cm",
    medium: "pastel on paper",
    year: "1985",
    desc: "This artwork has been sold.",
    img: "images/artists/mziakashia/mziakashia9.webp",
    photos: [
      "images/artists/mziakashia/mziakashia9.webp"
    ],
    keywords: "pastel, pastel on paper, soft, delicate, impressionism, Georgian art, ??????? ?????????, Mzia Kashia, ???? ?????, 1985, vintage, small",
    showInShop: false
  },
  {
    id: "mzia_04",
    artist: "mzia",
    status: "sold",
    title: "sold",
    price: 200,
    size: "20 x 30 cm",
    medium: " on paper",
    year: "1985",
    desc: "his artwork has been sold.",
    img: "images/artists/mziakashia/mziakashia11.webp",
    photos: [
      "images/artists/mziakashia/mziakashia11.webp"
    ],
    keywords: "on paper, impressionism, Georgian art, ??????? ?????????, Mzia Kashia, ???? ?????, 1985, vintage, small",
    showInShop: false
  },
  {
    id: "mzia_04",
    artist: "mzia",
    status: "sold",
    title: "sold",
    price: 200,
    size: "20 x 30 cm",
    medium: "Watercolour on paper",
    year: "1985",
    desc: "his artwork has been sold.",
    img: "images/artists/mziakashia/mziakashia10.webp",
    photos: [
      "images/artists/mziakashia/mziakashia10.webp"
    ],
    keywords: "watercolour, watercolor, ????????, on paper, transparent, impressionism, Georgian art, ??????? ?????????, Mzia Kashia, ???? ?????, 1985, vintage",
    showInShop: false
  },
  {
    id: "nanuli_01",
    artist: "nanuli",
    status: "sale",
    title: "Nanuli Painting 1",
    keywords: "tapestry, ????????, handwoven, textile art, woven, fabric art, decorative, impressionism, Georgian art, ??????? ?????????, Nanuli Gogiberidze, ?????? ??????????, craft, traditional, handmade",
    price: 300,
    size: "40 x 50 cm",
    medium: "handwoven tapestry – გობელენი",
    year: "2025",
    desc: "Original artwork by Nanuli Gogiberidze.",
    img: "images/artists/nanuligogiberidze/nanuli1.webp",
    photos: [
      "images/artists/nanuligogiberidze/nanuli1.webp"
    ],
    showInShop: false
  },
  {
    id: "nanuli_02",
    artist: "nanuli",
    status: "sale",
    title: "Nanuli Painting 2",
    keywords: "acrylic, acrylic on paper, decorative impressionism, colorful, Georgian art, ??????? ?????????, Nanuli Gogiberidze, ?????? ??????????, contemporary, expressive, large format",
    price: 360,
    size: "70 x 65 cm",
    medium: "acrylylic on paper",
    year: "2025",
    desc: "Original artwork by Nanuli Gogiberidze.",
    img: "images/artists/nanuligogiberidze/nanuli2.webp",
    photos: [
      "images/artists/nanuligogiberidze/nanuli2.webp"
    ],
    showInShop: false
  }
,{
  id: "nanuli_03",
  artist: "nanuli",
  status: "sale",
  title: "Nanuli Painting 3",
  keywords: "pastel, pastel on paper, soft colors, delicate, decorative, impressionism, Georgian art, ??????? ?????????, Nanuli Gogiberidze, ?????? ??????????, small painting, intimate",
  price: 90,
  size: "15 x 20 cm",
  medium: "pastel on paper",
  year: "2025",
  desc: "Original artwork by Nanuli Gogiberidze.",
  img: "images/artists/nanuligogiberidze/nanuli3.webp",
  photos: [
    "images/artists/nanuligogiberidze/nanuli3.webp"
  ],
  showInShop: false
},
{
  id: "nanuli_04",
  artist: "nanuli",
  status: "sale",
  title: "Nanuli Painting 4",
  keywords: "pastel, pastel on paper, soft colors, decorative, impressionism, Georgian art, ??????? ?????????, Nanuli Gogiberidze, ?????? ??????????, affordable, small format",
  price: 150,
  size: "25 x 30 cm",
  medium: "pastel on paper –",
  year: "2025",
  desc: "Original artwork by Nanuli Gogiberidze.",
  img: "images/artists/nanuligogiberidze/nanuli4.webp",
  photos: [
    "images/artists/nanuligogiberidze/nanuli4.webp"
  ],
  showInShop: false
},
{
  id: "nanuli_05",
  artist: "nanuli",
  status: "sale",
  title: "Nanuli Painting 5",
  keywords: "oil, oil on canvas, ????, decorative impressionism, colorful, Georgian art, ??????? ?????????, Nanuli Gogiberidze, ?????? ??????????, classic, expressive",
  price: 250,
  size: "40 x 60 cm",
  medium: "oil on canvas",
  year: "2025",
  desc: "Original artwork by Nanuli Gogiberidze.",
  img: "images/artists/nanuligogiberidze/nanuli5.webp",
  photos: [
    "images/artists/nanuligogiberidze/nanuli5.webp"
  ],
  showInShop: false
}

];

