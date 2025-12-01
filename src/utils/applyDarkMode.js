// Comprehensive Dark Mode Application Script
// This utility helps apply dark mode classes consistently across components

export const darkModeReplacements = {
  // Background replacements
  'bg-white': (isDark) => isDark ? 'bg-gray-800' : 'bg-white',
  'bg-gray-50': (isDark) => isDark ? 'bg-gray-900' : 'bg-gray-50',
  'bg-gray-100': (isDark) => isDark ? 'bg-gray-800' : 'bg-gray-100',
  'bg-slate-50': (isDark) => isDark ? 'bg-gray-900' : 'bg-slate-50',
  
  // Text replacements
  'text-gray-900': (isDark) => isDark ? 'text-white' : 'text-gray-900',
  'text-gray-800': (isDark) => isDark ? 'text-gray-200' : 'text-gray-800',
  'text-gray-700': (isDark) => isDark ? 'text-gray-300' : 'text-gray-700',
  'text-gray-600': (isDark) => isDark ? 'text-gray-400' : 'text-gray-600',
  'text-slate-900': (isDark) => isDark ? 'text-white' : 'text-slate-900',
  'text-slate-800': (isDark) => isDark ? 'text-gray-200' : 'text-slate-800',
  'text-slate-700': (isDark) => isDark ? 'text-gray-300' : 'text-slate-700',
  'text-slate-600': (isDark) => isDark ? 'text-gray-400' : 'text-slate-600',
  'text-slate-500': (isDark) => isDark ? 'text-gray-500' : 'text-slate-500',
  
  // Border replacements
  'border-gray-200': (isDark) => isDark ? 'border-gray-700' : 'border-gray-200',
  'border-gray-300': (isDark) => isDark ? 'border-gray-600' : 'border-gray-300',
  'border-slate-200': (isDark) => isDark ? 'border-gray-700' : 'border-slate-200',
  'border-slate-100': (isDark) => isDark ? 'border-gray-700' : 'border-slate-100',
  
  // Card and container replacements
  'bg-white/70': (isDark) => isDark ? 'bg-gray-800/70' : 'bg-white/70',
  'border-white/50': (isDark) => isDark ? 'border-gray-700/50' : 'border-white/50',
};

export const applyDarkModeToComponent = (componentName, isDark) => {
  // Common patterns for different component types
  const patterns = {
    container: isDark ? 'bg-gray-900' : 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50',
    card: isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200',
    cardTransparent: isDark ? 'bg-gray-800/70 border-gray-700/50' : 'bg-white/70 border-white/50',
    textPrimary: isDark ? 'text-white' : 'text-gray-900',
    textSecondary: isDark ? 'text-gray-300' : 'text-gray-600',
    textTertiary: isDark ? 'text-gray-400' : 'text-gray-500',
    inputBg: isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900',
    headerTitle: isDark ? 'text-white' : 'bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent',
  };
  
  return patterns;
};

// Quick fix function for common component structures
export const getQuickDarkModeClasses = (isDark) => ({
  // Main containers
  mainContainer: isDark ? 'min-h-screen bg-gray-900' : 'min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50',
  
  // Cards
  card: isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200',
  cardTransparent: isDark ? 'bg-gray-800/70 border-gray-700/50' : 'bg-white/70 border-white/50',
  
  // Text
  titleText: isDark ? 'text-white' : 'bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent',
  primaryText: isDark ? 'text-white' : 'text-gray-900',
  secondaryText: isDark ? 'text-gray-300' : 'text-gray-600',
  tertiaryText: isDark ? 'text-gray-400' : 'text-gray-500',
  
  // Inputs
  input: isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900',
  
  // Loading states
  loadingContainer: isDark ? 'bg-gray-900' : 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50',
  loadingText: isDark ? 'text-gray-300' : 'text-slate-600',
  
  // Error states
  errorBg: isDark ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200',
  errorTitle: isDark ? 'text-red-400' : 'text-red-800',
  errorText: isDark ? 'text-red-300' : 'text-red-700',
  
  // Tables
  tableHeader: isDark ? 'bg-gray-800/50' : 'bg-slate-50/50',
  tableRow: isDark ? 'bg-gray-800/30 hover:bg-gray-700/50' : 'bg-white/30 hover:bg-white/50',
  tableBorder: isDark ? 'divide-gray-700' : 'divide-slate-200',
});