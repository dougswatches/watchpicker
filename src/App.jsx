import { useState } from "react";

const questions = [
  {
    id: "budget",
    label: "What's your budget?",
    subtitle: "We'll find the best value in your range.",
    type: "single",
    options: [
      { value: "under_500", label: "Under $500" },
      { value: "500_2000", label: "$500 – $2,000" },
      { value: "2000_5000", label: "$2,000 – $5,000" },
      { value: "5000_15000", label: "$5,000 – $15,000" },
      { value: "above_15000", label: "$15,000+" },
    ],
  },
  {
    id: "use_case",
    label: "How will you wear it?",
    subtitle: "Pick everything that applies.",
    type: "multi",
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
    id: "style",
    label: "What's your aesthetic?",
    subtitle: "Pick the vibe that resonates most.",
    type: "single",
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
    id: "brand_pref",
    label: "Any brand preferences?",
    subtitle: "Select all you're drawn to, or skip.",
    type: "multi",
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
    id: "dress_vs_sport",
    label: "Dress or sport?",
    subtitle: "Where does your heart lie?",
    type: "single",
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
    id: "existing_watches",
    label: "What do you already own?",
    subtitle: "We'll make sure this recommendation complements your collection.",
    type: "text",
    placeholder: "e.g. Seiko SKX, nothing yet, a Casio G-Shock…",
  },
];

const budgetLabels = {
  under_500: "under $500",
  "500_2000": "$500–$2,000",
  "2000_5000": "$2,000–$5,000",
  "5000_15000": "$5,000–$15,000",
  above_15000: "above $15,000",
};

function buildPrompt(answers) {
  const budget = budgetLabels[answers.budget] || answers.budget;
  const useCase = (answers.use_case || []).join(", ") || "general use";
  const style = answers.style || "any";
  const brands = (answers.brand_pref || []).join(", ") || "no preference";
  const type = answers.dress_vs_sport || "any";
  const existing = answers.existing_watches || "nothing specified";

  return `You are a world-class watch expert and horologist. A customer is looking for watch recommendations based on the following profile:

- Budget: ${budget}
- Use case: ${useCase}
- Style preference: ${style}
- Brand preferences: ${brands}
- Watch type: ${type}
- Existing watches: ${existing}

Recommend exactly 3 watches that perfectly match this profile. For each watch provide:

1. A specific model name (brand + model + reference if relevant)
2. A typical market price (be accurate)
3. A Chrono24 search URL using this format: https://www.chrono24.com/search/index.htm?query=WATCH+NAME+URL+ENCODED
4. A compelling 2–3 sentence reason why this watch is perfect for this customer, referencing their specific answers
5. 3 key specs (e.g. case size, movement, water resistance)

Respond ONLY with a JSON array of 3 objects with these exact keys:
- "name": string (e.g. "Omega Seamaster 300M")
- "price": string (e.g. "~$4,500 new / ~$3,200 pre-owned")
- "chrono24_url": string (full URL)
- "reason": string
- "specs": array of 3 strings

Return raw JSON only. No markdown, no explanation outside the array.`;
}

const WatchIcon = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="9" y="1" width="10" height="4" rx="1" fill="currentColor" opacity="0.3"/>
    <rect x="9" y="23" width="10" height="4" rx="1" fill="currentColor" opacity="0.3"/>
    <circle cx="14" cy="14" r="9" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <circle cx="14" cy="14" r="1.5" fill="currentColor"/>
    <line x1="14" y1="14" x2="14" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="14" y1="14" x2="17.5" y2="15.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <polyline points="2.5,7 5.5,10 11.5,4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ExternalLinkIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <path d="M5 2H2a1 1 0 00-1 1v8a1 1 0 001 1h8a1 1 0 001-1V8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <path d="M8 1h4v4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="12" y1="1" x2="6" y2="7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
);

