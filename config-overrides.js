const path = require('path');

module.exports = function override(config, env) {
  // Optimize for production builds
  if (env === 'production') {
    // Reduce bundle size
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            maxSize: 244000,
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            maxSize: 244000,
          }
        }
      }
    };

    // Disable source maps in production to save memory
    config.devtool = false;
  }

  // Memory optimization for development
  if (env === 'development') {
    config.optimization = {
      ...config.optimization,
      removeAvailableModules: false,
      removeEmptyChunks: false,
      splitChunks: false,
    };
  }

  return config;
};