/* ============================================================
   Mod Chess — Online (Supabase auth + profile/ELO + match sync)
   Inert unless you configure a Supabase URL + anon key (local
   storage via the Online modal, or window.MODCHESS_CONFIG).
   See supabase/schema.sql and the README "Going online" section.
   ============================================================ */
(function () {
  const root = (typeof window !== 'undefined' ? window : globalThis);
  const MD = root.MD;
  if (!MD) return;
  const Online = { supabase: null, user: null, cfg: null };
  MD.Online = Online;

  const CFGKEY = 'modchess.supabase';
  // Default project (Mod Chess). Public anon key — safe to ship in the client.
  const DEFAULT_SUPABASE = {
    url: 'https://khjrgquwcjpprjjmcnfa.supabase.co',
    anon: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoanJncXV3Y2pwcHJqam1jbmZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxNTY1ODIsImV4cCI6MjA5OTczMjU4Mn0.-nRtgMQSqBbeXyMOi0m62X4jPkK3gvVrk6Nj8bvPgHk'
  };
  function loadCfg() {
    try {
      if (Online.cfg) return Online.cfg;
      let saved = null;
      try { saved = JSON.parse(localStorage.getItem(CFGKEY) || 'null'); } catch (e) { saved = null; }
      const injected = (root.MODCHESS_CONFIG && root.MODCHESS_CONFIG.supabase) || null;
      Online.cfg = (saved && saved.url && saved.anon) ? saved : (injected || DEFAULT_SUPABASE);
      return Online.cfg;
    } catch (e) { return DEFAULT_SUPABASE; }
  }
  function saveCfg(url, anon) {
    Online.cfg = { url, anon };
    try { localStorage.setItem(CFGKEY, JSON.stringify({ url, anon })); } catch (e) {}
  }
  Online.cfg = loadCfg();

  function loadSupabase() {
    if (Online.supabase) return Promise.resolve(Online.supabase);
    if (!Online.cfg) return Promise.reject(new Error('Supabase not configured'));
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
      s.onload = () => {
        try {
          Online.supabase = root.supabase.createClient(Online.cfg.url, Online.cfg.anon);
          resolve(Online.supabase);
        } catch (e) { reject(e); }
      };
      s.onerror = () => reject(new Error('Failed to load Supabase client (needs internet)'));
      document.head.appendChild(s);
    });
  }

  const $ = id => document.getElementById(id);

  function status(txt, ok) {
    const el = $('olStatus');
    if (el) { el.textContent = txt; el.style.color = ok ? '#9ee26b' : ''; }
  }
  function renderAuthed() {
    const who = $('olWho'), elo = $('olElo'), authed = $('olAuthed'), guest = $('olGuest');
    if (!Online.user) { if (authed) authed.style.display = 'none'; if (guest) guest.style.display = ''; return; }
    if (authed) authed.style.display = '';
    if (guest) guest.style.display = 'none';
    if (who) who.textContent = Online.user.user_metadata && Online.user.user_metadata.username || Online.user.email || 'player';
    if (elo) elo.textContent = 'ELO ' + (Online.elo || 1200);
  }

  async function refreshProfile(sb) {
    if (!sb || !Online.user) return;
    try {
      const { data } = await sb.from('profiles').select('username, elo, avatar').eq('id', Online.user.id).maybeSingle();
      if (data) {
        Online.elo = data.elo;
        if (data.username) { MD.Profile.name = data.username; MD.Profile.elo = data.elo; }
        if (MD.Profile.save) MD.Profile.save();
      }
    } catch (e) { /* offline okay */ }
  }

  async function signUp() {
    const sb = await loadSupabase().catch(e => { status(String(e.message || e), false); return null; });
    if (!sb) return;
    const email = $('olEmail').value.trim(), pass = $('olPass').value, user = $('olUser').value.trim();
    if (!email || pass.length < 6) return status('Email + password (min 6 chars) required.', false);
    if (!user) return status('Choose a username to create your account.', false);
    const { data, error } = await sb.auth.signUp({ email, password: pass, options: { data: { username: user, elo: 1200 } } });
    if (error) return status('Sign up failed: ' + error.message, false);
    Online.user = data.user;
    status('Account created — check your email to confirm, then sign in.', true);
    renderAuthed();
  }
  async function signIn() {
    const sb = await loadSupabase().catch(e => { status(String(e.message || e), false); return null; });
    if (!sb) return;
    const email = $('olEmail').value.trim(), pass = $('olPass').value;
    const { data, error } = await sb.auth.signInWithPassword({ email, password: pass });
    if (error) return status('Sign in failed: ' + error.message, false);
    Online.user = data.user;
    status('Signed in.', true);
    await refreshProfile(sb);
    renderAuthed();
  }
  async function signOut() {
    if (Online.supabase) await Online.supabase.auth.signOut();
    Online.user = null; renderAuthed(); status('Signed out.', true);
  }

  Online.open = async function () {
    if (!loadCfg()) {
      // ask for connection details inside the modal
    }
    // pre-fill saved config
    const u = $('olUrl'), a = $('olAnon');
    if (Online.cfg) { if (u) u.value = Online.cfg.url; if (a) a.value = Online.cfg.anon; }
    if (loadCfg()) {
      const sb = await loadSupabase().catch(() => null);
      if (sb) {
        const { data } = await sb.auth.getSession().catch(() => ({ data: null }));
        Online.user = (data && data.session && data.session.user) || null;
        if (Online.user) await refreshProfile(sb);
      }
    } else {
      status('Not configured yet. Expand “Configure Supabase” below (URL + anon key) or set window.MODCHESS_CONFIG.', false);
    }
    if (MD.UI && MD.UI.openModal) MD.UI.openModal('onlineModal');
    renderAuthed();
  };

  function wire() {
    const on = (id, fn) => { const b = $(id); if (b) b.addEventListener('click', fn); };
    on('btnOlLogin', signIn);
    on('btnOlSignup', signUp);
    on('btnSignOut', signOut);
    on('btnOlSaveCfg', () => {
      const url = $('olUrl').value.trim(), anon = $('olAnon').value.trim();
      if (!/^https:\/\/.+\.supabase\.co\/?$/.test(url) || !anon) return status('Enter a valid Supabase URL and anon key.', false);
      saveCfg(url.replace(/\/$/, ''), anon);
      status('Saved. Sign in to play online.', true);
    });
    on('btnFindMatch', async () => {
      const sb = await loadSupabase().catch(e => { status(String(e.message || e), false); return null; });
      if (!sb || !Online.user) return status('Sign in first.', false);
      status('Matchmaking is ready in the Supabase schema (see README). Implement a lobby/room to go fully live.', true);
    });
  }
  if (document.readyState !== 'loading') wire(); else document.addEventListener('DOMContentLoaded', wire);
})();