const ArrowRight = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ArrowLeft = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M13 8H3M7 12L3 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const Loader = () => (
  <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"2rem",padding:"4rem 2rem"}}>
    <div style={{
      width:56,height:56,borderRadius:"50%",
      border:"2px solid #d4a96a",
      borderTopColor:"transparent",
      animation:"spin 1s linear infinite"
    }}/>
    <div>
      <p style={{textAlign:"center",fontFamily:"'Cormorant Garamond',serif",fontSize:"1.3rem",color:"var(--color-text-primary)",marginBottom:"0.4rem"}}>
        Consulting the archives…
      </p>
      <p style={{textAlign:"center",fontSize:"0.875rem",color:"var(--color-text-secondary)"}}>
        Our expert is handpicking three watches for you
      </p>
    </div>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
);

function WatchCard({ watch, index }) {
  const medals = ["I", "II", "III"];
  return (
    <div style={{
      background:"var(--color-background-primary)",
      border:"0.5px solid var(--color-border-tertiary)",
      borderRadius:16,
      overflow:"hidden",
      animation:`fadeUp 0.5s ease both`,
      animationDelay:`${index * 0.12}s`,
    }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}`}</style>
      <div style={{
        background:"linear-gradient(135deg,#1a1410 0%,#2d2218 100%)",
        padding:"1.25rem 1.5rem",
        display:"flex",alignItems:"center",gap:"1rem"
      }}>
        <div style={{
          width:36,height:36,borderRadius:"50%",
          border:"1px solid rgba(212,169,106,0.4)",
          display:"flex",alignItems:"center",justifyContent:"center",
          fontFamily:"'Cormorant Garamond',serif",
          fontSize:"1rem",color:"#d4a96a",flexShrink:0
        }}>{medals[index]}</div>
        <div style={{flex:1,minWidth:0}}>
          <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.25rem",fontWeight:600,color:"#f5e6cc",margin:0,lineHeight:1.2}}>
            {watch.name}
          </p>
          <p style={{fontSize:"0.8rem",color:"#9a8060",margin:"0.15rem 0 0",letterSpacing:"0.05em"}}>
            {watch.price}
          </p>
        </div>
      </div>
      <div style={{padding:"1.25rem 1.5rem"}}>
        <p style={{fontSize:"0.9rem",lineHeight:1.7,color:"var(--color-text-secondary)",margin:"0 0 1.25rem"}}>
          {watch.reason}
        </p>
        <div style={{display:"flex",flexWrap:"wrap",gap:"0.4rem",marginBottom:"1.25rem"}}>
          {watch.specs.map((spec,i) => (
            <span key={i} style={{
              fontSize:"0.75rem",
              padding:"0.25rem 0.6rem",
              borderRadius:6,
              background:"var(--color-background-secondary)",
              color:"var(--color-text-secondary)",
              border:"0.5px solid var(--color-border-tertiary)"
            }}>{spec}</span>
          ))}
        </div>
        <a
          href={watch.chrono24_url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display:"inline-flex",alignItems:"center",gap:"0.4rem",
            fontSize:"0.85rem",fontWeight:500,
            color:"#c4892a",textDecoration:"none",
            border:"0.5px solid rgba(196,137,42,0.35)",
            borderRadius:8,padding:"0.5rem 0.9rem",
            transition:"background 0.15s",
            background:"rgba(196,137,42,0.06)"
          }}
        >
          View on Chrono24 <ExternalLinkIcon/>
        </a>
      </div>
    </div>
  );
}

export default function WatchQuiz() {
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
    if (q.type === "text") return true;
    return false;
  };

  const toggleMulti = (qid, val) => {
    const current = answers[qid] || [];
    setAnswers(prev => ({
      ...prev,
      [qid]: current.includes(val) ? current.filter(v => v !== val) : [...current, val],
    }));
  };

  const handleNext = () => {
    if (isLast) {
      submitQuiz();
    } else {
      setStep(s => s + 1);
    }
  };

  const submitQuiz = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: buildPrompt(answers) }),
      });
      const data = await response.json();
      const text = data.text || '';
      const clean = text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
      setResults(parsed);
    } catch (e) {
      setError('Something went wrong fetching recommendations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep(0);
    setAnswers({});
    setResults(null);
    setError(null);
    setLoading(false);
  };

  const gold = "#c4892a";
  const goldLight = "rgba(196,137,42,0.15)";

  return (
    <div style={{
      minHeight:"100vh",
      background:"var(--color-background-tertiary)",
      fontFamily:"'DM Sans',system-ui,sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=DM+Sans:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { margin: 0; }
        .opt-btn {
          display: flex; align-items: center; gap: 0.75rem;
          width: 100%; padding: 0.8rem 1rem;
          background: var(--color-background-primary);
          border: 0.5px solid var(--color-border-tertiary);
          border-radius: 10px; cursor: pointer;
          font-size: 0.9rem; font-family: inherit;
          color: var(--color-text-primary);
          text-align: left; transition: border-color 0.15s, background 0.15s;
        }
        .opt-btn:hover { border-color: ${gold}; }
        .opt-btn.selected {
          border-color: ${gold};
          background: ${goldLight};
        }
        .nav-btn {
          display: inline-flex; align-items: center; gap: 0.5rem;
          padding: 0.65rem 1.25rem;
          border-radius: 8px; font-size: 0.875rem; font-weight: 500;
          font-family: inherit; cursor: pointer; transition: opacity 0.15s;
        }
        .nav-btn:hover { opacity: 0.8; }
        .nav-btn:disabled { opacity: 0.35; cursor: not-allowed; }
      `}</style>

      {/* Header */}
      <header style={{
        borderBottom:"0.5px solid var(--color-border-tertiary)",
        background:"var(--color-background-primary)",
        padding:"1rem 1.5rem",
        display:"flex",alignItems:"center",gap:"0.75rem"
      }}>
        <div style={{color:gold}}><WatchIcon/></div>
        <div>
          <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.15rem",fontWeight:600,color:"var(--color-text-primary)",lineHeight:1}}>
            Horologist
          </p>
          <p style={{fontSize:"0.7rem",color:"var(--color-text-secondary)",letterSpacing:"0.08em",marginTop:2}}>
            WATCH FINDER
          </p>
        </div>
      </header>

      <main style={{maxWidth:560,margin:"0 auto",padding:"2rem 1rem 4rem"}}>

        {/* Results */}
        {results && !loading && (
          <div>
            <div style={{textAlign:"center",marginBottom:"2rem"}}>
              <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"2rem",fontWeight:600,color:"var(--color-text-primary)",lineHeight:1.2}}>
                Your recommendations
              </p>
              <p style={{fontSize:"0.875rem",color:"var(--color-text-secondary)",marginTop:"0.5rem"}}>
                Three watches, handpicked for you.
              </p>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:"1rem",marginBottom:"2rem"}}>
              {results.map((watch, i) => <WatchCard key={i} watch={watch} index={i}/>)}
            </div>
            <div style={{textAlign:"center"}}>
              <button
                className="nav-btn"
                onClick={reset}
                style={{background:"var(--color-background-primary)",border:`0.5px solid var(--color-border-secondary)`,color:"var(--color-text-secondary)"}}
              >
                <ArrowLeft/> Start over
              </button>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && <Loader/>}

        {/* Error */}
        {error && !loading && (
          <div style={{textAlign:"center",padding:"3rem 1rem"}}>
            <p style={{color:"var(--color-text-danger)",marginBottom:"1rem"}}>{error}</p>
            <button className="nav-btn" onClick={submitQuiz} style={{background:gold,color:"#fff",border:"none"}}>
              Retry
            </button>
          </div>
        )}

        {/* Quiz */}
        {!results && !loading && !error && (
          <div>
            {/* Progress */}
            <div style={{marginBottom:"2.5rem"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"0.6rem"}}>
                <span style={{fontSize:"0.75rem",color:"var(--color-text-secondary)",letterSpacing:"0.06em"}}>
                  QUESTION {step+1} OF {questions.length}
                </span>
                <span style={{fontSize:"0.75rem",color:gold,fontWeight:500}}>
                  {Math.round(((step) / questions.length) * 100)}%
                </span>
              </div>
              <div style={{height:2,background:"var(--color-border-tertiary)",borderRadius:2}}>
                <div style={{
                  height:"100%",background:gold,borderRadius:2,
                  width:`${((step)/questions.length)*100}%`,
                  transition:"width 0.3s ease"
                }}/>
              </div>
            </div>

            {/* Question */}
            <div style={{marginBottom:"2rem"}}>
              <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.9rem",fontWeight:600,color:"var(--color-text-primary)",lineHeight:1.2,marginBottom:"0.4rem"}}>
                {q.label}
              </h1>
              {q.subtitle && (
                <p style={{fontSize:"0.875rem",color:"var(--color-text-secondary)"}}>
                  {q.subtitle}
                </p>
              )}
            </div>

            {/* Options */}
            {q.type === "single" && (
              <div style={{display:"flex",flexDirection:"column",gap:"0.5rem",marginBottom:"2rem"}}>
                {q.options.map(opt => {
                  const sel = answers[q.id] === opt.value;
                  return (
                    <button
                      key={opt.value}
                      className={`opt-btn${sel?" selected":""}`}
                      onClick={() => setAnswers(prev => ({...prev,[q.id]:opt.value}))}
                    >
                      <div style={{
                        width:20,height:20,borderRadius:"50%",flexShrink:0,
                        border:`1.5px solid ${sel ? gold : "var(--color-border-secondary)"}`,
                        background: sel ? gold : "transparent",
                        display:"flex",alignItems:"center",justifyContent:"center",
                        color:"#fff",transition:"all 0.15s"
                      }}>
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
                  const sel = (answers[q.id] || []).includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      className={`opt-btn${sel?" selected":""}`}
                      onClick={() => toggleMulti(q.id, opt.value)}
                    >
                      <div style={{
                        width:18,height:18,borderRadius:4,flexShrink:0,
                        border:`1.5px solid ${sel ? gold : "var(--color-border-secondary)"}`,
                        background: sel ? gold : "transparent",
                        display:"flex",alignItems:"center",justifyContent:"center",
                        color:"#fff",transition:"all 0.15s"
                      }}>
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
                <textarea
                  rows={3}
                  placeholder={q.placeholder}
                  value={answers[q.id] || ""}
                  onChange={e => setAnswers(prev => ({...prev,[q.id]:e.target.value}))}
                  style={{
                    width:"100%",padding:"0.85rem 1rem",
                    border:"0.5px solid var(--color-border-secondary)",
                    borderRadius:10,
                    background:"var(--color-background-primary)",
                    color:"var(--color-text-primary)",
                    fontSize:"0.9rem",fontFamily:"inherit",
                    resize:"vertical",outline:"none",
                    lineHeight:1.6
                  }}
                />
              </div>
            )}

            {/* Navigation */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <button
                className="nav-btn"
                onClick={() => setStep(s => s - 1)}
                disabled={step === 0}
                style={{background:"var(--color-background-primary)",border:"0.5px solid var(--color-border-secondary)",color:"var(--color-text-secondary)"}}
              >
                <ArrowLeft/> Back
              </button>
              <button
                className="nav-btn"
                onClick={handleNext}
                disabled={!canAdvance()}
                style={{background:gold,color:"#fff",border:"none",opacity:canAdvance()?1:0.4}}
              >
                {isLast ? "Find my watches" : "Next"} <ArrowRight/>
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
