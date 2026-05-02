import React, { useState } from 'react';

const Dashboard = () => {
  const [showBaseSuggestions, setShowBaseSuggestions] = useState(false);
  const [baseSuggestions, setBaseSuggestions] = useState([]);

  const handleSuggestionsArrival = (suggestions) => {
    if (suggestions.length) {
      setBaseSuggestions(suggestions);
      setShowBaseSuggestions(true);
    } else {
      setShowBaseSuggestions(false);
    }
  };

  const fetchNeighborhoods = async () => {
    try {
      const response = await fetch('your-api-endpoint');
      const data = await response.json();
      handleSuggestionsArrival(data.suggestions);
    } catch (error) {
      setBaseSuggestions([]);
      setShowBaseSuggestions(false);
    }
  };

  const handleFocus = () => {
    setShowBaseSuggestions(true);
  };

  const handleBlur = (event) => {
    const relatedTarget = event.relatedTarget;
    if (!relatedTarget || !relatedTarget.closest('.suggestions-container')) {
      setShowBaseSuggestions(false);
    }
  };

  return (
    <div className="dashboard">
      <input type="text" onFocus={handleFocus} onBlur={handleBlur} onChange={fetchNeighborhoods} />
      {showBaseSuggestions && (
        <div className="suggestions-container" onMouseDown={(e) => e.preventDefault()}>
          {baseSuggestions.map((suggestion, index) => (
            <div key={index} className="suggestion">
              {suggestion}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
