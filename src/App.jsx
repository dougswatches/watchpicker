import { useState } from "react";
 
// ─── Quiz Data ────────────────────────────────────────────────────────────────
 
const questions = [
  {
    id: "budget", label: "What's your budget?",
    subtitle: "We'll find the best value in your range.", type: "single",
    options: [
      { value: "under_500", label: "Under $500" },
      { value: "500_2000", label: "$500 – $2,000" },
      { value: "2000_5000", label: "$2,000 – $5,000" },
      { value: "5000_15000", label: "$5,000 – $15,000" },
      { value: "above_15000", label: "$15,000+" },
    ],
  },
  {
    id: "use_case", label: "How will you wear it?",
    subtitle: "Pick everything that applies.", type: "multi",
    options: [
      { value: "daily_driver", label: "Everyday wear" },
      { value: "office", label: "Business / office" },
      { value: "formal", label: "Formal occasions" },
      { value: "outdoor", label: "Outdoor / adventure" },
      { value: "sport", label: "Sport & fitness" },
      { value: "diving", label: "Diving / water" },
    ],
  },
  {
    id: "style", label: "What's your aesthetic?",
    subtitle: "Pick the vibe that resonates most.", type: "single",
    options: [
      { value: "classic", label: "Classic & timeless" },
      { value: "modern", label: "Clean & modern" },
      { value: "bold", label: "Bold & statement" },
      { value: "minimalist", label: "Minimal & understated" },
      { value: "vintage", label: "Vintage & retro" },
      { value: "technical", label: "Technical & tool-watch" },
    ],
  },
  {
    id: "brand_pref", label: "Any brand preferences?",
    subtitle: "Select all you're drawn to, or skip.", type: "multi",
    options: [
      { value: "rolex", label: "Rolex" },
      { value: "omega", label: "Omega" },
      { value: "seiko", label: "Seiko / Grand Seiko" },
      { value: "tudor", label: "Tudor" },
      { value: "breitling", label: "Breitling" },
      { value: "patek", label: "Patek / AP / VC" },
      { value: "independent", label: "Independent / micro-brands" },
      { value: "no_pref", label: "No preference" },
    ],
  },
  {
    id: "dress_vs_sport", label: "Dress or sport?",
    subtitle: "Where does your heart lie?", type: "single",
    options: [
      { value: "dress", label: "Dress — elegant and refined" },
      { value: "sport", label: "Sport — rugged and capable" },
      { value: "sport_dress", label: "Sport-dress — the best of both" },
      { value: "pilot", label: "Pilot / field watch" },
      { value: "diver", label: "Diver" },
      { value: "chronograph", label: "Chronograph" },
    ],
  },
  {
    id: "existing_watches", label: "What do you already own?",
    subtitle: "We'll make sure this recommendation complements your collection.",
    type: "text", placeholder: "e.g. Seiko SKX, nothing yet, a Casio G-Shock…",
  },
];
 
const budgetLabels = {
  under_500: "under $500", "500_2000": "$500–$2,000",
  "2000_5000": "$2,000–$5,000", "5000_15000": "$5,000–$15,000",
  above_15000: "above $15,000",
};
 
function buildPrompt(answers) {
  const budget = budgetLabels[answers.budget] || answers.budget;
  const useCase = (answers.use_case || []).join(", ") || "general use";
  const style = answers.style || "any";
  const brands = (answers.brand_pref || []).join(", ") || "no preference";
  const type = answers.dress_vs_sport || "any";
  const existing = answers.existing_watches || "nothing specified";
  return `You are a world-class watch expert. Recommend exactly 3 watches for this customer:
- Budget: ${budget}
- Use case: ${useCase}
- Style: ${style}
- Brand preferences: ${brands}
- Watch type: ${type}
- Already owns: ${existing}
 
Available platform keys and what they stock:
- "chrono24" — pre-owned and grey market, all brands
- "watchfinder" — pre-owned luxury (Rolex, Omega, TAG, Breitling, IWC etc)
- "watchenclave" — pre-owned mid to high-end
- "zeitauktion" — pre-owned European auction, mid to high-end
- "ebay" — pre-owned all price points, vintage, grey market
- "amazon" — new watches, mainstream brands (Seiko, Citizen, Casio, Orient, Tissot, Hamilton etc)
- "goldsmiths" — new, authorised dealer (mid to luxury: TAG, Longines, Omega, Breitling, Tudor)
- "beaverbrooks" — new, authorised dealer (mid range: Seiko, Citizen, TAG, Tissot, Frederique Constant)
- "chisholmhunter" — new, authorised dealer (mid to luxury, Scotland-based)
- "thbaker" — new, authorised dealer (mid range UK)
- "houseofwatches" — new and pre-owned, wide range
- "cwsellors" — new, mid range UK (Seiko, Citizen, Tissot, Hamilton, Rotary)
- "fhinds" — new, budget to mid range UK (Seiko, Citizen, Casio, Rotary, Lorus)
- "citizen" — new Citizen brand watches only
 
Return ONLY a raw JSON array of 3 objects:
- "name": string
- "price": string
- "availability": "new" | "preowned" | "both"
- "reason": string (2-3 sentences)
- "specs": array of 3 strings
- "platforms": array of platform keys that genuinely stock this watch
 
No markdown, no code blocks. Start with [ end with ].`;
}
 
// ─── Nav Config ───────────────────────────────────────────────────────────────
 
const NAV_ITEMS = [
  { id: "finder",         label: "Watch Finder",        icon: "◎", badge: "FREE",    live: true  },
  { id: "valuation",      label: "Valuation Tool",      icon: "◈", badge: "FREE",    live: true  },
  { id: "shouldibuy",     label: "Should I Buy This?",  icon: "◇", badge: "COMING",  live: false },
  { id: "authentication", label: "Authentication",       icon: "◉", badge: "COMING",  live: false },
  { id: "collection",     label: "My Collection",        icon: "▣", badge: "PRO",     live: false },
];
 
// ─── Icons ────────────────────────────────────────────────────────────────────
 
const ArrowRight = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const ArrowLeft = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
    <path d="M13 8H3M7 12L3 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const CheckIcon = () => (
  <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
    <polyline points="2.5,7 5.5,10 11.5,4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const ExternalIcon = () => (
  <svg width="10" height="10" viewBox="0 0 13 13" fill="none">
    <path d="M5 2H2a1 1 0 00-1 1v8a1 1 0 001 1h8a1 1 0 001-1V8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    <path d="M8 1h4v4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="12" y1="1" x2="6" y2="7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
);
const MenuIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <line x1="3" y1="6" x2="17" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="3" y1="10" x2="17" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="3" y1="14" x2="17" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);
const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <line x1="3" y1="3" x2="15" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="15" y1="3" x2="3" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);
 
