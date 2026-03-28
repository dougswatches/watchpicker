import { useState, useEffect } from "react";
 
// ─── Quiz Data ────────────────────────────────────────────────────────────────
 
const questions = [
  {
    id: "budget", label: "What's your budget?",
    subtitle: "We'll find the best value in your range.", type: "single",
    options: [
      { value: "under_500", label: "Under £500" },
      { value: "500_2000", label: "£500 – £2,000" },
      { value: "2000_5000", label: "£2,000 – £5,000" },
      { value: "5000_15000", label: "£5,000 – £15,000" },
      { value: "above_15000", label: "£15,000+" },
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
  under_500: "under £500", "500_2000": "£500–£2,000",
  "2000_5000": "£2,000–£5,000", "5000_15000": "£5,000–£15,000",
  above_15000: "above £15,000",
};

const styleLabels = {
  classic: "Classic", modern: "Modern", bold: "Bold", minimalist: "Minimal",
  vintage: "Vintage", technical: "Tool watch",
};
const typeLabels = {
  dress: "Dress", sport: "Sport", sport_dress: "Sport-dress",
  pilot: "Pilot / field", diver: "Diver", chronograph: "Chronograph",
};

function buildQuizSummary(answers) {
  const parts = [];
  if (answers.dress_vs_sport) parts.push(typeLabels[answers.dress_vs_sport] || answers.dress_vs_sport);
  if (answers.style) parts.push(styleLabels[answers.style] || answers.style);
  if (answers.budget) parts.push(budgetLabels[answers.budget] || answers.budget);
  return parts.join(" · ");
}

function encodeAnswersToURL(answers) {
  const params = new URLSearchParams();
  Object.entries(answers).forEach(([key, val]) => {
    if (Array.isArray(val)) params.set(key, val.join(","));
    else if (val) params.set(key, val);
  });
  return params.toString();
}

function decodeAnswersFromURL() {
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.size === 0) return null;
    const answers = {};
    const multiKeys = ["use_case", "brand_pref"];
    for (const [key, val] of params) {
      if (multiKeys.includes(key)) answers[key] = val.split(",");
      else answers[key] = val;
    }
    if (answers.budget) return answers;
    return null;
  } catch { return null; }
}
 
function buildPrompt(answers) {
  const budget = budgetLabels[answers.budget] || answers.budget;
  const useCase = (answers.use_case || []).join(", ") || "general use";
  const style = answers.style || "any";
  const brands = (answers.brand_pref || []).join(", ") || "no preference";
  const type = answers.dress_vs_sport || "any";
  const existing = answers.existing_watches || "nothing specified";
  return `You are a world-class watch expert advising a UK-based buyer. Recommend exactly 3 watches for this customer:
- Budget: ${budget}
- Use case: ${useCase}
- Style: ${style}
- Brand preferences: ${brands}
- Watch type: ${type}
- Already owns: ${existing}

IMPORTANT RULES:
- All prices MUST be in GBP (£). Never use USD.
- Only include platforms where this SPECIFIC brand and model is genuinely sold. Do not guess.
- Amazon and F.Hinds do NOT stock luxury brands (Rolex, Omega, Patek, AP, Breitling, IWC, JLC etc). Never include them for luxury watches.
- Chrono24 and eBay stock almost everything pre-owned. WatchFinder only stocks mid-to-high luxury.
- Goldsmiths, Beaverbrooks, and Chisholm Hunter are authorised dealers — only include them for brands they actually carry.
- The 3 watches should complement each other — offer genuine variety in style, brand, or character. Do not recommend 3 very similar watches.

Available platform keys and what they stock:
- "chrono24" — pre-owned and grey market, all brands
- "watchfinder" — pre-owned luxury (Rolex, Omega, TAG, Breitling, IWC etc)
- "watchenclave" — pre-owned mid to high-end
- "zeitauktion" — pre-owned European auction, mid to high-end
- "ebay" — pre-owned all price points, vintage, grey market
- "amazon" — new watches, mainstream brands ONLY (Seiko, Citizen, Casio, Orient, Tissot, Hamilton)
- "goldsmiths" — new, authorised dealer (TAG, Longines, Omega, Breitling, Tudor, Gucci)
- "beaverbrooks" — new, authorised dealer (Seiko, Citizen, TAG, Tissot, Frederique Constant)
- "chisholmhunter" — new, authorised dealer (mid to luxury, Scotland-based)
- "thbaker" — new, authorised dealer (mid range UK)
- "houseofwatches" — new and pre-owned, wide range
- "cwsellors" — new, mid range UK (Seiko, Citizen, Tissot, Hamilton, Rotary)
- "fhinds" — new, budget to mid range UK ONLY (Seiko, Citizen, Casio, Rotary, Lorus)
- "citizen" — new Citizen brand watches only

Return ONLY a raw JSON object with these fields:

"collection_note": string (2-3 sentences explaining why these 3 watches work well together as a shortlist — what variety they offer, why each brings something different to the table. Written in a warm, knowledgeable tone as if you're a trusted friend who knows watches.)

"watches": array of exactly 3 objects, each with:
- "name": string (full model name including reference if known)
- "price": string (in GBP with £ symbol, e.g. "£4,500" or "£350–£500")
- "value_verdict": string (one of: "Great value for money", "Fair market price", "Premium but worth it", "Investment potential", "Affordable classic")
- "availability": "new" | "preowned" | "both"
- "reason": string (2-3 sentences, written in a friendly expert tone — explain why this specific watch suits this specific person)
- "specs": array of 3 strings (key specs like case size, movement, water resistance)
- "platforms": array of platform keys that genuinely stock this watch — be selective, not exhaustive

No markdown, no code blocks. Start with { end with }.`;
}
 
// ─── Nav Config ───────────────────────────────────────────────────────────────
 
