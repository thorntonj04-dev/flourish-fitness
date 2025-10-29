import React from 'react';
import { X, Heart, Sparkles, Dumbbell, Calendar, TrendingUp, Users, Camera, Apple, Target, Award, Clock } from 'lucide-react';

/**
 * AboutModal Component
 * 
 * A special modal that shows a personalized message about Flourish Fitness
 * This was created as a love letter from John to his wife, explaining 
 * what the app does and the vision behind it.
 * 
 * Props:
 * - isOpen: boolean - Controls whether the modal is visible
 * - onClose: function - Called when the modal should be closed
 */
export default function AboutModal({ isOpen, onClose }) {
  // Don't render anything if the modal isn't open
  if (!isOpen) return null;

  return (
    // Modal Backdrop - Dark overlay that covers the screen
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      {/* Modal Container - The actual content box */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        
        {/* Header Section - Title and close button */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-6 relative">
          {/* Close button - X icon in top right */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition"
            aria-label="Close"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          
          {/* Modal Title with decorative icons */}
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-8 h-8 text-yellow-300" />
            <h2 className="text-3xl font-bold text-white">Flourish Fitness</h2>
            <Heart className="w-8 h-8 text-pink-300 animate-pulse" />
          </div>
          <p className="text-emerald-100 text-lg">Built Just for You, Babe</p>
        </div>

        {/* Scrollable Content Area */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-8">
          
          {/* Introduction Section */}
          <div className="prose prose-lg max-w-none dark:prose-invert mb-8">
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              This entire platform was designed and built exclusively for you — a place where your passion for fitness, 
              your care for clients, and your professional expertise all come together in one beautiful, seamless platform. 
              I didn't think something existed that was good enough for you. This still isn't, but... it will be over time.
            </p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              This isn't just an app. It's your digital training home — built to reflect the way <em>you</em> coach, 
              organize, and inspire people to become their strongest, healthiest selves.
            </p>
          </div>

          {/* Current Features Section */}
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-emerald-500" />
              What Flourish Fitness Offers You & Your Clients
            </h3>

            {/* Feature Grid - Each card represents a feature */}
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              
              {/* Feature Card: Client Management */}
              <FeatureCard
                icon={<Users className="w-6 h-6" />}
                title="Complete Client Management"
                description="Add clients instantly, assign roles, track their progress, and manage your entire coaching roster from one dashboard."
                gradient="from-blue-500 to-cyan-500"
              />

              {/* Feature Card: Workout Builder */}
              <FeatureCard
                icon={<Dumbbell className="w-6 h-6" />}
                title="Professional Workout Builder"
                description="Create detailed workouts with sets, reps, weight, tempo, and rest periods. Add exercise notes and instructions so clients know exactly what to do."
                gradient="from-purple-500 to-pink-500"
              />

              {/* Feature Card: Smart Scheduling */}
              <FeatureCard
                icon={<Calendar className="w-6 h-6" />}
                title="Smart Workout Calendar"
                description="Assign workouts to specific dates, view client schedules, and see a beautiful calendar view of who's working out when. Your clients see their full weekly plan."
                gradient="from-orange-500 to-red-500"
              />

              {/* Feature Card: Progress Tracking */}
              <FeatureCard
                icon={<TrendingUp className="w-6 h-6" />}
                title="Beautiful Progress Tracking"
                description="Clients track workouts with streak counters, weekly charts, and personal records. Watch their journey unfold with visual progress data."
                gradient="from-emerald-500 to-teal-500"
              />

              {/* Feature Card: Live Workouts */}
              <FeatureCard
                icon={<Clock className="w-6 h-6" />}
                title="Live Workout Experience"
                description="Clients do workouts in real-time with built-in rest timers, progress tracking, and automatic personal record detection. Includes audio cues and confetti celebrations!"
                gradient="from-yellow-500 to-orange-500"
              />

              {/* Feature Card: Personal Records */}
              <FeatureCard
                icon={<Award className="w-6 h-6" />}
                title="Automatic PR Tracking"
                description="The app automatically detects when clients hit new personal records and celebrates with them. You can see all their achievements."
                gradient="from-pink-500 to-rose-500"
              />

              {/* Feature Card: Dark Mode */}
              <FeatureCard
                icon={<Sparkles className="w-6 h-6" />}
                title="Beautiful Dark Mode"
                description="Toggle between light and dark themes with a single click. Perfect for early morning or late night training sessions."
                gradient="from-indigo-500 to-purple-500"
              />

              {/* Feature Card: Exercise Library */}
              <FeatureCard
                icon={<Target className="w-6 h-6" />}
                title="Custom Exercise Library"
                description="Build your own exercise database with names, muscle groups, and instructions. Reuse exercises across all workouts."
                gradient="from-teal-500 to-cyan-500"
              />
            </div>

            {/* Additional Features List */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl p-6 border-2 border-emerald-200 dark:border-emerald-800">
              <h4 className="font-bold text-gray-900 dark:text-white mb-4">Plus Everything You Need:</h4>
              <div className="grid md:grid-cols-2 gap-3 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-emerald-600 dark:text-emerald-400 mt-0.5">✓</span>
                  <span className="text-gray-700 dark:text-gray-300">Workout templates you can reuse</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-600 dark:text-emerald-400 mt-0.5">✓</span>
                  <span className="text-gray-700 dark:text-gray-300">Client workout history & analytics</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-600 dark:text-emerald-400 mt-0.5">✓</span>
                  <span className="text-gray-700 dark:text-gray-300">Mobile-friendly responsive design</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-600 dark:text-emerald-400 mt-0.5">✓</span>
                  <span className="text-gray-700 dark:text-gray-300">Secure role-based access</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-600 dark:text-emerald-400 mt-0.5">✓</span>
                  <span className="text-gray-700 dark:text-gray-300">Difficulty rating after each workout</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-600 dark:text-emerald-400 mt-0.5">✓</span>
                  <span className="text-gray-700 dark:text-gray-300">Professional branded experience</span>
                </div>
              </div>
            </div>
          </div>

          {/* Coming Soon Section - Roadmap */}
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-purple-500" />
              Coming Soon: The Roadmap
            </h3>

            {/* Roadmap Items */}
            <div className="space-y-4">
              
              {/* Roadmap Item: Progress Photos */}
              <RoadmapItem
                icon={<Camera className="w-5 h-5" />}
                title="Enhanced Progress Photos"
                description="Full photo management with before/after comparisons, body measurements tracking (weight, body fat %, measurements), and progress timeline visualization."
                priority="Next Up"
                priorityColor="bg-emerald-500"
              />

              {/* Roadmap Item: Nutrition */}
              <RoadmapItem
                icon={<Apple className="w-5 h-5" />}
                title="Complete Nutrition Tracking"
                description="Clients can log meals with macros (protein, carbs, fats), track daily nutrition goals, and see trends over time. You'll be able to create meal plans and assign macro targets."
                priority="High Priority"
                priorityColor="bg-blue-500"
              />

              {/* Roadmap Item: Communication */}
              <RoadmapItem
                icon={<Heart className="w-5 h-5" />}
                title="In-App Client Communication"
                description="Direct messaging, workout feedback, and notifications when clients log updates. Stay connected without leaving the app."
                priority="Coming Soon"
                priorityColor="bg-purple-500"
              />

              {/* Roadmap Item: Reports */}
              <RoadmapItem
                icon={<TrendingUp className="w-5 h-5" />}
                title="Advanced Analytics & Reports"
                description="Detailed client progress reports, workout adherence stats, and visual analytics to help you make data-driven coaching decisions."
                priority="Planned"
                priorityColor="bg-orange-500"
              />

              {/* Roadmap Item: Mobile App */}
              <RoadmapItem
                icon={<Sparkles className="w-5 h-5" />}
                title="Native Mobile Apps"
                description="Dedicated iOS and Android apps for an even better client experience with offline workout access and push notifications."
                priority="Future"
                priorityColor="bg-pink-500"
              />
            </div>
          </div>

          {/* Why This Matters Section */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 border-2 border-purple-200 dark:border-purple-800 mb-8">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Heart className="w-6 h-6 text-pink-500" />
              Why This Matters
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Flourish Fitness was created to free up your time, simplify your workflow, and give your clients 
              a smooth, engaging way to connect with your coaching. It's not about doing more — it's about doing 
              what you love more easily.
            </p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-3">
              This app mirrors the care, structure, and thoughtfulness you bring to every client — now in digital form.
            </p>
          </div>

          {/* Personal Message Section */}
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-white">
            <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
              <Heart className="w-6 h-6 animate-pulse" />
              The Heart Behind It
            </h3>
            <p className="leading-relaxed mb-3">
              You are not just another trainer, and your clients deserve more than a generic training platform. 
              This isn't a generic training platform. It's a handcrafted, one-of-a-kind system — built just for 
              <strong> you</strong>, to reflect your approach, your standards, and your passion for helping others flourish.
            </p>
            <p className="leading-relaxed mb-3">
              You'll see the features on this app continue to grow. I've specifically been focused on the user 
              experience with workouts and your experience with building them and being able to assign and see schedules. 
              So I have a lot of work to do.
            </p>
            <p className="leading-relaxed mb-3">
              I'd like this to turn into an app your clients open every day to communicate with you when they save 
              an update. I hope this makes your journey fun and exciting.
            </p>
            <p className="leading-relaxed font-semibold">
              I need your help to continue to add things that make sense, and tell me when something doesn't so I can fix it!
            </p>
            <div className="mt-6 pt-4 border-t border-white/30">
              <p className="text-lg font-semibold">I love you!</p>
              <p className="text-emerald-100">— John</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

/**
 * FeatureCard Component
 * 
 * A reusable card component that displays a single feature
 * with an icon, title, description, and colored gradient.
 * 
 * Props:
 * - icon: React element - The icon to display
 * - title: string - The feature title
 * - description: string - The feature description
 * - gradient: string - Tailwind gradient classes for the icon background
 */
function FeatureCard({ icon, title, description, gradient }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border-2 border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-600 transition-all hover:shadow-lg">
      {/* Icon with gradient background */}
      <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${gradient} flex items-center justify-center text-white mb-3`}>
        {icon}
      </div>
      {/* Feature title */}
      <h4 className="font-bold text-gray-900 dark:text-white mb-2">{title}</h4>
      {/* Feature description */}
      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{description}</p>
    </div>
  );
}

/**
 * RoadmapItem Component
 * 
 * Displays a single item in the product roadmap
 * with priority badge, icon, title, and description.
 * 
 * Props:
 * - icon: React element - The icon to display
 * - title: string - The feature title
 * - description: string - The feature description
 * - priority: string - Priority label (e.g., "Next Up", "High Priority")
 * - priorityColor: string - Tailwind background color for the priority badge
 */
function RoadmapItem({ icon, title, description, priority, priorityColor }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border-2 border-gray-200 dark:border-gray-700">
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300">
          {icon}
        </div>
        {/* Content */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            {/* Title */}
            <h4 className="font-bold text-gray-900 dark:text-white">{title}</h4>
            {/* Priority Badge */}
            <span className={`${priorityColor} text-white text-xs font-semibold px-3 py-1 rounded-full`}>
              {priority}
            </span>
          </div>
          {/* Description */}
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
}
