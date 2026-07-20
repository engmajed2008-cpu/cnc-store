"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { ShoppingBag, Settings, LogOut, AlertCircle, Plus, Clock, CheckCircle, MessageSquare, ChevronDown, ChevronUp, Send, X } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import BrandMark from "@/components/brand/BrandMark";

const G  = "linear-gradient(135deg,#C9A24B,#EBCB7C)";
const GT = { background: G, WebkitBackgroundClip: "text" as const, WebkitTextFillColor: "transparent" };

type ComplaintStatus = "open" | "in_review" | "resolved" | "closed";
type ComplaintCategory = "delay" | "quality" | "wrong_item" | "damage" | "other";

type Complaint = {
  id: string; number: string; order_id: string; order_number: string;
  category: ComplaintCategory; title: string; description: string;
  status: ComplaintStatus; created_at: string; admin_reply: string | null;
};

const STATUS_CFG: Record<ComplaintStatus, { labelAr: string; labelEn: string; color: string; bg: string; icon: React.ElementType }> = {
  open:      { labelAr: "مفتوحة",       labelEn: "Open",      color: "#f59e0b", bg: "rgba(245,158,11,0.1)",  icon: AlertCircle },
  in_review: { labelAr: "قيد المراجعة", labelEn: "In Review", color: "#3b82f6", bg: "rgba(59,130,246,0.1)",  icon: Clock },
  resolved:  { labelAr: "تم الحل",      labelEn: "Resolved",  color: "#22c55e", bg: "rgba(34,197,94,0.1)",   icon: CheckCircle },
  closed:    { labelAr: "مغلقة",        labelEn: "Closed",    color: "#666",    bg: "rgba(100,100,100,0.1)", icon: X },
};

const CATS_AR: Record<ComplaintCategory, string> = { delay:"تأخر التسليم", quality:"جودة المنتج", wrong_item:"منتج خاطئ", damage:"منتج تالف", other:"أخرى" };
const CATS_EN: Record<ComplaintCategory, string> = { delay:"Delivery Delay", quality:"Quality Issue", wrong_item:"Wrong Item", damage:"Damaged Product", other:"Other" };

const DEMO_ORDERS = [
  { id: "ORD-2025-001", number: "ORD-2025-001" },
  { id: "ORD-2025-002", number: "ORD-2025-002" },
  { id: "ORD-2025-003", number: "ORD-2025-003" },
  { id: "ORD-2025-004", number: "ORD-2025-004" },
];

function StatusBadge({ status, ar }: { status: ComplaintStatus; ar: boolean }) {
  const cfg = STATUS_CFG[status];
  const Icon = cfg.icon;
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:"0.35rem", padding:"0.28rem 0.75rem", borderRadius:999, fontSize:"0.73rem", fontWeight:700, background:cfg.bg, color:cfg.color, border:"1px solid "+cfg.color+"30" }}>
      <Icon size={12} />{ar ? cfg.labelAr : cfg.labelEn}
    </span>
  );
}

function NavTab({ href, icon: Icon, label, active }: { href: string; icon: React.ElementType; label: string; active?: boolean }) {
  return (
    <Link href={href} style={{ display:"flex", alignItems:"center", gap:"0.6rem", padding:"0.7rem 1.1rem", borderRadius:10, textDecoration:"none", background:active?"rgba(201,162,75,0.1)":"transparent", border:"1px solid "+(active?"rgba(201,162,75,0.25)":"transparent"), color:active?"#C9A24B":"#888", fontSize:"0.85rem", fontWeight:active?700:500 }}>
      <Icon size={16} />{label}
    </Link>
  );
}

