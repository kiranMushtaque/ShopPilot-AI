import React from 'react';
import { Category } from '../types';
import { Smartphone, Laptop, Headphones, Watch, Plug, Monitor, LayoutGrid } from 'lucide-react';

interface CategoryBarProps {
  categories: Category[];
  selectedCategory: string | null;
  onSelectCategory: (slug: string | null) => void;
}

export const CategoryBar: React.FC<CategoryBarProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
}) => {
  const getCategoryIcon = (slug: string) => {
    switch (slug) {
      case 'smartphones':
        return <Smartphone className="w-4 h-4" />;
      case 'laptops':
        return <Laptop className="w-4 h-4" />;
      case 'earbuds-audio':
        return <Headphones className="w-4 h-4" />;
      case 'smartwatches':
        return <Watch className="w-4 h-4" />;
      case 'accessories':
        return <Plug className="w-4 h-4" />;
      case 'monitors-peripherals':
        return <Monitor className="w-4 h-4" />;
      default:
        return <LayoutGrid className="w-4 h-4" />;
    }
  };

  return (
    <div id="category-bar-section" className="bg-neutral-950 border-b border-neutral-800/80 py-3 overflow-x-auto scrollbar-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2">
        <button
          onClick={() => onSelectCategory(null)}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
            selectedCategory === null
              ? 'bg-emerald-500 text-neutral-950 shadow-md shadow-emerald-500/20'
              : 'bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800 border border-neutral-800'
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span>All Categories</span>
        </button>

        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.slug)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === cat.slug
                ? 'bg-emerald-500 text-neutral-950 shadow-md shadow-emerald-500/20'
                : 'bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800 border border-neutral-800'
            }`}
          >
            {getCategoryIcon(cat.slug)}
            <span>{cat.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
