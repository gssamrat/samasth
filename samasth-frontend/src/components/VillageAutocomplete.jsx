import React, { useState, useEffect, useRef } from 'react';
import { entityAPI } from '../services/api';

const VillageAutocomplete = ({ value, onChange, placeholder = "Enter village name", className = "", onKeyPress, autoFocus = false }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState(value || '');
  const [userTypedValue, setUserTypedValue] = useState(value || ''); // Track what user actually typed
  const [isAutoFilled, setIsAutoFilled] = useState(false); // Track if current value is auto-filled
  
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const timeoutRef = useRef(null);

  // Update input value when prop changes
  useEffect(() => {
    setInputValue(value || '');
    setUserTypedValue(value || '');
    setIsAutoFilled(false);
  }, [value]);

  // Debounced API call
  const fetchVillages = async (query) => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setLoading(true);
    try {
      const response = await entityAPI.fetchVillage(query);
      // Handle different response formats
      let villages = [];
      if (Array.isArray(response)) {
        villages = response;
      } else if (response.data && Array.isArray(response.data)) {
        villages = response.data;
      } else if (response.villages && Array.isArray(response.villages)) {
        villages = response.villages;
      }
      
      // Normalize to string array if objects
      const normalizedVillages = villages.map(village => 
        typeof village === 'string' ? village : village.name || village.village_name || village.toString()
      );
      
      setSuggestions(normalizedVillages);
      setIsOpen(normalizedVillages.length > 0);
      
      // Auto-fill with first match if available
      if (normalizedVillages.length > 0) {
        const firstMatch = normalizedVillages[0];
        if (firstMatch.toLowerCase().startsWith(query.toLowerCase())) {
          setInputValue(firstMatch);
          onChange(firstMatch);
          setIsAutoFilled(true);
          
          // Set cursor position and select the auto-filled portion
          setTimeout(() => {
            if (inputRef.current) {
              inputRef.current.focus();
              inputRef.current.setSelectionRange(query.length, firstMatch.length);
            }
          }, 10); // Small delay to ensure DOM is updated
        }
      }
    } catch (error) {
      console.error('Error fetching villages:', error);
      setSuggestions([]);
      setIsOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    const selectionStart = e.target.selectionStart;
    const selectionEnd = e.target.selectionEnd;
    
    // If user was typing over selected auto-filled text
    if (isAutoFilled && selectionEnd > userTypedValue.length) {
      // User is replacing the auto-filled portion with new text
      const newTypedPortion = newValue;
      setInputValue(newTypedPortion);
      setUserTypedValue(newTypedPortion);
      setIsAutoFilled(false);
      onChange(newTypedPortion);
      
      // Clear existing timeout and set new one
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        fetchVillages(newTypedPortion);
      }, 300);
      return;
    }
    
    // Normal typing or deleting behavior
    const isTyping = newValue.length > inputValue.length;
    const isDeleting = newValue.length < inputValue.length;
    
    if (isAutoFilled && isDeleting) {
      // If deleting on auto-filled text, revert to user typed portion
      if (newValue.length <= userTypedValue.length) {
        setInputValue(newValue);
        setUserTypedValue(newValue);
        setIsAutoFilled(false);
        onChange(newValue);
      }
    } else {
      // Normal input handling
      setInputValue(newValue);
      setUserTypedValue(newValue);
      setIsAutoFilled(false);
      onChange(newValue);
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for debounced API call
    timeoutRef.current = setTimeout(() => {
      fetchVillages(newValue);
    }, 300);
  };

  const handleSuggestionClick = (suggestion) => {
    setInputValue(suggestion);
    setUserTypedValue(suggestion);
    setIsAutoFilled(false);
    onChange(suggestion);
    setIsOpen(false);
    setSuggestions([]);
  };

  const handleInputFocus = () => {
    if (inputValue.length >= 2 && suggestions.length > 0) {
      setIsOpen(true);
    }
  };

  const handleInputBlur = () => {
    // Delay closing to allow click on suggestions
    setTimeout(() => {
      setIsOpen(false);
    }, 200);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    } else if ((e.key === 'Tab' || e.key === 'Enter') && isAutoFilled) {
      // Accept the auto-filled value
      setUserTypedValue(inputValue);
      setIsAutoFilled(false);
      setIsOpen(false);
      
      if (e.key === 'Enter') {
        e.preventDefault(); // Prevent form submission
        // Call external onKeyPress handler if provided
        if (onKeyPress) {
          onKeyPress(e);
        }
      }
    } else if (e.key === 'Enter' && !isAutoFilled) {
      // Handle Enter key when not auto-filled
      if (onKeyPress) {
        onKeyPress(e);
      }
    } else if (e.key === 'Backspace' && isAutoFilled) {
      // If backspace is pressed on auto-filled text, revert to user typed value
      const selectionStart = e.target.selectionStart;
      const selectionEnd = e.target.selectionEnd;
      
      if (selectionEnd > userTypedValue.length) {
        // User is pressing backspace with auto-filled text selected
        e.preventDefault();
        setInputValue(userTypedValue);
        onChange(userTypedValue);
        setIsAutoFilled(false);
        
        // Set cursor to end of user typed text
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.setSelectionRange(userTypedValue.length, userTypedValue.length);
          }
        }, 0);
      }
    }
  };

  // Maintain selection for auto-filled text
  useEffect(() => {
    if (isAutoFilled && inputRef.current) {
      const userLength = userTypedValue.length;
      const totalLength = inputValue.length;
      if (userLength < totalLength) {
        // Ensure the auto-filled portion stays selected
        setTimeout(() => {
          if (inputRef.current && document.activeElement === inputRef.current) {
            inputRef.current.setSelectionRange(userLength, totalLength);
          }
        }, 0);
      }
    }
  }, [isAutoFilled, userTypedValue, inputValue]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-400 ${className}`}
        autoFocus={autoFocus}
        style={{
          // Enhance selection visibility
          '::selection': {
            backgroundColor: '#3b82f6',
            color: 'white'
          }
        }}
        autoComplete="off"
      />
      
      {loading && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
        </div>
      )}

      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => {
            const isAutoFilledSuggestion = isAutoFilled && suggestion === inputValue;
            return (
              <div
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className={`px-4 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 text-sm ${
                  isAutoFilledSuggestion ? 'bg-blue-100 text-blue-800 font-medium' : ''
                }`}
              >
                {suggestion}
              </div>
            );
          })}
        </div>
      )}
      
      {isOpen && !loading && suggestions.length === 0 && inputValue.length >= 2 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
          <div className="px-4 py-2 text-sm text-gray-500">
            No villages found for "{inputValue}"
          </div>
        </div>
      )}
    </div>
  );
};

export default VillageAutocomplete;
