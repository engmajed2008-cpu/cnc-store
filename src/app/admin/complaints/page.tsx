"use client";
import { useState, useEffect, useMemo } from "react";
import { AdminSidebar } from "@/app/admin/AdminSidebar";
import { AlertCircle, Clock, CheckCircle, X, MessageSquare, ChevronDown, ChevronUp, Send, Search, RefreshCw } from "lucide-react";

const G = "linear-gradient(135deg,#C9A24B,#EBCB7C)";

type ComplaintStatus = "open" | "in_review" | "resolved" | "closed";
type ComplaintCategory = "delay" | "quality" | "wrong_item" | "damage" | "other";

type Complaint = {
  id: string; number: string; customerName: string; customerEmail: string;
  order_number: string; category: ComplaintCategory; title: string;
  description: string; status: ComplaintStatus; created_at: string;
  admin_reply: string | null;
};

const STATUS_CFG: Record<ComplaintStatus, { labelAr: string; color: string; bg: string; icon: React.ElementType }> = {
  open:      { labelAr:"مفتوحة",       color:"#f59e0b", bg:"rgba(245,158,11,0.1)",  icon:AlertCircle },
  in_review: { labelAr:"قيد المراجعة", color:"#3b82f6", bg:"rgba(59,130,246,0.1)",  icon:Clock },
  resolved:  { labelAr:"تم الحل",      color:"#22c55e", bg:"rgba(34,197,94,0.1)",   icon:CheckCircle },
  closed:    { labelAr:"مغلقة",        color:"#666",    bg:"rgba(100,100,100,0.1)", icon:X },
};

const CAT_AR: Record<ComplaintCategory, string> = { delay:"تأخر التسليم", quality:"جودة المنتج", wrong_item:"منتج خاطئ", damage:"منتج تالف", other:"أخرى" };

function StatusBadge({ status }: { status: ComplaintStatus }) {
  const cfg = STATUS_CFG[status];
  const Icon = cfg.icon;
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:"0.3rem", padding:"0.25rem 0.7rem", borderRadius:999, fontSize:"0.7rem", fontWeight:700, background:cfg.bg, color:cfg.color, border:"1px solid "+cfg.color+"30" }}>
      <Icon size={11}/>{cfg.labelAr}
    </span>
  );
}

