document.addEventListener('DOMContentLoaded', async function () {
  const slug = new URLSearchParams(window.location.search).get('slug');
  const root = document.getElementById('blog-post');
  if (!root || !window.AVID) return;
  if (!slug) {
    root.innerHTML = '<p class="courses-empty">Maqola tanlanmagan. <a href="blog.html">Blog</a></p>';
    return;
  }

  root.innerHTML = '<p class="courses-loading">Yuklanmoqda...</p>';

  try {
    const { post } = await AVID.getBlogPost(slug);
    document.title = 'AVID — ' + post.title;
    root.innerHTML = `
      <img class="blog-post-img" src="${escapeHtml(post.image_url || './img/logo.png')}" alt="">
      <p class="blog-post-date">${escapeHtml(post.published_at)}</p>
      <h1 class="blog-post-title">${escapeHtml(post.title)}</h1>
      <div class="blog-post-content">${formatContent(post.content)}</div>
      <a href="blog.html" class="courses-body-link">← Blogga qaytish</a>`;
  } catch (err) {
    root.innerHTML = '<p class="courses-empty">' + escapeHtml(err.message) + '</p>';
  }
});

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
}

function formatContent(text) {
  return escapeHtml(text).replace(/\n/g, '<br>');
}
