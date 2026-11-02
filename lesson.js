(async () => {
  'use strict';

  const catalog = await window.classroomCatalogReady;
  if (!catalog) return;
  const byId = (id) => document.getElementById(id);
  const id = new URLSearchParams(location.search).get('id');
  const lesson = catalog.find((entry) => entry.id === id);
  if (!lesson) {
    byId('not-found').hidden = false;
    document.title = '暂未找到这节课 · 锦安老师的公开课';
    return;
  }

  function node(tag, text, className) {
    const element = document.createElement(tag);
    if (text != null) element.textContent = text;
    if (className) element.className = className;
    return element;
  }

  function button(label, className) {
    const element = node('button', label, className);
    element.type = 'button';
    return element;
  }

  const gradeNames = '一二三四五六七八九';
  const grade = gradeNames[lesson.grade - 1] + '年级';
  document.title = lesson.title + ' · 锦安老师的公开课';
  const path = new URLSearchParams({subject: lesson.subject});
  const levels = [
    {label: lesson.subject},
    {label: grade, params: {grade: lesson.grade}},
    {label: lesson.unit || lesson.term, params: {term: lesson.term, unit: lesson.unit || '待编目'}}
  ];
  for (const level of levels) {
    for (const [key, value] of Object.entries(level.params || {})) path.set(key, value);
    const link = node('a', level.label);
    link.href = './index.html#library?' + path.toString();
    if (byId('metadata').childElementCount) byId('metadata').append(' / ');
    byId('metadata').append(link);
  }
  byId('metadata').append(' / 第 ' + lesson.sectionNumber + ' 节');
  for (const link of document.querySelectorAll('[data-return-unit]')) {
    link.href = './index.html#library?' + path.toString();
  }
  byId('title').textContent = lesson.title;
  byId('summary').textContent = lesson.summary;
  byId('genre').textContent = lesson.genre;
  byId('type').textContent = lesson.type || '课件改编';
  byId('warmup-text').textContent = lesson.warmup;
  function videoLink(value) {
    if (typeof value !== 'string') return null;
    const raw = value.trim();
    if (!raw || /[\u0000-\u001f\u007f\\]/.test(raw) || raw.startsWith('//')) return null;
    try {
      const url = new URL(raw, location.href);
      if (url.username || url.password || url.hostname.startsWith('jinan-classroom-studio.')) return null;
      if (/^https:\/\//i.test(raw)) return url.protocol === 'https:' ? url : null;
      // Keep repository videos inside the published site's videos/ directory, including local HTTP previews.
      const videoDirectory = new URL('./videos/', location.href);
      if (/^(?:\.\/)?videos\//.test(raw) && url.origin === location.origin &&
          url.pathname.startsWith(videoDirectory.pathname) && url.pathname.length > videoDirectory.pathname.length &&
          !/%(?:2f|5c)/i.test(url.pathname)) return url;
    } catch { /* Invalid lesson data must not prevent reading or practice. */ }
    return null;
  }
  if (lesson.video && typeof lesson.video === 'object') {
    const url = videoLink(lesson.video.url);
    const transcript = typeof lesson.video.transcript === 'string' ? lesson.video.transcript.trim() : '';
    if (url || transcript) {
      byId('video-title').textContent = lesson.video.title || lesson.title;
      const player = byId('lesson-video');
      if (url) {
        const retryVideo = byId('video-retry');
        function showVideoError() {
          byId('video-error').hidden = false;
          retryVideo.hidden = false;
        }
        player.addEventListener('error', showVideoError);
        player.addEventListener('playing', () => { byId('video-error').hidden = true; });
        retryVideo.addEventListener('click', () => {
          player.load();
          player.play().catch(showVideoError);
        });
        player.src = url.href;
      } else {
        player.hidden = true;
        byId('video-error').hidden = false;
      }
      if (transcript) {
        byId('transcript-text').textContent = transcript;
        byId('transcript-panel').hidden = false;
      }
      byId('video-section').hidden = false;
    }
  }
  if (lesson.sessions?.length) {
    for (const session of lesson.sessions) {
      const row = node('li');
      row.append(node('strong', session.label), node('p', session.text));
      byId('session-list').append(row);
    }
    byId('sessions').hidden = false;
  }
  for (const item of lesson.focus) {
    const block = node('div', null, 'reading-block');
    block.append(node('h3', item.label), node('p', item.text));
    byId('focus').append(block);
  }

  byId('activity-prompt').textContent = lesson.activity.prompt;
  const choices = byId('activity-choices');
  for (const item of lesson.activity.choices) {
    const trigger = button(item.label, 'explore-button');
    trigger.setAttribute('aria-pressed', 'false');
    trigger.setAttribute('aria-controls', 'activity-detail');
    trigger.addEventListener('click', () => {
      for (const child of choices.children) {
        child.setAttribute('aria-pressed', String(child === trigger));
      }
      const detail = byId('activity-detail');
      detail.classList.add('is-open');
      detail.replaceChildren(node('strong', item.label), node('p', item.text));
    });
    choices.append(trigger);
  }

  const answers = new Array(lesson.quiz.length).fill(null);
  function updateScore() {
    const answered = answers.filter((value) => value !== null).length;
    const correct = answers.filter((value, index) => value === lesson.quiz[index].answer).length;
    byId('score').textContent = '已答 ' + answered + ' / ' + answers.length + ' 题' +
      (answered > 0 ? '，答对 ' + correct + ' 题。' : '。');
  }

  lesson.quiz.forEach((item, index) => {
    const fieldset = node('fieldset', null, 'quiz');
    const legend = node('legend');
    legend.append(node('span', '第 ' + (index + 1) + ' 题', 'question-number'), node('span', item.question));
    const options = node('div', null, 'options');
    const feedback = node('div', null, 'answer-feedback');
    feedback.setAttribute('role', 'status');
    const retry = button('重新作答', 'retry');
    retry.hidden = true;

    item.options.forEach((text, optionIndex) => {
      const option = button(null, 'option');
      option.setAttribute('aria-pressed', 'false');
      const letter = node('span', String.fromCharCode(65 + optionIndex), 'letter');
      option.append(letter, node('span', text));
      option.addEventListener('click', () => {
        if (answers[index] !== null) return;
        answers[index] = optionIndex;
        const correct = optionIndex === item.answer;
        option.setAttribute('aria-pressed', 'true');
        option.classList.add(correct ? 'correct' : 'incorrect');
        for (const child of options.children) child.setAttribute('aria-disabled', 'true');
        const result = correct ? '答对了。' : '再想想，正确选项是 ' + String.fromCharCode(65 + item.answer) + '。';
        feedback.replaceChildren(node('strong', result), node('p', item.explanation));
        retry.hidden = false;
        updateScore();
      });
      options.append(option);
    });
    retry.addEventListener('click', () => {
      answers[index] = null;
      for (const child of options.children) {
        child.classList.remove('correct', 'incorrect');
        child.setAttribute('aria-pressed', 'false');
        child.removeAttribute('aria-disabled');
      }
      feedback.replaceChildren();
      retry.hidden = true;
      updateScore();
      options.firstElementChild.focus();
    });
    fieldset.append(legend, options, feedback, retry);
    byId('questions').append(fieldset);
  });
  updateScore();

  const recallDraft = byId('recall-draft');
  const recallBack = byId('recall-back');
  let queue = lesson.focus.slice();

  function showRecallCard(message = '') {
    const total = lesson.focus.length;
    const current = queue[0];
    const progress = '已掌握 ' + (total - queue.length) + ' / ' + total + ' 张';
    byId('recall-progress').textContent = message ? message + '　' + progress : progress;
    byId('recall-prompt').textContent = current ? current.label : '这一轮完成了！';
    byId('recall-card').hidden = !current;
    recallDraft.value = '';
    recallDraft.readOnly = false;
    recallBack.hidden = true;
    byId('recall-flip').hidden = false;
    byId('recall-flip').setAttribute('aria-expanded', 'false');
    byId('recall-explanation').textContent = '';
  }

  byId('recall-flip').addEventListener('click', () => {
    if (!queue.length) return;
    byId('recall-explanation').textContent = queue[0].text;
    recallDraft.readOnly = true;
    byId('recall-flip').setAttribute('aria-expanded', 'true');
    byId('recall-flip').hidden = true;
    recallBack.hidden = false;
    byId('recall-back-title').focus();
  });

  function rateCard(again) {
    if (recallBack.hidden || !queue.length) return;
    const current = queue.shift();
    if (again) queue.push(current);
    showRecallCard(again ? '已放回队尾' : '');
    byId('recall-prompt').focus();
  }
  byId('recall-mastered').addEventListener('click', () => rateCard(false));
  byId('recall-again').addEventListener('click', () => rateCard(true));
  byId('recall-reset').addEventListener('click', () => {
    queue = lesson.focus.slice();
    showRecallCard('已重新开始');
    byId('recall-prompt').focus();
  });
  showRecallCard();

  const sequence = catalog.filter(course => course.subject === lesson.subject && course.grade === lesson.grade &&
    course.term === lesson.term && (course.unit || '待编目') === (lesson.unit || '待编目'));
  const next = sequence[sequence.indexOf(lesson) + 1];
  if (next) {
    const link = byId('next-lesson');
    link.textContent = '本单元第 ' + next.sectionNumber + ' 节 · ' + next.title + ' →';
    link.href = './lesson.html?id=' + encodeURIComponent(next.id);
    link.hidden = false;
  }
  const series = window.classroomSeries.map(key => catalog.find(course => course.id === key)).filter(Boolean);
  const seriesIndex = series.indexOf(lesson);
  const featuredNext = seriesIndex >= 0 ? series[seriesIndex + 1] : null;
  if (featuredNext && featuredNext !== next) {
    const link = byId('series-next');
    link.textContent = '本期选课下一篇 · ' + featuredNext.title + ' →';
    link.href = './lesson.html?id=' + encodeURIComponent(featuredNext.id);
    link.hidden = false;
  }
  byId('lesson').hidden = false;
})();
