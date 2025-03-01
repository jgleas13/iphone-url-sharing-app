import { useState } from 'react';

interface FilterSortBarProps {
  availableTags: string[];
  onFilterChange: (selectedTags: string[]) => void;
  onSortChange: (sortBy: string) => void;
}

export default function FilterSortBar({
  availableTags,
  onFilterChange,
  onSortChange
}: FilterSortBarProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>('dateAccessed');
  
  const handleTagToggle = (tag: string) => {
    const newSelectedTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];
    
    setSelectedTags(newSelectedTags);
    onFilterChange(newSelectedTags);
  };
  
  const handleSortChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newSortBy = event.target.value;
    setSortBy(newSortBy);
    onSortChange(newSortBy);
  };
  
  return (
    <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
      <div className="md:grid md:grid-cols-2 md:gap-6">
        <div>
          <h3 className="text-lg font-medium leading-6 text-gray-900">Filter by Tags</h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {availableTags.map(tag => (
              <button
                key={tag}
                onClick={() => handleTagToggle(tag)}
                className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
                  selectedTags.includes(tag)
                    ? 'bg-indigo-600 text-white'
                    : 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200'
                }`}
              >
                {tag}
              </button>
            ))}
            {availableTags.length === 0 && (
              <p className="text-sm text-gray-500">No tags available</p>
            )}
          </div>
        </div>
        
        <div className="mt-5 md:mt-0">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Sort by</h3>
          <div className="mt-4">
            <select
              id="sort-by"
              name="sort-by"
              value={sortBy}
              onChange={handleSortChange}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option value="dateAccessed">Date (Newest First)</option>
              <option value="dateAccessed_asc">Date (Oldest First)</option>
              <option value="pageTitle">Title (A-Z)</option>
              <option value="pageTitle_desc">Title (Z-A)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
} 