import React, { useState } from 'react';
import { ref as dbRef, push, set } from 'firebase/database';
import { db } from '../firebase';
import { X, ChevronRight, Check, Heart } from 'lucide-react';

const GOALS = [
  'Lose weight & burn fat',
  'Build strength & muscle',
  'Improve endurance & stamina',
  'General health & wellness',
  'Post-injury or postpartum recovery',
  'Other',
];

const EXPERIENCE_LEVELS = [
  "Complete beginner — I've never trained before",
  'Some experience — trained casually in the past',
  'Intermediate — I train regularly',
  'Advanced — very experienced',
];

const DAYS_PER_WEEK = ['2 days', '3 days', '4 days', '5+ days'];

export default function InquiryModal({ onClose }) {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    goal: '',
    experience: '',
    daysPerWeek: '',
    healthConcerns: '',
    additionalInfo: '',
  });

  const update = (field, val) => setForm(prev => ({ ...prev, [field]: val }));
  const step1Valid = form.name.trim() && form.email.trim() && form.goal && form.experience;

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.email.trim()) return;
    setSubmitting(true);
    try {
      const newRef = push(dbRef(db, 'inquiries'));
      await set(newRef, { ...form, status: 'new', submittedAt: new Date().toISOString() });
      setSubmitted(true);
    } catch (err) {
      console.error('Error submitting inquiry:', err);
      alert('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.88)' }}
    >
      <div
        className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl flex flex-col"
        style={{
          background: '#0f1a14',
          border: '1px solid rgba(198,164,95,0.3)',
          maxHeight: '92vh',
        }}
      >
        {/* Sticky header */}
        <div
          className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(198,164,95,0.2)' }}
        >
          <div>
            <div className="font-bold text-white text-lg">Work with Lindsey</div>
            {!submitted && (
              <div className="text-xs mt-0.5" style={{ color: '#C6A45F' }}>
                Step {step} of 2
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.1)' }}
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 py-6">
          {submitted ? (
            <div className="text-center py-8">
              <div
                className="w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-6"
                style={{ background: 'linear-gradient(135deg, #B8860B, #FFD700)' }}
              >
                <Check className="w-10 h-10 text-black" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">You're all set!</h3>
              <p className="mb-1" style={{ color: '#d8e7de' }}>
                Thank you, <strong className="text-white">{form.name.split(' ')[0]}</strong>!
              </p>
              <p className="text-sm leading-relaxed mb-8" style={{ color: '#d8e7de' }}>
                Lindsey will review your information and reach out to{' '}
                <strong className="text-white">{form.email}</strong> within 24–48 hours.
              </p>
              <div className="flex items-center justify-center gap-2 text-sm mb-8" style={{ color: '#C6A45F' }}>
                <Heart className="w-4 h-4" />
                <span>Can't wait to start this journey with you!</span>
              </div>
              <button
                onClick={onClose}
                className="w-full py-4 rounded-xl font-bold text-black"
                style={{ background: 'linear-gradient(135deg, #B8860B, #FFD700)' }}
              >
                Close
              </button>
            </div>
          ) : step === 1 ? (
            <div className="space-y-5">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Let's get to know you</h3>
                <p className="text-sm" style={{ color: '#d8e7de' }}>
                  Tell Lindsey a little about yourself to get started.
                </p>
              </div>

              <Field label="Full Name *">
                <input
                  type="text"
                  placeholder="Jane Smith"
                  value={form.name}
                  onChange={e => update('name', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-white text-base outline-none placeholder-white/30"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(198,164,95,0.3)' }}
                />
              </Field>

              <Field label="Email Address *">
                <input
                  type="email"
                  placeholder="jane@example.com"
                  value={form.email}
                  onChange={e => update('email', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-white text-base outline-none placeholder-white/30"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(198,164,95,0.3)' }}
                />
              </Field>

              <Field label="Phone Number (optional)">
                <input
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={form.phone}
                  onChange={e => update('phone', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-white text-base outline-none placeholder-white/30"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(198,164,95,0.3)' }}
                />
              </Field>

              <Field label="What's your main goal? *">
                <div className="space-y-2">
                  {GOALS.map(g => (
                    <button
                      key={g}
                      onClick={() => update('goal', g)}
                      className="w-full px-4 py-3 rounded-xl text-left text-sm font-medium transition"
                      style={{
                        background: form.goal === g
                          ? 'linear-gradient(135deg, rgba(184,134,11,0.35), rgba(255,215,0,0.15))'
                          : 'rgba(255,255,255,0.07)',
                        border: `1px solid ${form.goal === g ? '#FFD700' : 'rgba(198,164,95,0.3)'}`,
                        color: form.goal === g ? '#FFD700' : '#d8e7de',
                      }}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Experience level *">
                <div className="space-y-2">
                  {EXPERIENCE_LEVELS.map(e => (
                    <button
                      key={e}
                      onClick={() => update('experience', e)}
                      className="w-full px-4 py-3 rounded-xl text-left text-sm font-medium transition"
                      style={{
                        background: form.experience === e
                          ? 'linear-gradient(135deg, rgba(184,134,11,0.35), rgba(255,215,0,0.15))'
                          : 'rgba(255,255,255,0.07)',
                        border: `1px solid ${form.experience === e ? '#FFD700' : 'rgba(198,164,95,0.3)'}`,
                        color: form.experience === e ? '#FFD700' : '#d8e7de',
                      }}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </Field>

              <button
                onClick={() => setStep(2)}
                disabled={!step1Valid}
                className="w-full py-4 rounded-xl font-bold text-black flex items-center justify-center gap-2 disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg, #B8860B, #FFD700)' }}
              >
                Continue
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <button
                  onClick={() => setStep(1)}
                  className="text-sm mb-4 flex items-center gap-1"
                  style={{ color: '#C6A45F' }}
                >
                  ← Back
                </button>
                <h3 className="text-xl font-bold text-white mb-1">Almost there!</h3>
                <p className="text-sm" style={{ color: '#d8e7de' }}>
                  A few more details to help Lindsey prepare for you.
                </p>
              </div>

              <Field label="How many days per week can you train?">
                <div className="grid grid-cols-2 gap-2">
                  {DAYS_PER_WEEK.map(d => (
                    <button
                      key={d}
                      onClick={() => update('daysPerWeek', d)}
                      className="py-3 rounded-xl text-sm font-semibold transition"
                      style={{
                        background: form.daysPerWeek === d
                          ? 'linear-gradient(135deg, rgba(184,134,11,0.35), rgba(255,215,0,0.15))'
                          : 'rgba(255,255,255,0.07)',
                        border: `1px solid ${form.daysPerWeek === d ? '#FFD700' : 'rgba(198,164,95,0.3)'}`,
                        color: form.daysPerWeek === d ? '#FFD700' : '#d8e7de',
                      }}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Any health concerns or injuries we should know about?">
                <textarea
                  placeholder="e.g. bad knees, lower back pain, recent surgery, pregnant or postpartum…"
                  value={form.healthConcerns}
                  onChange={e => update('healthConcerns', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none resize-none placeholder-white/30"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(198,164,95,0.3)' }}
                  rows={3}
                />
              </Field>

              <Field label="Anything else you'd like Lindsey to know?">
                <textarea
                  placeholder="Your schedule, past experience, motivation — anything!"
                  value={form.additionalInfo}
                  onChange={e => update('additionalInfo', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none resize-none placeholder-white/30"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(198,164,95,0.3)' }}
                  rows={3}
                />
              </Field>

              <button
                onClick={handleSubmit}
                disabled={submitting || !form.name.trim() || !form.email.trim()}
                className="w-full py-4 rounded-xl font-bold text-black flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #B8860B, #FFD700)' }}
              >
                {submitting ? 'Sending…' : 'Send My Inquiry'}
                {!submitting && <Heart className="w-5 h-5" />}
              </button>

              <p className="text-xs text-center pb-2" style={{ color: 'rgba(216,231,222,0.45)' }}>
                Your information is private and will only be seen by Lindsey.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label
        className="block text-xs font-bold uppercase tracking-wider mb-2"
        style={{ color: '#C6A45F' }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}