const NAV_ITEMS = [
  { id: "finder",         label: "Watch Finder",        icon: "◎", badge: "FREE",    live: true  },
  { id: "valuation",      label: "Valuation Tool",      icon: "◈", badge: "FREE",    live: true  },
  { id: "shouldibuy",     label: "Should I Buy This?",  icon: "◇", badge: "FREE",    live: true  },
  { id: "authentication", label: "Authentication",       icon: "◉", badge: "FREE",    live: true  },
  { id: "collection",     label: "My Collection",        icon: "▣", badge: "FREE",    live: true  },
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
 
      <div className="mobile-flex-wrap" style={{
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
          <div className="mobile-flex-wrap" style={{display:"flex",alignItems:"center",gap:"0.6rem",marginTop:"0.25rem",flexWrap:"wrap"}}>
            <span style={{fontSize:"0.8rem",color:"#999"}}>{watch.price}</span>
            {watch.value_verdict && (
              <span style={{
                fontSize:"0.58rem",fontWeight:700,letterSpacing:"0.06em",
                padding:"0.15rem 0.4rem",borderRadius:2,
                background: watch.value_verdict === "Great value for money" ? "#2d6a4f" :
                  watch.value_verdict === "Investment potential" ? "#6b4c9a" :
                  watch.value_verdict === "Premium but worth it" ? "#1d3557" :
                  watch.value_verdict === "Affordable classic" ? "#2d6a4f" : "#555",
                color:"#fff",whiteSpace:"nowrap",
              }}>{watch.value_verdict.toUpperCase()}</span>
            )}
          </div>
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
 
const Loader = ({ title, subtitle }) => (
  <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"1.5rem",padding:"4rem 2rem"}}>
    <div style={{width:36,height:36,borderRadius:"50%",border:"2px solid #e8e8e8",borderTopColor:"#1a1a1a",animation:"spin 0.8s linear infinite"}}/>
    <div style={{textAlign:"center"}}>
      <p style={{fontSize:"0.95rem",fontWeight:600,color:"#1a1a1a",margin:"0 0 0.25rem"}}>{title || "Loading"}</p>
      <p style={{fontSize:"0.82rem",color:"#888",margin:0}}>{subtitle || "Please wait…"}</p>
    </div>
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
      if (!response.ok) throw new Error(data.error || 'Server error');
      if (data.valuation) setResult(data.valuation);
      else throw new Error(data.error || 'No valuation returned');
    } catch (e) {
      const msg = e.message?.includes('timed out')
        ? 'The request took too long. Please try again.'
        : 'Something went wrong. Please check your inputs and try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setFormData({ brand: "", model: "", reference: "", condition: "", notes: "" }); setResult(null); setError(null); };

  const formatGBP = (n) => {
    if (!n && n !== 0) return "—";
    return "£" + Number(n).toLocaleString("en-GB");
  };

  if (loading) return <Loader title="Valuing your watch" subtitle="Analysing market data across all platforms…"/>;

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
          <span className="mobile-value-big" style={{fontSize:"2rem",fontWeight:700,color:"#fff",lineHeight:1}}>{formatGBP(result.value_mid)}</span>
          <span style={{fontSize:"0.8rem",color:"#888",fontWeight:500}}>mid estimate</span>
        </div>
        <div className="mobile-flex-wrap" style={{display:"flex",gap:"1.5rem",marginBottom:"1rem"}}>
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
        <div className="mobile-flex-wrap" style={{
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
      <div className="mobile-stack" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1rem",marginBottom:"1rem"}}>
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

// ─── Should I Buy This? Tool ─────────────────────────────────────────────────

const PLATFORM_SOURCE_OPTIONS = [
  { value: "ebay", label: "eBay" },
  { value: "chrono24", label: "Chrono24" },
  { value: "facebook", label: "Facebook Marketplace" },
  { value: "forum", label: "Watch forum" },
  { value: "dealer", label: "Dealer / shop" },
  { value: "private", label: "Private seller" },
  { value: "other", label: "Other / not sure" },
];

function ShouldIBuyTool() {
  const [formData, setFormData] = useState({
    watch_description: "", asking_price: "", seller_description: "", platform_source: "",
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const canSubmit = formData.watch_description.trim().length > 10;

  const handleSubmit = async () => {
    setLoading(true); setError(null);
    try {
      const response = await fetch('/api/shouldibuy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Server error');
      if (data.analysis) setResult(data.analysis);
      else throw new Error(data.error || 'No analysis returned');
    } catch (e) {
      const msg = e.message?.includes('timed out')
        ? 'The request took too long. Please try again.'
        : 'Something went wrong. Please check your inputs and try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFormData({ watch_description: "", asking_price: "", seller_description: "", platform_source: "" });
    setResult(null); setError(null);
  };

  if (loading) return <Loader title="Analysing this listing" subtitle="Checking price, red flags, and alternatives…"/>;

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

  if (result) return <ShouldIBuyResult result={result} onReset={reset}/>;

  // ─── Input Form ───
  return (
    <div style={{maxWidth:560,margin:"0 auto",padding:"1.5rem"}}>
      <div style={{marginBottom:"2rem",paddingBottom:"1.25rem",borderBottom:"2px solid #1a1a1a"}}>
        <p style={{fontSize:"0.68rem",fontWeight:700,letterSpacing:"0.12em",color:"#888",marginBottom:"0.5rem"}}>
          SHOULD I BUY THIS?
        </p>
        <h2 style={{fontSize:"1.4rem",fontWeight:700,color:"#1a1a1a",lineHeight:1.2,marginBottom:"0.3rem"}}>
          Get a second opinion before you buy
        </h2>
        <p style={{fontSize:"0.85rem",color:"#888"}}>
          Describe the listing and we'll check for red flags, price fairness, and better alternatives.
        </p>
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:"1rem",marginBottom:"2rem"}}>
        {/* Watch description */}
        <div>
          <label style={{display:"block",fontSize:"0.72rem",fontWeight:700,letterSpacing:"0.1em",color:"#888",marginBottom:"0.4rem"}}>
            DESCRIBE THE WATCH *
          </label>
          <textarea rows={4}
            placeholder={"Paste the listing description here, or describe it yourself.\n\ne.g. Omega Speedmaster Professional, 2021, box and papers, hesalite crystal, manual wind, bracelet has desk diving marks but crystal is clean…"}
            value={formData.watch_description}
            onChange={e => setFormData(p => ({...p, watch_description: e.target.value}))}
            style={{
              width:"100%",padding:"0.85rem 1rem",border:"1px solid #e0e0e0",borderRadius:3,
              background:"#fff",color:"#1a1a1a",fontSize:"0.9rem",
              fontFamily:"'Albert Sans',system-ui,sans-serif",resize:"vertical",outline:"none",lineHeight:1.6,
            }}
            onFocus={e=>e.target.style.borderColor="#1a1a1a"}
            onBlur={e=>e.target.style.borderColor="#e0e0e0"}
          />
        </div>

        {/* Asking price */}
        <div>
          <label style={{display:"block",fontSize:"0.72rem",fontWeight:700,letterSpacing:"0.1em",color:"#888",marginBottom:"0.4rem"}}>
            ASKING PRICE <span style={{fontWeight:400,letterSpacing:0,textTransform:"none",fontSize:"0.72rem"}}>(optional but helps a lot)</span>
          </label>
          <input type="text" placeholder="e.g. £3,200 or $4,500"
            value={formData.asking_price}
            onChange={e => setFormData(p => ({...p, asking_price: e.target.value}))}
            style={{
              width:"100%",padding:"0.75rem 1rem",border:"1px solid #e0e0e0",borderRadius:3,
              background:"#fff",color:"#1a1a1a",fontSize:"0.9rem",
              fontFamily:"'Albert Sans',system-ui,sans-serif",outline:"none",
            }}
            onFocus={e=>e.target.style.borderColor="#1a1a1a"}
            onBlur={e=>e.target.style.borderColor="#e0e0e0"}
          />
        </div>

        {/* Where they found it */}
        <div>
          <label style={{display:"block",fontSize:"0.72rem",fontWeight:700,letterSpacing:"0.1em",color:"#888",marginBottom:"0.4rem"}}>
            WHERE DID YOU FIND IT? <span style={{fontWeight:400,letterSpacing:0,textTransform:"none",fontSize:"0.72rem"}}>(optional)</span>
          </label>
          <div className="mobile-stack-narrow" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.4rem"}}>
            {PLATFORM_SOURCE_OPTIONS.map(opt => {
              const sel = formData.platform_source === opt.value;
              return (
                <button key={opt.value}
                  className={`opt-btn${sel?" selected":""}`}
                  onClick={() => setFormData(p => ({...p, platform_source: sel ? "" : opt.value}))}>
                  <div style={{
                    width:16,height:16,borderRadius:"50%",flexShrink:0,
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

        {/* Seller details */}
        <div>
          <label style={{display:"block",fontSize:"0.72rem",fontWeight:700,letterSpacing:"0.1em",color:"#888",marginBottom:"0.4rem"}}>
            SELLER DETAILS <span style={{fontWeight:400,letterSpacing:0,textTransform:"none",fontSize:"0.72rem"}}>(optional — anything that might help)</span>
          </label>
          <textarea rows={2}
            placeholder="e.g. 500 feedback on eBay, says it was serviced in 2023, no returns accepted…"
            value={formData.seller_description}
            onChange={e => setFormData(p => ({...p, seller_description: e.target.value}))}
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
        CHECK THIS LISTING <ArrowRight/>
      </button>
    </div>
  );
}

// ─── Should I Buy Result ─────────────────────────────────────────────────────

function ShouldIBuyResult({ result, onReset }) {
  const [showAllAlts, setShowAllAlts] = useState(false);

  const verdictConfig = {
    "BUY": { bg: "#2d6a4f", text: "#fff", label: "BUY", icon: "✓" },
    "PROCEED WITH CAUTION": { bg: "#e9c46a", text: "#1a1a1a", label: "CAUTION", icon: "!" },
    "AVOID": { bg: "#c0392b", text: "#fff", label: "AVOID", icon: "✕" },
  };
  const vc = verdictConfig[result.verdict] || verdictConfig["PROCEED WITH CAUTION"];

  const priceLabels = {
    great_deal: "Great deal", fair: "Fair price", slightly_high: "Slightly high",
    overpriced: "Overpriced", cannot_assess: "Can't assess",
  };
  const priceColors = {
    great_deal: "#2d6a4f", fair: "#2d6a4f", slightly_high: "#e9c46a",
    overpriced: "#c0392b", cannot_assess: "#888",
  };

  const formatGBP = (n) => {
    if (!n && n !== 0) return null;
    return "£" + Number(n).toLocaleString("en-GB");
  };

  const redFlags = result.red_flags || [];
  const greenFlags = result.green_flags || [];
  const questions = result.questions_to_ask || [];
  const alternatives = result.alternatives || [];
  const searchLinks = result.search_links || [];

  const severityColors = { high: "#c0392b", medium: "#e9c46a", low: "#888" };
  const confColors = { high: "#2d6a4f", medium: "#e9c46a", low: "#c0392b" };

  return (
    <div style={{maxWidth:600,margin:"0 auto",padding:"1.5rem"}}>
      {/* Header */}
      <div style={{marginBottom:"1.5rem",paddingBottom:"1.25rem",borderBottom:"2px solid #1a1a1a"}}>
        <p style={{fontSize:"0.68rem",fontWeight:700,letterSpacing:"0.12em",color:"#888",marginBottom:"0.4rem"}}>LISTING ANALYSIS</p>
        <h2 style={{fontSize:"1.5rem",fontWeight:700,color:"#1a1a1a",lineHeight:1.2}}>{result.identified_watch}</h2>
      </div>

      {/* Verdict Card */}
      <div style={{
        background:"#1a1a1a",borderRadius:4,padding:"1.5rem",marginBottom:"1rem",
        animation:"fadeUp 0.4s ease both",
      }}>
        <div style={{display:"flex",alignItems:"center",gap:"0.75rem",marginBottom:"1rem"}}>
          <div style={{
            width:40,height:40,borderRadius:"50%",background:vc.bg,
            display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:"1.1rem",fontWeight:700,color:vc.text,flexShrink:0,
          }}>{vc.icon}</div>
          <div style={{flex:1}}>
            <div style={{display:"flex",alignItems:"center",gap:"0.5rem",marginBottom:"0.2rem"}}>
              <span style={{
                fontSize:"0.7rem",fontWeight:700,letterSpacing:"0.12em",
                padding:"0.2rem 0.6rem",borderRadius:2,background:vc.bg,color:vc.text,
              }}>{vc.label}</span>
            </div>
            <p style={{fontSize:"1rem",fontWeight:600,color:"#fff",margin:0,lineHeight:1.3}}>
              {result.verdict_summary}
            </p>
          </div>
        </div>
        <p style={{fontSize:"0.85rem",lineHeight:1.7,color:"#aaa",margin:0}}>
          {result.verdict_detail}
        </p>
      </div>

      {/* Price Assessment */}
      <div style={{
        background:"#fff",border:"1px solid #e8e8e8",borderRadius:4,padding:"1.25rem",
        marginBottom:"1rem",animation:"fadeUp 0.4s ease both",animationDelay:"0.05s",
      }}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"0.6rem"}}>
          <p style={{fontSize:"0.68rem",fontWeight:700,letterSpacing:"0.1em",color:"#888",margin:0}}>PRICE CHECK</p>
          <span style={{
            fontSize:"0.65rem",fontWeight:700,letterSpacing:"0.1em",
            padding:"0.2rem 0.5rem",borderRadius:2,
            background:priceColors[result.price_assessment] || "#888",
            color: result.price_assessment === "slightly_high" ? "#1a1a1a" : "#fff",
          }}>{priceLabels[result.price_assessment] || "Unknown"}</span>
        </div>
        {(result.market_value_low || result.market_value_high) && (
          <div className="mobile-flex-wrap" style={{display:"flex",gap:"1.5rem",marginBottom:"0.75rem"}}>
            {result.market_value_low && (
              <div>
                <p style={{fontSize:"0.62rem",fontWeight:700,letterSpacing:"0.1em",color:"#aaa",marginBottom:"0.1rem"}}>MARKET LOW</p>
                <p style={{fontSize:"1rem",fontWeight:600,color:"#1a1a1a",margin:0}}>{formatGBP(result.market_value_low)}</p>
              </div>
            )}
            {result.market_value_high && (
              <div>
                <p style={{fontSize:"0.62rem",fontWeight:700,letterSpacing:"0.1em",color:"#aaa",marginBottom:"0.1rem"}}>MARKET HIGH</p>
                <p style={{fontSize:"1rem",fontWeight:600,color:"#1a1a1a",margin:0}}>{formatGBP(result.market_value_high)}</p>
              </div>
            )}
          </div>
        )}
        <p style={{fontSize:"0.85rem",lineHeight:1.7,color:"#444",margin:0}}>{result.price_commentary}</p>
      </div>

      {/* Red Flags */}
      {redFlags.length > 0 && (
        <div style={{
          background:"#fff",border:"1px solid #e8e8e8",borderRadius:4,padding:"1.25rem",
          marginBottom:"1rem",animation:"fadeUp 0.4s ease both",animationDelay:"0.1s",
        }}>
          <p style={{fontSize:"0.68rem",fontWeight:700,letterSpacing:"0.1em",color:"#c0392b",marginBottom:"0.75rem"}}>
            RED FLAGS ({redFlags.length})
          </p>
          <div style={{display:"flex",flexDirection:"column",gap:"0.65rem"}}>
            {redFlags.map((flag, i) => (
              <div key={i} style={{display:"flex",gap:"0.65rem",alignItems:"flex-start"}}>
                <div style={{
                  width:8,height:8,borderRadius:"50%",flexShrink:0,marginTop:6,
                  background:severityColors[flag.severity] || "#888",
                }}/>
                <div>
                  <p style={{fontSize:"0.85rem",fontWeight:600,color:"#1a1a1a",margin:"0 0 0.15rem"}}>
                    {flag.flag}
                    <span style={{
                      fontSize:"0.62rem",fontWeight:700,letterSpacing:"0.08em",
                      marginLeft:"0.5rem",color:severityColors[flag.severity] || "#888",
                      textTransform:"uppercase",
                    }}>{flag.severity}</span>
                  </p>
                  <p style={{fontSize:"0.8rem",lineHeight:1.6,color:"#666",margin:0}}>{flag.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Green Flags */}
      {greenFlags.length > 0 && (
        <div style={{
          background:"#fff",border:"1px solid #e8e8e8",borderRadius:4,padding:"1.25rem",
          marginBottom:"1rem",animation:"fadeUp 0.4s ease both",animationDelay:"0.15s",
        }}>
          <p style={{fontSize:"0.68rem",fontWeight:700,letterSpacing:"0.1em",color:"#2d6a4f",marginBottom:"0.75rem"}}>
            GREEN FLAGS ({greenFlags.length})
          </p>
          <div style={{display:"flex",flexDirection:"column",gap:"0.5rem"}}>
            {greenFlags.map((flag, i) => (
              <div key={i} style={{display:"flex",gap:"0.65rem",alignItems:"flex-start"}}>
                <div style={{
                  width:8,height:8,borderRadius:"50%",flexShrink:0,marginTop:6,background:"#2d6a4f",
                }}/>
                <div>
                  <p style={{fontSize:"0.85rem",fontWeight:600,color:"#1a1a1a",margin:"0 0 0.1rem"}}>{flag.flag}</p>
                  <p style={{fontSize:"0.8rem",lineHeight:1.6,color:"#666",margin:0}}>{flag.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Questions to Ask */}
      {questions.length > 0 && (
        <div style={{
          background:"#fff",border:"1px solid #e8e8e8",borderRadius:4,padding:"1.25rem",
          marginBottom:"1rem",animation:"fadeUp 0.4s ease both",animationDelay:"0.2s",
        }}>
          <p style={{fontSize:"0.68rem",fontWeight:700,letterSpacing:"0.1em",color:"#888",marginBottom:"0.75rem"}}>
            ASK THE SELLER
          </p>
          <div style={{display:"flex",flexDirection:"column",gap:"0.5rem"}}>
            {questions.map((q, i) => (
              <div key={i} style={{display:"flex",gap:"0.65rem",alignItems:"flex-start"}}>
                <span style={{
                  fontSize:"0.7rem",fontWeight:700,color:"#aaa",minWidth:18,paddingTop:2,
                }}>{String(i + 1).padStart(2, '0')}</span>
                <p style={{fontSize:"0.85rem",lineHeight:1.6,color:"#333",margin:0}}>{q}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alternatives */}
      {alternatives.length > 0 && (
        <div style={{
          background:"#fff",border:"1px solid #e8e8e8",borderRadius:4,padding:"1.25rem",
          marginBottom:"1rem",animation:"fadeUp 0.4s ease both",animationDelay:"0.25s",
        }}>
          <p style={{fontSize:"0.68rem",fontWeight:700,letterSpacing:"0.1em",color:"#888",marginBottom:"0.75rem"}}>
            CONSIDER INSTEAD
          </p>
          <div style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
            {alternatives.map((alt, i) => (
              <div key={i}>
                <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",marginBottom:"0.25rem"}}>
                  <p style={{fontSize:"0.9rem",fontWeight:700,color:"#1a1a1a",margin:0}}>{alt.name}</p>
                  <span style={{fontSize:"0.8rem",fontWeight:600,color:"#888",flexShrink:0}}>{alt.price}</span>
                </div>
                <p style={{fontSize:"0.8rem",lineHeight:1.6,color:"#666",margin:"0 0 0.5rem"}}>{alt.reason}</p>
                {(alt.buy_links || []).length > 0 && (
                  <div style={{display:"flex",flexWrap:"wrap",gap:"0.35rem"}}>
                    {alt.buy_links.map((link, j) => (
                      <a key={j} href={link.url} target="_blank" rel="noopener noreferrer"
                        style={{
                          display:"inline-flex",alignItems:"center",gap:"0.3rem",
                          fontSize:"0.72rem",fontWeight:600,color:"#1a1a1a",
                          textDecoration:"none",padding:"0.3rem 0.55rem",
                          border:"1px solid #e0e0e0",borderRadius:3,background:"#fafafa",
                          transition:"all 0.12s",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor="#1a1a1a"; e.currentTarget.style.background="#f0f0f0"; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor="#e0e0e0"; e.currentTarget.style.background="#fafafa"; }}
                      >
                        {link.label} <ExternalIcon/>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Compare Prices */}
      {searchLinks.length > 0 && (
        <div style={{
          background:"#fff",border:"1px solid #e8e8e8",borderRadius:4,padding:"1.25rem",
          marginBottom:"1rem",animation:"fadeUp 0.4s ease both",animationDelay:"0.3s",
        }}>
          <p style={{fontSize:"0.68rem",fontWeight:700,letterSpacing:"0.1em",color:"#888",marginBottom:"0.6rem"}}>
            COMPARE PRICES ELSEWHERE
          </p>
          <div style={{display:"flex",flexWrap:"wrap",gap:"0.4rem"}}>
            {searchLinks.map((link, i) => (
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
          </div>
        </div>
      )}

      {/* Confidence + Disclaimer */}
      <div style={{display:"flex",alignItems:"center",gap:"0.5rem",marginBottom:"1rem"}}>
        <div style={{width:8,height:8,borderRadius:"50%",background:confColors[result.confidence] || "#888"}}/>
        <span style={{fontSize:"0.78rem",fontWeight:600,color:"#555",textTransform:"capitalize"}}>{result.confidence} confidence</span>
        {result.confidence_note && (
          <span style={{fontSize:"0.75rem",color:"#888"}}>— {result.confidence_note}</span>
        )}
      </div>

      <div style={{
        background:"#f9f9f9",border:"1px solid #e8e8e8",borderRadius:4,
        padding:"1rem 1.25rem",marginBottom:"1.5rem",
      }}>
        <p style={{fontSize:"0.75rem",lineHeight:1.6,color:"#888",margin:0}}>
          This analysis is AI-generated based on the information you provided. It is not a guarantee of authenticity or value. Always inspect a watch in person or through a trusted third party before completing a purchase.
        </p>
      </div>

      <button onClick={onReset} style={{
        display:"inline-flex",alignItems:"center",gap:"0.5rem",
        padding:"0.6rem 1.25rem",borderRadius:3,fontSize:"0.8rem",fontWeight:700,
        letterSpacing:"0.05em",background:"#f0f0f0",color:"#555",
        border:"1px solid #ddd",cursor:"pointer",
        fontFamily:"'Albert Sans',system-ui,sans-serif",
      }}>
        <ArrowLeft/> CHECK ANOTHER LISTING
      </button>
    </div>
  );
}

// ─── Authentication Tool ─────────────────────────────────────────────────────

function AuthenticationTool() {
  const [formData, setFormData] = useState({
    brand: "", model: "", reference: "", details: "", seller_claims: "",
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const canSubmit = formData.brand.trim() && formData.model.trim();

  const handleSubmit = async () => {
    setLoading(true); setError(null);
    try {
      const response = await fetch('/api/authenticate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Server error');
      if (data.report) setResult(data.report);
      else throw new Error(data.error || 'No report returned');
    } catch (e) {
      const msg = e.message?.includes('timed out')
        ? 'The request took too long. Please try again.'
        : 'Something went wrong. Please check your inputs and try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFormData({ brand: "", model: "", reference: "", details: "", seller_claims: "" });
    setResult(null); setError(null);
  };

  if (loading) return <Loader title="Building your authentication guide" subtitle="Analysing known counterfeit tells for this reference…"/>;

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

  if (result) return <AuthenticationResult result={result} onReset={reset}/>;

  // ─── Input Form ───
  return (
    <div style={{maxWidth:560,margin:"0 auto",padding:"1.5rem"}}>
      <div style={{marginBottom:"2rem",paddingBottom:"1.25rem",borderBottom:"2px solid #1a1a1a"}}>
        <p style={{fontSize:"0.68rem",fontWeight:700,letterSpacing:"0.12em",color:"#888",marginBottom:"0.5rem"}}>
          AUTHENTICATION ASSISTANT
        </p>
        <h2 style={{fontSize:"1.4rem",fontWeight:700,color:"#1a1a1a",lineHeight:1.2,marginBottom:"0.3rem"}}>
          Spot a fake before it costs you
        </h2>
        <p style={{fontSize:"0.85rem",color:"#888"}}>
          Tell us the watch and we'll give you a reference-specific checklist of exactly what to look for.
        </p>
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:"1rem",marginBottom:"2rem"}}>
        {/* Brand */}
        <div>
          <label style={{display:"block",fontSize:"0.72rem",fontWeight:700,letterSpacing:"0.1em",color:"#888",marginBottom:"0.4rem"}}>
            BRAND *
          </label>
          <input type="text" placeholder="e.g. Rolex, Omega, Breitling…"
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
            REFERENCE NUMBER <span style={{fontWeight:400,letterSpacing:0,textTransform:"none",fontSize:"0.72rem"}}>(strongly recommended — gives you much more specific checks)</span>
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

        {/* What they can see */}
        <div>
          <label style={{display:"block",fontSize:"0.72rem",fontWeight:700,letterSpacing:"0.1em",color:"#888",marginBottom:"0.4rem"}}>
            WHAT CAN YOU SEE? <span style={{fontWeight:400,letterSpacing:0,textTransform:"none",fontSize:"0.72rem"}}>(optional — describe anything you've noticed)</span>
          </label>
          <textarea rows={3}
            placeholder={"Describe anything you can see about the watch — dial details, case finish, movement, engravings, bracelet, anything that looks off or that you want checked.\n\ne.g. The date magnification looks a bit weak, the coronet looks slightly thick, the rehaut engraving seems a bit rough…"}
            value={formData.details}
            onChange={e => setFormData(p => ({...p, details: e.target.value}))}
            style={{
              width:"100%",padding:"0.85rem 1rem",border:"1px solid #e0e0e0",borderRadius:3,
              background:"#fff",color:"#1a1a1a",fontSize:"0.9rem",
              fontFamily:"'Albert Sans',system-ui,sans-serif",resize:"vertical",outline:"none",lineHeight:1.6,
            }}
            onFocus={e=>e.target.style.borderColor="#1a1a1a"}
            onBlur={e=>e.target.style.borderColor="#e0e0e0"}
          />
        </div>

        {/* Seller claims */}
        <div>
          <label style={{display:"block",fontSize:"0.72rem",fontWeight:700,letterSpacing:"0.1em",color:"#888",marginBottom:"0.4rem"}}>
            SELLER CLAIMS <span style={{fontWeight:400,letterSpacing:0,textTransform:"none",fontSize:"0.72rem"}}>(optional — what has the seller told you?)</span>
          </label>
          <textarea rows={2}
            placeholder="e.g. Says it was serviced by Rolex in 2022, claims all original parts, says dial was swapped under warranty…"
            value={formData.seller_claims}
            onChange={e => setFormData(p => ({...p, seller_claims: e.target.value}))}
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
        CHECK AUTHENTICITY <ArrowRight/>
      </button>
    </div>
  );
}

// ─── Authentication Result ───────────────────────────────────────────────────

function ChecklistSection({ title, checks, defaultOpen }) {
  const [open, setOpen] = useState(!!defaultOpen);
  if (!checks || checks.length === 0) return null;
  return (
    <div style={{
      background:"#fff",border:"1px solid #e8e8e8",borderRadius:4,overflow:"hidden",
      marginBottom:"1rem",
    }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width:"100%",padding:"1rem 1.25rem",display:"flex",alignItems:"center",
        justifyContent:"space-between",background:"none",border:"none",cursor:"pointer",
        fontFamily:"'Albert Sans',system-ui,sans-serif",
      }}>
        <p style={{fontSize:"0.68rem",fontWeight:700,letterSpacing:"0.1em",color:"#888",margin:0}}>
          {title} ({checks.length})
        </p>
        <span style={{fontSize:"0.85rem",color:"#aaa",transform:open?"rotate(180deg)":"none",transition:"transform 0.2s"}}>▾</span>
      </button>
      {open && (
        <div style={{padding:"0 1.25rem 1.25rem",display:"flex",flexDirection:"column",gap:"1rem"}}>
          {checks.map((item, i) => (
            <div key={i} style={{borderTop: i === 0 ? "1px solid #f0f0f0" : "none", paddingTop: i === 0 ? "0.75rem" : 0}}>
              <p style={{fontSize:"0.85rem",fontWeight:700,color:"#1a1a1a",margin:"0 0 0.4rem"}}>{item.check}</p>
              <div style={{display:"flex",flexDirection:"column",gap:"0.3rem"}}>
                <div style={{display:"flex",gap:"0.5rem",alignItems:"flex-start"}}>
                  <span style={{fontSize:"0.7rem",fontWeight:700,color:"#2d6a4f",minWidth:55,paddingTop:1}}>GENUINE</span>
                  <p style={{fontSize:"0.8rem",lineHeight:1.6,color:"#444",margin:0}}>{item.genuine_detail}</p>
                </div>
                <div style={{display:"flex",gap:"0.5rem",alignItems:"flex-start"}}>
                  <span style={{fontSize:"0.7rem",fontWeight:700,color:"#c0392b",minWidth:55,paddingTop:1}}>FAKE</span>
                  <p style={{fontSize:"0.8rem",lineHeight:1.6,color:"#444",margin:0}}>{item.fake_tell}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AuthenticationResult({ result, onReset }) {
  const verdictConfig = {
    "LIKELY GENUINE": { bg: "#2d6a4f", text: "#fff", icon: "✓" },
    "INCONCLUSIVE": { bg: "#e9c46a", text: "#1a1a1a", icon: "?" },
    "SUSPICIOUS": { bg: "#c0392b", text: "#fff", icon: "!" },
    "CANNOT ASSESS": { bg: "#888", text: "#fff", icon: "—" },
  };
  const vc = verdictConfig[result.verdict] || verdictConfig["CANNOT ASSESS"];

  const riskColors = { high: "#c0392b", medium: "#e9c46a", low: "#2d6a4f" };
  const confColors = { high: "#2d6a4f", medium: "#e9c46a", low: "#c0392b" };
  const severityColors = { high: "#c0392b", medium: "#e9c46a", low: "#888" };

  const concerns = result.concerns_from_description || [];
  const nextSteps = result.next_steps || [];

  return (
    <div style={{maxWidth:600,margin:"0 auto",padding:"1.5rem"}}>
      {/* Header */}
      <div style={{marginBottom:"1.5rem",paddingBottom:"1.25rem",borderBottom:"2px solid #1a1a1a"}}>
        <p style={{fontSize:"0.68rem",fontWeight:700,letterSpacing:"0.12em",color:"#888",marginBottom:"0.4rem"}}>AUTHENTICATION REPORT</p>
        <h2 style={{fontSize:"1.5rem",fontWeight:700,color:"#1a1a1a",lineHeight:1.2}}>{result.identified_watch}</h2>
        {result.production_years && (
          <p style={{fontSize:"0.82rem",color:"#888",margin:"0.25rem 0 0"}}>Production: {result.production_years}</p>
        )}
      </div>

      {/* Verdict Card */}
      <div style={{
        background:"#1a1a1a",borderRadius:4,padding:"1.5rem",marginBottom:"1rem",
        animation:"fadeUp 0.4s ease both",
      }}>
        <div style={{display:"flex",alignItems:"center",gap:"0.75rem",marginBottom:"1rem"}}>
          <div style={{
            width:40,height:40,borderRadius:"50%",background:vc.bg,
            display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:"1.1rem",fontWeight:700,color:vc.text,flexShrink:0,
          }}>{vc.icon}</div>
          <div style={{flex:1}}>
            <span style={{
              fontSize:"0.7rem",fontWeight:700,letterSpacing:"0.12em",
              padding:"0.2rem 0.6rem",borderRadius:2,background:vc.bg,color:vc.text,
            }}>{result.verdict}</span>
          </div>
        </div>
        <p style={{fontSize:"0.85rem",lineHeight:1.7,color:"#aaa",margin:0}}>
          {result.verdict_reason}
        </p>
      </div>

      {/* Counterfeit Risk + Confidence */}
      <div className="mobile-stack" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1rem",marginBottom:"1rem"}}>
        <div style={{
          background:"#fff",border:"1px solid #e8e8e8",borderRadius:4,padding:"1.25rem",
          animation:"fadeUp 0.4s ease both",animationDelay:"0.05s",
        }}>
          <p style={{fontSize:"0.68rem",fontWeight:700,letterSpacing:"0.1em",color:"#888",marginBottom:"0.5rem"}}>COUNTERFEIT RISK</p>
          <div style={{display:"flex",alignItems:"center",gap:"0.5rem",marginBottom:"0.35rem"}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:riskColors[result.counterfeit_risk] || "#888"}}/>
            <p style={{fontSize:"1rem",fontWeight:700,color:"#1a1a1a",margin:0,textTransform:"capitalize"}}>{result.counterfeit_risk}</p>
          </div>
          <p style={{fontSize:"0.78rem",lineHeight:1.6,color:"#666",margin:0}}>{result.counterfeit_risk_note}</p>
        </div>
        <div style={{
          background:"#fff",border:"1px solid #e8e8e8",borderRadius:4,padding:"1.25rem",
          animation:"fadeUp 0.4s ease both",animationDelay:"0.1s",
        }}>
          <p style={{fontSize:"0.68rem",fontWeight:700,letterSpacing:"0.1em",color:"#888",marginBottom:"0.5rem"}}>CONFIDENCE</p>
          <div style={{display:"flex",alignItems:"center",gap:"0.5rem",marginBottom:"0.35rem"}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:confColors[result.confidence] || "#888"}}/>
            <p style={{fontSize:"1rem",fontWeight:700,color:"#1a1a1a",margin:0,textTransform:"capitalize"}}>{result.confidence}</p>
          </div>
          <p style={{fontSize:"0.78rem",lineHeight:1.6,color:"#666",margin:0}}>{result.confidence_note}</p>
        </div>
      </div>

      {/* Concerns from description */}
      {concerns.length > 0 && (
        <div style={{
          background:"#fff",border:"1px solid #e8e8e8",borderRadius:4,padding:"1.25rem",
          marginBottom:"1rem",animation:"fadeUp 0.4s ease both",animationDelay:"0.15s",
        }}>
          <p style={{fontSize:"0.68rem",fontWeight:700,letterSpacing:"0.1em",color:"#c0392b",marginBottom:"0.75rem"}}>
            CONCERNS FROM YOUR DESCRIPTION ({concerns.length})
          </p>
          <div style={{display:"flex",flexDirection:"column",gap:"0.65rem"}}>
            {concerns.map((c, i) => (
              <div key={i} style={{display:"flex",gap:"0.65rem",alignItems:"flex-start"}}>
                <div style={{
                  width:8,height:8,borderRadius:"50%",flexShrink:0,marginTop:6,
                  background:severityColors[c.severity] || "#888",
                }}/>
                <div>
                  <p style={{fontSize:"0.85rem",fontWeight:600,color:"#1a1a1a",margin:"0 0 0.15rem"}}>
                    {c.concern}
                    <span style={{
                      fontSize:"0.62rem",fontWeight:700,letterSpacing:"0.08em",
                      marginLeft:"0.5rem",color:severityColors[c.severity] || "#888",
                      textTransform:"uppercase",
                    }}>{c.severity}</span>
                  </p>
                  <p style={{fontSize:"0.8rem",lineHeight:1.6,color:"#666",margin:0}}>{c.explanation}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Checklist Sections */}
      <div style={{animation:"fadeUp 0.4s ease both",animationDelay:"0.2s"}}>
        <p style={{fontSize:"0.72rem",fontWeight:700,letterSpacing:"0.12em",color:"#1a1a1a",margin:"1.5rem 0 0.75rem"}}>
          WHAT TO CHECK
        </p>
        <ChecklistSection title="DIAL" checks={result.dial_checks} defaultOpen={true}/>
        <ChecklistSection title="CASE & CROWN" checks={result.case_checks}/>
        <ChecklistSection title="MOVEMENT" checks={result.movement_checks}/>
        <ChecklistSection title="BRACELET & CLASP" checks={result.bracelet_checks}/>
        <ChecklistSection title="BOX & PAPERS" checks={result.document_checks}/>
      </div>

      {/* Next Steps */}
      {nextSteps.length > 0 && (
        <div style={{
          background:"#fff",border:"1px solid #e8e8e8",borderRadius:4,padding:"1.25rem",
          marginBottom:"1rem",animation:"fadeUp 0.4s ease both",animationDelay:"0.25s",
        }}>
          <p style={{fontSize:"0.68rem",fontWeight:700,letterSpacing:"0.1em",color:"#888",marginBottom:"0.75rem"}}>
            RECOMMENDED NEXT STEPS
          </p>
          <div style={{display:"flex",flexDirection:"column",gap:"0.5rem"}}>
            {nextSteps.map((step, i) => (
              <div key={i} style={{display:"flex",gap:"0.65rem",alignItems:"flex-start"}}>
                <span style={{
                  fontSize:"0.7rem",fontWeight:700,color:"#aaa",minWidth:18,paddingTop:2,
                }}>{String(i + 1).padStart(2, '0')}</span>
                <p style={{fontSize:"0.85rem",lineHeight:1.6,color:"#333",margin:0}}>{step}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div style={{
        background:"#f9f9f9",border:"1px solid #e8e8e8",borderRadius:4,
        padding:"1rem 1.25rem",marginBottom:"1.5rem",
      }}>
        <p style={{fontSize:"0.75rem",lineHeight:1.6,color:"#888",margin:0}}>
          This is an AI-generated authentication guide based on known counterfeit characteristics. It is not a professional authentication service and should not be treated as a guarantee of authenticity. For high-value purchases, always have the watch inspected by an authorised service centre or a trusted independent watchmaker.
        </p>
      </div>

      <button onClick={onReset} style={{
        display:"inline-flex",alignItems:"center",gap:"0.5rem",
        padding:"0.6rem 1.25rem",borderRadius:3,fontSize:"0.8rem",fontWeight:700,
        letterSpacing:"0.05em",background:"#f0f0f0",color:"#555",
        border:"1px solid #ddd",cursor:"pointer",
        fontFamily:"'Albert Sans',system-ui,sans-serif",
      }}>
        <ArrowLeft/> CHECK ANOTHER WATCH
      </button>
    </div>
  );
}

// ─── My Collection Tool ──────────────────────────────────────────────────────

const COLLECTION_CONDITIONS = [
  { value: "mint", label: "Mint" },
  { value: "excellent", label: "Excellent" },
  { value: "very_good", label: "Very Good" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
];

function CollectionTool() {
  const [watches, setWatches] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ brand: "", model: "", reference: "", purchase_price: "", purchase_date: "", condition: "excellent" });
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);

  const canAdd = formData.brand.trim() && formData.model.trim();

  const addWatch = () => {
    if (!canAdd) return;
    setWatches(prev => [...prev, { ...formData, id: Date.now() }]);
    setFormData({ brand: "", model: "", reference: "", purchase_price: "", purchase_date: "", condition: "excellent" });
    setShowForm(false);
    setAnalysis(null);
  };

  const removeWatch = (id) => {
    setWatches(prev => prev.filter(w => w.id !== id));
    setAnalysis(null);
  };

  const analyseCollection = async () => {
    setLoading(true); setError(null);
    try {
      const response = await fetch('/api/collection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ watches }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Server error');
      if (data.analysis) setAnalysis(data.analysis);
      else throw new Error(data.error || 'No analysis returned');
    } catch (e) {
      const msg = e.message?.includes('timed out')
        ? 'The request took too long. Please try again.'
        : 'Something went wrong. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const formatGBP = (n) => {
    if (!n && n !== 0) return "—";
    return "£" + Number(n).toLocaleString("en-GB");
  };

  const trendIcon = (t) => t === "rising" ? "↗" : t === "falling" ? "↘" : "→";
  const trendColor = (t) => t === "rising" ? "#2d6a4f" : t === "falling" ? "#c0392b" : "#888";
  const sellColors = { sell_now: "#c0392b", hold: "#e9c46a", strong_hold: "#2d6a4f" };
  const sellLabels = { sell_now: "Sell Now", hold: "Hold", strong_hold: "Strong Hold" };

  // ─── Empty State ───
  if (watches.length === 0 && !showForm) return (
    <div style={{maxWidth:560,margin:"0 auto",padding:"1.5rem"}}>
      <div style={{marginBottom:"2rem",paddingBottom:"1.25rem",borderBottom:"2px solid #1a1a1a"}}>
        <p style={{fontSize:"0.68rem",fontWeight:700,letterSpacing:"0.12em",color:"#888",marginBottom:"0.5rem"}}>MY COLLECTION</p>
        <h2 style={{fontSize:"1.4rem",fontWeight:700,color:"#1a1a1a",lineHeight:1.2,marginBottom:"0.3rem"}}>
          Track your watches
        </h2>
        <p style={{fontSize:"0.85rem",color:"#888"}}>
          Add your watches and get AI-powered valuations, market trends, and personalised next-purchase recommendations.
        </p>
      </div>
      <div style={{
        background:"#fff",border:"1px solid #e8e8e8",borderRadius:4,
        padding:"3rem 2rem",textAlign:"center",marginBottom:"1.5rem",
      }}>
        <p style={{fontSize:"2rem",marginBottom:"0.75rem"}}>▣</p>
        <p style={{fontSize:"0.95rem",fontWeight:600,color:"#1a1a1a",margin:"0 0 0.35rem"}}>No watches yet</p>
        <p style={{fontSize:"0.82rem",color:"#888",margin:"0 0 1.25rem"}}>Add your first watch to get started.</p>
        <button onClick={() => setShowForm(true)} style={{
          display:"inline-flex",alignItems:"center",gap:"0.5rem",
          padding:"0.7rem 1.5rem",borderRadius:3,fontSize:"0.8rem",fontWeight:700,
          letterSpacing:"0.05em",background:"#1a1a1a",color:"#fff",border:"none",cursor:"pointer",
          fontFamily:"'Albert Sans',system-ui,sans-serif",
        }}>
          ADD A WATCH <ArrowRight/>
        </button>
      </div>
      <div style={{
        background:"#f9f9f9",border:"1px solid #e8e8e8",borderRadius:4,
        padding:"1rem 1.25rem",
      }}>
        <p style={{fontSize:"0.75rem",lineHeight:1.6,color:"#888",margin:0}}>
          This is a session-based preview. Your collection will not be saved when you close the page. Account-based persistence with full portfolio tracking is coming soon.
        </p>
      </div>
    </div>
  );

  // ─── Add Watch Form ───
  if (showForm) return (
    <div style={{maxWidth:560,margin:"0 auto",padding:"1.5rem"}}>
      <div style={{marginBottom:"2rem",paddingBottom:"1.25rem",borderBottom:"2px solid #1a1a1a"}}>
        <p style={{fontSize:"0.68rem",fontWeight:700,letterSpacing:"0.12em",color:"#888",marginBottom:"0.5rem"}}>ADD TO COLLECTION</p>
        <h2 style={{fontSize:"1.4rem",fontWeight:700,color:"#1a1a1a",lineHeight:1.2}}>Add a watch</h2>
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:"1rem",marginBottom:"2rem"}}>
        <div>
          <label style={{display:"block",fontSize:"0.72rem",fontWeight:700,letterSpacing:"0.1em",color:"#888",marginBottom:"0.4rem"}}>BRAND *</label>
          <input type="text" placeholder="e.g. Rolex, Omega, Seiko…" value={formData.brand}
            onChange={e => setFormData(p => ({...p, brand: e.target.value}))}
            style={{width:"100%",padding:"0.75rem 1rem",border:"1px solid #e0e0e0",borderRadius:3,background:"#fff",color:"#1a1a1a",fontSize:"0.9rem",fontFamily:"'Albert Sans',system-ui,sans-serif",outline:"none"}}
            onFocus={e=>e.target.style.borderColor="#1a1a1a"} onBlur={e=>e.target.style.borderColor="#e0e0e0"}
          />
        </div>
        <div>
          <label style={{display:"block",fontSize:"0.72rem",fontWeight:700,letterSpacing:"0.1em",color:"#888",marginBottom:"0.4rem"}}>MODEL *</label>
          <input type="text" placeholder="e.g. Submariner Date, Speedmaster Professional…" value={formData.model}
            onChange={e => setFormData(p => ({...p, model: e.target.value}))}
            style={{width:"100%",padding:"0.75rem 1rem",border:"1px solid #e0e0e0",borderRadius:3,background:"#fff",color:"#1a1a1a",fontSize:"0.9rem",fontFamily:"'Albert Sans',system-ui,sans-serif",outline:"none"}}
            onFocus={e=>e.target.style.borderColor="#1a1a1a"} onBlur={e=>e.target.style.borderColor="#e0e0e0"}
          />
        </div>
        <div>
          <label style={{display:"block",fontSize:"0.72rem",fontWeight:700,letterSpacing:"0.1em",color:"#888",marginBottom:"0.4rem"}}>REFERENCE <span style={{fontWeight:400,letterSpacing:0,textTransform:"none",fontSize:"0.72rem"}}>(optional)</span></label>
          <input type="text" placeholder="e.g. 126610LN" value={formData.reference}
            onChange={e => setFormData(p => ({...p, reference: e.target.value}))}
            style={{width:"100%",padding:"0.75rem 1rem",border:"1px solid #e0e0e0",borderRadius:3,background:"#fff",color:"#1a1a1a",fontSize:"0.9rem",fontFamily:"'Albert Sans',system-ui,sans-serif",outline:"none"}}
            onFocus={e=>e.target.style.borderColor="#1a1a1a"} onBlur={e=>e.target.style.borderColor="#e0e0e0"}
          />
        </div>
        <div className="mobile-stack" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1rem"}}>
          <div>
            <label style={{display:"block",fontSize:"0.72rem",fontWeight:700,letterSpacing:"0.1em",color:"#888",marginBottom:"0.4rem"}}>PURCHASE PRICE <span style={{fontWeight:400,letterSpacing:0,textTransform:"none",fontSize:"0.72rem"}}>(£)</span></label>
            <input type="number" placeholder="e.g. 5200" value={formData.purchase_price}
              onChange={e => setFormData(p => ({...p, purchase_price: e.target.value}))}
              style={{width:"100%",padding:"0.75rem 1rem",border:"1px solid #e0e0e0",borderRadius:3,background:"#fff",color:"#1a1a1a",fontSize:"0.9rem",fontFamily:"'Albert Sans',system-ui,sans-serif",outline:"none"}}
              onFocus={e=>e.target.style.borderColor="#1a1a1a"} onBlur={e=>e.target.style.borderColor="#e0e0e0"}
            />
          </div>
          <div>
            <label style={{display:"block",fontSize:"0.72rem",fontWeight:700,letterSpacing:"0.1em",color:"#888",marginBottom:"0.4rem"}}>PURCHASE DATE</label>
            <input type="month" value={formData.purchase_date}
              onChange={e => setFormData(p => ({...p, purchase_date: e.target.value}))}
              style={{width:"100%",padding:"0.75rem 1rem",border:"1px solid #e0e0e0",borderRadius:3,background:"#fff",color:"#1a1a1a",fontSize:"0.9rem",fontFamily:"'Albert Sans',system-ui,sans-serif",outline:"none"}}
              onFocus={e=>e.target.style.borderColor="#1a1a1a"} onBlur={e=>e.target.style.borderColor="#e0e0e0"}
            />
          </div>
        </div>
        <div>
          <label style={{display:"block",fontSize:"0.72rem",fontWeight:700,letterSpacing:"0.1em",color:"#888",marginBottom:"0.4rem"}}>CONDITION</label>
          <div style={{display:"flex",gap:"0.4rem",flexWrap:"wrap"}}>
            {COLLECTION_CONDITIONS.map(opt => {
              const sel = formData.condition === opt.value;
              return (
                <button key={opt.value} onClick={() => setFormData(p => ({...p, condition: opt.value}))}
                  style={{
                    padding:"0.45rem 0.85rem",borderRadius:3,fontSize:"0.8rem",fontWeight:600,
                    border:`1px solid ${sel?"#1a1a1a":"#e0e0e0"}`,
                    background:sel?"#1a1a1a":"#fff",color:sel?"#fff":"#555",
                    cursor:"pointer",fontFamily:"'Albert Sans',system-ui,sans-serif",
                    transition:"all 0.12s",
                  }}>
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{display:"flex",gap:"0.75rem"}}>
        <button onClick={() => setShowForm(false)} style={{
          display:"inline-flex",alignItems:"center",gap:"0.5rem",
          padding:"0.7rem 1.25rem",borderRadius:3,fontSize:"0.8rem",fontWeight:700,
          letterSpacing:"0.05em",background:"#f0f0f0",color:"#555",border:"1px solid #ddd",
          cursor:"pointer",fontFamily:"'Albert Sans',system-ui,sans-serif",
        }}><ArrowLeft/> CANCEL</button>
        <button onClick={addWatch} disabled={!canAdd} style={{
          display:"inline-flex",alignItems:"center",gap:"0.5rem",flex:1,justifyContent:"center",
          padding:"0.7rem 1.5rem",borderRadius:3,fontSize:"0.8rem",fontWeight:700,
          letterSpacing:"0.05em",background:canAdd?"#1a1a1a":"#ccc",color:"#fff",border:"none",
          cursor:"pointer",fontFamily:"'Albert Sans',system-ui,sans-serif",
        }}>ADD TO COLLECTION <ArrowRight/></button>
      </div>
    </div>
  );

  // ─── Loading ───
  if (loading) return <Loader title="Analysing your collection" subtitle={`Valuing ${watches.length} watch${watches.length !== 1 ? "es" : ""} across all markets…`}/>;

  // ─── Collection View (with optional analysis) ───
  return (
    <div style={{maxWidth:600,margin:"0 auto",padding:"1.5rem"}}>
      {/* Header */}
      <div style={{marginBottom:"1.5rem",paddingBottom:"1.25rem",borderBottom:"2px solid #1a1a1a"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <p style={{fontSize:"0.68rem",fontWeight:700,letterSpacing:"0.12em",color:"#888",marginBottom:"0.4rem"}}>MY COLLECTION</p>
            <h2 style={{fontSize:"1.5rem",fontWeight:700,color:"#1a1a1a",lineHeight:1.2}}>
              {watches.length} watch{watches.length !== 1 ? "es" : ""}
            </h2>
          </div>
          <button onClick={() => setShowForm(true)} style={{
            display:"inline-flex",alignItems:"center",gap:"0.4rem",
            padding:"0.5rem 1rem",borderRadius:3,fontSize:"0.75rem",fontWeight:700,
            letterSpacing:"0.05em",background:"#1a1a1a",color:"#fff",border:"none",
            cursor:"pointer",fontFamily:"'Albert Sans',system-ui,sans-serif",
          }}>+ ADD</button>
        </div>
      </div>

      {/* Analysis Summary (if available) */}
      {analysis && (
        <>
          {/* Total Value Card */}
          <div style={{
            background:"#1a1a1a",borderRadius:4,padding:"1.5rem",marginBottom:"1rem",
            animation:"fadeUp 0.4s ease both",
          }}>
            <p style={{fontSize:"0.68rem",fontWeight:700,letterSpacing:"0.12em",color:"#666",marginBottom:"1rem"}}>ESTIMATED COLLECTION VALUE</p>
            <div style={{display:"flex",alignItems:"baseline",gap:"0.5rem",marginBottom:"0.75rem"}}>
              <span className="mobile-value-big" style={{fontSize:"2rem",fontWeight:700,color:"#fff",lineHeight:1}}>{formatGBP(analysis.total_value_mid)}</span>
              <span style={{fontSize:"0.8rem",color:"#888",fontWeight:500}}>mid estimate</span>
            </div>
            <div className="mobile-flex-wrap" style={{display:"flex",gap:"1.5rem"}}>
              <div>
                <p style={{fontSize:"0.62rem",fontWeight:700,letterSpacing:"0.1em",color:"#555",marginBottom:"0.15rem"}}>LOW</p>
                <p style={{fontSize:"1rem",fontWeight:600,color:"#999",margin:0}}>{formatGBP(analysis.total_value_low)}</p>
              </div>
              <div>
                <p style={{fontSize:"0.62rem",fontWeight:700,letterSpacing:"0.1em",color:"#555",marginBottom:"0.15rem"}}>HIGH</p>
                <p style={{fontSize:"1rem",fontWeight:600,color:"#999",margin:0}}>{formatGBP(analysis.total_value_high)}</p>
              </div>
            </div>
          </div>

          {/* Collection Insight */}
          <div style={{
            background:"#fff",border:"1px solid #e8e8e8",borderRadius:4,padding:"1.25rem",
            marginBottom:"1rem",animation:"fadeUp 0.4s ease both",animationDelay:"0.05s",
          }}>
            <p style={{fontSize:"0.68rem",fontWeight:700,letterSpacing:"0.1em",color:"#888",marginBottom:"0.6rem"}}>COLLECTION INSIGHT</p>
            <p style={{fontSize:"0.875rem",lineHeight:1.7,color:"#444",margin:0}}>{analysis.collection_insight}</p>
          </div>
        </>
      )}

      {/* Watch List */}
      <div style={{display:"flex",flexDirection:"column",gap:"0.75rem",marginBottom:"1.5rem"}}>
        {watches.map((w, i) => {
          const av = analysis?.watches?.[i];
          return (
            <div key={w.id} style={{
              background:"#fff",border:"1px solid #e8e8e8",borderRadius:4,
              overflow:"hidden",animation:"fadeUp 0.4s ease both",
              animationDelay:`${i * 0.05}s`,
            }}>
              <div style={{padding:"1rem 1.25rem",display:"flex",alignItems:"center",gap:"0.75rem"}}>
                <span style={{fontSize:"0.7rem",fontWeight:700,letterSpacing:"0.12em",color:"#ccc",minWidth:20}}>0{i + 1}</span>
                <div style={{flex:1,minWidth:0}}>
                  <p style={{fontSize:"0.9rem",fontWeight:700,color:"#1a1a1a",margin:0,lineHeight:1.3}}>
                    {av ? av.name : `${w.brand} ${w.model}`}
                  </p>
                  <div style={{display:"flex",gap:"0.75rem",alignItems:"center",marginTop:"0.2rem",flexWrap:"wrap"}}>
                    {w.purchase_price && (
                      <span style={{fontSize:"0.78rem",color:"#888"}}>Paid: £{Number(w.purchase_price).toLocaleString("en-GB")}</span>
                    )}
                    {w.condition && (
                      <span style={{fontSize:"0.68rem",fontWeight:600,color:"#888",textTransform:"capitalize"}}>{w.condition.replace("_", " ")}</span>
                    )}
                  </div>
                </div>
                {/* Valuation data */}
                {av && (
                  <div style={{textAlign:"right",flexShrink:0}}>
                    <p style={{fontSize:"1rem",fontWeight:700,color:"#1a1a1a",margin:0}}>{formatGBP(av.current_value_mid)}</p>
                    <div style={{display:"flex",alignItems:"center",gap:"0.3rem",justifyContent:"flex-end",marginTop:"0.15rem"}}>
                      <span style={{fontSize:"0.82rem",color:trendColor(av.market_trend)}}>{trendIcon(av.market_trend)}</span>
                      <span style={{
                        fontSize:"0.6rem",fontWeight:700,letterSpacing:"0.08em",
                        padding:"0.12rem 0.35rem",borderRadius:2,
                        background:sellColors[av.sell_timing] || "#888",
                        color:av.sell_timing === "hold" ? "#1a1a1a" : "#fff",
                      }}>{sellLabels[av.sell_timing] || av.sell_timing}</span>
                    </div>
                  </div>
                )}
                {!av && (
                  <button onClick={() => removeWatch(w.id)} style={{
                    background:"none",border:"none",cursor:"pointer",color:"#ccc",padding:"0.25rem",
                    fontSize:"0.85rem",fontFamily:"'Albert Sans',system-ui,sans-serif",
                  }} title="Remove">✕</button>
                )}
              </div>
              {/* Expanded detail when analysis is present */}
              {av && (
                <div style={{padding:"0 1.25rem 1rem",borderTop:"1px solid #f0f0f0",paddingTop:"0.75rem"}}>
                  <div style={{display:"flex",gap:"1.25rem",marginBottom:"0.4rem"}}>
                    <span style={{fontSize:"0.75rem",color:"#888"}}>Low: {formatGBP(av.current_value_low)}</span>
                    <span style={{fontSize:"0.75rem",color:"#888"}}>High: {formatGBP(av.current_value_high)}</span>
                    {w.purchase_price && av.current_value_mid && (
                      <span style={{
                        fontSize:"0.75rem",fontWeight:600,
                        color: av.current_value_mid >= Number(w.purchase_price) ? "#2d6a4f" : "#c0392b",
                      }}>
                        {av.current_value_mid >= Number(w.purchase_price) ? "+" : ""}
                        {formatGBP(av.current_value_mid - Number(w.purchase_price))}
                        {" "}({av.current_value_mid >= Number(w.purchase_price) ? "+" : ""}
                        {Math.round(((av.current_value_mid - Number(w.purchase_price)) / Number(w.purchase_price)) * 100)}%)
                      </span>
                    )}
                  </div>
                  <p style={{fontSize:"0.78rem",lineHeight:1.5,color:"#666",margin:0}}>{av.trend_note} {av.sell_note}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Next Watch Recommendation (after analysis) */}
      {analysis?.next_watch && (
        <div style={{
          background:"#fff",border:"1px solid #e8e8e8",borderRadius:4,padding:"1.25rem",
          marginBottom:"1rem",animation:"fadeUp 0.4s ease both",animationDelay:"0.15s",
        }}>
          <p style={{fontSize:"0.68rem",fontWeight:700,letterSpacing:"0.1em",color:"#888",marginBottom:"0.6rem"}}>YOUR NEXT WATCH</p>
          <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",marginBottom:"0.35rem"}}>
            <p style={{fontSize:"0.95rem",fontWeight:700,color:"#1a1a1a",margin:0}}>{analysis.next_watch.name}</p>
            <span style={{fontSize:"0.82rem",fontWeight:600,color:"#888",flexShrink:0}}>{analysis.next_watch.price}</span>
          </div>
          <p style={{fontSize:"0.85rem",lineHeight:1.7,color:"#444",margin:"0 0 0.75rem"}}>{analysis.next_watch.reason}</p>
          {(analysis.next_watch.buy_links || []).length > 0 && (
            <div style={{display:"flex",flexWrap:"wrap",gap:"0.4rem"}}>
              {analysis.next_watch.buy_links.map((link, j) => (
                <a key={j} href={link.url} target="_blank" rel="noopener noreferrer"
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
            </div>
          )}
        </div>
      )}

      {/* Sell Candidate */}
      {analysis?.sell_candidate && (
        <div style={{
          background:"#fff",border:"1px solid #e8e8e8",borderRadius:4,padding:"1.25rem",
          marginBottom:"1rem",animation:"fadeUp 0.4s ease both",animationDelay:"0.2s",
        }}>
          <p style={{fontSize:"0.68rem",fontWeight:700,letterSpacing:"0.1em",color:"#c0392b",marginBottom:"0.6rem"}}>CONSIDER SELLING</p>
          <p style={{fontSize:"0.9rem",fontWeight:700,color:"#1a1a1a",margin:"0 0 0.3rem"}}>{analysis.sell_candidate.name}</p>
          <p style={{fontSize:"0.85rem",lineHeight:1.7,color:"#444",margin:0}}>{analysis.sell_candidate.reason}</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{background:"#fff",border:"1px solid #e8e8e8",borderRadius:4,padding:"1rem 1.25rem",marginBottom:"1rem"}}>
          <p style={{color:"#c0392b",fontSize:"0.85rem",margin:0}}>{error}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{display:"flex",gap:"0.75rem",marginBottom:"1.5rem"}}>
        <button onClick={analyseCollection} disabled={watches.length === 0} style={{
          display:"inline-flex",alignItems:"center",gap:"0.5rem",flex:1,justifyContent:"center",
          padding:"0.7rem 1.5rem",borderRadius:3,fontSize:"0.8rem",fontWeight:700,
          letterSpacing:"0.05em",background:watches.length > 0 ? "#1a1a1a" : "#ccc",color:"#fff",
          border:"none",cursor:"pointer",fontFamily:"'Albert Sans',system-ui,sans-serif",
        }}>{analysis ? "REFRESH VALUATIONS" : "ANALYSE MY COLLECTION"} <ArrowRight/></button>
      </div>

      {/* Session disclaimer */}
      <div style={{
        background:"#f9f9f9",border:"1px solid #e8e8e8",borderRadius:4,
        padding:"1rem 1.25rem",
      }}>
        <p style={{fontSize:"0.75rem",lineHeight:1.6,color:"#888",margin:0}}>
          This is a session-based preview — your collection is stored in your browser and will be lost when you close the page. Account-based persistence with full portfolio tracking, insurance PDF export, and sell alerts is coming soon.
        </p>
      </div>
    </div>
  );
}

// ─── Watch Finder Tool ────────────────────────────────────────────────────────
 
function WatchFinder() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [collectionNote, setCollectionNote] = useState("");
  const [error, setError] = useState(null);
  const [shared, setShared] = useState(false);
  const [autoSubmitted, setAutoSubmitted] = useState(false);

  // Auto-submit from shared URL
  useEffect(() => {
    if (autoSubmitted) return;
    const urlAnswers = decodeAnswersFromURL();
    if (urlAnswers && urlAnswers.budget) {
      setAnswers(urlAnswers);
      setAutoSubmitted(true);
      // Clear URL params without reload
      window.history.replaceState({}, '', window.location.pathname);
      // Submit after state settles
      setTimeout(() => {
        submitWithAnswers(urlAnswers);
      }, 100);
    }
  }, []);

  const q = questions[step];
  const isLast = step === questions.length - 1;
  const canAdvance = () => {
    if (q.type === "single") return !!answers[q.id];
    if (q.type === "multi") return (answers[q.id] || []).length > 0;
    return true;
  };

  const handleNext = () => { if (isLast) submitQuiz(); else setStep(s => s + 1); };

  const submitWithAnswers = async (ans) => {
    setLoading(true); setError(null);
    try {
      const response = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: buildPrompt(ans) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Server error');
      if (data.watches) {
        setResults(data.watches);
        setCollectionNote(data.collection_note || "");
      } else throw new Error('No watches returned');
    } catch (e) {
      const msg = e.message?.includes('timed out')
        ? 'The request took too long. Please try again — it usually works on the second attempt.'
        : 'Something went wrong. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const submitQuiz = () => submitWithAnswers(answers);

  const reset = () => { setStep(0); setAnswers({}); setResults(null); setCollectionNote(""); setError(null); setLoading(false); setShared(false); };
  const tweakAnswers = () => { setResults(null); setCollectionNote(""); setError(null); setStep(0); setShared(false); };

  const shareResults = () => {
    const params = encodeAnswersToURL(answers);
    const url = `${window.location.origin}${window.location.pathname}?${params}`;
    navigator.clipboard.writeText(url).then(() => {
      setShared(true);
      setTimeout(() => setShared(false), 2500);
    }).catch(() => {});
  };

  // Personalised loading screen
  if (loading) {
    const summary = buildQuizSummary(answers);
    return (
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"1.5rem",padding:"4rem 2rem"}}>
        <div style={{width:36,height:36,borderRadius:"50%",border:"2px solid #e8e8e8",borderTopColor:"#1a1a1a",animation:"spin 0.8s linear infinite"}}/>
        <div style={{textAlign:"center"}}>
          <p style={{fontSize:"0.95rem",fontWeight:600,color:"#1a1a1a",margin:"0 0 0.25rem"}}>Finding your watches</p>
          {summary && <p style={{fontSize:"0.82rem",color:"#888",margin:"0 0 0.25rem"}}>{summary}</p>}
          <p style={{fontSize:"0.78rem",color:"#aaa",margin:0}}>Searching across 14 platforms…</p>
        </div>
      </div>
    );
  }

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

  // Count unique platforms across all results
  const platformCount = results ? new Set(results.flatMap(w => (w.buy_links || []).map(l => l.label))).size : 0;

  if (results) return (
    <div style={{maxWidth:600,margin:"0 auto",padding:"1.5rem"}}>
      {/* Header with summary */}
      <div style={{marginBottom:"1.5rem",paddingBottom:"1.25rem",borderBottom:"2px solid #1a1a1a"}}>
        <p style={{fontSize:"0.68rem",fontWeight:700,letterSpacing:"0.12em",color:"#888",marginBottom:"0.4rem"}}>YOUR RESULTS</p>
        <h2 style={{fontSize:"1.5rem",fontWeight:700,color:"#1a1a1a",lineHeight:1.2,marginBottom:"0.4rem"}}>Three watches picked for you</h2>
        <div className="mobile-flex-wrap" style={{display:"flex",alignItems:"center",gap:"0.75rem",flexWrap:"wrap"}}>
          {buildQuizSummary(answers) && (
            <p style={{fontSize:"0.82rem",color:"#888",margin:0}}>{buildQuizSummary(answers)}</p>
          )}
          {platformCount > 0 && (
            <span style={{fontSize:"0.68rem",fontWeight:600,color:"#aaa",padding:"0.15rem 0.5rem",background:"#f0f0f0",borderRadius:2}}>
              {platformCount} platforms searched
            </span>
          )}
        </div>
      </div>

      {/* Collection Note */}
      {collectionNote && (
        <div style={{
          background:"#fff",border:"1px solid #e8e8e8",borderRadius:4,
          padding:"1.25rem",marginBottom:"1.25rem",animation:"fadeUp 0.4s ease both",
        }}>
          <p style={{fontSize:"0.68rem",fontWeight:700,letterSpacing:"0.1em",color:"#888",marginBottom:"0.5rem"}}>WHY THESE THREE</p>
          <p style={{fontSize:"0.875rem",lineHeight:1.7,color:"#444",margin:0}}>{collectionNote}</p>
        </div>
      )}

      {/* Watch Cards */}
      <div style={{display:"flex",flexDirection:"column",gap:"1rem",marginBottom:"1.5rem"}}>
        {results.map((watch, i) => <WatchCard key={i} watch={watch} index={i}/>)}
      </div>

      {/* Action Buttons */}
      <div className="mobile-flex-wrap" style={{display:"flex",gap:"0.6rem",alignItems:"center",marginBottom:"1.5rem",flexWrap:"wrap"}}>
        <button onClick={tweakAnswers} style={{
          display:"inline-flex",alignItems:"center",gap:"0.5rem",
          padding:"0.6rem 1.25rem",borderRadius:3,fontSize:"0.8rem",fontWeight:700,
          letterSpacing:"0.05em",background:"#f0f0f0",color:"#555",
          border:"1px solid #ddd",cursor:"pointer",
          fontFamily:"'Albert Sans',system-ui,sans-serif",
        }}><ArrowLeft/> TWEAK ANSWERS</button>
        <button onClick={reset} style={{
          display:"inline-flex",alignItems:"center",gap:"0.5rem",
          padding:"0.6rem 1.25rem",borderRadius:3,fontSize:"0.8rem",fontWeight:700,
          letterSpacing:"0.05em",background:"#fff",color:"#888",
          border:"1px solid #e0e0e0",cursor:"pointer",
          fontFamily:"'Albert Sans',system-ui,sans-serif",
        }}>START OVER</button>
        <button onClick={shareResults} style={{
          display:"inline-flex",alignItems:"center",gap:"0.5rem",
          padding:"0.6rem 1.25rem",borderRadius:3,fontSize:"0.8rem",fontWeight:700,
          letterSpacing:"0.05em",marginLeft:"auto",
          background:shared?"#2d6a4f":"#1a1a1a",color:"#fff",
          border:"none",cursor:"pointer",
          fontFamily:"'Albert Sans',system-ui,sans-serif",
          transition:"background 0.2s",
        }}>{shared ? "LINK COPIED ✓" : "SHARE PICKS"}</button>
      </div>
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
        <div className="mobile-stack-narrow" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.5rem",marginBottom:"2rem"}}>
          {q.options.map(opt => {
            const sel = (answers[q.id]||[]).includes(opt.value);
            return (
              <button key={opt.value}
                className={`opt-btn${sel?" selected":""}`}
                onClick={() => {
                  const cur = answers[q.id]||[];
                  if (opt.value === "no_pref") {
                    setAnswers(p => ({...p,[q.id]: cur.includes("no_pref") ? [] : ["no_pref"]}));
                  } else {
                    const without = cur.filter(v => v !== "no_pref");
                    setAnswers(p => ({...p,[q.id]: without.includes(opt.value) ? without.filter(v=>v!==opt.value) : [...without, opt.value]}));
                  }
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
        input, textarea { max-width: 100%; }
        @media (max-width: 768px) {
          .sidebar { transform: translateX(-100%); transition: transform 0.25s ease; position: fixed !important; z-index: 100; height: 100vh !important; }
          .sidebar.open { transform: translateX(0); }
          .overlay.active { display: block !important; }
          .mobile-menu-btn { display: flex !important; }
          .mobile-stack { grid-template-columns: 1fr !important; }
          .mobile-header { padding: 0 1rem !important; }
          .mobile-header-title { font-size: 0.85rem !important; }
          .mobile-content { padding: 1rem !important; }
          .mobile-value-big { font-size: 1.5rem !important; }
          .mobile-flex-wrap { flex-wrap: wrap !important; }
          .mobile-hide { display: none !important; }
        }
        @media (max-width: 420px) {
          .mobile-stack-narrow { grid-template-columns: 1fr !important; }
          .opt-btn { font-size: 0.82rem; padding: 0.65rem 0.85rem; }
        }
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>
 
      {/* Sidebar overlay for mobile */}
      <div className={`overlay${sidebarOpen?" active":""}`} onClick={() => setSidebarOpen(false)} style={{
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
        <header className="mobile-header" style={{
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
          {activePage === "finder" && <WatchFinder/>}
          {activePage === "valuation" && <ValuationTool/>}
          {activePage === "shouldibuy" && <ShouldIBuyTool/>}
          {activePage === "authentication" && <AuthenticationTool/>}
          {activePage === "collection" && <CollectionTool/>}
        </main>
      </div>
    </div>
  );
}
