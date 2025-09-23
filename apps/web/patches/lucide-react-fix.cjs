// This file creates a mock lucide-react module in the apps/web directory
const fs = require('fs');
const path = require('path');

function patchLucideReact() {
  try {
    // Create the lucide-react directory in the apps/web directory
    const webDir = path.resolve(__dirname, '..');
    const lucideDir = path.join(webDir, 'lucide-react');
    
    // Clean up any existing files or directories
    if (fs.existsSync(lucideDir)) {
      if (fs.statSync(lucideDir).isDirectory()) {
        try {
          fs.rmdirSync(lucideDir, { recursive: true });
          console.log('[lucide-react-patch] Removed existing directory');
        } catch (err) {
          console.log('[lucide-react-patch] Could not remove directory:', err.message);
        }
      } else {
        // If it's a file, remove it
        fs.unlinkSync(lucideDir);
        console.log('[lucide-react-patch] Removed existing file');
      }
    }
    
    // Create the directory
    fs.mkdirSync(lucideDir, { recursive: true });
    console.log('[lucide-react-patch] Created lucide-react directory');
    
    // Create the index.js file inside the directory
    const indexContent = `
'use strict';

Object.defineProperty(exports, "__esModule", { value: true });

// Simple mock implementation of lucide-react icons
const createIcon = (name) => {
  const Icon = (props) => ({
    $$typeof: Symbol.for('react.element'),
    type: 'svg',
    props: {
      xmlns: 'http://www.w3.org/2000/svg',
      width: props.size || 24,
      height: props.size || 24,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: props.color || 'currentColor',
      strokeWidth: 2,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      ...props
    }
  });
  Icon.displayName = name;
  return Icon;
};

// Create all required icons
const ArrowUpIcon = createIcon('ArrowUpIcon');
const ArrowDownIcon = createIcon('ArrowDownIcon');
const UsersIcon = createIcon('UsersIcon');
const BanknoteIcon = createIcon('BanknoteIcon');
const CreditCardIcon = createIcon('CreditCardIcon');
const ClockIcon = createIcon('ClockIcon');
const ChevronDownIcon = createIcon('ChevronDownIcon');
const ChevronUpIcon = createIcon('ChevronUpIcon');
const ChevronsUpDown = createIcon('ChevronsUpDown');
const HomeIcon = createIcon('HomeIcon');
const SettingsIcon = createIcon('SettingsIcon');
const UserIcon = createIcon('UserIcon');
const LogOutIcon = createIcon('LogOutIcon');
const MenuIcon = createIcon('MenuIcon');
const SearchIcon = createIcon('SearchIcon');
const BellIcon = createIcon('BellIcon');

// Export all icons
exports.ArrowUpIcon = ArrowUpIcon;
exports.ArrowDownIcon = ArrowDownIcon;
exports.UsersIcon = UsersIcon;
exports.BanknoteIcon = BanknoteIcon;
exports.CreditCardIcon = CreditCardIcon;
exports.ClockIcon = ClockIcon;
exports.ChevronDownIcon = ChevronDownIcon;
exports.ChevronUpIcon = ChevronUpIcon;
exports.ChevronsUpDown = ChevronsUpDown;
exports.HomeIcon = HomeIcon;
exports.SettingsIcon = SettingsIcon;
exports.UserIcon = UserIcon;
exports.LogOutIcon = LogOutIcon;
exports.MenuIcon = MenuIcon;
exports.SearchIcon = SearchIcon;
exports.BellIcon = BellIcon;

// Also export as default
exports.default = {
  ArrowUpIcon, ArrowDownIcon, UsersIcon, BanknoteIcon, CreditCardIcon,
  ClockIcon, ChevronDownIcon, ChevronUpIcon, ChevronsUpDown,
  HomeIcon, SettingsIcon, UserIcon, LogOutIcon, MenuIcon, SearchIcon, BellIcon
};
`;

    fs.writeFileSync(path.join(lucideDir, 'index.js'), indexContent);
    console.log('[lucide-react-patch] Created index.js file in lucide-react directory');
    
    return true;
  } catch (e) {
    console.error('[lucide-react-patch] Error:', e.message);
    return false;
  }
}

// Run the patch when script is executed directly
if (require.main === module) {
  patchLucideReact();
}

// Export for programmatic use
module.exports = patchLucideReact;