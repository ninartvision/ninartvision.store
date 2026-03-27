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
 *   avatar: "images/artists/johndoe.jpg",
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
    avatar: "images/artists/ninimzhavia.jpg",
    whatsapp: "995579388833",
    country: "georgia",
    style: "Contemporary Abstract & Impressionist",
    about: "Nini Mzhavia is a contemporary abstract artist whose works explore modern visual language, emotion, and form."
  },
  {
    id: "mzia",
    name: "Mzia Kashia",
    avatar: "images/artists/mziakashia.jpg",
    whatsapp: "995123456789",
    country: "georgia",
    style: "Impressionism with realism"
  },
  {
    id: "nanuli",
    name: "Nanuli Gogiberidze",
    avatar: "images/artists/nanuligogiberidze.jpg",
    whatsapp: "995987654321",
    country: "georgia",
    style: "Decorative Impressionism"
  },
  {
    id: "artist4",
    name: "Artist 4",
    avatar: "images/artists/placeholder.jpg",
    whatsapp: "995000000000",
    country: "georgia",
    style: "Impressionist painter"
  },
  {
    id: "artist5",
    name: "Artist 5",
    avatar: "images/artists/placeholder.jpg",
    whatsapp: "995000000001",
    country: "georgia",
    style: "Impressionist painter"
  },
  {
    id: "artist6",
    name: "Artist Name",
    avatar: "images/artists/placeholder.jpg",
    whatsapp: "995000000002",
    country: "georgia",
    style: "Artist Style"
  },
  {
    id: "artist7",
    name: "Artist Name",
    avatar: "images/artists/placeholder.jpg",
    whatsapp: "995000000003",
    country: "georgia",
    style: "Artist Style"
  },
  {
    id: "artist8",
    name: "Artist Name",
    avatar: "images/artists/placeholder.jpg",
    whatsapp: "995000000004",
    country: "georgia",
    style: "Artist Style"
  },
  {
    id: "artist9",
    name: "Artist Name",
    avatar: "images/artists/placeholder.jpg",
    whatsapp: "995000000005",
    country: "georgia",
    style: "Artist Style"
  },
  {
    id: "artist10",
    name: "Artist Name",
    avatar: "images/artists/placeholder.jpg",
    whatsapp: "995000000006",
    country: "georgia",
    style: "Artist Style"
  },
  {
    id: "artist11",
    name: "Artist Name",
    avatar: "images/artists/placeholder.jpg",
    whatsapp: "995000000007",
    country: "georgia",
    style: "Artist Style"
  },
  {
    id: "artist12",
    name: "Artist Name",
    avatar: "images/artists/placeholder.jpg",
    whatsapp: "995000000008",
    country: "georgia",
    style: "Artist Style"
  },
  {
    id: "artist13",
    name: "Artist Name",
    avatar: "images/artists/placeholder.jpg",
    whatsapp: "995000000009",
    country: "georgia",
    style: "Artist Style"
  },
  {
    id: "artist14",
    name: "Artist Name",
    avatar: "images/artists/placeholder.jpg",
    whatsapp: "995000000010",
    country: "georgia",
    style: "Artist Style"
  },
  {
    id: "artist15",
    name: "Artist Name",
    avatar: "images/artists/placeholder.jpg",
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
    keywords: "still life, ნატურმორტი, naturmort, flowers, floral, vase, fruits, botanical, table arrangement, colorful, acrylic on canvas, contemporary, Georgian art, ქართული ხელოვნება, Nini Mzhavia, ნინი მჟავია, interior, decorative",
    price: 250,
    size: "40 x 50 cm",
    medium: "acrylic on canvas",
    year: "2025",
    
    img: "images/naturmort6.jpg",
    photos: [
      "images/naturmort6.jpg",
      "images/naturmort1.jpg",
      "images/naturmort2.jpg",
      "images/naturmort3.jpg",
      "images/naturmort4.jpg",
      "images/naturmort5.jpg",
      "images/naturmort7.png",
      "images/naturmort8.png",
      "images/naturmort9.png"
    ],
    showInShop: true
  },
  {
    id: "nini_02",
    artist: "nini",
    status: "sale",
    title: "Painting 2",
    keywords: "abstract, აბსტრაქცია, abstract art, contemporary, modern, expressionism, emotion, color field, non-figurative, vibrant, bold colors, acrylic on canvas, Georgian art, ქართული ხელოვნება, Nini Mzhavia, ნინი მჟავია, dynamic, energetic",
    price: 250,
    size: "40 x 50 cm",
    medium: "acrylic on canvas",
    year: "2025",
    
    img: "images/abstract3.jpg",
    photos: [
      "images/abstract3.jpg",
      "images/abstract7.jpg",
      "images/abstract6.jpg",
      "images/abstract8.jpg",
      "images/abstract9.jpg",
      "images/abstract10.jpg",
      "images/abstract1.jpg",
      "images/abstract2.jpg",
      "images/abstract4.jpg"
    ],
    showInShop: true
  },
  {
    id: "nini_03",
    artist: "nini",
    status: "sale",
    title: "Painting 3",
    keywords: "garden, ბაღი, flowers, floral, nature, landscape, botanical, green, trees, summer, outdoor, bloom, acrylic on canvas, Georgian art, ქართული ხელოვნება, Nini Mzhavia, ნინი მჟავია, impressionism, colorful, lush",
    price: 250,
    size: "40 x 50 cm",
    medium: "acrylic on canvas",
    year: "2025",
    
    img: "images/garden9.jpg",
    photos: [
      "images/garden9.jpg",
      "images/garden8.jpg",
      "images/garden7.jpg",
      "images/garden6.jpg",
      "images/garden5.jpg",
      "images/garden3.jpg",
      "images/garden2.jpg",
      "images/garden4.jpg",
      "images/garden1.jpg"
    ],
    showInShop: true
  },
  {
    id: "nini_04",
    artist: "nini",
    status: "sale",
    title: "Painting 4",
    keywords: "sea, ზღვა, ocean, seascape, water, waves, blue, marine, coastal, Black Sea, შავი ზღვა, landscape, nature, calm, horizon, acrylic on canvas, Georgian art, ქართული ხელოვნება, Nini Mzhavia, ნინი მჟავია",
    price: 250,
    size: "40 x 50 cm",
    medium: "Acrylic on canvas",
    year: "2025",
    
    img: "images/sea4.jpg",
    photos: [
      "images/sea4.jpg",
      "images/sea2.jpg",
      "images/sea8.jpg",
      "images/sea5.jpg",
      "images/sea6.jpg",
      "images/sea7.jpg"
    ],
    showInShop: true
  },
  {
    id: "nini_05",
    artist: "nini",
    status: "sale",
    title: "Painting 5",
    keywords: "rose, ვარდი, roses, red rose, flowers, floral, botanical, still life, bloom, blossom, romantic, oil, oil on canvas, ზეთი, Georgian art, ქართული ხელოვნება, Nini Mzhavia, ნინი მჟავია, classic, elegant",
    price: 300,
    size: "40 x 50 cm",
    medium: "Oil on canvas",
    year: "2025",
    
    img: "images/rose1.jpg",
    photos: [
      "images/rose1.jpg",
      "images/rose6.jpg",
      "images/rose7.jpg",
      "images/rose8.jpg",
      "images/rose4.jpg",
      "images/rose3.jpg",
      "images/rose2.jpg",
      "images/rose9.jpg",
      "images/rose11.png"
    ],
    showInShop: true
  },
  {
    id: "nini_06",
    artist: "nini",
    status: "sale",
    title: "Painting 6",
    keywords: "sea, ზღვა, ocean, seascape, sunset, orange sunset, warm colors, dramatic sky, coastal, marine, dusk, evening, Black Sea, შავი ზღვა, acrylic on canvas, Georgian art, ქართული ხელოვნება, Nini Mzhavia, ნინი მჟავია, vibrant, atmospheric",
    price: 350,
    size: "60 x 80 cm",
    medium: "Acrylic on canvas",
    year: "2025",
    
    img: "images/seaorange8.jpg",
    photos: [
      "images/seaorange8.jpg",
      "images/seaorange6.jpg",
      "images/seaorange3.jpg",
      "images/seaorange2.jpg",
      "images/seaorange1.jpg",
      "images/seaorange4.jpg",
      "images/seaorange7.jpg",
      "images/seaorange5.jpg"
    ],
    showInShop: true
  },
  {
    id: "nini_07",
    artist: "nini",
    status: "sale",
    title: "Painting 7",
    keywords: "lily, შროშანი, ლილია, lilies, lily flowers, flowers, floral, botanical, still life, pink, white, elegant, bloom, blossom, acrylic on canvas, Georgian art, ქართული ხელოვნება, Nini Mzhavia, ნინი მჟავია, delicate, spring",
    price: 250,
    size: "40 x 50 cm",
    medium: "acrylic on canvas",
    year: "2025",
    
    img: "images/lily8.jpg",
    photos: [
      "images/lily8.jpg",
      "images/lily9.jpg",
      "images/lily14.jpg",
      "images/lily12.jpg",
      "images/lily15.jpg",
      "images/lily10.jpg",
      "images/lily11.jpg"
    ],
    showInShop: true
  },
  {
    id: "nini_08",
    artist: "nini",
    status: "sale",
    title: "Painting 8",
    keywords: "swan, გედი, bird, wildlife, water, lake, pond, white, graceful, elegant, peaceful, nature, aquatic, acrylic on canvas, Georgian art, ქართული ხელოვნება, Nini Mzhavia, ნინი მჟავია, small painting",
    price: 50,
    size: "20 x 30 cm",
    medium: "acrylic on canvas",
    year: "2025",
    
    img: "images/swan1.jpg",
    photos: [
      "images/swan1.jpg",
      "images/swan3.jpg",
      "images/swan4.jpg",
      "images/swan2.jpg",
      "images/swan6.jpg",
      "images/swan5.png"
    ],
    showInShop: true
  },
  {
    id: "nini_09",
    artist: "nini",
    status: "sale",
    title: "Painting 9",
    keywords: "water lily, ვარდისფერი შროშანი, lotus, ლოტოსი, waterlily, water flower, pond, aquatic, nature, pink, white, bloom, serene, peaceful, acrylic on canvas, Georgian art, ქართული ხელოვნება, Nini Mzhavia, ნინი მჟავია",
    price: 200,
    size: "30 x 40 cm",
    medium: "acrylic on canvas",
    year: "2025",
   
    img: "images/waterlily1.jpg",
    photos: [
      "images/waterlily1.jpg",
      "images/waterlily3.jpg",
      "images/waterlily5.jpg",
      "images/waterlily6.png",
      "images/waterlily7.png"
    ],
    showInShop: true
  },
  {
    id: "nini_10",
    artist: "nini",
    status: "sale",
    title: "Painting 10",
    keywords: "boat, ნავი, sea, ზღვა, nautical, marine, water, coastal, vessel, seascape, river, sail, sailing, acrylic on canvas, Georgian art, ქართული ხელოვნება, Nini Mzhavia, ნინი მჟავია, small painting",
    price: 50,
    size: "20 x 30 cm",
    medium: "acrylic on canvas",
    year: "2025",
  
    img: "images/boat.jpg",
    photos: [
      "images/boat.jpg"
    ],
    showInShop: true
  },
  {
    id: "nini_14",
    artist: "nini",
    status: "sold",
    title: "Sold ",
    keywords: "deer, ირემი, stag, animal, wildlife, forest, woodland, nature, fauna, autumn, wild, acrylic on canvas, Georgian art, ქართული ხელოვნება, Nini Mzhavia, ნინი მჟავია",
    price: 250,
    size: "30 x 40 cm",
    medium: "acrylic on canvas",
    year: "2025",
    img: "images/deer5.jpg",
    photos: [
      "images/deer5.jpg",
      "images/deer3.jpg",
      "images/deer2.jpg",
      "images/deer4.jpg",
      
    ],
    showInShop: true
  },
  {
    id: "nini_16",
    artist: "nini",
    status: "sold",
    title: "sold ",
    keywords: "Jvari, ჯვარი, Georgian cross, cross, church, Christian, religious, Georgia, Mtskheta, მცხეთა, sacred, spiritual, landmark, architecture, acrylic on canvas, Georgian art, ქართული ხელოვნება, Nini Mzhavia, ნინი მჟავია, heritage",
    price: 350,
    size: "30 x 40 cm",
    medium: "acrylic on canvas",
    year: "2025",
    img: "images/jvari7.jpg",
    photos: [
      "images/jvari7.jpg",
      "images/jvari1.jpg",
      "images/jvari3.jpg",
      "images/jvari4.jpg",
      "images/jvari2.jpg",
      "images/jvari6.jpg",
      "images/jvari5.jpg"
    ],
    showInShop: true
  },
  {
    id: "nini_19",
    artist: "nini",
    status: "sold",
    title: "sold ",
    keywords: "children, ბავშვები, kids, childhood, figurative, people, portrait, group scene, narrative, playful, acrylic on canvas, Georgian art, ქართული ხელოვნება, Nini Mzhavia, ნინი მჟავია",
    price: 300,
    size: "30 x 40 cm",
    medium: "acrylic on canvas",
    year: "2025",
    img: "images/kids3.jpg",
    photos: [
      "images/kids3.jpg",
      "images/kids1.jpg",
      "images/kids2.jpg",
      "images/kids8.jpg",
      "images/kids5.jpg",
      "images/kids4.jpg"
    ],
    showInShop: true
  },
  {
    id: "nini_13",
    artist: "nini",
    status: "sold",
    title: "sold ",
    keywords: "daffodil, ნარცისი, narcissus, daffodils, yellow flowers, floral, botanical, spring, still life, bloom, bright, acrylic on canvas, Georgian art, ქართული ხელოვნება, Nini Mzhavia, ნინი მჟავია",
    price: 250,
    size: "40 x 50 cm",
    medium: "Acrylic on canvas",
    year: "2025",
    img: "images/daffodils6.jpg",
    photos: [
      "images/daffodils6.jpg",
      "images/daffodils4.jpg",
      "images/daffodils1.jpg",
      "images/daffodils3.jpg",
      "images/daffodils2.jpg",
      "images/daffodils5.jpg"
    ],
    showInShop: true
  },
  {
    id: "nini_18",
    artist: "nini",
    status: "sold",
    title: "sold ",
    keywords: "lilac, იასამანი, purple lilac, violet, flowers, floral, botanical, spring, still life, blossom, fragrant, acrylic on canvas, Georgian art, ქართული ხელოვნება, Nini Mzhavia, ნინი მჟავია",
    price: 250,
    size: "40 x 50 cm",
    medium: "acrylic on canvas",
    year: "2025",
    img: "images/lilac6.jpg",
    photos: [
      "images/lilac6.jpg",
      "images/lilac2.jpg",
      "images/lilac3.jpg",
      "images/lilac4.jpg",
      "images/lilac5.jpg",
      "images/lilac1.jpg",
      
    ],
    showInShop: true
  },
  {
    id: "nini_11",
    artist: "nini",
    status: "sold",
    title: "sold ",
    keywords: "Svaneti, სვანეთი, mountain, Georgian highlands, Caucasus, landscape, village, Svan tower, სვანური კოშკი, snow, alpine, travel, Georgia, nature, scenic, acrylic on canvas, Georgian art, ქართული ხელოვნება, Nini Mzhavia, ნინი მჟავია",
    price: 300,
    size: "50 x 70 cm",
    medium: "acrylic on canvas",
    year: "2026",
    img: "images/svaneti10.jpg",
    photos: [
      "images/svaneti10.jpg",
      "images/svaneti4.jpg",
      "images/svaneti6.jpg",
      "images/svaneti2.jpg",
      "images/svaneti1.jpg",
      "images/svaneti5.jpg",
      "images/svaneti9.jpg",
      "images/svaneti8.jpg",
      "images/svaneti11.jpg",
      "images/svaneti12.jpg",
      "images/svaneti13.jpg",
      "images/svaneti14.jpg",
      "images/svaneti15.jpg"
    ],
    showInShop: true
  },
  {
    id: "nini_12",
    artist: "nini",
    status: "sold",
    title: "sold",
    keywords: "grandfather, ბაბუა, elder, old man, figurative, portrait, Georgian figure, village life, Georgian heritage, storytelling, traditional, acrylic on canvas, Georgian art, ქართული ხელოვნება, Nini Mzhavia, ნინი მჟავია",
    price: 350,
    size: "60 x 80 cm",
    medium: "acrylic on canvas",
    year: "2025",
    img: "images/babuacvera4.jpg",
    photos: [
      "images/babuacvera4.jpg",
      "images/babuacvera3.jpg",
      "images/babuacvera2.jpg",
      "images/babuacvera1.jpg",
      "images/babuacvera5.jpg",
      "images/babuacvera6.jpg",
      "images/babuacvera7.jpg"
    ],
    showInShop: true
  },
  {
    id: "nini_17",
    artist: "nini",
    status: "sold",
    title: "sold",
    keywords: "Jvari Monastery, ჯვრის მონასტერი, monastery, church, Georgian Orthodox, architecture, Mtskheta, მცხეთა, landmark, UNESCO, heritage, sacred, spiritual, historic, Georgia, acrylic on canvas, Georgian art, ქართული ხელოვნება, Nini Mzhavia, ნინი მჟავია",
    price: 400,
    size: "60 x 80 cm",
    medium: "acrylic on canvas",
    year: "2025",
    img: "images/jvarimonastery5.jpg",
    photos: [
      "images/jvarimonastery5.jpg",
      "images/jvarimonastery2.jpg",
      "images/jvarimonastery1.jpg",
      "images/jvarimonastery4.jpg",
      "images/jvarimonastery3.jpg"
    ],
    showInShop: true
  },
  {
    id: "nini_15",
    artist: "nini",
    status: "sold",
    title: "sold ",
    keywords: "dream, ოცნება, სიზმარი, fantasy, surreal, imaginative, lyrical, emotional, visionary, colorful, abstract, expressive, large format, acrylic on canvas, Georgian art, ქართული ხელოვნება, Nini Mzhavia, ნინი მჟავია",
    price: 500,
    size: "80 x 100 cm",
    medium: "acrylic on canvas",
    year: "2025",
    img: "images/dream9.jpg",
    photos: [
      "images/dream9.jpg",
      "images/dream3.jpg",
      "images/dream4.jpg",
      "images/dream5.jpg",
      "images/dream6.jpg",
      "images/dream7.jpg",
      "images/dream8.jpg",
      "images/dream10.jpg",
      "images/dream2.jpg"
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
    img: "images/artists/mziakashia/mziakashia1.jpg",
    photos: [
      "images/artists/mziakashia/mziakashia1.jpg"
    ],
    keywords: "oil on canvas, ზეთი, impressionism, realism, classic, figurative, Georgian art, ქართული ხელოვნება, Mzia Kashia, მზია კაშია, vintage, 1980s",
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
    img: "images/artists/mziakashia/mziakashia2.jpg",
    photos: [
      "images/artists/mziakashia/mziakashia2.jpg"
    ],
    keywords: "oil on canvas, ზეთი, impressionism, realism, classic, Georgian art, ქართული ხელოვნება, Mzia Kashia, მზია კაშია, vintage, 1980s",
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
    img: "images/artists/mziakashia/mziakashia3.jpg",
    photos: [
      "images/artists/mziakashia/mziakashia3.jpg"
    ],
    keywords: "acrylic on canvas, contemporary, impressionism, realism, colorful, Georgian art, ქართული ხელოვნება, Mzia Kashia, მზია კაშია",
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
    img: "images/artists/mziakashia/mziakashia8.jpg",
    photos: [
      "images/artists/mziakashia/mziakashia8.jpg"
    ],
    keywords: "oil on canvas, ზეთი, impressionism, realism, expressive, Georgian art, ქართული ხელოვნება, Mzia Kashia, მზია კაშია",
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
    img: "images/artists/mziakashia/mziakashia5.jpg",
    photos: [
      "images/artists/mziakashia/mziakashia5.jpg"
    ],
    keywords: "acrylic on canvas, contemporary, impressionism, realism, colorful, Georgian art, ქართული ხელოვნება, Mzia Kashia, მზია კაშია",
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
    img: "images/artists/mziakashia/mziakashia7.jpg",
    photos: [
      "images/artists/mziakashia/mziakashia7.jpg"
    ],
    keywords: "acrylic on canvas, contemporary, impressionism, realism, Georgian art, ქართული ხელოვნება, Mzia Kashia, მზია კაშია",
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
    img: "images/artists/mziakashia/mziakashia4.jpg",
    photos: [
      "images/artists/mziakashia/mziakashia4.jpg"
    ],
    keywords: "acrylic on canvas, contemporary, impressionism, Georgian art, ქართული ხელოვნება, Mzia Kashia, მზია კაშია",
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
    img: "images/artists/mziakashia/mziakashia6.jpg",
    photos: [
      "images/artists/mziakashia/mziakashia6.jpg"
    ],
    keywords: "oil on canvas, ზეთი, impressionism, realism, expressive, Georgian art, ქართული ხელოვნება, Mzia Kashia, მზია კაშია",
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
    img: "images/artists/mziakashia/mziakashia12.jpg",
    photos: [
      "images/artists/mziakashia/mziakashia12.jpg"
    ],
    keywords: "watercolour, watercolor, აკვარელი, on paper, transparent, delicate, impressionism, Georgian art, ქართული ხელოვნება, Mzia Kashia, მზია კაშია, 1985, vintage",
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
    img: "images/artists/mziakashia/mziakashia13.jpg",
    photos: [
      "images/artists/mziakashia/mziakashia13.jpg"
    ],
    keywords: "watercolour, watercolor, აკვარელი, on paper, transparent, impressionism, Georgian art, ქართული ხელოვნება, Mzia Kashia, მზია კაშია, 1985, vintage",
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
    img: "images/artists/mziakashia/mziakashia9.jpg",
    photos: [
      "images/artists/mziakashia/mziakashia9.jpg"
    ],
    keywords: "pastel, pastel on paper, soft, delicate, impressionism, Georgian art, ქართული ხელოვნება, Mzia Kashia, მზია კაშია, 1985, vintage, small",
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
    img: "images/artists/mziakashia/mziakashia11.jpg",
    photos: [
      "images/artists/mziakashia/mziakashia11.jpg"
    ],
    keywords: "on paper, impressionism, Georgian art, ქართული ხელოვნება, Mzia Kashia, მზია კაშია, 1985, vintage, small",
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
    img: "images/artists/mziakashia/mziakashia10.jpg",
    photos: [
      "images/artists/mziakashia/mziakashia10.jpg"
    ],
    keywords: "watercolour, watercolor, აკვარელი, on paper, transparent, impressionism, Georgian art, ქართული ხელოვნება, Mzia Kashia, მზია კაშია, 1985, vintage",
    showInShop: false
  },
  {
    id: "nanuli_01",
    artist: "nanuli",
    status: "sale",
    title: "Nanuli Painting 1",
    keywords: "tapestry, გობელენი, handwoven, textile art, woven, fabric art, decorative, impressionism, Georgian art, ქართული ხელოვნება, Nanuli Gogiberidze, ნანული გოგიბერიძე, craft, traditional, handmade",
    price: 300,
    size: "40 x 50 cm",
    medium: "handwoven tapestry â€“ áƒ’áƒáƒ‘áƒ”áƒšáƒ”áƒœáƒ˜",
    year: "2025",
    desc: "Original artwork by Nanuli Gogiberidze.",
    img: "images/artists/nanuligogiberidze/nanuli1.jpg",
    photos: [
      "images/artists/nanuligogiberidze/nanuli1.jpg"
    ],
    showInShop: false
  },
  {
    id: "nanuli_02",
    artist: "nanuli",
    status: "sale",
    title: "Nanuli Painting 2",
    keywords: "acrylic, acrylic on paper, decorative impressionism, colorful, Georgian art, ქართული ხელოვნება, Nanuli Gogiberidze, ნანული გოგიბერიძე, contemporary, expressive, large format",
    price: 360,
    size: "70 x 65 cm",
    medium: "acrylylic on paper",
    year: "2025",
    desc: "Original artwork by Nanuli Gogiberidze.",
    img: "images/artists/nanuligogiberidze/nanuli2.jpg",
    photos: [
      "images/artists/nanuligogiberidze/nanuli2.jpg"
    ],
    showInShop: false
  }
,{
  id: "nanuli_03",
  artist: "nanuli",
  status: "sale",
  title: "Nanuli Painting 3",
  keywords: "pastel, pastel on paper, soft colors, delicate, decorative, impressionism, Georgian art, ქართული ხელოვნება, Nanuli Gogiberidze, ნანული გოგიბერიძე, small painting, intimate",
  price: 90,
  size: "15 x 20 cm",
  medium: "pastel on paper",
  year: "2025",
  desc: "Original artwork by Nanuli Gogiberidze.",
  img: "images/artists/nanuligogiberidze/nanuli3.jpg",
  photos: [
    "images/artists/nanuligogiberidze/nanuli3.jpg"
  ],
  showInShop: false
},
{
  id: "nanuli_04",
  artist: "nanuli",
  status: "sale",
  title: "Nanuli Painting 4",
  keywords: "pastel, pastel on paper, soft colors, decorative, impressionism, Georgian art, ქართული ხელოვნება, Nanuli Gogiberidze, ნანული გოგიბერიძე, affordable, small format",
  price: 150,
  size: "25 x 30 cm",
  medium: "pastel on paper â€“",
  year: "2025",
  desc: "Original artwork by Nanuli Gogiberidze.",
  img: "images/artists/nanuligogiberidze/nanuli4.jpg",
  photos: [
    "images/artists/nanuligogiberidze/nanuli4.jpg"
  ],
  showInShop: false
},
{
  id: "nanuli_05",
  artist: "nanuli",
  status: "sale",
  title: "Nanuli Painting 5",
  keywords: "oil, oil on canvas, ზეთი, decorative impressionism, colorful, Georgian art, ქართული ხელოვნება, Nanuli Gogiberidze, ნანული გოგიბერიძე, classic, expressive",
  price: 250,
  size: "40 x 60 cm",
  medium: "oil on canvas",
  year: "2025",
  desc: "Original artwork by Nanuli Gogiberidze.",
  img: "images/artists/nanuligogiberidze/nanuli5.jpg",
  photos: [
    "images/artists/nanuligogiberidze/nanuli5.jpg"
  ],
  showInShop: false
}

];

