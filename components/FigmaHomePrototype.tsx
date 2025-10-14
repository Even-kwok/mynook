import React from 'react';

// Standalone prototype component built from Figma structure (node 0:1)
// This is intentionally self-contained and not wired into routing yet.

export default function FigmaHomePrototype(): JSX.Element {
  return (
    <div className="figma-home-proto">
      <header className="proto-header">
        <div className="left">
          <div className="brand logo-gradient">MyNook.AI</div>
          <button className="btn primary small">
            <span className="icon" aria-hidden />
            <span>Start Design My Room</span>
            <span className="icon" aria-hidden />
          </button>
        </div>
        <nav className="right">
          <button className="btn ghost small">Terms</button>
          <button className="btn ghost small">Pricing</button>
          <button className="btn ghost small">Login</button>
          <button className="btn accent small">REGISTER for FREE</button>
        </nav>
      </header>

      <main className="proto-main">
        <section className="hero">
          <div className="hero-left">
            <h1 className="title">
              <span>Start Ultimate</span>
              <span>Interior Design</span>
              <span>Journey</span>
              <span>Today</span>
            </h1>
            <button className="btn primary">Get Started →</button>
          </div>
          <div className="hero-right">
            <div className="panel">
              <div className="panel-head">
                <div className="muted">AI DESIGN PREVIEW</div>
                <div className="muted">Alpine Interior Adventure</div>
              </div>
              <div className="panel-body preview" />
              <button className="btn gradient block">Generate AI Design</button>
            </div>

            <div className="stats">
              <div className="stat"><div className="value">50+</div><div className="label">Design Styles</div></div>
              <div className="stat"><div className="value">10+</div><div className="label">Room Types</div></div>
              <div className="stat"><div className="value">&lt;30s</div><div className="label">Generation Time</div></div>
            </div>
          </div>
        </section>

        <section className="section-2">
          <div className="panel">
            <div className="panel-head">
              <div className="muted">AI EXTERIOR PREVIEW</div>
              <div className="muted">Modern Architectural Design</div>
            </div>
            <div className="panel-body preview" />
            <button className="btn gradient block">Generate Exterior Design</button>
          </div>

          <div className="copy">
            <h2 className="title-2">
              <span>Transform Your</span>
              <span>Home Exterior with</span>
              <span>AI-Powered Design</span>
            </h2>
            <p className="lead">
              Reimagine your home's facade with 6 architectural styles - from Modern to Victorian. 
              Our AI technology transforms your exterior photos into stunning architectural visions 
              in seconds. Explore different materials, colors, and design elements effortlessly.
            </p>
            <button className="btn primary">Design My Exterior →</button>
          </div>
        </section>
      </main>
    </div>
  );
}


