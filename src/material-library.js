/* IELTS Focus cloud/local material library adapter */
(function (global) {
  'use strict';

  const DEFAULT_RELEASE = {
    owner: '2028453369-max',
    repo: 'ielts-focus',
    tag: 'materials-v1'
  };

  function releaseAssetUrl(asset, cfg = DEFAULT_RELEASE) {
    return 'https://github.com/' + encodeURIComponent(cfg.owner) + '/' +
      encodeURIComponent(cfg.repo) + '/releases/download/' +
      encodeURIComponent(cfg.tag) + '/' + encodeURIComponent(asset);
  }

  function normalizeManifest(raw) {
    const files = Array.isArray(raw) ? raw : (raw && Array.isArray(raw.files) ? raw.files : []);
    return files.map((item, index) => ({
      id: item.id || item.asset || item.relative_path || item.path || ('material-' + index),
      name: item.name || String(item.path || item.relative_path || item.asset || ''),
      path: item.path || item.relative_path || '',
      asset: item.asset || null,
      size: Number(item.size || item.size_bytes || 0),
      mime: item.mime || '',
      section: item.section || ((item.path || item.relative_path || '').split('/')[0] || '其他')
    }));
  }

  async function loadReleaseManifest(cfg = DEFAULT_RELEASE) {
    const candidates = [
      'materials-manifest.json',
      releaseAssetUrl('materials-manifest.json', cfg)
    ];
    let lastError = null;
    for (const url of candidates) {
      try {
        const response = await fetch(url, { cache:'no-store' });
        if (!response.ok) throw new Error('HTTP ' + response.status);
        const raw = await response.json();
        return normalizeManifest(raw);
      } catch (error) {
        lastError = error;
      }
    }
    throw new Error('资料清单加载失败：' + (lastError ? lastError.message : 'unknown error'));
  }

  function materialUrl(item, cfg = DEFAULT_RELEASE) {
    if (!item) return '';
    if (item.url) return item.url;
    if (item.asset) return releaseAssetUrl(item.asset, cfg);
    return '';
  }

  function typeOf(item) {
    const value = (item.mime || item.name || item.path || '').toLowerCase();
    if (value.includes('audio') || /\.(mp3|m4a|wav|aac|flac)$/.test(value)) return 'audio';
    if (value.includes('pdf') || /\.pdf$/.test(value)) return 'pdf';
    if (value.includes('video') || /\.(mp4|webm|mov)$/.test(value)) return 'video';
    if (/\.(docx?|xlsx?|pptx?)$/.test(value)) return 'document';
    return 'other';
  }

  function groupBySection(files) {
    return files.reduce((acc, item) => {
      const key = item.section || '其他';
      (acc[key] ||= []).push(item);
      return acc;
    }, {});
  }

  function search(files, query) {
    const q = String(query || '').trim().toLowerCase();
    if (!q) return files.slice();
    return files.filter(item =>
      [item.name, item.path, item.section].some(v => String(v || '').toLowerCase().includes(q))
    );
  }

  global.IELTSMaterialLibrary = Object.freeze({
    DEFAULT_RELEASE, releaseAssetUrl, normalizeManifest,
    loadReleaseManifest, materialUrl, typeOf, groupBySection, search
  });
})(window);
