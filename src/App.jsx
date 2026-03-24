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
3. A Chrono24 search URL: https://www.chrono24.com/search/index.htm?query=WATCH+NAME+URL+ENCODED
4. A compelling 2-3 sentence reason why this watch is perfect for this customer
5. 3 key specs (e.g. case size, movement, water resistance)
Respond ONLY with a JSON array of 3 objects with these exact keys:
- "name": string
- "price": string
- "chrono24_url": string
- "reason": string
- "specs": array of 3 strings
Return raw JSON only. No markdown, no code blocks, no explanation. Just the raw JSON array starting with [ and ending with ].`;
}

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

const ExternalLinkIcon = () => (
  <svg width="12" height="12" viewBox="0 0 13 13" fill="none">
    <path d="M5 2H2a1 1 0 00-1 1v8a1 1 0 001 1h8a1 1 0 001-1V8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <path d="M8 1h4v4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="12" y1="1" x2="6" y2="7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
    <polyline points="2.5,7 5.5,10 11.5,4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const Loader = () => (
  <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"1.5rem",padding:"3rem 2rem"}}>
    <div style={{
      width:40,height:40,borderRadius:"50%",
      border:"2px solid #e8e8e8",
      borderTopColor:"#1a1a1a",
      animation:"spin 0.8s linear infinite"
    }}/>
    <div style={{textAlign:"center"}}>
      <p style={{fontSize:"1rem",fontWeight:600,color:"#1a1a1a",margin:"0 0 0.25rem"}}>Finding your watches</p>
      <p style={{fontSize:"0.85rem",color:"#888",margin:0}}>Our expert is reviewing your profile…</p>
    </div>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
);

function WatchCard({ watch, index }) {
  return (
    <div style={{
      background:"#fff",
      border:"1px solid #e8e8e8",
      borderRadius:4,
      overflow:"hidden",
      animation:`fadeUp 0.4s ease both`,
      animationDelay:`${index * 0.1}s`,
    }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}`}</style>
      <div style={{
        background:"#1a1a1a",
        padding:"1rem 1.25rem",
        display:"flex",alignItems:"center",gap:"0.75rem"
      }}>
        <span style={{fontSize:"0.7rem",fontWeight:700,letterSpacing:"0.12em",color:"#666",minWidth:20}}>
          0{index + 1}
        </span>
        <div style={{flex:1,minWidth:0}}>
          <p style={{fontSize:"1rem",fontWeight:700,color:"#fff",margin:0,lineHeight:1.3}}>
            {watch.name}
          </p>
          <p style={{fontSize:"0.8rem",color:"#999",margin:"0.2rem 0 0"}}>
            {watch.price}
          </p>
        </div>
      </div>
      <div style={{padding:"1.25rem"}}>
        <p style={{fontSize:"0.875rem",lineHeight:1.7,color:"#444",margin:"0 0 1rem"}}>
          {watch.reason}
        </p>
        <div style={{display:"flex",flexWrap:"wrap",gap:"0.35rem",marginBottom:"1.25rem"}}>
          {watch.specs.map((spec,i) => (
            <span key={i} style={{
              fontSize:"0.75rem",padding:"0.2rem 0.55rem",
              borderRadius:2,background:"#f5f5f5",
              color:"#555",border:"1px solid #e8e8e8",fontWeight:500,
            }}>{spec}</span>
          ))}
        </div>
        <a
          href={watch.chrono24_url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display:"inline-flex",alignItems:"center",gap:"0.4rem",
            fontSize:"0.8rem",fontWeight:700,color:"#1a1a1a",
            textDecoration:"none",letterSpacing:"0.04em",
            borderBottom:"2px solid #1a1a1a",paddingBottom:"1px",
          }}
        >
          VIEW ON CHRONO24 <ExternalLinkIcon/>
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

  const handleNext = () => {
    if (isLast) submitQuiz();
    else setStep(s => s + 1);
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
      const clean = text.replace(/```json/gi, '').replace(/```/g, '').trim();
      const start = clean.indexOf('[');
      const end = clean.lastIndexOf(']');
      if (start === -1 || end === -1) throw new Error('No JSON array found');
      const parsed = JSON.parse(clean.slice(start, end + 1));
      setResults(parsed);
    } catch (e) {
      console.error('Quiz error:', e.message);
      setError('Something went wrong. Please try again.');
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

  return (
    <div style={{
      background:"#f9f9f9",
      fontFamily:"'Albert Sans', system-ui, sans-serif",
      padding:"0",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Albert+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .opt-btn {
          display: flex; align-items: center; gap: 0.75rem;
          width: 100%; padding: 0.75rem 1rem;
          background: #fff; border: 1px solid #e0e0e0;
          border-radius: 3px; cursor: pointer;
          font-size: 0.9rem; font-family: 'Albert Sans', system-ui, sans-serif;
          color: #1a1a1a; font-weight: 500; text-align: left;
          transition: border-color 0.12s, background 0.12s;
        }
        .opt-btn:hover { border-color: #1a1a1a; }
        .opt-btn.selected { border-color: #1a1a1a; background: #fafafa; }
        .nav-btn {
          display: inline-flex; align-items: center; gap: 0.5rem;
          padding: 0.6rem 1.25rem; border-radius: 3px;
          font-size: 0.8rem; font-weight: 700;
          font-family: 'Albert Sans', system-ui, sans-serif;
          cursor: pointer; transition: opacity 0.12s; letter-spacing: 0.05em;
        }
        .nav-btn:hover { opacity: 0.75; }
        .nav-btn:disabled { opacity: 0.3; cursor: not-allowed; }
      `}</style>

      <main style={{maxWidth:600,margin:"0 auto",padding:"1.5rem 1.25rem 3rem"}}>

        {results && !loading && (
          <div>
            <div style={{marginBottom:"2rem",paddingBottom:"1.25rem",borderBottom:"2px solid #1a1a1a"}}>
              <p style={{fontSize:"0.7rem",fontWeight:700,letterSpacing:"0.12em",color:"#888",marginBottom:"0.4rem"}}>
                YOUR RESULTS
              </p>
              <h2 style={{fontSize:"1.5rem",fontWeight:700,color:"#1a1a1a",lineHeight:1.2}}>
                Three watches picked for you
              </h2>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:"1rem",marginBottom:"2rem"}}>
              {results.map((watch, i) => <WatchCard key={i} watch={watch} index={i}/>)}
            </div>
            <button
              className="nav-btn"
              onClick={reset}
              style={{background:"#f0f0f0",border:"1px solid #ddd",color:"#555"}}
            >
              <ArrowLeft/> START OVER
            </button>
          </div>
        )}

        {loading && <Loader/>}

        {error && !loading && (
          <div style={{textAlign:"center",padding:"2rem 1rem"}}>
            <p style={{color:"#c0392b",marginBottom:"1rem",fontSize:"0.9rem"}}>{error}</p>
            <button className="nav-btn" onClick={submitQuiz}
              style={{background:"#1a1a1a",color:"#fff",border:"none"}}>
              TRY AGAIN
            </button>
          </div>
        )}

        {!results && !loading && !error && (
          <div>
            <div style={{marginBottom:"2rem",paddingBottom:"1.25rem",borderBottom:"2px solid #1a1a1a"}}>
              <p style={{fontSize:"0.7rem",fontWeight:700,letterSpacing:"0.12em",color:"#888",marginBottom:"0.5rem"}}>
                QUESTION {step + 1} OF {questions.length}
              </p>
              <div style={{height:2,background:"#e8e8e8",marginBottom:"1.25rem"}}>
                <div style={{
                  height:"100%",background:"#1a1a1a",
                  width:`${(step / questions.length) * 100}%`,
                  transition:"width 0.3s ease"
                }}/>
              </div>
              <h2 style={{fontSize:"1.4rem",fontWeight:700,color:"#1a1a1a",lineHeight:1.2,marginBottom:"0.3rem"}}>
                {q.label}
              </h2>
              {q.subtitle && (
                <p style={{fontSize:"0.85rem",color:"#888"}}>{q.subtitle}</p>
              )}
            </div>

            {q.type === "single" && (
              <div style={{display:"flex",flexDirection:"column",gap:"0.5rem",marginBottom:"2rem"}}>
                {q.options.map(opt => {
                  const sel = answers[q.id] === opt.value;
                  return (
                    <button
                      key={opt.value}
                      className={`opt-btn${sel ? " selected" : ""}`}
                      onClick={() => setAnswers(prev => ({...prev,[q.id]:opt.value}))}
                    >
                      <div style={{
                        width:18,height:18,borderRadius:"50%",flexShrink:0,
                        border:`2px solid ${sel ? "#1a1a1a" : "#ccc"}`,
                        background: sel ? "#1a1a1a" : "#fff",
                        display:"flex",alignItems:"center",justifyContent:"center",
                        color:"#fff",transition:"all 0.12s"
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
                      className={`opt-btn${sel ? " selected" : ""}`}
                      onClick={() => {
                        const current = answers[q.id] || [];
                        setAnswers(prev => ({
                          ...prev,
                          [q.id]: current.includes(opt.value)
                            ? current.filter(v => v !== opt.value)
                            : [...current, opt.value],
                        }));
                      }}
                    >
                      <div style={{
                        width:16,height:16,borderRadius:2,flexShrink:0,
                        border:`2px solid ${sel ? "#1a1a1a" : "#ccc"}`,
                        background: sel ? "#1a1a1a" : "#fff",
                        display:"flex",alignItems:"center",justifyContent:"center",
                        color:"#fff",transition:"all 0.12s"
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
                    border:"1px solid #e0e0e0",borderRadius:3,
                    background:"#fff",color:"#1a1a1a",
                    fontSize:"0.9rem",
                    fontFamily:"'Albert Sans', system-ui, sans-serif",
                    resize:"vertical",outline:"none",lineHeight:1.6,
                  }}
                  onFocus={e => e.target.style.borderColor="#1a1a1a"}
                  onBlur={e => e.target.style.borderColor="#e0e0e0"}
                />
              </div>
            )}

            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <button
                className="nav-btn"
                onClick={() => setStep(s => s - 1)}
                disabled={step === 0}
                style={{background:"#f0f0f0",border:"1px solid #ddd",color:"#555"}}
              >
                <ArrowLeft/> BACK
              </button>
              <button
                className="nav-btn"
                onClick={handleNext}
                disabled={!canAdvance()}
                style={{
                  background: canAdvance() ? "#1a1a1a" : "#ccc",
                  color:"#fff",border:"none"
                }}
              >
                {isLast ? "FIND MY WATCHES" : "NEXT"} <ArrowRight/>
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
