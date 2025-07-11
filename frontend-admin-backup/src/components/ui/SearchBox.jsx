import React from 'react';

const SearchBox = ({ 
  value,
  onChange,
  placeholder = 'Buscar...',
  onClear,
  showClear = true,
  icon = true,
  className = ''
}) => {
  const handleClear = () => {
    if (onClear) {
      onClear();
    } else {
      onChange({ target: { value: '' } });
    }
  };

  return (
    <div className={`relative ${className}`}>
      {icon && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      )}
      
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full ${icon ? 'pl-10' : 'pl-3'} pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
      />
      
      {showClear && value && (
        <button
          onClick={handleClear}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default SearchBox;
