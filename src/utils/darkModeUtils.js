// Dark Mode Utility Functions
export const getDarkModeClasses = (isDark) => ({
  // Background classes
  bgPrimary: isDark ? 'bg-gray-900' : 'bg-white',
  bgSecondary: isDark ? 'bg-gray-800' : 'bg-gray-50',
  bgTertiary: isDark ? 'bg-gray-700' : 'bg-gray-100',
  
  // Text classes
  textPrimary: isDark ? 'text-white' : 'text-gray-900',
  textSecondary: isDark ? 'text-gray-300' : 'text-gray-600',
  textTertiary: isDark ? 'text-gray-400' : 'text-gray-500',
  
  // Border classes
  borderPrimary: isDark ? 'border-gray-700' : 'border-gray-200',
  borderSecondary: isDark ? 'border-gray-600' : 'border-gray-300',
  
  // Card classes
  cardBg: isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200',
  cardHover: isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50',
  
  // Input classes
  inputBg: isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900',
  inputFocus: isDark ? 'focus:border-blue-400 focus:ring-blue-400' : 'focus:border-blue-500 focus:ring-blue-500',
  
  // Container classes
  containerBg: isDark ? 'bg-gray-900' : 'bg-gray-50',
  gradientBg: isDark ? 'bg-gray-900' : 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50',
});

export const getThemeColors = (currentTheme, colorSchemes) => {
  const scheme = colorSchemes?.[currentTheme] || colorSchemes?.blue || {
    primary: '#3b82f6',
    secondary: '#1d4ed8',
    accent: '#60a5fa',
    hover: '#2563eb',
    light: '#dbeafe',
    gradient: 'from-blue-500 to-blue-600',
  };
  return scheme;
};

export const applyDarkMode = (baseClasses, isDark, darkClasses, lightClasses = '') => {
  return `${baseClasses} ${isDark ? darkClasses : lightClasses}`;
};