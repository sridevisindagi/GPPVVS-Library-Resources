let qrInstance = null;

function switchTab(tabName) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

  if (tabName === 'search') {
    document.getElementById('tab-search-btn').classList.add('active');
    document.getElementById('search-section').classList.add('active');
  } else {
    document.getElementById('tab-custom-btn').classList.add('active');
    document.getElementById('custom-section').classList.add('active');
  }
}

// Directly queries Open Library/Internet Archive API from the browser without server limits
async function handleSearch(event) {
  event.preventDefault();
  const query = document.getElementById('book-query').value.trim();
  const resultsContainer = document.getElementById('results-container');
  const searchBtn = document.getElementById('search-btn');

  if (!query) return;

  searchBtn.textContent = 'Searching...';
  searchBtn.disabled = true;
  resultsContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">Searching full-text archives...</p>';

  try {
    // Queries only public/accessible books directly from client
    const response = await fetch(
      `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&has_fulltext=true&limit=24`
    );
    const data = await response.json();

    resultsContainer.innerHTML = '';

    if (!data.docs || data.docs.length === 0) {
      resultsContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">No open-access books found. Try a different keyword.</p>';
      return;
    }

    data.docs.forEach(book => {
      // Build a direct reader link
      const readerUrl = book.ia && book.ia.length > 0 
        ? `https://archive.org/details/${book.ia[0]}` 
        : `https://openlibrary.org${book.key}`;

      const title = book.title || 'Untitled';
      const author = book.author_name ? book.author_name.join(', ') : 'Unknown Author';
      const year = book.first_publish_year || 'N/A';

      const card = document.createElement('div');
      card.className = 'book-card';
      card.innerHTML = `
        <div class="book-info">
          <h4>${escapeHtml(title)}</h4>
          <p>${escapeHtml(author)} · ${year}</p>
        </div>
        <div class="card-actions">
          <a href="${readerUrl}" target="_blank" class="btn-small read">Read Online</a>
          <button class="btn-small qr" onclick="showQRModal('${encodeURIComponent(title)}', '${encodeURIComponent(author)}', '${readerUrl}')">Get QR Code</button>
        </div>
      `;
      resultsContainer.appendChild(card);
    });

  } catch (err) {
    resultsContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: red;">Error fetching books. Please check your internet connection.</p>';
  } finally {
    searchBtn.textContent = 'Search Open Archives';
    searchBtn.disabled = false;
  }
}

function showQRModal(title, author, url) {
  const modal = document.getElementById('qr-modal');
  document.getElementById('qr-modal-title').textContent = decodeURIComponent(title);
  document.getElementById('qr-modal-author').textContent = decodeURIComponent(author);
  document.getElementById('direct-read-link').href = url;

  const canvas = document.getElementById('qr-code-canvas');
  canvas.innerHTML = '';

  // Generate QR completely inside the browser
  new QRCode(canvas, {
    text: url,
    width: 170,
    height: 170,
    colorDark: '#000000',
    colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel.M
  });

  modal.classList.add('active');
}

function generateCustomQR() {
  const url = document.getElementById('custom-url').value.trim();
  if (!url) {
    alert('Please enter a valid link');
    return;
  }
  showQRModal('Custom Document / PDF', 'External Resource', url);
}

function closeModal() {
  document.getElementById('qr-modal').classList.remove('active');
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, function(m) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
  });
}
