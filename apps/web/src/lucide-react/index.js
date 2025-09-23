'use strict';

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
export const ArrowUpIcon = createIcon('ArrowUpIcon');
export const ArrowDownIcon = createIcon('ArrowDownIcon');
export const UsersIcon = createIcon('UsersIcon');
export const BanknoteIcon = createIcon('BanknoteIcon');
export const CreditCardIcon = createIcon('CreditCardIcon');
export const ClockIcon = createIcon('ClockIcon');
export const ChevronDownIcon = createIcon('ChevronDownIcon');
export const ChevronUpIcon = createIcon('ChevronUpIcon');
export const ChevronsUpDown = createIcon('ChevronsUpDown');
export const HomeIcon = createIcon('HomeIcon');
export const SettingsIcon = createIcon('SettingsIcon');
export const UserIcon = createIcon('UserIcon');
export const LogOutIcon = createIcon('LogOutIcon');
export const MenuIcon = createIcon('MenuIcon');
export const SearchIcon = createIcon('SearchIcon');
export const BellIcon = createIcon('BellIcon');
export const MessageSquareIcon = createIcon('MessageSquareIcon');
export const FileIcon = createIcon('FileIcon');
export const FolderIcon = createIcon('FolderIcon');
export const PlusIcon = createIcon('PlusIcon');
export const CheckIcon = createIcon('CheckIcon');
export const XIcon = createIcon('XIcon');
export const ChevronLeftIcon = createIcon('ChevronLeftIcon');
export const ChevronRightIcon = createIcon('ChevronRightIcon');
export const CalendarIcon = createIcon('CalendarIcon');
export const StarIcon = createIcon('StarIcon');
export const HeartIcon = createIcon('HeartIcon');
export const EyeIcon = createIcon('EyeIcon');
export const EyeOffIcon = createIcon('EyeOffIcon');
export const TrashIcon = createIcon('TrashIcon');
export const EditIcon = createIcon('EditIcon');
export const SaveIcon = createIcon('SaveIcon');
export const DownloadIcon = createIcon('DownloadIcon');
export const UploadIcon = createIcon('UploadIcon');
export const RefreshIcon = createIcon('RefreshIcon');
export const LogInIcon = createIcon('LogInIcon');
export const MailIcon = createIcon('MailIcon');
export const PhoneIcon = createIcon('PhoneIcon');
export const LockIcon = createIcon('LockIcon');
export const UnlockIcon = createIcon('UnlockIcon');
export const LinkIcon = createIcon('LinkIcon');
export const ImageIcon = createIcon('ImageIcon');
export const CameraIcon = createIcon('CameraIcon');
export const VideoIcon = createIcon('VideoIcon');
export const MicIcon = createIcon('MicIcon');
export const MusicIcon = createIcon('MusicIcon');
export const VolumeIcon = createIcon('VolumeIcon');
export const VolumeMuteIcon = createIcon('VolumeMuteIcon');
export const PlayIcon = createIcon('PlayIcon');
export const PauseIcon = createIcon('PauseIcon');
export const StopIcon = createIcon('StopIcon');
export const FastForwardIcon = createIcon('FastForwardIcon');
export const RewindIcon = createIcon('RewindIcon');
export const ShoppingCartIcon = createIcon('ShoppingCartIcon');
export const DollarSignIcon = createIcon('DollarSignIcon');
export const PercentIcon = createIcon('PercentIcon');
export const TagIcon = createIcon('TagIcon');
export const GiftIcon = createIcon('GiftIcon');
export const MapPinIcon = createIcon('MapPinIcon');
export const MapIcon = createIcon('MapIcon');
export const GlobeIcon = createIcon('GlobeIcon');
export const CompassIcon = createIcon('CompassIcon');
export const NavigationIcon = createIcon('NavigationIcon');
export const FlagIcon = createIcon('FlagIcon');
export const BookmarkIcon = createIcon('BookmarkIcon');
export const BookIcon = createIcon('BookIcon');
export const ClipboardIcon = createIcon('ClipboardIcon');
export const ListIcon = createIcon('ListIcon');
export const CheckSquareIcon = createIcon('CheckSquareIcon');
export const SquareIcon = createIcon('SquareIcon');
export const CircleIcon = createIcon('CircleIcon');
export const TriangleIcon = createIcon('TriangleIcon');
export const OctagonIcon = createIcon('OctagonIcon');
export const HexagonIcon = createIcon('HexagonIcon');
export const PenToolIcon = createIcon('PenToolIcon');
export const TypeIcon = createIcon('TypeIcon');
export const BoldIcon = createIcon('BoldIcon');
export const ItalicIcon = createIcon('ItalicIcon');
export const UnderlineIcon = createIcon('UnderlineIcon');
export const AlignLeftIcon = createIcon('AlignLeftIcon');
export const AlignCenterIcon = createIcon('AlignCenterIcon');
export const AlignRightIcon = createIcon('AlignRightIcon');
export const AlignJustifyIcon = createIcon('AlignJustifyIcon');
export const CodeIcon = createIcon('CodeIcon');
export const TerminalIcon = createIcon('TerminalIcon');
export const ServerIcon = createIcon('ServerIcon');
export const DatabaseIcon = createIcon('DatabaseIcon');
export const HardDriveIcon = createIcon('HardDriveIcon');
export const WifiIcon = createIcon('WifiIcon');
export const BluetoothIcon = createIcon('BluetoothIcon');
export const BatteryIcon = createIcon('BatteryIcon');
export const MonitorIcon = createIcon('MonitorIcon');
export const SmartphoneIcon = createIcon('SmartphoneIcon');
export const TabletIcon = createIcon('TabletIcon');
export const PrinterIcon = createIcon('PrinterIcon');
export const TVIcon = createIcon('TVIcon');
export const SpeakerIcon = createIcon('SpeakerIcon');
export const RadioIcon = createIcon('RadioIcon');
export const SunIcon = createIcon('SunIcon');
export const MoonIcon = createIcon('MoonIcon');
export const CloudIcon = createIcon('CloudIcon');
export const CloudRainIcon = createIcon('CloudRainIcon');
export const CloudSnowIcon = createIcon('CloudSnowIcon');
export const CloudLightningIcon = createIcon('CloudLightningIcon');
export const WindIcon = createIcon('WindIcon');
export const UmbrellaIcon = createIcon('UmbrellaIcon');
export const ThermometerIcon = createIcon('ThermometerIcon');
export const ActivityIcon = createIcon('ActivityIcon');
export const AlertCircleIcon = createIcon('AlertCircleIcon');
export const AlertTriangleIcon = createIcon('AlertTriangleIcon');
export const InfoIcon = createIcon('InfoIcon');
export const HelpCircleIcon = createIcon('HelpCircleIcon');

