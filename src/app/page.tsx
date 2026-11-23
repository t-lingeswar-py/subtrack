import Link from "next/link";
import {
  ArrowDownRight,
  ArrowRight,
  Bell,
  CalendarDays,
  ChartNoAxesCombined,
  Check,
  CreditCard,
  ShieldCheck,
  Sparkles,
  WalletCards,
} from "lucide-react";

const features = [
  [WalletCards, "Everything in one view", "Keep each service, billing cycle, and expected renewal together."],
  [ChartNoAxesCombined, "A clearer monthly picture", "Understand recurring commitments without mixing currencies."],
  [Bell, "Reminders on your terms", "Choose when SubTrack should surface an in-app renewal reminder."],
  [CalendarDays, "Space to plan ahead", "See expected renewal dates before they arrive."],
  [Sparkles, "A useful usage check-in", "Review plans you have marked as rarely used or not used."],
  [CreditCard, "Payments, recorded by you", "Keep a manual record after you confirm a payment yourself."],
] as const;

const principles = [
  "No bank connection",
  "Your account, your records",
  "Renewal dates are estimates",
  "Payments are entered manually",
];

const steps = [
  ["01", "Make it yours", "Create a private workspace for your recurring plans."],
  ["02", "Add what you use", "Enter each service, price, cycle, and expected date."],
  ["03", "See the full picture", "Bring upcoming renewals and monthly equivalents together."],
  ["04", "Choose what stays", "Use your own check-ins to decide what is still worth it."],
];

