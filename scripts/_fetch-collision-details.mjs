// Temporary: fetch details of colliding artworks to pick good slugs
const ids = [
  '94243637-2890-4344-8dff-79a0cb9b412e',
  '986bc9aa-b442-45d5-8920-9d9938f0a102',
  '15d1ea58-3927-4ba3-98c2-8c23f2229902',
  '16e8ebf3-3733-40d2-bd39-d3f020a4f495',
  'f1393966-5e2e-4c78-803a-fca51df23e47',
  '15ee6920-37d5-44c4-8667-39b51acf1fbd',
  '1770b12f-bc1e-414d-ac58-b84be12aff05',
  'b80777cd-2b68-4912-86f0-5af0aa674721',
  '0d1cb369-80c3-4218-9dbf-fa29e35da790',
  '2d2ccfd8-4740-4398-8344-d3238fcee4fc',
  '484c5eec-4964-4e7e-8f35-e526171ab830',
];
const q = `*[_id in $ids]{_id,title,"slug":slug.current,medium,year,dimensions,category,status}`;
const qs = new URLSearchParams({ query: q, '$ids': JSON.stringify(ids) });
const r = await fetch(`https://8t5h923j.apicdn.sanity.io/v2025-02-05/data/query/production?${qs}`);
const { result } = await r.json();
result.sort((a, b) => (a.slug || '').localeCompare(b.slug || ''));
result.forEach(a => console.log(JSON.stringify({
  id: a._id.slice(-8), slug: a.slug, title: a.title,
  medium: a.medium, year: a.year, dim: a.dimensions, cat: a.category
})));