// ─── Coming Soon Page ─────────────────────────────────────────────────────────
 
const COMING_SOON_CONTENT = {
  valuation: {
    title: "Watch Valuation Tool",
    description: "Upload a photo or describe your watch and get an instant market valuation with buy/sell guidance, condition grading, and suggested listing platforms.",
    features: ["AI-powered market pricing", "Low / mid / high value range", "Condition grading guide", "PDF insurance report — £4.99"],
  },
  shouldibuy: {
    title: "Should I Buy This?",
    description: "Paste a listing URL or describe a watch you're considering. Get an instant red flag analysis, price fairness check, and confidence verdict before you spend.",
    features: ["Price fairness check", "Red flag detection", "Reference verification", "Alternative recommendations"],
  },
  authentication: {
    title: "Authentication Assistant",
    description: "Upload photos of a watch you're considering buying. Our AI checks for common counterfeit tells specific to that reference and returns a confidence verdict.",
    features: ["Multi-image analysis", "Model-specific counterfeit checks", "Confidence verdict", "Pay per check — £2.99"],
  },
  collection: {
    title: "My Collection",
    description: "Log your watches and let our AI manage your portfolio. Track values over time, get insurance valuations, and receive personalised sell alerts.",
    features: ["Portfolio value tracking", "Insurance PDF export", "Sell timing alerts", "Next watch recommendations"],
    pro: true,
  },
};
 
function ComingSoon({ toolId }) {
  const content = COMING_SOON_CONTENT[toolId];
  if (!content) return null;
  return (
    <div style={{maxWidth:560,margin:"0 auto",padding:"3rem 1.5rem"}}>
      <div style={{marginBottom:"2.5rem"}}>
        <span style={{
          fontSize:"0.65rem",fontWeight:700,letterSpacing:"0.14em",
          padding:"0.25rem 0.6rem",borderRadius:2,
          background: content.pro ? "#1a1a1a" : "#f0f0f0",
          color: content.pro ? "#fff" : "#888",
          marginBottom:"1rem",display:"inline-block",
        }}>
          {content.pro ? "PRO FEATURE" : "COMING SOON"}
        </span>
        <h1 style={{fontSize:"1.75rem",fontWeight:700,color:"#1a1a1a",lineHeight:1.2,margin:"0.75rem 0 1rem"}}>
          {content.title}
        </h1>
        <p style={{fontSize:"0.95rem",lineHeight:1.7,color:"#555",maxWidth:480}}>
          {content.description}
        </p>
      </div>
 
      <div style={{
        background:"#fff",border:"1px solid #e8e8e8",borderRadius:4,
        padding:"1.5rem",marginBottom:"2rem"
      }}>
        <p style={{fontSize:"0.7rem",fontWeight:700,letterSpacing:"0.1em",color:"#888",marginBottom:"1rem"}}>
          WHAT'S INCLUDED
        </p>
        <div style={{display:"flex",flexDirection:"column",gap:"0.6rem"}}>
          {content.features.map((f, i) => (
            <div key={i} style={{display:"flex",alignItems:"center",gap:"0.75rem"}}>
              <div style={{
                width:18,height:18,borderRadius:"50%",flexShrink:0,
                background:"#1a1a1a",
                display:"flex",alignItems:"center",justifyContent:"center",color:"#fff"
              }}>
                <CheckIcon/>
              </div>
              <span style={{fontSize:"0.875rem",color:"#333",fontWeight:500}}>{f}</span>
            </div>
          ))}
        </div>
      </div>
 
      <div style={{
        background:"#f9f9f9",border:"1px solid #e8e8e8",borderRadius:4,
        padding:"1.25rem 1.5rem",display:"flex",alignItems:"center",justifyContent:"space-between",gap:"1rem"
      }}>
        <div>
          <p style={{fontSize:"0.875rem",fontWeight:600,color:"#1a1a1a",margin:0}}>Get notified when this launches</p>
          <p style={{fontSize:"0.8rem",color:"#888",margin:"0.2rem 0 0"}}>Be first to know — no spam.</p>
        </div>
        <a href="https://dougswatches.co.uk" target="_blank" rel="noopener noreferrer"
          style={{
            display:"inline-flex",alignItems:"center",gap:"0.4rem",
            fontSize:"0.78rem",fontWeight:700,letterSpacing:"0.05em",
            padding:"0.6rem 1rem",borderRadius:3,
            background:"#1a1a1a",color:"#fff",textDecoration:"none",whiteSpace:"nowrap",
          }}>
          NOTIFY ME <ArrowRight/>
        </a>
      </div>
    </div>
  );
}
 
// ─── Watch Card ───────────────────────────────────────────────────────────────
 
