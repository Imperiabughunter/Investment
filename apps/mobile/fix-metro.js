/**
 * Direct fix for Expo/Metro module resolution error
 */

const fs = require('fs');
const path = require('path');

// Path to the problematic file
const targetFilePath = path.join(
  __dirname,
  'node_modules',
  '@expo',
  'metro-config',
  'src',
  'serializer',
  'reconcileTransformSerializerPlugin.ts'
);

// Check if file exists
if (fs.existsSync(targetFilePath)) {
  console.log('Found target file, applying fix...');
  
  // Read the file content
  let content = fs.readFileSync(targetFilePath, 'utf8');
  
  // Replace the problematic import with a fallback implementation
  content = content.replace(
    `import { getReactNativeVersion } from '@expo/cli/build/src/utils/versions';`,
    `// Fixed import with fallback implementation
function getReactNativeVersion() {
  try {
    return require('@expo/cli/build/src/utils/versions').getReactNativeVersion();
  } catch (error) {
    console.log('Using fallback React Native version');
    return { major: 0, minor: 73, patch: 0 };
  }
}`
  );
  
  // Write the modified content back
  fs.writeFileSync(targetFilePath, content);
  console.log('✅ Successfully applied fix to Metro config');
  console.log('You can now run: npm run start');
} else {
  console.error('❌ Could not find the target file. Make sure you are in the correct directory.');
}