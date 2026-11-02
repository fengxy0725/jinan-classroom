(async () => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  $('about-button').addEventListener('click', () => $('about').showModal());
  $('find').addEventListener('click', () => {
    $('library').scrollIntoView();
    if (!$('catalog-content').hidden) $('query').focus({preventScroll: true});
  });
  const catalog = await window.classroomCatalogReady;
  if (!catalog) return;
  const gradeNames = '一二三四五六七八九';
  const subjects = ['语文', '历史'];
  const preferred = window.classroomSeries.map(id => catalog.find(course => course.id === id)).filter(Boolean);
  const courses = catalog;
  const covers = {
    'yong-xue':'snow', 'chengtiansi':'moon', 'huxinting-kanxue':'boat', 'guo-lingdingyang':'boat',
    'shan-xing':'snow', 'ti-xi-lin-bi':'boat', 'jianjia':'boat', 'yu-guo-xiao-yuan':'moon'
  };
  function node(tag, cls, text) {
    const item = document.createElement(tag);
    if (cls) item.className = cls;
    if (text !== undefined) item.textContent = text;
    return item;
  }
  function makeCard(course) {
    const link = node('a','card');
    link.href = './lesson.html?id=' + encodeURIComponent(course.id);
    const section = '第 ' + course.sectionNumber + ' 节';
    link.setAttribute('aria-label', gradeName(course.grade) + course.subject + '，' + unitName(course) + '，' + section + '《' + course.title + '》');
    const cover = node('div','cover');
    const img = node('img');
    img.src = './assets/covers/' + (Object.hasOwn(covers, course.id) ? covers[course.id] : course.subject === '历史' ? 'history' : 'paper') + '.svg';
    img.alt = '';
    img.loading = 'lazy';
    cover.append(img, node('span','cover-index',section));
    const body = node('div','card-body');
    const tags = node('div','tagline');
    tags.append(node('span','subject-tag' + (course.subject === '历史' ? ' history' : ''),course.subject),
      node('span','',gradeName(course.grade) + ' · ' + course.term + ' · ' + shortUnit(course.term, unitName(course))));
    const foot = node('div','card-foot');
    const open = node('b','','进入课堂');
    open.append(node('span','','→'));
    foot.append(node('span','',course.type || '课件改编'), open);
    body.append(tags,node('h3','',course.title),node('p','',course.summary),foot);
    link.append(cover,body);
    return link;
  }
  const gradeName = (grade) => gradeNames[grade - 1] + '年级';
  const unitName = (course) => course.unit || '待编目';
  const shortUnit = (term, unit) => unit.startsWith(term + ' · ') ? unit.slice(term.length + 3) : unit;
  const keys = ['subject', 'stage', 'grade', 'term', 'unit', 'q'];
  const inStage = (course, stage) => !stage || (stage === '小学' ? course.grade <= 6 : course.grade >= 7);

  // Fragment routes also work under a GitHub project subdirectory.
  function routeFor(parts) {
    const params = new URLSearchParams();
    for (const key of keys) {
      if (parts[key]) params.set(key, parts[key]);
    }
    return '#library?' + params.toString();
  }
  function readRoute() {
    const hash = location.hash;
    const params = new URLSearchParams(hash.startsWith('#library?') ? hash.slice(9) : location.search);
    return Object.fromEntries(keys.map(key => [key, params.get(key) || '']));
  }
  function routeLink(label, route, className) {
    const link = node('a', className, label);
    link.href = routeFor(route);
    return link;
  }
  function option(title, count, route, className, subtitle) {
    const link = routeLink(undefined, route, 'shelf-option ' + className);
    if (subtitle) link.append(node('span', 'option-overline', subtitle));
    link.append(node('strong', 'option-title', title));
    const foot = node('span', 'option-foot');
    const arrow = node('b', 'option-arrow', '→');
    arrow.setAttribute('aria-hidden', 'true');
    foot.append(node('span', '', count + ' 节课'), arrow);
    link.append(foot);
    return link;
  }
  function cardList(catalogue) {
    const grid = node('div', 'cards');
    grid.append(...catalogue.map(makeCard));
    return grid;
  }
  function heading(title, count) {
    $('stage-title').textContent = title;
    $('results').textContent = count;
  }

  function trail(items) {
    const entries = items.map(({label, path}, index) => {
      const isCurrent = index === items.length - 1;
      const item = isCurrent ? node('span', '', label) : routeLink(label, path);
      if (isCurrent) item.setAttribute('aria-current', 'page');
      const li = node('li');
      li.append(item);
      return li;
    });
    const list = node('ol');
    list.append(...entries);
    $('trail').replaceChildren(list);
  }

  function renderStage(route) {
    const output = $('directory');
    const subjectCourses = courses.filter(c => c.subject === route.subject && inStage(c, route.stage));
    const gradeCourses = subjectCourses.filter(c => String(c.grade) === route.grade);
    const units = gradeCourses.filter(c => c.term === route.term && unitName(c) === route.unit);
    const path = [{label: '课程书架', path: {}}];
    if (route.subject) path.push({label: route.stage + (route.subject === '历史' ? '文史拓展' : route.subject), path: {subject: route.subject, stage: route.stage}});
    if (route.grade) path.push({label: gradeName(route.grade), path: {subject: route.subject, stage: route.stage, grade: route.grade}});
    if (route.unit) path.push({label: route.term + ' · ' + shortUnit(route.term, route.unit), path: route});
    trail(path);
    if (!route.subject) {
      heading('选择学科', '共 ' + courses.length + ' 节课');
      if (!courses.length) {
        const empty = node('div', 'empty');
        empty.append(node('h4', '', '书架上暂时还没有已发布的课'));
        output.append(empty);
        return;
      }
      const grid = node('div', 'subject-books');
      subjects.forEach((subject, index) => {
        const number = courses.filter(course => course.subject === subject).length;
        if (number) grid.append(option(index === 0 ? '语文课堂' : '文史拓展', number, {subject}, index === 0 ? 'chinese-book' : 'history-book', index === 0 ? '主课　/　阅读与表达' : '副栏　/　读史料'));
      });
      output.append(grid);
      $('featured').hidden = !preferred.length;
      return;
    }
    if (!route.grade) {
      const grades = [...new Set(subjectCourses.map(c => c.grade))].sort((a, b) => a - b);
      heading('选择年级', '共 ' + grades.length + ' 个年级');
      if (!grades.length) {
        const empty = node('div', 'empty');
        empty.append(node('h4', '', '这个栏目暂时没有已发布的课程'), routeLink('浏览其他课程', {}, 'text-link'));
        output.append(empty);
        return;
      }
      const grid = node('div', 'grade-grid');
      for (const grade of grades) {
        const total = subjectCourses.filter(c => c.grade === grade).length;
        const subtitle = route.subject === '历史' && grade <= 6 ? '历史启蒙' : '';
        grid.append(option(gradeName(grade), total, {subject: route.subject, stage: route.stage, grade}, 'grade-option', subtitle));
      }
      output.append(grid);
      return;
    }
    if (!route.unit) {
      const terms = new Set(gradeCourses.map(c => c.term));
      heading('选择单元', gradeName(route.grade) + ' · ' + route.subject);
      for (const term of terms) {
        const inTerm = gradeCourses.filter(course => course.term === term);
        const group = node('section', 'term-group');
        group.append(node('h4', '', term));
        const grid = node('div', 'unit-grid');
        for (const unit of new Set(inTerm.map(unitName))) {
          const total = inTerm.filter(c => unitName(c) === unit).length;
          grid.append(option(shortUnit(term, unit), total, {subject: route.subject, stage: route.stage, grade: route.grade, term, unit}, 'unit-option'));
        }
        group.append(grid);
        output.append(group);
      }
      return;
    }
    heading('本单元课程', '共 ' + units.length + ' 节课');
    output.append(cardList(units));
  }

  // Index each lesson's content once. A search always covers both subjects.
  const searchable = courses.map(course => {
    const text = [course.title, course.subject, gradeName(course.grade), course.grade + '年级', '第' + course.sectionNumber + '节',
      course.term, unitName(course), ...(course.sessions || []).flatMap(item => [item.label,item.text]), course.genre, course.type || '课件改编', course.summary, course.warmup,
      course.video?.title, course.video?.transcript,
      ...course.focus.flatMap(item => [item.label, item.text]), course.activity.prompt,
      ...course.activity.choices.flatMap(item => [item.label, item.text]),
      ...course.quiz.flatMap(item => [item.question, ...item.options, item.explanation])].join(' ').toLowerCase();
    return {course, text};
  });
  function search(route) {
    const terms = route.q.toLowerCase().trim().split(/\s+/);
    const matches = searchable.filter(item => terms.every(term => item.text.includes(term))).map(item => item.course);
    trail([{label: '课程书架', path: {}}, {label: '全站搜索', path: route}]);
    heading('搜索结果', '共 ' + matches.length + ' 节课');
    if (matches.length) {
      $('directory').append(cardList(matches));
    } else {
      const empty = node('div', 'empty');
      empty.append(node('h4', '', '没有找到匹配的课'), node('p', '', '试试课名、学科、年级或课文里的词。'), routeLink('返回课程目录', {...route, q: ''}, 'text-link'));
      $('directory').append(empty);
    }
  }

  function render() {
    const route = readRoute();
    if (!subjects.includes(route.subject)) route.subject = '';
    if (route.subject !== '语文' || !['小学', '初中'].includes(route.stage)) route.stage = '';
    const scoped = courses.filter(c => c.subject === route.subject && inStage(c, route.stage));
    if (!scoped.some(c => String(c.grade) === route.grade)) route.grade = '';
    if (!scoped.some(c => String(c.grade) === route.grade && c.term === route.term && unitName(c) === route.unit)) {
      route.unit = '';
      route.term = '';
    }
    const input = $('query');
    if (input.value.trim() !== route.q) input.value = route.q;
    $('clear-query').hidden = !input.value;
    $('featured').hidden = true;
    $('directory').replaceChildren();
    if (route.q.trim()) search(route); else renderStage(route);
  }
  function updateQuery() {
    const route = {...readRoute(), q: $('query').value.trim()};
    const hash = routeFor(route);
    if (hash !== location.hash) {
      try {
        history.replaceState(null, '', hash);
      } catch {
        location.replace(hash);
      }
    }
    render();
  }
  $('query').addEventListener('input', event => { if (!event.isComposing) updateQuery(); });
  $('query').addEventListener('compositionend', updateQuery);
  $('clear-query').addEventListener('click', () => {
    $('query').value = '';
    updateQuery();
    $('query').focus();
  });
  const first = courses.find(course => course.id === 'ti-xi-lin-bi');
  if (first) {
    $('first-course').href = './lesson.html?id=' + encodeURIComponent(first.id);
    $('first-course').textContent = '首课 · ' + first.title + ' →';
  }
  $('featured-cards').append(...preferred.map(makeCard));
  $('catalog-content').hidden = false;
  window.addEventListener('hashchange', () => {
    if (!location.hash.startsWith('#library') && location.hash !== '') return;
    render();
    if (location.hash.startsWith('#library?') && document.activeElement !== $('query')) {
      $('library').scrollIntoView({block: 'start'});
      $('stage-title').focus({preventScroll: true});
    }
  });
  render();
  if (location.hash.startsWith('#library?')) $('library').scrollIntoView({block: 'start'});
})();