export default function ComplaintsPage() {
  const locale = useLocale();
  const ar = locale === "ar";

  const [user, setUser]             = useState<{ id: string; name: string; email: string; avatar: string | null } | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [expanded, setExpanded]     = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const [form, setForm]             = useState({ orderId: "", orderNumber: "", category: "" as ComplaintCategory | "", title: "", description: "" });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { window.location.href = "/" + locale + "/login"; return; }
      const u = data.user;
      const userData = { id: u.id, name: u.user_metadata?.full_name ?? u.user_metadata?.name ?? "", email: u.email ?? "", avatar: u.user_metadata?.avatar_url ?? null };
      setUser(userData);
      await fetchComplaints(u.id);
    });
  }, [locale]);

  async function fetchComplaints(userId: string) {
    setLoading(true);
    const { data } = await supabase
      .from("complaints")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    setComplaints((data ?? []) as Complaint[]);
    setLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/" + locale;
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.orderId)                e.orderId     = ar ? "اختر رقم الطلب" : "Select order";
    if (!form.category)               e.category    = ar ? "اختر نوع الشكوى" : "Select category";
    if (!form.title.trim())           e.title       = ar ? "اكتب عنواناً" : "Enter a title";
    if (form.description.trim().length < 20) e.description = ar ? "الوصف قصير (20 حرف على الأقل)" : "Too short (min 20 chars)";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    setFormErrors(errs);
    if (Object.keys(errs).length > 0) return;
    if (!user) return;
    setSubmitting(true);

    const number = "CMP-" + Date.now().toString().slice(-6);
    const { data, error } = await supabase.from("complaints").insert({
      number,
      user_id:      user.id,
      order_id:     form.orderId,
      order_number: form.orderId,
      category:     form.category,
      title:        form.title,
      description:  form.description,
      status:       "open",
    }).select().single();

    setSubmitting(false);
    if (!error && data) {
      setComplaints((p) => [data as Complaint, ...p]);
      setSubmitted(true);
      setShowForm(false);
      setForm({ orderId:"", orderNumber:"", category:"", title:"", description:"" });
      setTimeout(() => setSubmitted(false), 3500);
    }
  }

  if (!user) return (
    <div style={{ minHeight:"100vh", background:"transparent", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ width:36, height:36, border:"3px solid rgba(201,162,75,0.2)", borderTopColor:"#C9A24B", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
      <style dangerouslySetInnerHTML={{ __html:"@keyframes spin{to{transform:rotate(360deg)}}" }} />
    </div>
  );

  const cats = ar ? CATS_AR : CATS_EN;
  const inputStyle = { width:"100%", padding:"0.75rem 1rem", borderRadius:10, border:"1.5px solid rgba(201,162,75,0.15)", background:"rgba(255,255,255,0.04)", color:"#2C1E15", fontSize:"0.88rem", outline:"none", fontFamily:"Tajawal, Cairo, sans-serif", boxSizing:"border-box" as const };

  return (
    <div dir={ar?"rtl":"ltr"} style={{ minHeight:"100vh", background:"transparent", fontFamily:"Tajawal, Cairo, sans-serif" }}>

      {/* Top bar */}
      <div style={{ borderBottom:"1px solid rgba(201,162,75,0.08)", background:"rgba(13,13,13,0.95)", backdropFilter:"blur(10px)", position:"sticky", top:0, zIndex:50 }}>
        <div style={{ maxWidth:1100, margin:"0 auto", padding:"0 2rem", height:60, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <Link href={"/"+locale} style={{ textDecoration:"none", display:"flex", alignItems:"center", gap:"0.6rem" }}>
            <BrandMark size={34} />
            <span style={{ fontSize: ar ? "0.9rem" : "1rem", fontWeight:900, ...GT }}>{ar?"سوق الدعاية والإعلان":"E3lani"}</span>
          </Link>
          <button onClick={handleLogout} style={{ display:"flex", alignItems:"center", gap:"0.4rem", padding:"0.45rem 1rem", borderRadius:999, border:"1px solid rgba(239,68,68,0.25)", background:"rgba(239,68,68,0.06)", color:"#f87171", fontSize:"0.78rem", fontWeight:600, cursor:"pointer", fontFamily:"Tajawal, Cairo, sans-serif" }}>
            <LogOut size={13} />{ar?"تسجيل الخروج":"Sign Out"}
          </button>
        </div>
      </div>

      <div style={{ maxWidth:1100, margin:"0 auto", padding:"2.5rem 2rem", display:"grid", gridTemplateColumns:"280px 1fr", gap:"2rem" }} className="complaints-grid">

        {/* Sidebar */}
        <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
          <div style={{ background:"#F4EFE6", borderRadius:16, border:"1px solid rgba(201,162,75,0.1)", padding:"1.5rem", textAlign:"center" }}>
            {user.avatar ? (
              <img src={user.avatar} alt="" style={{ width:64, height:64, borderRadius:"50%", objectFit:"cover", border:"3px solid rgba(201,162,75,0.25)", margin:"0 auto 0.75rem", display:"block" }} />
            ) : (
              <div style={{ width:64, height:64, borderRadius:"50%", background:G, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.2rem", fontWeight:900, color:"#2C1E15", margin:"0 auto 0.75rem" }}>
                {(user.name||user.email).slice(0,2).toUpperCase()}
              </div>
            )}
            <div style={{ fontWeight:700, fontSize:"0.95rem", color:"#2C1E15" }}>{user.name||(ar?"العميل":"Customer")}</div>
            <div style={{ fontSize:"0.72rem", color:"#666", marginTop:"0.2rem" }} dir="ltr">{user.email}</div>
          </div>
          <div style={{ background:"#F4EFE6", borderRadius:16, border:"1px solid rgba(201,162,75,0.1)", padding:"0.75rem" }}>
            <NavTab href={"/"+locale+"/profile"}    icon={Settings}    label={ar?"الملف الشخصي":"Profile"} />
            <NavTab href={"/"+locale+"/orders"}     icon={ShoppingBag} label={ar?"طلباتي":"My Orders"} />
            <NavTab href={"/"+locale+"/complaints"} icon={AlertCircle} label={ar?"الشكاوي":"Complaints"} active />
          </div>
          <div style={{ background:"#F4EFE6", borderRadius:16, border:"1px solid rgba(201,162,75,0.1)", padding:"1.25rem" }}>
            <div style={{ fontSize:"0.72rem", color:"#555", marginBottom:"0.75rem", fontWeight:700, letterSpacing:"0.1em" }}>{ar?"ملخص":"SUMMARY"}</div>
            {(["open","in_review","resolved","closed"] as ComplaintStatus[]).map((s) => {
              const cfg = STATUS_CFG[s];
              const count = complaints.filter((c) => c.status===s).length;
              return (
                <div key={s} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"0.45rem 0", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                  <span style={{ fontSize:"0.78rem", color:cfg.color }}>{ar?cfg.labelAr:cfg.labelEn}</span>
                  <span style={{ fontSize:"0.82rem", fontWeight:700, color:"#2C1E15" }}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main */}
        <div style={{ display:"flex", flexDirection:"column", gap:"1.25rem" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:"1rem" }}>
            <div>
              <h1 style={{ fontSize:"1.3rem", fontWeight:900, color:"#2C1E15", margin:"0 0 0.25rem 0" }}>{ar?"شكاوي الطلبات":"Order Complaints"}</h1>
              <p style={{ fontSize:"0.82rem", color:"#666", margin:0 }}>{ar?"تابع شكاواك وتواصل مع فريق الدعم":"Track your complaints and contact support"}</p>
            </div>
            <button onClick={() => setShowForm(!showForm)} style={{ display:"flex", alignItems:"center", gap:"0.5rem", padding:"0.7rem 1.4rem", borderRadius:999, background:showForm?"rgba(239,68,68,0.1)":G, border:showForm?"1px solid rgba(239,68,68,0.3)":"none", color:showForm?"#f87171":"#2C1E15", fontWeight:700, fontSize:"0.88rem", cursor:"pointer", fontFamily:"Tajawal, Cairo, sans-serif" }}>
              {showForm?<X size={15}/>:<Plus size={15}/>}
              {showForm?(ar?"إلغاء":"Cancel"):(ar?"شكوى جديدة":"New Complaint")}
            </button>
          </div>

          {submitted && (
            <div style={{ padding:"0.9rem 1.25rem", borderRadius:12, background:"rgba(34,197,94,0.1)", border:"1px solid rgba(34,197,94,0.25)", color:"#4ade80", fontSize:"0.85rem", fontWeight:600, display:"flex", alignItems:"center", gap:"0.5rem" }}>
              <CheckCircle size={16}/>{ar?"تم إرسال شكواك بنجاح، سيتواصل معك فريقنا قريباً.":"Complaint submitted successfully. Our team will contact you soon."}
            </div>
          )}

          {showForm && (
            <div style={{ background:"#F4EFE6", borderRadius:16, border:"1px solid rgba(201,162,75,0.15)", padding:"1.75rem" }}>
              <h2 style={{ fontSize:"1rem", fontWeight:800, color:"#2C1E15", margin:"0 0 1.5rem 0" }}>{ar?"تقديم شكوى جديدة":"Submit New Complaint"}</h2>
              <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:"1.1rem" }}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem" }}>
                  <div style={{ display:"flex", flexDirection:"column", gap:"0.4rem" }}>
                    <label style={{ fontSize:"0.8rem", fontWeight:600, color:"#C9A24B" }}>{ar?"رقم الطلب":"Order Number"}</label>
                    <select value={form.orderId} onChange={(e) => setForm((p) => ({ ...p, orderId:e.target.value }))} style={{ ...inputStyle, appearance:"none" as const }}>
                      <option value="">{ar?"-- اختر الطلب --":"-- Select Order --"}</option>
                      {DEMO_ORDERS.map((o) => <option key={o.id} value={o.id}>{o.number}</option>)}
                    </select>
                    {formErrors.orderId && <span style={{ fontSize:"0.72rem", color:"#f87171" }}>{formErrors.orderId}</span>}
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:"0.4rem" }}>
                    <label style={{ fontSize:"0.8rem", fontWeight:600, color:"#C9A24B" }}>{ar?"نوع الشكوى":"Category"}</label>
                    <select value={form.category} onChange={(e) => setForm((p) => ({ ...p, category:e.target.value as ComplaintCategory }))} style={{ ...inputStyle, appearance:"none" as const }}>
                      <option value="">{ar?"-- اختر النوع --":"-- Select --"}</option>
                      {(Object.keys(cats) as ComplaintCategory[]).map((k) => <option key={k} value={k}>{cats[k]}</option>)}
                    </select>
                    {formErrors.category && <span style={{ fontSize:"0.72rem", color:"#f87171" }}>{formErrors.category}</span>}
                  </div>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:"0.4rem" }}>
                  <label style={{ fontSize:"0.8rem", fontWeight:600, color:"#C9A24B" }}>{ar?"عنوان الشكوى":"Title"}</label>
                  <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title:e.target.value }))} placeholder={ar?"وصف مختصر للمشكلة":"Brief issue description"} style={inputStyle} onFocus={(e)=>(e.target.style.borderColor="rgba(201,162,75,0.5)")} onBlur={(e)=>(e.target.style.borderColor="rgba(201,162,75,0.15)")} />
                  {formErrors.title && <span style={{ fontSize:"0.72rem", color:"#f87171" }}>{formErrors.title}</span>}
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:"0.4rem" }}>
                  <label style={{ fontSize:"0.8rem", fontWeight:600, color:"#C9A24B" }}>{ar?"تفاصيل الشكوى":"Details"}</label>
                  <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description:e.target.value }))} placeholder={ar?"اشرح المشكلة بالتفصيل...":"Explain the issue in detail..."} rows={4} style={{ ...inputStyle, resize:"vertical" as const, minHeight:90 }} onFocus={(e)=>(e.target.style.borderColor="rgba(201,162,75,0.5)")} onBlur={(e)=>(e.target.style.borderColor="rgba(201,162,75,0.15)")} />
                  <div style={{ fontSize:"0.7rem", color:form.description.length<20?"#666":"#22c55e", textAlign:ar?"right":"left" }}>{form.description.length} / 20 {ar?"حرف كحد أدنى":"chars minimum"}</div>
                  {formErrors.description && <span style={{ fontSize:"0.72rem", color:"#f87171" }}>{formErrors.description}</span>}
                </div>
                <button type="submit" disabled={submitting} style={{ padding:"0.85rem", borderRadius:999, background:submitting?"rgba(201,162,75,0.35)":G, border:"none", color:"#2C1E15", fontWeight:800, fontSize:"0.92rem", fontFamily:"Tajawal, Cairo, sans-serif", cursor:submitting?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:"0.5rem" }}>
                  {submitting ? <><span style={{ width:16,height:16,border:"2.5px solid #F4EFE6",borderTopColor:"transparent",borderRadius:"50%",display:"inline-block",animation:"spin 0.7s linear infinite" }}/>{ar?"جارٍ الإرسال...":"Submitting..."}</> : <><Send size={16}/>{ar?"إرسال الشكوى":"Submit"}</>}
                </button>
              </form>
            </div>
          )}

          {loading ? (
            <div style={{ background:"#F4EFE6", borderRadius:16, border:"1px solid rgba(201,162,75,0.1)", padding:"3rem", textAlign:"center" }}>
              <div style={{ width:32,height:32,border:"3px solid rgba(201,162,75,0.2)",borderTopColor:"#C9A24B",borderRadius:"50%",animation:"spin 0.8s linear infinite",margin:"0 auto" }} />
            </div>
          ) : complaints.length===0 ? (
            <div style={{ background:"#F4EFE6", borderRadius:16, border:"1px solid rgba(201,162,75,0.1)", padding:"4rem", textAlign:"center" }}>
              <AlertCircle size={40} color="rgba(201,162,75,0.2)" style={{ margin:"0 auto 1rem", display:"block" }} />
              <p style={{ color:"#555", fontSize:"0.9rem", margin:0 }}>{ar?"لا توجد شكاوي مسجلة":"No complaints submitted yet"}</p>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem" }}>
              {complaints.map((c) => (
                <div key={c.id} style={{ background:"#F4EFE6", borderRadius:14, border:"1px solid rgba(201,162,75,0.1)", overflow:"hidden" }}>
                  <div onClick={() => setExpanded(expanded===c.id?null:c.id)} style={{ padding:"1.1rem 1.5rem", display:"flex", alignItems:"center", justifyContent:"space-between", cursor:"pointer", gap:"1rem", flexWrap:"wrap" }} onMouseEnter={(e)=>((e.currentTarget as HTMLElement).style.background="rgba(201,162,75,0.02)")} onMouseLeave={(e)=>((e.currentTarget as HTMLElement).style.background="transparent")}>
                    <div style={{ display:"flex", alignItems:"center", gap:"1rem" }}>
                      <div style={{ width:40,height:40,borderRadius:10,background:STATUS_CFG[c.status].bg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                        {(() => { const Icon=STATUS_CFG[c.status].icon; return <Icon size={18} color={STATUS_CFG[c.status].color} />; })()}
                      </div>
                      <div>
                        <div style={{ fontSize:"0.9rem", fontWeight:700, color:"#2C1E15" }}>{c.title}</div>
                        <div style={{ fontSize:"0.72rem", color:"#666", marginTop:"0.15rem", display:"flex", gap:"0.75rem" }}>
                          <span dir="ltr">{c.number}</span><span>·</span>
                          <span dir="ltr">{c.order_number}</span><span>·</span>
                          <span>{ar?CATS_AR[c.category]:CATS_EN[c.category]}</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:"1rem" }}>
                      <StatusBadge status={c.status} ar={ar} />
                      <span style={{ fontSize:"0.72rem", color:"#555" }}>{c.created_at?.slice(0,10)}</span>
                      {c.admin_reply && <MessageSquare size={15} color="#C9A24B" />}
                      {expanded===c.id?<ChevronUp size={15} color="#555"/>:<ChevronDown size={15} color="#555"/>}
                    </div>
                  </div>
                  {expanded===c.id && (
                    <div style={{ borderTop:"1px solid rgba(255,255,255,0.05)", padding:"1.25rem 1.5rem", display:"flex", flexDirection:"column", gap:"1rem" }}>
                      <div>
                        <div style={{ fontSize:"0.7rem", color:"#555", fontWeight:700, marginBottom:"0.4rem", letterSpacing:"0.08em" }}>{ar?"تفاصيل الشكوى":"DETAILS"}</div>
                        <p style={{ fontSize:"0.85rem", color:"#CCC", lineHeight:1.8, margin:0, background:"rgba(255,255,255,0.02)", padding:"0.75rem 1rem", borderRadius:8 }}>{c.description}</p>
                      </div>
                      {c.admin_reply ? (
                        <div style={{ background:"rgba(201,162,75,0.06)", border:"1px solid rgba(201,162,75,0.15)", borderRadius:10, padding:"1rem 1.25rem" }}>
                          <div style={{ fontSize:"0.7rem", color:"#C9A24B", fontWeight:700, marginBottom:"0.4rem", display:"flex", alignItems:"center", gap:"0.4rem" }}><MessageSquare size={12}/>{ar?"رد فريق الدعم":"Support Team Reply"}</div>
                          <p style={{ fontSize:"0.85rem", color:"#DDD", margin:0, lineHeight:1.8 }}>{c.admin_reply}</p>
                        </div>
                      ) : (
                        <div style={{ fontSize:"0.78rem", color:"#555", fontStyle:"italic" }}>{ar?"لا يوجد رد بعد — سيتواصل معك فريقنا قريباً.":"No reply yet — our team will respond shortly."}</div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html:"@keyframes spin{to{transform:rotate(360deg)}} @media(max-width:768px){.complaints-grid{grid-template-columns:1fr!important}}" }} />
    </div>
  );
}
