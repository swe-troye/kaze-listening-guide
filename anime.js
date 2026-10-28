(() => {
  'use strict';
  const songs = window.KAZE_SONGS;
  const {escapeHTML: e, filterSongs} = window.KazeCore;
  const $ = id => document.getElementById(id);
  const scenes = [
    ['sky','mint','聴','心裡的聲音','把耳朵，借給心裡的聲音。'],
    ['sky','blue','放','鬆開的瞬間','放開一點，讓風進來。'],
    ['stars','rose','愛','不願告別的你','會動搖，也會再次選擇。'],
    ['festival','yellow','祭','一起慶祝','今天，也值得一起慶祝。'],
    ['city','mint','光','同行的閃光','連過去，也能重新閃亮。'],
    ['garden','mint','庭','照顧與放手','在變化裡，繼續照顧。'],
    ['sea','blue','帰','回去之前','把包袱，一件件留下。'],
    ['stars','yellow','你','認出自己的光','你心裡，已經有光。'],
    ['sky','mint','風','自在的呼吸','安靜下來，感受愛。'],
    ['stars','lilac','安','可以安心哭泣','眼淚，也能被好好接住。'],
    ['garden','lilac','花','內在的花','你自己的花，就在這裡。'],
    ['garden','rose','柔','被溫柔照見','讓凍住的心，慢慢回暖。'],
    ['stars','yellow','愛','從你走向我','你是愛，我也是。'],
    ['sea','blue','満','放開之後的充盈','手放開，心慢慢變滿。'],
    ['sky','rose','別','感謝，然後前行','帶著感謝，迎向日出。'],
    ['city','blue','青','青春的熱與痛','閃光是真的，也會改變。'],
    ['city','mint','待','這次一起走','你等過我，這次一起走。'],
    ['sky','white','白','新的風','仍在乎，也可以向前走。']
  ];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let current = 0, view = 'summary', animations = [], toastTimer;
  function hashIndex() {
    const id = location.hash.startsWith('#song-') ? location.hash.slice(6) : '';
    return songs.findIndex(s => s.id === id);
  }
  try {
    const saved = JSON.parse(localStorage.getItem('kaze-anime-v1') || '{}');
    const index = songs.findIndex(s => s.id === saved.id);
    if (index >= 0) current = index;
  } catch { /* Reading remains available when storage is disabled. */ }
  const initialHash = hashIndex();
  if (initialHash >= 0) current = initialHash;
  function toast(message) {
    clearTimeout(toastTimer); $('anime-toast').textContent = message; $('anime-toast').hidden = false;
    toastTimer = setTimeout(() => { $('anime-toast').hidden = true; }, 4500);
  }
  function stopAnimations() { animations.forEach(animation => animation.cancel()); animations = []; }
  function animate(direction, tabOnly = false) {
    stopAnimations();
    if (reduced.matches || !('animate' in Element.prototype)) return;
    const distance = direction < 0 ? -1 : 1;
    const timing = {duration: 420, easing: 'cubic-bezier(.22, 1, .36, 1)'};
    if (tabOnly) {
      animations.push($('content-panel').animate([{opacity: .55, transform:'translateY(8px)'}, {opacity:1, transform:'translateY(0)'}], {...timing,duration:200}));
      return;
    }
    animations.push($('guide-character').animate([{transform:`translateX(${distance * 28}px)`},{transform:'translateX(0)'}], {...timing,duration:650}));
    animations.push($('slide-copy').animate([{transform:`translateX(${distance * 40}px)`,opacity:.65},{transform:'translateX(0)',opacity:1}], timing));
    animations.push($('page-turn').animate([{transform:`translateX(${distance * -110}%)`,opacity:.5},{transform:`translateX(${distance * 110}%)`,opacity:0}], {...timing,duration:480}));
    animations.push(document.querySelector('.scene-sun').animate([{transform:'scale(.9)'},{transform:'scale(1)'}], {...timing,duration:700}));
  }
  reduced.addEventListener('change', stopAnimations);
  function renderView() {
    const song = songs[current];
    $('slide-text').textContent = song[view];
    $('content-label').textContent = view === 'interpretation' ? (song.authorContext ? '編輯延伸 · 本人解說另列於完整筆記' : '編輯延伸 · 不是作者正式解說') : view === 'listen' ? '聆聽提示 · 帶著一點理解聽歌' : '原創摘要 · 完整原文與中譯已核對';
    document.querySelectorAll('[data-view]').forEach(button => {
      const selected = button.dataset.view === view;
      button.setAttribute('aria-selected', String(selected));
      button.tabIndex = selected ? 0 : -1;
    });
    $('content-panel').setAttribute('aria-labelledby', `tab-${view}`);
  }
  function render(direction = 0, save = false) {
    const song = songs[current], [scene,palette,word,chapter,caption] = scenes[current];
    document.body.dataset.scene = scene;
    document.body.dataset.palette = palette;
    $('scene-word').textContent = word;
    $('scene-caption').textContent = caption;
    $('chapter-number').textContent = String(current + 1).padStart(2,'0');
    $('chapter-name').textContent = chapter;
    $('song-duration').textContent = song.duration;
    $('slide-title').textContent = song.name;
    $('slide-meta').textContent = `${song.reading} / ${song.chinese}`;
    $('slide-line').textContent = song.line;
    $('slide-copy').scrollTop = 0;
    $('journey-count').textContent = String(current + 1).padStart(2,'0');
    $('previous').disabled = current === 0;
    $('next-label').textContent = current === songs.length - 1 ? '再走一遍' : '下一首';
    $('next').setAttribute('aria-label', current === songs.length - 1 ? '再走一遍，回到第一首' : `下一首：${songs[current + 1].name}`);
    $('previous').setAttribute('aria-label', current > 0 ? `上一首：${songs[current - 1].name}` : '已在第一首');
    $('journey-track').innerHTML = songs.map((_,i) => `<span class="journey-segment${i === current ? ' current' : i < current ? ' passed' : ''}"></span>`).join('');
    document.querySelectorAll('[data-chapter]').forEach(button => {
      if (Number(button.dataset.chapter) === current) button.setAttribute('aria-current','true'); else button.removeAttribute('aria-current');
    });
    document.querySelector('.header-link').href = `index.html#song-${song.id}`;
    document.title = `${song.name} · 動漫導聆 · 風，在歌裡`;
    renderView();
    if (save) {
      try { localStorage.setItem('kaze-anime-v1', JSON.stringify({id:song.id})); } catch { /* No storage is necessary for navigation. */ }
      try { history.replaceState(null,'',`#song-${song.id}`); } catch { /* Local-file browsers may disallow history updates. */ }
      $('slide-status').textContent = `第 ${current + 1} 首，共 ${songs.length} 首：${song.name}。${chapter}。`;
    }
    if (direction) animate(direction);
  }
  function goTo(index) {
    if (!Number.isInteger(index) || index < 0 || index >= songs.length || index === current) return;
    const direction = index > current ? 1 : -1;
    current = index; render(direction,true);
  }
  function next() { goTo(current === songs.length - 1 ? 0 : current + 1); }
  $('next').addEventListener('click',next);
  $('previous').addEventListener('click',() => goTo(current - 1));
  const tabs = [...document.querySelectorAll('[data-view]')];
  tabs.forEach(button => {
    button.addEventListener('click',() => { if (view === button.dataset.view) return; view = button.dataset.view; renderView(); animate(1,true); });
    button.addEventListener('keydown',event => {
      const index = tabs.indexOf(button);
      let target;
      if (event.key === 'ArrowRight') target = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') target = (index + tabs.length - 1) % tabs.length;
      if (event.key === 'Home') target = 0;
      if (event.key === 'End') target = tabs.length - 1;
      if (target === undefined) return;
      event.preventDefault(); event.stopPropagation(); tabs[target].click(); tabs[target].focus();
    });
  });
  $('chapter-list').innerHTML = songs.map((s,i) => `<button type="button" class="chapter-choice" data-chapter="${i}"><span>${String(i + 1).padStart(2,'0')}</span><span>${e(s.name)}</span></button>`).join('');
  function filterChapters() {
    const visible = new Set(filterSongs(songs,{query:$('chapter-search').value}).map(s => s.id));
    document.querySelectorAll('[data-chapter]').forEach(button => { button.hidden = !visible.has(songs[Number(button.dataset.chapter)].id); });
    $('chapter-empty').hidden = visible.size > 0;
  }
  $('chapter-search').addEventListener('input', filterChapters);
  $('chapter-list').addEventListener('click',event => {
    const button = event.target.closest('[data-chapter]');
    if (!button) return;
    goTo(Number(button.dataset.chapter)); $('chapter-dialog').close();
  });
  function openDialog(id) {
    const dialog = $(id); dialog.showModal();
    if (!reduced.matches && 'animate' in dialog) animations.push(dialog.animate([{transform:'translateY(12px)',opacity:.7},{transform:'translateY(0)',opacity:1}], {duration:220,easing:'cubic-bezier(.22,1,.36,1)'}));
  }
  $('chapter-open').addEventListener('click',() => { $('chapter-search').value = ''; filterChapters(); openDialog('chapter-dialog'); });
  $('chapter-close').addEventListener('click',() => $('chapter-dialog').close());
  $('notes-open').addEventListener('click',() => {
    const song = songs[current];
    $('notes-title').textContent = song.name;
    $('notes-content').innerHTML = `<p class="notes-meta">${e(song.reading)} / ${e(song.chinese)} · ${e(song.duration)}</p>
      <h3>歌詞大意（原創摘要）</h3>${song.meaning.map(p=>`<p>${e(p)}</p>`).join('')}
      ${song.authorContext ? `<h3>本人解說</h3><p>${e(song.authorContext)}</p>` : ''}
      <h3>一種聽法 · 編輯延伸</h3><p>${e(song.interpretation)}</p>
      <h3>聆聽重點</h3><p>${e(song.listen)}</p>
      <h3>留給自己的一個問題</h3><p>${e(song.prompt)}</p>
      <h3>原文與中文翻譯來源</h3><p class="notes-meta">${e(song.research.checkedAt)} 核對，原文與中文翻譯全文已讀。本站不轉貼完整歌詞或逐句翻譯。</p><ul>${song.sources.map(source=>`<li><a href="${e(source.url)}" target="_blank" rel="noopener noreferrer">${e(source.name)} ↗<span class="sr-only">（在新分頁開啟）</span></a><p>${e(source.scope)}${source.credit ? `；${e(source.credit)}` : ''}</p></li>`).join('')}</ul><p class="notes-meta">${e(song.research.note)}</p>
      <a class="text-guide-link" href="index.html#song-${song.id}">在文字版繼續讀 ${e(song.name)} ↗</a>`;
    openDialog('notes-dialog');
  });
  $('notes-close').addEventListener('click',() => $('notes-dialog').close());
  for (const id of ['chapter-dialog','notes-dialog']) {
    $(id).addEventListener('click',event => {
      if (event.target !== $(id)) return;
      const box = $(id).getBoundingClientRect();
      if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) $(id).close();
    });
  }
  function dialogOpen() { return $('chapter-dialog').open || $('notes-dialog').open; }
  document.addEventListener('keydown',event => {
    if (dialogOpen() || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.target.closest('input, select, textarea, [role="tablist"], [contenteditable="true"]')) return;
    if (['ArrowRight','PageDown'].includes(event.key)) { event.preventDefault(); next(); }
    else if (['ArrowLeft','PageUp'].includes(event.key)) { event.preventDefault(); goTo(current - 1); }
    else if (event.key === 'Home') { event.preventDefault(); goTo(0); }
    else if (event.key === 'End') { event.preventDefault(); goTo(songs.length - 1); }
    else if (event.code === 'Space' && !event.target.closest('button,a')) { event.preventDefault(); next(); }
  });
  let touchStart;
  $('anime-stage').addEventListener('touchstart',event => {
    if (event.touches.length !== 1 || event.target.closest('a,button,input,[role="tablist"]')) { touchStart = null; return; }
    touchStart = {x:event.touches[0].clientX,y:event.touches[0].clientY};
  },{passive:true});
  $('anime-stage').addEventListener('touchend',event => {
    if (!touchStart || !event.changedTouches.length) return;
    const dx = event.changedTouches[0].clientX - touchStart.x, dy = event.changedTouches[0].clientY - touchStart.y;
    touchStart = null;
    if (Math.abs(dx) < 65 || Math.abs(dx) < Math.abs(dy) * 1.6) return;
    if (dx < 0) next(); else goTo(current - 1);
  },{passive:true});
  $('anime-stage').addEventListener('touchcancel',() => { touchStart = null; },{passive:true});
  if (!document.fullscreenEnabled) $('fullscreen').hidden = true;
  $('fullscreen').addEventListener('click',async () => {
    try {
      if (document.fullscreenElement) { await document.exitFullscreen(); return; }
      await document.documentElement.requestFullscreen();
      if (screen.orientation?.lock) {
        try { await screen.orientation.lock('landscape'); } catch { /* Manual landscape remains available. */ }
      }
    } catch { toast('瀏覽器未開放全螢幕；橫拿手機仍可使用完整構圖。'); }
  });
  document.addEventListener('fullscreenchange',() => $('fullscreen').setAttribute('aria-label', document.fullscreenElement ? '離開全螢幕' : '進入全螢幕'));
  window.addEventListener('hashchange',() => { const index = hashIndex(); if (index >= 0) goTo(index); });
  render();
})();
