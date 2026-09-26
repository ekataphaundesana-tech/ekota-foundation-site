const sb = window.supabase.createClient(
  window.EKOTA_SUPABASE_URL,
  window.EKOTA_SUPABASE_PUBLISHABLE_KEY
);

function toggleMenu(){
  document.getElementById('nav').classList.toggle('open');
}

document.getElementById('year').textContent =
  new Date().getFullYear();

const memberGrid =
  document.getElementById('memberGrid');

function esc(v){
  return String(v).replace(/[&<>"']/g,c=>({
    '&':'&amp;',
    '<':'&lt;',
    '>':'&gt;',
    '"':'&quot;',
    "'":'&#039;'
  }[c]));
}

function card(m){
  return `
    <article class="member">
      <div class="avatar">
        ${(m.name||'স').trim().charAt(0)}
      </div>
      <div>
        <h3>${esc(m.name||'')}</h3>
        <p>${esc(m.profession||'সদস্য')}</p>
        <small>সদস্য ID: ${esc(m.member_id||'')}</small>
      </div>
    </article>
  `;
}

async function loadMembers(){

  const {data,error} = await sb
    .from('members')
    .select('member_id,name,profession,created_at')
    .eq('status','approved')
    .order('created_at',{ascending:false});

  if(error){
    console.error(error);
    return;
  }

  const leaders = [
    {
      member_id:'LEAD-001',
      name:'মোঃ তালহা সরদার',
      profession:'সভাপতি'
    },
    {
      member_id:'LEAD-002',
      name:'মোঃ ইব্রাহিম',
      profession:'সাধারণ সম্পাদক'
    }
  ];

  memberGrid.innerHTML =
    [...leaders,...(data||[])].map(card).join('');
}

loadMembers();

document.getElementById('joinForm').addEventListener(
  'submit',
  async e => {

    e.preventDefault();

    const form = e.currentTarget;
    const msg = document.getElementById('formMsg');
    const submitBtn =
      form.querySelector('button[type="submit"]');

    if(submitBtn){
      submitBtn.disabled = true;
    }

    msg.textContent = 'আবেদন জমা হচ্ছে...';

    const fd = new FormData(form);

    const ref =
      'EK-' +
      new Date().getFullYear() +
      '-' +
      Math.random()
        .toString(36)
        .slice(2,8)
        .toUpperCase();

    const payload = {
      member_id: ref,
      name: String(fd.get('name') || '').trim(),
      phone: String(fd.get('phone') || '').trim(),
      profession: String(fd.get('profession') || '').trim(),
      address: String(fd.get('address') || '').trim(),
      bio: String(fd.get('bio') || '').trim(),
      status: 'pending'
    };

    const {error} =
      await sb.from('members').insert(payload);

    if(error){

      console.error(error);

      msg.textContent =
        '❌ আবেদন জমা হয়নি। আবার চেষ্টা করুন।';

      if(submitBtn){
        submitBtn.disabled = false;
      }

      return;
    }

    form.reset();

    msg.innerHTML =
      '✅ <strong>আবেদন সফলভাবে জমা হয়েছে!</strong><br>' +
      'আপনার আবেদন নম্বর: <strong>' +
      ref +
      '</strong><br>' +
      'Admin অনুমোদনের পর সদস্য তালিকায় দেখা যাবে।';

    if(submitBtn){
      submitBtn.disabled = false;
    }
  }
);
