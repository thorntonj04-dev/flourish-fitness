// src/components/LandingPage.jsx
import React, { useState, useRef, useEffect } from 'react';
import {
  User,
  Dumbbell,
  Users,
  Apple,
  ChevronRight,
  Award,
  Heart,
  TrendingUp,
  Menu,
  X,
} from 'lucide-react';
import { motion, useAnimation } from 'framer-motion';

/**
 * Helper: triggers animation controls when element scrolls into view
 */
function useScrollInView(threshold = 0.25) {
  const ref = useRef(null);
  const controls = useAnimation();

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            controls.start('visible');
          }
        });
      },
      { threshold }
    );

    observer.observe(node);
    return () => observer.unobserve(node);
  }, [ref, controls, threshold]);

  return [ref, controls];
}

/**
 * Animation variants
 */
const fadeUp = {
  hidden: { opacity: 0, y: 30, scale: 0.995 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.7, ease: 'easeOut' },
  },
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.9, ease: 'easeOut' } },
};

function LandingPage({ onLoginClick }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Scroll animations for sections
  const [heroRef, heroControls] = useScrollInView(0.2);
  const [aboutRef, aboutControls] = useScrollInView(0.2);
  const [philosophyRef, philosophyControls] = useScrollInView(0.25);
  const [servicesRef, servicesControls] = useScrollInView(0.2);
  const [lifestyleRef, lifestyleControls] = useScrollInView(0.25);
  const [testimonialsRef, testimonialsControls] = useScrollInView(0.25);
  const [approachRef, approachControls] = useScrollInView(0.2);
  const [ctaRef, ctaControls] = useScrollInView(0.2);

  // Smooth scroll handler
  const handleScrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      setMobileMenuOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white antialiased">
      {/* Global Styles for Gold Shimmer Headings & Buttons */}
      <style>{`
        .gold-heading {
          background: linear-gradient(135deg, #B8860B, #FFD700, #D4AF37);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          display: inline-block;
          font-weight: 800;
        }

        .gold-btn {
          position: relative;
          background: linear-gradient(135deg, #B8860B, #FFD700, #D4AF37);
          color: black;
          overflow: hidden;
          transition: all 0.5s ease;
        }
        .gold-btn:hover {
          transform: scale(1.05);
        }
        .gold-btn::before {
          content: "";
          position: absolute;
          top: 0; left: -100%;
          width: 200%; height: 100%;
          background: linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.4) 50%, transparent 70%);
          animation: shimmer 1.5s infinite;
        }
        @keyframes shimmer {
          100% { left: 100%; }
        }
      `}</style>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50">
        <div className="bg-[#0a0a0a]/90 backdrop-blur-sm border-b border-[#1f1f1f]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Brand Logo */}
              <div className="flex items-center gap-3">
                <img
                  src="/images/logosmall.png"
                  alt="Flourish Fitness logo"
                  className="w-12 h-12 object-contain rounded-md transition-transform transform hover:scale-105"
                  style={{ boxShadow: '0 6px 18px rgba(0,0,0,0.6)' }}
                />
                <div>
                  <span className="text-xl font-extrabold tracking-tight text-[#FFD700]">
                    Flourish
                  </span>
                  <div className="text-xs text-[#D4AF37] tracking-wide">FITNESS</div>
                </div>
              </div>

              {/* Desktop Menu */}
              <div className="hidden md:flex items-center gap-8">
                {['about', 'services', 'testimonials', 'approach'].map((sec) => (
                  <button
                    key={sec}
                    onClick={() => handleScrollTo(sec)}
                    className="text-[#d8e7de] hover:text-[#FFD700] transition"
                  >
                    {sec.charAt(0).toUpperCase() + sec.slice(1)}
                  </button>
                ))}
                <button
                  onClick={onLoginClick}
                  className="px-5 py-2 rounded-lg font-semibold gold-btn"
                >
                  Client Login
                </button>
              </div>

              {/* Mobile Menu Button */}
              <div className="md:hidden">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="p-2 text-[#d8e7de] hover:text-[#FFD700] transition"
                  aria-label="Toggle menu"
                >
                  {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              </div>
            </div>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden bg-[#0a0a0a] border-t border-[#1f1f1f]">
              <div className="px-4 py-4 space-y-3 flex flex-col">
                {['about', 'services', 'testimonials', 'approach'].map((sec) => (
                  <button
                    key={sec}
                    onClick={() => handleScrollTo(sec)}
                    className="block text-left text-[#d8e7de] hover:text-[#FFD700] py-2"
                  >
                    {sec.charAt(0).toUpperCase() + sec.slice(1)}
                  </button>
                ))}
                <button
                  onClick={onLoginClick}
                  className="w-full px-6 py-3 rounded-lg font-semibold gold-btn"
                >
                  Client Login
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* HERO */}
      <motion.section
        ref={heroRef}
        initial="hidden"
        animate={heroControls}
        variants={fadeUp}
        className="relative h-screen min-h-[640px] flex items-center justify-center overflow-hidden"
      >
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('/images/naturelong.jpg')",
            filter: 'brightness(0.9) contrast(1.1) saturate(1.1)',
          }}
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a]/70 to-[#1E3328]/40" />

        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight gold-heading"
          >
            Stronger. Healthier.
            <br />
            Confident — for Life.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="mt-6 text-lg sm:text-xl text-[#d6e9dd] max-w-2xl mx-auto"
          >
            Build lasting strength, endurance, and confidence through purposeful training and
            genuine support.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.35 }}
            className="mt-8 flex justify-center"
          >
            <button
              onClick={onLoginClick}
              className="inline-flex items-center gap-3 px-8 py-4 rounded-full font-semibold gold-btn"
            >
              Start Your Journey
              <ChevronRight className="w-5 h-5" />
            </button>
          </motion.div>
        </div>
      </motion.section>

      {/* ABOUT */}
      <motion.section
        id="about"
        ref={aboutRef}
        initial="hidden"
        animate={aboutControls}
        variants={fadeUp}
        className="relative"
      >
        <div className="grid md:grid-cols-2">
          <div
            className="h-[480px] md:h-[720px] bg-cover bg-center"
            style={{
              backgroundImage: "url('/images/laugh.jpg')",
              filter: 'brightness(0.75) contrast(1.05) saturate(1.05)',
            }}
            role="img"
            aria-label="Lindsey smiling"
          />
          <div className="flex items-center px-8 py-16 md:px-16 bg-[#1E3328]">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-[#FFD700] mb-4 gold-heading">Meet Lindsey</h2>
              <p className="text-lg text-[#d8e7de] mb-4">
                <strong className="text-white">Lindsey Thornton</strong> is a NASM Certified Personal
                Trainer and nutrition coach who believes true wellness begins with dedication,
                balance, and faith.
              </p>
              <p className="text-lg text-[#d8e7de] mb-6">
                Lindsey's approach blends science-backed training with heart-led guidance — helping
                women push past limits, stay consistent, and celebrate every win along the way.
              </p>
              <button
                onClick={onLoginClick}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold gold-btn"
              >
                Work with Lindsey
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </motion.section>

      {/* TRAINING PHILOSOPHY */}
      <motion.section
        ref={philosophyRef}
        initial="hidden"
        animate={philosophyControls}
        variants={fadeUp}
        className="relative"
      >
        <div className="grid md:grid-cols-2">
          <div className="flex items-center px-8 py-16 md:px-16 bg-[#0a0a0a] order-2 md:order-1">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 gold-heading">
                Training That Meets You Where You Are
              </h2>
              <p className="text-lg text-[#d8e7de] mb-4">
                Coaching designed to help women feel powerful, not pressured. Whether you're building functional strength,
                improving endurance, or transforming your lifestyle, we customize every program to your goals and pace.
              </p>
              <p className="text-lg text-[#d8e7de] mb-6">
                No quick fixes — just real transformation that lasts through purposeful training,
                balanced nutrition, and genuine support.
              </p>
              <button
                onClick={() => handleScrollTo('services')}
                className="inline-flex items-center gap-2 text-[#FFD700] font-semibold hover:gap-3 transition-all"
              >
                Explore Our Services
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div
            className="h-[480px] md:h-[720px] bg-cover bg-center order-1 md:order-2"
            style={{ backgroundImage: "url('/images/cherryblossoms.jpg')", filter: 'brightness(0.75) contrast(1.05) saturate(1.05)' }}
          />
        </div>
      </motion.section>

      {/* SERVICES */}
      <motion.section
        id="services"
        ref={servicesRef}
        initial="hidden"
        animate={servicesControls}
        variants={fadeUp}
        className="py-20 px-4 sm:px-6 lg:px-8 bg-[#1E3328]"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-2 gold-heading">Our Services</h2>
            <p className="text-lg text-[#d8e7de]">Personalized fitness solutions for every journey</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: User, title: '1:1 Personal Training', desc: 'In-person sessions focused on building functional strength, confidence, and endurance — customized to your goals and pace.' },
              { icon: Dumbbell, title: 'Online Coaching', desc: 'Fully tailored workouts and nutrition guidance delivered wherever you are, with regular check-ins and support.' },
              { icon: Users, title: 'Group Fitness', desc: 'Join a community of women chasing progress together. High-energy classes that challenge and inspire.' },
              { icon: Apple, title: 'Nutrition Coaching', desc: 'Learn how to fuel your body to perform, recover, and maintain your results for life — no crash diets.' },
            ].map((s, i) => (
              <div key={i} className="p-8 rounded-lg bg-[#000000]/40 backdrop-blur-sm border border-[#C6A45F]/25 transform hover:-translate-y-1 transition">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-[#2ECC71]/10 mx-auto mb-4">
                  <s.icon className="w-8 h-8 text-[#C6A45F]" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3 text-center">{s.title}</h3>
                <p className="text-center text-[#d8e7de]">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* LIFESTYLE */}
      <motion.section
        ref={lifestyleRef}
        initial="hidden"
        animate={lifestyleControls}
        variants={fadeIn}
        className="relative h-[560px] flex items-center justify-center"
      >
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('/images/naturetall.jpg')",
            filter: 'brightness(0.55) contrast(1.05) saturate(1.1)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1E3328]/80 to-[#0a0a0a]/60" />
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 gold-heading">Whole-Person Wellness</h2>
          <p className="text-lg text-[#d8e7de] mb-8">
            Focus on physical, nutritional, and spiritual health for lifelong results. True
            transformation starts within.
          </p>

          <div className="grid md:grid-cols-3 gap-8 text-white">
            {[
              { icon: Award, title: 'Expert Guidance', desc: 'Proven strength and endurance training' },
              { icon: Heart, title: 'Holistic Approach', desc: 'Body, mind, and spirit wellness' },
              { icon: TrendingUp, title: 'Real Progress', desc: 'Structured tracking and accountability' },
            ].map((item, i) => (
              <div key={i} className="p-6 bg-[#000000]/30 rounded-lg backdrop-blur-sm">
                <div className="w-14 h-14 bg-[#C6A45F]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-6 h-6 text-[#C6A45F]" />
                </div>
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-sm text-[#d8e7de]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* FOOTER */}
      <footer className="bg-[#0a0a0a] border-t border-[#1f1f1f] py-12 px-6 flex flex-col items-center gap-6">
        <img
          src="/images/fflogo.png"
          alt="Flourish logo"
          className="w-72 md:w-96 object-contain transition-transform transform hover:scale-105"
          style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.6)' }}
        />
        <p className="text-sm text-[#d8e7de] text-center max-w-md">
          &copy; {new Date().getFullYear()} Flourish Fitness. All rights reserved.
        </p>
      </footer>
    </div>
  );
}

export default LandingPage;

