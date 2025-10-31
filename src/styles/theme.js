// src/styles/theme.js
// Flourish Fitness - Luxe Theme Configuration

export const colors = {
  // Main backgrounds
  primary: '#0a0a0a',
  secondary: '#1E3328',
  
  // Accent golds
  goldDark: '#B8860B',
  goldBright: '#FFD700',
  goldMedium: '#D4AF37',
  goldAccent: '#C6A45F',
  
  // Text colors
  textPrimary: '#ffffff',
  textSecondary: '#d8e7de',
  textMuted: '#d6e9dd',
  
  // Borders and overlays
  border: '#1f1f1f',
  borderGold: '#C6A45F',
  overlay: 'rgba(10, 10, 10, 0.9)',
  overlayLight: 'rgba(10, 10, 10, 0.7)',
};

export const gradients = {
  gold: 'linear-gradient(135deg, #B8860B, #FFD700, #D4AF37)',
  goldOverlay: 'linear-gradient(to bottom right, rgba(30, 51, 40, 0.8), rgba(10, 10, 10, 0.6))',
  shimmer: 'linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.4) 50%, transparent 70%)',
};

export const shadows = {
  sm: '0 2px 8px rgba(0,0,0,0.4)',
  md: '0 6px 18px rgba(0,0,0,0.6)',
  lg: '0 8px 24px rgba(0,0,0,0.6)',
  xl: '0 12px 32px rgba(0,0,0,0.7)',
};

export const spacing = {
  sectionY: 'py-20',
  sectionX: 'px-4 sm:px-6 lg:px-8',
  cardPadding: 'p-8',
};

export const typography = {
  heading: {
    h1: 'text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold',
    h2: 'text-3xl sm:text-4xl font-bold',
    h3: 'text-2xl sm:text-3xl font-bold',
    h4: 'text-xl font-bold',
  },
  body: {
    lg: 'text-lg',
    base: 'text-base',
    sm: 'text-sm',
  },
};
