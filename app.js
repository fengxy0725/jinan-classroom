(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const gradeNames = '一二三四五六七八九';
  const subjects = [...document.querySelectorAll('[data-subject]')];
  const catalogueOrder = ['yong-xue', 'chengtiansi', 'huxinting-kanxue', 'shangyang-fangsheng', 'xiao-yu-dian', 'old-photo-clues'];
  const preferred = catalogueOrder.map(id => window.lessons.find(course => course.id === id)).filter(Boolean);
  const courses = [...preferred, ...window.lessons.filter(course => !preferred.includes(course)).sort((a,b) => a.grade - b.grade)];
  const covers = {
    'yong-xue':'snow', 'chengtiansi':'moon', 'huxinting-kanxue':'boat', 'guo-lingdingyang':'boat',
    'shan-xing':'snow', 'ti-xi-lin-bi':'boat', 'jianjia':'boat', 'yu-guo-xiao-yuan':'moon'
  };
  const params = new URLSearchParams(location.search);
  let subject = subjects.some(b => b.dataset.subject === params.get('subject')) ? params.get('subject') : '';
  $('grade').value = /^[1-9]$/.test(params.get('grade')) ? params.get('grade') : '';
  $('query').value = params.get('q') || '';
  let limit = 6;

  function node(tag, cls, text) {
    const item = document.createElement(tag);
    if (cls) item.className = cls;
    if (text !== undefined) item.textContent = text;
    return item;
  }
  function makeCard(course) {
    const link = node('a','card');
    link.href = './lesson.html?id=' + encodeURIComponent(course.id);
    link.setAttribute('aria-label', '进入' + gradeNames[course.grade-1] + '年级' + course.subject + '《' + course.title + '》');
    const cover = node('div','cover');
    const img = node('img');
    img.src = './assets/covers/' + (covers[course.id] || (course.subject === '历史' ? 'history' : 'paper')) + '.svg';
    img.alt = '';
    cover.append(img, node('span','cover-index','No. ' + String(courses.indexOf(course)+1).padStart(2,'0')));
    const body = node('div','card-body');
    const tags = node('div','tagline');
    tags.append(node('span','subject-tag' + (course.subject === '历史' ? ' history' : ''),course.subject),
      node('span','',gradeNames[course.grade-1] + '年级 · ' + course.term));
    const foot = node('div','card-foot');
    const open = node('b','','进入课堂');
    open.append(node('span','','→'));
    foot.append(node('span','',course.type || '课件改编'), open);
    body.append(tags,node('h3','',course.title),node('p','',course.summary),foot);
    link.append(cover,body);
    return link;
  }
  function render() {
    const query = $('query').value.trim().toLowerCase();
    const grade = $('grade').value;
    for (const button of subjects) button.setAttribute('aria-pressed', String(button.dataset.subject === subject));
    const filtered = courses.filter(c =>
      (!grade || c.grade === Number(grade)) && (!subject || subject === c.subject) &&
      [c.title, c.genre, c.summary, c.subject, c.term, c.type || '课件改编', gradeNames[c.grade-1]+'年级'].join(' ').toLowerCase().includes(query)
    );
    $('results').textContent = '共 ' + filtered.length + ' 节课程';
    const cards = $('cards');
    cards.replaceChildren(...filtered.slice(0,limit).map(makeCard));
    if (!filtered.length) {
      const empty = node('div','empty');
      const clear = node('button','','查看全部课程');
      clear.type = 'button';
      clear.addEventListener('click', () => { subject=''; $('grade').value=''; $('query').value=''; filterChanged(); subjects[0].focus(); });
      empty.append(node('h3','','这次没有找到匹配的课程'),node('p','','换个关键词，或查看其他年级的课堂。'),clear);
      cards.append(empty);
    }
    $('more-wrap').hidden = limit >= filtered.length;
  }
  function filterChanged() {
    const url = new URL(location.href);
    for (const [key,value] of [['subject',subject], ['grade',$('grade').value], ['q',$('query').value.trim()]]) {
      if (value) url.searchParams.set(key,value); else url.searchParams.delete(key);
    }
    if (location.protocol !== 'file:') history.replaceState(null,'',url);
    limit = 6;
    render();
  }
  for (const button of subjects) button.addEventListener('click', () => { subject=button.dataset.subject; filterChanged(); });
  $('grade').addEventListener('change',filterChanged);
  $('query').addEventListener('input',filterChanged);
  $('more').addEventListener('click', () => {
    const oldLimit = limit;
    limit += 6;
    render();
    $('cards').children[oldLimit]?.focus({preventScroll:true});
  });
  $('find').addEventListener('click', () => { $('library').scrollIntoView(); $('query').focus({preventScroll:true}); });
  $('about-button').addEventListener('click', () => $('about').showModal());
  render();
})();
