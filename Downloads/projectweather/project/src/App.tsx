import React, { useState, useEffect, useRef } from 'react';
import { Search, Wind, Droplets, Thermometer } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { WeatherData, ForecastData, GeocodingResult } from './types';

// Custom marker icon
const customIcon = new Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  shadowSize: [41, 41]
});

// Map recenter component
function RecenterMap({ coords }: { coords: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(coords, 10);
  }, [coords, map]);
  return null;
}

function App() {
  const [city, setCity] = useState('London');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<GeocodingResult[]>([]);
  const [coordinates, setCoordinates] = useState<[number, number]>([51.5074, -0.1278]); // London coordinates
  const searchRef = useRef<HTMLDivElement>(null);
  const searchTimeout = useRef<NodeJS.Timeout>();

  const API_KEY = '5244e93659f399eab07325b1e1fc8856';
  const API_URL = 'https://api.openweathermap.org/data/2.5';
  const GEO_URL = 'https://api.openweathermap.org/geo/1.0';

  useEffect(() => {
    fetchWeather();
    
    // Click outside handler to close suggestions
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    // Clear previous timeout
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    if (city.length < 2) {
      setSuggestions([]);
      return;
    }

    // Debounce the API call
    searchTimeout.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `${GEO_URL}/direct?q=${city}&limit=5&appid=${API_KEY}`
        );
        if (!response.ok) throw new Error('Failed to fetch suggestions');
        const data: GeocodingResult[] = await response.json();
        setSuggestions(data);
      } catch (err) {
        console.error('Error fetching suggestions:', err);
        setSuggestions([]);
      }
    }, 300);

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [city]);

  const fetchWeather = async (lat?: number, lon?: number) => {
    try {
      setLoading(true);
      setError('');

      const [weatherRes, forecastRes] = await Promise.all([
        fetch(
          lat && lon
            ? `${API_URL}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
            : `${API_URL}/weather?q=${city}&units=metric&appid=${API_KEY}`
        ),
        fetch(
          lat && lon
            ? `${API_URL}/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
            : `${API_URL}/forecast?q=${city}&units=metric&appid=${API_KEY}`
        )
      ]);

      if (!weatherRes.ok || !forecastRes.ok) {
        throw new Error('City not found');
      }

      const weatherData = await weatherRes.json();
      const forecastData = await forecastRes.json();

      setWeather(weatherData);
      setForecast(forecastData);
      setCoordinates([weatherData.coord.lat, weatherData.coord.lon]);
    } catch (err) {
      setError('Failed to fetch weather data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    fetchWeather();
  };

  const handleSuggestionClick = (suggestion: GeocodingResult) => {
    setCity(`${suggestion.name}${suggestion.state ? `, ${suggestion.state}` : ''}, ${suggestion.country}`);
    setShowSuggestions(false);
    fetchWeather(suggestion.lat, suggestion.lon);
  };

  const getWeatherIcon = (icon: string) => 
    `https://openweathermap.org/img/wn/${icon}@2x.png`;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 to-blue-600 p-4">
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="mb-8">
          <div ref={searchRef} className="relative">
            <input
              type="text"
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Enter city name..."
              className="w-full px-4 py-3 rounded-lg bg-white/20 backdrop-blur-md text-white placeholder-white/70 outline-none"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <Search className="text-white" size={20} />
            </button>

            {/* Suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute w-full mt-1 bg-white/95 backdrop-blur-md rounded-lg shadow-lg overflow-hidden z-10">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={`${suggestion.lat}-${suggestion.lon}`}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="px-4 py-2 cursor-pointer hover:bg-blue-100 transition-colors"
                  >
                    <div className="font-medium">{suggestion.name}</div>
                    <div className="text-sm text-gray-600">
                      {suggestion.state && `${suggestion.state}, `}{suggestion.country}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>

        {error && (
          <div className="bg-red-500/20 backdrop-blur-md text-white p-4 rounded-lg mb-8">
            {error}
          </div>
        )}

        {weather && (
          <div className="grid gap-8 md:grid-cols-2">
            <div className="bg-white/20 backdrop-blur-md rounded-lg p-6 text-white">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold">{weather.name}</h2>
                <img
                  src={getWeatherIcon(weather.weather[0].icon)}
                  alt={weather.weather[0].description}
                  className="w-20 h-20"
                />
              </div>
              <div className="text-6xl font-bold mb-8">
                {Math.round(weather.main.temp)}°C
              </div>
              <div className="text-xl capitalize mb-4">
                {weather.weather[0].description}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Thermometer size={20} />
                  Feels like: {Math.round(weather.main.feels_like)}°C
                </div>
                <div className="flex items-center gap-2">
                  <Wind size={20} />
                  Wind: {weather.wind.speed} m/s
                </div>
                <div className="flex items-center gap-2">
                  <Droplets size={20} />
                  Humidity: {weather.main.humidity}%
                </div>
              </div>
            </div>

            {forecast && (
              <div className="bg-white/20 backdrop-blur-md rounded-lg p-6 text-white">
                <h3 className="text-xl font-bold mb-4">5-Day Forecast</h3>
                <div className="grid gap-4">
                  {forecast.list
                    .filter((item, index) => index % 8 === 0)
                    .slice(0, 5)
                    .map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-white/10"
                      >
                        <div className="flex items-center gap-4">
                          <img
                            src={getWeatherIcon(item.weather[0].icon)}
                            alt={item.weather[0].main}
                            className="w-10 h-10"
                          />
                          <span>
                            {new Date(item.dt_txt).toLocaleDateString('en-US', {
                              weekday: 'short',
                            })}
                          </span>
                        </div>
                        <span>{Math.round(item.main.temp)}°C</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Map Container */}
        <div className="mt-8 bg-white/20 backdrop-blur-md rounded-lg overflow-hidden">
          <MapContainer
            center={coordinates}
            zoom={10}
            style={{ height: '400px', width: '100%' }}
            className="z-0"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={coordinates} icon={customIcon} />
            <RecenterMap coords={coordinates} />
          </MapContainer>
        </div>
      </div>
    </div>
  );
}

export default App;