function WatchCard({ watch, index }) {
  const [showAll, setShowAll] = useState(false);
  const links = watch.buy_links || [];
  const visibleLinks = showAll ? links : links.slice(0, 3);
 
  return (
    <div style={{
      background:"#fff",border:"1px solid #e8e8e8",borderRadius:4,
      overflow:"hidden",animation:`fadeUp 0.4s ease both`,
      animationDelay:`${index * 0.1}s`,
    }}>
      <div style={{background:"#1a1a1a",padding:"1rem 1.25rem",display:"flex",alignItems:"center",gap:"0.75rem"}}>
        <span style={{fontSize:"0.7rem",fontWeight:700,letterSpacing:"0.12em",color:"#555",minWidth:20}}>
          0{index + 1}
        </span>
        <div style={{flex:1,minWidth:0}}>
          <p style={{fontSize:"1rem",fontWeight:700,color:"#fff",margin:0,lineHeight:1.3}}>{watch.name}</p>
          <p style={{fontSize:"0.8rem",color:"#999",margin:"0.2rem 0 0"}}>{watch.price}</p>
        </div>
        {watch.availability && (
          <span style={{
            fontSize:"0.62rem",fontWeight:700,letterSpacing:"0.1em",
            padding:"0.2rem 0.5rem",borderRadius:2,flexShrink:0,
            background: watch.availability === 'new' ? "#2d6a4f" : watch.availability === 'preowned' ? "#1d3557" : "#444",
            color:"#fff",whiteSpace:"nowrap",
          }}>
            {watch.availability === 'new' ? 'NEW' : watch.availability === 'preowned' ? 'PRE-OWNED' : 'NEW & PRE-OWNED'}
          </span>
        )}
      </div>
      <div style={{padding:"1.25rem"}}>
        <p style={{fontSize:"0.875rem",lineHeight:1.7,color:"#444",margin:"0 0 1rem"}}>{watch.reason}</p>
        <div style={{display:"flex",flexWrap:"wrap",gap:"0.35rem",marginBottom:"1.25rem"}}>
          {(watch.specs || []).map((spec,i) => (
            <span key={i} style={{
              fontSize:"0.75rem",padding:"0.2rem 0.55rem",borderRadius:2,
              background:"#f5f5f5",color:"#555",border:"1px solid #e8e8e8",fontWeight:500,
            }}>{spec}</span>
          ))}
        </div>
        {links.length > 0 && (
          <div style={{borderTop:"1px solid #f0f0f0",paddingTop:"1rem"}}>
            <p style={{fontSize:"0.68rem",fontWeight:700,letterSpacing:"0.1em",color:"#aaa",marginBottom:"0.6rem"}}>
              WHERE TO BUY
            </p>
            <div style={{display:"flex",flexWrap:"wrap",gap:"0.4rem"}}>
              {visibleLinks.map((link, i) => (
                <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                  style={{
                    display:"inline-flex",alignItems:"center",gap:"0.3rem",
                    fontSize:"0.75rem",fontWeight:600,color:"#1a1a1a",
                    textDecoration:"none",letterSpacing:"0.03em",
                    padding:"0.35rem 0.65rem",border:"1px solid #e0e0e0",
                    borderRadius:3,background:"#fafafa",transition:"all 0.12s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor="#1a1a1a"; e.currentTarget.style.background="#f0f0f0"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor="#e0e0e0"; e.currentTarget.style.background="#fafafa"; }}
                >
                  {link.label} <ExternalIcon/>
                </a>
              ))}
              {links.length > 3 && !showAll && (
                <button onClick={() => setShowAll(true)} style={{
                  fontSize:"0.75rem",fontWeight:600,color:"#888",
                  padding:"0.35rem 0.65rem",border:"1px solid #e0e0e0",
                  borderRadius:3,background:"#fafafa",cursor:"pointer",
                  fontFamily:"'Albert Sans',system-ui,sans-serif",
                }}>
                  +{links.length - 3} more
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
 
// ─── Loader ───────────────────────────────────────────────────────────────────
 
const Loader = () => (
  <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"1.5rem",padding:"4rem 2rem"}}>
    <div style={{width:36,height:36,borderRadius:"50%",border:"2px solid #e8e8e8",borderTopColor:"#1a1a1a",animation:"spin 0.8s linear infinite"}}/>
    <div style={{textAlign:"center"}}>
      <p style={{fontSize:"0.95rem",fontWeight:600,color:"#1a1a1a",margin:"0 0 0.25rem"}}>Finding your watches</p>
      <p style={{fontSize:"0.82rem",color:"#888",margin:0}}>Searching across all our partners…</p>
    </div>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}`}</style>
  </div>
);
 
// ─── Valuation Tool ──────────────────────────────────────────────────────────
 
const CONDITION_OPTIONS = [
  { value: "mint", label: "Mint — unworn, full set, as new" },
  { value: "excellent", label: "Excellent — minimal wear, complete" },
  { value: "very_good", label: "Very Good — light wear, keeping well" },
  { value: "good", label: "Good — visible wear, fully functional" },
  { value: "fair", label: "Fair — heavy wear, may need service" },
];
 
function ValuationTool() {
  const [formData, setFormData] = useState({ brand: "", model: "", reference: "", condition: "", notes: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
 
  const canSubmit = formData.brand.trim() && formData.model.trim() && formData.condition;
 
  const handleSubmit = async () => {
    setLoading(true); setError(null);
    try {
      const response = await fetch('/api/valuation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data.valuation) setResult(data.valuation);
      else throw new Error(data.error || 'No valuation returned');
    } catch (e) {
      setError('Something went wrong. Please check your inputs and try again.');
    } finally {
      setLoading(false);
    }
  };
 
  const reset = () => { setFormData({ brand: "", model: "", reference: "", condition: "", notes: "" }); setResult(null); setError(null); };
 
  const formatGBP = (n) => {
    if (!n && n !== 0) return "—";
    return "£" + Number(n).toLocaleString("en-GB");
  };
 
  if (loading) return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"1.5rem",padding:"4rem 2rem"}}>
      <div style={{width:36,height:36,borderRadius:"50%",border:"2px solid #e8e8e8",borderTopColor:"#1a1a1a",animation:"spin 0.8s linear infinite"}}/>
      <div style={{textAlign:"center"}}>
        <p style={{fontSize:"0.95rem",fontWeight:600,color:"#1a1a1a",margin:"0 0 0.25rem"}}>Valuing your watch</p>
        <p style={{fontSize:"0.82rem",color:"#888",margin:0}}>Analysing market data across all platforms…</p>
      </div>
    </div>
  );
 
  if (error) return (
    <div style={{textAlign:"center",padding:"3rem 1rem"}}>
      <p style={{color:"#c0392b",marginBottom:"1rem",fontSize:"0.9rem"}}>{error}</p>
      <button onClick={handleSubmit} style={{
        display:"inline-flex",alignItems:"center",gap:"0.5rem",
        padding:"0.6rem 1.25rem",borderRadius:3,fontSize:"0.8rem",fontWeight:700,
        letterSpacing:"0.05em",background:"#1a1a1a",color:"#fff",border:"none",cursor:"pointer",
        fontFamily:"'Albert Sans',system-ui,sans-serif",
      }}>TRY AGAIN</button>
    </div>
  );
 
  if (result) return <ValuationResult result={result} onReset={reset} formatGBP={formatGBP}/>;
 
  // ─── Input Form ───
  return (
    <div style={{maxWidth:560,margin:"0 auto",padding:"1.5rem"}}>
      <div style={{marginBottom:"2rem",paddingBottom:"1.25rem",borderBottom:"2px solid #1a1a1a"}}>
        <p style={{fontSize:"0.68rem",fontWeight:700,letterSpacing:"0.12em",color:"#888",marginBottom:"0.5rem"}}>
          VALUATION TOOL
        </p>
        <h2 style={{fontSize:"1.4rem",fontWeight:700,color:"#1a1a1a",lineHeight:1.2,marginBottom:"0.3rem"}}>
          What's your watch worth?
        </h2>
        <p style={{fontSize:"0.85rem",color:"#888"}}>
          Tell us about your watch and we'll give you an instant market valuation.
        </p>
      </div>
 
      <div style={{display:"flex",flexDirection:"column",gap:"1rem",marginBottom:"2rem"}}>
        {/* Brand */}
        <div>
          <label style={{display:"block",fontSize:"0.72rem",fontWeight:700,letterSpacing:"0.1em",color:"#888",marginBottom:"0.4rem"}}>
            BRAND *
          </label>
          <input type="text" placeholder="e.g. Rolex, Omega, Seiko…"
            value={formData.brand}
            onChange={e => setFormData(p => ({...p, brand: e.target.value}))}
            style={{
              width:"100%",padding:"0.75rem 1rem",border:"1px solid #e0e0e0",borderRadius:3,
              background:"#fff",color:"#1a1a1a",fontSize:"0.9rem",
              fontFamily:"'Albert Sans',system-ui,sans-serif",outline:"none",
            }}
            onFocus={e=>e.target.style.borderColor="#1a1a1a"}
            onBlur={e=>e.target.style.borderColor="#e0e0e0"}
          />
        </div>
 
        {/* Model */}
        <div>
          <label style={{display:"block",fontSize:"0.72rem",fontWeight:700,letterSpacing:"0.1em",color:"#888",marginBottom:"0.4rem"}}>
            MODEL *
          </label>
          <input type="text" placeholder="e.g. Submariner Date, Speedmaster Professional…"
            value={formData.model}
            onChange={e => setFormData(p => ({...p, model: e.target.value}))}
            style={{
              width:"100%",padding:"0.75rem 1rem",border:"1px solid #e0e0e0",borderRadius:3,
              background:"#fff",color:"#1a1a1a",fontSize:"0.9rem",
              fontFamily:"'Albert Sans',system-ui,sans-serif",outline:"none",
            }}
            onFocus={e=>e.target.style.borderColor="#1a1a1a"}
            onBlur={e=>e.target.style.borderColor="#e0e0e0"}
          />
        </div>
 
        {/* Reference */}
        <div>
          <label style={{display:"block",fontSize:"0.72rem",fontWeight:700,letterSpacing:"0.1em",color:"#888",marginBottom:"0.4rem"}}>
            REFERENCE NUMBER <span style={{fontWeight:400,letterSpacing:0,textTransform:"none",fontSize:"0.72rem"}}>(optional)</span>
          </label>
          <input type="text" placeholder="e.g. 126610LN, 310.30.42.50.01.002…"
            value={formData.reference}
            onChange={e => setFormData(p => ({...p, reference: e.target.value}))}
            style={{
              width:"100%",padding:"0.75rem 1rem",border:"1px solid #e0e0e0",borderRadius:3,
              background:"#fff",color:"#1a1a1a",fontSize:"0.9rem",
              fontFamily:"'Albert Sans',system-ui,sans-serif",outline:"none",
            }}
            onFocus={e=>e.target.style.borderColor="#1a1a1a"}
            onBlur={e=>e.target.style.borderColor="#e0e0e0"}
          />
        </div>
 
        {/* Condition */}
        <div>
          <label style={{display:"block",fontSize:"0.72rem",fontWeight:700,letterSpacing:"0.1em",color:"#888",marginBottom:"0.4rem"}}>
            CONDITION *
          </label>
          <div style={{display:"flex",flexDirection:"column",gap:"0.4rem"}}>
            {CONDITION_OPTIONS.map(opt => {
              const sel = formData.condition === opt.value;
              return (
                <button key={opt.value}
                  className={`opt-btn${sel?" selected":""}`}
                  onClick={() => setFormData(p => ({...p, condition: opt.value}))}>
                  <div style={{
                    width:18,height:18,borderRadius:"50%",flexShrink:0,
                    border:`2px solid ${sel?"#1a1a1a":"#ccc"}`,
                    background:sel?"#1a1a1a":"#fff",
                    display:"flex",alignItems:"center",justifyContent:"center",
                    color:"#fff",transition:"all 0.12s",
                  }}>
                    {sel && <CheckIcon/>}
                  </div>
                  <span style={{fontSize:"0.85rem"}}>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>
 
        {/* Notes */}
        <div>
          <label style={{display:"block",fontSize:"0.72rem",fontWeight:700,letterSpacing:"0.1em",color:"#888",marginBottom:"0.4rem"}}>
            ADDITIONAL NOTES <span style={{fontWeight:400,letterSpacing:0,textTransform:"none",fontSize:"0.72rem"}}>(optional)</span>
          </label>
          <textarea rows={2} placeholder="e.g. Box and papers, recently serviced, scratched crystal…"
            value={formData.notes}
            onChange={e => setFormData(p => ({...p, notes: e.target.value}))}
            style={{
              width:"100%",padding:"0.75rem 1rem",border:"1px solid #e0e0e0",borderRadius:3,
              background:"#fff",color:"#1a1a1a",fontSize:"0.9rem",
              fontFamily:"'Albert Sans',system-ui,sans-serif",resize:"vertical",outline:"none",lineHeight:1.6,
            }}
            onFocus={e=>e.target.style.borderColor="#1a1a1a"}
            onBlur={e=>e.target.style.borderColor="#e0e0e0"}
          />
        </div>
      </div>
 
      <button onClick={handleSubmit} disabled={!canSubmit} style={{
        display:"inline-flex",alignItems:"center",gap:"0.5rem",
        padding:"0.7rem 1.5rem",borderRadius:3,fontSize:"0.8rem",fontWeight:700,
        letterSpacing:"0.05em",
        background:canSubmit?"#1a1a1a":"#ccc",color:"#fff",border:"none",cursor:"pointer",
        fontFamily:"'Albert Sans',system-ui,sans-serif",width:"100%",justifyContent:"center",
      }}>
        VALUE MY WATCH <ArrowRight/>
      </button>
    </div>
  );
}
 
// ─── Valuation Result ────────────────────────────────────────────────────────
 
function ValuationResult({ result, onReset, formatGBP }) {
  const [showAllBuy, setShowAllBuy] = useState(false);
  const [showAllSell, setShowAllSell] = useState(false);
 
  const buyLinks = result.buy_links || [];
  const sellLinks = result.sell_links || [];
  const visibleBuy = showAllBuy ? buyLinks : buyLinks.slice(0, 3);
  const visibleSell = showAllSell ? sellLinks : sellLinks.slice(0, 3);
 
  const verdictColors = {
    BUY:  { bg: "#2d6a4f", text: "#fff" },
    HOLD: { bg: "#e9c46a", text: "#1a1a1a" },
    SELL: { bg: "#c0392b", text: "#fff" },
  };
  const vc = verdictColors[result.verdict] || verdictColors.HOLD;
 
  const trendIcon = result.market_trend === "rising" ? "↗" : result.market_trend === "falling" ? "↘" : "→";
  const trendColor = result.market_trend === "rising" ? "#2d6a4f" : result.market_trend === "falling" ? "#c0392b" : "#888";
 
  const confidenceColors = { high: "#2d6a4f", medium: "#e9c46a", low: "#c0392b" };
  const confColor = confidenceColors[result.confidence] || "#888";
 
  return (
    <div style={{maxWidth:600,margin:"0 auto",padding:"1.5rem"}}>
      {/* Header */}
      <div style={{marginBottom:"1.5rem",paddingBottom:"1.25rem",borderBottom:"2px solid #1a1a1a"}}>
        <p style={{fontSize:"0.68rem",fontWeight:700,letterSpacing:"0.12em",color:"#888",marginBottom:"0.4rem"}}>VALUATION REPORT</p>
        <h2 style={{fontSize:"1.5rem",fontWeight:700,color:"#1a1a1a",lineHeight:1.2}}>{result.watch_name}</h2>
      </div>
 
      {/* Value Card */}
      <div style={{
        background:"#1a1a1a",borderRadius:4,padding:"1.5rem",marginBottom:"1rem",
        animation:"fadeUp 0.4s ease both",
      }}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"1.25rem"}}>
          <p style={{fontSize:"0.68rem",fontWeight:700,letterSpacing:"0.12em",color:"#666"}}>ESTIMATED MARKET VALUE</p>
          <span style={{
            fontSize:"0.65rem",fontWeight:700,letterSpacing:"0.1em",
            padding:"0.2rem 0.6rem",borderRadius:2,
            background:vc.bg,color:vc.text,
          }}>{result.verdict}</span>
        </div>
        <div style={{display:"flex",alignItems:"baseline",gap:"0.5rem",marginBottom:"0.75rem"}}>
          <span style={{fontSize:"2rem",fontWeight:700,color:"#fff",lineHeight:1}}>{formatGBP(result.value_mid)}</span>
          <span style={{fontSize:"0.8rem",color:"#888",fontWeight:500}}>mid estimate</span>
        </div>
        <div style={{display:"flex",gap:"1.5rem",marginBottom:"1rem"}}>
          <div>
            <p style={{fontSize:"0.62rem",fontWeight:700,letterSpacing:"0.1em",color:"#555",marginBottom:"0.15rem"}}>LOW</p>
            <p style={{fontSize:"1rem",fontWeight:600,color:"#999",margin:0}}>{formatGBP(result.value_low)}</p>
          </div>
          <div>
            <p style={{fontSize:"0.62rem",fontWeight:700,letterSpacing:"0.1em",color:"#555",marginBottom:"0.15rem"}}>HIGH</p>
            <p style={{fontSize:"1rem",fontWeight:600,color:"#999",margin:0}}>{formatGBP(result.value_high)}</p>
          </div>
          {result.retail_price && (
            <div>
              <p style={{fontSize:"0.62rem",fontWeight:700,letterSpacing:"0.1em",color:"#555",marginBottom:"0.15rem"}}>RETAIL</p>
              <p style={{fontSize:"1rem",fontWeight:600,color:"#666",margin:0}}>{result.retail_price}</p>
            </div>
          )}
        </div>
        {/* Market Trend */}
        <div style={{
          borderTop:"1px solid rgba(255,255,255,0.08)",paddingTop:"0.85rem",
          display:"flex",alignItems:"center",gap:"0.5rem",
        }}>
          <span style={{fontSize:"1rem",color:trendColor}}>{trendIcon}</span>
          <span style={{fontSize:"0.78rem",color:"#999",fontWeight:500}}>
            Market {result.market_trend}
          </span>
          {result.market_trend_note && (
            <span style={{fontSize:"0.75rem",color:"#666",fontWeight:400}}>
              — {result.market_trend_note}
            </span>
          )}
        </div>
      </div>
 
      {/* Verdict */}
      <div style={{
        background:"#fff",border:"1px solid #e8e8e8",borderRadius:4,padding:"1.25rem",
        marginBottom:"1rem",animation:"fadeUp 0.4s ease both",animationDelay:"0.1s",
      }}>
        <p style={{fontSize:"0.68rem",fontWeight:700,letterSpacing:"0.1em",color:"#888",marginBottom:"0.6rem"}}>
          VERDICT — {result.verdict}
        </p>
        <p style={{fontSize:"0.875rem",lineHeight:1.7,color:"#444",margin:0}}>
          {result.verdict_reason}
        </p>
      </div>
 
      {/* Condition + Confidence row */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1rem",marginBottom:"1rem"}}>
        {/* Condition */}
        <div style={{
          background:"#fff",border:"1px solid #e8e8e8",borderRadius:4,padding:"1.25rem",
          animation:"fadeUp 0.4s ease both",animationDelay:"0.15s",
        }}>
          <p style={{fontSize:"0.68rem",fontWeight:700,letterSpacing:"0.1em",color:"#888",marginBottom:"0.5rem"}}>CONDITION</p>
          <p style={{fontSize:"1rem",fontWeight:700,color:"#1a1a1a",margin:"0 0 0.35rem"}}>{result.condition_grade}</p>
          <p style={{fontSize:"0.78rem",lineHeight:1.6,color:"#666",margin:0}}>{result.condition_notes}</p>
        </div>
        {/* Confidence */}
        <div style={{
          background:"#fff",border:"1px solid #e8e8e8",borderRadius:4,padding:"1.25rem",
          animation:"fadeUp 0.4s ease both",animationDelay:"0.2s",
        }}>
          <p style={{fontSize:"0.68rem",fontWeight:700,letterSpacing:"0.1em",color:"#888",marginBottom:"0.5rem"}}>CONFIDENCE</p>
          <div style={{display:"flex",alignItems:"center",gap:"0.5rem",marginBottom:"0.35rem"}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:confColor}}/>
            <p style={{fontSize:"1rem",fontWeight:700,color:"#1a1a1a",margin:0,textTransform:"capitalize"}}>{result.confidence}</p>
          </div>
          <p style={{fontSize:"0.78rem",lineHeight:1.6,color:"#666",margin:0}}>{result.confidence_note}</p>
        </div>
      </div>
 
      {/* Model History */}
      <div style={{
        background:"#fff",border:"1px solid #e8e8e8",borderRadius:4,padding:"1.25rem",
        marginBottom:"1rem",animation:"fadeUp 0.4s ease both",animationDelay:"0.25s",
      }}>
        <p style={{fontSize:"0.68rem",fontWeight:700,letterSpacing:"0.1em",color:"#888",marginBottom:"0.6rem"}}>ABOUT THIS MODEL</p>
        <p style={{fontSize:"0.875rem",lineHeight:1.7,color:"#444",margin:0}}>{result.model_history}</p>
      </div>
 
      {/* Where to Buy */}
      {buyLinks.length > 0 && (
        <div style={{
          background:"#fff",border:"1px solid #e8e8e8",borderRadius:4,padding:"1.25rem",
          marginBottom:"1rem",animation:"fadeUp 0.4s ease both",animationDelay:"0.3s",
        }}>
          <p style={{fontSize:"0.68rem",fontWeight:700,letterSpacing:"0.1em",color:"#888",marginBottom:"0.6rem"}}>WHERE TO BUY</p>
          <div style={{display:"flex",flexWrap:"wrap",gap:"0.4rem"}}>
            {visibleBuy.map((link, i) => (
              <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                style={{
                  display:"inline-flex",alignItems:"center",gap:"0.3rem",
                  fontSize:"0.75rem",fontWeight:600,color:"#1a1a1a",
                  textDecoration:"none",letterSpacing:"0.03em",
                  padding:"0.35rem 0.65rem",border:"1px solid #e0e0e0",
                  borderRadius:3,background:"#fafafa",transition:"all 0.12s",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor="#1a1a1a"; e.currentTarget.style.background="#f0f0f0"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor="#e0e0e0"; e.currentTarget.style.background="#fafafa"; }}
              >
                {link.label} <ExternalIcon/>
              </a>
            ))}
            {buyLinks.length > 3 && !showAllBuy && (
              <button onClick={() => setShowAllBuy(true)} style={{
                fontSize:"0.75rem",fontWeight:600,color:"#888",
                padding:"0.35rem 0.65rem",border:"1px solid #e0e0e0",
                borderRadius:3,background:"#fafafa",cursor:"pointer",
                fontFamily:"'Albert Sans',system-ui,sans-serif",
              }}>+{buyLinks.length - 3} more</button>
            )}
          </div>
        </div>
      )}
 
      {/* Where to Sell */}
      {sellLinks.length > 0 && (
        <div style={{
          background:"#fff",border:"1px solid #e8e8e8",borderRadius:4,padding:"1.25rem",
          marginBottom:"1.5rem",animation:"fadeUp 0.4s ease both",animationDelay:"0.35s",
        }}>
          <p style={{fontSize:"0.68rem",fontWeight:700,letterSpacing:"0.1em",color:"#888",marginBottom:"0.6rem"}}>WHERE TO SELL</p>
          <div style={{display:"flex",flexWrap:"wrap",gap:"0.4rem"}}>
            {visibleSell.map((link, i) => (
              <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                style={{
                  display:"inline-flex",alignItems:"center",gap:"0.3rem",
                  fontSize:"0.75rem",fontWeight:600,color:"#1a1a1a",
                  textDecoration:"none",letterSpacing:"0.03em",
                  padding:"0.35rem 0.65rem",border:"1px solid #e0e0e0",
                  borderRadius:3,background:"#fafafa",transition:"all 0.12s",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor="#1a1a1a"; e.currentTarget.style.background="#f0f0f0"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor="#e0e0e0"; e.currentTarget.style.background="#fafafa"; }}
              >
                {link.label} <ExternalIcon/>
              </a>
            ))}
            {sellLinks.length > 3 && !showAllSell && (
              <button onClick={() => setShowAllSell(true)} style={{
                fontSize:"0.75rem",fontWeight:600,color:"#888",
                padding:"0.35rem 0.65rem",border:"1px solid #e0e0e0",
                borderRadius:3,background:"#fafafa",cursor:"pointer",
                fontFamily:"'Albert Sans',system-ui,sans-serif",
              }}>+{sellLinks.length - 3} more</button>
            )}
          </div>
        </div>
      )}
 
      {/* Disclaimer + Reset */}
      <div style={{
        background:"#f9f9f9",border:"1px solid #e8e8e8",borderRadius:4,
        padding:"1rem 1.25rem",marginBottom:"1.5rem",
      }}>
        <p style={{fontSize:"0.75rem",lineHeight:1.6,color:"#888",margin:0}}>
          This valuation is an AI-generated estimate based on current market data. It is not a professional appraisal and should not be used for insurance purposes. Actual sale prices may vary depending on exact condition, provenance, and market timing.
        </p>
      </div>
 
      <button onClick={onReset} style={{
        display:"inline-flex",alignItems:"center",gap:"0.5rem",
        padding:"0.6rem 1.25rem",borderRadius:3,fontSize:"0.8rem",fontWeight:700,
        letterSpacing:"0.05em",background:"#f0f0f0",color:"#555",
        border:"1px solid #ddd",cursor:"pointer",
        fontFamily:"'Albert Sans',system-ui,sans-serif",
      }}>
        <ArrowLeft/> VALUE ANOTHER WATCH
      </button>
    </div>
  );
}
 
// ─── Watch Finder Tool ────────────────────────────────────────────────────────
 
function WatchFinder() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
 
  const q = questions[step];
  const isLast = step === questions.length - 1;
  const canAdvance = () => {
    if (q.type === "single") return !!answers[q.id];
    if (q.type === "multi") return (answers[q.id] || []).length > 0;
    return true;
  };
 
  const handleNext = () => { if (isLast) submitQuiz(); else setStep(s => s + 1); };
 
  const submitQuiz = async () => {
    setLoading(true); setError(null);
    try {
      const response = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: buildPrompt(answers) }),
      });
      const data = await response.json();
      if (data.watches) setResults(data.watches);
      else throw new Error('No watches');
    } catch (e) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };
 
  const reset = () => { setStep(0); setAnswers({}); setResults(null); setError(null); setLoading(false); };
 
  if (loading) return <Loader/>;
 
  if (error) return (
    <div style={{textAlign:"center",padding:"3rem 1rem"}}>
      <p style={{color:"#c0392b",marginBottom:"1rem",fontSize:"0.9rem"}}>{error}</p>
      <button onClick={submitQuiz} style={{
        display:"inline-flex",alignItems:"center",gap:"0.5rem",
        padding:"0.6rem 1.25rem",borderRadius:3,fontSize:"0.8rem",fontWeight:700,
        letterSpacing:"0.05em",background:"#1a1a1a",color:"#fff",border:"none",cursor:"pointer",
        fontFamily:"'Albert Sans',system-ui,sans-serif",
      }}>TRY AGAIN</button>
    </div>
  );
 
  if (results) return (
    <div style={{maxWidth:600,margin:"0 auto",padding:"1.5rem"}}>
      <div style={{marginBottom:"2rem",paddingBottom:"1.25rem",borderBottom:"2px solid #1a1a1a"}}>
        <p style={{fontSize:"0.68rem",fontWeight:700,letterSpacing:"0.12em",color:"#888",marginBottom:"0.4rem"}}>YOUR RESULTS</p>
        <h2 style={{fontSize:"1.5rem",fontWeight:700,color:"#1a1a1a",lineHeight:1.2}}>Three watches picked for you</h2>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:"1rem",marginBottom:"2rem"}}>
        {results.map((watch, i) => <WatchCard key={i} watch={watch} index={i}/>)}
      </div>
      <button onClick={reset} style={{
        display:"inline-flex",alignItems:"center",gap:"0.5rem",
        padding:"0.6rem 1.25rem",borderRadius:3,fontSize:"0.8rem",fontWeight:700,
        letterSpacing:"0.05em",background:"#f0f0f0",color:"#555",
        border:"1px solid #ddd",cursor:"pointer",
        fontFamily:"'Albert Sans',system-ui,sans-serif",
      }}><ArrowLeft/> START OVER</button>
    </div>
  );
 
  return (
    <div style={{maxWidth:560,margin:"0 auto",padding:"1.5rem"}}>
      <div style={{marginBottom:"2rem",paddingBottom:"1.25rem",borderBottom:"2px solid #1a1a1a"}}>
        <p style={{fontSize:"0.68rem",fontWeight:700,letterSpacing:"0.12em",color:"#888",marginBottom:"0.5rem"}}>
          QUESTION {step + 1} OF {questions.length}
        </p>
        <div style={{height:2,background:"#e8e8e8",marginBottom:"1.25rem"}}>
          <div style={{height:"100%",background:"#1a1a1a",width:`${(step/questions.length)*100}%`,transition:"width 0.3s ease"}}/>
        </div>
        <h2 style={{fontSize:"1.4rem",fontWeight:700,color:"#1a1a1a",lineHeight:1.2,marginBottom:"0.3rem"}}>{q.label}</h2>
        {q.subtitle && <p style={{fontSize:"0.85rem",color:"#888"}}>{q.subtitle}</p>}
      </div>
 
      {q.type === "single" && (
        <div style={{display:"flex",flexDirection:"column",gap:"0.5rem",marginBottom:"2rem"}}>
          {q.options.map(opt => {
            const sel = answers[q.id] === opt.value;
            return (
              <button key={opt.value}
                className={`opt-btn${sel?" selected":""}`}
                onClick={() => setAnswers(p => ({...p,[q.id]:opt.value}))}>
                <div style={{width:18,height:18,borderRadius:"50%",flexShrink:0,border:`2px solid ${sel?"#1a1a1a":"#ccc"}`,background:sel?"#1a1a1a":"#fff",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",transition:"all 0.12s"}}>
                  {sel && <CheckIcon/>}
                </div>
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
 
      {q.type === "multi" && (
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.5rem",marginBottom:"2rem"}}>
          {q.options.map(opt => {
            const sel = (answers[q.id]||[]).includes(opt.value);
            return (
              <button key={opt.value}
                className={`opt-btn${sel?" selected":""}`}
                onClick={() => {
                  const cur = answers[q.id]||[];
                  setAnswers(p => ({...p,[q.id]:cur.includes(opt.value)?cur.filter(v=>v!==opt.value):[...cur,opt.value]}));
                }}>
                <div style={{width:16,height:16,borderRadius:2,flexShrink:0,border:`2px solid ${sel?"#1a1a1a":"#ccc"}`,background:sel?"#1a1a1a":"#fff",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",transition:"all 0.12s"}}>
                  {sel && <CheckIcon/>}
                </div>
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
 
      {q.type === "text" && (
        <div style={{marginBottom:"2rem"}}>
          <textarea rows={3} placeholder={q.placeholder} value={answers[q.id]||""}
            onChange={e => setAnswers(p => ({...p,[q.id]:e.target.value}))}
            style={{width:"100%",padding:"0.85rem 1rem",border:"1px solid #e0e0e0",borderRadius:3,background:"#fff",color:"#1a1a1a",fontSize:"0.9rem",fontFamily:"'Albert Sans',system-ui,sans-serif",resize:"vertical",outline:"none",lineHeight:1.6}}
            onFocus={e=>e.target.style.borderColor="#1a1a1a"} onBlur={e=>e.target.style.borderColor="#e0e0e0"}
          />
        </div>
      )}
 
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <button onClick={()=>setStep(s=>s-1)} disabled={step===0} style={{
          display:"inline-flex",alignItems:"center",gap:"0.5rem",padding:"0.6rem 1.25rem",
          borderRadius:3,fontSize:"0.8rem",fontWeight:700,letterSpacing:"0.05em",
          background:"#f0f0f0",color:"#555",border:"1px solid #ddd",cursor:"pointer",
          fontFamily:"'Albert Sans',system-ui,sans-serif",opacity:step===0?0.35:1,
        }}><ArrowLeft/> BACK</button>
        <button onClick={handleNext} disabled={!canAdvance()} style={{
          display:"inline-flex",alignItems:"center",gap:"0.5rem",padding:"0.6rem 1.25rem",
          borderRadius:3,fontSize:"0.8rem",fontWeight:700,letterSpacing:"0.05em",
          background:canAdvance()?"#1a1a1a":"#ccc",color:"#fff",border:"none",cursor:"pointer",
          fontFamily:"'Albert Sans',system-ui,sans-serif",
        }}>{isLast?"FIND MY WATCHES":"NEXT"} <ArrowRight/></button>
      </div>
    </div>
  );
}
 
// ─── App Shell ────────────────────────────────────────────────────────────────
 
export default function App() {
  const [activePage, setActivePage] = useState("finder");
  const [sidebarOpen, setSidebarOpen] = useState(false);
 
  const activeNav = NAV_ITEMS.find(n => n.id === activePage);
 
  return (
    <div style={{display:"flex",minHeight:"100vh",background:"#f5f5f3",fontFamily:"'Albert Sans',system-ui,sans-serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Albert+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { margin: 0; background: #f5f5f3; }
        .opt-btn {
          display: flex; align-items: center; gap: 0.75rem;
          width: 100%; padding: 0.75rem 1rem;
          background: #fff; border: 1px solid #e0e0e0; border-radius: 3px;
          cursor: pointer; font-size: 0.9rem;
          font-family: 'Albert Sans', system-ui, sans-serif;
          color: #1a1a1a; font-weight: 500; text-align: left;
          transition: border-color 0.12s;
        }
        .opt-btn:hover { border-color: #1a1a1a; }
        .opt-btn.selected { border-color: #1a1a1a; background: #fafafa; }
        .nav-item {
          display: flex; align-items: center; gap: 0.65rem;
          padding: 0.6rem 1rem; border-radius: 3px; cursor: pointer;
          transition: background 0.12s; width: 100%; border: none;
          font-family: 'Albert Sans', system-ui, sans-serif;
          font-size: 0.82rem; font-weight: 600; letter-spacing: 0.01em;
          text-align: left; background: transparent; color: #888;
        }
        .nav-item:hover { background: rgba(255,255,255,0.06); color: #ccc; }
        .nav-item.active { background: rgba(255,255,255,0.1); color: #fff; }
        .nav-item.disabled { opacity: 0.45; cursor: default; }
        .nav-item.disabled:hover { background: transparent; color: #888; }
        @media (max-width: 768px) {
          .sidebar { transform: translateX(-100%); transition: transform 0.25s ease; position: fixed !important; z-index: 100; height: 100vh !important; }
          .sidebar.open { transform: translateX(0); }
          .overlay { display: block !important; }
        }
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>
 
      {/* Sidebar overlay for mobile */}
      <div className="overlay" onClick={() => setSidebarOpen(false)} style={{
        display:"none",position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:99,
      }}/>
 
      {/* Sidebar */}
      <aside className={`sidebar${sidebarOpen?" open":""}`} style={{
        width:220,background:"#1a1a1a",display:"flex",flexDirection:"column",
        position:"sticky",top:0,height:"100vh",flexShrink:0,
      }}>
        {/* Logo */}
        <div style={{padding:"1.25rem 1rem 1rem",borderBottom:"1px solid rgba(255,255,255,0.07)"}}>
          <a href="https://dougswatches.co.uk" target="_blank" rel="noopener noreferrer"
            style={{textDecoration:"none",display:"block"}}>
            <p style={{fontSize:"0.95rem",fontWeight:700,color:"#fff",letterSpacing:"0.01em",margin:0}}>
              Doug's Watches
            </p>
            <p style={{fontSize:"0.65rem",color:"#666",letterSpacing:"0.1em",margin:"0.2rem 0 0"}}>
              TOOLS & RESEARCH
            </p>
          </a>
        </div>
 
        {/* Nav */}
        <nav style={{flex:1,padding:"0.75rem 0.5rem",display:"flex",flexDirection:"column",gap:"0.15rem"}}>
          <p style={{fontSize:"0.6rem",fontWeight:700,letterSpacing:"0.14em",color:"#555",padding:"0.5rem 0.5rem 0.25rem"}}>
            TOOLS
          </p>
          {NAV_ITEMS.map(item => (
            <button key={item.id}
              className={`nav-item${activePage===item.id?" active":""}${!item.live?" disabled":""}`}
              onClick={() => { if (item.live || true) { setActivePage(item.id); setSidebarOpen(false); } }}>
              <span style={{fontSize:"0.8rem",opacity:0.7}}>{item.icon}</span>
              <span style={{flex:1}}>{item.label}</span>
              <span style={{
                fontSize:"0.58rem",fontWeight:700,letterSpacing:"0.1em",
                padding:"0.15rem 0.4rem",borderRadius:2,
                background: item.badge === "FREE" ? "rgba(45,106,79,0.4)" :
                            item.badge === "PRO" ? "rgba(255,255,255,0.15)" :
                            "rgba(255,255,255,0.07)",
                color: item.badge === "FREE" ? "#6fcf97" :
                       item.badge === "PRO" ? "#fff" : "#555",
              }}>{item.badge}</span>
            </button>
          ))}
        </nav>
 
        {/* Footer */}
        <div style={{padding:"1rem",borderTop:"1px solid rgba(255,255,255,0.07)"}}>
          <a href="https://dougswatches.co.uk" target="_blank" rel="noopener noreferrer"
            style={{
              display:"flex",alignItems:"center",gap:"0.5rem",
              fontSize:"0.75rem",fontWeight:600,color:"#555",
              textDecoration:"none",letterSpacing:"0.03em",
              transition:"color 0.12s",
            }}
            onMouseEnter={e=>e.currentTarget.style.color="#aaa"}
            onMouseLeave={e=>e.currentTarget.style.color="#555"}
          >
            <ArrowLeft/> Back to site
          </a>
        </div>
      </aside>
 
      {/* Main */}
      <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0}}>
        {/* Top bar */}
        <header style={{
          background:"#fff",borderBottom:"1px solid #e8e8e8",
          padding:"0 1.5rem",height:52,
          display:"flex",alignItems:"center",justifyContent:"space-between",
          position:"sticky",top:0,zIndex:10,flexShrink:0,
        }}>
          <div style={{display:"flex",alignItems:"center",gap:"0.75rem"}}>
            {/* Mobile menu button */}
            <button onClick={()=>setSidebarOpen(s=>!s)} style={{
              display:"none",background:"none",border:"none",cursor:"pointer",
              color:"#1a1a1a",padding:"0.25rem",
            }} className="mobile-menu-btn">
              {sidebarOpen ? <CloseIcon/> : <MenuIcon/>}
            </button>
            <div>
              <p style={{fontSize:"0.95rem",fontWeight:700,color:"#1a1a1a",margin:0,lineHeight:1}}>
                {activeNav?.label}
              </p>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:"0.75rem"}}>
            <span style={{
              fontSize:"0.68rem",fontWeight:700,letterSpacing:"0.1em",
              padding:"0.25rem 0.6rem",borderRadius:2,
              background:"#f0f0f0",color:"#888",
            }}>
              {activeNav?.badge}
            </span>
            <a href="https://dougswatches.co.uk" target="_blank" rel="noopener noreferrer"
              style={{
                fontSize:"0.75rem",fontWeight:700,letterSpacing:"0.05em",
                padding:"0.45rem 0.9rem",borderRadius:3,
                background:"#1a1a1a",color:"#fff",textDecoration:"none",
              }}>
              SIGN IN
            </a>
          </div>
        </header>
 
        {/* Page content */}
        <main style={{flex:1,overflowY:"auto",padding:"0"}}>
          <style>{`
            @media (max-width: 768px) {
              .mobile-menu-btn { display: flex !important; }
            }
          `}</style>
          {activePage === "finder" && <WatchFinder/>}
          {activePage === "valuation" && <ValuationTool/>}
          {activePage !== "finder" && activePage !== "valuation" && <ComingSoon toolId={activePage}/>}
        </main>
      </div>
    </div>
  );
}