export default function Home() {
  return (
    <main className="landing" id="main-content">
      <a href="#hero-title" className="skip-link">Skip to content</a>

      <header className="site-header">
        <nav className="site-nav shell" aria-label="Main navigation">
          <Link className="brand" href="/">
            <span className="brand-mark" aria-hidden="true">s</span>subtrack
          </Link>
          <div className="nav-links">
            <a href="#features">Product</a>
            <a href="#how">How it works</a>
            <a href="#pricing">Pricing</a>
          </div>
          <div className="nav-actions">
            <Link className="nav-login" href="/login">Log in</Link>
            <Link className="button button-primary button-small" href="/register">
              Get started <ArrowRight size={15} aria-hidden="true"/>
            </Link>
          </div>
        </nav>
      </header>

      <section className="hero shell" aria-labelledby="hero-title">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot"/> RECURRING SPEND, BACK IN VIEW</div>
          <h1 id="hero-title" tabIndex={-1}>A little more <span>control</span> over what comes around.</h1>
          <p>Every recurring plan, price, and expected renewal in one considered place. No bank connection. No guesswork about what was paid.</p>
          <div className="hero-actions">
            <Link className="button button-primary" href="/register">Build your overview <ArrowRight size={16} aria-hidden="true"/></Link>
            <a className="button button-quiet" href="#features">Take a closer look</a>
          </div>
          <div className="hero-foot"><ShieldCheck size={16} aria-hidden="true"/> Private workspace <span/> Manual records, by design</div>
        </div>

        <div className="hero-visual" role="img" aria-label="Illustrative SubTrack dashboard with clearly labeled sample data">
          <div className="visual-glow"/>
          <div className="depth-scene" aria-hidden="true">
            <span className="depth-ring depth-ring-a"/>
            <span className="depth-ring depth-ring-b"/>
            <span className="depth-orb depth-orb-a"/>
            <span className="depth-orb depth-orb-b"/>
            <span className="depth-grid"/>
          </div>
          <div className="preview-card">
            <div className="preview-demo-tag"><span/> PRODUCT PREVIEW · SAMPLE DATA</div>
            <div className="preview-top">
              <div>
                <div className="preview-label">MONTHLY PLAN COMMITMENT</div>
                <div className="preview-total">₹2,897<span>.00</span></div>
              </div>
              <span className="preview-badge"><ArrowDownRight size={13} aria-hidden="true"/> Example</span>
            </div>
            <div className="preview-chart" aria-hidden="true">
              <div className="chart-guides"><span/><span/><span/></div>
              <div className="chart-bars">
                {[38, 48, 42, 63, 56, 76, 88].map((height, index) => (
                  <i className={index === 6 ? "bar-current" : ""} key={index} style={{ height: `${height}%` }}/>
                ))}
              </div>
            </div>
            <div className="chart-months" aria-hidden="true">
              {["May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov"].map((month) => <span key={month}>{month}</span>)}
            </div>
            <div className="preview-divider"/>
            <div className="preview-section-title">EXPECTED RENEWALS <span>THIS WEEK</span></div>
            {[
              ["netflix", "N", "Netflix", "Entertainment · Nov 24", "₹649"],
              ["spotify", "◖", "Spotify", "Music · Nov 27", "₹119"],
              ["google", "G", "Google One", "Cloud storage · Dec 02", "₹130"],
            ].map(([tone, mark, name, category, price]) => (
              <div className="preview-payment" key={name}>
                <span className={`service-icon ${tone}`} aria-hidden="true">{mark}</span>
                <span className="payment-name"><b>{name}</b><small>{category}</small></span>
                <strong>{price}</strong>
              </div>
            ))}
            <div className="preview-caption">A product illustration — not live account data.</div>
          </div>
          <div className="floating-note" aria-hidden="true">
            <span className="note-icon"><Bell size={15}/></span>
            <span><b>Renewal reminder</b><small>Review the expected date</small></span>
            <i className="note-dot"/>
          </div>
          <div className="floating-savings" aria-hidden="true">
            <Sparkles size={15}/><span>Usage check-in</span><b>Your estimate</b>
          </div>
        </div>
      </section>

      <section className="trust-row shell" aria-label="How SubTrack works">
        <span>BUILT AROUND CLARITY, NOT SURVEILLANCE</span>
        <div>{principles.map((principle) => <span key={principle}><Check size={14} aria-hidden="true"/>{principle}</span>)}</div>
      </section>

      <section className="section shell" id="features" aria-labelledby="features-title">
        <div className="section-heading">
          <div className="eyebrow">THE DETAILS, WITHOUT THE NOISE</div>
          <h2 id="features-title">A calmer way to see <span>the recurring stuff.</span></h2>
          <p>SubTrack brings your own subscription details into focus, without pretending to know what happens at your bank.</p>
        </div>
        <div className="feature-grid">
          {features.map(([Icon, title, body], index) => (
            <article className="feature-card" key={title}>
              <div className="feature-icon"><Icon size={19} aria-hidden="true"/></div>
              <span className="feature-index">0{index + 1}</span>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="how-section" id="how" aria-labelledby="how-title">
        <div className="shell how-inner">
          <div className="eyebrow">SMALL STEPS, A CLEARER MONTH</div>
          <h2 id="how-title">Your recurring spend,<br/><span>on your terms.</span></h2>
          <div className="steps">
            {steps.map(([number, title, description]) => (
              <article className="step" key={number}>
                <span>{number}</span><h3>{title}</h3><p>{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section pricing-section shell" id="pricing" aria-labelledby="pricing-title">
        <div className="section-heading">
          <div className="eyebrow">STRAIGHTFORWARD, FOR NOW</div>
          <h2 id="pricing-title">No tiers to decode. <span>Just the product.</span></h2>
          <p>SubTrack is currently free to use. It does not process payments or sell paid plans.</p>
        </div>
        <article className="price-card price-preview">
          <div className="price-label">CURRENT ACCESS <span>PRODUCT PREVIEW</span></div>
          <div className="price-card-body">
            <div>
              <h3>Everything available today</h3>
              <p className="price-description">A private place to keep recurring plans in order.</p>
            </div>
            <ul>
              {["Track your subscription details", "See expected renewal dates", "Keep manual payment records", "Review user-reported usage"].map((item) => (
                <li key={item}><Check size={15} aria-hidden="true"/>{item}</li>
              ))}
            </ul>
            <Link className="button button-primary full-button" href="/register">Create your workspace <ArrowRight size={15} aria-hidden="true"/></Link>
          </div>
        </article>
        <p className="pricing-note">No card required. SubTrack does not charge merchants or confirm payments.</p>
      </section>

      <section className="closing">
        <div className="shell closing-inner">
          <div className="eyebrow">MAKE THE NEXT RENEWAL A CHOICE</div>
          <h2>Bring the recurring<br/>back into focus.</h2>
          <Link className="button button-light" href="/register">Get started <ArrowRight size={16} aria-hidden="true"/></Link>
        </div>
      </section>

      <footer className="site-footer shell">
        <Link className="brand" href="/"><span className="brand-mark" aria-hidden="true">s</span>subtrack</Link>
        <span>All your subscriptions. One considered view.</span>
        <nav aria-label="Footer navigation">
          <a href="#features">Product</a><a href="mailto:hello@subtrack.app">Contact</a><Link href="/login">Log in</Link>
        </nav>
        <small>© 2026 SubTrack</small>
      </footer>
    </main>
  );
}
