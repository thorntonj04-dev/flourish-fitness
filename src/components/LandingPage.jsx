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

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50">
        <div className="max-w-7xl mx-auto text-center max-w-3xl">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            Stronger. Healthier. Confident — for Life.
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Flourish Fitness empowers women to build lasting strength, endurance, and confidence through purposeful training, balanced nutrition, and genuine support — no quick fixes, just real transformation that lasts.
          </p>
          <button
            onClick={onLoginClick}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-medium text-lg hover:opacity-90 transition"
          >
            Start Your Journey
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">About Flourish Fitness</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Founded by <strong>Lindsey Thornton</strong>, a NASM Certified Personal Trainer and nutrition coach who believes true wellness begins with dedication, balance, and faith. Lindsey's approach blends science-backed training with heart-led guidance — helping women push past limits, stay consistent, and celebrate every win along the way.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-12">
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Award className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Expert Guidance</h3>
            <p className="text-gray-600">Personalized programs rooted in proven strength and endurance training.</p>
          </div>

          <div className="text-center p-6">
            <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-teal-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Whole-Person Wellness</h3>
            <p className="text-gray-600">Focus on physical, nutritional, and spiritual health for lifelong results.</p>
          </div>

          <div className="text-center p-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Accountability & Progress</h3>
            <p className="text-gray-600">Stay motivated with structured tracking and encouraging mentorship.</p>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Training That Meets You Where You Are</h2>
          <p className="text-xl text-gray-600">Coaching designed to help women feel powerful, not pressured.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
            <User className="w-12 h-12 text-emerald-500 mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-3">1:1 Personal Training</h3>
            <p className="text-gray-600 mb-4">
              In-person sessions focused on building functional strength, confidence, and endurance — customized to your goals and pace.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
            <Dumbbell className="w-12 h-12 text-teal-500 mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Online Coaching</h3>
            <p className="text-gray-600 mb-4">
              Fully tailored workouts and nutrition guidance delivered wherever you are, with regular check-ins and support to keep you progressing.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
            <Users className="w-12 h-12 text-green-500 mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Group Fitness</h3>
            <p className="text-gray-600 mb-4">
              Join a community of women chasing progress together. High-energy classes that challenge you and remind you that fitness can be fun.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
            <Apple className="w-12 h-12 text-amber-500 mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Nutrition Coaching</h3>
            <p className="text-gray-600 mb-4">
              Learn how to fuel your body to perform, recover, and maintain your results for life — no crash diets, no extremes.
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Real Women. Real Wins.</h2>
          <p className="text-xl text-gray-600">Behind every transformation is a story of courage, consistency, and belief.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-8">
            <div className="text-4xl mb-4">💪</div>
            <p className="text-gray-700 mb-4 italic">
              "Lindsey changed the way I see fitness. I've never been this strong — inside and out."
            </p>
            <div className="font-bold text-gray-900">- Lily</div>
          </div>

          <div className="bg-gradient-to-br from-teal-50 to-green-50 rounded-2xl p-8">
            <div className="text-4xl mb-4">🌟</div>
            <p className="text-gray-700 mb-4 italic">
              "I finally found a routine I can stick with. Her guidance helped me lose weight and keep it off."
            </p>
            <div className="font-bold text-gray-900">- Sophia</div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8">
            <div className="text-4xl mb-4">🏋️</div>
            <p className="text-gray-700 mb-4 italic">
              "She pushes hard but with purpose. I complained plenty, but I never quit — and I've never looked or felt better."
            </p>
            <div className="font-bold text-gray-900">- Jane</div>
          </div>
        </div>
      </section>

      {/* Approach Section */}
      <section id="approach" className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">The Flourish Method</h2>
          <p className="text-xl text-gray-600">Sustainable fitness built on strength, balance, and faith.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Progressive Training</h3>
            <p className="text-gray-600 mb-4">
              Rooted in the NASM OPT model, Lindsey helps clients progressively challenge their bodies to build lasting results — not burnout.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Spiritual Mentorship</h3>
            <p className="text-gray-600 mb-4">
              True transformation starts within. Lindsey brings faith and encouragement into every session, helping you find peace, purpose, and pride in your journey.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-emerald-500 via-teal-500 to-green-500">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Ready to Flourish?</h2>
          <p className="text-xl text-emerald-100 mb-8">
            Start your transformation with a coach who believes in your strength, celebrates your progress, and guides you toward lifelong wellness.
          </p>
          <button
            onClick={onLoginClick}
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-emerald-600 rounded-xl font-medium text-lg hover:bg-gray-50 transition"
          >
            Join Today
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 px-4 sm:px-6 lg:px-8">
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
