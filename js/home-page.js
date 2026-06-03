(function () {
  const FLAGSHIP = ['python', 'javascript', 'cpp', 'java', 'csharp', 'php', 'sql'];
  const TECH_ICONS = {
    python: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg',
    javascript: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg',
    cpp: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/cplusplus/cplusplus-original.svg',
    java: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg',
    csharp: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/csharp/csharp-original.svg',
    php: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/php/php-original.svg',
    sql: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg',
  };

  document.addEventListener('DOMContentLoaded', async () => {
    if (!window.AVID) return;
    loadTech();
    loadPopular();
    loadBlog();
  });

  async function loadTech() {
    const grid = document.getElementById('tech-grid');
    if (!grid) return;
    try {
      const { categories } = await AVID.getCategories();
      const items = (categories || []).filter((c) => FLAGSHIP.includes(c.slug));
      grid.innerHTML = items
        .map(
          (c) => `
        <a href="#courses" class="tech-chip" data-lang="${esc(c.slug)}">
          <img src="${esc(TECH_ICONS[c.slug] || './img/lessons.png')}" alt="">
          <span>${esc(c.name)}</span>
        </a>`
        )
        .join('');

      grid.querySelectorAll('.tech-chip').forEach((chip) => {
        chip.addEventListener('click', (e) => {
          const lang = chip.dataset.lang;
          const sel = document.getElementById('filter-lang');
          if (sel) {
            sel.value = lang;
            sel.dispatchEvent(new Event('change'));
          }
        });
      });
    } catch {
      grid.innerHTML = '<p class="courses-empty">Texnologiyalar yuklanmadi</p>';
    }
  }

  async function loadPopular() {
    const row = document.getElementById('popular-courses');
    if (!row) return;
    try {
      const { courses } = await AVID.getCatalog({ sort: 'popular' });
      const top = (courses || []).slice(0, 6);
      if (!top.length) {
        row.innerHTML = '<p class="courses-empty">Kurslar tez orada</p>';
        return;
      }
      row.innerHTML = top.map(courseCardHtml).join('');
    } catch {
      row.innerHTML = '<p class="courses-empty">Kurslar yuklanmadi</p>';
    }
  }

  async function loadBlog() {
    const row = document.getElementById('home-blog');
    if (!row) return;
    try {
      const { posts } = await AVID.getBlogPosts();
      const latest = (posts || []).slice(0, 3);
      if (!latest.length) {
        row.innerHTML = '<p class="courses-empty">Maqolalar tez orada</p>';
        return;
      }
      row.innerHTML = latest
        .map(
          (p) => `
        <a href="blog-post.html?slug=${esc(p.slug)}" class="home-blog-card">
          <img src="${esc(p.image_url || './img/logo.png')}" alt="">
          <div class="home-blog-body">
            <h3>${esc(p.title)}</h3>
            <p>${esc(p.excerpt)}</p>
          </div>
        </a>`
        )
        .join('');
    } catch {
      row.innerHTML = '<p class="courses-empty">Blog yuklanmadi</p>';
    }
  }

  function courseCardHtml(c) {
    return `
      <a href="course.html?slug=${c.slug}" class="courses-card">
        <img class="${courseImgClass(c)}" src="${esc(courseImage(c))}" alt="">
        <div class="courses-body">
          <span class="course-badge">${esc(c.programming_language)}</span>
          <span class="course-badge">${levelLabel(c.level)}</span>
          <div class="courses-body-title">${esc(c.title)}</div>
          <div class="courses-body-number">${c.lesson_count} dars · ${esc(c.instructor_name)}</div>
          <span class="courses-body-link">Kursni ochish</span>
        </div>
      </a>`;
  }

  function levelLabel(level) {
    const map = { beginner: "Boshlang'ich", intermediate: "O'rta", advanced: "Ilg'or" };
    return map[level] || level;
  }

  function courseImage(c) {
    return window.AVID_MEDIA?.courseImage(c) || './img/lessons.png';
  }

  function courseImgClass(c) {
    return window.AVID_MEDIA?.courseImageClass(c) || 'courses-img';
  }

  function esc(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/"/g, '&quot;');
  }
})();
