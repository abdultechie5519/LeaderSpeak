import { useState, useRef, useEffect } from "react";

// Ensure mobile/tablet browsers scale correctly. This runs at module load —
// BEFORE the first render — so the very first paint is already correctly scaled.
// (Setting the viewport only in a post-mount effect is too late and causes the
// page to render at desktop width first, which looks broken on phones.)
(function ensureViewport() {
  try {
    if (typeof document === "undefined") return;
    let meta = document.querySelector('meta[name="viewport"]');
    if (!meta) { meta = document.createElement("meta"); meta.setAttribute("name","viewport"); document.head.appendChild(meta); }
    meta.setAttribute("content", "width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover");
  } catch {}
})();

// ── Palette ───────────────────────────────────────────────────────────────────
const P = {
  ink:"#0A0520",inkMid:"#150D3A",
  gradPurple:"linear-gradient(135deg,#7C3AED,#4F46E5)",
  gradTeal:"linear-gradient(135deg,#0EA5E9,#10B981)",
  gradAmber:"linear-gradient(135deg,#F59E0B,#EF4444)",
  gradPink:"linear-gradient(135deg,#EC4899,#8B5CF6)",
  gradGreen:"linear-gradient(135deg,#10B981,#3B82F6)",
  gradCoral:"linear-gradient(135deg,#F97316,#EF4444)",
  gradBlue:"linear-gradient(135deg,#3B82F6,#6366F1)",
  purple:"#7C3AED",purpleD:"#4F46E5",purple10:"#EDE9FE",
  teal:"#0EA5E9",tealD:"#0284C7",teal10:"#E0F2FE",
  green:"#10B981",greenD:"#059669",green10:"#D1FAE5",
  amber:"#F59E0B",amberD:"#D97706",amber10:"#FEF3C7",
  pink:"#EC4899",pinkD:"#DB2777",pink10:"#FCE7F3",
  coral:"#F97316",coralD:"#EA580C",coral10:"#FFEDD5",
  blue:"#3B82F6",blueD:"#2563EB",blue10:"#DBEAFE",
  red:"#EF4444",red10:"#FEE2E2",
  bg:"#F5F3FF",card:"#FFFFFF",
  g50:"#F9FAFB",g100:"#F3F4F6",g200:"#E5E7EB",
  g300:"#D1D5DB",g400:"#9CA3AF",g500:"#6B7280",
  g700:"#374151",g800:"#1F2937",g900:"#111827",
};
const gText = g => ({ background:g, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" });
const TC = {
  pink:  { bg:P.pink10,  text:P.pinkD,  grad:P.gradPink },
  purple:{ bg:P.purple10,text:P.purpleD,grad:P.gradPurple },
  teal:  { bg:P.teal10,  text:P.tealD,  grad:P.gradTeal },
  green: { bg:P.green10, text:P.greenD, grad:P.gradGreen },
  coral: { bg:P.coral10, text:P.coralD, grad:P.gradCoral },
  amber: { bg:P.amber10, text:P.amberD, grad:P.gradAmber },
  blue:  { bg:P.blue10,  text:P.blueD,  grad:P.gradBlue },
};

// ── Static data ───────────────────────────────────────────────────────────────
const SEED_TOPICS = [
  { title:"Delivering Difficult Feedback", tag:"Feedback", color:"pink",
    explain:"Great leaders communicate hard truths with empathy, ensuring the message lands without damaging trust.",
    points:["Focus on behavior, not character","Use specific examples with context","Invite dialogue and co-own solutions"],
    script:"I'd like to share some observations that I believe will help us grow. In last week's presentation, the data context was missing — I'd love to work with you on structuring it more effectively before our next stakeholder review.",
    mistake:"Don't sandwich feedback between vague praise — it dilutes the message and feels insincere.",
    reflect:"Think of recent feedback you gave. Did you describe a behavior or judge a person?" },
  { title:"Inspiring Through Uncertainty", tag:"Vision", color:"purple",
    explain:"During ambiguous periods, leaders anchor teams with clarity of purpose and honest optimism.",
    points:["Acknowledge uncertainty openly","Reaffirm the mission and shared values","Outline the next concrete step"],
    script:"I won't pretend we have every answer — and that's okay. Our purpose hasn't changed. Here's precisely what we're doing next to move forward with confidence and conviction.",
    mistake:"Don't project false certainty — teams sense it and trust erodes when reality differs.",
    reflect:"When did you last admit you didn't have an answer? How did your team respond?" },
  { title:"Running High-Impact Meetings", tag:"Execution", color:"teal",
    explain:"Effective leaders respect their team's time through focused, outcome-driven facilitation.",
    points:["State the objective in the opening minute","Assign owners before closing","End with a clear decision"],
    script:"Before we begin — let's align on what success looks like today. In the next 45 minutes, I want a clear roadmap decision with owners assigned for every workstream. No ambiguity, just momentum.",
    mistake:"Don't let meetings end without a documented decision and named owners.",
    reflect:"What percentage of your last five meetings ended with a clear next action?" },
  { title:"Building Psychological Safety", tag:"Culture", color:"green",
    explain:"Teams perform best when members feel safe to speak up, take risks, and admit mistakes without fear.",
    points:["Model vulnerability by sharing your own mistakes","Respond to bad news with curiosity, not blame","Reward people who raise concerns early"],
    script:"I want to make something clear: in this team, raising a problem is never punished — it's valued. I'll go first. Last quarter I underestimated the timeline, and here's what I learned. What are you seeing that worries you?",
    mistake:"Don't react with frustration to bad news — it teaches people to hide problems.",
    reflect:"When someone last brought you a problem, was their first instinct relief or fear?" },
  { title:"Communicating a Strategic Pivot", tag:"Strategy", color:"coral",
    explain:"When direction changes, leaders must convey the why clearly to maintain trust and buy-in.",
    points:["Explain the data or insight driving the change","Acknowledge what people are leaving behind","Paint a vivid picture of the new direction"],
    script:"I know we invested heavily in the old approach, and that work mattered. But the market has shifted, and clinging to the plan would fail the very customers we serve. Here's the new direction and exactly why it gives us a stronger future.",
    mistake:"Don't announce a pivot without honoring the effort people put into the old path.",
    reflect:"Can you explain your last big decision's 'why' in one sentence a new hire would understand?" },
  { title:"Leading Through Conflict", tag:"Conflict", color:"amber",
    explain:"Skilled leaders surface tension early and turn disagreement into better decisions rather than resentment.",
    points:["Separate the people from the problem","Find the shared goal beneath the dispute","Decide clearly once all views are heard"],
    script:"I can see we strongly disagree here, and that's actually useful — it means we care about getting this right. Let's name the real goal we both want, then pressure-test each option against it before I make the call.",
    mistake:"Don't avoid conflict hoping it resolves itself — unspoken tension compounds.",
    reflect:"Is there a disagreement on your team you've been quietly avoiding?" },
  { title:"Delegating With Trust", tag:"Execution", color:"teal",
    explain:"Leaders scale their impact by handing over ownership, not just tasks, and resisting the urge to take over.",
    points:["Delegate the outcome, not the method","Agree on check-in points up front","Let people solve it their own way"],
    script:"I'm handing you full ownership of the launch, not just a checklist. I trust your judgment on how to get there. Let's agree on two check-ins, and beyond that, the decisions are yours — come to me if you hit a wall.",
    mistake:"Don't delegate then micromanage — it signals you never really trusted them.",
    reflect:"What's one thing only you do today that someone else could own within a month?" },
  { title:"Recognizing and Praising Work", tag:"Culture", color:"green",
    explain:"Specific, timely recognition fuels motivation far more than generic or delayed praise.",
    points:["Be specific about what they did and its impact","Praise in public, in their preferred way","Connect their effort to the bigger mission"],
    script:"I want to call out something specific: the way you handled that frustrated client yesterday turned a cancellation into a renewal. That's not luck — that's skill, and it directly protects this team's goals. Thank you.",
    mistake:"Don't rely on vague praise like 'good job' — it's forgettable and feels automatic.",
    reflect:"When did you last praise someone with a specific example rather than a generic word?" },
  { title:"Communicating Vision Simply", tag:"Vision", color:"purple",
    explain:"A vision only motivates if people can repeat it, picture it, and see their place in it.",
    points:["Reduce the vision to one memorable line","Make it concrete and visual, not abstract","Show each person how they contribute"],
    script:"Our vision isn't a slogan on a wall — it's this: every customer feels heard within a single conversation. Picture what that looks like at your desk tomorrow. Your work on response time is exactly how we get there.",
    mistake:"Don't bury the vision in jargon — if people can't repeat it, they can't rally around it.",
    reflect:"Could your team state the team's mission in one sentence right now?" },
  { title:"Having Career Conversations", tag:"Coaching", color:"blue",
    explain:"Great managers invest in where people want to go, not just what the company needs today.",
    points:["Ask about their goals before sharing yours","Listen for what energizes them","Co-create a concrete next step"],
    script:"I want this conversation to be about you, not just your current role. Where do you genuinely want to be in two years? Let's find one project this quarter that moves you closer — your growth and our goals don't have to compete.",
    mistake:"Don't make career talks an afterthought tacked onto performance reviews.",
    reflect:"Do you know the two-year aspiration of each person who reports to you?" },
];

const VOCAB_DEFAULT = [
  { word:"Accountability", meaning:"Taking ownership of outcomes regardless of who caused them.", synonyms:["Responsibility","Ownership","Stewardship"], examples:["We lead with accountability, not blame.","Accountability separates great teams from average ones.","I hold myself accountable before asking the same of others."], color:"purple" },
  { word:"Alignment", meaning:"Ensuring all team members move toward the same goal.", synonyms:["Cohesion","Consensus","Synchrony"], examples:["Let's ensure alignment before we proceed.","Strategic alignment accelerates execution.","Alignment on values prevents conflict later."], color:"teal" },
  { word:"Empowerment", meaning:"Giving people authority, tools, and confidence to act independently.", synonyms:["Enablement","Autonomy","Delegation"], examples:["Empowerment is the foundation of scalable leadership.","I empower my team to own their outcomes.","True empowerment means trusting people with real decisions."], color:"green" },
  { word:"Resilience", meaning:"The ability to recover and adapt in the face of adversity.", synonyms:["Durability","Tenacity","Adaptability"], examples:["Resilience is built through deliberate challenge.","Our resilience has been tested and proven.","She leads with remarkable resilience under pressure."], color:"coral" },
  { word:"Transparency", meaning:"Open and honest communication without hidden agendas.", synonyms:["Openness","Candor","Forthrightness"], examples:["Transparency builds the trust we need to move fast.","I believe in transparent communication at every level.","Transparency isn't weakness — it's strength."], color:"pink" },
];

// In each story, advanced words are followed by simple synonyms in (brackets).
const TALKS = [
  { title:"Steve Jobs — Stanford Commencement (2005)", speaker:"Steve Jobs", color:"purple",
    story:"Steve Jobs stood before thousands of graduates and shared three stories from his own life. He spoke about serendipity (lucky chance) — how dropping out of college let him stumble into a calligraphy class that later shaped the Mac. He talked about perseverance (not giving up) after being fired from the very company he founded. And he spoke about mortality (death), urging students to trust their intuition (gut feeling) and build a legacy (lasting impact) driven by intrinsic motivation (inner drive), not money or applause." },
  { title:"Brené Brown — The Power of Vulnerability (TED 2010)", speaker:"Brené Brown", color:"pink",
    story:"Brené Brown spent years studying human connection, and her research led her somewhere unexpected. She discovered that vulnerability (being open) is not weakness — it is the birthplace of courage and belonging. The people who felt most connected practiced empathy (understanding others) and lived wholehearted (fully present) lives. They built shame resilience (bouncing back from embarrassment) and chose authenticity (being your true self) over the exhausting pursuit of looking perfect." },
  { title:"Simon Sinek — Start With Why (TED 2009)", speaker:"Simon Sinek", color:"teal",
    story:"Simon Sinek drew a simple set of circles on a whiteboard and changed how leaders think. He explained that purpose-driven (mission-led) leaders communicate from the inside out — starting with WHY before HOW or WHAT. This differentiation (being different) is what makes great companies stand out. With clarity (clear thinking) and conviction (firm belief), they turn ordinary messages into inspiration (motivation), because people don't buy what you do — they buy why you do it." },
  { title:"A.P.J. Abdul Kalam — Dream, Dream, Dream", speaker:"A.P.J. Abdul Kalam", color:"amber",
    story:"A.P.J. Abdul Kalam, India's 'Missile Man' and beloved President, often told students that dreams are not what you see in sleep — dreams are what do not let you sleep. He rose from humble (poor and simple) beginnings, selling newspapers as a boy, to lead the nation's space and missile programmes through sheer perseverance (not giving up). He believed true leadership demands integrity (honesty) and humility (being modest), and he urged young people to aim high with unwavering (steady) determination. His greatest legacy (lasting impact) was igniting (sparking) the aspirations (big hopes) of millions of students he personally inspired." },
  { title:"Nelson Mandela — Freedom and Forgiveness", speaker:"Nelson Mandela", color:"green",
    story:"After twenty-seven years in prison, Nelson Mandela walked free and chose reconciliation (making peace) over revenge. He showed extraordinary resilience (bouncing back) and magnanimity (great generosity of spirit) toward those who had jailed him. Mandela believed that a leader must lead with compassion (deep care) and unite people across deep divisions. His unwavering (steady) commitment to equality and his quiet dignity (self-respect) turned a divided nation toward healing, proving that forgiveness can be the most powerful act of leadership." },
  { title:"Malala Yousafzai — The Right to Learn", speaker:"Malala Yousafzai", color:"pink",
    story:"Malala Yousafzai was just a schoolgirl when she spoke out for every girl's right to education — and survived an attack for it. Rather than retreat, she showed remarkable courage (bravery) and tenacity (refusing to quit). Standing before the United Nations, she declared that one child, one teacher, one book, and one pen can change the world. Her advocacy (speaking up for a cause) and conviction (firm belief) earned her the Nobel Peace Prize, reminding leaders everywhere that a single brave voice can spark global transformation (big change)." },
];

const NAV = [
  { id:"dashboard", label:"Dashboard",        icon:"⊞" },
  { id:"topics",    label:"Daily Topics",     icon:"💡" },
  { id:"speech",    label:"Speech Practice",  icon:"🎙" },
  { id:"custom",    label:"Add Custom Topics", icon:"✍️" },
  { id:"vocab",     label:"Vocabulary",       icon:"📖" },
  { id:"match",     label:"Speak & Match",    icon:"🗣️" },
  { id:"talks",     label:"Famous Talks",     icon:"🎤" },
  { id:"library",   label:"My Library",       icon:"🔖" },
  { id:"admin",     label:"Admin Panel",      icon:"🛡️", adminOnly:true },
];

// ── Storage ───────────────────────────────────────────────────────────────────
// Data is namespaced PER USER so one user can never see another user's saved data.
// Layout in localStorage:
//   leadspeak_users : { "<email>": { savedTopics:[], savedVocab:[], ... }, ... }
//   leadspeak_session (or sessionStorage) : the logged-in user object
// Remember Me decides whether the session is written to localStorage (persists
// across browser restarts) or sessionStorage (cleared when the tab closes).

const USERS_KEY  = "leadspeak_users_v1";
const SESS_KEY   = "leadspeak_session_v1";
const REMEMBER_KEY = "leadspeak_remember";

const EMPTY_USER_DATA = { savedTopics:[], savedSentences:[], savedVocab:[], savedTalks:[], savedSpeeches:[], customTalks:[], customNotes:[], matchSentences:[] };
const DATA_KEYS = Object.keys(EMPTY_USER_DATA);

const _readUsers = () => { try { return JSON.parse(localStorage.getItem(USERS_KEY) || "{}"); } catch { return {}; } };
const _writeUsers = m => { try { localStorage.setItem(USERS_KEY, JSON.stringify(m)); } catch {} };

// Load a single user's saved data (by email). Returns a fresh empty set if none.
function loadUserData(email) {
  if (!email) return { ...EMPTY_USER_DATA };
  const all = _readUsers();
  return { ...EMPTY_USER_DATA, ...(all[(email||"").trim().toLowerCase()] || {}) };
}
// Persist a single user's saved data (by email), keeping only the data keys.
function saveUserData(email, data) {
  if (!email) return;
  const em = (email||"").trim().toLowerCase();
  const all = _readUsers();
  const clean = {}; DATA_KEYS.forEach(k => { clean[k] = data[k] || []; });
  all[em] = clean;
  _writeUsers(all);
}

// Byte size of a user's stored data (for the admin usage tracker).
function userDataBytes(data) {
  try { return new Blob([JSON.stringify(data || {})]).size; }
  catch { return JSON.stringify(data || {}).length; }
}
// Summary of every user's data usage — admin only.
function allUsersUsage() {
  const all = _readUsers();
  return Object.entries(all).map(([email, data]) => {
    const counts = {}; DATA_KEYS.forEach(k => counts[k] = (data[k] || []).length);
    const items = Object.values(counts).reduce((a,b)=>a+b, 0);
    return { email, bytes: userDataBytes(data), items, counts };
  }).sort((a,b) => b.bytes - a.bytes);
}

// Session helpers — Remember Me gates localStorage vs sessionStorage.
const isRemembered = () => { try { return localStorage.getItem(REMEMBER_KEY) === "1"; } catch { return false; } };
function loadSession() {
  try {
    const raw = (isRemembered() ? localStorage.getItem(SESS_KEY) : null)
             || (typeof sessionStorage !== "undefined" ? sessionStorage.getItem(SESS_KEY) : null);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
function saveSession(user, remember) {
  try {
    const json = JSON.stringify(user);
    if (remember) {
      localStorage.setItem(REMEMBER_KEY, "1");
      localStorage.setItem(SESS_KEY, json);
      if (user.email) localStorage.setItem("leadspeak_remember_email", user.email);
      try { sessionStorage.setItem(SESS_KEY, json); } catch {}
    } else {
      localStorage.removeItem(REMEMBER_KEY);
      localStorage.removeItem(SESS_KEY);
      localStorage.removeItem("leadspeak_remember_email");
      try { sessionStorage.setItem(SESS_KEY, json); } catch {}
    }
  } catch {}
}
function clearSession() {
  try { localStorage.removeItem(SESS_KEY); } catch {}
  try { sessionStorage.removeItem(SESS_KEY); } catch {}
  // Note: we keep the remembered email so the login field can prefill it.
}

// ── Accounts (credential store) ───────────────────────────────────────────────
// Frontend-only artifact: accounts live in localStorage. Passwords are never
// stored in plain text — each is salted and hashed with SHA-256 (Web Crypto).
// This makes the login flow strict (only valid, matching credentials work),
// though a production app would verify credentials on a backend.
const AK = "leadspeak_accounts_v1";
const loadAccounts = () => { try { return JSON.parse(localStorage.getItem(AK)||"[]"); } catch { return []; } };
const saveAccounts = a => { try { localStorage.setItem(AK, JSON.stringify(a)); } catch {} };
const normEmail = e => (e||"").trim().toLowerCase();

// ── Admin & site-freeze ───────────────────────────────────────────────────────
// A single built-in admin account can freeze/unfreeze the whole site. The admin
// always retains access even while frozen; everyone else is locked out.
const ADMIN_EMAIL = "abdultechie5519@gmail.com";
const ADMIN_DEFAULT_PASSWORD = "Admin@12345";   // default credentials for first sign-in
const isAdminEmail = e => normEmail(e) === ADMIN_EMAIL;

const FREEZE_KEY = "leadspeak_frozen";
const isSiteFrozen = () => { try { return localStorage.getItem(FREEZE_KEY) === "1"; } catch { return false; } };
const setSiteFrozen = on => { try { on ? localStorage.setItem(FREEZE_KEY,"1") : localStorage.removeItem(FREEZE_KEY); } catch {} };

// Salted SHA-256 hash. Falls back to a simple internal hash if Web Crypto is
// unavailable (e.g. non-secure context) so login still functions correctly.
async function hashPassword(password, salt) {
  const data = `${salt}:${password}`;
  try {
    if (crypto?.subtle) {
      const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(data));
      return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,"0")).join("");
    }
  } catch {}
  // Fallback: deterministic non-crypto hash (still salted; better than plaintext).
  let h = 0; for (let i=0;i<data.length;i++) { h = (h*31 + data.charCodeAt(i)) | 0; }
  return "f" + (h >>> 0).toString(16);
}
function makeSalt() {
  try {
    const a = new Uint8Array(16); crypto.getRandomValues(a);
    return Array.from(a).map(b=>b.toString(16).padStart(2,"0")).join("");
  } catch { return Math.random().toString(36).slice(2) + Date.now().toString(36); }
}

const findAccount = email => loadAccounts().find(a => a.email === normEmail(email));

// Ensure the default admin account exists (runs once on app load).
async function ensureAdminAccount() {
  const accounts = loadAccounts();
  const idx = accounts.findIndex(a => a.email === ADMIN_EMAIL);
  if (idx >= 0) {
    // Make sure the admin flag is set even if the account predates this feature.
    if (!accounts[idx].isAdmin) { accounts[idx].isAdmin = true; saveAccounts(accounts); }
    return;
  }
  const salt = makeSalt();
  const hash = await hashPassword(ADMIN_DEFAULT_PASSWORD, salt);
  accounts.push({ name:"Site Admin", email:ADMIN_EMAIL, salt, hash, isAdmin:true, createdAt:new Date().toISOString() });
  saveAccounts(accounts);
}

// Create an account. Returns { ok, error?, user? }.
async function registerAccount({ name, email, password }) {
  const accounts = loadAccounts();
  const em = normEmail(email);
  if (accounts.some(a => a.email === em)) {
    return { ok:false, error:"An account with this email already exists. Try signing in instead." };
  }
  const salt = makeSalt();
  const hash = await hashPassword(password, salt);
  const account = { name:name.trim(), email:em, salt, hash, isAdmin:isAdminEmail(em), createdAt:new Date().toISOString() };
  saveAccounts([...accounts, account]);
  return { ok:true, user:{ name:account.name, email:account.email, isAdmin:account.isAdmin } };
}

// Verify credentials. Returns { ok, error?, user? }.
async function verifyLogin({ email, password }) {
  const account = findAccount(email);
  if (!account) return { ok:false, error:"No account found with this email. Please sign up first." };
  const hash = await hashPassword(password, account.salt);
  if (hash !== account.hash) return { ok:false, error:"Incorrect password. Please try again." };
  return { ok:true, user:{ name:account.name, email:account.email, isAdmin: !!account.isAdmin || isAdminEmail(account.email) } };
}

// Update an account's password (used by the reset flow). Returns { ok, error? }.
async function updatePassword(email, newPassword) {
  const accounts = loadAccounts();
  const idx = accounts.findIndex(a => a.email === normEmail(email));
  if (idx < 0) return { ok:false, error:"No account found with this email." };
  const salt = makeSalt();
  accounts[idx] = { ...accounts[idx], salt, hash: await hashPassword(newPassword, salt) };
  saveAccounts(accounts);
  return { ok:true };
}

// ── Claude API ────────────────────────────────────────────────────────────────
async function claude(prompt, maxTok=1500) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ model:"claude-sonnet-4-6", max_tokens:maxTok, messages:[{role:"user",content:prompt}] }),
  });
  const d = await r.json();
  return d.content.filter(b=>b.type==="text").map(b=>b.text).join("").replace(/```json\n?|```\n?/g,"").trim();
}

