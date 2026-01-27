import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { FiSearch, FiX } from 'react-icons/fi';
import { searchDocuments } from '../services/api';
import { colors, styles, mergeStyles } from '../styles';

function SearchBar({ onSearchResults }) {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setSearching(true);
    try {
      const response = await searchDocuments(query);
      console.log('Search response:', response.data);

      let results;
      if (response.data.results) {
        results = response.data.results;
      } else if (Array.isArray(response.data)) {
        results = response.data;
      } else {
        console.error('Unexpected response format:', response.data);
        results = [];
      }

      onSearchResults(results);
      toast.info(`🔍 Found ${results.length} result${results.length !== 1 ? 's' : ''}`);
    } catch (error) {
      console.error('Search failed:', error);
      toast.error('Search failed: ' + (error.response?.data?.detail || error.message));
      onSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    onSearchResults(null);
  };

  return (
    <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.75rem' }}>
      <div style={{ flex: 1, position: 'relative' }}>
        <FiSearch style={{
          position: 'absolute',
          left: '1rem',
          top: '50%',
          transform: 'translateY(-50%)',
          color: colors.gray[400],
          fontSize: '1.25rem',
        }} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by filename or content..."
          style={{
            ...styles.input.base,
            paddingLeft: '3rem',
          }}
          onFocus={(e) => Object.assign(e.target.style, styles.input.focus)}
          onBlur={(e) => {
            e.target.style.borderColor = colors.gray[300];
            e.target.style.boxShadow = 'none';
          }}
        />
      </div>
      <button
        type="submit"
        disabled={searching || !query.trim()}
        style={mergeStyles(
          styles.button.base,
          styles.button.primary,
          (searching || !query.trim()) ? styles.button.disabled : {}
        )}
        onMouseEnter={(e) => {
          if (!searching && query.trim()) {
            Object.assign(e.target.style, styles.button.primaryHover);
          }
        }}
        onMouseLeave={(e) => {
          if (!searching && query.trim()) {
            e.target.style.backgroundColor = colors.primary;
            e.target.style.transform = 'none';
            e.target.style.boxShadow = 'none';
          }
        }}
      >
        <FiSearch />
        {searching ? 'Searching...' : 'Search'}
      </button>
      {query && (
        <button
          type="button"
          onClick={handleClear}
          style={mergeStyles(styles.button.base, styles.button.secondary)}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = colors.gray[600];
            e.target.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = colors.gray[500];
            e.target.style.transform = 'none';
          }}
        >
          <FiX />
          Clear
        </button>
      )}
    </form>
  );
}

export default SearchBar;