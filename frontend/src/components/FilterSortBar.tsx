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
  const [showFilters, setShowFilters] = useState(false);
  
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
  
  const clearFilters = () => {
    setSelectedTags([]);
    onFilterChange([]);
  };
  
  return (
    <div className="mb-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
        <div className="flex items-center space-x-2 mb-2 sm:mb-0">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
          
          {selectedTags.length > 0 && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Clear Filters ({selectedTags.length})
            </button>
          )}
        </div>
        
        <div className="w-full sm:w-auto">
          <select
            id="sort-by"
            name="sort-by"
            value={sortBy}
            onChange={handleSortChange}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="dateAccessed">Date (Newest First)</option>
            <option value="dateAccessed_asc">Date (Oldest First)</option>
            <option value="pageTitle">Title (A-Z)</option>
            <option value="pageTitle_desc">Title (Z-A)</option>
          </select>
        </div>
      </div>
      
      {showFilters && (
        <div className="bg-white shadow px-4 py-4 sm:rounded-lg mb-4">
          <h3 className="text-sm font-medium leading-6 text-gray-900 mb-3">Filter by Tags</h3>
          <div className="flex flex-wrap gap-2">
            {availableTags.map(tag => (
              <button
                key={tag}
                onClick={() => handleTagToggle(tag)}
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
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
      )}
    </div>
  );
} 