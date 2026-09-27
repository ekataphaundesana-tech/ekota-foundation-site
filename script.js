const SUPABASE_URL = window.EKOTA_SUPABASE_URL || "";
const SUPABASE_KEY = window.EKOTA_SUPABASE_PUBLISHABLE_KEY || "";
const sb = (window.supabase && SUPABASE_URL && SUPABASE_KEY)
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

document.getElementById("year").textContent = new Date().getFullYear();

function toggleSidebar(){ document.getElementById("sidebar").classList.toggle("open"); }
function openChat(){ document.getElementById("chatModal").classList.add("open"); }
function closeChat(){ document.getElementById("chatModal").classList.remove("open"); }

const rows = document.getElementById("memberRows");
let allMembers = [];

function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c]));}

function renderMembers(){
  const q = (document.getElementById("memberSearch").value||"").toLowerCase().trim();
  const filter = document.getElementById("memberFilter").value;
  const data = allMembers.filter(m => {
    const hit = !q || `${m.name||""} ${m.member_id||""} ${m.profession||""}`.toLowerCase().includes(q);
    const f = filter==="সকল সদস্য" || (filter==="অনুমোদিত" && m.status==="approved") || (filter==="পেন্ডিং" && m.status==="pending");
    return hit && f;
  });
  if(!data.length){ rows.innerHTML='<tr><td colspan="4">কোনো সদস্য পাওয়া যায়নি।</td></tr>'; return; }
  rows.innerHTML=data.slice(0,20).map(m=>`<tr><td><b>${esc(m.name)}</b></td><td>${esc(m.member_id)}</td><td>${esc(m.profession||"সদস্য")}</td><td><span class="status">${m.status==="approved"?"অনুমোদিত":"পেন্ডিং"}</span></td></tr>`).join("");
}

async function loadMembers(){
  if(!sb){
    allMembers=[
      {name:"ডেমো সদস্য",member_id:"EK-DEMO-001",profession:"সদস্য",status:"approved"},
      {name:"নতুন আবেদন",member_id:"EK-DEMO-002",profession:"শিক্ষার্থী",status:"pending"}
    ];
    document.getElementById("totalMembers").textContent="2";
    document.getElementById("approvedMembers").textContent="1";
    renderMembers();
    return;
  }
  const {data,error}=await sb.from("members").select("member_id,name,profession,status,created_at").order("created_at",{ascending:false});
  if(error){console.error(error);return;}
  allMembers=data||[];
  document.getElementById("totalMembers").textContent=allMembers.length;
  document.getElementById("approvedMembers").textContent=allMembers.filter(x=>x.status==="approved").length;
  renderMembers();
}

document.getElementById("memberSearch").addEventListener("input",renderMembers);
document.getElementById("memberFilter").addEventListener("change",renderMembers);

const joinForm=document.getElementById("joinForm");
joinForm.addEventListener("submit",async e=>{
  e.preventDefault();
  const msg=document.getElementById("formMsg");
  const btn=joinForm.querySelector("button[type=submit]");
  btn.disabled=true; msg.textContent="আবেদন জমা হচ্ছে...";
  const fd=new FormData(joinForm);
  const ref="EK-"+new Date().getFullYear()+"-"+Math.random().toString(36).slice(2,8).toUpperCase();
  const payload={
    member_id:ref,
    name:String(fd.get("name")||"").trim(),
    phone:String(fd.get("phone")||"").trim(),
    profession:String(fd.get("profession")||"").trim(),
    address:String(fd.get("address")||"").trim(),
    bio:String(fd.get("bio")||"").trim(),
    status:"pending"
  };
  if(!sb){
    msg.innerHTML=`✅ আবেদন সফলভাবে নেওয়া হয়েছে। আবেদন নম্বর: <strong>${ref}</strong><br>Supabase সংযোগ না থাকায় এটি এখন ডেমো মোডে আছে।`;
    btn.disabled=false; return;
  }
  const {error}=await sb.from("members").insert(payload);
  if(error){
    console.error(error);
    msg.textContent="❌ আবেদন জমা হয়নি। আবার চেষ্টা করুন।";
    btn.disabled=false; return;
  }
  joinForm.reset();
  msg.innerHTML=`✅ <strong>আবেদন সফলভাবে জমা হয়েছে!</strong><br>আপনার আবেদন নম্বর: <strong>${ref}</strong><br>Admin অনুমোদনের পর সদস্য তালিকায় দেখা যাবে।`;
  btn.disabled=false;
  loadMembers();
});

loadMembers();
