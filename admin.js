const sb = window.supabase.createClient(window.EKOTA_SUPABASE_URL, window.EKOTA_SUPABASE_PUBLISHABLE_KEY);

const $ = (s) => document.querySelector(s);
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));

async function init() {
  const { data: { session } } = await sb.auth.getSession();
  if (session) showPanel(session);
  else showLogin();

  sb.auth.onAuthStateChange((_event, session) => {
    if (session) showPanel(session); else showLogin();
  });
}

function showLogin() {
  $('#login').hidden = false;
  $('#panel').hidden = true;
  $('#email').focus();
}

function showPanel(session) {
  $('#login').hidden = true;
  $('#panel').hidden = false;
  $('#adminEmail').textContent = session.user.email || '';
  loadApplications();
}

async function login() {
  const email = $('#email').value.trim();
  const password = $('#pass').value;
  const msg = $('#loginMsg');
  msg.textContent = 'লগইন হচ্ছে...';
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) msg.textContent = 'লগইন হয়নি: ' + error.message;
  else msg.textContent = '';
}

async function logout() {
  await sb.auth.signOut();
}

async function loadApplications() {
  const box = $('#apps');
  box.innerHTML = '<p class="msg">আবেদনগুলো লোড হচ্ছে...</p>';
  const { data, error } = await sb.from('members')
    .select('id,member_id,name,phone,profession,address,bio,status,created_at')
    .order('created_at', { ascending: false });
  if (error) {
    box.innerHTML = '<p class="msg">ডাটা লোড হয়নি। Supabase RLS policy ঠিক আছে কি না দেখুন।<br>' + esc(error.message) + '</p>';
    return;
  }
  if (!data?.length) {
    box.innerHTML = '<p class="msg">কোনো আবেদন নেই।</p>';
    return;
  }
  box.innerHTML = data.map(m => `
    <article class="application">
      <div>
        <h3>${esc(m.name)}</h3>
        <p>🆔 ${esc(m.member_id)} · 📞 ${esc(m.phone || '-')}</p>
        <p>💼 ${esc(m.profession || '-')} · 📍 ${esc(m.address || '-')}</p>
        <p>${esc(m.bio || '')}</p>
        <small>স্ট্যাটাস: ${esc(m.status)} · ${new Date(m.created_at).toLocaleString('bn-BD')}</small>
      </div>
      <div class="adminActions">
        ${m.status !== 'approved' ? `<button class="btn mini" onclick="approveMember('${m.id}')">✅ অনুমোদন</button>` : '<span class="status ok">অনুমোদিত</span>'}
        ${m.status !== 'rejected' ? `<button class="btn ghost mini" onclick="rejectMember('${m.id}')">↩ বাতিল</button>` : ''}
        <button class="danger" onclick="deleteMember('${m.id}')">🗑 মুছুন</button>
      </div>
    </article>`).join('');
}

async function approveMember(id) {
  const { error } = await sb.from('members').update({ status: 'approved' }).eq('id', id);
  if (error) return alert('অনুমোদন হয়নি: ' + error.message);
  loadApplications();
}

async function rejectMember(id) {
  const { error } = await sb.from('members').update({ status: 'rejected' }).eq('id', id);
  if (error) return alert('বাতিল হয়নি: ' + error.message);
  loadApplications();
}

async function deleteMember(id) {
  if (!confirm('এই আবেদনটি স্থায়ীভাবে মুছে ফেলবেন?')) return;
  const { error } = await sb.from('members').delete().eq('id', id);
  if (error) return alert('মুছে ফেলা হয়নি: ' + error.message);
  loadApplications();
}

window.login = login;
window.logout = logout;
window.approveMember = approveMember;
window.rejectMember = rejectMember;
window.deleteMember = deleteMember;
init();
