(function () {
  const courseId = Number(new URLSearchParams(location.search).get('id'));
  let state = { course: null, modules: [], stats: null, selectedLessonId: null };
  let categories = [];

  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    const root = document.getElementById('manage-root');
    if (!courseId) {
      root.innerHTML = '<p>Kurs ID kerak. <a href="instructor-dashboard.html">Panel</a></p>';
      return;
    }
    try {
      const { categories: cats } = await AVID.getCategories();
      categories = cats || [];
      await reload();
    } catch (e) {
      root.innerHTML =
        '<p>' + esc(e.message) + '</p><p><a href="login.html">Kirish</a> (o\'qituvchi)</p>';
    }
  }

  async function reload() {
    const data = await AVID.getInstructorCourse(courseId);
    state.course = data.course;
    state.modules = data.modules || [];
    state.stats = data.stats || {};
    if (!state.selectedLessonId) {
      const first = state.modules[0]?.lessons?.[0];
      if (first) state.selectedLessonId = first.id;
    }
    render();
  }

  function render() {
    const root = document.getElementById('manage-root');
    const c = state.course;
    const s = state.stats;
    const lesson = findLesson(state.selectedLessonId);

    root.innerHTML = `
      <div class="instructor-toolbar">
        <a href="instructor-dashboard.html">← Panel</a>
        <span><strong>${esc(c.title)}</strong> · ${esc(c.status)}</span>
        ${
          c.status === 'published'
            ? `<a href="course.html?slug=${esc(c.slug)}" target="_blank" rel="noopener">Katalogni ko'rish</a>`
            : '<span class="course-meta" title="Avval kursni nashr qiling">Katalog (nashr qilinmagan)</span>'
        }
      </div>
      <div class="stat-cards stat-cards--compact">
        <div class="stat-card"><strong>${s.students ?? 0}</strong> Talabalar</div>
        <div class="stat-card"><strong>${s.views ?? 0}</strong> Ko'rishlar</div>
        <div class="stat-card"><strong>${s.completions ?? 0}</strong> Tugatganlar</div>
      </div>
      <div class="instructor-grid">
        <div>
          <div class="instructor-panel">
            <h2>Kurs sozlamalari</h2>
            <form id="course-form" novalidate>
              <label>Sarlavha *</label>
              <input name="title" required minlength="3" maxlength="120" value="${attr(c.title)}">
              <span class="field-error" data-err="title"></span>
              <label>Tavsif *</label>
              <textarea name="description" required minlength="20" maxlength="5000">${esc(c.description)}</textarea>
              <span class="field-error" data-err="description"></span>
              <label>Texnologiya *</label>
              <select name="programming_language" required>
                ${categories.map((cat) => `<option value="${attr(cat.slug)}" ${cat.slug === c.programming_language ? 'selected' : ''}>${esc(cat.name)}</option>`).join('')}
              </select>
              <label>Daraja</label>
              <select name="level">
                <option value="beginner" ${c.level === 'beginner' ? 'selected' : ''}>Boshlang'ich</option>
                <option value="intermediate" ${c.level === 'intermediate' ? 'selected' : ''}>O'rta</option>
                <option value="advanced" ${c.level === 'advanced' ? 'selected' : ''}>Ilg'or</option>
              </select>
              <label>Holat</label>
              <select name="status">
                <option value="draft" ${c.status === 'draft' ? 'selected' : ''}>Qoralama</option>
                <option value="published" ${c.status === 'published' ? 'selected' : ''}>Nashr</option>
                <option value="archived" ${c.status === 'archived' ? 'selected' : ''}>Arxiv</option>
              </select>
              <button type="submit" class="btn-primary" style="margin-top:16px;width:100%">Kursni saqlash</button>
            </form>
            <p class="form-feedback" id="course-fb"></p>
          </div>
          <div class="instructor-panel" style="margin-top:16px">
            <h3>Modullar va darslar</h3>
            <form id="add-module-form" style="display:flex;gap:8px;margin-bottom:12px">
              <input name="title" placeholder="Yangi modul" required minlength="2" maxlength="120" style="flex:1">
              <button type="submit" class="btn-sm ghost">+</button>
            </form>
            <ul class="module-list" id="module-list"></ul>
          </div>
        </div>
        <div class="instructor-panel" id="lesson-panel">
          ${lesson ? lessonEditorHtml(lesson) : '<p>Dars tanlang yoki yangi dars qo\'shing.</p>'}
        </div>
      </div>`;

    renderModules();
    bindCourseForm();
    bindModuleForm();
    if (lesson) bindLessonPanel(lesson);
  }

  function renderModules() {
    const ul = document.getElementById('module-list');
    if (!ul) return;
    ul.innerHTML = state.modules
      .map(
        (m) => `
      <li class="module-item" data-module="${m.id}">
        <div class="module-head">
          <strong>${esc(m.title)}</strong>
          <span>
            <button type="button" class="btn-sm ghost btn-add-lesson" data-module="${m.id}">+ Dars</button>
            <button type="button" class="btn-sm danger btn-del-module" data-id="${m.id}">×</button>
          </span>
        </div>
        <ul class="lesson-list">
          ${(m.lessons || [])
            .map(
              (l) => `
            <li>
              <button type="button" class="lesson-pick ${l.id === state.selectedLessonId ? 'active' : ''}" data-id="${l.id}">
                ${esc(l.title)}
                <span class="lesson-badge">${l.has_video ? '▶' : '—'} ${l.materials?.length || 0}f ${l.has_quiz ? '?' : ''}</span>
              </button>
            </li>`
            )
            .join('')}
        </ul>
      </li>`
      )
      .join('');

    ul.querySelectorAll('.lesson-pick').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.selectedLessonId = Number(btn.dataset.id);
        render();
      });
    });
    ul.querySelectorAll('.btn-add-lesson').forEach((btn) => {
      btn.addEventListener('click', () => addLesson(Number(btn.dataset.module)));
    });
    ul.querySelectorAll('.btn-del-module').forEach((btn) => {
      btn.addEventListener('click', () => deleteModule(Number(btn.dataset.id)));
    });
  }

  function lessonEditorHtml(l) {
    return `
      <h2>Dars: ${esc(l.title)}</h2>
      <form id="lesson-form" novalidate>
        <label>Sarlavha *</label>
        <input name="title" required minlength="2" maxlength="200" value="${attr(l.title)}">
        <span class="field-error" data-err="title"></span>
        <label>Tavsif</label>
        <textarea name="description" maxlength="3000">${esc(l.description || '')}</textarea>
        <label><input type="checkbox" name="is_preview" ${l.is_preview ? 'checked' : ''}> Bepul ko'rish (preview)</label>
        <label>Davomiylik (sekund)</label>
        <input name="duration_seconds" type="number" min="0" value="${l.duration_seconds || 0}">
        <button type="submit" class="btn-primary" style="margin-top:12px">Darsni saqlash</button>
        <button type="button" class="btn-sm danger" id="btn-del-lesson" style="margin-left:8px">O'chirish</button>
      </form>
      <p class="form-feedback" id="lesson-fb"></p>
      <h3 style="margin-top:20px">Video</h3>
      ${l.video_url ? `<p><a href="${attr(l.video_url)}" target="_blank" rel="noopener">Joriy video</a></p>` : '<p>Video yuklanmagan</p>'}
      <form id="video-form">
        <input type="file" name="video" accept="video/mp4,video/webm,video/ogg" required>
        <button type="submit" class="btn-sm ghost" style="margin-top:8px">Video yuklash</button>
      </form>
      <h3 style="margin-top:20px">Materiallar (PDF, DOCX, ZIP)</h3>
      <ul class="materials-list" id="materials-list">
        ${(l.materials || [])
          .map(
            (m) => `
          <li>
            <a href="${attr(m.file_url)}" target="_blank" rel="noopener">${esc(m.title)}</a>
            <button type="button" class="btn-sm danger btn-del-mat" data-id="${m.id}">×</button>
          </li>`
          )
          .join('')}
      </ul>
      <form id="material-form">
        <input type="file" name="file" accept=".pdf,.doc,.docx,.zip,application/pdf,application/zip" required>
        <input type="text" name="title" placeholder="Nomi (ixtiyoriy)" style="margin-top:8px">
        <button type="submit" class="btn-sm ghost" style="margin-top:8px">Material yuklash</button>
      </form>
      <div class="quiz-editor">
        <h3>Test</h3>
        <form id="quiz-form">
          <label>Test nomi</label>
          <input name="quiz_title" required minlength="2" value="${attr(l.title + ' — test')}">
          <div id="quiz-questions"></div>
          <button type="button" class="btn-sm ghost" id="btn-add-q">+ Savol</button>
          <button type="submit" class="btn-primary" style="margin-top:12px">Testni saqlash</button>
        </form>
      </div>`;
  }

  function bindCourseForm() {
    const form = document.getElementById('course-form');
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearErrors(form);
      const payload = {
        title: form.title.value.trim(),
        description: form.description.value.trim(),
        programming_language: form.programming_language.value,
        level: form.level.value,
        status: form.status.value,
      };
      if (!validateCourse(payload, form)) return;
      const fb = document.getElementById('course-fb');
      try {
        await AVID.updateCourse(courseId, payload);
        showFb(fb, 'Kurs saqlandi', 'success');
        await reload();
      } catch (err) {
        showFb(fb, err.message, 'error');
      }
    });
  }

  function bindModuleForm() {
    document.getElementById('add-module-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = e.target.title;
      const title = input.value.trim();
      if (title.length < 2) return;
      const fb = document.getElementById('course-fb');
      try {
        await AVID.addModule(courseId, title);
        input.value = '';
        await reload();
      } catch (err) {
        showFb(fb, err.message, 'error');
      }
    });
  }

  function bindLessonPanel(l) {
    const form = document.getElementById('lesson-form');
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearErrors(form);
      const payload = {
        title: form.title.value.trim(),
        description: form.description.value.trim(),
        is_preview: form.is_preview.checked,
        duration_seconds: Number(form.duration_seconds.value) || 0,
      };
      if (payload.title.length < 2) {
        setFieldError(form, 'title', 'Kamida 2 belgi');
        return;
      }
      const fb = document.getElementById('lesson-fb');
      try {
        await AVID.updateLesson(l.id, payload);
        showFb(fb, 'Dars saqlandi', 'success');
        await reload();
      } catch (err) {
        showFb(fb, err.message, 'error');
      }
    });

    document.getElementById('btn-del-lesson')?.addEventListener('click', () => deleteLesson(l.id));

    document.getElementById('video-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const file = e.target.video.files[0];
      if (!file) return;
      const fb = document.getElementById('lesson-fb');
      showFb(fb, 'Video yuklanmoqda...', 'success');
      try {
        const video = document.createElement('video');
        video.preload = 'metadata';
        const duration = await new Promise((resolve) => {
          const blobUrl = URL.createObjectURL(file);
          const timeout = setTimeout(() => {
            URL.revokeObjectURL(blobUrl);
            resolve(0);
          }, 10000);
          video.onloadedmetadata = () => {
            clearTimeout(timeout);
            URL.revokeObjectURL(blobUrl);
            resolve(Math.floor(video.duration) || 0);
          };
          video.onerror = () => {
            clearTimeout(timeout);
            URL.revokeObjectURL(blobUrl);
            resolve(0);
          };
          video.src = blobUrl;
        });
        await AVID.uploadLessonVideo(l.id, file, duration);
        showFb(fb, 'Video yuklandi', 'success');
        await reload();
      } catch (err) {
        showFb(fb, err.message, 'error');
      }
    });

    document.getElementById('material-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const file = e.target.file.files[0];
      if (!file) return;
      const fb = document.getElementById('lesson-fb');
      try {
        await AVID.uploadLessonMaterial(l.id, file, e.target.title.value.trim());
        showFb(fb, 'Material qo\'shildi', 'success');
        e.target.reset();
        await reload();
      } catch (err) {
        showFb(fb, err.message, 'error');
      }
    });

    document.querySelectorAll('.btn-del-mat').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm('Material o\'chirilsinmi?')) return;
        const fb = document.getElementById('lesson-fb');
        try {
          await AVID.deleteLessonMaterial(Number(btn.dataset.id));
          await reload();
        } catch (err) {
          showFb(fb, err.message, 'error');
        }
      });
    });

    initQuizEditor(l.id);
  }

  async function initQuizEditor(lessonId) {
    const box = document.getElementById('quiz-questions');
    let questions = [
      { question: '', options: ['', ''], correct_index: 0 },
    ];
    try {
      const { quiz } = await AVID.getInstructorLessonQuiz(lessonId);
      if (quiz?.questions?.length) {
        document.querySelector('#quiz-form [name=quiz_title]').value = quiz.title;
        questions = quiz.questions.map((q) => ({
          question: q.question,
          options: [...q.options],
          correct_index: q.correct_index,
        }));
      }
    } catch (_) {}

    function draw() {
      box.innerHTML = questions
        .map(
          (q, qi) => `
        <div class="quiz-q-block" data-qi="${qi}">
          <label>Savol ${qi + 1}</label>
          <input type="text" class="q-text" value="${attr(q.question)}" required minlength="3">
          ${q.options
            .map(
              (opt, oi) => `
            <label style="display:flex;align-items:center;gap:6px;margin:4px 0">
              <input type="radio" name="correct_${qi}" value="${oi}" ${q.correct_index === oi ? 'checked' : ''}>
              <input type="text" class="q-opt" data-oi="${oi}" value="${attr(opt)}" required>
            </label>`
            )
            .join('')}
          <button type="button" class="btn-sm ghost btn-add-opt" data-qi="${qi}">+ Variant</button>
          ${qi > 0 ? `<button type="button" class="btn-sm danger btn-rm-q" data-qi="${qi}">Savolni o'chirish</button>` : ''}
        </div>`
        )
        .join('');

      box.querySelectorAll('.q-text').forEach((inp) => {
        inp.addEventListener('input', (e) => {
          const qi = Number(e.target.closest('.quiz-q-block').dataset.qi);
          questions[qi].question = e.target.value;
        });
      });
      box.querySelectorAll('.q-opt').forEach((inp) => {
        inp.addEventListener('input', (e) => {
          const block = e.target.closest('.quiz-q-block');
          const qi = Number(block.dataset.qi);
          const oi = Number(e.target.dataset.oi);
          questions[qi].options[oi] = e.target.value;
        });
      });
      box.querySelectorAll('input[type=radio]').forEach((inp) => {
        inp.addEventListener('change', (e) => {
          const qi = Number(e.target.name.split('_')[1]);
          questions[qi].correct_index = Number(e.target.value);
        });
      });
      box.querySelectorAll('.btn-add-opt').forEach((btn) => {
        btn.addEventListener('click', () => {
          const qi = Number(btn.dataset.qi);
          if (questions[qi].options.length < 6) questions[qi].options.push('');
          draw();
        });
      });
      box.querySelectorAll('.btn-rm-q').forEach((btn) => {
        btn.addEventListener('click', () => {
          questions.splice(Number(btn.dataset.qi), 1);
          draw();
        });
      });
    }

    draw();

    document.getElementById('btn-add-q')?.addEventListener('click', () => {
      if (questions.length < 20) {
        questions.push({ question: '', options: ['', ''], correct_index: 0 });
        draw();
      }
    });

    document.getElementById('quiz-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = e.target.quiz_title.value.trim();
      const payload = {
        title,
        questions: questions.map((q) => ({
          question: q.question.trim(),
          options: q.options.map((o) => o.trim()).filter(Boolean),
          correct_index: q.correct_index,
        })),
      };
      const fb = document.getElementById('lesson-fb');
      if (!title || payload.questions.some((q) => q.question.length < 3 || q.options.length < 2)) {
        showFb(fb, 'Har bir savol va kamida 2 variant to\'ldiring', 'error');
        return;
      }
      try {
        await AVID.saveLessonQuiz(lessonId, payload);
        showFb(fb, 'Test saqlandi', 'success');
        await reload();
      } catch (err) {
        showFb(fb, err.message, 'error');
      }
    });
  }

  async function addLesson(moduleId) {
    const title = prompt('Dars nomi:');
    if (!title || title.trim().length < 2) return;
    const fb = document.getElementById('course-fb');
    try {
      const res = await AVID.addLesson(courseId, {
        title: title.trim(),
        module_id: moduleId,
        description: '',
        is_preview: false,
      });
      state.selectedLessonId = res.lesson?.id || res.id;
      await reload();
    } catch (err) {
      showFb(fb, err.message, 'error');
    }
  }

  async function deleteModule(id) {
    if (!confirm('Modul va unga bog\'liq darslar o\'chirilsinmi?')) return;
    const fb = document.getElementById('course-fb');
    try {
      await AVID.deleteModule(id);
      await reload();
    } catch (err) {
      showFb(fb, err.message, 'error');
    }
  }

  async function deleteLesson(id) {
    if (!confirm('Dars butunlay o\'chirilsinmi?')) return;
    const fb = document.getElementById('lesson-fb');
    try {
      await AVID.deleteLesson(id);
      state.selectedLessonId = null;
      await reload();
    } catch (err) {
      showFb(fb, err.message, 'error');
    }
  }

  function findLesson(id) {
    for (const m of state.modules) {
      const l = (m.lessons || []).find((x) => x.id === id);
      if (l) return l;
    }
    return null;
  }

  function validateCourse(p, form) {
    let ok = true;
    if (p.title.length < 3) {
      setFieldError(form, 'title', 'Kamida 3 belgi');
      ok = false;
    }
    if (p.description.length < 20) {
      setFieldError(form, 'description', 'Kamida 20 belgi');
      ok = false;
    }
    return ok;
  }

  function clearErrors(form) {
    form.querySelectorAll('.field-error').forEach((el) => (el.textContent = ''));
  }

  function setFieldError(form, name, msg) {
    const el = form.querySelector('[data-err="' + name + '"]');
    if (el) el.textContent = msg;
  }

  function showFb(el, text, type) {
    if (!el) return;
    el.textContent = text;
    el.className = 'form-feedback ' + type;
  }

  function esc(s) {
    return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  }

  function attr(s) {
    return esc(s).replace(/"/g, '&quot;');
  }
})();
