"use client"

import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAppSelector } from "@/redux/hooks"
import { useLocomotiveScroll } from "@/context/locomotive-context"
import { ArrowRight, MessageSquarePlus, Users, Trophy, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThreeBackground } from "@/components/three-background"

export default function LandingPage() {
  const { scroll } = useLocomotiveScroll()
  const { isAuthenticated } = useAppSelector((state) => state.auth)
  const navigate = useNavigate()
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/home")
    }
  }, [isAuthenticated, navigate])

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

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
      <section className="landing-hero" data-scroll-section>
        <div className="landing-hero-content" data-scroll data-scroll-speed="0.3">
          <h1 className={`landing-hero-title ${isLoaded ? "animate-in" : ""}`} data-scroll data-scroll-delay="0.1">
            <span className="text-gradient">CollegeQuora</span>
          </h1>
          <p className={`landing-hero-subtitle ${isLoaded ? "animate-in" : ""}`} data-scroll data-scroll-delay="0.2">
            Where knowledge meets collaboration. The ultimate platform for students to ask questions, share knowledge,
            and grow together in their academic journey.
          </p>
          <div className={`landing-hero-buttons ${isLoaded ? "animate-in" : ""}`} data-scroll data-scroll-delay="0.3">
            <Button asChild className="landing-hero-button-primary">
              <Link to="/auth">Get Started</Link>
            </Button>
          </div>
        </div>

        <div className="landing-hero-visual" data-scroll data-scroll-speed="-0.2">
          <div className={`landing-hero-visual-inner ${isLoaded ? "animate-in" : ""}`}>
            <ThreeBackground />
            <div className="landing-hero-overlay"></div>
          </div>
        </div>

        <button className="landing-scroll-indicator" onClick={scrollToContent} data-scroll data-scroll-speed="0.1">
          <span>Scroll to explore</span>
          <ChevronDown className="h-5 w-5 animate-bounce" />
        </button>
      </section>

      <section id="features" className="landing-features" data-scroll-section>
        <div className="landing-section-header" data-scroll data-scroll-speed="0.1">
          <h2 className="landing-section-title">
            How <span className="text-gradient">It Works</span>
          </h2>
          <p className="landing-section-subtitle">Simple steps to academic success</p>
        </div>

        <div className="landing-features-grid">
          <div className="landing-feature-card" data-scroll data-scroll-speed="0.2">
            <div className="landing-feature-icon">
              <MessageSquarePlus className="h-8 w-8" />
            </div>
            <h3 className="landing-feature-title">Post Questions</h3>
            <p className="landing-feature-description">
              Students can easily post their academic questions with detailed descriptions, code snippets, and
              attachments to get help from the community.
            </p>
          </div>

          <div className="landing-feature-card" data-scroll data-scroll-speed="0.3">
            <div className="landing-feature-icon">
              <Users className="h-8 w-8" />
            </div>
            <h3 className="landing-feature-title">Peer Answers</h3>
            <p className="landing-feature-description">
              Fellow students and experts provide detailed answers, explanations, and solutions to help each other learn
              and grow academically.
            </p>
          </div>

          <div className="landing-feature-card" data-scroll data-scroll-speed="0.4">
            <div className="landing-feature-icon">
              <Trophy className="h-8 w-8" />
            </div>
            <h3 className="landing-feature-title">Leaderboard System</h3>
            <p className="landing-feature-description">
              Upvote and downvote answers based on quality. Top contributors with the highest-rated answers get featured
              on the leaderboard.
            </p>
          </div>
        </div>
      </section>

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
                <div className="landing-demo-browser-address">collegequora.edu</div>
              </div>
              <div className="landing-demo-browser-content">
                <div className="landing-demo-mockup">
                  <div className="demo-header">
                    <div className="demo-nav">
                      <div className="demo-logo"></div>
                      <div className="demo-search"></div>
                      <div className="demo-profile"></div>
                    </div>
                  </div>
                  <div className="demo-content">
                    <div className="demo-sidebar">
                      <div className="demo-menu-item active"></div>
                      <div className="demo-menu-item"></div>
                      <div className="demo-menu-item"></div>
                      <div className="demo-menu-item"></div>
                    </div>
                    <div className="demo-main">
                      <div className="demo-question-card">
                        <div className="demo-vote-section">
                          <div className="demo-vote-btn up"></div>
                          <div className="demo-vote-count">42</div>
                          <div className="demo-vote-btn down"></div>
                        </div>
                        <div className="demo-question-content">
                          <div className="demo-question-title"></div>
                          <div className="demo-question-text"></div>
                          <div className="demo-question-tags">
                            <div className="demo-tag">JavaScript</div>
                            <div className="demo-tag">React</div>
                            <div className="demo-tag">Hooks</div>
                          </div>
                        </div>
                      </div>
                      <div className="demo-question-card">
                        <div className="demo-vote-section">
                          <div className="demo-vote-btn up"></div>
                          <div className="demo-vote-count">28</div>
                          <div className="demo-vote-btn down"></div>
                        </div>
                        <div className="demo-question-content">
                          <div className="demo-question-title"></div>
                          <div className="demo-question-text"></div>
                          <div className="demo-question-tags">
                            <div className="demo-tag">Python</div>
                            <div className="demo-tag">Data Science</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="demo-right-sidebar">
                      <div className="demo-leaderboard">
                        <div className="demo-leaderboard-title">Top Contributors</div>
                        <div className="demo-contributor">
                          <div className="demo-rank gold">1</div>
                          <div className="demo-contributor-info"></div>
                        </div>
                        <div className="demo-contributor">
                          <div className="demo-rank silver">2</div>
                          <div className="demo-contributor-info"></div>
                        </div>
                        <div className="demo-contributor">
                          <div className="demo-rank bronze">3</div>
                          <div className="demo-contributor-info"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-cta" data-scroll-section>
        <div className="landing-cta-container" data-scroll data-scroll-speed="0.1">
          <h2 className="landing-cta-title">Start your academic journey today</h2>
          <p className="landing-cta-subtitle">
            Join students who use CollegeQuora to accelerate their learning
          </p>
          <div className="landing-cta-buttons">
            <Button asChild size="lg" className="landing-cta-button-primary">
              <Link to="/auth">Sign Up Now</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