// Create a default export with all icons
const LucideReact = {
  ArrowUpIcon, ArrowDownIcon, UsersIcon, BanknoteIcon, CreditCardIcon,
  ClockIcon, ChevronDownIcon, ChevronUpIcon, ChevronsUpDown,
  HomeIcon, SettingsIcon, UserIcon, LogOutIcon, MenuIcon, SearchIcon, BellIcon,
  MessageSquareIcon, FileIcon, FolderIcon, PlusIcon, CheckIcon, XIcon,
  ChevronLeftIcon, ChevronRightIcon, CalendarIcon, StarIcon, HeartIcon,
  EyeIcon, EyeOffIcon, TrashIcon, EditIcon, SaveIcon, DownloadIcon,
  UploadIcon, RefreshIcon, LogInIcon, MailIcon, PhoneIcon, LockIcon,
  UnlockIcon, LinkIcon, ImageIcon, CameraIcon, VideoIcon, MicIcon,
  MusicIcon, VolumeIcon, VolumeMuteIcon, PlayIcon, PauseIcon, StopIcon,
  FastForwardIcon, RewindIcon, ShoppingCartIcon, DollarSignIcon, PercentIcon,
  TagIcon, GiftIcon, MapPinIcon, MapIcon, GlobeIcon, CompassIcon,
  NavigationIcon, FlagIcon, BookmarkIcon, BookIcon, ClipboardIcon,
  ListIcon, CheckSquareIcon, SquareIcon, CircleIcon, TriangleIcon,
  OctagonIcon, HexagonIcon, PenToolIcon, TypeIcon, BoldIcon, ItalicIcon,
  UnderlineIcon, AlignLeftIcon, AlignCenterIcon, AlignRightIcon,
  AlignJustifyIcon, CodeIcon, TerminalIcon, ServerIcon, DatabaseIcon,
  HardDriveIcon, WifiIcon, BluetoothIcon, BatteryIcon, MonitorIcon,
  SmartphoneIcon, TabletIcon, PrinterIcon, TVIcon, SpeakerIcon,
  RadioIcon, SunIcon, MoonIcon, CloudIcon, CloudRainIcon, CloudSnowIcon,
  CloudLightningIcon, WindIcon, UmbrellaIcon, ThermometerIcon,
  ActivityIcon, AlertCircleIcon, AlertTriangleIcon, InfoIcon, HelpCircleIcon
};

// Export the default object
export default LucideReact;