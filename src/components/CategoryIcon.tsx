import React from 'react';
import {
  Home,
  Car,
  Users,
  ShoppingBag,
  Wallet,
  Package,
  MapPin,
  FileText,
  Tag,
  Folder,
  Sparkles,
  LucideProps,
} from 'lucide-react';

interface CategoryIconProps extends LucideProps {
  name: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ name, ...props }) => {
  switch (name.toLowerCase()) {
    case 'home':
      return <Home {...props} />;
    case 'car':
      return <Car {...props} />;
    case 'users':
    case 'family':
      return <Users {...props} />;
    case 'shoppingbag':
    case 'shopping':
      return <ShoppingBag {...props} />;
    case 'wallet':
    case 'money':
      return <Wallet {...props} />;
    case 'package':
    case 'storage':
    case 'box':
      return <Package {...props} />;
    case 'mappin':
    case 'places':
    case 'location':
      return <MapPin {...props} />;
    case 'filetext':
    case 'other':
    case 'notes':
      return <FileText {...props} />;
    case 'sparkles':
      return <Sparkles {...props} />;
    default:
      return <Tag {...props} />;
  }
};
