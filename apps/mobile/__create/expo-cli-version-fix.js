/**
 * Expo CLI Version Fix
 * This file provides a fallback implementation for the getReactNativeVersion function
 * to fix module resolution errors in the Metro bundler.
 */

// Export a fallback implementation of getReactNativeVersion
exports.getReactNativeVersion = function getReactNativeVersion() {
  console.log('[Expo CLI Version Fix] Using fallback React Native version');
  return { major: 0, minor: 73, patch: 4 };
};