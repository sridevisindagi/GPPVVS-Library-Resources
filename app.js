const $ = (id) => document.getElementById(id);

const sourceLinks = [
  ["📕 Project Gutenberg", "Public-domain e-books", q => `https://www.gutenberg.org/ebooks/search/?query=${encodeURIComponent(q)}`],
  ["📘 DOAB", "Open-access books", q => `https://directory.doabooks.org/discover?query=${encodeURIComponent(q)}`],
  ["🔬 DOAJ", "Open-access journals", q => `https://doaj.org/search/articles?ref=homepage&q=${encodeURIComponent(q)}`],
  ["🇮🇳 NDLI", "Indian digital library discovery", q => `https://ndl.iitkgp.ac.in/search?query=${encodeURIComponent(q)}`],
  ["🎓 NPTEL", "Open course resources", q => `https://nptel.ac.in/courses?search=${encodeURIComponent(q)}`],
  ["🎓 SWAYAM", "MOOC discovery", q => `https://swayam.gov.in/search?searchText=${encodeURIComponent(q)}`],
  ["🎓 OpenLearn", "Free learning materials", q => `https://www.open.edu/openlearn/search-results?query=${encodeURIComponent(q)}`],
  ["🌐 Internet Archive", "Books and digital texts", q => `https://archive.org/search?query=${encodeURIComponent(q)}%20AND%20mediatype%3Atexts`]
];

function escapeHtml(s='') { return String(s).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
function sourceGrid(query='') {
  $('sourceGrid').innerHTML = sourceLinks.map(([name, desc, fn]) => `<a class="source-link" target="_blank" rel="noopener" href="${fn(query || '')}"><strong>${name}</strong><span>${desc}</span></a>`).join('');
}
sourceGrid('');

function setQuery(q){ $('query').value=q; doSearch(); }
document.querySelectorAll('.chip').forEach(b => b.addEventListener('click', () => setQuery(b.dataset.query)));
$('searchBtn').addEventListener('click', doSearch);
$('query').addEventListener('keydown', e => { if(e.key === 'Enter') doSearch(); });
$('homeBtn').addEventListener('click', () => { history.pushState({}, '', location.pathname); showHome(); });
window.addEventListener('popstate', handleRoute);

async function doSearch(){
  const q = $('query').value.trim();
  if(!q) return;
  $('resultsSection').classList.remove('hidden');
  $('resultsTitle').textContent = `Results for “${q}”`;
  $('status').textContent = 'Searching open sources…';
  $('results').innerHTML = `<div class="card"><div class="card-main"><div><h3>Searching…</h3><p class="meta">Checking supported academic sources.</p></div></div></div>`;
  sourceGrid(q);
  try{
    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&limit=12`);
    const data = await res.json();
    if(!res.ok) throw new Error(data.error || 'Search failed');
    renderResults(data.results || []);
    $('status').textContent = `${data.results.length} result${data.results.length===1?'':'s'} found`;
  }catch(err){
    $('results').innerHTML = `<div class="card"><div class="card-main"><div><h3>Search could not be completed</h3><p class="meta">${escapeHtml(err.message)}</p><p class="meta">You can still use the official source buttons below.</p></div></div></div>`;
    $('status').textContent = 'Search error';
  }
  window.scrollTo({top:$('resultsSection').offsetTop-20, behavior:'smooth'});
}

function renderResults(results){
  if(!results.length){ $('results').innerHTML='<div class="card"><div class="card-main"><div><h3>No open result found</h3><p class="meta">Try a broader subject or use the official source buttons below.</p></div></div></div>'; return; }
  $('results').innerHTML = results.map((r,i)=>{
    const cover = r.cover ? `<img class="cover" src="${escapeHtml(r.cover)}" alt="Book cover" loading="lazy">` : `<div class="cover-placeholder">📚</div>`;
    const details = [r.author, r.year, r.access].filter(Boolean).map(x=>`<div class="meta">${escapeHtml(x)}</div>`).join('');
    const downloadLabel = r.download ? '⬇️ Open download' : '📖 Read / Open';
    return `<article class="card">
      <div class="card-main">${cover}<div><h3>${escapeHtml(r.title)}</h3>${details}<span class="source">${escapeHtml(r.source)}</span></div></div>
      <div class="card-actions">
        <a class="action primary" target="_blank" rel="noopener" href="${escapeHtml(r.url)}">${downloadLabel}</a>
        <button class="action qr-action" data-index="${i}">🔲 Generate QR</button>
      </div>
    </article>`;
  }).join('');
  window.currentResults = results;
  document.querySelectorAll('.qr-action').forEach(btn => btn.addEventListener('click', () => showQr(window.currentResults[Number(btn.dataset.index)])));
}

function showQr(r){
  const url = new URL(location.href);
  url.search = '';
  url.searchParams.set('resource', r.url);
  url.searchParams.set('title', r.title);
  const target = url.toString();
  $('qrTitle').textContent = 'Scan to open resource';
  $('qrSubtitle').textContent = r.title;
  $('qrBox').innerHTML = '';
  if(typeof QRCode === 'undefined'){
    $('qrBox').innerHTML = `<p>QR library could not load. Resource: <a href="${escapeHtml(r.url)}">Open</a></p>`;
  } else {
    new QRCode($('qrBox'), { text: target, width: 240, height: 240, correctLevel: QRCode.CorrectLevel.M });
  }
  $('downloadQr').onclick = () => {
    const img = $('qrBox').querySelector('img');
    const canvas = $('qrBox').querySelector('canvas');
    const source = img?.src || canvas?.toDataURL('image/png');
    if(!source) return;
    const a=document.createElement('a'); a.href=source; a.download=`QR-${(r.title||'resource').replace(/[^a-z0-9]+/gi,'-').slice(0,60)}.png`; a.click();
  };
  $('qrModal').classList.remove('hidden');
}
$('closeModal').addEventListener('click', () => $('qrModal').classList.add('hidden'));
$('qrModal').addEventListener('click', e => { if(e.target === $('qrModal')) $('qrModal').classList.add('hidden'); });

function showHome(){
  $('landing').classList.add('hidden');
  $('hero').classList.remove('hidden');
  $('resultsSection').classList.add('hidden');
  $('sources').classList.remove('hidden');
}
function showLanding(){
  const p = new URLSearchParams(location.search);
  const resource = p.get('resource'); const title = p.get('title') || 'Free Academic Resource';
  if(!resource) return false;
  $('hero').classList.add('hidden'); $('resultsSection').classList.add('hidden'); $('sources').classList.add('hidden'); $('landing').classList.remove('hidden');
  $('landing').innerHTML = `<div class="landing-card">
    <img src="/assets/college_logo.jpg" alt="College logo">
    <div class="eyebrow" style="margin-top:15px">G.P. PORWAL COLLEGE CENTRAL LIBRARY · SINDAGI</div>
    <h2>${escapeHtml(title)}</h2>
    <p>This QR code was generated by the college library resource portal. The resource is opened from its original provider.</p>
    <p class="resource-url">${escapeHtml(resource)}</p>
    <a class="action primary" style="display:block;margin-top:20px" target="_blank" rel="noopener" href="${escapeHtml(resource)}">📖 Read / Open / Download</a>
    <button class="action" style="width:100%;margin-top:10px" id="backSearch">🔍 Search more resources</button>
  </div>`;
  $('backSearch').addEventListener('click', () => { history.pushState({},'',location.pathname); showHome(); });
  return true;
}
function handleRoute(){ if(!showLanding()) showHome(); }
handleRoute();
