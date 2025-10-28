import { useState } from 'react';
import { User, Dumbbell, Users, Apple, ChevronRight, Award, Heart, TrendingUp, Menu, X } from 'lucide-react';

function LandingPage({ onLoginClick }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                <Dumbbell className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Flourish Fitness</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#about" className="text-gray-700 hover:text-emerald-600 transition">About</a>
              <a href="#services" className="text-gray-700 hover:text-emerald-600 transition">Services</a>
              <a href="#testimonials" className="text-gray-700 hover:text-emerald-600 transition">Success Stories</a>
              <a href="#approach" className="text-gray-700 hover:text-emerald-600 transition">Our Approach</a>
              <button
                onClick={onLoginClick}
                className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg font-medium hover:opacity-90 transition"
              >
                Client Login
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-700"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200">
            <div className="px-4 py-4 space-y-3">
              <a href="#about" className="block text-gray-700 hover:text-emerald-600 py-2">About</a>
              <a href="#services" className="block text-gray-700 hover:text-emerald-600 py-2">Services</a>
              <a href="#testimonials" className="block text-gray-700 hover:text-emerald-600 py-2">Success Stories</a>
              <a href="#approach" className="block text-gray-700 hover:text-emerald-600 py-2">Our Approach</a>
              <button
                onClick={onLoginClick}
                className="w-full px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg font-medium"
              >
                Client Login
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section - Full Width Image with Overlay */}
      <section className="relative h-screen min-h-[600px] flex items-center justify-center">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/images/naturelong.jpg')" }}
        >
          <div className="absolute inset-0 bg-black/40"></div>
        </div>
        
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6">
            Stronger. Healthier.<br />Confident — for Life.
          </h1>
          <p className="text-xl sm:text-2xl text-white/95 mb-8 max-w-2xl mx-auto">
            Build lasting strength, endurance, and confidence through purposeful training and genuine support.
          </p>
          <button
            onClick={onLoginClick}
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-gray-900 rounded-full font-semibold text-lg hover:bg-gray-100 transition"
          >
            Start Your Journey
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* About Lindsey - Image Left, Text Right */}
      <section id="about" className="relative">
        <div className="grid md:grid-cols-2">
          {/* Image Side */}
          <div 
            className="h-[500px] md:h-[700px] bg-cover bg-center"
            style={{ backgroundImage: "url('/images/laugh.jpg')" }}
          ></div>

          {/* Text Side */}
          <div className="flex items-center px-8 py-16 md:px-16 bg-gray-50">
            <div>
              <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
                Meet Lindsey
              </h2>
              <p className="text-lg text-gray-700 mb-4">
                <strong>Lindsey Thornton</strong> is a NASM Certified Personal Trainer and nutrition coach who believes true wellness begins with dedication, balance, and faith.
              </p>
              <p className="text-lg text-gray-700 mb-6">
                Lindsey's approach blends science-backed training with heart-led guidance — helping women push past limits, stay consistent, and celebrate every win along the way.
              </p>
              <button
                onClick={onLoginClick}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-full font-semibold hover:opacity-90 transition"
              >
                Work with Lindsey
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Training Philosophy - Text Left, Image Right */}
      <section className="relative">
        <div className="grid md:grid-cols-2">
          {/* Text Side */}
          <div className="flex items-center px-8 py-16 md:px-16 bg-white order-2 md:order-1">
            <div>
              <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
                Training That Meets You Where You Are
              </h2>
              <p className="text-lg text-gray-700 mb-4">
                Coaching designed to help women feel powerful, not pressured. Whether you're building functional strength, improving endurance, or transforming your lifestyle, we customize every program to your goals and pace.
              </p>
              <p className="text-lg text-gray-700 mb-6">
                No quick fixes — just real transformation that lasts through purposeful training, balanced nutrition, and genuine support.
              </p>
              <a href="#services" className="inline-flex items-center gap-2 text-emerald-600 font-semibold hover:gap-3 transition-all">
                Explore Our Services
                <ChevronRight className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Image Side */}
          <div 
            className="h-[500px] md:h-[700px] bg-cover bg-center order-1 md:order-2"
            style={{ backgroundImage: "url('/images/fly.jpg')" }}
          ></div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">Our Services</h2>
            <p className="text-xl text-gray-600">Personalized fitness solutions for every journey</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-8 rounded-lg">
              <User className="w-12 h-12 text-emerald-500 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">1:1 Personal Training</h3>
              <p className="text-gray-600">
                In-person sessions focused on building functional strength, confidence, and endurance — customized to your goals and pace.
              </p>
            </div>

            <div className="bg-white p-8 rounded-lg">
              <Dumbbell className="w-12 h-12 text-teal-500 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">Online Coaching</h3>
              <p className="text-gray-600">
                Fully tailored workouts and nutrition guidance delivered wherever you are, with regular check-ins and support.
              </p>
            </div>

            <div className="bg-white p-8 rounded-lg">
              <Users className="w-12 h-12 text-green-500 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">Group Fitness</h3>
              <p className="text-gray-600">
                Join a community of women chasing progress together. High-energy classes that challenge and inspire.
              </p>
            </div>

            <div className="bg-white p-8 rounded-lg">
              <Apple className="w-12 h-12 text-amber-500 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">Nutrition Coaching</h3>
              <p className="text-gray-600">
                Learn how to fuel your body to perform, recover, and maintain your results for life — no crash diets.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Lifestyle Section - Full Width with Overlay */}
      <section className="relative h-[600px] flex items-center justify-center">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/images/naturetall.jpg')" }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/80 to-teal-900/60"></div>
        </div>
        
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Whole-Person Wellness
          </h2>
          <p className="text-xl text-white/95 mb-8">
            Focus on physical, nutritional, and spiritual health for lifelong results. True transformation starts within.
          </p>
          <div className="grid md:grid-cols-3 gap-8 text-white">
            <div>
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold mb-2">Expert Guidance</h3>
              <p className="text-white/90">Proven strength and endurance training</p>
            </div>
            <div>
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold mb-2">Holistic Approach</h3>
              <p className="text-white/90">Body, mind, and spirit wellness</p>
            </div>
            <div>
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold mb-2">Real Progress</h3>
              <p className="text-white/90">Structured tracking and accountability</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">Real Women. Real Wins.</h2>
            <p className="text-xl text-gray-600">Behind every transformation is a story of courage, consistency, and belief.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 bg-gray-50 rounded-lg">
              <div className="text-4xl mb-4">💪</div>
              <p className="text-gray-700 mb-4 italic">
                "Lindsey changed the way I see fitness. I've never been this strong — inside and out."
              </p>
              <div className="font-bold text-gray-900">- Lily</div>
            </div>

            <div className="p-8 bg-gray-50 rounded-lg">
              <div className="text-4xl mb-4">🌟</div>
              <p className="text-gray-700 mb-4 italic">
                "I finally found a routine I can stick with. Her guidance helped me lose weight and keep it off."
              </p>
              <div className="font-bold text-gray-900">- Sophia</div>
            </div>

            <div className="p-8 bg-gray-50 rounded-lg">
              <div className="text-4xl mb-4">🏋️</div>
              <p className="text-gray-700 mb-4 italic">
                "She pushes hard but with purpose. I complained plenty, but I never quit — and I've never looked or felt better."
              </p>
              <div className="font-bold text-gray-900">- John</div>
            </div>
          </div>
        </div>
      </section>

      {/* Approach Section - Cherry Blossoms with Overlay */}
      <section id="approach" className="relative h-[700px] flex items-center">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/images/cherryblossoms.jpg')" }}
        >
          <div className="absolute inset-0 bg-black/50"></div>
        </div>
        
        <div className="relative z-10 px-8 md:px-16 max-w-7xl mx-auto w-full">
          <div className="max-w-2xl">
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-8">
              The Flourish Method
            </h2>
            <div className="space-y-6">
              <div className="bg-white/10 backdrop-blur-md p-6 rounded-lg border border-white/20">
                <h3 className="text-2xl font-bold text-white mb-3">Progressive Training</h3>
                <p className="text-white/90">
                  Rooted in the NASM OPT model, Lindsey helps clients progressively challenge their bodies to build lasting results — not burnout.
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-md p-6 rounded-lg border border-white/20">
                <h3 className="text-2xl font-bold text-white mb-3">Spiritual Mentorship</h3>
                <p className="text-white/90">
                  True transformation starts within. Lindsey brings faith and encouragement into every session, helping you find peace, purpose, and pride in your journey.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-emerald-500 via-teal-500 to-green-500">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">Ready to Flourish?</h2>
          <p className="text-xl text-white/95 mb-8">
            Start your transformation with a coach who believes in your strength, celebrates your progress, and guides you toward lifelong wellness.
          </p>
          <button
            onClick={onLoginClick}
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-gray-900 rounded-full font-semibold text-lg hover:bg-gray-100 transition"
          >
            Join Today
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">Flourish Fitness</span>
          </div>
          <p className="text-gray-400">Empowering women through strength, nutrition, and faith-based coaching.</p>
          <div className="mt-4 text-sm text-gray-500">© 2025 Flourish Fitness. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
