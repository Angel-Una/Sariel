/* ===== Round 6 features: music home, companion home, histories, invite/end cards, contact skip ===== */
(function () {
  'use strict';

  function $(id) { return document.getElementById(id); }
  function avHTML(avatar, size) {
    size = size || 64;
    var s = String(avatar == null ? '' : avatar).trim();
    var inner;
    if (s && /^(data:|https?:|blob:|\/)/.test(s)) {
      inner = '<img src="' + s + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block;"/>';
    } else {
      inner = '<span style="font-size:' + Math.round(size * 0.45) + 'px;">' + (s || '🙂') + '</span>';
    }
    return '<div style="width:' + size + 'px;height:' + size + 'px;border-radius:50%;background:#f0f0f0;overflow:hidden;display:flex;align-items:center;justify-content:center;flex-shrink:0;">' + inner + '</div>';
  }

  function getMyAvatar() {
    try { if (typeof window.getMyAvatar === 'function') { var a = window.getMyAvatar(); if (a) return a; } } catch (e) {}
    try { return localStorage.getItem('akini_my_avatar') || ''; } catch (e) { return ''; }
  }
  function getDefaultContact() {
    try { return window.__akiniDefaultContact && window.__akiniDefaultContact(); } catch (e) { return null; }
  }
  function getMyName() {
    try { return localStorage.getItem('akini_my_name') || '我'; } catch (e) { return '我'; }
  }

  /* ============ MUSIC HOME PAGE ============ */
  function showMusicHome() {
    var ov = $('musicHomeOverlay');
    if (!ov) return;
    var myAv = getMyAvatar();
    var ta = getDefaultContact();
    var taAv = ta ? (ta.avatar || '') : '';
    var taName = ta ? (ta.name || 'TA') : 'TA';
    var myEl = $('musicHomeMyAvatar');
    var taEl = $('musicHomeTaAvatar');
    if (myEl) myEl.innerHTML = avHTML(myAv, 72);
    if (taEl) taEl.innerHTML = avHTML(taAv, 72);
    var nameEl = $('musicHomeTaName');
    if (nameEl) nameEl.textContent = taName;
    ov.style.display = 'flex';
  }
  function hideMusicHome() { var ov = $('musicHomeOverlay'); if (ov) ov.style.display = 'none'; }

  function startListeningFromHome() {
    hideMusicHome();
    try {
      var app = $('app-music');
      if (app) { app.style.display = 'flex'; app.classList.add('show'); }
    } catch (e) {}
    // 开始会话追踪
    startMusicSessionTracking();
    // 如果有歌单则自动开始播放
    try {
      if (typeof window.musicControlToggle === 'function') {
        window.musicControlToggle();
      } else {
        var pb = $('musicPlayBtn');
        if (pb) pb.click();
      }
    } catch (e) {}
  }

  /* ============ MUSIC HISTORY (一起听记录) ============ */
  function getMusicHistory() {
    try { return JSON.parse(localStorage.getItem('akini_music_history') || '[]'); } catch (e) { return []; }
  }
  function saveMusicHistory(arr) {
    try { localStorage.setItem('akini_music_history', JSON.stringify(arr)); } catch (e) {}
  }
  function addMusicHistory(entry) {
    var arr = getMusicHistory();
    arr.unshift(entry);
    if (arr.length > 100) arr = arr.slice(0, 100);
    saveMusicHistory(arr);
  }
  function fmtDate(ts) {
    try {
      var d = new Date(ts);
      return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0') +
        ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    } catch (e) { return ''; }
  }
  function fmtDuration(sec) {
    sec = Math.floor(sec || 0);
    var h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    if (h > 0) return h + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
    return m + ':' + String(s).padStart(2, '0');
  }

  function renderMusicHistory() {
    var list = $('musicHistoryList');
    if (!list) return;
    var arr = getMusicHistory();
    if (!arr.length) {
      list.innerHTML = '<div style="text-align:center;color:#999;padding:60px 20px;font-size:14px;">暂无一起听记录</div>';
      return;
    }
    list.innerHTML = arr.map(function (it) {
      return '<div style="display:flex;align-items:center;gap:12px;padding:14px 4px;border-bottom:1px solid #f0f0f0;">' +
        avHTML(it.taAvatar || '', 48) +
        '<div style="flex:1;min-width:0;">' +
        '<div style="font-size:14px;font-weight:600;color:#1a1a1a;">' + String(it.taName || 'TA').replace(/</g, '&lt;') + '</div>' +
        '<div style="font-size:11px;color:#999;margin-top:3px;">' + fmtDate(it.startTs) + '</div>' +
        '</div>' +
        '<div style="text-align:right;flex-shrink:0;">' +
        '<div style="font-size:13px;font-weight:600;color:#1a1a1a;">' + fmtDuration(it.duration) + '</div>' +
        '<div style="font-size:11px;color:#999;margin-top:3px;">' + (it.songCount || 0) + ' 首歌</div>' +
        '</div>' +
        '</div>';
    }).join('');
  }
  function openMusicHistory() {
    renderMusicHistory();
    var ov = $('musicHistoryOverlay');
    if (ov) ov.style.display = 'flex';
  }
  function closeMusicHistory() { var ov = $('musicHistoryOverlay'); if (ov) ov.style.display = 'none'; }

  /* ============ CONTACT AUTO-SKIP SONG ============ */
  var _contactSkipTimer = null;
  function scheduleContactSkip() {
    if (_contactSkipTimer) { clearTimeout(_contactSkipTimer); _contactSkipTimer = null; }
    // 随机 25~90 秒后切歌
    var delay = 25000 + Math.random() * 65000;
    _contactSkipTimer = setTimeout(function () {
      _contactSkipTimer = null;
      try {
        // 检查是否在听
        var active = false;
        try { active = '1' === localStorage.getItem('akini_music_listening_active'); } catch (e) {}
        var app = $('app-music');
        if (!active || !app || app.style.display === 'none') return;
        // 随机切到另一首
        if (typeof window.musicControlNext === 'function') {
          window.musicControlNext();
        } else {
          var nb = $('musicNextBtn');
          if (nb) nb.click();
        }
      } catch (e) {}
      // 继续调度下一次
      scheduleContactSkip();
    }, delay);
  }
  function stopContactSkip() { if (_contactSkipTimer) { clearTimeout(_contactSkipTimer); _contactSkipTimer = null; } }

  /* ============ MUSIC INVITE CARD (in WeChat chat) ============ */
  function sendMusicInviteCard() {
    try {
      if (!window.akiniContacts) return;
      var cid = window.akiniContacts.getActiveChatId && window.akiniContacts.getActiveChatId();
      if (!cid) return;
      var ta = getDefaultContact();
      var taName = ta ? (ta.name || 'TA') : 'TA';
      var taAv = ta ? (ta.avatar || '') : '';
      var html = '<div class="msg-row other" data-ts="' + __akiniNextTs() + '">' +
        '<div class="msg-content-line">' +
        '<div class="avatar-col"><div class="msg-avatar">' + avHTML(taAv, 36).replace(/width:36px;height:36px/, 'width:36px;height:36px') + '</div></div>' +
        '<div class="bubble-wrap"><div class="bubble music-invite-bubble" onclick="window.__akiniAcceptMusicInvite &amp;&amp; window.__akiniAcceptMusicInvite()" style="background:#fff;border:1px solid #e5e5e5;border-radius:14px;padding:12px 14px;min-width:200px;max-width:260px;cursor:pointer;color:#1a1a1a;box-shadow:0 2px 8px rgba(0,0,0,.06);">' +
        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">' + avHTML(taAv, 28) +
        '<div style="font-size:13px;font-weight:600;color:#1a1a1a;">' + taName.replace(/</g, '&lt;') + ' 邀请你一起听歌</div></div>' +
        '<div style="font-size:12px;color:#888;">点击开始一起听 🎵</div>' +
        '</div></div></div></div>';
      window.__akiniAppendMessageHTML(cid, html, { lastMsg: taName + ' 邀请你一起听歌', lastSenderName: taName });
      try { window.__akiniToast && window.__akiniToast(taName + ' 邀请你一起听歌'); } catch (e) {}
      var body = $('chatBody');
      if (body) body.scrollTop = body.scrollHeight;
    } catch (e) { console.warn('[r6] invite card error', e); }
  }

  window.__akiniAcceptMusicInvite = function () {
    try {
      if (window.navTo) window.navTo('music');
      else { var app = $('app-music'); if (app) { app.style.display = 'flex'; app.classList.add('show'); } }
      startMusicSessionTracking();
      setTimeout(function () {
        try {
          if (typeof window.musicControlToggle === 'function') window.musicControlToggle();
          else { var pb = $('musicPlayBtn'); if (pb) pb.click(); }
        } catch (e) {}
      }, 400);
    } catch (e) {}
  };

  /* ============ MUSIC END CARD (centered in WeChat chat) ============ */
  function sendMusicEndCard(myCount, taCount) {
    try {
      if (!window.akiniContacts) return;
      var cid = window.akiniContacts.getActiveChatId && window.akiniContacts.getActiveChatId();
      if (!cid) return;
      var total = (myCount || 0) + (taCount || 0);
      var html = '<div class="msg-row system music-end-row" style="display:flex;justify-content:center;margin:8px 0;">' +
        '<div class="music-end-bubble" onclick="window.__akiniOpenMusicEndPopup &amp;&amp; window.__akiniOpenMusicEndPopup(' + (myCount || 0) + ',' + (taCount || 0) + ')" style="background:#fff;border:1px solid #e5e5e5;border-radius:14px;padding:14px 20px;min-width:220px;max-width:280px;text-align:center;cursor:pointer;color:#1a1a1a;box-shadow:0 2px 10px rgba(0,0,0,.08);font-size:13px;line-height:1.6;">' +
        '<div style="font-weight:700;margin-bottom:4px;">一起听已结束</div>' +
        '<div style="color:#666;">本次一起听共发送 ' + total + ' 条消息<br>你发了 ' + (myCount || 0) + ' 条 · TA 发了 ' + (taCount || 0) + ' 条</div>' +
        '</div></div>';
      window.__akiniAppendMessageHTML(cid, html, { lastMsg: '一起听已结束', lastSenderName: '系统' });
      var body = $('chatBody');
      if (body) body.scrollTop = body.scrollHeight;
    } catch (e) { console.warn('[r6] end card error', e); }
  }

  window.__akiniOpenMusicEndPopup = function (myCount, taCount) {
    var ov = $('musicEndPopup');
    if (!ov) return;
    var total = (myCount || 0) + (taCount || 0);
    var myEl = $('musicEndPopupMyCount');
    var taEl = $('musicEndPopupTaCount');
    var totalEl = $('musicEndPopupTotal');
    if (myEl) myEl.textContent = myCount || 0;
    if (taEl) taEl.textContent = taCount || 0;
    if (totalEl) totalEl.textContent = total;
    ov.style.display = 'flex';
  };
  function closeMusicEndPopup() { var ov = $('musicEndPopup'); if (ov) ov.style.display = 'none'; }

  /* ============ MUSIC SESSION TRACKING ============ */
  var _musicSessionStart = 0;
  var _musicSessionSongCount = 0;
  var _musicSessionMyMsgs = 0;
  var _musicSessionTaMsgs = 0;

  function startMusicSessionTracking() {
    _musicSessionStart = Date.now();
    _musicSessionSongCount = 0;
    _musicSessionMyMsgs = 0;
    _musicSessionTaMsgs = 0;
    try { localStorage.setItem('akini_music_listening_active', '1'); } catch (e) {}
    scheduleContactSkip();
  }
  function endMusicSessionTracking() {
    stopContactSkip();
    var duration = Math.floor((Date.now() - _musicSessionStart) / 1000);
    if (duration > 5) {
      var ta = getDefaultContact();
      addMusicHistory({
        startTs: _musicSessionStart,
        duration: duration,
        songCount: _musicSessionSongCount,
        myMsgs: _musicSessionMyMsgs,
        taMsgs: _musicSessionTaMsgs,
        taName: ta ? (ta.name || 'TA') : 'TA',
        taAvatar: ta ? (ta.avatar || '') : ''
      });
      sendMusicEndCard(_musicSessionMyMsgs, _musicSessionTaMsgs);
    }
    _musicSessionStart = 0;
    try { localStorage.setItem('akini_music_listening_active', '0'); } catch (e) {}
  }

  // 暴露给外部 hook
  window.__r6StartMusicSession = startMusicSessionTracking;
  window.__r6EndMusicSession = endMusicSessionTracking;
  window.__r6MusicSongPlayed = function () { _musicSessionSongCount++; };
  window.__r6MusicMyMsg = function () { _musicSessionMyMsgs++; };
  window.__r6MusicTaMsg = function () { _musicSessionTaMsgs++; };

  /* ============ COMPANION HOME PAGE ============ */
  var COMPANION_PRESETS = ['睡觉', '吃饭', '散步'];
  function showCompanionHome() {
    var ov = $('companionHomeOverlay');
    if (!ov) return;
    var myAv = getMyAvatar();
    var myEl = $('companionHomeMyAvatar');
    if (myEl) myEl.innerHTML = avHTML(myAv, 90);
    // 渲染预设
    var presetsEl = $('companionHomePresets');
    if (presetsEl) {
      presetsEl.innerHTML = COMPANION_PRESETS.map(function (p) {
        return '<button type="button" data-preset="' + p + '" style="padding:10px 20px;border:1.5px solid #1a1a1a;border-radius:20px;background:#fff;color:#1a1a1a;font-size:14px;cursor:pointer;font-weight:500;">' + p + '</button>';
      }).join('');
    }
    ov.style.display = 'flex';
  }
  function hideCompanionHome() { var ov = $('companionHomeOverlay'); if (ov) ov.style.display = 'none'; }

  function startCompanionWithContent(content) {
    hideCompanionHome();
    try {
      localStorage.setItem('akini_companion_content', content || '');
    } catch (e) {}
    // 触发陪伴开始
    if (typeof window.__openCompanion === 'function') {
      // 如果有进行中的会话会直接进入，否则用默认联系人开始
      window.__openCompanion();
    } else {
      var app = $('app-companion');
      if (app) { app.style.display = 'flex'; app.classList.add('show'); }
    }
  }

  /* ============ COMPANION HISTORY ============ */
  function getCompanionHistory() {
    try { return JSON.parse(localStorage.getItem('akini_companion_history') || '[]'); } catch (e) { return []; }
  }
  function saveCompanionHistory(arr) {
    try { localStorage.setItem('akini_companion_history', JSON.stringify(arr)); } catch (e) {}
  }
  function addCompanionHistory(entry) {
    var arr = getCompanionHistory();
    arr.unshift(entry);
    if (arr.length > 100) arr = arr.slice(0, 100);
    saveCompanionHistory(arr);
  }
  function renderCompanionHistory() {
    var list = $('companionHistoryList');
    if (!list) return;
    var arr = getCompanionHistory();
    if (!arr.length) {
      list.innerHTML = '<div style="text-align:center;color:#999;padding:60px 20px;font-size:14px;">暂无陪伴历史</div>';
      return;
    }
    list.innerHTML = arr.map(function (it) {
      return '<div style="display:flex;align-items:center;gap:12px;padding:14px 4px;border-bottom:1px solid #f0f0f0;">' +
        '<div style="flex-shrink:0;text-align:center;">' +
        avHTML(it.taAvatar || '', 44) +
        '<div style="font-size:10px;color:#999;margin-top:4px;">' + fmtDate(it.startTs).split(' ')[0] + '</div>' +
        '</div>' +
        '<div style="flex:1;min-width:0;">' +
        '<div style="font-size:13px;font-weight:600;color:#1a1a1a;">' + String(it.content || '陪伴').replace(/</g, '&lt;') + '</div>' +
        '<div style="font-size:11px;color:#bbb;margin-top:3px;">' + (it.summary || '一起度过了美好时光') + '</div>' +
        '</div>' +
        '<div style="text-align:right;flex-shrink:0;">' +
        '<div style="font-size:13px;font-weight:600;color:#1a1a1a;">' + fmtDuration(it.duration) + '</div>' +
        '<div style="font-size:11px;color:#999;margin-top:3px;">' + fmtDate(it.startTs).split(' ')[1] + '</div>' +
        '</div>' +
        '</div>';
    }).join('');
  }
  function openCompanionHistory() {
    renderCompanionHistory();
    var ov = $('companionHistoryOverlay');
    if (ov) { ov.style.display = 'flex'; ov.style.alignItems = 'flex-end'; }
  }

  /* ============ BINDINGS ============ */
  function bind() {
    // 包装消息追加函数以统计一起听期间的消息数
    try {
      if (typeof window.__akiniAppendMessageHTML === 'function' && !window.__akiniAppendMessageHTML.__r6wrapped) {
        var origAppend = window.__akiniAppendMessageHTML;
        window.__akiniAppendMessageHTML = function () {
          try {
            var active = false;
            try { active = '1' === localStorage.getItem('akini_music_listening_active'); } catch (e) {}
            if (active) {
              var html = arguments[1] || '';
              if (/msg-row me\b/.test(html)) _musicSessionMyMsgs++;
              else if (/msg-row (other|ta)\b/.test(html)) _musicSessionTaMsgs++;
            }
          } catch (e) {}
          return origAppend.apply(this, arguments);
        };
        window.__akiniAppendMessageHTML.__r6wrapped = true;
      }
    } catch (e) {}

    // 包装音乐控制函数以统计歌曲数（可能需要等待 akini-core 初始化）
    function wrapMusicControls() {
      var ready = typeof window.musicControlNext === 'function';
      if (!ready) { setTimeout(wrapMusicControls, 200); return; }
      try {
        ['musicControlNext', 'musicControlPrev', 'musicControlToggle'].forEach(function (fn) {
          if (typeof window[fn] === 'function' && !window[fn].__r6wrapped) {
            var orig = window[fn];
            window[fn] = function () {
              var r = orig.apply(this, arguments);
              try {
                var active = false;
                try { active = '1' === localStorage.getItem('akini_music_listening_active'); } catch (e) {}
                if (active && (fn === 'musicControlNext' || fn === 'musicControlPrev')) _musicSessionSongCount++;
              } catch (e) {}
              return r;
            };
            window[fn].__r6wrapped = true;
          }
        });
      } catch (e) {}
    }
    wrapMusicControls();

    // Music home
    var startBtn = $('musicHomeStartBtn');
    if (startBtn) startBtn.addEventListener('click', startListeningFromHome);
    var histBtn = $('musicHomeHistoryBtn');
    if (histBtn) histBtn.addEventListener('click', openMusicHistory);
    var histClose = $('musicHistoryClose');
    if (histClose) histClose.addEventListener('click', closeMusicHistory);
    var histOverlay = $('musicHistoryOverlay');
    if (histOverlay) histOverlay.addEventListener('click', function (e) { if (e.target === histOverlay) closeMusicHistory(); });

    // Music end popup
    var endClose = $('musicEndPopupClose');
    if (endClose) endClose.addEventListener('click', closeMusicEndPopup);
    var endOverlay = $('musicEndPopup');
    if (endOverlay) endOverlay.addEventListener('click', function (e) { if (e.target === endOverlay) closeMusicEndPopup(); });

    // Companion home
    var presets = $('companionHomePresets');
    if (presets) {
      presets.addEventListener('click', function (e) {
        var b = e.target.closest ? e.target.closest('[data-preset]') : null;
        if (b) startCompanionWithContent(b.getAttribute('data-preset') || '');
      });
    }
    var customConfirm = $('companionHomeCustomConfirm');
    var customInput = $('companionHomeCustomInput');
    if (customConfirm) customConfirm.addEventListener('click', function () {
      var v = customInput ? customInput.value.trim() : '';
      if (!v) { try { window.__akiniToast && window.__akiniToast('请输入陪伴内容'); } catch (e) {} return; }
      startCompanionWithContent(v);
    });
    if (customInput) customInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { var v = customInput.value.trim(); if (v) startCompanionWithContent(v); }
    });
    var compHistBtn = $('companionHomeHistoryBtn');
    if (compHistBtn) compHistBtn.addEventListener('click', openCompanionHistory);
    var compHistClose = $('companionHistoryClose');
    if (compHistClose) compHistClose.addEventListener('click', function () { var ov = $('companionHistoryOverlay'); if (ov) ov.style.display = 'none'; });

    // 拦截音乐结束：监听 musicBackBtn
    var musicBack = $('musicBackBtn');
    if (musicBack && !musicBack.__r6bound) {
      musicBack.__r6bound = true;
      var orig = musicBack.onclick;
      musicBack.onclick = function () {
        try {
          var active = false;
          try { active = '1' === localStorage.getItem('akini_music_listening_active'); } catch (e) {}
          if (active) endMusicSessionTracking();
        } catch (e) {}
        if (orig) return orig.apply(this, arguments);
      };
    }

    // 监听播放事件以计数
    try {
      var audio = document.querySelector('#app-music audio') || (window.F);
      if (audio) {
        audio.addEventListener('play', function () { _musicSessionSongCount++; });
      }
    } catch (e) {}

    // 暴露邀请卡片入口
    window.__akiniSendMusicInviteCard = sendMusicInviteCard;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }

  // 暴露音乐首页入口给 navigation
  window.__akiniShowMusicHome = showMusicHome;
  window.__akiniShowCompanionHome = showCompanionHome;
})();
