import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { categoryInfo } from './CategoryCard';
import { subcategoryConfig } from './subcategoryConfig';

const locations = [
  'Seoul',
  'Busan',
  'Incheon',
  'Daegu',
  'Gyeonggi-do',
  'Gyeongsangnam-do'
];

export default function SearchBar({ onSearch, initialFilters = {} }) {
  const [searchTerm, setSearchTerm] = useState(initialFilters.search || '');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    category: initialFilters.category || '',
    subcategory: initialFilters.subcategory || '',
    location: initialFilters.location || '',
    minPrice: initialFilters.minPrice || '',
    maxPrice: initialFilters.maxPrice || '',
    condition: initialFilters.condition || ''
  });

  const availableSubcategories = filters.category ? subcategoryConfig[filters.category] || [] : [];

  const handleSearch = () => {
    onSearch({ search: searchTerm, ...filters });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilters({
      category: '',
      subcategory: '',
      location: '',
      minPrice: '',
      maxPrice: '',
      condition: ''
    });
    onSearch({});
  };

  const handleCategoryChange = (value) => {
    setFilters({ ...filters, category: value, subcategory: '' });
  };

  const hasActiveFilters = searchTerm || Object.values(filters).some(v => v);

  return (
    <div className="w-full">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Хайх..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={handleKeyPress}
            className="pl-12 pr-4 h-14 rounded-xl bg-white border-gray-200 text-lg focus-visible:ring-amber-500"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className={`h-14 px-4 rounded-xl border-gray-200 ${showFilters ? 'bg-amber-50 border-amber-300' : ''}`}
        >
          <SlidersHorizontal className="w-5 h-5" />
        </Button>
        <Button
          onClick={handleSearch}
          className="h-14 px-8 rounded-xl bg-amber-500 hover:bg-amber-600 text-white"
        >
          Хайх
        </Button>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4 p-4 bg-white rounded-xl border border-gray-200">
              <Select
                value={filters.category}
                onValueChange={handleCategoryChange}
              >
                <SelectTrigger className="h-12 rounded-lg">
                  <SelectValue placeholder="Ангилал" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Бүгд</SelectItem>
                  {Object.entries(categoryInfo).map(([key, info]) => (
                    <SelectItem key={key} value={key}>
                      {info.icon} {info.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {availableSubcategories.length > 0 && (
                <Select
                  value={filters.subcategory}
                  onValueChange={(value) => setFilters({ ...filters, subcategory: value })}
                >
                  <SelectTrigger className="h-12 rounded-lg">
                    <SelectValue placeholder="Дэд ангилал" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>Бүгд</SelectItem>
                    {availableSubcategories.map(sub => (
                      <SelectItem key={sub.value} value={sub.value}>{sub.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Select
                value={filters.location}
                onValueChange={(value) => setFilters({ ...filters, location: value })}
              >
                <SelectTrigger className="h-12 rounded-lg">
                  <SelectValue placeholder="Байршил" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Бүгд</SelectItem>
                  {locations.map(loc => (
                    <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                type="number"
                placeholder="Доод үнэ"
                value={filters.minPrice}
                onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                className="h-12 rounded-lg"
              />

              <Input
                type="number"
                placeholder="Дээд үнэ"
                value={filters.maxPrice}
                onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                className="h-12 rounded-lg"
              />

              <Select
                value={filters.condition}
                onValueChange={(value) => setFilters({ ...filters, condition: value })}
              >
                <SelectTrigger className="h-12 rounded-lg">
                  <SelectValue placeholder="Төлөв" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Бүгд</SelectItem>
                  <SelectItem value="new">Шинэ</SelectItem>
                  <SelectItem value="like_new">Бараг шинэ</SelectItem>
                  <SelectItem value="used">Хэрэглэсэн</SelectItem>
                  <SelectItem value="for_parts">Сэлбэгт</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {hasActiveFilters && (
              <Button
                variant="ghost"
                onClick={clearFilters}
                className="mt-2 text-gray-500 hover:text-gray-700"
              >
                <X className="w-4 h-4 mr-1" />
                Шүүлтүүр цэвэрлэх
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}