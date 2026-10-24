/* ===== Round 6/7 features: music/companion home, histories, invite/end cards, contact skip, probabilities ===== */
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

  /* ============ PROBABILITIES (可在设置自定义) ============ */
  function getProb(key, def) {
    try {
      var v = parseFloat(localStorage.getItem(key));
      if (!isNaN(v) && v >= 0 && v <= 100) return v;
    } catch (e) {}
    return def;
  }
  function getInviteProb() { return getProb('akini_prob_invite', 10); }
  function getSkipProb() { return getProb('akini_prob_skip', 5); }

  /* ============ MUSIC HOME PAGE ============ */
  function showMusicHome() {
    var ov = $('musicHomeOverlay');
    if (!ov) return;
    var myAv = getMyAvatar();
    var ta = getDefaultContact();
    var taAv = ta ? (ta.avatar || '') : '';
    var myEl = $('musicHomeMyAvatar');
    var taEl = $('musicHomeTaAvatar');
    if (myEl) myEl.innerHTML = avHTML(myAv, 72);
    if (taEl) taEl.innerHTML = avHTML(taAv, 72);
    ov.style.display = 'flex';
  }
  function hideMusicHome() { var ov = $('musicHomeOverlay'); if (ov) ov.style.display = 'none'; }

  function goHomeFromMusic() {
    hideMusicHome();
    try { if (window.navTo) window.navTo('home'); } catch (e) {}
  }

  function startListeningFromHome() {
    hideMusicHome();
    try {
      var app = $('app-music');
      if (app) { app.style.display = 'flex'; app.classList.add('show'); }
    } catch (e) {}
    startMusicSessionTracking();
    try {
      if (typeof window.musicControlToggle === 'function') {
        window.musicControlToggle();
      } else {
        var pb = $('musicPlayBtn');
        if (pb) pb.click();
      }
    } catch (e) {}
  }

  /* ============ MUSIC HISTORY (一起听记录) - 图三样式黑白 ============ */
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
    var h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60);
    if (h > 0) return h + '小时' + (m ? m + '分钟' : '');
    return m + '分钟';
  }
  function dateKey(ts) {
    try {
      var d = new Date(ts);
      return (d.getMonth() + 1) + '月' + d.getDate() + '日';
    } catch (e) { return ''; }
  }

  function renderMusicHistory() {
    var body = $('musicHistoryBody');
    if (!body) return;
    var arr = getMusicHistory();
    if (!arr.length) {
      body.innerHTML = '<div style="text-align:center;color:#999;padding:60px 20px;font-size:14px;">暂无一起听记录</div>';
      return;
    }
    // 汇总
    var totalSec = 0, totalSongs = 0;
    arr.forEach(function (it) { totalSec += it.duration || 0; totalSongs += it.songCount || 0; });
    var ta = getDefaultContact();
    var taAv = ta ? (ta.avatar || '') : '';
    var myAv = getMyAvatar();

    var html = '';
    // 汇总卡片
    html += '<div style="background:#f5f5f5;border-radius:16px;padding:16px;margin-bottom:20px;display:flex;align-items:center;gap:14px;">' +
      '<div style="display:flex;align-items:center;">' +
      '<div style="z-index:2;">' + avHTML(myAv, 52) + '</div>' +
      '<div style="margin-left:-16px;z-index:1;">' + avHTML(taAv, 52) + '</div>' +
      '</div>' +
      '<div style="flex:1;min-width:0;">' +
      '<div style="font-size:15px;font-weight:700;color:#1a1a1a;margin-bottom:4px;">你和' + (ta ? (ta.name || 'TA') : 'TA') + '</div>' +
      '<div style="display:flex;gap:16px;font-size:12px;color:#666;">' +
      '<span>陪伴彼此 ' + fmtDuration(totalSec) + '</span>' +
      '<span>一起听过 ' + totalSongs + ' 首歌</span>' +
      '</div>' +
      '</div>' +
      '</div>';
    // 历史列表，按日期分组
    html += '<div style="font-size:14px;font-weight:700;color:#1a1a1a;margin-bottom:10px;">一起听历史</div>';
    var curDate = '';
    arr.forEach(function (it) {
      var dk = dateKey(it.startTs);
      if (dk !== curDate) {
        curDate = dk;
        html += '<div style="font-size:12px;color:#999;margin:14px 0 8px;font-weight:600;">' + dk + '</div>';
      }
      var time = fmtDate(it.startTs).split(' ')[1];
      html += '<div style="display:flex;align-items:center;gap:12px;padding:10px 0;">' +
        avHTML(it.taAvatar || '', 40) +
        '<div style="flex:1;min-width:0;">' +
        '<div style="font-size:14px;font-weight:600;color:#1a1a1a;">' + String(it.taName || 'TA').replace(/</g, '&lt;') + '</div>' +
        '<div style="font-size:12px;color:#999;margin-top:2px;">' + time + ' · 听了' + fmtDuration(it.duration) + ', ' + (it.songCount || 0) + '首歌</div>' +
        '</div>' +
        '</div>';
    });
    body.innerHTML = html;
  }
  function openMusicHistory() {
    renderMusicHistory();
    var ov = $('musicHistoryOverlay');
    if (ov) ov.style.display = 'flex';
  }
  function closeMusicHistory() { var ov = $('musicHistoryOverlay'); if (ov) ov.style.display = 'none'; }

  /* ============ CONTACT AUTO-SKIP SONG (概率) ============ */
  var _contactSkipTimer = null;
  function scheduleContactSkip() {
    if (_contactSkipTimer) { clearTimeout(_contactSkipTimer); _contactSkipTimer = null; }
    // 每隔 30~60 秒摇一次，按设置概率切歌
    var delay = 30000 + Math.random() * 30000;
    _contactSkipTimer = setTimeout(function () {
      _contactSkipTimer = null;
      try {
        var active = false;
        try { active = '1' === localStorage.getItem('akini_music_listening_active'); } catch (e) {}
        var app = $('app-music');
        if (active && app && app.style.display !== 'none') {
          var prob = getSkipProb();
          if (Math.random() * 100 < prob) {
            if (typeof window.musicControlNext === 'function') {
              window.musicControlNext();
            } else {
              var nb = $('musicNextBtn');
              if (nb) nb.click();
            }
          }
        }
      } catch (e) {}
      scheduleContactSkip();
    }, delay);
  }
  function stopContactSkip() { if (_contactSkipTimer) { clearTimeout(_contactSkipTimer); _contactSkipTimer = null; } }

  /* ============ MUSIC INVITE CARD (概率触发) ============ */
  var _lastInviteTs = 0;
  function maybeSendInvite() {
    try {
      var now = Date.now();
      if (now - _lastInviteTs < 60000) return; // 至少间隔 60 秒
      var prob = getInviteProb();
      if (Math.random() * 100 >= prob) return;
      _lastInviteTs = now;
      sendMusicInviteCard();
    } catch (e) {}
  }

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
        '<div class="avatar-col"><div class="msg-avatar">' + avHTML(taAv, 36) + '</div></div>' +
        '<div class="bubble-wrap"><div class="bubble music-invite-bubble" onclick="window.__akiniAcceptMusicInvite &amp;&amp; window.__akiniAcceptMusicInvite()" style="background:#fff;border:1px solid #e5e5e5;border-radius:16px;padding:12px 14px;min-width:210px;max-width:270px;cursor:pointer;color:#1a1a1a;box-shadow:0 2px 10px rgba(0,0,0,.06);">' +
        '<div style="font-size:14px;color:#1a1a1a;line-height:1.5;margin-bottom:10px;">我的耳机分你一半，和我一起听歌吧~</div>' +
        '<div style="display:flex;align-items:center;gap:10px;background:#f7f7f7;border-radius:12px;padding:8px 10px;">' +
        '<div style="flex-shrink:0;">' + avHTML(taAv, 36) + '</div>' +
        '<div style="font-size:14px;font-weight:600;color:#1a1a1a;">加入一起听</div>' +
        '</div>' +
        '</div></div></div></div>';
      window.__akiniAppendMessageHTML(cid, html, { lastMsg: '邀请你一起听歌', lastSenderName: taName });
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

  /* ============ MUSIC END CARD (图三样式，由我发出，黑白款式) ============ */
  function sendMusicEndCard(durationSec, songCount, myCount, taCount) {
    try {
      if (!window.akiniContacts) return;
      var cid = window.akiniContacts.getActiveChatId && window.akiniContacts.getActiveChatId();
      if (!cid) return;
      var myAv = getMyAvatar();
      var ta = getDefaultContact();
      var taAv = ta ? (ta.avatar || '') : '';
      var durText = fmtDuration(durationSec);
      var total = (myCount || 0) + (taCount || 0);
      var dataAttr = 'data-dur="' + (durationSec || 0) + '" data-songs="' + (songCount || 0) + '" data-my="' + (myCount || 0) + '" data-ta="' + (taCount || 0) + '"';
      var html = '<div class="msg-row me" data-ts="' + __akiniNextTs() + '">' +
        '<div class="msg-content-line">' +
        '<div class="bubble-wrap"><div class="bubble music-end-bubble" ' + dataAttr + ' onclick="window.__akiniOpenMusicEndPopup &amp;&amp; window.__akiniOpenMusicEndPopup(this)" style="background:#1a1a1a !important;border:1px solid #000 !important;border-radius:16px;padding:14px 16px;min-width:210px;max-width:270px;cursor:pointer;color:#fff !important;box-shadow:0 2px 10px rgba(0,0,0,.15);">' +
        '<div style="font-size:13px;color:#ccc;margin-bottom:6px;">我们一起听了</div>' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">' +
        '<div style="font-size:20px;font-weight:700;color:#fff;">' + durText + ' <span style="font-size:14px;color:#999;">›</span></div>' +
        '<div style="display:flex;align-items:center;">' +
        '<div style="z-index:2;">' + avHTML(myAv, 26) + '</div>' +
        '<div style="margin-left:-10px;z-index:1;">' + avHTML(taAv, 26) + '</div>' +
        '</div>' +
        '</div>' +
        '<div style="font-size:12px;color:#888;border-top:1px solid #333;padding-top:8px;">' + total + ' 条聊天记录</div>' +
        '</div></div></div></div>';
      window.__akiniAppendMessageHTML(cid, html, { lastMsg: '一起听已结束 · ' + durText, lastSenderName: getMyName() });
      var body = $('chatBody');
      if (body) body.scrollTop = body.scrollHeight;
    } catch (e) { console.warn('[r6] end card error', e); }
  }

  window.__akiniOpenMusicEndPopup = function (el) {
    var ov = $('musicEndPopup');
    if (!ov) return;
    var dur = 0, songs = 0, myCount = 0, taCount = 0;
    if (el && el.getAttribute) {
      dur = parseFloat(el.getAttribute('data-dur') || '0') || 0;
      songs = parseInt(el.getAttribute('data-songs') || '0', 10) || 0;
      myCount = parseInt(el.getAttribute('data-my') || '0', 10) || 0;
      taCount = parseInt(el.getAttribute('data-ta') || '0', 10) || 0;
    }
    var total = myCount + taCount;
    var myAv = getMyAvatar();
    var ta = getDefaultContact();
    var taAv = ta ? (ta.avatar || '') : '';

    // 累计数据
    var hist = getMusicHistory();
    var cumSec = 0, cumSongs = 0;
    hist.forEach(function (it) { cumSec += it.duration || 0; cumSongs += it.songCount || 0; });

    // 日期
    var now = new Date();
    var dateStr = now.getFullYear() + '.' + String(now.getMonth() + 1).padStart(2, '0') + '.' + String(now.getDate()).padStart(2, '0');

    var body = $('musicEndPopupBody');
    if (body) {
      body.innerHTML =
        '<div style="display:flex;justify-content:flex-end;margin-bottom:12px;"><span style="font-size:12px;color:#999;">' + dateStr + '</span></div>' +
        '<div style="display:flex;justify-content:center;margin-bottom:18px;">' +
        '<div style="display:flex;align-items:center;">' +
        '<div style="z-index:2;">' + avHTML(myAv, 56) + '</div>' +
        '<div style="margin-left:-18px;z-index:1;">' + avHTML(taAv, 56) + '</div>' +
        '</div></div>' +
        '<div style="background:#fff;border-radius:16px;padding:18px 16px;box-shadow:0 2px 12px rgba(0,0,0,.08);">' +
        '<div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:18px;color:#999;font-size:13px;">' +
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>' +
        '<span>我们相距 — 公里</span>' +
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>' +
        '</div>' +
        '<div style="display:flex;gap:12px;margin-bottom:16px;">' +
        '<div style="flex:1;text-align:center;">' +
        '<div style="font-size:12px;color:#999;margin-bottom:4px;">本次一起听了</div>' +
        '<div style="font-size:22px;font-weight:700;color:#1a1a1a;">' + songs + '<span style="font-size:13px;font-weight:400;color:#666;margin-left:2px;">首歌曲</span></div>' +
        '</div>' +
        '<div style="flex:1;text-align:center;">' +
        '<div style="font-size:12px;color:#999;margin-bottom:4px;">本次陪伴彼此</div>' +
        '<div style="font-size:22px;font-weight:700;color:#1a1a1a;line-height:1.2;">' + fmtDuration(dur) + '</div>' +
        '</div>' +
        '</div>' +
        '<div style="text-align:center;font-size:12px;color:#999;padding-top:12px;border-top:1px solid #f0f0f0;">累计 ' + cumSongs + ' 首歌曲、' + fmtDuration(cumSec) + '</div>' +
        '</div>' +
        '<div style="margin-top:14px;background:#f5f5f5;border-radius:14px;padding:16px;display:flex;align-items:center;justify-content:space-between;">' +
        '<div><div style="font-size:12px;color:#999;">互发消息</div><div style="font-size:24px;font-weight:700;color:#1a1a1a;margin-top:2px;">' + total + '<span style="font-size:13px;font-weight:400;color:#666;margin-left:2px;">条</span></div></div>' +
        '<div style="display:flex;gap:10px;font-size:11px;color:#666;">' +
        '<div style="text-align:center;"><div style="font-size:16px;font-weight:600;color:#1a1a1a;">' + myCount + '</div><div>我</div></div>' +
        '<div style="width:1px;background:#ddd;"></div>' +
        '<div style="text-align:center;"><div style="font-size:16px;font-weight:600;color:#1a1a1a;">' + taCount + '</div><div>TA</div></div>' +
        '</div>' +
        '</div>';
    }
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
    if (!_musicSessionStart) { try { localStorage.setItem('akini_music_listening_active', '0'); } catch (e) {} return; }
    var duration = Math.floor((Date.now() - _musicSessionStart) / 1000);
    if (duration >= 1) {
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
      sendMusicEndCard(duration, _musicSessionSongCount, _musicSessionMyMsgs, _musicSessionTaMsgs);
    }
    _musicSessionStart = 0;
    try { localStorage.setItem('akini_music_listening_active', '0'); } catch (e) {}
  }

  window.__r6StartMusicSession = startMusicSessionTracking;
  window.__r6EndMusicSession = endMusicSessionTracking;

  /* ============ COMPANION HOME PAGE ============ */
  var COMPANION_PRESETS = ['睡觉', '吃饭', '散步'];
  function showCompanionHome() {
    var ov = $('companionHomeOverlay');
    if (!ov) return;
    var myAv = getMyAvatar();
    var myEl = $('companionHomeMyAvatar');
    if (myEl) myEl.innerHTML = avHTML(myAv, 90);
    var presetsEl = $('companionHomePresets');
    if (presetsEl) {
      presetsEl.innerHTML = COMPANION_PRESETS.map(function (p) {
        return '<button type="button" data-preset="' + p + '" style="padding:10px 20px;border:1.5px solid #1a1a1a;border-radius:20px;background:#fff;color:#1a1a1a;font-size:14px;cursor:pointer;font-weight:500;">' + p + '</button>';
      }).join('');
    }
    var ci = $('companionHomeCustomInput');
    if (ci) ci.value = '';
    ov.style.display = 'flex';
  }
  function hideCompanionHome() { var ov = $('companionHomeOverlay'); if (ov) ov.style.display = 'none'; }

  function goHomeFromCompanion() {
    hideCompanionHome();
    try { if (window.navTo) window.navTo('home'); } catch (e) {}
  }

  function startCompanionWithContent(content) {
    hideCompanionHome();
    try { localStorage.setItem('akini_companion_content', content || ''); } catch (e) {}
    if (typeof window.__openCompanion === 'function') {
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
      var durSec = Math.floor((it.duration || 0) / 1000);
      var sub = it.summary || it.content || '陪伴';
      if (/^共\d+条消息$/.test(sub)) sub = it.content || '陪伴';
      return '<div style="display:flex;align-items:center;gap:12px;padding:14px 0;border-bottom:1px solid #f0f0f0;">' +
        '<div style="flex-shrink:0;text-align:center;">' +
        avHTML(it.avatar || it.taAvatar || '', 44) +
        '<div style="font-size:10px;color:#999;margin-top:4px;white-space:nowrap;">' + fmtDate(it.startTs).split(' ')[0] + '</div>' +
        '</div>' +
        '<div style="flex:1;min-width:0;">' +
        '<div style="font-size:14px;font-weight:600;color:#1a1a1a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + String(it.name || it.taName || 'TA').replace(/</g, '&lt;') +
        ' · ' + String(it.content || '陪伴').replace(/</g, '&lt;') + '</div>' +
        '<div style="font-size:11px;color:#999;margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + String(sub).replace(/</g, '&lt;') + '</div>' +
        '</div>' +
        '<div style="text-align:right;flex-shrink:0;">' +
        '<div style="font-size:13px;font-weight:600;color:#1a1a1a;">' + fmtDuration(durSec) + '</div>' +
        '</div>' +
        '</div>';
    }).join('');
  }
  function openCompanionHistory() {
    renderCompanionHistory();
    var ov = $('companionHistoryOverlay');
    if (ov) ov.style.display = 'flex';
  }
  function closeCompanionHistory() { var ov = $('companionHistoryOverlay'); if (ov) ov.style.display = 'none'; }

  /* ============ PROBABILITY SETTINGS (统一到设置页自定义概率模块) ============ */
  function openProbSettings() {
    try {
      // 关闭音乐相关界面，打开设置页概率模块
      var app = $('app-music');
      if (app) { app.style.display = 'none'; app.classList.remove('show'); }
      var menu = $('musicMenuPanel');
      if (menu) menu.style.display = 'none';
      var sa = $('settingsArea');
      if (sa) sa.style.display = 'flex';
      if (typeof window.__openProbArea === 'function') {
        window.__openProbArea();
      } else {
        var pa = $('akiniProbArea');
        if (pa) pa.style.display = 'flex';
      }
    } catch (e) {}
  }
  function closeProbSettings() { var ov = $('probSettingsOverlay'); if (ov) ov.style.display = 'none'; }

  /* ============ BINDINGS ============ */
  function bind() {
    // 消息统计
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
              else if (/msg-row (other|ta)\b/.test(html)) {
                _musicSessionTaMsgs++;
                // 联系人发消息时按概率发起听歌邀请
                maybeSendInvite();
              }
            }
          } catch (e) {}
          return origAppend.apply(this, arguments);
        };
        window.__akiniAppendMessageHTML.__r6wrapped = true;
      }
    } catch (e) {}

    // 音乐控制函数包装
    function wrapMusicControls() {
      var ready = typeof window.musicControlNext === 'function';
      if (!ready) { setTimeout(wrapMusicControls, 200); return; }
      try {
        ['musicControlNext', 'musicControlPrev'].forEach(function (fn) {
          if (typeof window[fn] === 'function' && !window[fn].__r6wrapped) {
            var orig = window[fn];
            window[fn] = function () {
              var r = orig.apply(this, arguments);
              try {
                var active = false;
                try { active = '1' === localStorage.getItem('akini_music_listening_active'); } catch (e) {}
                if (active) _musicSessionSongCount++;
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
    var musicBack = $('musicHomeBackBtn');
    if (musicBack) musicBack.addEventListener('click', goHomeFromMusic);

    // Music history
    var mhBack = $('musicHistoryBack');
    if (mhBack) mhBack.addEventListener('click', closeMusicHistory);

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
    var compBack = $('companionHomeBackBtn');
    if (compBack) compBack.addEventListener('click', goHomeFromCompanion);

    // Companion history
    var chBack = $('companionHistoryBack');
    if (chBack) chBack.addEventListener('click', closeCompanionHistory);

    // 音乐退出：拦截 musicBackBtn，结束会话并回到音乐首页
    var musicPlayerBack = $('musicBackBtn');
    if (musicPlayerBack && !musicPlayerBack.__r6bound) {
      musicPlayerBack.__r6bound = true;
      musicPlayerBack.addEventListener('click', function () {
        try {
          var active = false;
          try { active = '1' === localStorage.getItem('akini_music_listening_active'); } catch (e) {}
          if (active) endMusicSessionTracking();
        } catch (e) {}
        // 回到音乐首页
        setTimeout(function () {
          try {
            var app = $('app-music');
            if (app) { app.style.display = 'none'; app.classList.remove('show'); }
          } catch (e) {}
          showMusicHome();
        }, 100);
      }, true);
    }

    // 陪伴退出：拦截 companionMainBackBtn，回到陪伴首页
    var compMainBack = $('companionMainBackBtn');
    if (compMainBack && !compMainBack.__r6bound) {
      compMainBack.__r6bound = true;
      compMainBack.addEventListener('click', function () {
        setTimeout(function () {
          try {
            var app = $('app-companion');
            if (app) { app.style.display = 'none'; app.classList.remove('show'); }
          } catch (e) {}
          showCompanionHome();
        }, 100);
      }, true);
    }

    // 包装 _akiniMusicGoHome：任何退出音乐的路径都先结束会话
    try {
      if (typeof window._akiniMusicGoHome === 'function' && !window._akiniMusicGoHome.__r6wrapped) {
        var origGoHome = window._akiniMusicGoHome;
        window._akiniMusicGoHome = function () {
          try {
            var active = false;
            try { active = '1' === localStorage.getItem('akini_music_listening_active'); } catch (e) {}
            if (active) endMusicSessionTracking();
          } catch (e) {}
          return origGoHome.apply(this, arguments);
        };
        window._akiniMusicGoHome.__r6wrapped = true;
      }
    } catch (e) {}

    // 概率设置
    var probSave = $('probSettingsSave');
    if (probSave) probSave.addEventListener('click', function () {
      var inv = $('probInviteInput');
      var sk = $('probSkipInput');
      var iv = inv ? parseFloat(inv.value) : NaN;
      var sv = sk ? parseFloat(sk.value) : NaN;
      if (!isNaN(iv) && iv >= 0 && iv <= 100) { try { localStorage.setItem('akini_prob_invite', String(iv)); } catch (e) {} }
      if (!isNaN(sv) && sv >= 0 && sv <= 100) { try { localStorage.setItem('akini_prob_skip', String(sv)); } catch (e) {} }
      closeProbSettings();
      try { window.__akiniToast && window.__akiniToast('概率已保存'); } catch (e) {}
    });
    var probClose = $('probSettingsClose');
    if (probClose) probClose.addEventListener('click', closeProbSettings);

    window.__akiniSendMusicInviteCard = sendMusicInviteCard;
    window.__akiniOpenProbSettings = openProbSettings;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }

  window.__akiniShowMusicHome = showMusicHome;
  window.__akiniShowCompanionHome = showCompanionHome;
  window.__akiniOpenCompanionHistory = openCompanionHistory;
  window.__akiniOpenMusicHistory = openMusicHistory;
})();
