import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup, useMap, CircleMarker } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './pharmacy.css';

// Custom pharmacy icon
const customPharmacyIconUrl = 'https://cdn-icons-png.flaticon.com/512/1673/1673188.png'; 

const customPharmacyIcon = L.icon({
    iconUrl: customPharmacyIconUrl,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png',
    shadowSize: [41, 41],
});

// Tanzania bounds
const tanzaniaBounds = [
    [-11.5, 29.0], // Southwest coordinates
    [-1.0, 41.0]   // Northeast coordinates
];

function Location() {
    const [searchTerm, setSearchTerm] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [filteredPharmacies, setFilteredPharmacies] = useState([]);
    const [center, setCenter] = useState([-6.37, 34.89]); // Center of Tanzania
    const [zoom, setZoom] = useState(7); // Adjusted zoom level
    const [highlightedPosition, setHighlightedPosition] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchPharmacies = async () => {
            try {
                const response = await axios.get('http://127.0.0.1:8000/api/pharmacies/');
                setFilteredPharmacies(response.data);
                setIsLoading(false);
            } catch (err) {
                console.error('Error fetching pharmacies:', err);
                setError('Failed to load pharmacy data. Please try again later.');
                setIsLoading(false);
            }
        };

        fetchPharmacies();
    }, []);

    const SetBounds = () => {
        const map = useMap();
        useEffect(() => {
            map.setMaxBounds(tanzaniaBounds);
            map.on('drag', function() {
                map.panInsideBounds(tanzaniaBounds, { animate: false });
            });
        }, [map]);
        return null;
    };

    const handleSearchChange = (e) => {
        const term = e.target.value;
        setSearchTerm(term);

        if (term) {
            const filtered = filteredPharmacies.filter(
                pharmacy =>
                    pharmacy.name.toLowerCase().includes(term.toLowerCase()) ||
                    pharmacy.region.toLowerCase().includes(term.toLowerCase())
            );
            setSuggestions(filtered);
        } else {
            setSuggestions([]);
        }
    };

    const handleSearch = () => {
        if (searchTerm) {
            const filtered = filteredPharmacies.filter(
                pharmacy =>
                    pharmacy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    pharmacy.region.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredPharmacies(filtered);
        } else {
            axios.get('http://127.0.0.1:8000/api/pharmacies/')
                .then(response => {
                    setFilteredPharmacies(response.data);
                })
                .catch(error => {
                    console.error('Error resetting pharmacies:', error);
                });
        }
    };

    const handleSelectSuggestion = (pharmacy) => {
        setCenter([pharmacy.latitude, pharmacy.longitude]);
        setZoom(15);
        setHighlightedPosition([pharmacy.latitude, pharmacy.longitude]);
        setSuggestions([]);
        setSearchTerm(pharmacy.name);
    };

    const handleViewDetails = (pharmacy) => {
        navigate('/pharmacy-and-hospital', { state: { pharmacy } });
    };

    const ChangeMapView = ({ center, zoom }) => {
        const map = useMap();
        useEffect(() => {
            if (center && zoom) {
                map.setView(center, zoom);
            }
        }, [center, zoom, map]);
        return null;
    };

    return (
        <div className="full-page-container">
            <div className={`search-overlay ${isSearchFocused ? 'search-focused' : ''}`}>
                <div className="search-container">
                    <div className="header-section">
                        <h1 className="pharmacy-locator-title">Find Pharmacies in Tanzania</h1>
                        <p className="pharmacy-locator-subtitle">Search pharmacies in Tanzania mainland or Zanzibar</p>
                    </div>
                    
                    <div className="search-input-container">
                        <input
                            type="text"
                            placeholder="Search by region or pharmacy name..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                            onFocus={() => setIsSearchFocused(true)}
                            onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                            className="search-input"
                        />
                        <button onClick={handleSearch} className="search-button">
                            <i className="fas fa-search"></i> Search
                        </button>
                    </div>
                    
                    {suggestions.length > 0 && (
                        <ul className="suggestions-dropdown">
                            {suggestions.map((pharmacy, index) => (
                                <li 
                                    key={index} 
                                    onClick={() => handleSelectSuggestion(pharmacy)}
                                    className="suggestion-item"
                                >
                                    <div className="pharmacy-icon">
                                        <i className="fas fa-clinic-medical"></i>
                                    </div>
                                    <div className="pharmacy-info">
                                        <div className="pharmacy-suggestion-name">{pharmacy.name}</div>
                                        <div className="pharmacy-suggestion-region">
                                            <i className="fas fa-map-marker-alt"></i> {pharmacy.region}
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            <div className="full-page-map">
                {isLoading ? (
                    <div className="loading-spinner">
                        <div className="spinner"></div>
                        <p>Loading pharmacies...</p>
                    </div>
                ) : error ? (
                    <div className="error-message">
                        <i className="fas fa-exclamation-triangle error-icon"></i>
                        <p>{error}</p>
                        <button onClick={() => window.location.reload()} className="retry-button">
                            <i className="fas fa-sync-alt"></i> Retry
                        </button>
                    </div>
                ) : (
                    <MapContainer 
                        center={center} 
                        zoom={zoom} 
                        className="pharmacy-map" 
                        style={{ height: '100vh', width: '100vw' }}
                        minZoom={6}
                        maxBounds={tanzaniaBounds}
                        maxBoundsViscosity={1.0}
                    >
                        <ChangeMapView center={center} zoom={zoom} />
                        <SetBounds />
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        />
                        {filteredPharmacies.map((pharmacy, index) => (
                            <Marker 
                                key={index} 
                                position={[pharmacy.latitude, pharmacy.longitude]} 
                                icon={customPharmacyIcon}
                                eventHandlers={{
                                    click: () => {
                                        setCenter([pharmacy.latitude, pharmacy.longitude]);
                                        setHighlightedPosition([pharmacy.latitude, pharmacy.longitude]);
                                    },
                                }}
                            >
                                <Popup className="pharmacy-popup">
                                    <div className="popup-content">
                                        <h3>{pharmacy.name}</h3>
                                        <p><i className="fas fa-map-marker-alt"></i> {pharmacy.address}</p>
                                        <p><i className="fas fa-phone"></i> {pharmacy.phone || 'Not available'}</p>
                                        <button 
                                            onClick={() => handleViewDetails(pharmacy)}
                                            className="view-details-button"
                                        >
                                            <i className="fas fa-info-circle"></i> View Details
                                        </button>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                        {highlightedPosition && (
                            <CircleMarker
                                center={highlightedPosition}
                                radius={10}
                                color="#4a90e2"
                                fillColor="#4a90e2"
                                fillOpacity={0.5}
                                weight={2}
                            />
                        )}
                    </MapContainer>
                )}
            </div>
        </div>
    );
}

export default Location;