export default function AdminComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading]       = useState(true);
  const [expanded, setExpanded]     = useState<string | null>(null);
  const [replies, setReplies]       = useState<Record<string,string>>({});
  const [sending, setSending]       = useState<string | null>(null);
  const [search, setSearch]         = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ComplaintStatus>("all");

  const [needLogin, setNeedLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);

  async function fetchComplaints() {
    setLoading(true);
    const res = await fetch("/api/admin/complaints");
    if (res.status === 401) {
      setNeedLogin(true);
      setLoading(false);
      return;
    }
    const data = await res.json();
    setComplaints(data.complaints ?? []);
    setNeedLogin(false);
    setLoading(false);
  }

  useEffect(() => { fetchComplaints(); }, []);

  const login = async () => {
    setLoginError(null);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) { setLoginError(j.error ?? "تعذّر تسجيل الدخول"); return; }
    setPassword("");
    fetchComplaints();
  };

  const loginInputStyle: React.CSSProperties = {
    width: "100%", boxSizing: "border-box", padding: "0.65rem 1rem", borderRadius: 10,
    border: "1.5px solid rgba(154,106,42,0.25)", background: "#F2E8D0",
    color: "#2C1E15", fontSize: "0.88rem", outline: "none", fontFamily: "Tajawal, Cairo, sans-serif",
  };

  const filtered = useMemo(() => {
    let list = complaints;
    if (statusFilter !== "all") list = list.filter((c) => c.status===statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((c) => c.number.toLowerCase().includes(q) || (c.customerName||"").toLowerCase().includes(q) || (c.customerEmail||"").toLowerCase().includes(q) || c.title.toLowerCase().includes(q));
    }
    return list;
  }, [complaints, statusFilter, search]);

  const stats = useMemo(() => ({
    total:     complaints.length,
    open:      complaints.filter((c)=>c.status==="open").length,
    in_review: complaints.filter((c)=>c.status==="in_review").length,
    resolved:  complaints.filter((c)=>c.status==="resolved").length,
  }), [complaints]);

  async function changeStatus(id: string, status: ComplaintStatus) {
    setComplaints((p) => p.map((c) => c.id===id?{...c,status}:c));
    const res = await fetch("/api/admin/complaints", { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({id,status}) });
    if (res.status === 401) setNeedLogin(true);
  }

  async function sendReply(id: string) {
    const reply = replies[id]?.trim();
    if (!reply) return;
    setSending(id);
    const res = await fetch("/api/admin/complaints", { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({id,admin_reply:reply,status:"in_review"}) });
    if (res.status === 401) {
      setNeedLogin(true);
      setSending(null);
      return;
    }
    setComplaints((p) => p.map((c) => c.id===id?{...c,admin_reply:reply,status:"in_review"}:c));
    setReplies((p) => ({...p,[id]:""}));
    setSending(null);
  }

  return (
    <div dir="rtl" style={{ minHeight:"100vh", background:"#FDFBF7", fontFamily:"Tajawal, Cairo, sans-serif", display:"flex" }}>
      <AdminSidebar />
      <main style={{ flex:1, marginRight:240, padding:"2.5rem" }}>

        {needLogin ? (
          <div style={{ maxWidth: 380, background: "#F2E8D0", border: "1px solid rgba(154,106,42,0.25)", borderRadius: 14, padding: "1.75rem", display: "grid", gap: "0.9rem" }}>
            <div style={{ fontWeight: 800, color: "#2C1E15" }}>دخول المشرف</div>
            <input style={loginInputStyle} placeholder="البريد الإلكتروني" value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
            <input style={loginInputStyle} placeholder="كلمة المرور" value={password} onChange={(e) => setPassword(e.target.value)} type="password"
              onKeyDown={(e) => e.key === "Enter" && login()} />
            {loginError && <div style={{ color: "#f87171", fontSize: "0.8rem" }}>{loginError}</div>}
            <button onClick={login} style={{ background: G, color: "#2C1E15", fontWeight: 800, border: "none", borderRadius: 999, padding: "0.65rem", cursor: "pointer", fontFamily: "Tajawal, Cairo, sans-serif" }}>
              دخول
            </button>
          </div>
        ) : (
        <>

        <div style={{ marginBottom:"2rem" }}>
          <div style={{ fontSize:"0.7rem", color:"#C9A24B", letterSpacing:"0.2em", textTransform:"uppercase", marginBottom:"0.4rem" }}>إدارة الشكاوي</div>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <h1 style={{ fontSize:"1.8rem", fontWeight:900, color:"#2C1E15", margin:0 }}>شكاوي العملاء</h1>
            <button onClick={fetchComplaints} disabled={loading} style={{ display:"flex", alignItems:"center", gap:"0.5rem", padding:"0.6rem 1.2rem", borderRadius:999, border:"1.5px solid rgba(201,162,75,0.3)", background:"transparent", color:"#C9A24B", fontSize:"0.82rem", fontWeight:600, cursor:loading?"not-allowed":"pointer", fontFamily:"Tajawal, Cairo, sans-serif" }}>
              <RefreshCw size={14} style={{ animation:loading?"spin 1s linear infinite":"none" }}/> تحديث
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"1rem", marginBottom:"2rem" }}>
          {[
            { label:"إجمالي الشكاوي", value:stats.total,     color:"#C9A24B" },
            { label:"مفتوحة",         value:stats.open,      color:"#f59e0b" },
            { label:"قيد المراجعة",   value:stats.in_review, color:"#3b82f6" },
            { label:"تم الحل",        value:stats.resolved,  color:"#22c55e" },
          ].map((s,i) => (
            <div key={i} style={{ background:"#F2E8D0", borderRadius:14, padding:"1.1rem 1.5rem", border:"1px solid rgba(154,106,42,0.25)", display:"flex", alignItems:"center", gap:"1rem" }}>
              <div style={{ width:6, height:40, borderRadius:4, background:s.color, flexShrink:0 }} />
              <div>
                <div style={{ fontSize:"1.6rem", fontWeight:900, color:"#2C1E15", lineHeight:1 }}>{s.value}</div>
                <div style={{ fontSize:"0.72rem", color:"#5A3E28", marginTop:"0.2rem" }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Search + Filter */}
        <div style={{ display:"flex", gap:"0.75rem", marginBottom:"1.5rem", flexWrap:"wrap" }}>
          <div style={{ position:"relative", flex:1, minWidth:220 }}>
            <Search size={14} style={{ position:"absolute", top:"50%", right:"1rem", transform:"translateY(-50%)", color:"#555", pointerEvents:"none" }} />
            <input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="ابحث بالاسم أو رقم الشكوى..."
              style={{ width:"100%", padding:"0.65rem 2.5rem 0.65rem 1rem", borderRadius:10, border:"1.5px solid rgba(154,106,42,0.25)", background:"rgba(0,0,0,0.06)", color:"#2C1E15", fontSize:"0.82rem", outline:"none", fontFamily:"Tajawal, Cairo, sans-serif", boxSizing:"border-box" as const }}
              onFocus={(e)=>(e.target.style.borderColor="rgba(201,162,75,0.5)")}
              onBlur={(e) =>(e.target.style.borderColor="rgba(154,106,42,0.25)")}
            />
          </div>
          <div style={{ display:"flex", gap:"0.5rem" }}>
            {(["all","open","in_review","resolved","closed"] as const).map((f) => (
              <button key={f} onClick={()=>setStatusFilter(f)} style={{ padding:"0.55rem 1rem", borderRadius:999, fontSize:"0.75rem", fontWeight:600, border:"1.5px solid "+(statusFilter===f?"rgba(201,162,75,0.5)":"rgba(201,162,75,0.12)"), background:statusFilter===f?"rgba(201,162,75,0.1)":"transparent", color:statusFilter===f?"#C9A24B":"#666", cursor:"pointer", fontFamily:"Tajawal, Cairo, sans-serif" }}>
                {f==="all"?"الكل":STATUS_CFG[f as ComplaintStatus].labelAr}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div style={{ background:"#F2E8D0", borderRadius:16, border:"1px solid rgba(154,106,42,0.25)", padding:"4rem", textAlign:"center", color:"#5A3E28" }}>
            <div style={{ width:32,height:32,border:"3px solid rgba(201,162,75,0.2)",borderTopColor:"#C9A24B",borderRadius:"50%",animation:"spin 0.8s linear infinite",margin:"0 auto 1rem" }}/>
            جارٍ التحميل...
          </div>
        ) : filtered.length===0 ? (
          <div style={{ background:"#F2E8D0", borderRadius:16, border:"1px solid rgba(154,106,42,0.25)", padding:"4rem", textAlign:"center", color:"#5A3E28" }}>لا توجد شكاوي</div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem" }}>
            {filtered.map((c) => (
              <div key={c.id} style={{ background:"#F2E8D0", borderRadius:14, border:"1px solid "+(c.status==="open"?"rgba(245,158,11,0.35)":"rgba(154,106,42,0.25)"), overflow:"hidden" }}>
                <div onClick={()=>setExpanded(expanded===c.id?null:c.id)} style={{ padding:"1rem 1.5rem", display:"flex", alignItems:"center", justifyContent:"space-between", cursor:"pointer", gap:"1rem", flexWrap:"wrap" }} onMouseEnter={(e)=>((e.currentTarget as HTMLElement).style.background="rgba(201,162,75,0.02)")} onMouseLeave={(e)=>((e.currentTarget as HTMLElement).style.background="transparent")}>
                  <div style={{ display:"flex", alignItems:"center", gap:"1rem" }}>
                    <div style={{ width:42,height:42,borderRadius:10,background:STATUS_CFG[c.status].bg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                      {(()=>{ const Icon=STATUS_CFG[c.status].icon; return <Icon size={20} color={STATUS_CFG[c.status].color}/>; })()}
                    </div>
                    <div>
                      <div style={{ fontSize:"0.9rem", fontWeight:700, color:"#2C1E15" }}>{c.title}</div>
                      <div style={{ fontSize:"0.72rem", color:"#666", marginTop:"0.15rem", display:"flex", gap:"0.6rem", flexWrap:"wrap" }}>
                        <span style={{ color:"#C9A24B" }}>{c.customerName||"—"}</span>
                        <span>·</span><span dir="ltr">{c.number}</span>
                        <span>·</span><span dir="ltr">{c.order_number}</span>
                        <span>·</span><span>{CAT_AR[c.category]}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:"1rem" }}>
                    <StatusBadge status={c.status}/>
                    {c.admin_reply && <MessageSquare size={14} color="#C9A24B"/>}
                    <span style={{ fontSize:"0.72rem", color:"#555" }}>{c.created_at?.slice(0,10)}</span>
                    {expanded===c.id?<ChevronUp size={15} color="#555"/>:<ChevronDown size={15} color="#555"/>}
                  </div>
                </div>

                {expanded===c.id && (
                  <div style={{ borderTop:"1px solid rgba(255,255,255,0.05)", padding:"1.25rem 1.5rem", display:"flex", flexDirection:"column", gap:"1.25rem" }}>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.75rem" }}>
                      <div style={{ background:"rgba(255,255,255,0.02)", borderRadius:8, padding:"0.75rem 1rem" }}>
                        <div style={{ fontSize:"0.7rem", color:"#555", marginBottom:"0.25rem" }}>العميل</div>
                        <div style={{ fontSize:"0.85rem", color:"#2C1E15", fontWeight:600 }}>{c.customerName||"—"}</div>
                        <div style={{ fontSize:"0.75rem", color:"#666" }} dir="ltr">{c.customerEmail||"—"}</div>
                      </div>
                      <div style={{ background:"rgba(255,255,255,0.02)", borderRadius:8, padding:"0.75rem 1rem" }}>
                        <div style={{ fontSize:"0.7rem", color:"#555", marginBottom:"0.25rem" }}>التفاصيل</div>
                        <div style={{ fontSize:"0.82rem", color:"#CCC" }}>{CAT_AR[c.category]}</div>
                        <div style={{ fontSize:"0.72rem", color:"#666" }} dir="ltr">{c.order_number}</div>
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize:"0.7rem", color:"#555", fontWeight:700, marginBottom:"0.4rem", letterSpacing:"0.08em" }}>تفاصيل الشكوى</div>
                      <p style={{ fontSize:"0.85rem", color:"#CCC", lineHeight:1.8, margin:0, background:"rgba(255,255,255,0.02)", padding:"0.75rem 1rem", borderRadius:8 }}>{c.description}</p>
                    </div>

                    <div style={{ display:"flex", alignItems:"center", gap:"0.6rem", flexWrap:"wrap" }}>
                      <span style={{ fontSize:"0.78rem", color:"#666" }}>تغيير الحالة:</span>
                      {(["open","in_review","resolved","closed"] as ComplaintStatus[]).map((s) => (
                        <button key={s} onClick={()=>changeStatus(c.id,s)} style={{ padding:"0.3rem 0.85rem", borderRadius:999, fontSize:"0.72rem", fontWeight:600, border:"1px solid "+(c.status===s?STATUS_CFG[s].color+"60":"rgba(255,255,255,0.08)"), background:c.status===s?STATUS_CFG[s].bg:"transparent", color:c.status===s?STATUS_CFG[s].color:"#666", cursor:"pointer", fontFamily:"Tajawal, Cairo, sans-serif" }}>
                          {STATUS_CFG[s].labelAr}
                        </button>
                      ))}
                    </div>

                    {c.admin_reply && (
                      <div style={{ background:"rgba(201,162,75,0.06)", border:"1px solid rgba(201,162,75,0.15)", borderRadius:10, padding:"1rem 1.25rem" }}>
                        <div style={{ fontSize:"0.7rem", color:"#C9A24B", fontWeight:700, marginBottom:"0.4rem", display:"flex", alignItems:"center", gap:"0.4rem" }}><MessageSquare size={12}/>الرد الحالي</div>
                        <p style={{ fontSize:"0.85rem", color:"#DDD", margin:0, lineHeight:1.8 }}>{c.admin_reply}</p>
                      </div>
                    )}

                    <div style={{ display:"flex", flexDirection:"column", gap:"0.6rem" }}>
                      <label style={{ fontSize:"0.78rem", color:"#C9A24B", fontWeight:600 }}>{c.admin_reply?"تعديل الرد":"الرد على الشكوى"}</label>
                      <textarea value={replies[c.id]||""} onChange={(e)=>setReplies((p)=>({...p,[c.id]:e.target.value}))} placeholder="اكتب ردك على العميل..." rows={3}
                        style={{ padding:"0.75rem 1rem", borderRadius:10, border:"1.5px solid rgba(154,106,42,0.25)", background:"rgba(0,0,0,0.06)", color:"#2C1E15", fontSize:"0.85rem", outline:"none", fontFamily:"Tajawal, Cairo, sans-serif", resize:"vertical", minHeight:80 }}
                        onFocus={(e)=>(e.target.style.borderColor="rgba(201,162,75,0.5)")}
                        onBlur={(e) =>(e.target.style.borderColor="rgba(154,106,42,0.25)")}
                      />
                      <button onClick={()=>sendReply(c.id)} disabled={!replies[c.id]?.trim()||sending===c.id}
                        style={{ alignSelf:"flex-end", display:"flex", alignItems:"center", gap:"0.5rem", padding:"0.65rem 1.4rem", borderRadius:999, background:(!replies[c.id]?.trim()||sending===c.id)?"rgba(201,162,75,0.25)":G, border:"none", color:"#2C1E15", fontWeight:700, fontSize:"0.82rem", cursor:(!replies[c.id]?.trim()||sending===c.id)?"not-allowed":"pointer", fontFamily:"Tajawal, Cairo, sans-serif" }}>
                        {sending===c.id?<span style={{ width:14,height:14,border:"2px solid #F4EFE6",borderTopColor:"transparent",borderRadius:"50%",display:"inline-block",animation:"spin 0.7s linear infinite" }}/>:<Send size={14}/>}
                        {sending===c.id?"جارٍ الإرسال...":"إرسال الرد"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        </>
        )}
      </main>
      <style dangerouslySetInnerHTML={{ __html:"@keyframes spin{to{transform:rotate(360deg)}}" }} />
    </div>
  );
}
