import React, { useState } from 'react';
import { Dumbbell, Menu, X, ChevronRight, Award, Heart, TrendingUp, User, Users, Apple } from 'lucide-react';

export default function LandingPage({ onLoginClick }) {
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

        {/* Mobile Menu */}
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
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Transform Your Fitness Journey
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Personalized training, nutrition coaching, and unwavering support to help you achieve your fitness aspirations through dedication and sweat equity.
            </p>
            <button
              onClick={onLoginClick}
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-medium text-lg hover:opacity-90 transition"
            >
              Get Started Today
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">About Flourish Fitness</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Founded by Lindsey Thornton, a NASM Certified Personal Trainer committed to helping you achieve your fitness aspirations through diligent work and sweat equity.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mt-12">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Expert Guidance</h3>
              <p className="text-gray-600">
                NASM certified training with proven methodologies for guaranteed results
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-teal-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Holistic Approach</h3>
              <p className="text-gray-600">
                Mind-body connection through spiritual mentoring and physical transformation
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Proven Results</h3>
              <p className="text-gray-600">
                Track progress with accountability systems that ensure your success
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Our Services</h2>
            <p className="text-xl text-gray-600">Comprehensive fitness solutions tailored to your needs</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
              <User className="w-12 h-12 text-emerald-500 mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-3">1:1 Personal Training</h3>
              <p className="text-gray-600 mb-4">
                Experience personalized training sessions designed to elevate your fitness levels, improve endurance, and achieve your specific goals. Tailored to your individual needs for a focused and effective workout.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
              <Dumbbell className="w-12 h-12 text-teal-500 mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Online Coaching</h3>
              <p className="text-gray-600 mb-4">
                Access personalized workout and nutrition plans from anywhere. Whether traveling or working out from home, our online coaching offers flexibility without compromising on results.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
              <Users className="w-12 h-12 text-green-500 mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Group Fitness</h3>
              <p className="text-gray-600 mb-4">
                Participate in group fitness classes in a supportive and motivational environment. Perfect for all levels and designed to foster community while achieving your fitness goals.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
              <Apple className="w-12 h-12 text-amber-500 mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Nutrition Coaching</h3>
              <p className="text-gray-600 mb-4">
                Discover the benefits of nutrition counseling to support your fitness journey. Focus on making informed food choices with guidance to fuel your body for success.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Success Stories</h2>
            <p className="text-xl text-gray-600">Real transformations from real clients</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-8">
              <div className="text-4xl mb-4">💪</div>
              <p className="text-gray-700 mb-4 italic">
                "Training with Flourish Fitness has been a transformative experience. I've cried. I've yelled. I've lost my cool. But I've never felt better, and I've never looked forward to the gym until now!"
              </p>
              <div className="font-bold text-gray-900">- Lily</div>
            </div>

            <div className="bg-gradient-to-br from-teal-50 to-green-50 rounded-2xl p-8">
              <div className="text-4xl mb-4">🌟</div>
              <p className="text-gray-700 mb-4 italic">
                "I'm incredibly grateful for the guidance and expertise of Flourish Fitness. The tailored plans have not only improved my fitness but also my overall well-being."
              </p>
              <div className="font-bold text-gray-900">- Sophia</div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8">
              <div className="text-4xl mb-4">🏋️</div>
              <p className="text-gray-700 mb-4 italic">
                "I was one of Lindsey's first clients. She is very intense. You'll be sore, you will hurt, and probably complain. I sure did, but... she was right. I started changing shape and now my wife is VERY happy with the results."
              </p>
              <div className="font-bold text-gray-900">- John</div>
            </div>
          </div>
        </div>
      </section>

      {/* Approach Section */}
      <section id="approach" className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Our Approach</h2>
            <p className="text-xl text-gray-600">Science-backed methods for sustainable results</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-3">NASM OPT Method</h3>
              <p className="text-gray-600 mb-4">
                We follow the NASM OPT method and focus on progressive overloading during workouts. Each client receives a customized workout and nutrition plan based on their goals, preferences, and fitness level, ensuring continuous improvement and sustainable results.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Spiritual Mentoring</h3>
              <p className="text-gray-600 mb-4">
                Experience not only physical change but also a lifting of your spirit. Each session is designed to nurture your inner self while enhancing your outer self, leaving you feeling revitalized and inspired.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-emerald-500 via-teal-500 to-green-500">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Life?
          </h2>
          <p className="text-xl text-emerald-100 mb-8">
            Join Flourish Fitness today and start your journey to a healthier, stronger you.
          </p>
          <button
            onClick={onLoginClick}
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-emerald-600 rounded-xl font-medium text-lg hover:bg-gray-50 transition"
          >
            Get Started Now
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
          <p className="text-gray-400">
            Transform your fitness journey with personalized training and nutrition coaching
          </p>
          <div className="mt-4 text-sm text-gray-500">
            © 2025 Flourish Fitness. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
