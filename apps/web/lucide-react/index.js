
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