// ── Global CSS ────────────────────────────────────────────────────────────────
const GCSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap');
*{box-sizing:border-box;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;margin:0;padding:0}
body{font-family:'Inter',system-ui,sans-serif;background:#F5F3FF;text-rendering:optimizeLegibility}
@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes dot{0%,80%,100%{opacity:.15}40%{opacity:1}}
@keyframes recPulse{0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,.55)}70%{box-shadow:0 0 0 20px rgba(239,68,68,0)}}
@keyframes slideIn{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:none}}
@keyframes orb{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(30px,-20px) scale(1.08)}66%{transform:translate(-20px,10px) scale(.95)}}
@keyframes checkPop{0%{transform:scale(0)}80%{transform:scale(1.2)}100%{transform:scale(1)}}
@keyframes speakPulse{0%,100%{box-shadow:0 0 0 0 rgba(124,58,237,.4)}50%{box-shadow:0 0 0 6px rgba(124,58,237,0)}}
button:focus-visible{outline:2px solid #7C3AED;outline-offset:2px}
::-webkit-scrollbar{width:4px}
::-webkit-scrollbar-thumb{background:#DDD6FE;border-radius:10px}
.finput{width:100%;padding:13px 42px 13px 16px;border:2px solid #E5E7EB;border-radius:12px;font-size:14px;font-family:'Inter',sans-serif;background:#fff;color:#111827;transition:border-color .2s,box-shadow .2s;outline:none}
.finput:focus{border-color:#7C3AED;box-shadow:0 0 0 4px rgba(124,58,237,.1)}
.finput.ok{border-color:#10B981;box-shadow:0 0 0 3px rgba(16,185,129,.08)}
.finput.err{border-color:#EF4444;box-shadow:0 0 0 4px rgba(239,68,68,.1)}

/* ── Responsive layout system (laptop / tablet / mobile) ── */
*{max-width:100%}
html{-webkit-text-size-adjust:100%;text-size-adjust:100%}
html,body{overflow-x:hidden;width:100%;max-width:100vw}
#root,#root>div{max-width:100vw}
.ls-shell{display:flex;height:100vh;height:100dvh;min-height:100vh;min-height:100dvh;background:#F5F3FF;overflow:hidden}
.ls-sidebar{width:230px;min-width:230px;flex-shrink:0;position:relative}
.ls-main{flex:1;min-width:0;overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;padding:28px;background:#F5F3FF}
.ls-content{flex:1;display:flex;flex-direction:column;min-width:0;min-height:0}
.ls-topbar{display:none}
.ls-scrim{display:none}
.grid-4{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
.grid-2{display:grid;grid-template-columns:1fr 1fr;gap:18px}
.grid-2-sm{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.row-wrap{display:flex;flex-wrap:wrap;gap:8px}
img,svg,video{max-width:100%;height:auto}
textarea,input,select{max-width:100%}
button{touch-action:manipulation}

/* Large laptops / desktops: full layout (default above). */

/* Small laptops & large tablets in landscape (1024px and below):
   keep the sidebar but tighten spacing and collapse 4-col grids to 2-col. */
@media (max-width:1024px){
  .ls-sidebar{width:210px;min-width:210px}
  .ls-main{padding:24px}
  .grid-4{grid-template-columns:repeat(2,1fr);gap:14px}
}

/* Tablets (portrait) — 768px to 1024px handled above; below 900px also
   stack the two-column panels so nothing is cramped. */
@media (max-width:900px){
  .grid-2,.grid-2-sm{grid-template-columns:1fr;gap:16px}
}

/* Phones & small tablets (≤768px): sidebar becomes an off-canvas drawer. */
@media (max-width:768px){
  .ls-shell{position:relative;height:100dvh}
  .ls-sidebar{position:fixed;top:0;left:0;bottom:0;width:78vw;max-width:300px;min-width:0;z-index:60;transform:translateX(-100%);transition:transform .28s ease;box-shadow:0 0 40px rgba(0,0,0,.3)}
  .ls-sidebar.open{transform:translateX(0)}
  .ls-scrim{display:block;position:fixed;inset:0;background:rgba(10,5,32,.45);z-index:55;opacity:0;pointer-events:none;transition:opacity .25s}
  .ls-scrim.open{opacity:1;pointer-events:auto}
  .ls-topbar{display:flex;align-items:center;gap:12px;padding:10px 14px;background:#0A0520;position:sticky;top:0;z-index:40;flex-shrink:0;min-height:56px}
  .ls-content{height:100dvh}
  .ls-main{flex:1;padding:16px}
  .grid-4{grid-template-columns:repeat(2,1fr);gap:12px}
  .ls-hide-sm{display:none!important}
  .ls-close-btn{display:flex!important;align-items:center;justify-content:center}
  .rt-col{border-left:none!important;padding-left:0!important;border-top:1px solid #F3F4F6;padding-top:14px;min-width:0!important;width:100%;flex:1 1 100%!important}
  /* Dashboard rating card: stack its three sections cleanly on mobile */
  .dash-rating{align-items:stretch!important;gap:16px!important;padding:18px 16px!important}
  .dash-rating-head{flex:1 1 100%!important;width:100%}
  /* Comfortable tap targets on touch screens */
  button{min-height:40px}
  h1.ls-h1{font-size:22px!important}
}

/* Small phones (≤520px). */
@media (max-width:520px){
  .grid-4{grid-template-columns:1fr 1fr;gap:8px}
  .ls-main{padding:13px}
  h1.ls-h1{font-size:21px!important}
  .ls-auth-card{padding:26px 18px!important;border-radius:20px!important}
  .talk-head{flex-wrap:wrap}
  .talk-title-btn{flex:1 1 100%!important}
  .talk-controls{width:100%;justify-content:flex-end}
}

/* Very small phones (≤380px). */
@media (max-width:380px){
  .grid-4{grid-template-columns:1fr 1fr;gap:6px}
  .ls-main{padding:11px}
  h1.ls-h1{font-size:19px!important}
}

@media (prefers-reduced-motion:reduce){
  *{animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}
}
`;

// ── Auth validation rules ────────────────────────────────────────────────────
const VRULES = {
  name: v => {
    if (!v) return { ok: null, msg: "", hint: "Enter your first and last name" };
    if (v.length < 2) return { ok: false, msg: "Name must be at least 2 characters" };
    if (!/^[a-zA-Z\s'-]+$/.test(v)) return { ok: false, msg: "Only letters, spaces, hyphens allowed" };
    if (!v.trim().includes(" ")) return { ok: false, msg: "Please include your last name" };
    return { ok: true, msg: "Looks great ✓" };
  },
  email: v => {
    if (!v) return { ok: null, msg: "", hint: "We'll never share your email" };
    if (!v.includes("@")) return { ok: false, msg: "Missing @ — not a valid email" };
    if (!/\S+@\S+\.\S+/.test(v)) return { ok: false, msg: "Email must include a domain like .com" };
    const [, domain] = v.split("@");
    if (!domain || domain.length < 4) return { ok: false, msg: "Email domain looks incomplete" };
    const tld = domain.split(".").pop();
    if (!tld || tld.length < 2) return { ok: false, msg: "Invalid top-level domain (.com, .org…)" };
    return { ok: true, msg: "Valid email ✓" };
  },
  password: v => {
    if (!v) return { ok: null, msg: "", hint: "Minimum 8 characters required", score: 0, checks: {} };
    const checks = { len: v.length >= 8, upper: /[A-Z]/.test(v), lower: /[a-z]/.test(v), num: /[0-9]/.test(v), sym: /[^a-zA-Z0-9]/.test(v) };
    const score = Object.values(checks).filter(Boolean).length;
    if (!checks.len) return { ok: false, msg: "At least 8 characters required", score, checks };
    if (score <= 2) return { ok: false, msg: "Too weak — add uppercase letters or numbers", score, checks };
    if (score === 3) return { ok: true, msg: "Acceptable password", score, checks };
    return { ok: true, msg: score >= 5 ? "Strong password 🔒" : "Good password ✓", score, checks };
  },
  confirm: (v, pw) => {
    if (!v) return { ok: null, msg: "", hint: "" };
    if (v !== pw) return { ok: false, msg: "Passwords don't match" };
    return { ok: true, msg: "Passwords match ✓" };
  },
};

// ── Shared primitives ─────────────────────────────────────────────────────────
function Toast({ msg, type }) {
  return (
    <div style={{ position:"fixed",bottom:28,right:28,zIndex:9999,background:type==="error"?"#1a0505":P.ink,color:"#fff",padding:"13px 22px",borderRadius:14,fontSize:13,fontWeight:500,display:"flex",alignItems:"center",gap:10,animation:"fadeUp .25s ease",border:`1px solid ${type==="error"?"rgba(239,68,68,.4)":"rgba(124,58,237,.4)"}`,boxShadow:"0 8px 32px rgba(0,0,0,.3)" }}>
      <span style={{ fontSize:16 }}>{type==="error" ? "⚠️" : "✨"}</span>{msg}
    </div>
  );
}

function Spin({ color = P.purple, sz = 6 }) {
  return (
    <span style={{ display:"inline-flex", gap:4 }}>
      {[0,1,2].map(i => <span key={i} style={{ width:sz, height:sz, borderRadius:"50%", background:color, animation:`dot .8s ${i*.15}s infinite` }}/>)}
    </span>
  );
}

function GBtn({ children, onClick, grad = P.gradPurple, size = "md", disabled, style: s = {} }) {
  const sz = { sm:{ p:"7px 16px", fs:12 }, md:{ p:"10px 22px", fs:13 }, lg:{ p:"14px 30px", fs:15 } }[size];
  return (
    <button onClick={disabled ? undefined : onClick} disabled={disabled} style={{ display:"inline-flex",alignItems:"center",gap:7,padding:sz.p,fontSize:sz.fs,fontWeight:700,fontFamily:"inherit",borderRadius:11,cursor:disabled?"not-allowed":"pointer",opacity:disabled?.6:1,border:"none",background:grad,color:"#fff",boxShadow:"0 4px 14px rgba(0,0,0,.15)",transition:"all .18s",...s }}>
      {children}
    </button>
  );
}

function Ghost({ children, onClick, color = P.purple, size = "md", disabled, style: s = {} }) {
  const sz = { sm:{ p:"6px 14px", fs:12 }, md:{ p:"9px 18px", fs:13 } }[size];
  return (
    <button onClick={disabled ? undefined : onClick} disabled={disabled} style={{ display:"inline-flex",alignItems:"center",gap:6,padding:sz.p,fontSize:sz.fs,fontWeight:600,fontFamily:"inherit",borderRadius:10,cursor:disabled?"not-allowed":"pointer",opacity:disabled?.6:1,border:`1.5px solid ${color}30`,background:`${color}10`,color,...s }}>
      {children}
    </button>
  );
}

function IBtn({ icon, onClick, danger, title: t }) {
  return (
    <button onClick={onClick} title={t} style={{ width:32,height:32,borderRadius:8,border:`1.5px solid ${danger?P.red10:P.g200}`,background:danger?"#FEF2F2":"transparent",color:danger?P.red:P.g400,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
      {icon}
    </button>
  );
}

// Pick the most natural-sounding British English voice the browser offers.
// Voice lists load asynchronously, so we cache and re-resolve on demand.
let _voiceCache = null;
function pickBritishVoice() {
  try {
    if (!("speechSynthesis" in window)) return null;
    const voices = window.speechSynthesis.getVoices() || [];
    if (!voices.length) return null;
    // Preferred, in order: known high-quality UK voices, then any en-GB, then en.
    const byName = n => voices.find(v => v.name && v.name.toLowerCase().includes(n));
    const preferred =
      byName("google uk english female") ||
      byName("google uk english male") ||
      byName("daniel") ||      // Apple UK male
      byName("kate") ||        // Apple UK female
      byName("serena") ||      // Apple UK female
      byName("arthur") ||
      byName("sonia") ||       // Microsoft UK
      byName("libby") ||       // Microsoft UK
      byName("ryan") ||        // Microsoft UK
      voices.find(v => v.lang === "en-GB") ||
      voices.find(v => (v.lang || "").startsWith("en-GB")) ||
      voices.find(v => (v.lang || "").startsWith("en")) ||
      null;
    return preferred;
  } catch { return null; }
}

// Speak a word/phrase aloud using the browser's speech synthesis.
// `british` requests a natural UK English voice with conversational pacing.
// `handlers` may include { onstart, onend, onpause, onresume } for UI sync.
function speak(text, british = false, handlers = {}) {
  try {
    if (!("speechSynthesis" in window)) return false;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    if (british) {
      const v = pickBritishVoice();
      if (v) u.voice = v;
      u.lang = (v && v.lang) || "en-GB";
      u.rate = 0.92;   // unhurried, human cadence
      u.pitch = 1.02;  // slightly warm
    } else {
      u.lang = "en-US"; u.rate = 0.9; u.pitch = 1;
    }
    if (handlers.onstart)  u.onstart  = handlers.onstart;
    if (handlers.onend)    u.onend    = handlers.onend;
    if (handlers.onpause)  u.onpause  = handlers.onpause;
    if (handlers.onresume) u.onresume = handlers.onresume;
    if (handlers.onend)    u.onerror  = handlers.onend; // treat errors as "stopped"
    window.speechSynthesis.speak(u);
    return true;
  } catch { return false; }
}

function pauseSpeech()  { try { window.speechSynthesis?.pause();  } catch {} }
function resumeSpeech() { try { window.speechSynthesis?.resume(); } catch {} }
function stopSpeech()   { try { window.speechSynthesis?.cancel(); } catch {} }

// Warm up the voice list early so the first British playback isn't a US fallback.
if (typeof window !== "undefined" && "speechSynthesis" in window) {
  const warm = () => { _voiceCache = window.speechSynthesis.getVoices(); };
  warm();
  window.speechSynthesis.onvoiceschanged = warm;
}

// ── Speech recognition (shared) ───────────────────────────────────────────────
const SR_SUPPORTED = typeof window !== "undefined" &&
  ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

// Friendly message for each recognition error code.
function srErrorMessage(code) {
  switch (code) {
    case "not-allowed":
    case "service-not-allowed": return "Microphone access is blocked. Please allow microphone permission and try again.";
    case "audio-capture":       return "No microphone was found. Please connect a mic and try again.";
    case "no-speech":           return "Didn't catch any speech — please try speaking again.";
    case "network":             return "Network issue with speech recognition. Check your connection and retry.";
    case "aborted":             return null; // user/programmatic stop — not an error to show
    default:                    return "Speech recognition stopped unexpectedly. Please try again.";
  }
}

// Create a configured SpeechRecognition instance, or null if unsupported.
function createRecognition({ continuous = false, lang = "en-US" } = {}) {
  if (!SR_SUPPORTED) return null;
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const sr = new SR();
  sr.continuous = continuous;
  sr.interimResults = true;
  sr.lang = lang;
  sr.maxAlternatives = 1;
  return sr;
}

// Pronunciation button — tap to hear the word spoken
function SpeakBtn({ text, color = P.purple, showToast }) {
  const [active, setActive] = useState(false);
  function play(e) {
    e.stopPropagation();
    const ok = speak(text);
    if (!ok) { showToast?.("Pronunciation not supported here","error"); return; }
    setActive(true);
    setTimeout(() => setActive(false), Math.min(2500, 600 + text.length * 70));
  }
  return (
    <button onClick={play} title={`Pronounce "${text}"`} aria-label={`Pronounce ${text}`}
      style={{ width:30,height:30,borderRadius:8,border:`1.5px solid ${color}30`,background:active?color:`${color}12`,color:active?"#fff":color,fontSize:14,cursor:"pointer",display:"inline-flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all .15s",animation:active?"speakPulse .6s ease infinite":"none" }}>
      {active ? "🔊" : "🔈"}
    </button>
  );
}

function GCard({ children, grad, style: s = {} }) {
  return (
    <div style={{ borderRadius:18,padding:"1.5px",background:grad,boxShadow:"0 4px 24px rgba(0,0,0,.08)",...s }}>
      <div style={{ background:P.card,borderRadius:17,padding:"20px 22px",height:"100%" }}>{children}</div>
    </div>
  );
}

function PCard({ children, style: s = {} }) {
  return <div style={{ background:P.card,borderRadius:16,border:`1px solid ${P.g200}`,padding:"20px 22px",boxShadow:"0 2px 12px rgba(0,0,0,.04)",...s }}>{children}</div>;
}

function SLbl({ children, color }) {
  return <div style={{ fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:".09em",color:color||P.g400,marginBottom:8 }}>{children}</div>;
}

function CBadge({ children, color = "purple" }) {
  const c = TC[color] || TC.purple;
  return <span style={{ background:c.bg,color:c.text,fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:20,border:`1px solid ${c.text}25` }}>{children}</span>;
}

function GoodBox({ children }) {
  return (
    <div style={{ background:`linear-gradient(135deg,${P.green10},${P.teal10})`,border:`1px solid ${P.green}25`,borderRadius:10,padding:"14px 16px",fontSize:13,color:"#065F46",lineHeight:1.75,position:"relative" }}>
      <span style={{ position:"absolute",top:10,right:12,fontSize:16 }}>✨</span>{children}
    </div>
  );
}

function RawBox({ children }) {
  return <div style={{ background:P.g100,borderRadius:10,padding:"14px 16px",fontSize:13,color:P.g500,lineHeight:1.75,borderLeft:`3px solid ${P.g300}` }}>{children}</div>;
}

function Ring({ value, color, size = 60 }) {
  const r = (size - 8) / 2, c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} style={{ transform:"rotate(-90deg)" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={P.g100} strokeWidth={6}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={6} strokeDasharray={c} strokeDashoffset={c*(1-value/100)} strokeLinecap="round" style={{ transition:"stroke-dashoffset .7s ease" }}/>
    </svg>
  );
}

// ── Auth ──────────────────────────────────────────────────────────────────────
function FieldMsg({ state }) {
  if (!state || state.ok === null) return <div style={{ fontSize:11,minHeight:18,marginTop:5,color:P.g400,fontWeight:500 }}>{state?.hint || ""}</div>;
  return (
    <div style={{ fontSize:11,minHeight:18,marginTop:5,fontWeight:600,color:state.ok?P.green:P.red,display:"flex",alignItems:"center",gap:4,animation:"fadeIn .2s" }}>
      <span style={{ fontSize:13 }}>{state.ok ? "✓" : "✕"}</span>{state.msg}
    </div>
  );
}

function StrBar({ score, checks }) {
  if (!checks || !score) return null;
  const colors = ["","#EF4444","#F97316","#F59E0B","#10B981","#059669"];
  const labels = ["","Very Weak","Weak","Moderate","Good","Strong"];
  return (
    <div style={{ marginTop:8 }}>
      <div style={{ display:"flex",gap:3,marginBottom:5 }}>
        {[1,2,3,4,5].map(i => <div key={i} style={{ flex:1,height:4,borderRadius:2,background:i<=score?colors[score]:P.g200,transition:"background .3s" }}/>)}
      </div>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
        <span style={{ fontSize:10,color:colors[score],fontWeight:700 }}>{labels[score]||""}</span>
        <div style={{ display:"flex",gap:5 }}>
          {[["A–Z","upper"],["a–z","lower"],["0–9","num"],["!@#","sym"]].map(([l,k]) => (
            <span key={k} style={{ fontSize:9,padding:"2px 5px",borderRadius:4,background:checks[k]?P.green10:P.g100,color:checks[k]?P.greenD:P.g400,fontWeight:700,border:`1px solid ${checks[k]?P.green+"30":P.g200}` }}>{l}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function AuthPage({ onAuth, frozen }) {
  const [mode, setMode] = useState("login"); // "login" | "signup" | "forgot"
  const [form, setForm] = useState({ name:"", email:"", password:"", confirm:"" });
  const [touched, setTouched] = useState({});
  const [showPw, setShowPw] = useState(false);
  const [showCf, setShowCf] = useState(false);
  const [busy, setBusy] = useState(false);
  const [authErr, setAuthErr] = useState("");
  const [remember, setRemember] = useState(() => {
    try { return localStorage.getItem(REMEMBER_KEY) === "1"; } catch { return false; }
  });
  const [resetSent, setResetSent] = useState(false);

  // Prefill the remembered email so "Remember me" actually remembers something.
  useEffect(() => {
    try {
      const e = localStorage.getItem("leadspeak_remember_email") || "";
      if (e) setForm(f => ({ ...f, email:e }));
    } catch {}
  }, []);

  const vs = {
    name:    (touched.name    || form.name)    ? VRULES.name(form.name)                     : { ok:null,msg:"",hint:"Enter your first and last name" },
    email:   (touched.email   || form.email)   ? VRULES.email(form.email)                   : { ok:null,msg:"",hint:"We'll never share your email" },
    password:(touched.password|| form.password)? VRULES.password(form.password)             : { ok:null,msg:"",hint:"Minimum 8 characters required",score:0,checks:{} },
    confirm: (touched.confirm || form.confirm) ? VRULES.confirm(form.confirm,form.password) : { ok:null,msg:"",hint:"" },
  };

  const set = k => e => { setForm(f => ({...f,[k]:e.target.value})); setTouched(t => ({...t,[k]:true})); setAuthErr(""); };
  const blur = k => () => setTouched(t => ({...t,[k]:true}));
  const cls = k => { const s = vs[k]; if(s.ok===true) return "ok"; if(s.ok===false) return "err"; return ""; };

  const canSubmit = () => {
    if (mode === "forgot") return vs.email.ok===true && vs.password.ok===true && vs.confirm.ok===true;
    if (mode === "login") return vs.email.ok===true && form.password.length >= 1;
    return vs.name.ok===true && vs.email.ok===true && vs.password.ok===true && vs.confirm.ok===true;
  };

  function persistRememberEmail(email) {
    // Only manages the prefill email + remember flag; session persistence is
    // handled by the parent via saveSession(user, remember).
    try {
      if (remember) {
        localStorage.setItem(REMEMBER_KEY, "1");
        localStorage.setItem("leadspeak_remember_email", normEmail(email));
      } else {
        localStorage.removeItem("leadspeak_remember_email");
      }
    } catch {}
  }

  async function submit() {
    if (mode === "forgot") return doReset();
    setTouched({ name:true,email:true,password:true,confirm:true });
    if (!canSubmit()) return;
    setBusy(true); setAuthErr("");
    await new Promise(r => setTimeout(r, 500));

    if (mode === "signup") {
      // Create a real account; reject duplicate emails.
      const res = await registerAccount({ name:form.name, email:form.email, password:form.password });
      if (!res.ok) { setAuthErr(res.error); setBusy(false); return; }
      persistRememberEmail(form.email);
      onAuth(res.user, remember);
      setBusy(false);
      return;
    }

    // Login: strictly verify the email exists AND the password matches.
    const res = await verifyLogin({ email:form.email, password:form.password });
    if (!res.ok) { setAuthErr(res.error); setBusy(false); return; }
    persistRememberEmail(form.email);
    onAuth(res.user, remember);
    setBusy(false);
  }

  // In-app password reset: only works for an email that actually has an account.
  async function doReset() {
    setTouched({ email:true, password:true, confirm:true });
    if (!canSubmit()) return;
    setBusy(true); setAuthErr("");
    await new Promise(r => setTimeout(r, 500));
    if (!findAccount(form.email)) {
      setAuthErr("No account found with this email. Please sign up first.");
      setBusy(false); return;
    }
    const res = await updatePassword(form.email, form.password);
    if (!res.ok) { setAuthErr(res.error); setBusy(false); return; }
    setBusy(false); setResetSent(true);
  }

  const goMode = next => {
    setMode(next); setTouched({}); setAuthErr(""); setResetSent(false);
    if (next === "signup") setForm({ name:"",email:"",password:"",confirm:"" });
    else setForm(f => ({ name:"", email:f.email, password:"", confirm:"" }));
  };
  const sw = () => goMode(mode==="login" ? "signup" : "login");
  const pw = vs.password;

  return (
    <div style={{ minHeight:"100vh",minHeight:"100dvh",background:"linear-gradient(145deg,#0A0520,#150D3A,#1E0A4A)",display:"flex",alignItems:"center",justifyContent:"center",padding:"24px 20px",position:"relative",overflowX:"hidden",overflowY:"auto" }}>
      {/* Animated orbs */}
      {[["−10%","5%",300,P.purple,6],["-5%","72%",180,P.pink,9],["76%","-5%",240,P.teal,7],["80%","76%",160,P.amber,8]].map(([l,t,sz,c,d],i) => (
        <div key={i} style={{ position:"fixed",left:l,top:t,width:sz,height:sz,borderRadius:"50%",background:`radial-gradient(circle,${c}55,transparent 70%)`,animation:`orb ${d}s ease-in-out infinite alternate`,pointerEvents:"none" }}/>
      ))}
      <div style={{ position:"fixed",inset:0,backgroundImage:`linear-gradient(rgba(124,58,237,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(124,58,237,.05) 1px,transparent 1px)`,backgroundSize:"44px 44px",pointerEvents:"none" }}/>

      <div style={{ position:"relative",zIndex:1,width:"100%",maxWidth:420,animation:"fadeUp .4s ease" }}>
        <div className="ls-auth-card" style={{ background:"rgba(255,255,255,.97)",borderRadius:24,padding:"40px 36px",boxShadow:"0 32px 80px rgba(0,0,0,.45),0 0 0 1px rgba(255,255,255,.1)" }}>
          {/* Logo */}
          <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:28 }}>
            <div style={{ width:44,height:44,borderRadius:14,background:P.gradPurple,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,boxShadow:"0 6px 20px rgba(124,58,237,.4)" }}>👑</div>
            <div>
              <div style={{ fontSize:20,fontWeight:800,fontFamily:"'Plus Jakarta Sans',sans-serif",...gText(P.gradPurple) }}>LeadSpeak</div>
              <div style={{ fontSize:11,color:P.g400,fontWeight:500 }}>Leadership Communication Platform</div>
            </div>
          </div>

          {/* Frozen notice — visible to everyone, but only the admin can enter while frozen */}
          {frozen && (
            <div style={{ background:P.red10,border:`1.5px solid ${P.red}40`,borderRadius:10,padding:"11px 14px",marginBottom:20,fontSize:12.5,color:"#7F1D1D",lineHeight:1.6,display:"flex",gap:8,alignItems:"flex-start" }}>
              <span style={{ fontSize:15,lineHeight:1 }}>🔒</span>
              <span>The site is currently frozen by the administrator. Only the admin account can sign in until it's reopened.</span>
            </div>
          )}

          <h2 style={{ fontSize:24,fontWeight:800,color:P.g900,marginBottom:6 }}>{mode==="login"?"Welcome back 👋":mode==="signup"?"Create your account ✨":"Reset your password 🔑"}</h2>
          <p style={{ fontSize:13,color:P.g500,marginBottom:24,lineHeight:1.5 }}>{mode==="login"?"Sign in to continue building your leadership voice.":mode==="signup"?"Join thousands developing executive communication skills.":"Enter your account email and choose a new password."}</p>

          {authErr && (
            <div style={{ background:"#FEF2F2",border:"1.5px solid #FCA5A5",borderRadius:10,padding:"10px 14px",marginBottom:16,fontSize:13,color:"#991B1B",display:"flex",alignItems:"center",gap:8,animation:"fadeIn .2s" }}>
              ⚠️ {authErr}
            </div>
          )}

          {/* Name — signup only */}
          {mode==="signup" && (
            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:12,fontWeight:600,color:P.g700,display:"block",marginBottom:6 }}>Full name</label>
              <div style={{ position:"relative" }}>
                <input value={form.name} onChange={set("name")} onBlur={blur("name")} placeholder="Jordan Davis" className={`finput ${cls("name")}`}/>
                {vs.name.ok===true  && <span style={{ position:"absolute",right:13,top:"50%",transform:"translateY(-50%)",animation:"checkPop .25s ease" }}>✅</span>}
                {vs.name.ok===false && <span style={{ position:"absolute",right:13,top:"50%",transform:"translateY(-50%)" }}>❌</span>}
              </div>
              <FieldMsg state={vs.name}/>
            </div>
          )}

          {/* Email */}
          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:12,fontWeight:600,color:P.g700,display:"block",marginBottom:6 }}>Email address</label>
            <div style={{ position:"relative" }}>
              <input type="email" value={form.email} onChange={set("email")} onBlur={blur("email")} placeholder="you@company.com" className={`finput ${cls("email")}`}/>
              {vs.email.ok===true  && <span style={{ position:"absolute",right:13,top:"50%",transform:"translateY(-50%)",animation:"checkPop .25s ease" }}>✅</span>}
              {vs.email.ok===false && <span style={{ position:"absolute",right:13,top:"50%",transform:"translateY(-50%)" }}>❌</span>}
            </div>
            <FieldMsg state={vs.email}/>
          </div>

          {/* Reset confirmation (forgot mode) */}
          {mode==="forgot" && resetSent && (
            <div style={{ background:P.green10,border:`1.5px solid ${P.green}55`,borderRadius:10,padding:"12px 14px",marginBottom:18,fontSize:13,color:"#065F46",lineHeight:1.6,animation:"fadeIn .2s" }}>
              ✅ Password updated for <b>{form.email}</b>. You can now sign in with your new password.
              <div style={{ marginTop:10 }}>
                <span onClick={()=>goMode("login")} style={{ fontWeight:700,cursor:"pointer",...gText(P.gradPurple) }}>Go to sign in →</span>
              </div>
            </div>
          )}

          {/* Password (hidden only on the reset-success screen) */}
          {!(mode==="forgot" && resetSent) && (
          <div style={{ marginBottom: (mode==="signup"||mode==="forgot") ? 14 : 12 }}>
            <label style={{ fontSize:12,fontWeight:600,color:P.g700,display:"block",marginBottom:6 }}>{mode==="forgot"?"New password":"Password"}</label>
            <div style={{ position:"relative" }}>
              <input type={showPw?"text":"password"} value={form.password} onChange={set("password")} onBlur={blur("password")} placeholder={mode==="login"?"Enter your password":"Create a strong password"} className={`finput ${cls("password")}`}/>
              <button type="button" onClick={()=>setShowPw(s=>!s)} style={{ position:"absolute",right:13,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",fontSize:15,color:P.g400 }}>{showPw?"🙈":"👁"}</button>
            </div>
            <FieldMsg state={vs.password}/>
            {(mode==="signup"||mode==="forgot") && form.password && <StrBar score={pw.score||0} checks={pw.checks}/>}
          </div>
          )}

          {/* Confirm (signup + reset) */}
          {(mode==="signup" || (mode==="forgot" && !resetSent)) && (
            <div style={{ marginBottom:22 }}>
              <label style={{ fontSize:12,fontWeight:600,color:P.g700,display:"block",marginBottom:6 }}>Confirm {mode==="forgot"?"new ":""}password</label>
              <div style={{ position:"relative" }}>
                <input type={showCf?"text":"password"} value={form.confirm} onChange={set("confirm")} onBlur={blur("confirm")} placeholder="Repeat your password" className={`finput ${cls("confirm")}`}/>
                <button type="button" onClick={()=>setShowCf(s=>!s)} style={{ position:"absolute",right:13,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",fontSize:15,color:P.g400 }}>{showCf?"🙈":"👁"}</button>
              </div>
              <FieldMsg state={vs.confirm}/>
            </div>
          )}

          {/* Remember me + Forgot password (login only) */}
          {mode==="login" && (
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,marginBottom:20,marginTop:4 }}>
              <label style={{ display:"inline-flex",alignItems:"center",gap:9,cursor:"pointer",userSelect:"none",lineHeight:1 }}>
                <button type="button" role="checkbox" aria-checked={remember} aria-label="Remember me" onClick={()=>setRemember(r=>!r)}
                  style={{ width:18,height:18,minHeight:18,maxHeight:18,boxSizing:"border-box",borderRadius:5,border:`1.5px solid ${remember?P.purple:P.g300}`,background:remember?P.gradPurple:"#fff",cursor:"pointer",display:"inline-flex",alignItems:"center",justifyContent:"center",padding:0,flexShrink:0,lineHeight:0,transition:"all .15s" }}>
                  {remember && <span style={{ color:"#fff",fontSize:11,fontWeight:800,lineHeight:1 }}>✓</span>}
                </button>
                <span style={{ fontSize:12.5,color:P.g600,fontWeight:500 }}>Remember me</span>
              </label>
              <button type="button" onClick={()=>goMode("forgot")} style={{ background:"none",border:"none",cursor:"pointer",fontSize:12.5,fontWeight:700,padding:0,minHeight:0,fontFamily:"inherit",whiteSpace:"nowrap",...gText(P.gradPurple) }}>Forgot password?</button>
            </div>
          )}

          {/* Submit */}
          {!(mode==="forgot" && resetSent) && (
          <button onClick={submit} disabled={busy} style={{ width:"100%",padding:"14px",background:canSubmit()&&!busy?P.gradPurple:P.g200,color:canSubmit()&&!busy?"#fff":P.g400,border:"none",borderRadius:12,fontSize:15,fontWeight:700,cursor:busy||!canSubmit()?"not-allowed":"pointer",fontFamily:"inherit",transition:"all .2s",boxShadow:canSubmit()&&!busy?"0 6px 24px rgba(124,58,237,.35)":"none",display:"flex",alignItems:"center",justifyContent:"center",gap:8 }}>
            {busy
              ? <><Spin color="#fff"/> {mode==="login"?"Signing in…":mode==="signup"?"Creating account…":"Updating password…"}</>
              : mode==="login" ? "Sign in →" : mode==="signup" ? "Create account →" : "Update password →"}
          </button>
          )}

          {mode==="forgot" ? (
            <p style={{ textAlign:"center",fontSize:13,color:P.g400,margin:"18px 0 0" }}>
              Remember your password?{" "}
              <span onClick={()=>goMode("login")} style={{ fontWeight:700,cursor:"pointer",...gText(P.gradPurple) }}>Back to sign in</span>
            </p>
          ) : (
            <p style={{ textAlign:"center",fontSize:13,color:P.g400,margin:"18px 0 0" }}>
              {mode==="login" ? "Don't have an account? " : "Already have an account? "}
              <span onClick={sw} style={{ fontWeight:700,cursor:"pointer",...gText(P.gradPurple) }}>{mode==="login"?"Sign up free":"Sign in"}</span>
            </p>
          )}
        </div>

        <div style={{ display:"flex",justifyContent:"center",gap:20,marginTop:16 }}>
          {["🔒 Secure","✨ AI-Powered","🏆 Professional"].map(b => (
            <span key={b} style={{ fontSize:11,color:"rgba(255,255,255,.45)",fontWeight:500 }}>{b}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
function Sidebar({ page, onNav, user, onLogout, open, isAdmin, onAbout }) {
  return (
    <aside className={`ls-sidebar${open?" open":""}`} style={{ background:P.ink,display:"flex",flexDirection:"column",height:"100vh",height:"100dvh",overflow:"hidden" }}>
      <div style={{ position:"absolute",top:-80,left:-60,width:250,height:250,borderRadius:"50%",background:"radial-gradient(circle,rgba(124,58,237,.3),transparent 70%)",pointerEvents:"none" }}/>
      <div style={{ padding:"22px 18px 16px",borderBottom:"1px solid rgba(255,255,255,.08)",position:"relative" }}>
        <div style={{ display:"flex",alignItems:"center",gap:10 }}>
          <div style={{ width:36,height:36,borderRadius:11,background:P.gradPurple,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,boxShadow:"0 4px 12px rgba(124,58,237,.5)" }}>👑</div>
          <div style={{ fontSize:18,fontWeight:800,fontFamily:"'Plus Jakarta Sans',sans-serif",color:"#fff",flex:1 }}>LeadSpeak</div>
          {/* Close button (mobile drawer only) */}
          <button onClick={()=>onNav(page)} className="ls-close-btn" aria-label="Close menu" style={{ display:"none",width:32,height:32,borderRadius:8,border:"none",background:"rgba(255,255,255,.1)",color:"#fff",fontSize:16,cursor:"pointer" }}>✕</button>
        </div>
      </div>
      <nav style={{ flex:1,padding:"12px 0",overflowY:"auto",position:"relative" }}>
        <div style={{ fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:".1em",color:"rgba(255,255,255,.25)",padding:"8px 18px 10px" }}>Navigation</div>
        {NAV.filter(n => !n.adminOnly || isAdmin).map(n => {
          const active = page === n.id;
          return (
            <button key={n.id} onClick={() => onNav(n.id)} style={{ display:"flex",alignItems:"center",gap:10,width:"100%",padding:"10px 18px",background:active?"rgba(124,58,237,.25)":"transparent",color:active?"#fff":"rgba(255,255,255,.5)",fontWeight:active?600:400,fontSize:13,border:"none",cursor:"pointer",textAlign:"left",borderLeft:`3px solid ${active?"#7C3AED":"transparent"}`,transition:"all .15s",fontFamily:"inherit",position:"relative" }}>
              <span style={{ fontSize:15,width:20,textAlign:"center" }}>{n.icon}</span>
              <span>{n.label}</span>
              {active && <div style={{ position:"absolute",right:14,width:6,height:6,borderRadius:"50%",background:P.purple,boxShadow:`0 0 10px ${P.purple}` }}/>}
            </button>
          );
        })}
      </nav>
      <div style={{ padding:"14px 18px",borderTop:"1px solid rgba(255,255,255,.08)",position:"relative" }}>
        <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:12 }}>
          <div style={{ width:32,height:32,borderRadius:"50%",background:isAdmin?P.gradAmber:P.gradPink,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:"#fff",flexShrink:0 }}>{user?.name?.split(" ").map(w=>w[0]).join("").slice(0,2)}</div>
          <div style={{ flex:1,overflow:"hidden" }}>
            <div style={{ fontSize:12,fontWeight:600,color:"#fff",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",display:"flex",alignItems:"center",gap:5 }}>
              {user?.name}{isAdmin && <span style={{ fontSize:8,fontWeight:800,letterSpacing:".05em",color:"#fff",background:P.gradAmber,padding:"1px 6px",borderRadius:10,flexShrink:0 }}>ADMIN</span>}
            </div>
            <div style={{ fontSize:10,color:"rgba(255,255,255,.35)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{user?.email}</div>
          </div>
        </div>
        <button onClick={onAbout} style={{ width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"9px",marginBottom:8,background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.12)",borderRadius:10,color:"rgba(255,255,255,.8)",fontSize:12.5,fontWeight:600,cursor:"pointer",fontFamily:"inherit",transition:"all .15s" }}
          onMouseEnter={e=>{ e.currentTarget.style.background="rgba(124,58,237,.22)"; e.currentTarget.style.borderColor="rgba(124,58,237,.5)"; }}
          onMouseLeave={e=>{ e.currentTarget.style.background="rgba(255,255,255,.06)"; e.currentTarget.style.borderColor="rgba(255,255,255,.12)"; }}>
          <span style={{ fontSize:14 }}>ℹ️</span> About
        </button>
        <button onClick={onLogout} style={{ width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"10px",background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.12)",borderRadius:10,color:"rgba(255,255,255,.85)",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit",transition:"all .15s" }}
          onMouseEnter={e=>{ e.currentTarget.style.background="rgba(239,68,68,.18)"; e.currentTarget.style.borderColor="rgba(239,68,68,.45)"; }}
          onMouseLeave={e=>{ e.currentTarget.style.background="rgba(255,255,255,.06)"; e.currentTarget.style.borderColor="rgba(255,255,255,.12)"; }}>
          <span style={{ fontSize:15 }}>⇥</span> Log out
        </button>
      </div>
    </aside>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
function Dashboard({ store, onNav }) {
  const speeches  = store.savedSpeeches || [];
  const topics    = store.savedTopics || [];
  const sentences = store.savedSentences || [];
  const vocab     = store.savedVocab || [];
  const talks     = store.savedTalks || [];

  // Build confidence series from speech sessions (oldest → newest) for the trend chart
  const confSeries = speeches.map(s => Number(s.result?.confidence) || 0).filter(n => n > 0);
  const avgConf = confSeries.length ? Math.round(confSeries.reduce((a,b)=>a+b,0)/confSeries.length) : 0;
  const firstConf = confSeries[0] || 0;
  const lastConf  = confSeries[confSeries.length-1] || 0;
  const delta = confSeries.length >= 2 ? lastConf - firstConf : 0;

  // Speech quality score (0-100) — average of all session overall scores
  const speechScores = speeches.map(s => Number(s.result?.overallScore) || Math.round(((s.result?.clarity||0)+(s.result?.tone||0)+(s.result?.confidence||0)+(s.result?.structure||0))/4)).filter(n => n > 0);
  const speechQuality = speechScores.length ? Math.round(speechScores.reduce((a,b)=>a+b,0)/speechScores.length) : 0;

  // Activity engagement score (0-100) — rewards breadth of practice across every feature.
  // Each activity contributes up to a cap; reaching the cap = full marks for that area.
  const notesCount = (store.customNotes || []).length;
  const part = (count, cap) => Math.min(1, count / cap);
  const engagement = Math.round(100 * (
    part(topics.length,  5) * 0.20 +   // save topics
    part(notesCount,     5) * 0.25 +   // write custom notes
    part(vocab.length,   8) * 0.25 +   // build vocabulary
    part(talks.length,   4) * 0.15 +   // study talks
    part(speeches.length,3) * 0.15     // practice speeches (volume)
  ));

  // Overall rating across ALL activities. If speeches exist, blend quality + engagement;
  // otherwise the rating is based on engagement alone so it still reflects progress.
  const avgOverall = speechScores.length
    ? Math.round(speechQuality * 0.55 + engagement * 0.45)
    : engagement;
  const hasActivity = (topics.length + notesCount + vocab.length + talks.length + speeches.length) > 0;
  const ratingStars = avgOverall ? Math.round((avgOverall/100)*5*2)/2 : 0; // nearest 0.5

  const m = [
    { label:"Topics Saved",    value: topics.length,              grad:P.gradPurple, icon:"💡" },
    { label:"Custom Notes",    value:(store.customNotes||[]).length, grad:P.gradTeal, icon:"✍️" },
    { label:"Vocab Words",     value: vocab.length,               grad:P.gradGreen,  icon:"📖" },
    { label:"Speeches Saved",  value: speeches.length,            grad:P.gradCoral,  icon:"🎙" },
  ];

  // ── Storage usage tracker ──
  // Measure how much room each kind of saved content takes in the browser store.
  const notes = store.customNotes || [];
  const bytesOf = v => { try { return new Blob([JSON.stringify(v ?? [])]).size; } catch { return JSON.stringify(v ?? []).length; } };
  const STORAGE_QUOTA = 5 * 1024 * 1024; // 5 MB — typical localStorage budget per origin
  const storageParts = [
    { label:"Speech sessions", bytes:bytesOf(speeches), color:P.coral,  count:speeches.length },
    { label:"Custom notes",    bytes:bytesOf(notes),    color:P.teal,   count:notes.length },
    { label:"Saved topics",    bytes:bytesOf(topics),   color:P.purple, count:topics.length },
    { label:"Vocabulary",      bytes:bytesOf(vocab),    color:P.green,  count:vocab.length },
    { label:"Famous talks",    bytes:bytesOf(talks),    color:P.pink,   count:talks.length },
  ];
  const usedBytes = storageParts.reduce((a,b)=>a+b.bytes,0) + bytesOf(sentences) + bytesOf(store.customTalks||[]);
  const usedPct = Math.min(100, (usedBytes / STORAGE_QUOTA) * 100);
  const fmtBytes = b => b < 1024 ? `${b} B` : b < 1024*1024 ? `${(b/1024).toFixed(1)} KB` : `${(b/1024/1024).toFixed(2)} MB`;
  const storageColor = usedPct > 90 ? P.red : usedPct > 70 ? P.amber : P.green;

  // Per-activity contribution breakdown for the rating tooltip/legend
  const breakdown = [
    { label:"Speech quality", pct: speechQuality,            color:P.coral,  show: speechScores.length>0 },
    { label:"Topics",         pct: Math.round(part(topics.length,5)*100),   color:P.purple, show:true },
    { label:"Custom notes",   pct: Math.round(part(notesCount,5)*100),      color:P.teal,   show:true },
    { label:"Vocabulary",     pct: Math.round(part(vocab.length,8)*100),    color:P.green,  show:true },
    { label:"Talks",          pct: Math.round(part(talks.length,4)*100),    color:P.pink,   show:true },
  ].filter(b => b.show);

  // Mini sparkline for confidence trend (responsive — scales to container width)
  const Spark = ({ data, color }) => {
    if (!data.length) return null;
    const w = 240, h = 48, pad = 4;
    const max = 100, min = Math.min(...data, 40);
    const pts = data.map((v,i) => {
      const x = data.length===1 ? w/2 : pad + (i/(data.length-1))*(w-pad*2);
      const y = h - pad - ((v-min)/(max-min||1))*(h-pad*2);
      return [x,y];
    });
    const path = pts.map((p,i)=>(i?"L":"M")+p[0].toFixed(1)+" "+p[1].toFixed(1)).join(" ");
    return (
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display:"block",width:"100%",height:48 }}>
        <path d={`${path} L ${pts[pts.length-1][0].toFixed(1)} ${h} L ${pts[0][0].toFixed(1)} ${h} Z`} fill={color} opacity={0.12}/>
        <path d={path} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke"/>
        {pts.map((p,i)=><circle key={i} cx={p[0]} cy={p[1]} r={i===pts.length-1?4:2.5} fill={color}/>)}
      </svg>
    );
  };

  return (
    <div>
      <div style={{ marginBottom:24 }}>
        <h1 className="ls-h1" style={{ fontSize:28,fontWeight:800,fontFamily:"'Plus Jakarta Sans',sans-serif",letterSpacing:"-0.02em",margin:"0 0 4px",...gText(P.gradPurple) }}>Your Leadership Dashboard</h1>
        <p style={{ fontSize:13,color:P.g500,margin:0 }}>{new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"})}</p>
      </div>

      {/* Overall rating (all activities) + confidence improvement tracker */}
      <div style={{ borderRadius:18,padding:"1.5px",background:P.gradAmber,marginBottom:18 }}>
        <div className="dash-rating" style={{ background:"#fff",borderRadius:17,padding:"22px 24px",display:"flex",gap:24,alignItems:"center",flexWrap:"wrap" }}>
          {/* Overall rating ring + stars */}
          <div className="dash-rating-head" style={{ display:"flex",alignItems:"center",gap:16,minWidth:0 }}>
            <div style={{ position:"relative" }}>
              <Ring value={avgOverall} color={P.amber} size={88}/>
              <div style={{ position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center" }}>
                <div style={{ fontSize:22,fontWeight:800,...gText(P.gradAmber) }}>{hasActivity?avgOverall:"—"}</div>
                <div style={{ fontSize:8,color:P.g400,fontWeight:700 }}>OVERALL</div>
              </div>
            </div>
            <div>
              <SLbl color={P.amberD}>Overall Leadership Rating</SLbl>
              <div style={{ fontSize:18,letterSpacing:2,marginBottom:2 }}>
                {[1,2,3,4,5].map(i => (
                  <span key={i} style={{ color: i<=Math.floor(ratingStars) ? P.amber : (i-0.5===ratingStars ? P.amber : P.g200) }}>
                    {i-0.5===ratingStars ? "⯨" : "★"}
                  </span>
                ))}
              </div>
              <div style={{ fontSize:12,color:P.g500 }}>{hasActivity ? `${ratingStars} / 5 across all activities` : "Start any activity to begin tracking"}</div>
            </div>
          </div>

          {/* Activity breakdown bars */}
          <div className="rt-col" style={{ flex:1,minWidth:220,borderLeft:`1px solid ${P.g100}`,paddingLeft:24 }}>
            <SLbl color={P.amberD}>Rating breakdown</SLbl>
            {breakdown.map(b => (
              <div key={b.label} style={{ display:"flex",alignItems:"center",gap:10,marginBottom:7 }}>
                <span style={{ fontSize:11,color:P.g500,width:88,fontWeight:500 }}>{b.label}</span>
                <div style={{ flex:1,height:6,background:P.g100,borderRadius:3,overflow:"hidden" }}>
                  <div style={{ width:`${b.pct}%`,height:"100%",background:b.color,borderRadius:3,transition:"width .6s ease" }}/>
                </div>
                <span style={{ fontSize:11,fontWeight:700,color:b.color,width:34,textAlign:"right" }}>{b.pct}%</span>
              </div>
            ))}
          </div>

          {/* Confidence trend */}
          <div className="rt-col" style={{ flex:1,minWidth:260,borderLeft:`1px solid ${P.g100}`,paddingLeft:24 }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6 }}>
              <SLbl color={P.coralD}>Confidence Improvement</SLbl>
              {confSeries.length>=2 && (
                <span style={{ fontSize:12,fontWeight:700,padding:"3px 10px",borderRadius:20,background: delta>=0?P.green10:P.red10,color: delta>=0?P.greenD:P.red }}>
                  {delta>=0?"▲":"▼"} {Math.abs(delta)}% {delta>=0?"improved":"down"}
                </span>
              )}
            </div>
            {confSeries.length >= 2 ? (
              <>
                <Spark data={confSeries} color={P.coral}/>
                <div style={{ display:"flex",justifyContent:"space-between",gap:8,marginTop:6,flexWrap:"wrap" }}>
                  <span style={{ fontSize:11,color:P.g400 }}>Avg confidence: <b style={{ color:P.coralD }}>{avgConf}%</b></span>
                  <span style={{ fontSize:11,color:P.g400 }}>Latest: <b style={{ color:P.coralD }}>{lastConf}%</b></span>
                </div>
              </>
            ) : confSeries.length === 1 ? (
              <div style={{ display:"flex",alignItems:"center",gap:12,padding:"6px 0" }}>
                <div style={{ fontSize:26,fontWeight:800,...gText(P.gradCoral) }}>{lastConf}%</div>
                <div style={{ fontSize:12,color:P.g500,lineHeight:1.5 }}>First session logged.<br/>Record more to see your trend.</div>
              </div>
            ) : (
              <div style={{ fontSize:13,color:P.g400,padding:"8px 0" }}>
                Record a speech to track your confidence over time.
                <div style={{ marginTop:10 }}><GBtn onClick={()=>onNav("speech")} grad={P.gradCoral} size="sm">🎙 Practice now →</GBtn></div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid-4" style={{ marginBottom:22 }}>
        {m.map(x => (
          <div key={x.label} style={{ borderRadius:16,padding:"1.5px",background:x.grad }}>
            <div style={{ background:"#fff",borderRadius:15,padding:"16px 18px" }}>
              <div style={{ fontSize:22,marginBottom:6 }}>{x.icon}</div>
              <div style={{ fontSize:28,fontWeight:800,...gText(x.grad) }}>{x.value}</div>
              <div style={{ fontSize:11,color:P.g500,marginTop:2,fontWeight:500 }}>{x.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Storage usage tracker */}
      <PCard style={{ marginBottom:22 }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"baseline",flexWrap:"wrap",gap:8,marginBottom:14 }}>
          <div style={{ display:"flex",alignItems:"center",gap:8 }}>
            <span style={{ fontSize:16 }}>💾</span>
            <span style={{ fontSize:15,fontWeight:700,color:P.g900 }}>Storage Usage</span>
          </div>
          <div style={{ fontSize:12,color:P.g500 }}>
            <b style={{ color:storageColor }}>{fmtBytes(usedBytes)}</b> of {fmtBytes(STORAGE_QUOTA)} used · <b style={{ color:storageColor }}>{usedPct < 0.1 ? "<0.1" : usedPct.toFixed(1)}%</b>
          </div>
        </div>

        {/* Segmented usage bar */}
        <div style={{ display:"flex",height:12,borderRadius:8,overflow:"hidden",background:P.g100,marginBottom:14 }}>
          {usedBytes === 0 ? (
            <div style={{ flex:1,background:P.g100 }}/>
          ) : storageParts.filter(p=>p.bytes>0).map(p => (
            <div key={p.label} title={`${p.label}: ${fmtBytes(p.bytes)}`}
              style={{ width:`${(p.bytes/usedBytes)*Math.min(100,usedPct)}%`,minWidth:p.bytes>0?3:0,background:p.color,transition:"width .5s ease" }}/>
          ))}
        </div>

        {/* Category legend */}
        <div style={{ display:"flex",flexWrap:"wrap",gap:"8px 18px" }}>
          {storageParts.map(p => (
            <div key={p.label} style={{ display:"flex",alignItems:"center",gap:7 }}>
              <span style={{ width:9,height:9,borderRadius:3,background:p.color,flexShrink:0 }}/>
              <span style={{ fontSize:12,color:P.g600 }}>{p.label}</span>
              <span style={{ fontSize:11,color:P.g400 }}>· {fmtBytes(p.bytes)}{p.count?` (${p.count})`:""}</span>
            </div>
          ))}
        </div>

        {usedBytes === 0 && (
          <div style={{ fontSize:12,color:P.g400,marginTop:12 }}>Nothing saved yet — your saved sessions, notes, topics, vocabulary, and talks will show up here.</div>
        )}
        {usedPct > 70 && (
          <div style={{ fontSize:12,color:storageColor,marginTop:12,fontWeight:500 }}>
            ⚠️ You're using {usedPct.toFixed(0)}% of available storage. Delete older saved items to free up space.
          </div>
        )}
      </PCard>

      <div className="grid-2">
        <GCard grad={P.gradPurple}>
          <SLbl color={P.purpleD}>Today's Featured Topic</SLbl>
          <div style={{ fontSize:15,fontWeight:700,color:P.g900,marginBottom:6,lineHeight:1.4 }}>{SEED_TOPICS[0].title}</div>
          <p style={{ fontSize:13,color:P.g500,lineHeight:1.6,margin:"0 0 14px" }}>{SEED_TOPICS[0].explain}</p>
          <GBtn onClick={()=>onNav("topics")} grad={P.gradPurple} size="sm">Open Topics →</GBtn>
        </GCard>
        <GCard grad={P.gradTeal}>
          <SLbl color={P.tealD}>Quick Actions</SLbl>
          {[["🗣️ Practice Speak & Match","match"],["🎙 Practice a speech","speech"],["📖 Explore vocabulary","vocab"],["🎤 Famous talks","talks"]].map(([l,p]) => (
            <button key={p} onClick={()=>onNav(p)} style={{ display:"flex",alignItems:"center",gap:8,width:"100%",marginBottom:8,padding:"9px 12px",background:P.g50,border:`1px solid ${P.g200}`,borderRadius:10,fontSize:13,color:P.g700,cursor:"pointer",fontFamily:"inherit",fontWeight:500,textAlign:"left" }}>{l}</button>
          ))}
        </GCard>
        <GCard grad={P.gradPink} style={{ gridColumn:"1 / -1" }}>
          <SLbl color={P.pinkD}>Featured Talk</SLbl>
          <div style={{ display:"flex",gap:18,alignItems:"flex-start" }}>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:15,fontWeight:700,color:P.g900,marginBottom:4 }}>{TALKS[0].title}</div>
              <div style={{ fontSize:11,color:P.g400,fontWeight:500,marginBottom:8 }}>{TALKS[0].speaker}</div>
              <p style={{ fontSize:13,color:P.g500,lineHeight:1.65,margin:0 }}>{TALKS[0].story.replace(/\([^)]*\)/g,"").replace(/\s+/g," ").slice(0,170)}…</p>
            </div>
            <GBtn onClick={()=>onNav("talks")} grad={P.gradPink} size="sm">Explore →</GBtn>
          </div>
        </GCard>
      </div>
    </div>
  );
}

// ── Speak & Match ─────────────────────────────────────────────────────────────
// Dynamic practice sentences the user repeats aloud. Speech recognition scores
// each attempt; the status only turns green after 3 correct repetitions in a row.
// Curated leadership sentence bank, organized by difficulty (length & complexity).
const MATCH_BANK = {
  Beginner: [
    "Great work — thank you for your effort.",
    "Let's keep this simple and clear.",
    "I trust you to make the call.",
    "What do you need from me to succeed?",
    "We move forward together as a team.",
    "Tell me what's working and what isn't.",
    "I hear you, and I value your view.",
    "Let's focus on one goal today.",
    "You did this well — be proud.",
    "How can I help you grow?",
  ],
  Medium: [
    "Let's align on what success looks like before we begin.",
    "I trust your judgment — own this decision end to end.",
    "Thank you for raising that early; it's exactly what we need.",
    "Here's the why behind this change, and where we go from here.",
    "I want to be clear: raising a concern here is always valued.",
    "Your work on this directly moves our mission forward.",
    "Let's separate the people from the problem and find the shared goal.",
    "I don't have every answer, and that's okay; here's our next step.",
    "Let's turn this disagreement into a better decision together.",
    "I'd rather hear bad news early than be surprised later.",
  ],
  Hard: [
    "I won't pretend we have every answer, but our purpose hasn't changed and here is precisely what we do next.",
    "I'm handing you full ownership of this launch, not just a checklist, because I genuinely trust your judgment on how to get there.",
    "The market has shifted, and clinging to the old plan would fail the very customers we exist to serve.",
    "In this team, raising a problem is never punished — it is valued, and I'll go first by owning my own mistake.",
    "Before we begin, let's align on what success looks like, assign clear owners, and leave with one decision and no ambiguity.",
    "I want this conversation to be about you, not just your current role, so tell me where you genuinely want to be in two years.",
    "Our vision isn't a slogan on a wall; it's that every customer feels heard within a single, unhurried conversation.",
    "Specific, timely recognition fuels motivation far more than vague praise delivered weeks after the moment has passed.",
  ],
};
const MATCH_LEVELS = ["Beginner", "Medium", "Hard"];

// Normalize text for comparison: lowercase, strip punctuation, collapse spaces.
function normalizeSpeech(s) {
  return (s||"").toLowerCase().replace(/[^a-z0-9\s']/g," ").replace(/\s+/g," ").trim();
}
// Word-level similarity (0-100) between target and spoken attempt.
function matchScore(target, spoken) {
  const a = normalizeSpeech(target).split(" ").filter(Boolean);
  const b = normalizeSpeech(spoken).split(" ").filter(Boolean);
  if (!a.length || !b.length) return 0;
  const bCount = {};
  b.forEach(w => { bCount[w] = (bCount[w]||0) + 1; });
  let hit = 0;
  a.forEach(w => { if (bCount[w] > 0) { hit++; bCount[w]--; } });
  return Math.round((hit / a.length) * 100);
}

const MATCH_PASS = 80;   // % similarity that counts as a correct repetition
const MATCH_GOAL = 3;    // correct repetitions in a row to "master" the sentence

function SpeakMatchPage({ store, onSave, showToast }) {
  const [level, setLevel]       = useState("Medium");
  const [customTopic, setCustomTopic] = useState("");
  const [sentence, setSentence] = useState("");
  const [source, setSource]     = useState("");   // where the current sentence came from
  const [genLoad, setGenLoad]   = useState(false);
  const [listening, setListening] = useState(false);
  const [heard, setHeard]       = useState("");
  const [score, setScore]       = useState(null);   // last attempt score
  const [streak, setStreak]     = useState(0);       // consecutive passes
  const [attempts, setAttempts] = useState(0);
  const [expanded, setExpanded] = useState(null);
  const [spectrum, setSpectrum] = useState([]);      // live waveform bar levels (0-100)
  const [pitch, setPitch]       = useState(0);       // estimated dominant pitch (Hz)
  const bankIdxRef = useRef({});  // rotate through bank per level without immediate repeats
  const srRef = useRef(null);
  const actxRef = useRef(null);
  const analyRef = useRef(null);
  const rafRef = useRef(null);
  const streamRef = useRef(null);
  const saved = store.matchSentences || [];
  const mastered = streak >= MATCH_GOAL;
  const WAVE_BARS = 32;

  useEffect(() => {
    if (!sentence) nextFromBank("Medium", true);
    return () => { try { srRef.current?.stop(); } catch {} stopAudio(); };
    // eslint-disable-next-line
  }, []);

  // ── Live mic waveform (Web Audio API) — runs alongside speech recognition ──
  async function startAudio() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio:true });
      streamRef.current = stream;
      actxRef.current = new (window.AudioContext||window.webkitAudioContext)();
      const src = actxRef.current.createMediaStreamSource(stream);
      analyRef.current = actxRef.current.createAnalyser();
      analyRef.current.fftSize = 1024;
      analyRef.current.smoothingTimeConstant = 0.72;
      src.connect(analyRef.current);
      const bins = analyRef.current.frequencyBinCount;
      const data = new Uint8Array(bins);
      const sampleRate = actxRef.current.sampleRate || 44100;
      const hzPerBin = sampleRate / analyRef.current.fftSize;
      const maxBin = Math.min(bins, Math.floor(4000 / hzPerBin)); // voice band ~0–4kHz
      let last = 0;
      const tick = () => {
        if (!analyRef.current) return;
        analyRef.current.getByteFrequencyData(data);
        // Bin the voice-band frequencies into WAVE_BARS groups (log spacing → pitch-aware).
        const bars = new Array(WAVE_BARS).fill(0);
        for (let b=0; b<WAVE_BARS; b++) {
          const lo = Math.floor(Math.pow(b/WAVE_BARS, 1.6) * maxBin);
          const hi = Math.max(lo+1, Math.floor(Math.pow((b+1)/WAVE_BARS, 1.6) * maxBin));
          let peak = 0;
          for (let i=lo; i<hi && i<bins; i++) if (data[i] > peak) peak = data[i];
          bars[b] = Math.round((peak/255)*100);
        }
        // Dominant pitch = loudest bin in the voice band.
        let pb=0, pv=0;
        for (let i=1; i<maxBin; i++) if (data[i]>pv) { pv=data[i]; pb=i; }
        const now = performance.now();
        if (now - last > 33) { // ~30fps
          last = now;
          setSpectrum(bars);
          setPitch(pv > 30 ? Math.round(pb*hzPerBin) : 0);
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch(e) { /* mic unavailable — recognition may still work; waveform stays flat */ }
  }
  function stopAudio() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) { try { streamRef.current.getTracks().forEach(t=>t.stop()); } catch {} }
    if (actxRef.current) { try { actxRef.current.close(); } catch {} }
    analyRef.current = null; actxRef.current = null; streamRef.current = null;
    setSpectrum([]); setPitch(0);
  }

  function resetProgress() { setStreak(0); setScore(null); setHeard(""); setAttempts(0); }

  // Pick the next built-in sentence for a level, cycling so the user sees variety.
  function nextFromBank(lvl, silent) {
    const list = MATCH_BANK[lvl] || MATCH_BANK.Medium;
    const i = (bankIdxRef.current[lvl] ?? -1) + 1;
    bankIdxRef.current[lvl] = i % list.length;
    resetProgress();
    setSentence(list[i % list.length]);
    setSource(`${lvl} · built-in`);
    if (!silent) showToast(`New ${lvl.toLowerCase()} sentence`);
  }

  // Generate a fresh AI sentence at the chosen difficulty, optionally about a custom topic.
  async function genAI() {
    setGenLoad(true); resetProgress();
    const lengthHint = level === "Beginner" ? "6-10 words, simple everyday vocabulary"
      : level === "Hard" ? "20-32 words, with a couple of advanced words and a clear structure"
      : "10-18 words, natural and confident";
    const topicHint = customTopic.trim()
      ? `The sentence must be about: "${customTopic.trim()}".`
      : `Pick any useful leadership communication theme (feedback, vision, trust, conflict, recognition, etc.).`;
    try {
      const raw = await claude(`Generate ONE natural leadership sentence a leader might say out loud, for speaking practice.
Difficulty: ${level} (${lengthHint}).
${topicHint}
It must be easy to read aloud and grammatically clean. Return ONLY the sentence text — no quotes, no label, no extra words.`, 200);
      const clean = (raw||"").replace(/^["'\s]+|["'\s]+$/g,"").split("\n")[0].trim();
      if (!clean || clean.length < 6) throw new Error("bad");
      setSentence(clean);
      setSource(`${level} · AI${customTopic.trim()?` · "${customTopic.trim()}"`:""}`);
    } catch {
      const list = MATCH_BANK[level] || MATCH_BANK.Medium;
      setSentence(list[Math.floor(Math.random()*list.length)]);
      setSource(`${level} · built-in`);
      showToast("Showing a built-in sentence — AI unavailable","error");
    }
    setGenLoad(false);
  }

  function startListen() {
    if (!SR_SUPPORTED) {
      showToast("Speech recognition isn't supported in this browser","error"); return;
    }
    const sr = createRecognition({ continuous:false });
    if (!sr) { showToast("Speech recognition isn't available","error"); return; }
    srRef.current = sr;
    let finalText = "";
    let gotResult = false;
    setListening(true); setHeard(""); setScore(null);
    startAudio(); // begin live waveform
    sr.onresult = e => {
      gotResult = true;
      let interim = "";
      for (let i=e.resultIndex; i<e.results.length; i++) {
        if (e.results[i].isFinal) finalText += e.results[i][0].transcript + " ";
        else interim += e.results[i][0].transcript;
      }
      setHeard((finalText + interim).trim());
    };
    sr.onerror = ev => {
      const msg = srErrorMessage(ev.error);
      if (msg) showToast(msg, "error");
    };
    sr.onend = () => {
      setListening(false); stopAudio();
      const said = finalText.trim();
      if (!said) { if (gotResult) setScore(0); return; }
      const sc = matchScore(sentence, said);
      setScore(sc); setHeard(said); setAttempts(a => a+1);
      if (sc >= MATCH_PASS) {
        setStreak(s => {
          const ns = s + 1;
          if (ns >= MATCH_GOAL) showToast("Mastered! 3 correct in a row 🎉");
          return ns;
        });
      } else {
        setStreak(0); // a miss resets the streak
      }
    };
    try { sr.start(); }
    catch {
      // If it throws (e.g. called too soon after a prior stop), retry once.
      setTimeout(() => { try { sr.start(); } catch { setListening(false); stopAudio(); } }, 250);
    }
  }
  function stopListen() {
    if (srRef.current) { try { srRef.current.stop(); } catch {} }
    stopAudio(); setListening(false);
  }

  function save() {
    if (!sentence) return;
    if (saved.some(s => s.text === sentence)) { showToast("Already saved","error"); return; }
    const now = new Date();
    const entry = {
      id: Date.now(),
      title: sentence.length > 48 ? sentence.slice(0,48).trim()+"…" : sentence,
      text: sentence,
      level,
      topic: customTopic.trim() || source,
      bestStreak: streak,
      mastered,
      savedAtTime: now.toLocaleString("en-US",{ month:"short", day:"numeric", year:"numeric", hour:"numeric", minute:"2-digit" }),
    };
    onSave("matchSentences", [entry, ...saved]);
    showToast("Sentence saved 🔖");
  }
  function delSaved(id) {
    onSave("matchSentences", saved.filter(s => (s.id ?? -1) !== id));
    if (expanded === id) setExpanded(null);
    showToast("Sentence deleted");
  }

  // Status styling: grey idle → blue listening → amber close → green only when mastered.
  const status = mastered
    ? { color:P.green, bg:P.green10, label:`Mastered — ${streak}/${MATCH_GOAL} ✓`, icon:"✅" }
    : listening
    ? { color:P.blue, bg:P.blue10, label:"Listening… speak now", icon:"🎤" }
    : score === null
    ? { color:P.g400, bg:P.g50, label:"Tap Speak and repeat the sentence", icon:"🎙" }
    : score >= MATCH_PASS
    ? { color:P.amber, bg:P.amber10, label:`Correct! ${streak}/${MATCH_GOAL} in a row — keep going`, icon:"👍" }
    : { color:P.coral, bg:P.coral10, label:`${score}% match — try again, streak reset`, icon:"🔁" };

  const isSaved = saved.some(s => s.text === sentence);
  const levelColor = level==="Beginner"?P.green : level==="Hard"?P.coral : P.amber;
  const levelGrad  = level==="Beginner"?P.gradGreen : level==="Hard"?P.gradCoral : P.gradAmber;

  return (
    <div>
      <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:6 }}>
        <span style={{ fontSize:22 }}>🗣️</span>
        <h1 className="ls-h1" style={{ fontSize:24,fontWeight:800,fontFamily:"'Plus Jakarta Sans',sans-serif",letterSpacing:"-0.02em",margin:0,...gText(P.gradGreen) }}>Speak &amp; Match</h1>
      </div>
      <p style={{ fontSize:13,color:P.g500,margin:"0 0 18px" }}>Repeat each sentence aloud. Get it right <b>{MATCH_GOAL} times in a row</b> to turn the status green and master it. Pick a difficulty, practice the built-in leadership lines, or generate fresh AI sentences — even on your own topic.</p>

      {/* Difficulty level selector */}
      <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:14,flexWrap:"wrap" }}>
        <span style={{ fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:".06em",color:P.g400 }}>Difficulty</span>
        <div style={{ display:"flex",border:`1.5px solid ${P.g200}`,borderRadius:10,overflow:"hidden" }}>
          {MATCH_LEVELS.map((lv,i) => (
            <button key={lv} onClick={()=>{ setLevel(lv); nextFromBank(lv,true); }} style={{ padding:"7px 16px",fontSize:12,fontWeight:600,border:"none",borderLeft:i?`1px solid ${P.g200}`:"none",background:level===lv?(lv==="Beginner"?P.gradGreen:lv==="Hard"?P.gradCoral:P.gradAmber):"#fff",color:level===lv?"#fff":P.g500,cursor:"pointer",fontFamily:"inherit",transition:"all .15s" }}>{lv}</button>
          ))}
        </div>
      </div>

      {/* Custom topic input */}
      <div style={{ borderRadius:14,padding:"1.5px",background:levelGrad,marginBottom:18 }}>
        <div style={{ background:"#fff",borderRadius:13,padding:"16px 18px" }}>
          <SLbl color={levelColor}>Practice your own topic</SLbl>
          <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
            <input
              value={customTopic}
              onChange={e=>setCustomTopic(e.target.value)}
              onKeyDown={e=>{ if(e.key==="Enter"&&!genLoad) genAI(); }}
              placeholder="e.g. giving feedback, leading change, motivating a team…"
              style={{ flex:1,minWidth:200,padding:"11px 14px",border:`1.5px solid ${P.g200}`,borderRadius:10,fontSize:14,fontFamily:"inherit",outline:"none",boxSizing:"border-box" }}
            />
            <GBtn onClick={genAI} disabled={genLoad} grad={levelGrad}>{genLoad?<><Spin color="#fff"/> Generating…</>:"✨ Generate AI sentence"}</GBtn>
          </div>
          <div style={{ fontSize:11,color:P.g400,marginTop:8 }}>Leave the box empty to get a general leadership sentence at the chosen difficulty. Press Enter to generate.</div>
        </div>
      </div>

      <PCard style={{ marginBottom:18 }}>
        {/* Source + progress pips */}
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,marginBottom:12,flexWrap:"wrap" }}>
          {source && <span style={{ fontSize:11,fontWeight:700,color:levelColor,background:`${levelColor}14`,padding:"3px 10px",borderRadius:20,border:`1px solid ${levelColor}30` }}>{source}</span>}
          <span style={{ fontSize:12,fontWeight:700,color:mastered?P.green:P.g500,whiteSpace:"nowrap",marginLeft:"auto" }}>{Math.min(streak,MATCH_GOAL)}/{MATCH_GOAL} mastered</span>
        </div>
        <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:14 }}>
          {Array.from({length:MATCH_GOAL}).map((_,i)=>(
            <div key={i} style={{ flex:1,height:7,borderRadius:4,background:i<streak?(mastered?P.green:P.amber):P.g200,transition:"background .3s" }}/>
          ))}
        </div>

        {/* Target sentence */}
        {genLoad ? (
          <div style={{ background:P.g50,borderRadius:12,padding:"28px",textAlign:"center" }}>
            <Spin color={P.green} sz={6}/><div style={{ fontSize:12,color:P.g400,marginTop:8 }}>Generating a sentence…</div>
          </div>
        ) : (
          <div style={{ background:`linear-gradient(135deg,${P.green10},#fff)`,border:`2px solid ${mastered?P.green:P.g200}`,borderRadius:14,padding:"22px 24px",fontSize:18,fontWeight:600,color:P.g900,lineHeight:1.7,fontFamily:"'Plus Jakarta Sans',sans-serif",transition:"border-color .3s",position:"relative" }}>
            "{sentence}"
            {mastered && <span style={{ position:"absolute",top:10,right:14,fontSize:18 }}>✅</span>}
          </div>
        )}

        {/* Live waveform — reflects the user's voice (pitch & volume) while listening */}
        {listening && (
          <div style={{ marginTop:14,background:"linear-gradient(135deg,#0A0520,#150D3A,#0A0520)",borderRadius:14,padding:"16px 18px",border:"1px solid rgba(255,255,255,.08)" }}>
            <div style={{ display:"flex",alignItems:"center",justifyContent:"center",gap:3,height:64 }}>
              {Array.from({length:WAVE_BARS}).map((_,i)=>{
                const h = Math.max(6, Math.min(100, spectrum[i] ?? 6));
                const t = i/(WAVE_BARS-1);
                const c = t<0.33?P.teal : t<0.66?P.green : t<0.85?P.amber : P.coral;
                return (
                  <div key={i} style={{ flex:1,maxWidth:8,display:"flex",alignItems:"center",justifyContent:"center",height:"100%" }}>
                    <div style={{ width:"100%",height:`${h}%`,minHeight:4,borderRadius:4,background:`linear-gradient(180deg,${c},${c}55)`,boxShadow:h>55?`0 0 8px ${c}88`:"none",transition:"height .08s ease-out" }}/>
                  </div>
                );
              })}
            </div>
            <div style={{ display:"flex",justifyContent:"center",gap:6,marginTop:8,fontSize:10,fontWeight:600,letterSpacing:".05em",color:"rgba(255,255,255,.4)" }}>
              <span>PITCH</span>
              <span style={{ color:pitch?P.teal:"rgba(255,255,255,.25)" }}>{pitch?`${pitch} Hz`:"—"}</span>
              <span style={{ color:"rgba(255,255,255,.25)" }}>·</span>
              <span style={{ color:pitch?"#fff":"rgba(255,255,255,.25)" }}>{!pitch?"—":pitch<165?"Low":pitch<255?"Mid":"High"}</span>
            </div>
          </div>
        )}

        {/* Status line */}
        <div style={{ display:"flex",alignItems:"center",gap:10,marginTop:14,padding:"12px 16px",borderRadius:12,background:status.bg,border:`1px solid ${status.color}30`,transition:"all .25s" }}>
          <span style={{ fontSize:18 }}>{status.icon}</span>
          <span style={{ fontSize:13.5,fontWeight:700,color:status.color }}>{status.label}</span>
          {listening && <span style={{ marginLeft:"auto" }}><Spin color={P.blue} sz={6}/></span>}
        </div>

        {/* What we heard */}
        {heard && !listening && (
          <div style={{ marginTop:10,fontSize:12.5,color:P.g500,lineHeight:1.6 }}>
            <span style={{ fontWeight:700,color:P.g600 }}>You said:</span> "{heard}"
            {score !== null && <span style={{ marginLeft:8,fontWeight:700,color:status.color }}>· {score}% match</span>}
          </div>
        )}

        {/* Controls */}
        <div style={{ display:"flex",gap:8,marginTop:16,flexWrap:"wrap",alignItems:"center" }}>
          {listening ? (
            <GBtn onClick={stopListen} grad={P.gradCoral}>⏹ Stop</GBtn>
          ) : (
            <GBtn onClick={startListen} grad={P.gradGreen} disabled={genLoad||!sentence}>🎤 Speak</GBtn>
          )}
          <Ghost onClick={()=>speak(sentence, true)} color={P.greenD} size="sm" disabled={!sentence}>🔊 Hear it</Ghost>
          <Ghost onClick={()=>nextFromBank(level,false)} color={P.purpleD} size="sm" disabled={genLoad}>↻ Next sentence</Ghost>
          <div style={{ marginLeft:"auto",display:"flex",gap:8 }}>
            <GBtn onClick={save} grad={isSaved?P.gradGreen:P.gradPurple} size="sm">🔖 {isSaved?"Saved":"Save"}</GBtn>
          </div>
        </div>
        {attempts>0 && <div style={{ fontSize:11,color:P.g400,marginTop:10 }}>Attempts this sentence: {attempts}. A wrong repetition resets the streak to zero.</div>}
      </PCard>

      {/* Saved sentences — titles only, expand for details */}
      {saved.length>0 && (
        <PCard>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6 }}>
            <div style={{ fontSize:15,fontWeight:700,...gText(P.gradGreen) }}>🗣️ Saved Sentences ({saved.length})</div>
            <span style={{ fontSize:11,color:P.g400 }}>Tap a title to view details</span>
          </div>
          {saved.map((s,i) => {
            const sid = s.id ?? i;
            const isOpen = expanded === sid;
            return (
              <div key={sid} style={{ borderBottom:`1px solid ${P.g100}` }}>
                <div style={{ display:"flex",alignItems:"center",gap:10,padding:"12px 0" }}>
                  <button onClick={()=>setExpanded(isOpen?null:sid)} style={{ flex:1,minWidth:0,display:"flex",alignItems:"center",gap:10,background:"none",border:"none",cursor:"pointer",textAlign:"left",fontFamily:"inherit",padding:0 }}>
                    <span style={{ display:"inline-block",transform:isOpen?"rotate(90deg)":"none",transition:"transform .2s",color:P.green,fontSize:12,flexShrink:0 }}>▶</span>
                    <span style={{ flex:1,minWidth:0,fontSize:14,fontWeight:700,color:P.g900,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{s.title}{s.mastered?" ✅":""}</span>
                  </button>
                  <IBtn icon="🗑" onClick={()=>delSaved(sid)} danger title="Delete sentence"/>
                </div>
                {isOpen && (
                  <div style={{ padding:"2px 0 16px 22px",animation:"fadeIn .25s ease" }}>
                    <div style={{ background:`linear-gradient(135deg,${P.green10},#fff)`,border:`1px solid ${P.green}25`,borderRadius:12,padding:"14px 16px",fontSize:15,fontWeight:500,color:P.g900,lineHeight:1.7 }}>"{s.text}"</div>
                    <div style={{ fontSize:11,color:P.g400,marginTop:8 }}>
                      {s.level && <>{s.level} · </>}{s.topic && <>{s.topic} · </>}{s.savedAtTime}{s.mastered?" · Mastered ✓":""}
                    </div>
                    <div style={{ marginTop:10 }}>
                      <Ghost onClick={()=>speak(s.text, true)} color={P.greenD} size="sm">🔊 Hear it</Ghost>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </PCard>
      )}
    </div>
  );
}

// ── Topics (custom input + quick predefined picks) ────────────────────────────
const LEVELS = ["Beginner","Intermediate","Advanced"];

function TopicsPage({ store, onSave, showToast }) {
  const [topic, setTopic]     = useState(SEED_TOPICS[0]);
  const [customTopic, setCustomTopic] = useState("");
  const [genLoad, setGenLoad] = useState(false);
  const [scrLoad, setScrLoad] = useState(false);
  const [level, setLevel]     = useState("Intermediate");
  const [expanded, setExpanded] = useState(null);
  const saved = store.savedTopics || [];
  const tc = TC[topic.color] || TC.purple;

  // Auto-save a topic+script once, keyed by title (no duplicates, newest first).
  function autoSave(data) {
    const exists = (store.savedTopics||[]).some(t => t.title === data.title);
    if (exists) return;
    const entry = { ...data, savedAt:new Date().toLocaleDateString(), savedAtTime:new Date().toLocaleString("en-US",{ month:"short", day:"numeric", year:"numeric", hour:"numeric", minute:"2-digit" }) };
    onSave("savedTopics", [entry, ...(store.savedTopics||[])]);
  }

  // Generate a full leadership topic + script from the user's custom topic.
  async function genFromCustom() {
    const t = customTopic.trim();
    if (!t) { showToast("Enter a topic first","error"); return; }
    setGenLoad(true);
    try {
      const raw = await claude(`You are a world-class leadership communication coach. Build a practical leadership communication topic for a ${level} learner based on the user's topic: "${t}".
Return ONLY valid JSON (no markdown):
{
  "title": "Specific, actionable topic title (4-8 words) based on "${t}"",
  "tag": "One-word category (e.g. Feedback, Vision, Execution, Culture, Strategy, Conflict, Coaching, Negotiation)",
  "color": "One of: pink, purple, teal, green, coral, amber, blue",
  "level": "${level}",
  "explain": "2 sentences on why this matters, with a concrete real-world scenario.",
  "points": ["First actionable talking point", "Second distinct talking point", "Third practical talking point"],
  "script": "A 3-4 sentence script a real leader would say out loud about THIS exact topic. First person, specific, with a concrete example, ending in a call-to-action or question.",
  "mistake": "One common mistake leaders make on this topic, phrased as 'Don't ...'",
  "reflect": "One short self-reflection question for the learner."
}`, 1400);
      const data = JSON.parse(raw);
      if (!data.title || !data.script) throw new Error("bad");
      if (!Array.isArray(data.points)) data.points = [];
      setTopic(data);
      autoSave(data);
      showToast("Script generated & saved 🔖");
    } catch {
      showToast("Couldn't generate that — try rephrasing your topic","error");
    }
    setGenLoad(false);
  }

  // Quick-select a predefined topic.
  function pickSeed(s) { setTopic(s); }

  async function regenScript() {
    setScrLoad(true);
    try {
      const raw = await claude(`Write a leadership script for the topic: "${topic.title}"
Context: ${topic.explain}
Talking points: ${(topic.points||[]).join("; ")}
Audience level: ${topic.level||level}

Rules: 3-4 sentences, first-person speech, directly about "${topic.title}", include a concrete example, professional tone, end with engagement/action. Return ONLY the script text.`);
      setTopic(t => ({...t, script:raw.trim()}));
      showToast("Script rewritten ✨");
    } catch { showToast("Could not regenerate","error"); }
    setScrLoad(false);
  }

  function save() {
    if (saved.some(t => t.title===topic.title)) { showToast("Already saved","error"); return; }
    autoSave(topic);
    showToast("Topic saved 🔖");
  }
  function delSaved(idx) {
    onSave("savedTopics", (store.savedTopics||[]).filter((_,i)=>i!==idx));
    if (expanded === idx) setExpanded(null);
    showToast("Removed");
  }

  function copyScript() {
    const text = topic.script || "";
    try {
      if (navigator.clipboard?.writeText) { navigator.clipboard.writeText(text); showToast("Script copied 📋"); }
      else throw new Error();
    } catch { showToast("Copy not supported here","error"); }
  }

  const isSaved = saved.some(t => t.title===topic.title);

  return (
    <div>
      <div style={{ marginBottom:18 }}>
        <h1 className="ls-h1" style={{ fontSize:24,fontWeight:800,fontFamily:"'Plus Jakarta Sans',sans-serif",letterSpacing:"-0.02em",margin:"0 0 4px",...gText(P.gradAmber) }}>Daily Leadership Topics</h1>
        <p style={{ fontSize:13,color:P.g500,margin:0 }}>Enter your own topic to generate a leadership script, or pick a ready-made one below.</p>
      </div>

      {/* Custom topic input */}
      <div style={{ borderRadius:14,padding:"1.5px",background:P.gradAmber,marginBottom:14 }}>
        <div style={{ background:"#fff",borderRadius:13,padding:"16px 18px" }}>
          <SLbl color={P.amberD}>Your topic</SLbl>
          <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
            <input
              value={customTopic}
              onChange={e=>setCustomTopic(e.target.value)}
              onKeyDown={e=>{ if(e.key==="Enter"&&!genLoad) genFromCustom(); }}
              placeholder="e.g. Motivating a remote team, Handling a missed deadline…"
              style={{ flex:1,minWidth:220,padding:"11px 14px",border:`1.5px solid ${P.g200}`,borderRadius:10,fontSize:14,fontFamily:"inherit",outline:"none",boxSizing:"border-box" }}
            />
            <GBtn onClick={genFromCustom} disabled={genLoad} grad={P.gradAmber}>{genLoad?<><Spin color="#fff"/> Generating…</>:"✨ Generate script"}</GBtn>
          </div>
          {/* Difficulty level */}
          <div style={{ display:"flex",alignItems:"center",gap:10,marginTop:12,flexWrap:"wrap" }}>
            <span style={{ fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:".06em",color:P.g400 }}>Level</span>
            <div style={{ display:"flex",border:`1.5px solid ${P.g200}`,borderRadius:10,overflow:"hidden" }}>
              {LEVELS.map((lv,i) => (
                <button key={lv} onClick={()=>setLevel(lv)} style={{ padding:"6px 14px",fontSize:12,fontWeight:600,border:"none",borderLeft:i?`1px solid ${P.g200}`:"none",background:level===lv?P.gradAmber:"#fff",color:level===lv?"#fff":P.g500,cursor:"pointer",fontFamily:"inherit",transition:"all .15s" }}>{lv}</button>
              ))}
            </div>
            <span style={{ fontSize:11,color:P.g400 }}>Generated scripts auto-save below. Press Enter to generate.</span>
          </div>
        </div>
      </div>

      {/* Quick-select predefined topics */}
      <div style={{ marginBottom:18 }}>
        <SLbl>Quick picks</SLbl>
        <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
          {SEED_TOPICS.map(s => {
            const active = topic.title === s.title;
            const sc = TC[s.color] || TC.purple;
            return (
              <button key={s.title} onClick={()=>pickSeed(s)} style={{ padding:"6px 13px",borderRadius:20,fontSize:12,fontWeight:600,border:`1.5px solid ${active?sc.text:P.g200}`,background:active?sc.bg:"transparent",color:active?sc.text:P.g600,cursor:"pointer",fontFamily:"inherit",transition:"all .15s" }}>{s.title}</button>
            );
          })}
        </div>
      </div>

      {/* Topic hero */}
      {genLoad ? (
        <div style={{ borderRadius:20,padding:"40px",background:P.g50,border:`1px dashed ${P.g300}`,textAlign:"center",marginBottom:18 }}>
          <div style={{ marginBottom:12 }}><Spin color={P.amber} sz={8}/></div>
          <div style={{ fontSize:14,color:P.g500,fontWeight:500 }}>Generating a {level.toLowerCase()} leadership script…</div>
          <div style={{ fontSize:12,color:P.g400,marginTop:4 }}>Crafting the script, talking points, common mistake & reflection</div>
        </div>
      ) : (
        <div key={topic.title} style={{ animation:"slideIn .3s ease",borderRadius:20,padding:"1.5px",background:tc.grad,marginBottom:18,boxShadow:`0 8px 32px ${tc.text}22` }}>
          <div style={{ background:`linear-gradient(135deg,${tc.bg},#fff)`,borderRadius:19,padding:"26px 28px" }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:8 }}>
              <div style={{ display:"flex",gap:8,alignItems:"center" }}>
                <CBadge color={topic.color}>{topic.tag}</CBadge>
                {topic.level && <span style={{ fontSize:10,fontWeight:700,color:P.g500,background:P.g100,padding:"3px 9px",borderRadius:20 }}>{topic.level}</span>}
                <span style={{ fontSize:11,color:P.g400,fontWeight:500 }}>{SEED_TOPICS.some(s=>s.title===topic.title)?"📚 Quick pick":"✨ AI generated"}</span>
              </div>
              <span style={{ fontSize:11,color:P.g400,fontWeight:500 }}>{new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}</span>
            </div>
            <h2 style={{ fontSize:22,fontWeight:800,fontFamily:"'Plus Jakarta Sans',sans-serif",letterSpacing:"-0.02em",margin:"0 0 10px",color:P.g900 }}>{topic.title}</h2>
            <p style={{ fontSize:14,color:P.g700,lineHeight:1.75,margin:0 }}>{topic.explain}</p>
          </div>
        </div>
      )}

      {/* Custom Leadership Script — the centerpiece, with the Save button right here */}
      <div style={{ borderRadius:20,padding:"2px",background:tc.grad,marginBottom:18,boxShadow:`0 10px 36px ${tc.text}26` }}>
        <div style={{ background:"#fff",borderRadius:18,padding:"24px 26px" }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,marginBottom:14,flexWrap:"wrap" }}>
            <div style={{ display:"flex",alignItems:"center",gap:10 }}>
              <div style={{ width:38,height:38,borderRadius:11,background:tc.grad,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0 }}>🎯</div>
              <div>
                <div style={{ fontSize:17,fontWeight:800,fontFamily:"'Plus Jakarta Sans',sans-serif",...gText(tc.grad) }}>Leadership Script</div>
                <div style={{ fontSize:11,color:P.g400,fontWeight:500 }}>Tailored to "{topic.title}" — say it aloud</div>
              </div>
            </div>
            <GBtn onClick={save} grad={isSaved?P.gradGreen:P.gradPurple} size="sm">🔖 {isSaved?"Saved":"Save"}</GBtn>
          </div>
          {scrLoad ? (
            <div style={{ background:P.g50,borderRadius:12,padding:"32px",textAlign:"center" }}>
              <Spin color={tc.text} sz={7}/>
              <div style={{ fontSize:13,color:P.g400,marginTop:10 }}>Writing script for "{topic.title}"…</div>
            </div>
          ) : (
            <div style={{ background:`linear-gradient(135deg,${tc.bg},#fff)`,border:`1px solid ${tc.text}20`,borderRadius:14,padding:"22px 24px",fontSize:17,fontWeight:500,color:P.g900,lineHeight:1.85,borderLeft:`5px solid ${tc.text}`,fontFamily:"'Plus Jakarta Sans',sans-serif",animation:"fadeIn .4s ease" }}>
              "{topic.script}"
            </div>
          )}
          <div style={{ display:"flex",gap:6,flexWrap:"wrap",marginTop:14 }}>
            <Ghost onClick={()=>speak(topic.script||"", true)} color={tc.text} size="sm">🔊 Listen</Ghost>
            <Ghost onClick={copyScript} color={tc.text} size="sm">📋 Copy</Ghost>
            <Ghost onClick={regenScript} disabled={scrLoad||genLoad} color={tc.text} size="sm">{scrLoad?<Spin color={tc.text} sz={5}/>:"↻ Rewrite"}</Ghost>
          </div>
        </div>
      </div>

      {/* Talking points — supporting detail */}
      <PCard style={{ marginBottom:18 }}>
        <SLbl color={tc.text}>Key Talking Points</SLbl>
        {(topic.points||[]).map((pt,i) => (
          <div key={pt} style={{ display:"flex",gap:10,padding:"10px 0",borderBottom:`1px solid ${P.g100}`,fontSize:13,color:P.g700,lineHeight:1.5,animation:`slideIn .3s ${i*.08}s ease both` }}>
            <span style={{ width:20,height:20,borderRadius:6,background:tc.grad,color:"#fff",fontSize:10,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1 }}>{i+1}</span>
            {pt}
          </div>
        ))}
      </PCard>

      {/* Mistake to avoid + Reflection */}
      {(topic.mistake || topic.reflect) && (
        <div className="grid-2" style={{ marginBottom:18 }}>
          {topic.mistake && (
            <div style={{ background:P.red10,border:`1px solid ${P.red}25`,borderRadius:16,padding:"18px 20px" }}>
              <div style={{ fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:".07em",color:P.red,marginBottom:8 }}>⚠️ Common Mistake to Avoid</div>
              <p style={{ fontSize:13,color:"#7F1D1D",lineHeight:1.7,margin:0 }}>{topic.mistake}</p>
            </div>
          )}
          {topic.reflect && (
            <div style={{ background:P.blue10,border:`1px solid ${P.blue}25`,borderRadius:16,padding:"18px 20px" }}>
              <div style={{ fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:".07em",color:P.blueD,marginBottom:8 }}>🪞 Reflect On This</div>
              <p style={{ fontSize:13,color:"#1E3A8A",lineHeight:1.7,margin:0 }}>{topic.reflect}</p>
            </div>
          )}
        </div>
      )}

      {/* Saved topics — titles only, expand for details */}
      {saved.length>0 && (
        <PCard>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6 }}>
            <div style={{ fontSize:15,fontWeight:700,...gText(P.gradAmber) }}>💡 Saved Topics ({saved.length})</div>
            <span style={{ fontSize:11,color:P.g400 }}>Tap a title to view details</span>
          </div>
          {saved.map((t,i) => {
            const isOpen = expanded === i;
            const stc = TC[t.color] || TC.purple;
            return (
              <div key={i} style={{ borderBottom:`1px solid ${P.g100}` }}>
                <div style={{ display:"flex",alignItems:"center",gap:10,padding:"12px 0" }}>
                  <button onClick={()=>setExpanded(isOpen?null:i)} style={{ flex:1,minWidth:0,display:"flex",alignItems:"center",gap:10,background:"none",border:"none",cursor:"pointer",textAlign:"left",fontFamily:"inherit",padding:0 }}>
                    <span style={{ display:"inline-block",transform:isOpen?"rotate(90deg)":"none",transition:"transform .2s",color:stc.text,fontSize:12,flexShrink:0 }}>▶</span>
                    <span style={{ flex:1,minWidth:0 }}>
                      <span style={{ display:"block",fontSize:14,fontWeight:700,color:P.g900,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{t.title}</span>
                      <span style={{ display:"block",fontSize:11,color:P.g400,marginTop:2 }}>{t.savedAtTime || t.savedAt}</span>
                    </span>
                  </button>
                  <IBtn icon="🗑" onClick={()=>delSaved(i)} danger title="Delete topic"/>
                </div>
                {isOpen && (
                  <div style={{ padding:"2px 0 16px 22px",animation:"fadeIn .25s ease" }}>
                    {t.explain && <p style={{ fontSize:13,color:P.g600,lineHeight:1.6,margin:"0 0 10px" }}>{t.explain}</p>}
                    {t.script && (<><SLbl color={stc.text}>Leadership Script</SLbl>
                      <div style={{ background:`linear-gradient(135deg,${stc.bg},#fff)`,border:`1px solid ${stc.text}20`,borderRadius:12,padding:"14px 16px",fontSize:14,color:P.g900,lineHeight:1.7,borderLeft:`4px solid ${stc.text}` }}>"{t.script}"</div></>)}
                    <div style={{ marginTop:10 }}>
                      <Ghost onClick={()=>speak(t.script||"", true)} color={stc.text} size="sm">🔊 Listen</Ghost>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </PCard>
      )}
    </div>
  );
}

// ── Add Custom Topics ─────────────────────────────────────────────────────────
// Write notes in your own words → AI corrects grammar and polishes them into a
// leadership style, auto-generates a title, and saves with a date & time stamp.
function CustomTopicsPage({ store, onSave, showToast }) {
  const [input, setInput]   = useState("");
  const [result, setResult] = useState(null);
  const [load, setLoad]     = useState(false);
  const [expanded, setExpanded] = useState(null);
  const notes = store.customNotes || [];

  async function polish() {
    if (!input.trim()) { showToast("Write a note first","error"); return; }
    setLoad(true);
    try {
      const raw = await claude(`A user wrote rough notes in their own words. Correct the grammar and rewrite them in a polished, professional leadership style while keeping their original meaning and intent. Also generate a short 3-6 word title.

Return ONLY valid JSON:
{
  "title": "Short 3-6 word title for these notes",
  "original": "the user's input, unchanged",
  "polished": "grammar-corrected, leadership-style rewrite that preserves the original meaning",
  "notes": "1 short sentence on what you improved"
}
User notes: "${input.slice(0,1500)}"`, 1800);
      const parsed = JSON.parse(raw);
      if (!parsed.polished) throw new Error("bad");
      parsed.original = input;
      setResult(parsed);
      autoSave(parsed);
    } catch {
      const cleaned = input.replace(/\s{2,}/g," ").replace(/\s+([.,!?])/g,"$1").trim();
      const fb = { title:(input.trim().split(/\s+/).slice(0,5).join(" ")||"Custom note")+"…", original:input, polished:cleaned, notes:"Saved with light offline cleanup — AI unavailable." };
      setResult(fb); autoSave(fb);
      showToast("Saved offline — AI unavailable","error");
    }
    setLoad(false);
  }

  function autoSave(d) {
    const now = new Date();
    const entry = {
      id: Date.now(),
      title: (d.title || "Custom note").trim(),
      original: d.original || input,
      polished: d.polished || "",
      notes: d.notes || "",
      savedAt: now.toLocaleDateString(),
      savedAtTime: now.toLocaleString("en-US",{ month:"short", day:"numeric", year:"numeric", hour:"numeric", minute:"2-digit" }),
    };
    onSave("customNotes", [entry, ...notes]);
    showToast("Note saved ✍️");
  }

  function delNote(id) {
    onSave("customNotes", notes.filter(n => (n.id ?? -1) !== id));
    showToast("Note deleted");
  }

  return (
    <div>
      <h1 className="ls-h1" style={{ fontSize:24,fontWeight:800,fontFamily:"'Plus Jakarta Sans',sans-serif",letterSpacing:"-0.02em",margin:"0 0 6px",...gText(P.gradTeal) }}>Add Custom Topics</h1>
      <p style={{ fontSize:13,color:P.g500,margin:"0 0 22px" }}>Write notes in your own words. AI fixes the grammar, polishes them into a leadership style, titles them, and saves them to your history below.</p>

      <GCard grad={P.gradTeal} style={{ marginBottom:18 }}>
        <SLbl color={P.tealD}>Your notes</SLbl>
        <textarea value={input} onChange={e=>setInput(e.target.value)} placeholder="Jot down your idea however it comes out — e.g. 'we need to like get the team to own there work more and stop me checking everything'…" rows={5} style={{ width:"100%",padding:"12px 14px",border:`1.5px solid ${P.g200}`,borderRadius:10,fontSize:14,fontFamily:"inherit",resize:"vertical",outline:"none",color:P.g800,lineHeight:1.65,boxSizing:"border-box" }}/>
        <div style={{ display:"flex",gap:8,marginTop:12 }}>
          <GBtn onClick={polish} disabled={load} grad={P.gradTeal}>{load?<><Spin color="#fff"/> Polishing…</>:"✍️ Polish & Save"}</GBtn>
          <Ghost onClick={()=>{setInput("");setResult(null);}} color={P.amber} size="sm">Clear</Ghost>
        </div>
      </GCard>

      {result && (
        <PCard style={{ marginBottom:18 }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14 }}>
            <div style={{ fontSize:16,fontWeight:700,...gText(P.gradTeal) }}>{result.title}</div>
            <div style={{ display:"flex",alignItems:"center",gap:6,fontSize:12,fontWeight:700,color:P.greenD,background:P.green10,padding:"7px 12px",borderRadius:20,border:`1px solid ${P.green}30`,whiteSpace:"nowrap" }}>✓ Saved</div>
          </div>
          <SLbl>Your original note</SLbl><RawBox>{result.original}</RawBox>
          <div style={{ height:14 }}/>
          <SLbl color={P.greenD}>Polished — Leadership Style ✨</SLbl>
          <GoodBox>{result.polished}</GoodBox>
          {result.notes && <p style={{ fontSize:12,color:P.g400,margin:"12px 0 0",lineHeight:1.65 }}>ℹ️ {result.notes}</p>}
        </PCard>
      )}

      {/* History — compact list, titles only until expanded */}
      {notes.length > 0 && (
        <PCard>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6 }}>
            <div style={{ fontSize:15,fontWeight:700,...gText(P.gradTeal) }}>✍️ Saved Notes ({notes.length})</div>
            <span style={{ fontSize:11,color:P.g400 }}>Tap a title to view details</span>
          </div>
          {notes.map((n,i) => {
            const nid = n.id ?? i;
            const isOpen = expanded === nid;
            return (
              <div key={nid} style={{ borderBottom:`1px solid ${P.g100}` }}>
                <div style={{ display:"flex",alignItems:"center",gap:10,padding:"12px 0" }}>
                  <button onClick={()=>setExpanded(isOpen?null:nid)} style={{ flex:1,minWidth:0,display:"flex",alignItems:"center",gap:10,background:"none",border:"none",cursor:"pointer",textAlign:"left",fontFamily:"inherit",padding:0 }}>
                    <span style={{ display:"inline-block",transform:isOpen?"rotate(90deg)":"none",transition:"transform .2s",color:P.teal,fontSize:12,flexShrink:0 }}>▶</span>
                    <span style={{ flex:1,minWidth:0 }}>
                      <span style={{ display:"block",fontSize:14,fontWeight:700,color:P.g900,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{n.title || `Note ${i+1}`}</span>
                      <span style={{ display:"block",fontSize:11,color:P.g400,marginTop:2 }}>{n.savedAtTime || n.savedAt}</span>
                    </span>
                  </button>
                  <IBtn icon="🗑" onClick={()=>{ delNote(nid); if(isOpen) setExpanded(null); }} danger title="Delete note"/>
                </div>
                {isOpen && (
                  <div style={{ padding:"4px 0 16px 22px",animation:"fadeIn .25s ease" }}>
                    {n.original && (<><SLbl>Your original note</SLbl><RawBox>{n.original}</RawBox><div style={{ height:12 }}/></>)}
                    {n.polished && (<><SLbl color={P.greenD}>Polished — Leadership Style</SLbl><GoodBox>{n.polished}</GoodBox></>)}
                    {n.notes && <p style={{ fontSize:12,color:P.g400,margin:"10px 0 0",lineHeight:1.6 }}>ℹ️ {n.notes}</p>}
                  </div>
                )}
              </div>
            );
          })}
        </PCard>
      )}
    </div>
  );
}

// ── Vocabulary ────────────────────────────────────────────────────────────────
function VocabPage({ store, onSave, showToast }) {
  const [search, setSearch] = useState("");
  const [tab, setTab]       = useState("all");
  const [load, setLoad]     = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newWord, setNewWord] = useState("");
  const all = [...VOCAB_DEFAULT,...(store.savedVocab||[])].filter((v,i,a)=>a.findIndex(w=>w.word===v.word)===i);
  const disp = (tab==="saved"?(store.savedVocab||[]):all).filter(v=>v.word.toLowerCase().includes(search.toLowerCase())||v.meaning.toLowerCase().includes(search.toLowerCase()));
  const saveW = word => {
    const v = all.find(w=>w.word===word); if(!v) return;
    if ((store.savedVocab||[]).some(w=>w.word===word)) { showToast("Already saved","error"); return; }
    onSave("savedVocab",[...(store.savedVocab||[]),v]); showToast(`"${word}" saved 📖`);
  };
  const delW = word => { onSave("savedVocab",(store.savedVocab||[]).filter(w=>w.word!==word)); showToast(`"${word}" removed`); };

  function addEntry(entry) {
    if ((store.savedVocab||[]).some(w=>w.word.toLowerCase()===entry.word.toLowerCase())) {
      showToast(`"${entry.word}" already exists`,"error"); return;
    }
    onSave("savedVocab",[...(store.savedVocab||[]),entry]);
    setTab("saved"); setShowAdd(false); setNewWord("");
    showToast(`"${entry.word}" added ✅`);
  }

  async function generateWord() {
    const w = newWord.trim();
    if (!w) { showToast("Type a word first","error"); return; }
    setLoad(true);
    const colors = ["pink","purple","teal","green","coral","amber"];
    try {
      const raw = await claude(`Create a leadership vocabulary entry for the word "${w}". Respond with ONLY valid JSON, no other text: {"word":"${w}","meaning":"one clear sentence","synonyms":["syn1","syn2","syn3"],"examples":["sentence 1","sentence 2","sentence 3"]}`);
      let entry;
      try { entry = JSON.parse(raw); } catch { entry = null; }
      if (!entry || !entry.word || !entry.meaning) throw new Error("bad");
      entry.color = colors[Math.floor(Math.random()*colors.length)];
      entry.synonyms = (Array.isArray(entry.synonyms)?entry.synonyms:[]).map(s=>typeof s==="string"?s:(s?.word||s?.synonym||"")).filter(Boolean);
      entry.examples = (Array.isArray(entry.examples)?entry.examples:[]).map(e=>typeof e==="string"?e:(e?.sentence||e?.example||e?.text||"")).filter(Boolean);
      addEntry(entry);
    } catch {
      // Fallback — create a basic entry manually so Add Word always works
      addEntry({
        word: w.charAt(0).toUpperCase()+w.slice(1),
        meaning: `A key leadership quality related to ${w}.`,
        synonyms: ["Leadership","Skill","Strength"],
        examples: [`A great leader demonstrates ${w} daily.`, `We value ${w} on this team.`, `${w.charAt(0).toUpperCase()+w.slice(1)} builds trust.`],
        color: colors[Math.floor(Math.random()*colors.length)],
      });
      showToast("Added (offline mode — AI unavailable)");
    }
    setLoad(false);
  }

  const tabSt = active => ({ padding:"8px 18px",fontSize:13,fontWeight:active?700:500,color:active?P.purple:P.g400,borderBottom:`2px solid ${active?P.purple:"transparent"}`,cursor:"pointer",background:"none",border:"none",borderBottomWidth:2,borderBottomStyle:"solid",borderBottomColor:active?P.purple:"transparent",fontFamily:"inherit" });
  return (
    <div>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,flexWrap:"wrap",gap:12 }}>
        <h1 className="ls-h1" style={{ fontSize:24,fontWeight:800,fontFamily:"'Plus Jakarta Sans',sans-serif",letterSpacing:"-0.02em",margin:0,...gText(P.gradGreen) }}>Leadership Vocabulary</h1>
        <GBtn onClick={()=>setShowAdd(s=>!s)} grad={P.gradGreen}>{showAdd ? "✕ Close" : "+ Add Word"}</GBtn>
      </div>

      {/* Inline Add Word panel (replaces window.prompt which is blocked in sandboxed frames) */}
      {showAdd && (
        <div style={{ borderRadius:16,padding:"1.5px",background:P.gradGreen,marginBottom:16,animation:"fadeUp .25s ease" }}>
          <div style={{ background:"#fff",borderRadius:15,padding:"18px 20px" }}>
            <SLbl color={P.greenD}>Add a new word</SLbl>
            <div style={{ display:"flex",gap:8 }}>
              <input
                value={newWord}
                onChange={e=>setNewWord(e.target.value)}
                onKeyDown={e=>{ if(e.key==="Enter"&&!load) generateWord(); }}
                placeholder="e.g. Influence, Decisiveness, Charisma…"
                autoFocus
                style={{ flex:1,padding:"11px 14px",border:`1.5px solid ${P.g200}`,borderRadius:10,fontSize:14,fontFamily:"inherit",outline:"none",boxSizing:"border-box" }}
              />
              <GBtn onClick={generateWord} disabled={load} grad={P.gradGreen}>{load?<><Spin color="#fff"/> Generating…</>:"✨ Generate"}</GBtn>
            </div>
            <div style={{ fontSize:11,color:P.g400,marginTop:8 }}>AI fills in the meaning, synonyms, and examples automatically. Press Enter to generate.</div>
          </div>
        </div>
      )}

      <PCard>
        <div style={{ position:"relative",marginBottom:14 }}>
          <span style={{ position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:15,color:P.g400 }}>🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search words…" style={{ width:"100%",padding:"10px 14px 10px 36px",border:`1.5px solid ${P.g200}`,borderRadius:10,fontSize:13,fontFamily:"inherit",outline:"none",boxSizing:"border-box" }}/>
        </div>
        <div style={{ display:"flex",borderBottom:`1px solid ${P.g200}`,marginBottom:4 }}>
          <button onClick={()=>setTab("all")} style={tabSt(tab==="all")}>All words ({all.length})</button>
          <button onClick={()=>setTab("saved")} style={tabSt(tab==="saved")}>My words ({store.savedVocab?.length||0})</button>
        </div>
        {disp.length===0 ? <div style={{ textAlign:"center",padding:"40px 0",color:P.g400 }}>{tab==="saved"?"No saved words yet — add one above or save from the full list.":"No words found."}</div>
          : disp.map(v => {
            const t = TC[v.color]||TC.purple;
            const sv = (store.savedVocab||[]).some(w=>w.word===v.word);
            // Normalize synonyms/examples — AI may return strings, objects, or nested arrays
            const syns = (Array.isArray(v.synonyms)?v.synonyms:[])
              .map(s => typeof s==="string" ? s : (s?.word || s?.synonym || s?.simple || ""))
              .filter(Boolean);
            const exs = (Array.isArray(v.examples)?v.examples:[])
              .map(e => typeof e==="string" ? e : (e?.sentence || e?.example || e?.text || ""))
              .filter(Boolean);
            return (
              <div key={v.word} style={{ padding:"16px 0",borderBottom:`1px solid ${P.g100}`,display:"flex",gap:14 }}>
                <div style={{ width:4,flexShrink:0,borderRadius:4,background:t.grad }}/>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:5 }}>
                    <div style={{ fontSize:17,fontWeight:800,...gText(t.grad) }}>{v.word}</div>
                    <SpeakBtn text={v.word} color={t.text} showToast={showToast}/>
                  </div>
                  <div style={{ fontSize:13,color:P.g700,marginBottom:10,lineHeight:1.5 }}>{v.meaning}</div>

                  {exs.length>0 && (
                    <div style={{ marginBottom:10 }}>
                      <div style={{ fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:".07em",color:t.text,marginBottom:4 }}>Example sentences</div>
                      {exs.slice(0,3).map((ex,i)=>(
                        <div key={i} style={{ fontSize:12.5,color:P.g600,fontStyle:"italic",margin:"3px 0",paddingLeft:12,borderLeft:`2px solid ${t.text}30`,lineHeight:1.5 }}>"{ex}"</div>
                      ))}
                    </div>
                  )}

                  {syns.length>0 && (
                    <div>
                      <div style={{ fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:".07em",color:t.text,marginBottom:5 }}>Synonyms</div>
                      <div style={{ display:"flex",flexWrap:"wrap",gap:6 }}>
                        {syns.map((s,i)=>(
                          <span key={i} style={{ fontSize:12,fontWeight:600,color:t.text,background:t.bg,padding:"3px 10px",borderRadius:20,border:`1px solid ${t.text}25` }}>{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div style={{ display:"flex",gap:5,alignSelf:"flex-start" }}>
                  {!sv && <IBtn icon="🔖" onClick={()=>saveW(v.word)} title="Save"/>}
                  {sv  && <IBtn icon="🗑" onClick={()=>delW(v.word)} title="Remove" danger/>}
                </div>
              </div>
            );
          })
        }
      </PCard>
    </div>
  );
}

// ── SpeechMeter component ─────────────────────────────────────────────────────
function SpeechMeter({ recording, volume, wpm, duration, wordCount, sentenceCount, spectrum = [], pitch = 0 }) {
  const BARS = 28;
  const fmt = s => `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;
  const vol = Math.min(100, Math.max(0, volume));
  const volColor = vol>75?P.red : vol>40?P.green : vol>15?P.amber : "#ffffff30";
  // Reactive bar heights: use live spectrum while recording; idle = gentle flat line.
  const levels = Array.from({length:BARS},(_,i)=> {
    if (!recording) return 10;
    const v = spectrum[i];
    return typeof v === "number" ? Math.max(6, Math.min(100, v)) : 6;
  });
  // Pitch label for the human voice range.
  const pitchLabel = !recording || !pitch ? "—"
    : pitch < 165 ? "Low" : pitch < 255 ? "Mid" : "High";

  return (
    <div style={{ background:"linear-gradient(135deg,#0A0520,#150D3A,#0A0520)",borderRadius:20,padding:"24px 28px",color:"#fff",border:"1px solid rgba(255,255,255,.08)" }}>
      {/* Top row */}
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18 }}>
        <div style={{ display:"flex",alignItems:"center",gap:10 }}>
          <div style={{ width:10,height:10,borderRadius:"50%",background:recording?P.red:"rgba(255,255,255,.2)",animation:recording?"recPulse 1.2s infinite":"none" }}/>
          <span style={{ fontSize:12,fontWeight:700,letterSpacing:".06em",color:recording?"#fff":"rgba(255,255,255,.4)" }}>{recording?"● RECORDING":"○ READY"}</span>
        </div>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:30,fontWeight:800,fontFamily:"'Plus Jakarta Sans',sans-serif",letterSpacing:3,color:"#fff" }}>{fmt(duration)}</div>
          <div style={{ fontSize:9,color:"rgba(255,255,255,.35)",fontWeight:600,letterSpacing:".08em" }}>ELAPSED</div>
        </div>
        <div style={{ textAlign:"right" }}>
          <div style={{ fontSize:22,fontWeight:800,color:wpm>0?P.teal:"rgba(255,255,255,.25)" }}>{wpm}</div>
          <div style={{ fontSize:9,color:"rgba(255,255,255,.35)",fontWeight:600 }}>WPM</div>
        </div>
      </div>

      {/* Reactive waveform — bars rise and fall with the pitch & volume of your voice */}
      <div style={{ display:"flex",alignItems:"center",justifyContent:"center",gap:3,height:72,marginBottom:8 }}>
        {levels.map((h,i) => {
          // Color shifts across the spectrum: low freq → teal, mid → green, high → amber/coral.
          const t = i / (BARS - 1);
          const barColor = recording
            ? (t < 0.33 ? P.teal : t < 0.66 ? P.green : t < 0.85 ? P.amber : P.coral)
            : "rgba(255,255,255,.12)";
          return (
            <div key={i} style={{ flex:1,maxWidth:9,display:"flex",alignItems:"center",justifyContent:"center",height:"100%" }}>
              <div style={{ width:"100%",height:`${h}%`,minHeight:4,borderRadius:4,background:recording?`linear-gradient(180deg,${barColor},${barColor}55)`:"rgba(255,255,255,.12)",boxShadow:recording&&h>55?`0 0 8px ${barColor}88`:"none",transition:"height .09s ease-out" }}/>
            </div>
          );
        })}
      </div>
      {/* Pitch readout under the waveform */}
      <div style={{ display:"flex",justifyContent:"center",gap:6,marginBottom:16,fontSize:10,fontWeight:600,letterSpacing:".05em",color:"rgba(255,255,255,.4)" }}>
        <span>PITCH</span>
        <span style={{ color:recording&&pitch?P.teal:"rgba(255,255,255,.25)" }}>{recording&&pitch?`${pitch} Hz`:"—"}</span>
        <span style={{ color:"rgba(255,255,255,.25)" }}>·</span>
        <span style={{ color:recording&&pitch?"#fff":"rgba(255,255,255,.25)" }}>{pitchLabel}</span>
      </div>

      {/* Volume bar */}
      <div style={{ marginBottom:16 }}>
        <div style={{ display:"flex",justifyContent:"space-between",marginBottom:5 }}>
          <span style={{ fontSize:9,fontWeight:700,color:"rgba(255,255,255,.35)",letterSpacing:".07em" }}>VOICE LEVEL</span>
          <span style={{ fontSize:11,fontWeight:800,color:volColor }}>{Math.round(vol)}%</span>
        </div>
        <div style={{ height:6,background:"rgba(255,255,255,.1)",borderRadius:3,overflow:"hidden" }}>
          <div style={{ height:"100%",width:`${vol}%`,background:`linear-gradient(90deg,${P.green},${vol>75?P.red:vol>40?P.amber:P.green})`,borderRadius:3,transition:"width .1s ease" }}/>
        </div>
        <div style={{ display:"flex",justifyContent:"space-between",marginTop:3 }}>
          {["Too quiet","Ideal range","Too loud"].map(l=><span key={l} style={{ fontSize:8,color:"rgba(255,255,255,.2)" }}>{l}</span>)}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid-4" style={{ gap:8 }}>
        {[{l:"Words",v:wordCount,c:P.purple},{l:"Sentences",v:sentenceCount,c:P.teal},{l:"Duration",v:fmt(duration),c:P.amber},{l:"Est. WPM",v:wpm,c:P.green}].map(s=>(
          <div key={s.l} style={{ background:"rgba(255,255,255,.05)",borderRadius:10,padding:"10px",textAlign:"center",border:"1px solid rgba(255,255,255,.06)" }}>
            <div style={{ fontSize:16,fontWeight:800,color:s.c }}>{s.v}</div>
            <div style={{ fontSize:9,color:"rgba(255,255,255,.3)",fontWeight:600,marginTop:2 }}>{s.l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Speech Practice ───────────────────────────────────────────────────────────
function SpeechPage({ store, onSave, showToast }) {
  const [recording, setRecording]   = useState(false);
  const [time, setTime]             = useState(0);
  const [vol, setVol]               = useState(0);
  const [wpm, setWpm]               = useState(0);
  const [spectrum, setSpectrum]     = useState([]); // per-bar levels (0-100), reactive to voice
  const [pitch, setPitch]           = useState(0);  // estimated dominant pitch (Hz)
  const [transcript, setTranscript] = useState("");
  const [polished, setPolished]     = useState("");
  const [result, setResult]         = useState(null);
  const [phase, setPhase]           = useState("idle");
  const [expandedSession, setExpandedSession] = useState(null);
  const timerRef  = useRef(null);
  const srRef     = useRef(null);
  const actxRef   = useRef(null);
  const analyRef  = useRef(null);
  const rafRef    = useRef(null);
  const transcRef = useRef("");
  const timeRef   = useRef(0);
  const finalRef  = useRef("");      // accumulated final transcript across restarts
  const recActiveRef = useRef(false); // true while the user is recording

  useEffect(() => { transcRef.current = transcript; }, [transcript]);
  useEffect(() => { timeRef.current = time; }, [time]);

  const NUM_BARS = 28; // waveform resolution

  async function startAudio() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({audio:true});
      actxRef.current = new (window.AudioContext||window.webkitAudioContext)();
      const src = actxRef.current.createMediaStreamSource(stream);
      analyRef.current = actxRef.current.createAnalyser();
      analyRef.current.fftSize = 1024;            // finer frequency resolution for pitch
      analyRef.current.smoothingTimeConstant = 0.75;
      src.connect(analyRef.current);
      const bins = analyRef.current.frequencyBinCount;
      const data = new Uint8Array(bins);
      const sampleRate = actxRef.current.sampleRate || 44100;
      const hzPerBin = sampleRate / analyRef.current.fftSize;
      // Use a sub-range of bins covering the human voice band (~80–4000 Hz).
      const maxBin = Math.min(bins, Math.floor(4000 / hzPerBin));
      let lastPush = 0;
      const tick = () => {
        if (!analyRef.current) return;
        analyRef.current.getByteFrequencyData(data);

        // Overall loudness (volume).
        let sum = 0;
        for (let i = 0; i < bins; i++) sum += data[i];
        const avg = sum / bins;
        setVol(Math.min(100, avg / 128 * 100));

        // Bin the voice-band frequencies into NUM_BARS groups → reactive waveform.
        // Logarithmic grouping so low/mid voice frequencies get more bars (where pitch lives).
        const bars = new Array(NUM_BARS).fill(0);
        for (let b = 0; b < NUM_BARS; b++) {
          const lo = Math.floor(Math.pow(b / NUM_BARS, 1.6) * maxBin);
          const hi = Math.max(lo + 1, Math.floor(Math.pow((b + 1) / NUM_BARS, 1.6) * maxBin));
          let peak = 0;
          for (let i = lo; i < hi && i < bins; i++) if (data[i] > peak) peak = data[i];
          bars[b] = Math.round((peak / 255) * 100);
        }

        // Estimate dominant pitch = frequency of the loudest bin in the voice band.
        let peakBin = 0, peakVal = 0;
        for (let i = 1; i < maxBin; i++) if (data[i] > peakVal) { peakVal = data[i]; peakBin = i; }
        const estPitch = peakVal > 30 ? Math.round(peakBin * hzPerBin) : 0;

        // Throttle React state updates to ~30fps to stay smooth without thrashing.
        const now = performance.now();
        if (now - lastPush > 33) {
          lastPush = now;
          setSpectrum(bars);
          setPitch(estPitch);
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch(e) { console.warn("Audio API unavailable:",e); }
  }

  function stopAudio() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (actxRef.current) { try { actxRef.current.close(); } catch {} }
    analyRef.current = null; actxRef.current = null;
    setVol(0); setSpectrum([]); setPitch(0);
  }

  function startRec() {
    setRecording(true); setTime(0); setResult(null); setTranscript(""); setPolished(""); setPhase("idle"); setVol(0); setWpm(0);
    finalRef.current = "";          // accumulated final transcript (survives restarts)
    recActiveRef.current = true;    // we WANT recognition running
    startAudio();
    timerRef.current = setInterval(() => {
      setTime(t => {
        const newT = t+1;
        const words = transcRef.current.trim().split(/\s+/).filter(Boolean).length;
        const mins = newT/60;
        if (mins > 0) setWpm(Math.round(words/mins));
        return newT;
      });
    }, 1000);

    if (!SR_SUPPORTED) {
      setTranscript("Speech recognition isn't supported in this browser. You can type or paste your speech below for AI analysis and polishing.");
      showToast("Live transcription unavailable — type your speech instead","error");
      return;
    }

    const begin = () => {
      const sr = createRecognition({ continuous:true });
      if (!sr) return;
      srRef.current = sr;
      sr.onresult = e => {
        let interim = "";
        for (let i=e.resultIndex; i<e.results.length; i++) {
          if (e.results[i].isFinal) finalRef.current += e.results[i][0].transcript + " ";
          else interim += e.results[i][0].transcript;
        }
        setTranscript((finalRef.current + interim).trim());
      };
      sr.onerror = ev => {
        const msg = srErrorMessage(ev.error);
        if (msg) showToast(msg, "error");
        // A hard permission/capture error means we should stop trying.
        if (ev.error === "not-allowed" || ev.error === "service-not-allowed" || ev.error === "audio-capture") {
          recActiveRef.current = false;
        }
      };
      sr.onend = () => {
        // Mobile browsers stop recognition after pauses; auto-restart while the
        // user is still recording so the transcript keeps building.
        if (recActiveRef.current) {
          try { sr.start(); } catch { /* will retry on next onend */ }
        }
      };
      try { sr.start(); }
      catch (e) {
        // start() throws if called too soon after a previous stop; retry shortly.
        setTimeout(() => { if (recActiveRef.current) { try { sr.start(); } catch {} } }, 250);
      }
    };
    begin();
  }

  function stopRec() {
    recActiveRef.current = false;   // stop the auto-restart loop
    setRecording(false); clearInterval(timerRef.current); stopAudio();
    if (srRef.current) { try { srRef.current.onend = null; srRef.current.stop(); } catch {} }
    setPhase("recorded");
  }

  async function analyze() {
    if (!transcript.trim()) { showToast("No transcript to analyze","error"); return; }
    setPhase("polishing");
    try {
      const raw = await claude(`You are an expert leadership communication coach. Take the speaker's OWN raw transcript and rewrite it into polished, leadership-ready conversational sentences.

CRITICAL RULES for "polished":
- Rewrite ONLY what the speaker actually said. Do NOT invent new points, facts, or examples that aren't in their words.
- Preserve their original meaning, intent, and every idea they expressed.
- Fix grammar, remove filler words (um, uh, like, you know, kinda, sorta, basically), tighten run-ons, and improve flow.
- Make it sound like a confident, articulate leader speaking naturally — conversational, not stiff or corporate.
- Keep it roughly the same length and the same first-person voice as the original. It must read as THEIR speech, improved.
- Do NOT output generic coaching advice or template sentences in this field.

Also generate a short 3-6 word title summarizing what the speech was about.

Return ONLY valid JSON:
{
  "title": "Short 3-6 word title describing the speech topic",
  "polished": "The speaker's own words, rewritten as polished leadership-ready conversational sentences (same meaning, same voice).",
  "clarity": number 1-100,
  "tone": number 1-100,
  "confidence": number 1-100,
  "structure": number 1-100,
  "overallScore": weighted average 1-100,
  "feedback": "2-3 sentences of specific actionable coaching",
  "keyStrengths": ["strength 1", "strength 2"],
  "improvements": ["improvement 1", "improvement 2"],
  "fillerWordsFound": ["um", "uh", etc found in the original]
}
Raw transcript: "${transcript.slice(0,1200)}"`, 2200);
      const d = JSON.parse(raw);
      const polishedText = d.polished || "";
      setPolished(polishedText); setResult(d); setPhase("analyzed");
      autoSave({ ...d, polished:polishedText });
    } catch {
      // Offline fallback: do a light local cleanup of the user's own words so the
      // polished panel still reflects what they said (never generic filler text).
      const cleaned = transcript
        .replace(/\b(um+|uh+|like|you know|kinda|sorta|basically|i mean)\b/gi, "")
        .replace(/\s{2,}/g, " ")
        .replace(/\s+([.,!?])/g, "$1")
        .trim();
      const fallbackTitle = (transcript.trim().split(/\s+/).slice(0,5).join(" ") || "Speech session") + "…";
      const fbResult = { title:fallbackTitle, clarity:74,tone:80,confidence:70,structure:77,overallScore:75,feedback:"Focus on clear structure: opening, evidence, conclusion. Minimize filler words to project confidence.",keyStrengths:["Clear intent","Authentic voice"],improvements:["Reduce filler words","Add concrete examples"],fillerWordsFound:[] };
      setPolished(cleaned); setResult(fbResult); setPhase("analyzed");
      autoSave({ ...fbResult, polished:cleaned });
      showToast("Saved with offline polishing — AI unavailable","error");
    }
  }

  // Auto-save every completed session with an AI title + date & time stamp.
  function autoSave(d) {
    const now = new Date();
    const entry = {
      id: Date.now(),
      title: (d.title || "Speech session").trim(),
      transcript,
      polished: d.polished || "",
      result: d,
      duration: time,
      savedAt: now.toLocaleDateString(),
      savedAtTime: now.toLocaleString("en-US",{ month:"short", day:"numeric", year:"numeric", hour:"numeric", minute:"2-digit" }),
    };
    onSave("savedSpeeches", [entry, ...(store.savedSpeeches||[])]);
    showToast("Session auto-saved 🎙");
  }

  function delSession(id) {
    onSave("savedSpeeches", (store.savedSpeeches||[]).filter(s => (s.id ?? -1) !== id));
    showToast("Session deleted");
  }

  // Reset the current recording workspace (does not touch saved sessions).
  function clearAll() {
    if (recording) stopRec();
    setTranscript(""); setPolished(""); setResult(null);
    setPhase("idle"); setTime(0); setWpm(0); setVol(0);
    showToast("Cleared");
  }

  const wordCount  = transcript.trim() ? transcript.trim().split(/\s+/).filter(Boolean).length : 0;
  const sentCount  = transcript ? (transcript.match(/[.!?]+/g)||[]).length : 0;
  const feedMetrics = result ? [
    {l:"Clarity",    s:result.clarity,    c:P.teal,   g:P.gradTeal   },
    {l:"Tone",       s:result.tone,       c:P.purple, g:P.gradPurple },
    {l:"Confidence", s:result.confidence, c:P.amber,  g:P.gradAmber  },
    {l:"Structure",  s:result.structure,  c:P.pink,   g:P.gradPink   },
  ] : [];

  return (
    <div>
      <h1 className="ls-h1" style={{ fontSize:24,fontWeight:800,fontFamily:"'Plus Jakarta Sans',sans-serif",letterSpacing:"-0.02em",margin:"0 0 6px",...gText(P.gradCoral) }}>Speech Practice</h1>
      <p style={{ fontSize:13,color:P.g500,margin:"0 0 20px" }}>Record with live volume metering and waveform. Get transcription, polishing, and AI coaching.</p>

      {/* SpeechMeter */}
      <div style={{ marginBottom:16 }}>
        <SpeechMeter recording={recording} volume={vol} wpm={wpm} duration={time} wordCount={wordCount} sentenceCount={sentCount} spectrum={spectrum} pitch={pitch}/>
      </div>

      {/* Record button */}
      <PCard style={{ marginBottom:16,textAlign:"center",padding:"24px" }}>
        <button onClick={recording?stopRec:startRec} style={{ width:84,height:84,borderRadius:"50%",background:recording?`linear-gradient(135deg,${P.coral},${P.red})`:`linear-gradient(135deg,${P.purple},${P.purpleD})`,border:"none",fontSize:34,cursor:"pointer",marginBottom:12,animation:recording?"recPulse 1.5s infinite":"none",boxShadow:recording?`0 0 0 0 ${P.red}40`:`0 8px 28px ${P.purple}40`,transition:"all .3s",display:"inline-flex",alignItems:"center",justifyContent:"center" }}>
          {recording ? "⏹" : "🎙"}
        </button>
        <div style={{ fontSize:14,fontWeight:600,color:recording?P.coral:P.g500 }}>{recording?"Click to stop recording":"Click microphone to start"}</div>
        <div style={{ fontSize:12,color:P.g400,marginTop:4 }}>{recording?"Speak clearly — 3 to 5 minutes recommended":"Web Speech API with live audio metering"}</div>

        {(transcript||phase==="recorded"||phase==="analyzed") && (
          <div style={{ marginTop:20,textAlign:"left" }}>
            <div style={{ height:1,background:P.g200,marginBottom:16 }}/>
            <SLbl color={P.coralD}>Live Transcript {phase==="recorded"?"— Edit if needed before analyzing":""}</SLbl>
            <textarea value={transcript} onChange={e=>setTranscript(e.target.value)} rows={5} style={{ width:"100%",padding:"12px 14px",border:`1.5px solid ${P.g200}`,borderRadius:10,fontSize:13,fontFamily:"inherit",resize:"vertical",outline:"none",lineHeight:1.65,boxSizing:"border-box",background:P.g50,color:P.g800 }}/>
            <div style={{ marginTop:12,display:"flex",gap:8,alignItems:"center",flexWrap:"wrap" }}>
              {phase==="recorded" && (
                <>
                  <GBtn onClick={analyze} grad={P.gradCoral}>✨ Polish &amp; Analyze</GBtn>
                  <span className="ls-hide-sm" style={{ fontSize:12,color:P.g400 }}>AI will correct, polish, and score your speech</span>
                </>
              )}
              {!recording && (transcript || phase!=="idle") && (
                <Ghost onClick={clearAll} color={P.red} size="sm">🗑 Clear</Ghost>
              )}
            </div>
            {phase==="polishing" && (
              <div style={{ display:"flex",alignItems:"center",gap:10,marginTop:12,padding:"14px 16px",background:P.coral10,borderRadius:10 }}>
                <Spin color={P.coral}/><span style={{ fontSize:13,color:P.coralD,fontWeight:500 }}>Polishing transcript and analyzing leadership quality…</span>
              </div>
            )}
          </div>
        )}
      </PCard>

      {/* Results */}
      {phase==="analyzed" && result && (
        <>
          {/* Overall score card */}
          <div style={{ borderRadius:18,padding:"1.5px",background:P.gradCoral,marginBottom:16 }}>
            <div style={{ background:"#fff",borderRadius:17,padding:"20px 24px",display:"flex",alignItems:"center",gap:20 }}>
              <div style={{ position:"relative" }}>
                <Ring value={result.overallScore||75} color={P.coral} size={82}/>
                <div style={{ position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center" }}>
                  <div style={{ fontSize:20,fontWeight:800,...gText(P.gradCoral) }}>{result.overallScore||75}</div>
                  <div style={{ fontSize:8,color:P.g400,fontWeight:700 }}>SCORE</div>
                </div>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:16,fontWeight:700,...gText(P.gradCoral),marginBottom:6 }}>Overall Leadership Score</div>
                <div style={{ fontSize:13,color:P.g600,lineHeight:1.65 }}>{result.feedback}</div>
                {result.fillerWordsFound?.length>0 && <div style={{ fontSize:12,color:P.amberD,marginTop:8 }}>⚠️ Filler words detected: {result.fillerWordsFound.slice(0,6).map(w=>`"${w}"`).join(", ")}</div>}
              </div>
              <div style={{ display:"flex",alignItems:"center",gap:6,fontSize:12,fontWeight:700,color:P.greenD,background:P.green10,padding:"7px 12px",borderRadius:20,border:`1px solid ${P.green}30`,whiteSpace:"nowrap" }}>✓ Auto-saved</div>
            </div>
          </div>

          {/* Polished transcript */}
          <PCard style={{ marginBottom:16 }}>
            <SLbl>Your Original Transcript (Raw)</SLbl>
            <RawBox>{transcript}</RawBox>
            <div style={{ height:14 }}/>
            <SLbl color={P.greenD}>Polished Transcript — Leadership Ready ✨</SLbl>
            <div style={{ fontSize:11,color:P.g400,marginBottom:8 }}>Your own words, rewritten as confident, leadership-ready sentences — same meaning, your voice.</div>
            <GoodBox>{polished}</GoodBox>
          </PCard>

          {/* Score breakdown */}
          <div className="grid-2-sm" style={{ marginBottom:16 }}>
            {feedMetrics.map(m => (
              <div key={m.l} style={{ borderRadius:16,padding:"1.5px",background:m.g }}>
                <div style={{ background:"#fff",borderRadius:15,padding:"16px 20px",display:"flex",alignItems:"center",gap:14 }}>
                  <Ring value={m.s} color={m.c} size={56}/>
                  <div><div style={{ fontSize:22,fontWeight:800,...gText(m.g) }}>{m.s}%</div><div style={{ fontSize:13,fontWeight:600,color:P.g600 }}>{m.l}</div></div>
                </div>
              </div>
            ))}
          </div>

          {/* Strengths & improvements */}
          <div className="grid-2-sm">
            <PCard style={{ background:P.green10 }}>
              <SLbl color={P.greenD}>✅ Key Strengths</SLbl>
              {(result.keyStrengths||[]).map(s => <div key={s} style={{ fontSize:13,color:P.g700,padding:"6px 0",borderBottom:`1px solid ${P.green}20` }}>• {s}</div>)}
            </PCard>
            <PCard style={{ background:P.amber10 }}>
              <SLbl color={P.amberD}>🎯 Areas to Improve</SLbl>
              {(result.improvements||[]).map(s => <div key={s} style={{ fontSize:13,color:P.g700,padding:"6px 0",borderBottom:`1px solid ${P.amber}20` }}>• {s}</div>)}
            </PCard>
          </div>
        </>
      )}

      {/* Saved sessions — compact list, titles only until expanded */}
      {(store.savedSpeeches||[]).length > 0 && (
        <PCard style={{ marginTop:20 }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6 }}>
            <div style={{ fontSize:15,fontWeight:700,...gText(P.gradCoral) }}>🎙 Saved Sessions ({store.savedSpeeches.length})</div>
            <span style={{ fontSize:11,color:P.g400 }}>Tap a title to view details</span>
          </div>
          {store.savedSpeeches.map((s,i) => {
            const sid = s.id ?? i;
            const isOpen = expandedSession === sid;
            return (
              <div key={sid} style={{ borderBottom:`1px solid ${P.g100}` }}>
                <div style={{ display:"flex",alignItems:"center",gap:10,padding:"12px 0" }}>
                  <button onClick={()=>setExpandedSession(isOpen?null:sid)} style={{ flex:1,minWidth:0,display:"flex",alignItems:"center",gap:10,background:"none",border:"none",cursor:"pointer",textAlign:"left",fontFamily:"inherit",padding:0 }}>
                    <span style={{ display:"inline-block",transform:isOpen?"rotate(90deg)":"none",transition:"transform .2s",color:P.coral,fontSize:12,flexShrink:0 }}>▶</span>
                    <span style={{ flex:1,minWidth:0 }}>
                      <span style={{ display:"block",fontSize:14,fontWeight:700,color:P.g900,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{s.title || `Session ${i+1}`}</span>
                      <span style={{ display:"block",fontSize:11,color:P.g400,marginTop:2 }}>{s.savedAtTime || s.savedAt}{s.duration?` · ⏱ ${Math.floor(s.duration/60)}:${String(s.duration%60).padStart(2,"0")}`:""}</span>
                    </span>
                  </button>
                  <IBtn icon="🗑" onClick={()=>{ delSession(sid); if(isOpen) setExpandedSession(null); }} danger title="Delete session"/>
                </div>
                {isOpen && (
                  <div style={{ padding:"4px 0 16px 22px",animation:"fadeIn .25s ease" }}>
                    <div style={{ display:"flex",gap:"6px 18px",flexWrap:"wrap",marginBottom:12 }}>
                      {[{l:"Clarity",v:s.result?.clarity,c:P.teal},{l:"Tone",v:s.result?.tone,c:P.purple},{l:"Confidence",v:s.result?.confidence,c:P.amber},{l:"Structure",v:s.result?.structure,c:P.pink}].map(m=>(
                        <span key={m.l} style={{ display:"inline-flex",alignItems:"center",gap:6,fontSize:12 }}>
                          <span style={{ width:8,height:8,borderRadius:"50%",background:m.c,flexShrink:0 }}/>
                          <span style={{ color:P.g500 }}>{m.l}</span>
                          <b style={{ color:P.g800 }}>{m.v ?? "—"}%</b>
                        </span>
                      ))}
                    </div>
                    {s.transcript && (<><SLbl>Original (Raw)</SLbl><RawBox>{s.transcript}</RawBox><div style={{ height:12 }}/></>)}
                    {s.polished && (<><SLbl color={P.greenD}>Polished — Leadership Ready</SLbl><GoodBox>{s.polished}</GoodBox></>)}
                  </div>
                )}
              </div>
            );
          })}
        </PCard>
      )}
    </div>
  );
}
// ── Famous Talks ──────────────────────────────────────────────────────────────
// Renders a story, highlighting "(simple synonym)" brackets after advanced words
function StoryText({ text, color }) {
  // Split into segments, styling the parenthetical synonyms
  const parts = text.split(/(\([^)]*\))/g);
  return (
    <p style={{ fontSize:14,color:P.g700,lineHeight:1.9,margin:0 }}>
      {parts.map((part, i) => {
        if (part.startsWith("(") && part.endsWith(")")) {
          return (
            <span key={i} style={{ color, fontWeight:600, fontSize:12.5 }}> {part}</span>
          );
        }
        // Bold the word right before a bracket isn't trivial; keep plain for clarity
        return <span key={i}>{part}</span>;
      })}
    </p>
  );
}

function TalksPage({ store, onSave, showToast }) {
  const saved = (store.savedTalks||[]).map(t=>t.title);
  const custom = store.customTalks || [];
  const allTalks = [...custom, ...TALKS];
  const [open, setOpen] = useState({});
  const [showReq, setShowReq] = useState(false);
  const [leaderName, setLeaderName] = useState("");
  const [gen, setGen] = useState(false);
  // Narration state: which talk is playing, and whether it's paused.
  const [playing, setPlaying] = useState(null); // talk.title currently being read
  const [paused, setPaused]   = useState(false);

  // Stop any narration when leaving the page.
  useEffect(() => () => stopSpeech(), []);

  function playStory(talk) {
    const ok = speak(talk.story.replace(/\([^)]*\)/g, ""), true, {
      onstart:  () => { setPlaying(talk.title); setPaused(false); },
      onend:    () => { setPlaying(null); setPaused(false); },
    });
    if (!ok) { showToast("Listening isn't supported in this browser","error"); return; }
    setPlaying(talk.title); setPaused(false);
  }
  function togglePause() {
    if (paused) { resumeSpeech(); setPaused(false); }
    else { pauseSpeech(); setPaused(true); }
  }
  function stopStory() { stopSpeech(); setPlaying(null); setPaused(false); }

  function save(talk) {
    if (saved.includes(talk.title)) { showToast("Already saved","error"); return; }
    onSave("savedTalks",[...(store.savedTalks||[]),{...talk,savedAt:new Date().toLocaleDateString()}]);
    showToast("Talk saved 🎤");
  }
  const toggle = title => setOpen(o => ({ ...o, [title]: !o[title] }));
  const delCustom = title => {
    onSave("customTalks", custom.filter(t=>t.title!==title));
    showToast("Story removed");
  };

  async function requestLeader() {
    const name = leaderName.trim();
    if (!name) { showToast("Type a leader's name first","error"); return; }
    if (allTalks.some(t=>t.speaker.toLowerCase()===name.toLowerCase())) { showToast(`${name} is already here`,"error"); return; }
    setGen(true);
    const colors = ["purple","teal","green","amber","pink","coral"];
    try {
      const raw = await claude(`Write a short, inspiring leadership story about "${name}" for English learners.
Respond ONLY as valid JSON:
{
  "title": "Leader name — short theme (e.g. 'Mahatma Gandhi — Peaceful Resistance')",
  "speaker": "${name}",
  "story": "4-6 sentences about their leadership. IMPORTANT: after each advanced or uncommon word, put one very simple synonym in parentheses, exactly like this: perseverance (not giving up), resilience (bouncing back). Use 4-6 such advanced words naturally."
}
If "${name}" is not a real recognizable leader, still create a plausible inspiring story.`, 1200);
      let entry;
      try { entry = JSON.parse(raw); } catch { entry = null; }
      if (!entry || !entry.story || !entry.title) throw new Error("bad");
      entry.color = colors[Math.floor(Math.random()*colors.length)];
      entry.custom = true;
      onSave("customTalks",[entry, ...custom]);
      setOpen(o=>({ ...o, [entry.title]:true }));
      setLeaderName(""); setShowReq(false);
      showToast(`Story added for ${entry.speaker} ✨`);
    } catch {
      showToast("Couldn't generate that story — try another name","error");
    }
    setGen(false);
  }

  return (
    <div>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6,flexWrap:"wrap",gap:12 }}>
        <h1 className="ls-h1" style={{ fontSize:24,fontWeight:800,fontFamily:"'Plus Jakarta Sans',sans-serif",letterSpacing:"-0.02em",margin:0,...gText(P.gradPink) }}>Famous Leadership Talks</h1>
        <GBtn onClick={()=>setShowReq(s=>!s)} grad={P.gradPink} size="sm">{showReq?"✕ Close":"➕ Request a Leader"}</GBtn>
      </div>
      <p style={{ fontSize:13,color:P.g500,margin:"0 0 18px" }}>Read each story and tap to reveal it. Advanced words include a simple meaning in brackets. Tap 🔊 inside a story to hear it read aloud in a natural British English voice.</p>

      {/* Request-a-leader panel */}
      {showReq && (
        <div style={{ borderRadius:16,padding:"1.5px",background:P.gradPink,marginBottom:16,animation:"fadeUp .25s ease" }}>
          <div style={{ background:"#fff",borderRadius:15,padding:"18px 20px" }}>
            <SLbl color={P.pinkD}>Suggest a famous leader</SLbl>
            <div style={{ display:"flex",gap:8 }}>
              <input
                value={leaderName}
                onChange={e=>setLeaderName(e.target.value)}
                onKeyDown={e=>{ if(e.key==="Enter"&&!gen) requestLeader(); }}
                placeholder="e.g. Mahatma Gandhi, Sundar Pichai, Marie Curie…"
                autoFocus
                style={{ flex:1,padding:"11px 14px",border:`1.5px solid ${P.g200}`,borderRadius:10,fontSize:14,fontFamily:"inherit",outline:"none",boxSizing:"border-box" }}
              />
              <GBtn onClick={requestLeader} disabled={gen} grad={P.gradPink}>{gen?<><Spin color="#fff"/> Writing…</>:"✨ Add Story"}</GBtn>
            </div>
            <div style={{ fontSize:11,color:P.g400,marginTop:8 }}>AI writes their leadership story with advanced words and simple meanings in brackets. Press Enter to add.</div>
          </div>
        </div>
      )}

      <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
        {allTalks.map(talk => {
          const tc = TC[talk.color]||TC.purple;
          const isOpen = !!open[talk.title];
          const isSaved = saved.includes(talk.title);
          return (
            <GCard key={talk.title} grad={tc.grad}>
              <div className="talk-head" style={{ display:"flex",justifyContent:"space-between",alignItems:"center",gap:12 }}>
                {/* Left: icon + title (tappable to toggle) */}
                <button onClick={()=>toggle(talk.title)} className="talk-title-btn" style={{ flex:1,minWidth:0,display:"flex",alignItems:"center",gap:12,background:"none",border:"none",cursor:"pointer",textAlign:"left",fontFamily:"inherit",padding:0 }}>
                  <div style={{ width:38,height:38,borderRadius:11,background:tc.grad,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0 }}>{talk.custom?"⭐":"🎤"}</div>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ fontSize:15,fontWeight:800,...gText(tc.grad),marginBottom:3 }}>{talk.title}</div>
                    <div style={{ fontSize:11,color:P.g400,fontWeight:500 }}>{talk.speaker}</div>
                  </div>
                </button>
                {/* Right: Read story + Save + (delete) — all centered, fixed slot for delete */}
                <div className="talk-controls" style={{ display:"flex",alignItems:"center",gap:10,flexShrink:0 }}>
                  <button onClick={()=>toggle(talk.title)} style={{ fontSize:13,fontWeight:600,color:tc.text,display:"flex",alignItems:"center",gap:5,whiteSpace:"nowrap",background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",padding:0 }}>
                    {isOpen ? "Hide story" : "Read story"}
                    <span style={{ display:"inline-block",transform:isOpen?"rotate(180deg)":"none",transition:"transform .2s" }}>▾</span>
                  </button>
                  <GBtn onClick={()=>save(talk)} grad={isSaved?P.gradGreen:tc.grad} size="sm" style={{ minWidth:92,justifyContent:"center" }}>🔖 {isSaved?"Saved":"Save"}</GBtn>
                  <div style={{ width:32,flexShrink:0,display:"flex",justifyContent:"center" }}>
                    {talk.custom && <IBtn icon="🗑" onClick={()=>delCustom(talk.title)} danger title="Remove this story"/>}
                  </div>
                </div>
              </div>

              {isOpen && (
                <div style={{ marginTop:16,paddingTop:16,borderTop:`1px solid ${P.g100}`,animation:"fadeIn .3s ease" }}>
                  <div style={{ background:`linear-gradient(135deg,${tc.bg},#fff)`,borderRadius:12,padding:"16px 20px 18px",borderLeft:`3px solid ${tc.text}` }}>
                    {/* Narration controls — own row above the story so they never overlap the text */}
                    <div style={{ display:"flex",justifyContent:"flex-end",gap:8,marginBottom:10,flexWrap:"wrap" }}>
                      {playing===talk.title ? (
                        <>
                          <button onClick={togglePause} title={paused?"Resume":"Pause"}
                            style={{ display:"inline-flex",alignItems:"center",gap:6,padding:"5px 12px",borderRadius:20,border:`1.5px solid ${tc.text}30`,background:`${tc.text}12`,color:tc.text,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>
                            {paused ? "▶ Resume" : "⏸ Pause"}
                          </button>
                          <button onClick={stopStory} title="Stop"
                            style={{ display:"inline-flex",alignItems:"center",gap:6,padding:"5px 12px",borderRadius:20,border:`1.5px solid ${P.red}40`,background:P.red10,color:P.red,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>
                            ⏹ Stop
                          </button>
                        </>
                      ) : (
                        <button onClick={()=>playStory(talk)} title="Listen in a natural British voice"
                          style={{ display:"inline-flex",alignItems:"center",gap:6,padding:"5px 12px",borderRadius:20,border:`1.5px solid ${tc.text}30`,background:`${tc.text}12`,color:tc.text,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>
                          🔊 Listen <span style={{ fontSize:10,opacity:.7,fontWeight:500 }}>🇬🇧</span>
                        </button>
                      )}
                    </div>
                    <StoryText text={talk.story} color={tc.text}/>
                  </div>
                  <div style={{ marginTop:10,fontSize:11,color:P.g400,display:"flex",alignItems:"center",gap:4 }}>
                    💡 Words in <span style={{ color:tc.text,fontWeight:600 }}>(brackets)</span> are simple meanings of the advanced word before them
                  </div>
                </div>
              )}
            </GCard>
          );
        })}
      </div>
    </div>
  );
}

// ── Library ───────────────────────────────────────────────────────────────────
function LibraryPage({ store, onSave, onNav, showToast }) {
  // Track which item is expanded, keyed by "section:index".
  const [open, setOpen] = useState(null);
  const del = (key, idx) => {
    onSave(key,(store[key]||[]).filter((_,i)=>i!==idx));
    setOpen(null);
    showToast("Removed");
  };
  const has = (store.savedTopics?.length||0)+(store.savedSentences?.length||0)+(store.savedVocab?.length||0)+(store.savedTalks?.length||0)+(store.savedSpeeches?.length||0)+(store.customNotes?.length||0) > 0;
  if (!has) return (
    <div style={{ textAlign:"center",padding:"64px 24px" }}>
      <div style={{ fontSize:48,marginBottom:16 }}>🔖</div>
      <h2 style={{ fontSize:20,fontWeight:700,margin:"0 0 8px",color:P.g800 }}>Your library is empty</h2>
      <p style={{ fontSize:14,color:P.g400,margin:"0 0 20px" }}>Save topics, custom notes, vocabulary, talks, and speech sessions to find them here.</p>
      <GBtn onClick={()=>onNav("dashboard")} grad={P.gradPurple}>Go to Dashboard</GBtn>
    </div>
  );

  // One collapsible row: title (+ optional subtitle) visible, details hidden until tapped.
  const Row = ({ rowKey, accent, title, subtitle, storeKey, idx, children }) => {
    const isOpen = open === rowKey;
    return (
      <div style={{ borderBottom:`1px solid ${P.g100}` }}>
        <div style={{ display:"flex",alignItems:"center",gap:10,padding:"12px 0" }}>
          <button onClick={()=>setOpen(isOpen?null:rowKey)} style={{ flex:1,minWidth:0,display:"flex",alignItems:"center",gap:10,background:"none",border:"none",cursor:"pointer",textAlign:"left",fontFamily:"inherit",padding:0 }}>
            <span style={{ display:"inline-block",transform:isOpen?"rotate(90deg)":"none",transition:"transform .2s",color:accent,fontSize:12,flexShrink:0 }}>▶</span>
            <span style={{ flex:1,minWidth:0 }}>
              <span style={{ display:"block",fontSize:14,fontWeight:700,color:P.g900,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{title}</span>
              {subtitle && <span style={{ display:"block",fontSize:11,color:P.g400,marginTop:2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{subtitle}</span>}
            </span>
          </button>
          <IBtn icon="🗑" onClick={()=>del(storeKey,idx)} danger title="Delete"/>
        </div>
        {isOpen && <div style={{ padding:"2px 0 16px 22px",animation:"fadeIn .25s ease" }}>{children}</div>}
      </div>
    );
  };

  const Section = ({ grad, icon, label, count, children, last }) => (
    <PCard style={{ marginBottom:last?0:16 }}>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4 }}>
        <div style={{ fontSize:15,fontWeight:700,...gText(grad) }}>{icon} {label} ({count})</div>
        <span style={{ fontSize:11,color:P.g400 }}>Tap a title to view details</span>
      </div>
      {children}
    </PCard>
  );

  return (
    <div>
      <h1 className="ls-h1" style={{ fontSize:24,fontWeight:800,fontFamily:"'Plus Jakarta Sans',sans-serif",letterSpacing:"-0.02em",margin:"0 0 22px",...gText(P.gradPurple) }}>My Library</h1>

      {store.savedTopics?.length>0 && (
        <Section grad={P.gradAmber} icon="💡" label="Saved Topics" count={store.savedTopics.length}>
          {store.savedTopics.map((t,i) => (
            <Row key={i} rowKey={`topics:${i}`} accent={P.amber} title={t.title} subtitle={t.tag} storeKey="savedTopics" idx={i}>
              {t.explain && <p style={{ fontSize:13,color:P.g600,lineHeight:1.6,margin:"0 0 10px" }}>{t.explain}</p>}
              <div style={{ marginBottom:10 }}><CBadge color={t.color||"purple"}>{t.tag}</CBadge></div>
              {t.script && (<><SLbl color={P.amberD}>Leadership Script</SLbl><GoodBox>{t.script}</GoodBox></>)}
            </Row>
          ))}
        </Section>
      )}

      {store.savedSentences?.length>0 && (
        <Section grad={P.gradTeal} icon="✦" label="Enhanced Sentences" count={store.savedSentences.length}>
          {store.savedSentences.map((s,i) => (
            <Row key={i} rowKey={`sentences:${i}`} accent={P.teal} title={s.title} storeKey="savedSentences" idx={i}>
              {s.original && <RawBox>{s.original}</RawBox>}
              <div style={{ height:8 }}/>
              {s.enhanced && <GoodBox>{s.enhanced}</GoodBox>}
            </Row>
          ))}
        </Section>
      )}

      {store.customNotes?.length>0 && (
        <Section grad={P.gradTeal} icon="✍️" label="Custom Notes" count={store.customNotes.length}>
          {store.customNotes.map((n,i) => (
            <Row key={n.id ?? i} rowKey={`notes:${i}`} accent={P.teal} title={n.title} subtitle={n.savedAtTime || n.savedAt} storeKey="customNotes" idx={i}>
              {n.original && (<><SLbl>Your original note</SLbl><RawBox>{n.original}</RawBox><div style={{ height:10 }}/></>)}
              {n.polished && (<><SLbl color={P.greenD}>Polished — Leadership Style</SLbl><GoodBox>{n.polished}</GoodBox></>)}
            </Row>
          ))}
        </Section>
      )}

      {store.savedVocab?.length>0 && (
        <Section grad={P.gradGreen} icon="📖" label="Saved Vocabulary" count={store.savedVocab.length}>
          {store.savedVocab.map((v,i) => {
            const tc = TC[v.color]||TC.purple;
            return (
              <Row key={i} rowKey={`vocab:${i}`} accent={tc.text} title={v.word} storeKey="savedVocab" idx={i}>
                <div style={{ fontSize:13,color:P.g700,lineHeight:1.6,marginBottom:10 }}>{v.meaning}</div>
                {Array.isArray(v.examples)&&v.examples.length>0 && (
                  <div style={{ marginBottom:10 }}>
                    {v.examples.slice(0,3).map((ex,j)=>(
                      <div key={j} style={{ fontSize:12.5,color:P.g600,fontStyle:"italic",margin:"3px 0",paddingLeft:12,borderLeft:`2px solid ${tc.text}30`,lineHeight:1.5 }}>"{typeof ex==="string"?ex:(ex?.sentence||ex?.example||"")}"</div>
                    ))}
                  </div>
                )}
                {Array.isArray(v.synonyms)&&v.synonyms.length>0 && (
                  <div style={{ display:"flex",flexWrap:"wrap",gap:6 }}>
                    {v.synonyms.map((s,j)=>(
                      <span key={j} style={{ fontSize:12,fontWeight:600,color:tc.text,background:tc.bg,padding:"3px 10px",borderRadius:20,border:`1px solid ${tc.text}25` }}>{typeof s==="string"?s:(s?.word||s?.synonym||"")}</span>
                    ))}
                  </div>
                )}
              </Row>
            );
          })}
        </Section>
      )}

      {store.savedTalks?.length>0 && (
        <Section grad={P.gradPink} icon="🎤" label="Saved Talks" count={store.savedTalks.length}>
          {store.savedTalks.map((t,i) => (
            <Row key={i} rowKey={`talks:${i}`} accent={P.pink} title={t.title} subtitle={t.speaker} storeKey="savedTalks" idx={i}>
              {t.story && <p style={{ fontSize:13,color:P.g600,lineHeight:1.8,margin:0 }}>{t.story}</p>}
            </Row>
          ))}
        </Section>
      )}

      {store.savedSpeeches?.length>0 && (
        <Section grad={P.gradCoral} icon="🎙" label="Speech Sessions" count={store.savedSpeeches.length} last>
          {store.savedSpeeches.map((s,i) => (
            <Row key={i} rowKey={`speeches:${i}`} accent={P.coral} title={s.title || `Session ${i+1}`} subtitle={`${s.savedAtTime || s.savedAt}${s.duration?` · ⏱ ${Math.floor(s.duration/60)}:${String(s.duration%60).padStart(2,"0")}`:""}`} storeKey="savedSpeeches" idx={i}>
              <div style={{ display:"flex",gap:"6px 18px",flexWrap:"wrap",marginBottom:12 }}>
                {[{l:"Clarity",v:s.result?.clarity,c:P.teal},{l:"Tone",v:s.result?.tone,c:P.purple},{l:"Confidence",v:s.result?.confidence,c:P.amber},{l:"Structure",v:s.result?.structure,c:P.pink}].map(m=>(
                  <span key={m.l} style={{ display:"inline-flex",alignItems:"center",gap:6,fontSize:12 }}>
                    <span style={{ width:8,height:8,borderRadius:"50%",background:m.c,flexShrink:0 }}/>
                    <span style={{ color:P.g500 }}>{m.l}</span>
                    <b style={{ color:P.g800 }}>{m.v ?? "—"}%</b>
                  </span>
                ))}
              </div>
              {s.transcript && (<><SLbl>Original (Raw)</SLbl><RawBox>{s.transcript}</RawBox><div style={{ height:10 }}/></>)}
              {s.polished && (<><SLbl color={P.greenD}>Polished — Leadership Ready</SLbl><GoodBox>{s.polished}</GoodBox></>)}
            </Row>
          ))}
        </Section>
      )}
    </div>
  );
}

// ── Admin Panel (admin only) ──────────────────────────────────────────────────
// Shows per-user data usage and lets the admin inspect any user's saved data.
// Regular users never reach this page (it's filtered from their nav and gated
// in the router), so this is purely an admin oversight view.
const DATA_LABELS = {
  savedTopics:"Topics", savedSentences:"Sentences", savedVocab:"Vocabulary",
  savedTalks:"Talks", savedSpeeches:"Speeches", customTalks:"Custom talks",
  customNotes:"Notes", matchSentences:"Match sentences",
};

function AdminPage({ currentUser, frozen, onFreeze, onUnfreeze }) {
  const [usage, setUsage]   = useState(() => allUsersUsage());
  const [openEmail, setOpenEmail] = useState(null);
  const [ctrlOpen, setCtrlOpen] = useState(false); // Site Controls dropdown open/closed
  const accounts = loadAccounts();
  const nameFor = email => (accounts.find(a => a.email === email)?.name) || email;

  const fmtBytes = b => b < 1024 ? `${b} B` : b < 1024*1024 ? `${(b/1024).toFixed(1)} KB` : `${(b/1024/1024).toFixed(2)} MB`;
  const totalBytes = usage.reduce((a,u)=>a+u.bytes, 0);
  const totalItems = usage.reduce((a,u)=>a+u.items, 0);
  const maxBytes = Math.max(1, ...usage.map(u=>u.bytes));
  const refresh = () => setUsage(allUsersUsage());

  return (
    <div>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,flexWrap:"wrap",marginBottom:6 }}>
        <div style={{ display:"flex",alignItems:"center",gap:10 }}>
          <span style={{ fontSize:22 }}>🛡️</span>
          <h1 className="ls-h1" style={{ fontSize:24,fontWeight:800,fontFamily:"'Plus Jakarta Sans',sans-serif",letterSpacing:"-0.02em",margin:0,...gText(P.gradAmber) }}>Admin Panel</h1>
        </div>
        <Ghost onClick={refresh} color={P.amberD} size="sm">↻ Refresh</Ghost>
      </div>
      <p style={{ fontSize:13,color:P.g500,margin:"0 0 16px" }}>Data usage per user. As admin you can review every user's saved data; regular users can only ever see their own.</p>

      {/* Site Controls — dropdown with hide/display + Freeze/Unfreeze options */}
      <PCard style={{ marginBottom:18 }}>
        <button onClick={()=>setCtrlOpen(o=>!o)} aria-expanded={ctrlOpen}
          style={{ width:"100%",display:"flex",alignItems:"center",gap:10,background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",padding:0 }}>
          <span style={{ width:36,height:36,borderRadius:10,background:P.gradAmber,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,flexShrink:0 }}>⚙️</span>
          <span style={{ flex:1,minWidth:0,textAlign:"left" }}>
            <span style={{ display:"block",fontSize:14.5,fontWeight:700,color:P.g900 }}>Site Controls</span>
            <span style={{ display:"flex",alignItems:"center",gap:6,fontSize:11.5,marginTop:2 }}>
              <span style={{ width:8,height:8,borderRadius:"50%",background:frozen?P.red:P.green,display:"inline-block" }}/>
              <span style={{ color:P.g500 }}>Status: <b style={{ color:frozen?P.red:P.greenD }}>{frozen?"Frozen":"Live"}</b></span>
            </span>
          </span>
          <span style={{ fontSize:12,color:P.g400,transform:ctrlOpen?"rotate(180deg)":"none",transition:"transform .2s" }}>▼</span>
        </button>
        {ctrlOpen && (
          <div style={{ marginTop:14,paddingTop:14,borderTop:`1px solid ${P.g100}`,animation:"fadeIn .2s ease" }}>
            <SLbl color={P.amberD}>Freeze / Unfreeze the site</SLbl>
            <p style={{ fontSize:12.5,color:P.g600,lineHeight:1.6,margin:"0 0 12px" }}>
              {frozen
                ? "The site is frozen — all users are locked out. You still have full access. Unfreeze to restore access for everyone."
                : "Freezing the site locks out all users except you (the admin). Use it for maintenance or emergencies."}
            </p>
            <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
              <button onClick={onFreeze} disabled={frozen}
                style={{ flex:"1 1 160px",display:"flex",alignItems:"center",justifyContent:"center",gap:7,padding:"11px",borderRadius:10,border:"none",fontSize:13,fontWeight:700,fontFamily:"inherit",cursor:frozen?"not-allowed":"pointer",background:frozen?P.g200:"linear-gradient(135deg,#DC2626,#B91C1C)",color:frozen?P.g400:"#fff",boxShadow:frozen?"none":"0 4px 14px rgba(220,38,38,.3)" }}>
                🔒 Freeze Site
              </button>
              <button onClick={onUnfreeze} disabled={!frozen}
                style={{ flex:"1 1 160px",display:"flex",alignItems:"center",justifyContent:"center",gap:7,padding:"11px",borderRadius:10,border:"none",fontSize:13,fontWeight:700,fontFamily:"inherit",cursor:!frozen?"not-allowed":"pointer",background:!frozen?P.g200:P.gradGreen,color:!frozen?P.g400:"#fff",boxShadow:!frozen?"none":"0 4px 14px rgba(16,185,129,.3)" }}>
                🔓 Unfreeze Site
              </button>
            </div>
          </div>
        )}
      </PCard>

      {/* Totals */}
      <div className="grid-4" style={{ marginBottom:20 }}>
        {[
          {l:"Users",v:usage.length,g:P.gradPurple,icon:"👥"},
          {l:"Total Items",v:totalItems,g:P.gradTeal,icon:"🗂"},
          {l:"Total Storage",v:fmtBytes(totalBytes),g:P.gradAmber,icon:"💾"},
          {l:"Accounts",v:accounts.length,g:P.gradPink,icon:"🔑"},
        ].map(x => (
          <div key={x.l} style={{ borderRadius:16,padding:"1.5px",background:x.g }}>
            <div style={{ background:"#fff",borderRadius:15,padding:"14px 16px" }}>
              <div style={{ fontSize:20,marginBottom:4 }}>{x.icon}</div>
              <div style={{ fontSize:22,fontWeight:800,...gText(x.g) }}>{x.v}</div>
              <div style={{ fontSize:11,color:P.g500,marginTop:2,fontWeight:500 }}>{x.l}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Per-user usage list */}
      <PCard>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8 }}>
          <div style={{ fontSize:15,fontWeight:700,...gText(P.gradAmber) }}>📊 Data Usage by User</div>
          <span style={{ fontSize:11,color:P.g400 }}>Tap a user to view their saved data</span>
        </div>

        {usage.length === 0 && (
          <div style={{ fontSize:13,color:P.g400,padding:"14px 0" }}>No user data saved yet.</div>
        )}

        {usage.map(u => {
          const isOpen = openEmail === u.email;
          const isMe = u.email === (currentUser?.email||"").toLowerCase();
          const isAdm = isAdminEmail(u.email);
          const data = loadUserData(u.email);
          return (
            <div key={u.email} style={{ borderBottom:`1px solid ${P.g100}` }}>
              <div style={{ display:"flex",alignItems:"center",gap:10,padding:"12px 0" }}>
                <button onClick={()=>setOpenEmail(isOpen?null:u.email)} style={{ flex:1,minWidth:0,display:"flex",alignItems:"center",gap:11,background:"none",border:"none",cursor:"pointer",textAlign:"left",fontFamily:"inherit",padding:0 }}>
                  <span style={{ display:"inline-block",transform:isOpen?"rotate(90deg)":"none",transition:"transform .2s",color:P.amber,fontSize:12,flexShrink:0 }}>▶</span>
                  <span style={{ width:34,height:34,borderRadius:"50%",background:isAdm?P.gradAmber:P.gradPink,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:"#fff",flexShrink:0 }}>{nameFor(u.email).split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()}</span>
                  <span style={{ flex:1,minWidth:0 }}>
                    <span style={{ display:"flex",alignItems:"center",gap:6,fontSize:13.5,fontWeight:700,color:P.g900 }}>
                      <span style={{ whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{nameFor(u.email)}</span>
                      {isAdm && <span style={{ fontSize:8,fontWeight:800,color:"#fff",background:P.gradAmber,padding:"1px 6px",borderRadius:10,flexShrink:0 }}>ADMIN</span>}
                      {isMe && <span style={{ fontSize:8,fontWeight:800,color:P.purpleD,background:P.purple10,padding:"1px 6px",borderRadius:10,flexShrink:0 }}>YOU</span>}
                    </span>
                    <span style={{ display:"block",fontSize:11,color:P.g400,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{u.email}</span>
                  </span>
                  <span style={{ textAlign:"right",flexShrink:0 }}>
                    <span style={{ display:"block",fontSize:13,fontWeight:800,color:P.amberD }}>{fmtBytes(u.bytes)}</span>
                    <span style={{ display:"block",fontSize:10,color:P.g400 }}>{u.items} item{u.items===1?"":"s"}</span>
                  </span>
                </button>
              </div>
              {/* Usage bar */}
              <div style={{ height:5,background:P.g100,borderRadius:3,overflow:"hidden",marginBottom:10,marginLeft:23 }}>
                <div style={{ height:"100%",width:`${(u.bytes/maxBytes)*100}%`,background:P.gradAmber,borderRadius:3,transition:"width .4s" }}/>
              </div>
              {isOpen && (
                <div style={{ padding:"2px 0 16px 23px",animation:"fadeIn .25s ease" }}>
                  {/* Category counts */}
                  <div style={{ display:"flex",flexWrap:"wrap",gap:"6px 16px",marginBottom:14 }}>
                    {DATA_KEYS.map(k => (
                      <span key={k} style={{ display:"inline-flex",alignItems:"center",gap:6,fontSize:12 }}>
                        <span style={{ color:P.g500 }}>{DATA_LABELS[k]||k}</span>
                        <b style={{ color:u.counts[k]?P.g800:P.g300 }}>{u.counts[k]||0}</b>
                      </span>
                    ))}
                  </div>
                  {/* Actual saved data preview */}
                  {u.items === 0 ? (
                    <div style={{ fontSize:12.5,color:P.g400 }}>This user hasn't saved any data yet.</div>
                  ) : (
                    DATA_KEYS.filter(k => (data[k]||[]).length).map(k => (
                      <div key={k} style={{ marginBottom:12 }}>
                        <SLbl color={P.amberD}>{DATA_LABELS[k]||k} ({data[k].length})</SLbl>
                        {data[k].slice(0,8).map((item,i) => (
                          <div key={i} style={{ fontSize:12.5,color:P.g700,padding:"5px 0",borderBottom:`1px solid ${P.g100}`,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>
                            • {item.title || item.word || item.text || item.original || item.transcript || item.speaker || "(untitled)"}
                          </div>
                        ))}
                        {data[k].length > 8 && <div style={{ fontSize:11,color:P.g400,paddingTop:5 }}>+ {data[k].length-8} more…</div>}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </PCard>

      <p style={{ fontSize:11.5,color:P.g400,lineHeight:1.6,margin:"16px 2px 0" }}>
        Note: this build stores data locally in the browser, so this panel reflects users who have signed in and saved data on this device. A production deployment would aggregate usage from a backend database across all devices.
      </p>
    </div>
  );
}

// ── About modal ───────────────────────────────────────────────────────────────
// Everyone sees the purpose + a high-level feature summary. Only the admin sees
// the full technical implementation details.
function AboutModal({ onClose, isAdmin }) {
  const features = [
    ["💡","Daily Topics","Generate a leadership script from your own topic, or pick a ready-made one, with talking points, common mistakes, and reflection prompts."],
    ["🎙","Speech Practice","Record yourself speaking, see a live voice-reactive waveform, then get an AI-polished, leadership-ready rewrite and a clarity/tone/confidence score."],
    ["✍️","Add Custom Topics","Jot rough notes in your own words and have them grammar-corrected and polished into a confident leadership style, auto-titled and saved."],
    ["📖","Vocabulary","Build an executive vocabulary with meanings, example sentences, and synonyms you can save for later."],
    ["🗣️","Speak & Match","Repeat dynamic sentences across Beginner/Medium/Hard levels with a live waveform; the status turns green only after three correct repetitions in a row."],
    ["🎤","Famous Talks","Read curated leadership stories and hear them narrated aloud in a natural British English voice."],
    ["🔖","My Library","Everything you save lives here as a tidy, title-only list you can expand for the full detail."],
  ];
  // Full technical breakdown — admin only.
  const tech = [
    ["React (function components + hooks)","UI framework","The whole interface is built from React function components. State and lifecycle are handled with hooks: useState for view state, useEffect for setup (admin seeding, viewport meta, cross-tab freeze sync, audio cleanup), and useRef for the SpeechRecognition instance, AudioContext, AnalyserNode and animation-frame handles."],
    ["JavaScript (modern ES)","Programming language","All application logic is written in modern JavaScript: form validation rules, the word-overlap matching/scoring in Speak & Match, FFT binning for the waveform, async/await calls to the AI, and the credential hashing flow."],
    ["JSX","Markup syntax","Declaratively describes each component's element tree; compiled to JavaScript (React.createElement / jsx calls) for rendering."],
    ["CSS-in-JS + one global stylesheet","Styling & layout","A shared design-token palette (P) drives inline styles, while a single injected <style> sheet (GCSS) holds the responsive grid, the off-canvas mobile drawer with a backdrop scrim, keyframe animations (orbs, fades, pulse), and reduced-motion handling."],
    ["Web Speech API — SpeechRecognition","Voice input","Captures and transcribes the user's speech in Speak & Match and Speech Practice, using interim + final results so the transcript updates live, then compared to the target sentence."],
    ["Web Speech API — SpeechSynthesis","Voice output","Reads scripts, practice sentences and famous talks aloud. A voice picker prefers a natural British English voice and tunes rate/pitch for a human cadence."],
    ["Web Audio API (AudioContext + AnalyserNode)","Live waveform","getUserMedia opens the mic; an AnalyserNode runs a 1024-point FFT each animation frame. Frequencies in the voice band are log-binned into bars and the dominant bin is used to estimate pitch, driving the real-time visualization."],
    ["Anthropic Claude API (claude-sonnet-4-6)","AI engine","Called over fetch from the browser to generate leadership topics, scripts and graded practice sentences, and to polish raw speech/notes. Prompts request strict JSON which is parsed into the UI; every call has a built-in fallback if the AI is unavailable."],
    ["localStorage","Persistence","Three namespaced keys: the main app store (user session + all saved items), the accounts list, and the site-freeze flag. Everything survives reloads and a 'storage' event keeps the freeze state in sync across tabs."],
    ["Web Crypto (SHA-256 + per-user salt)","Security / auth","On signup a random salt is generated and the password is hashed with SHA-256; only salt+hash are stored, never the raw password. Login re-hashes and compares. A non-crypto fallback keeps logins working in non-secure contexts."],
    ["Role-based access & site freeze","Authorization","A built-in admin account is seeded on first load. The admin flag flows through login into the UI to gate admin-only controls. The admin can freeze the site, which locks out all other users via a gate in the root component while the admin always retains access."],
  ];
  const accent = isAdmin ? P.gradAmber : P.gradPurple;

  return (
    <div onClick={onClose} style={{ position:"fixed",inset:0,zIndex:200,background:"rgba(10,5,32,.6)",backdropFilter:"blur(4px)",display:"flex",alignItems:"center",justifyContent:"center",padding:18,animation:"fadeIn .2s ease" }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:"#fff",borderRadius:22,width:"100%",maxWidth:600,maxHeight:"88vh",overflow:"hidden",display:"flex",flexDirection:"column",boxShadow:"0 32px 80px rgba(0,0,0,.45)",animation:"fadeUp .3s ease" }}>
        {/* Header */}
        <div style={{ padding:"22px 24px",background:"linear-gradient(135deg,#0A0520,#1E0A4A)",position:"relative",flexShrink:0 }}>
          <button onClick={onClose} aria-label="Close" style={{ position:"absolute",top:16,right:16,width:32,height:32,borderRadius:9,border:"1px solid rgba(255,255,255,.18)",background:"rgba(255,255,255,.1)",color:"#fff",fontSize:15,cursor:"pointer" }}>✕</button>
          <div style={{ display:"flex",alignItems:"center",gap:12 }}>
            <div style={{ width:44,height:44,borderRadius:13,background:P.gradPurple,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,boxShadow:"0 6px 20px rgba(124,58,237,.45)" }}>👑</div>
            <div>
              <div style={{ fontSize:20,fontWeight:800,fontFamily:"'Plus Jakarta Sans',sans-serif",color:"#fff",display:"flex",alignItems:"center",gap:8 }}>
                About LeadSpeak
                {isAdmin && <span style={{ fontSize:9,fontWeight:800,letterSpacing:".05em",color:"#fff",background:P.gradAmber,padding:"2px 8px",borderRadius:10 }}>ADMIN VIEW</span>}
              </div>
              <div style={{ fontSize:12,color:"rgba(255,255,255,.55)",fontWeight:500 }}>Leadership Communication Platform</div>
            </div>
          </div>
        </div>

        {/* Scrollable body */}
        <div style={{ padding:"22px 24px",overflowY:"auto" }}>
          {/* Purpose */}
          <SLbl color={P.purpleD}>What it's for</SLbl>
          <p style={{ fontSize:14,color:P.g700,lineHeight:1.75,margin:"0 0 20px" }}>
            LeadSpeak helps you build a confident, articulate leadership voice. You practice what real leaders say, sharpen how you say it, and get AI feedback that turns rough words into polished, leadership-ready communication — all in one place, with everything you create saved for review.
          </p>

          {/* Features */}
          <SLbl color={P.purpleD}>What you can do</SLbl>
          <div style={{ marginBottom: isAdmin ? 22 : 4 }}>
            {features.map(([icon,title,desc]) => (
              <div key={title} style={{ display:"flex",gap:12,padding:"11px 0",borderBottom:`1px solid ${P.g100}` }}>
                <span style={{ fontSize:18,flexShrink:0,width:24,textAlign:"center" }}>{icon}</span>
                <div>
                  <div style={{ fontSize:13.5,fontWeight:700,color:P.g900,marginBottom:2 }}>{title}</div>
                  <div style={{ fontSize:12.5,color:P.g600,lineHeight:1.6 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Technical details — ADMIN ONLY */}
          {isAdmin ? (
            <>
              <div style={{ height:8 }}/>
              <SLbl color={P.amberD}>How it's built — technical details</SLbl>
              <p style={{ fontSize:13,color:P.g600,lineHeight:1.7,margin:"0 0 6px" }}>
                LeadSpeak is a single-page application that runs entirely in the browser — no backend server. The UI is one React tree; a root component decides whether to show the auth screen, the frozen lock screen, or the full app based on session and role. Below is each technology and its specific role in the system:
              </p>
              <div style={{ marginBottom:14 }}>
                {tech.map(([name,role,desc]) => (
                  <div key={name} style={{ padding:"12px 0",borderBottom:`1px solid ${P.g100}` }}>
                    <div style={{ display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:4 }}>
                      <span style={{ fontSize:13.5,fontWeight:700,color:P.g900 }}>{name}</span>
                      <span style={{ fontSize:10,fontWeight:700,color:P.amberD,background:P.amber10,padding:"2px 8px",borderRadius:20,border:`1px solid ${P.amber}40` }}>{role}</span>
                    </div>
                    <div style={{ fontSize:12.5,color:P.g600,lineHeight:1.6 }}>{desc}</div>
                  </div>
                ))}
              </div>
              <div style={{ background:P.amber10,border:`1px solid ${P.amber}35`,borderRadius:12,padding:"13px 15px" }}>
                <div style={{ fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:".06em",color:P.amberD,marginBottom:6 }}>🏗️ Architecture & data flow</div>
                <p style={{ fontSize:12.5,color:P.g700,lineHeight:1.7,margin:0 }}>
                  Single React component tree → root gate (auth / frozen / app) → sidebar navigation swaps the active page component. Each feature page owns its state and calls the Claude API directly via fetch, parses JSON responses into UI, and persists results to localStorage through a shared save handler. Voice features layer the Web Speech and Web Audio APIs on top. There is no server, router library, or database — persistence and "sessions" are entirely client-side, which is the main thing a production build would move to a backend.
                </p>
              </div>
            </>
          ) : (
            <div style={{ background:P.purple10,border:`1px solid ${P.purple}25`,borderRadius:12,padding:"14px 16px",marginTop:6 }}>
              <p style={{ fontSize:12.5,color:P.g600,lineHeight:1.7,margin:0 }}>
                LeadSpeak runs right here in your browser and uses AI to generate practice material and feedback. Everything you save stays on your device. Just pick a feature from the menu to get started!
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding:"14px 24px",borderTop:`1px solid ${P.g100}`,flexShrink:0,display:"flex",justifyContent:"flex-end" }}>
          <GBtn onClick={onClose} grad={accent} size="sm">Got it</GBtn>
        </div>
      </div>
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [user,  setUser]  = useState(() => loadSession());
  const [page,  setPage]  = useState("dashboard");
  // Per-user data — loaded for whoever is currently logged in.
  const [store, setStore] = useState(() => { const s = loadSession(); return loadUserData(s?.email); });
  const [toast, setToast] = useState(null);
  const [navOpen, setNavOpen] = useState(false);
  const [frozen, setFrozen] = useState(() => isSiteFrozen());
  const [aboutOpen, setAboutOpen] = useState(false);

  const isAdmin = !!(user && (user.isAdmin || isAdminEmail(user.email)));

  // Seed the default admin account once on load.
  useEffect(() => { ensureAdminAccount(); }, []);

  // Keep freeze state in sync if another tab toggles it.
  useEffect(() => {
    const onStorage = e => { if (e.key === FREEZE_KEY) setFrozen(isSiteFrozen()); };
    window.addEventListener?.("storage", onStorage);
    return () => window.removeEventListener?.("storage", onStorage);
  }, []);

  // Reaffirm the viewport meta after mount as a safety net (it's primarily set
  // synchronously at module load above, before first paint).
  useEffect(() => {
    try {
      let meta = document.querySelector('meta[name="viewport"]');
      if (!meta) { meta = document.createElement("meta"); meta.setAttribute("name","viewport"); document.head.appendChild(meta); }
      meta.setAttribute("content", "width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover");
    } catch {}
  }, []);

  const showToast = (msg, type="ok") => { setToast({msg,type}); setTimeout(()=>setToast(null),2800); };
  // Save writes ONLY to the current user's namespace — never shared.
  const handleSave = (k,v) => {
    const n = {...store,[k]:v};
    setStore(n);
    if (user?.email) saveUserData(user.email, n);
  };
  const handleAuth = (u, remember) => {
    setUser(u);
    saveSession(u, !!remember);              // Remember Me decides persistence
    setStore(loadUserData(u.email));         // load THIS user's data only
    showToast(`Welcome, ${u.name.split(" ")[0]}! 🎉`);
    setPage("dashboard");
  };
  const handleLogout = () => {
    clearSession();
    setUser(null);
    setStore({ ...EMPTY_USER_DATA });
    setPage("dashboard"); setNavOpen(false);
  };
  const navTo = p => { setPage(p); setNavOpen(false); };

  const freezeSite = () => { setSiteFrozen(true); setFrozen(true); showToast("🔒 Site frozen — all non-admin users are locked out"); };
  const unfreezeSite = () => { setSiteFrozen(false); setFrozen(false); showToast("🔓 Site unfrozen — access restored for everyone"); };

  if (!user) {
    // Keep the login form available even when frozen, so the admin can sign in.
    // Non-admins who log in are gated immediately below.
    return (
      <><style>{GCSS}</style><AuthPage onAuth={handleAuth} frozen={frozen}/>{toast&&<Toast msg={toast.msg} type={toast.type}/>}</>
    );
  }

  // Site is frozen and the logged-in user is NOT the admin → lock them out.
  if (frozen && !isAdmin) return (
    <><style>{GCSS}</style><FrozenScreen mode="user" onLogout={handleLogout} />{toast&&<Toast msg={toast.msg} type={toast.type}/>}</>
  );

  const pages = {
    dashboard: <Dashboard store={store} onNav={navTo}/>,
    topics:    <TopicsPage store={store} onSave={handleSave} showToast={showToast}/>,
    speech:    <SpeechPage store={store} onSave={handleSave} showToast={showToast}/>,
    custom:    <CustomTopicsPage store={store} onSave={handleSave} showToast={showToast}/>,
    vocab:     <VocabPage store={store} onSave={handleSave} showToast={showToast}/>,
    match:     <SpeakMatchPage store={store} onSave={handleSave} showToast={showToast}/>,
    talks:     <TalksPage store={store} onSave={handleSave} showToast={showToast}/>,
    library:   <LibraryPage store={store} onSave={handleSave} onNav={navTo} showToast={showToast}/>,
    // Admin Panel is gated: non-admins are bounced to their dashboard.
    admin:     isAdmin ? <AdminPage currentUser={user} frozen={frozen} onFreeze={freezeSite} onUnfreeze={unfreezeSite}/> : <Dashboard store={store} onNav={navTo}/>,
  };
  const pageLabel = (NAV.find(n=>n.id===page)||{}).label || "LeadSpeak";

  return (
    <><style>{GCSS}</style>
      <div className="ls-shell">
        {/* Off-canvas scrim (mobile only) */}
        <div className={`ls-scrim${navOpen?" open":""}`} onClick={()=>setNavOpen(false)}/>
        <Sidebar page={page} onNav={navTo} user={user} onLogout={handleLogout} open={navOpen}
                 isAdmin={isAdmin}
                 onAbout={()=>{ setAboutOpen(true); setNavOpen(false); }}/>
        <div className="ls-content" style={{ flex:1,display:"flex",flexDirection:"column",minWidth:0 }}>
          {/* Mobile topbar with hamburger */}
          <div className="ls-topbar">
            <button onClick={()=>setNavOpen(true)} aria-label="Open menu" style={{ width:38,height:38,borderRadius:10,border:"none",background:"rgba(255,255,255,.12)",color:"#fff",fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>☰</button>
            <div style={{ display:"flex",alignItems:"center",gap:8,flex:1,minWidth:0 }}>
              <div style={{ width:28,height:28,borderRadius:8,background:P.gradPurple,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0 }}>👑</div>
              <span style={{ fontSize:15,fontWeight:700,fontFamily:"'Plus Jakarta Sans',sans-serif",color:"#fff",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{pageLabel}</span>
            </div>
            <button onClick={()=>setAboutOpen(true)} aria-label="About" title="About" style={{ width:38,height:38,borderRadius:10,border:"1px solid rgba(255,255,255,.15)",background:"rgba(255,255,255,.08)",color:"#fff",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>ℹ️</button>
            <button onClick={handleLogout} aria-label="Log out" title="Log out" style={{ width:38,height:38,borderRadius:10,border:"1px solid rgba(255,255,255,.15)",background:"rgba(255,255,255,.08)",color:"#fff",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>⇥</button>
          </div>
          {/* Admin banner when site is frozen (admin still has full access) */}
          {isAdmin && frozen && (
            <div style={{ background:"linear-gradient(90deg,#7F1D1D,#B91C1C)",color:"#fff",padding:"9px 16px",fontSize:12.5,fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center",gap:8,textAlign:"center" }}>
              🔒 The site is currently frozen for all users. As admin, you still have full access.
            </div>
          )}
          <main className="ls-main">{pages[page]||pages.dashboard}</main>
        </div>
      </div>
      {aboutOpen && <AboutModal onClose={()=>setAboutOpen(false)} isAdmin={isAdmin}/>}
      {toast&&<Toast msg={toast.msg} type={toast.type}/>}
    </>
  );
}

// ── Frozen lock screen (shown to non-admin users / visitors while frozen) ──────
function FrozenScreen({ mode, onLogout }) {
  return (
    <div style={{ minHeight:"100vh",minHeight:"100dvh",background:"linear-gradient(145deg,#0A0520,#150D3A,#1E0A4A)",display:"flex",alignItems:"center",justifyContent:"center",padding:24,position:"relative",overflow:"hidden" }}>
      {[["−10%","5%",300,P.purple,6],["80%","76%",160,P.amber,8]].map(([l,t,sz,c,d],i) => (
        <div key={i} style={{ position:"fixed",left:l,top:t,width:sz,height:sz,borderRadius:"50%",background:`radial-gradient(circle,${c}44,transparent 70%)`,animation:`orb ${d}s ease-in-out infinite alternate`,pointerEvents:"none" }}/>
      ))}
      <div style={{ position:"relative",zIndex:1,maxWidth:440,textAlign:"center",background:"rgba(255,255,255,.97)",borderRadius:24,padding:"44px 36px",boxShadow:"0 32px 80px rgba(0,0,0,.45)",animation:"fadeUp .4s ease" }}>
        <div style={{ fontSize:52,marginBottom:16 }}>🔒</div>
        <h1 style={{ fontSize:24,fontWeight:800,fontFamily:"'Plus Jakarta Sans',sans-serif",margin:"0 0 10px",...gText(P.gradPurple) }}>Temporarily Unavailable</h1>
        <p style={{ fontSize:14,color:P.g600,lineHeight:1.7,margin:"0 0 8px" }}>
          LeadSpeak has been paused by the administrator and is currently unavailable. Please check back later.
        </p>
        <p style={{ fontSize:12.5,color:P.g400,lineHeight:1.6,margin:0 }}>
          {mode==="login" ? "Access is restricted until the site is reopened." : "You'll regain access as soon as the site is reopened."}
        </p>
        {mode==="user" && (
          <button onClick={onLogout} style={{ marginTop:22,padding:"11px 24px",background:P.gradPurple,color:"#fff",border:"none",borderRadius:12,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit" }}>Log out</button>
        )}
      </div>
    </div>
  );
}
