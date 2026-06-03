document.addEventListener('DOMContentLoaded', async () => {
  const id = new URLSearchParams(location.search).get('id');
  const root = document.getElementById('lesson-root');
  if (!root) return;

  if (!id) {
    root.innerHTML =
      '<p class="courses-empty">Dars tanlanmagan. <a href="index.html">Katalog</a></p>';
    return;
  }

  try {
    const data = await AVID.getLesson(id);
    const l = data.lesson;
    document.title = 'AVID — ' + l.title;

    root.innerHTML = `
      <aside class="lesson-sidebar">
        <a href="course.html?slug=${esc(l.course_slug)}" class="lesson-link">← ${esc(l.course_title)}</a>
      </aside>
      <div>
        <h1>${esc(l.title)}</h1>
        <p>${esc(l.description)}</p>
        <div class="lesson-player-wrap">
          ${l.video_url ? `<video id="player" controls src="${esc(l.video_url)}"></video>` : '<p class="courses-empty">Video mavjud emas</p>'}
        </div>
        <section id="materials-section" style="margin-top:24px"></section>
        <section id="quiz-section" style="margin-top:24px"></section>
        <section style="margin-top:24px">
          <h3>Izohlar</h3>
          <div id="comments">${data.comments.map(commentHtml).join('') || '<p class="courses-empty">Izoh yo\'q</p>'}</div>
          <form id="comment-form" style="margin-top:16px">
            <textarea name="body" required placeholder="Izoh yozing..." style="width:100%;min-height:80px"></textarea>
            <button type="submit" class="btn-primary" style="margin-top:8px">Yuborish</button>
            <p class="form-feedback" id="comment-feedback"></p>
          </form>
        </section>
      </div>`;

    const video = document.getElementById('player');
    if (video) {
      let lastSave = 0;
      video.addEventListener('timeupdate', () => {
        const now = Date.now();
        if (now - lastSave < 8000) return;
        lastSave = now;
        AVID.saveProgress(id, {
          watched_seconds: Math.floor(video.currentTime),
          completed: false,
        }).catch(() => {});
      });
      video.addEventListener('ended', () => {
        AVID.saveProgress(id, {
          watched_seconds: Math.floor(video.duration) || 0,
          completed: true,
        })
          .then((r) => {
            if (r.progress_percent >= 100) {
              alert('Tabriklaymiz! Kursni tugatdingiz.');
            }
          })
          .catch(() => {});
      });
    }

    document.getElementById('comment-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fb = document.getElementById('comment-feedback');
      const body = e.target.body.value.trim();
      if (body.length < 2) {
        fb.textContent = 'Izoh juda qisqa';
        fb.className = 'form-feedback error';
        return;
      }
      try {
        await AVID.postComment(id, { body });
        location.reload();
      } catch (err) {
        fb.textContent = err.message;
        fb.className = 'form-feedback error';
        if (err.status === 401) {
          location.href = 'login.html?next=' + encodeURIComponent(location.pathname + location.search);
        }
      }
    });

    renderMaterials(data.lesson.materials || []);
    loadQuiz(id);
  } catch (e) {
    const msg =
      e.status === 401
        ? 'Darsni ko\'rish uchun tizimga kiring.'
        : e.status === 403
          ? 'Bu dars uchun avval kursga yoziling.'
          : e.message;
    root.innerHTML = '<p class="courses-empty">' + esc(msg) + '</p>';
    if (e.status === 401) {
      setTimeout(
        () =>
          (location.href =
            'login.html?next=' + encodeURIComponent(location.pathname + location.search)),
        2000
      );
    }
  }
});

function commentHtml(c) {
  return `<div class="comment-item"><strong>${esc(c.name)}</strong><p>${esc(c.body)}</p></div>`;
}

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}

function renderMaterials(materials) {
  const box = document.getElementById('materials-section');
  if (!box) return;
  if (!materials.length) return;
  box.innerHTML =
    '<h3>Materiallar</h3><ul>' +
    materials
      .map(
        (m) =>
          '<li><a href="' +
          esc(m.file_url) +
          '" target="_blank" rel="noopener" download>' +
          esc(m.title) +
          ' (' +
          esc(m.file_type) +
          ')</a></li>'
      )
      .join('') +
    '</ul>';
}

async function loadQuiz(lessonId) {
  const box = document.getElementById('quiz-section');
  if (!box) return;
  try {
    const { quiz } = await AVID.getLessonQuiz(lessonId);
    if (!quiz?.questions?.length) return;
    box.innerHTML =
      '<h3>Test</h3><p>' +
      esc(quiz.title) +
      '</p><form id="quiz-form">' +
      quiz.questions
        .map(
          (q) =>
            '<fieldset style="margin:12px 0"><legend>' +
            esc(q.question) +
            '</legend>' +
            q.options
              .map(
                (opt, oi) =>
                  '<label style="display:block;margin:4px 0"><input type="radio" name="q' +
                  q.id +
                  '" value="' +
                  oi +
                  '" required> ' +
                  esc(opt) +
                  '</label>'
              )
              .join('') +
            '</fieldset>'
        )
        .join('') +
      '<button type="submit" class="btn-primary">Tekshirish</button></form><p id="quiz-result" class="form-feedback"></p>';

    document.getElementById('quiz-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const el = document.getElementById('quiz-result');
      const answers = quiz.questions.map((q) => ({
        question_id: q.id,
        selected_index: Number(e.target['q' + q.id].value),
      }));
      try {
        const res = await AVID.submitQuiz(quiz.id, { answers });
        if (el) {
          el.textContent =
            'Natija: ' +
            res.score_percent +
            '% (' +
            res.correct +
            '/' +
            res.total +
            ')' +
            (res.passed ? ' — o\'tdingiz!' : ' — qayta urinib ko\'ring (70% kerak)');
          el.className = 'form-feedback ' + (res.passed ? 'success' : 'error');
        }
      } catch (err) {
        if (el) {
          el.textContent = err.message;
          el.className = 'form-feedback error';
        }
      }
    });
  } catch (_) {
    /* test yo'q */
  }
}
