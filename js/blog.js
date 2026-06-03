document.addEventListener('DOMContentLoaded', async function () {
  const grid = document.getElementById('blog-grid');
  if (!grid || !window.AVID) return;

  grid.innerHTML = '<p class="courses-loading">Yuklanmoqda...</p>';

  try {
    const { posts } = await AVID.getBlogPosts();
    if (!posts.length) {
      grid.innerHTML = '<p class="courses-empty">Hozircha maqolalar yo\'q</p>';
      return;
    }
    grid.innerHTML = posts
      .map(
        (p) => `
      <a href="blog-post.html?slug=${p.slug}" class="blog-card">
        <img class="blog-card-img" src="${escapeHtml(p.image_url || './img/logo.png')}" alt="">
        <div class="blog-card-body">
          <div class="blog-card-date">${formatDate(p.published_at)}</div>
          <h4 class="blog-card-title">${escapeHtml(p.title)}</h4>
          <p class="blog-card-text">${escapeHtml(p.excerpt)}</p>
        </div>
      </a>`
      )
      .join('');
  } catch {
    grid.innerHTML = '<p class="courses-empty">Blog yuklanmadi. Serverni tekshiring.</p>';
  }
});

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString('uz-UZ', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
}
