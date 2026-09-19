/* IELTS Focus cloud material library UI */
(function (global) {
  'use strict';

  let files = [];
  let filtered = [];
  let activeType = 'all';
  let loaded = false;
  let loading = false;

  const $ = id => document.getElementById(id);

  function formatSize(bytes) {
    const n = Number(bytes || 0);
    if (n >= 1024 ** 3) return (n / 1024 ** 3).toFixed(2) + ' GB';
    if (n >= 1024 ** 2) return (n / 1024 ** 2).toFixed(1) + ' MB';
    if (n >= 1024) return (n / 1024).toFixed(1) + ' KB';
    return n + ' B';
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, c => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
    }[c]));
  }

  function humanSection(section) {
    return String(section || '其他')
      .replace(/^0\d_/, '')
      .replace(/^\d+_/, '')
      .replace(/_/g, ' ');
  }

  function applyFilters() {
    const q = String($('cloudMaterialSearch')?.value || '').trim().toLowerCase();
    filtered = files.filter(item => {
      const type = global.IELTSMaterialLibrary.typeOf(item);
      if (activeType !== 'all' && type !== activeType) return false;
      if (!q) return true;
      return [item.name, item.path, item.section]
        .some(v => String(v || '').toLowerCase().includes(q));
    });
    renderList();
  }

  function typeLabel(type) {
    return ({audio:'音频',pdf:'PDF',video:'视频',document:'文档',other:'其他'})[type] || '其他';
  }

  function openMaterial(index) {
    const item = filtered[index];
    if (!item) return;
    const url = global.IELTSMaterialLibrary.materialUrl(item);
    if (!url) return;

    const type = global.IELTSMaterialLibrary.typeOf(item);
    if (type === 'audio') {
      const panel = $('cloudPlayerPanel');
      const title = $('cloudPlayerTitle');
      const audio = $('cloudAudioPlayer');
      title.textContent = item.name;
      audio.pause();
      if (typeof global.stopOtherAudio === 'function') global.stopOtherAudio(audio);
      audio.src = url;
      panel.classList.remove('hidden');
      audio.play().catch(() => {});
      panel.scrollIntoView({behavior:'smooth', block:'nearest'});
      return;
    }
    window.open(url, '_blank', 'noopener');
  }

  function renderList() {
    const box = $('cloudMaterialList');
    if (!box) return;

    const count = $('cloudMaterialCount');
    if (count) count.textContent = filtered.length + ' 个文件';

    if (!filtered.length) {
      box.innerHTML = '<div class="cloud-empty">没有匹配资料。</div>';
      return;
    }

    box.innerHTML = filtered.map((item, index) => {
      const type = global.IELTSMaterialLibrary.typeOf(item);
      return '<button class="cloud-material-item" onclick="IELTSCloudMaterials.openMaterial(' + index + ')">' +
        '<div class="cloud-material-main">' +
          '<div class="cloud-material-name">' + escapeHtml(item.name) + '</div>' +
          '<div class="cloud-material-path">' + escapeHtml(humanSection(item.section)) +
          (item.path ? ' · ' + escapeHtml(item.path) : '') + '</div>' +
        '</div>' +
        '<div class="cloud-material-side">' +
          '<span class="badge">' + typeLabel(type) + '</span>' +
          '<span class="cloud-material-size">' + formatSize(item.size) + '</span>' +
        '</div>' +
      '</button>';
    }).join('');
  }

  function renderSummary() {
    const summary = $('cloudMaterialSummary');
    if (!summary) return;

    const totals = {audio:0,pdf:0,video:0,document:0,other:0};
    let bytes = 0;
    files.forEach(item => {
      const type = global.IELTSMaterialLibrary.typeOf(item);
      totals[type] = (totals[type] || 0) + 1;
      bytes += Number(item.size || 0);
    });

    summary.innerHTML =
      '<b>' + files.length + ' 个云端资料</b>' +
      '<span>约 ' + formatSize(bytes) + '</span>' +
      '<span>音频 ' + totals.audio + '</span>' +
      '<span>PDF ' + totals.pdf + '</span>';
  }

  async function load() {
    if (loaded || loading) return;
    loading = true;
    const status = $('cloudMaterialStatus');
    if (status) status.textContent = '正在读取云端资料清单…';

    try {
      files = await global.IELTSMaterialLibrary.loadReleaseManifest();
      filtered = files.slice();
      loaded = true;
      if (status) status.textContent = '已连接 · 点击资料时才加载对应文件';
      renderSummary();
      applyFilters();
    } catch (error) {
      console.error('[IELTS Focus] cloud material load failed', error);
      if (status) status.textContent = '云端资料暂时加载失败，请稍后重试';
      const box = $('cloudMaterialList');
      if (box) box.innerHTML =
        '<div class="cloud-empty">无法读取资料清单。<button class="btn small outline" onclick="IELTSCloudMaterials.retry()">重试</button></div>';
    } finally {
      loading = false;
    }
  }

  function setType(type, button) {
    activeType = type || 'all';
    document.querySelectorAll('[data-cloud-type]').forEach(el =>
      el.classList.toggle('active', el === button)
    );
    applyFilters();
  }

  function retry() {
    loaded = false;
    load();
  }

  global.IELTSCloudMaterials = Object.freeze({
    load,
    retry,
    applyFilters,
    setType,
    openMaterial,
    get files() { return files.slice(); }
  });
})(window);
