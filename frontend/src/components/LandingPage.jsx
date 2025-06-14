import { Link } from "react-router-dom";
import "./LandingPage.css";
import heroSvg from "../assets/undraw_booking_re_gw4j.svg"; // Download a modern SVG from undraw.co

export default function LandingPage() {
  return (
    <div className="landing-root">
      <header className="landing-hero">
        <div className="hero-content">
          <h1>
            <span className="accent">Effortless</span> Bookings for Modern Teams
          </h1>
          <p>
            Manage reservations, messaging and take full control in one minimalist platform.<br />
            <span className="subtext">Built for speed, security, and simplicity.</span>
          </p>
          <div className="landing-cta">
            <Link to="/register" className="landing-btn">Get Started</Link>
            <Link to="/login" className="landing-btn secondary">Sign In</Link>
          </div>
          <div className="trusted-strip">
            <span>Trusted by</span>
            <img src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg" alt="Microsoft" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg" alt="Google" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/a/ab/Logo_TV_2015.png" alt="TV" />
          </div>
        </div>
        <div className="hero-illustration">
          <img src={heroSvg} alt="Bookings illustration" />
        </div>
      </header>

      <section className="how-row">
        <div>
          <span className="step-number">1</span>
          <p>Sign up</p>
        </div>
        <div>
          <span className="step-number">2</span>
          <p>Book or manage</p>
        </div>
        <div>
          <span className="step-number">3</span>
          <p>Message & collaborate</p>
        </div>
        <div>
          <span className="step-number">4</span>
          <p>Track everything</p>
        </div>
      </section>

      <footer className="landing-footer">
        &copy; {new Date().getFullYear()} TechIQ. All rights reserved.
      </footer>
    </div>
  );
}