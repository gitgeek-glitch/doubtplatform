"use client"

import { useEffect, useRef, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useLocomotiveScroll } from "@/context/locomotive-context"
import { ArrowRight, Code, Brain, Zap, ChevronDown } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/auth-context"

export default function LandingPage() {
  const { scroll } = useLocomotiveScroll()
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  // Redirect authenticated users to home
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/home')
    }
  }, [isAuthenticated, navigate])

  useEffect(() => {
    // Initialize animations after component mounts
    const timer = setTimeout(() => {
      setIsLoaded(true)
    }, 100)

    // Play video when it's ready
    if (videoRef.current) {
      videoRef.current.play().catch((error) => {
        console.error("Video autoplay failed:", error)
      })
    }

    return () => clearTimeout(timer)
  }, [])

  // Scroll to the next section
  const scrollToContent = () => {
    if (scroll) {
      scroll.scrollTo("#features", {
        duration: 1000,
        easing: [0.25, 0.0, 0.35, 1.0],
      })
    }
  }

  return (
    <div className="landing-container">
      {/* Hero Section */}
      <section className="landing-hero" data-scroll-section>
        <div className="landing-hero-content" data-scroll data-scroll-speed="0.3">
          <h1 className={`landing-hero-title ${isLoaded ? "animate-in" : ""}`} data-scroll data-scroll-delay="0.1">
            <span className="text-gradient">DoubtSolve</span> Platform
          </h1>
          <p className={`landing-hero-subtitle ${isLoaded ? "animate-in" : ""}`} data-scroll data-scroll-delay="0.2">
            Where knowledge meets collaboration. The ultimate platform for students to ask questions, share knowledge,
            and grow together.
          </p>
          <div className={`landing-hero-buttons ${isLoaded ? "animate-in" : ""}`} data-scroll data-scroll-delay="0.3">
            <Button asChild className="landing-hero-button-primary">
              <Link to="/auth">Get Started</Link>
            </Button>
            <Button asChild variant="outline" className="landing-hero-button-secondary">
              <Link to="/auth">Learn More</Link>
            </Button>
          </div>
        </div>

        <div className="landing-hero-visual" data-scroll data-scroll-speed="-0.2">
          <div className={`landing-hero-visual-inner ${isLoaded ? "animate-in" : ""}`}>
            <video ref={videoRef} className="landing-hero-video" autoPlay loop muted playsInline preload="auto">
              <source src="/videos/particles.mp4" type="video/mp4" />
            </video>
            <div className="landing-hero-overlay"></div>
          </div>
        </div>

        <button className="landing-scroll-indicator" onClick={scrollToContent} data-scroll data-scroll-speed="0.1">
          <span>Scroll to explore</span>
          <ChevronDown className="h-5 w-5 animate-bounce" />
        </button>
      </section>

      {/* Features Section */}
      <section id="features" className="landing-features" data-scroll-section>
        <div className="landing-section-header" data-scroll data-scroll-speed="0.1">
          <h2 className="landing-section-title">
            Powerful <span className="text-gradient">Features</span>
          </h2>
          <p className="landing-section-subtitle">Everything you need to solve your academic doubts</p>
        </div>

        <div className="landing-features-grid">
          <div className="landing-feature-card" data-scroll data-scroll-speed="0.2">
            <div className="landing-feature-icon">
              <Code className="h-8 w-8" />
            </div>
            <h3 className="landing-feature-title">Code Sharing</h3>
            <p className="landing-feature-description">
              Share code snippets with syntax highlighting and get specific feedback on your implementations.
            </p>
          </div>

          <div className="landing-feature-card" data-scroll data-scroll-speed="0.3">
            <div className="landing-feature-icon">
              <Brain className="h-8 w-8" />
            </div>
            <h3 className="landing-feature-title">Expert Answers</h3>
            <p className="landing-feature-description">
              Get answers from peers and experts in your field, with reputation-based validation.
            </p>
          </div>

          <div className="landing-feature-card" data-scroll data-scroll-speed="0.4">
            <div className="landing-feature-icon">
              <Zap className="h-8 w-8" />
            </div>
            <h3 className="landing-feature-title">Real-time Collaboration</h3>
            <p className="landing-feature-description">
              Engage in real-time discussions to solve complex problems together with your peers.
            </p>
          </div>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section className="landing-demo" data-scroll-section>
        <div className="landing-demo-container">
          <div className="landing-demo-content" data-scroll data-scroll-speed="0.2">
            <h2 className="landing-section-title">
              See it in <span className="text-gradient">Action</span>
            </h2>
            <p className="landing-demo-description">
              Our platform makes it easy to ask questions, get answers, and collaborate with peers. The intuitive
              interface helps you focus on learning, not figuring out how to use the platform.
            </p>
            <Button asChild className="landing-demo-button">
              <Link to="/auth">
                Join Now <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="landing-demo-visual" data-scroll data-scroll-speed="0.1">
            <div className="landing-demo-browser">
              <div className="landing-demo-browser-header">
                <div className="landing-demo-browser-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <div className="landing-demo-browser-address">doubtsolve.edu</div>
              </div>
              <div className="landing-demo-browser-content">
                <img
                  src="/images/platform-demo.png"
                  alt="DoubtSolve Platform Demo"
                  className="landing-demo-image"
                  data-scroll
                  data-scroll-speed="0.05"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Parallax Section */}
      <section className="landing-parallax" data-scroll-section>
        <div className="landing-parallax-layers">
          <div className="landing-parallax-layer landing-parallax-bg" data-scroll data-scroll-speed="-0.5"></div>
          <div className="landing-parallax-layer landing-parallax-mid" data-scroll data-scroll-speed="-0.2"></div>
          <div className="landing-parallax-layer landing-parallax-front" data-scroll data-scroll-speed="0.1"></div>
          <div className="landing-parallax-content" data-scroll data-scroll-speed="0.3">
            <h2 className="landing-parallax-title">Ready to solve your doubts?</h2>
            <Button asChild size="lg" className="landing-parallax-button">
              <Link to="/auth">Get Started</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Community Section */}
      <section className="landing-community" data-scroll-section>
        <div className="landing-section-header" data-scroll data-scroll-speed="0.1">
          <h2 className="landing-section-title">
            Join Our <span className="text-gradient">Community</span>
          </h2>
          <p className="landing-section-subtitle">Connect with students from top institutions across the country</p>
        </div>

        <div className="landing-community-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="landing-community-card" data-scroll data-scroll-speed={`0.${i}`}>
              <div className="landing-community-image">
                <img
                  src={`/images/community-${i}.jpg`}
                  alt={`Community member ${i}`}
                  className="landing-community-avatar"
                />
              </div>
              <div className="landing-community-quote">
                <p>"DoubtSolve helped me understand complex concepts through peer explanations."</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="landing-cta" data-scroll-section>
        <div className="landing-cta-container" data-scroll data-scroll-speed="0.1">
          <h2 className="landing-cta-title">Start your learning journey today</h2>
          <p className="landing-cta-subtitle">
            Join thousands of students already using DoubtSolve to accelerate their learning
          </p>
          <div className="landing-cta-buttons">
            <Button asChild size="lg" className="landing-cta-button-primary">
              <Link to="/auth">Sign Up Now</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="landing-cta-button-secondary">
              <Link to="/auth">Learn More</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
