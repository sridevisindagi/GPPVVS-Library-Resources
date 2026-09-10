const headers = { "user-agent": "GPPorwal-Library-Free-Resources/2.0 (academic library portal)" };

async function getJson(url, options={}) {
  const r = await fetch(url, { ...options, headers: { ...headers, ...(options.headers||{}) } });
  if(!r.ok) throw new Error(`${r.status} ${r.statusText}`);
  return r.json();
}

async function openLibrary(q, limit) {
  const url = new URL('https://openlibrary.org/search.json');
  url.searchParams.set('q', q);
  url.searchParams.set('limit', String(limit));
  url.searchParams.set('fields','key,title,author_name,first_publish_year,cover_i,ebook_access,has_fulltext');
  const data = await getJson(url);
  return (data.docs||[]).filter(d => d.ebook_access === 'public' || d.has_fulltext).map(d => ({
    source:'Open Library', title:d.title||'Untitled', author:(d.author_name||[]).slice(0,3).join(', '),
    year:d.first_publish_year||'', access:d.ebook_access || (d.has_fulltext?'Full text':''),
    url:'https://openlibrary.org'+(d.key||''), cover:d.cover_i?`https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg`:'', download:d.ebook_access==='public'
  }));
}

async function archive(q, limit) {
  const url = new URL('https://archive.org/advancedsearch.php');
  url.searchParams.set('q', `(${q}) AND mediatype:texts`);
  url.searchParams.set('rows', String(limit));
  url.searchParams.set('output','json');
  url.searchParams.append('fl[]','identifier'); url.searchParams.append('fl[]','title'); url.searchParams.append('fl[]','creator'); url.searchParams.append('fl[]','year');
  const data = await getJson(url);
  return (data.response?.docs||[]).filter(d=>d.identifier).map(d=>({
    source:'Internet Archive', title:d.title||'Untitled', author:Array.isArray(d.creator)?d.creator.slice(0,3).join(', '):(d.creator||''),
    year:d.year||'', access:'Open item page', url:`https://archive.org/details/${encodeURIComponent(d.identifier)}`, cover:'', download:true
  }));
}

async function googleBooks(q, limit) {
  const url = new URL('https://www.googleapis.com/books/v1/volumes');
  url.searchParams.set('q', q); url.searchParams.set('maxResults', String(Math.min(limit,40))); url.searchParams.set('printType','books'); url.searchParams.set('filter','full');
  const data = await getJson(url);
  return (data.items||[]).filter(x=>x.accessInfo?.viewability==='ALL_PAGES').map(x=>({
    source:'Google Books (Full View)', title:x.volumeInfo?.title||'Untitled', author:(x.volumeInfo?.authors||[]).slice(0,3).join(', '),
    year:(x.volumeInfo?.publishedDate||'').slice(0,4), access:'Full view', url:x.accessInfo?.webReaderLink||x.volumeInfo?.infoLink||'',
    cover:x.volumeInfo?.imageLinks?.thumbnail||'', download:false
  })).filter(x=>x.url);
}

export default async (req) => {
  const u = new URL(req.url);
  const q = (u.searchParams.get('q')||'').trim();
  const limit = Math.min(Math.max(Number(u.searchParams.get('limit')||10),1),15);
  if(!q) return Response.json({error:'Missing search query'}, {status:400});
  const settled = await Promise.allSettled([openLibrary(q,limit), archive(q,limit), googleBooks(q,limit)]);
  const results = settled.flatMap(x=>x.status==='fulfilled'?x.value:[]);
  const seen = new Set();
  const unique = results.filter(r=>{ if(!r.url || seen.has(r.url)) return false; seen.add(r.url); return true; });
  return Response.json({query:q, results:unique.slice(0,36)}, {headers:{'cache-control':'public, max-age=300'}});
};

export const config = { path: '/api/search' };
