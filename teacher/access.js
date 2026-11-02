(() => {
  'use strict';

  const STUDIO = 'https://jinan-classroom-studio.fengxy732.chatgpt.site';
  const PAGES = 'https://fengxy0725.github.io';
  const PATH = '/jinan-classroom/teacher/';
  const TRANSACTION = 'jinan-teacher-pkce-v1';
  const TX_LIFE = 10 * 60 * 1000;
  const CHANNEL = 'jinan-teacher-logout-v1';
  const SECRET = /^[A-Za-z0-9_-]{43}$/;
  const $ = id => document.getElementById(id);
  const workspace = $('teacher-workspace');
  let session;
  let expiryTimer;
  let renewing;
  let epoch = 0;
  let lifetime = new AbortController();
  const media = new Set();

  function panel(message, action) {
    $('access-note').textContent = message;
    for (const id of ['login', 'renew', 'retry', 'canonical']) $('access-' + id).hidden = action !== id;
    workspace.hidden = true;
    $('access-panel').hidden = false;
  }
  function revealWorkspace() {
    $('access-panel').hidden = true;
    workspace.hidden = false;
  }
  function lock(message) {
    // Keep the actual input elements for reauthentication. They hold unsaved work.
    for (const binding of media) binding.unload();
    panel(message, workspace.childElementCount ? 'renew' : 'login');
  }
  function erasePrivate() {
    epoch++;
    clearTimeout(expiryTimer);
    session = undefined;
    if (renewing) renewing.cancel('验证已结束。');
    lifetime.abort();
    lifetime = new AbortController();
    for (const binding of [...media]) binding.dispose();
    workspace.hidden = true;
    workspace.replaceChildren();
    document.dispatchEvent(new Event('studio-private-cleared'));
  }

  function b64url(bytes) {
    return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function randomSecret() {
    return b64url(crypto.getRandomValues(new Uint8Array(32)));
  }
  function readTx() {
    try { return JSON.parse(sessionStorage.getItem(TRANSACTION) || 'null'); } catch { return null; }
  }
  function forgetTx() {
    try { sessionStorage.removeItem(TRANSACTION); } catch { /* Storage may be disabled. */ }
  }
  function current(tx, state, flow) {
    const age = tx && Date.now() - tx.issuedAt;
    return tx && tx.flow === flow && tx.state === state && SECRET.test(state) &&
      Number.isFinite(age) && age >= 0 && age < TX_LIFE;
  }
  function beginTx(flow) {
    const tx = {flow, issuedAt: Date.now(), state: randomSecret(), verifier: randomSecret()};
    sessionStorage.setItem(TRANSACTION, JSON.stringify(tx));
    return tx;
  }
  async function authUrl(tx) {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(tx.verifier));
    const url = new URL('/auth/authorize', STUDIO);
    url.search = new URLSearchParams({state: tx.state, code_challenge: b64url(new Uint8Array(digest)), code_challenge_method: 'S256'});
    return url.href;
  }

  function mergeSignals(signals) {
    if (signals.length === 1) return signals[0];
    if (AbortSignal.any) return AbortSignal.any(signals);
    // Safari versions before AbortSignal.any still need to stop a response
    // whose headers arrived before the user left or removed a video.
    const controller = new AbortController();
    const abort = () => {
      controller.abort();
      for (const signal of signals) signal.removeEventListener('abort', abort);
    };
    if (signals.some(signal => signal.aborted)) abort();
    else for (const signal of signals) signal.addEventListener('abort', abort, {once:true});
    return controller.signal;
  }
  async function studioFetch(path, options = {}) {
    const signals = [lifetime.signal];
    if (options.signal) signals.push(options.signal);
    if (path.startsWith('/auth/') || path === '/api/teacher/view') {
      const timeout = new AbortController();
      setTimeout(() => timeout.abort(), 20000);
      signals.push(timeout.signal);
    }
    // Keep the signal attached until the whole response (including video bytes)
    // is consumed. Media bindings also cancel individually when their player moves.
    return fetch(STUDIO + path, {
      ...options, signal: mergeSignals(signals), cache: 'no-store', credentials: 'omit',
      mode: 'cors', redirect: 'error', referrerPolicy: 'no-referrer'
    });
  }

  async function exchange(tx, code, attempt) {
    if (!SECRET.test(tx.verifier) || !SECRET.test(code)) throw new Error('验证信息不完整，请重新登录。');
    const start = epoch;
    const response = await studioFetch('/auth/token', {method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({state: tx.state, code_verifier: tx.verifier, code})});
    if (!response.ok) throw new Error('本次验证已失效，请重新验证。');
    const data = await response.json();
    if (start !== epoch || (attempt && renewing !== attempt) || data.token_type !== 'Bearer' || !SECRET.test(data.access_token) ||
        !Number.isInteger(data.expires_in) || data.expires_in < 1 || data.expires_in > 1800) {
      throw new Error('验证未完成，请重新验证。');
    }
    session = {token: data.access_token, until: Date.now() + data.expires_in * 1000};
    clearTimeout(expiryTimer);
    expiryTimer = setTimeout(() => lock('会话已到期。请重新验证；这页已填写的内容会保留。'), data.expires_in * 1000);
  }

  // Only known private API routes can receive the bearer. Absolute URLs, encoded
  // routing changes, dot segments and cross-origin redirects never receive it.
  function privatePath(path) {
    if (typeof path !== 'string' || !/^\/api\/(?:teacher\/view|visits|videos|courses(?:\/[a-z0-9-]+)?|media\/[a-z0-9-]+)(?:\?[^#\s\\]*)?$/.test(path)) {
      throw new Error('不支持的教师工作台请求。');
    }
    return path;
  }
  async function request(path, options = {}) {
    privatePath(path);
    const active = session;
    if (!active || Date.now() >= active.until) {
      lock('会话已到期。重新验证后，原来的草稿仍在本页。');
      return Response.json({error:'教师登录已过期，请重新验证。'}, {status:401});
    }
    const headers = new Headers(options.headers);
    headers.set('Authorization', 'Bearer ' + active.token);
    const result = await studioFetch(path, {method: options.method || 'GET', headers, body: options.body, signal: options.signal});
    if (result.status === 401 && session === active) {
      active.until = 0;
      lock('登录状态已失效。请重新验证后继续原来的操作。');
    }
    return result;
  }

  function cleanView(html) {
    if (typeof html !== 'string') throw new Error('教师界面加载不完整。');
    // Template contents remain inert, including resource loads. Only studio
    // form and content elements are adopted; scripts and event attributes are not.
    const tpl = document.createElement('template');
    tpl.innerHTML = html;
    const view = tpl.content;
    const exit = view.querySelector('form[action="/logout"]');
    if (!exit || !view.querySelector('#course-management') || !view.querySelector('#visits') || !view.querySelector('#upload')) {
      throw new Error('教师界面加载不完整。');
    }
    const tags = new Set('header div b a form button main span h1 h2 h3 h4 p nav section fieldset label input select option details summary small textarea table thead tr th tbody td ul ol li footer strong'.split(' '));
    const attributes = new Set('id class type name value role size placeholder accept autocomplete maxlength tabindex required disabled hidden'.split(' '));
    for (const el of view.querySelectorAll('*')) {
      if (!tags.has(el.localName)) { el.remove(); continue; }
      for (const attr of [...el.attributes]) {
        if (attr.name === 'href' && el.localName === 'a' &&
            (/^#[a-z][a-z0-9-]*$/.test(attr.value) || attr.value === PAGES + '/jinan-classroom/')) continue;
        if (!attributes.has(attr.name) && !attr.name.startsWith('aria-')) el.removeAttribute(attr.name);
      }
    }
    exit.id = 'teacher-logout-form';
    if (view.querySelector('input[type="password"]')) throw new Error('教师界面返回了意外表单。');
    return view;
  }

  async function mount() {
    const start = epoch;
    const response = await request('/api/teacher/view');
    if (!response.ok) {
      if (response.status === 401) return;
      throw new Error('教师工作台暂时无法载入，请重试。');
    }
    const {html} = await response.json();
    if (start !== epoch || !session || Date.now() >= session.until) return;
    const view = cleanView(html);
    if (typeof window.startJinanStudio !== 'function') throw new Error('工作台组件未加载。请刷新页面重试。');
    workspace.replaceChildren(view);
    window.startJinanStudio();
    revealWorkspace();
  }

  async function initialLogin() {
    try {
      panel('正在前往教师登录页……', null);
      const tx = beginTx('direct');
      location.assign(await authUrl(tx));
    } catch {
      forgetTx();
      panel('无法开始验证。请确认已允许当前标签页使用临时存储，再试一次。', 'login');
    }
  }

  function reauthorize() {
    if (renewing) { renewing.popup.focus(); return renewing.promise; }
    let popup;
    try {
      // Open synchronously on the click, before the asynchronous PKCE digest.
      popup = window.open('about:blank', '_blank', 'popup,width=540,height=700');
    } catch { /* The browser may block new windows. */ }
    if (!popup) return Promise.reject(new Error('请允许本页弹出验证窗口，再点“重新验证并继续”。草稿仍保留在当前标签页。'));
    let tx;
    try {
      tx = beginTx('renew');
      // The returning popup needs only a relay marker. Its opener keeps the verifier.
      popup.sessionStorage.setItem(TRANSACTION, JSON.stringify({flow:'relay',state:tx.state,issuedAt:tx.issuedAt}));
    } catch {
      popup.close();
      forgetTx();
      return Promise.reject(new Error('请允许标签页使用临时存储，然后重新验证。'));
    }
    let settle, reject;
    const promise = new Promise((ok, fail) => { settle = ok; reject = fail; });
    const attempt = {
      tx, popup, promise, claimed:false,
      finish(error) {
        if (renewing !== attempt) return;
        clearInterval(attempt.timer);
        renewing = undefined;
        forgetTx();
        try { popup.close(); } catch { /* Closed by user. */ }
        if (error) reject(error); else settle();
      },
      cancel(message) { attempt.finish(new Error(message)); }
    };
    renewing = attempt;
    attempt.timer = setInterval(() => {
      if ((!attempt.claimed && popup.closed) || !current(tx, tx.state, 'renew')) {
        attempt.cancel('验证窗口已关闭或超时。草稿仍在原页，可以重新验证。');
      }
    }, 500);
    authUrl(tx).then(url => {
      if (renewing === attempt) popup.location.replace(url);
    }).catch(() => attempt.cancel('验证窗口无法打开，请重新验证。'));
    return promise;
  }

  window.addEventListener('message', async event => {
    const attempt = renewing, data = event.data;
    if (!attempt || attempt.claimed || event.origin !== PAGES || event.source !== attempt.popup ||
        data?.type !== 'jinan-auth-return' || !current(readTx(), data.state, 'renew') ||
        data.state !== attempt.tx.state || !SECRET.test(data.code)) return;
    attempt.claimed = true;
    forgetTx();
    attempt.popup.postMessage({type:'jinan-auth-received',state:data.state}, PAGES);
    try {
      await exchange(attempt.tx, data.code, attempt);
      if (renewing !== attempt) return;
      if (workspace.childElementCount) revealWorkspace();
      else await mount();
      attempt.finish();
    } catch (err) { attempt.finish(err); }
  });

  function attachVideo(player, path) {
    privatePath(path);
    if (!/^\/api\/media\/[a-z0-9-]+$/.test(path)) throw new Error('视频地址无效。');
    const load = document.createElement('button');
    load.type = 'button';
    load.className = 'private-media-load secondary';
    load.textContent = '加载并播放';
    const hint = document.createElement('small');
    hint.className = 'private-media-feedback';
    hint.setAttribute('role', 'status');
    player.before(load, hint);
    player.preload = 'none';
    let blobUrl, controller, disposed = false;
    function unload() {
      controller?.abort();
      controller = undefined;
      player.pause();
      if (blobUrl) {
        player.removeAttribute('src');
        player.load();
        URL.revokeObjectURL(blobUrl);
        blobUrl = undefined;
      }
      load.hidden = false;
      load.disabled = false;
      hint.textContent = '';
    }
    async function fetchMedia() {
      if (disposed || controller) return;
      const own = new AbortController();
      controller = own;
      load.disabled = true;
      hint.textContent = '正在读取视频……';
      try {
        const res = await request(path, {signal: own.signal});
        if (!res.ok) throw new Error('视频暂时无法读取。请确认视频仍在视频库中，再点“加载并播放”。');
        const bytes = await res.blob();
        if (disposed || own.signal.aborted || !session || Date.now() >= session.until) return;
        blobUrl = URL.createObjectURL(bytes);
        player.src = blobUrl;
        load.hidden = true;
        hint.textContent = '';
        try { await player.play(); }
        catch { if (!disposed && !own.signal.aborted) hint.textContent = '视频已载入，请使用播放器的播放按钮。'; }
      } catch (err) {
        if (!disposed && !own.signal.aborted) hint.textContent = err.message || '连接失败，可以再次加载。';
      } finally {
        own.abort();
        if (controller === own) { controller = undefined; load.disabled = false; }
      }
    }
    const binding = {player, unload, dispose() {
      if (disposed) return;
      disposed = true;
      unload();
      load.removeEventListener('click', fetchMedia);
      load.remove();
      hint.remove();
      media.delete(binding);
    }};
    media.add(binding);
    load.addEventListener('click', fetchMedia);
    return binding.dispose;
  }

  let channel;
  try { channel = new BroadcastChannel(CHANNEL); } catch { /* Use the storage event instead. */ }
  function localLogout() {
    erasePrivate();
    forgetTx();
    panel('已退出教师工作台。需要时可以再次登录。', 'login');
  }
  if (channel) channel.onmessage = event => { if (event.data === 'logout') localLogout(); };
  window.addEventListener('storage', event => { if (event.key === CHANNEL && event.newValue) localLogout(); });

  async function logout() {
    if (!session) { localLogout(); return; }
    const active = session;
    const response = await studioFetch('/auth/logout', {
      method:'POST', headers:{Authorization:'Bearer ' + active.token}
    });
    if (response.status === 401) {
      lock('会话已到期，请重新验证后再退出。');
      throw new Error('重新验证后可以撤销教师授权。');
    }
    if (!response.ok || (await response.json()).loggedOut !== true) {
      throw new Error('退出请求未完成。请检查网络，再点击退出。');
    }
    localLogout();
    if (channel) channel.postMessage('logout');
    else {
      try {
        localStorage.setItem(CHANNEL, String(Date.now()));
        localStorage.removeItem(CHANNEL);
      } catch { /* Other tabs will lock on their next API request. */ }
    }
  }
  window.jinanTeacherTransport = Object.freeze({request, attachVideo, reauthorize, logout});

  new MutationObserver(() => {
    for (const binding of media) if (!binding.player.isConnected) binding.dispose();
  }).observe(workspace, {childList:true, subtree:true});

  $('access-login').addEventListener('click', initialLogin);
  $('access-renew').addEventListener('click', () => reauthorize().catch(err => panel(err.message, 'renew')));
  async function loadView() {
    try {
      panel('正在载入教师工作台……', null);
      await mount();
    } catch {
      if (!session) return;
      panel('已完成验证，但教师工作台暂时无法载入。请检查网络后重新载入。', 'retry');
    }
  }
  $('access-retry').addEventListener('click', loadView);
  window.addEventListener('pagehide', () => {
    erasePrivate();
    panel('本页已锁定。请重新验证身份。', 'login');
  });
  window.addEventListener('pageshow', event => { if (event.persisted) location.reload(); });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && session && Date.now() >= session.until) lock('会话已到期，请重新验证。');
  });

  async function start() {
    const args = new URLSearchParams(location.hash.slice(1));
    const callback = args.has('code') || args.has('state') || args.has('error');
    const canonical = location.origin === PAGES && location.pathname === PATH;
    if (callback) history.replaceState(null, '', location.pathname);
    if (!canonical) {
      panel('教师登录仅在正式在线地址开放。请从下面的链接进入。', 'canonical');
      return;
    }
    if (!callback) {
      forgetTx();
      return;
    }
    const tx = readTx();
    forgetTx();
    const state = args.get('state'), code = args.get('code');
    if (args.getAll('state').length !== 1 || args.getAll('code').length !== 1 || !SECRET.test(code || '') || args.has('error')) {
      panel('回跳信息不完整，请重新开始验证。', 'login');
      return;
    }
    if (current(tx, state, 'relay') && window.opener && !window.opener.closed) {
      panel('正在把验证结果交回原工作台。若窗口没有关闭，请切回原标签页。', null);
      window.addEventListener('message', event => {
        if (event.origin === PAGES && event.source === window.opener && event.data?.type === 'jinan-auth-received' && event.data.state === state) window.close();
      });
      window.opener.postMessage({type:'jinan-auth-return',state,code}, PAGES);
      return;
    }
    if (!current(tx, state, 'direct')) {
      panel('验证已超时，或回跳不属于当前标签页。请重新登录。', 'login');
      return;
    }
    panel('正在完成身份验证……', null);
    try { await exchange(tx, code); }
    catch { panel('无法完成这次验证。请检查网络并重新登录。', 'login'); return; }
    await loadView();
  }
  start();
})();
