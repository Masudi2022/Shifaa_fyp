import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Medicine.css'; // Ensure this path is correct

function Medicine() {
  const [searchTerm, setSearchTerm] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [medicines, setMedicines] = useState([]);
  const navigate = useNavigate();

  // Fetch the medicines data from the backend
  useEffect(() => {
    axios.get('http://127.0.0.1:8000/api/medicine/')
      .then(response => {
        setMedicines(response.data);
      })
      .catch(error => {
        console.error('There was an error fetching the data!', error);
      });
  }, []);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value.toLowerCase());
    setHasSearched(event.target.value.length > 0);
  };

  // Helper function to safely access properties
  const safeLowerCase = (value) => {
    return value ? value.toLowerCase() : '';  // Return empty string if value is undefined/null
  };

  // Filter medicines based on the search term
  const filteredMedicines = medicines.filter(medicine =>
    safeLowerCase(medicine.name).includes(searchTerm) ||
    safeLowerCase(medicine.description).includes(searchTerm) ||
    (medicine.category && medicine.category.some(category =>
      safeLowerCase(category.category).includes(searchTerm) ||
      (category.disease && safeLowerCase(category.disease).includes(searchTerm))  // Now checks disease names
    ))
  );

  return (
    <div className="medicine-container">
      <input
        type="text"
        placeholder="Search for a disease, category, or medicine..."
        value={searchTerm}
        onChange={handleSearchChange}
        className="search-bar"
      />

      {hasSearched ? (
        filteredMedicines.length > 0 ? (
          filteredMedicines.map((medicine, index) => (
            <div key={index} className="medicine-item">
              <h3>{medicine.name}</h3>
              <p>{medicine.description}</p>
              {medicine.image && <img src={medicine.image} alt={medicine.name} className="medicine-image" />}
              <p>Available at: {medicine.pharmacy}</p>

              {/* Display related categories and diseases */}
              {medicine.category && medicine.category.length > 0 && (
                medicine.category.map((category, catIndex) => (
                  <div key={catIndex} className="category-item">
                    <h4>Category: {category.category}</h4>
                    <p>{category.description}</p>
                    <p>Symptoms: {category.symptoms}</p>
                    <p>Prevention: {category.prevention}</p>

                    {/* Display diseases within the category */}
                    <h5>Disease: {category.disease}</h5>
                  </div>
                ))
              )}

              {/* Link to order the medicine */}
              <Link to={`/medicine/${encodeURIComponent(medicine.name)}`}>
                Order this medicine
              </Link>
            </div>
          ))
        ) : (
          <p>No results found</p>
        )
      ) : (
        <p>Start typing to search for a medicine, category, or disease</p>
      )}

      <button className="back-button" onClick={() => navigate(-1)}>
        ← Back
      </button>
    </div>
  );
}

export default Medicine;
