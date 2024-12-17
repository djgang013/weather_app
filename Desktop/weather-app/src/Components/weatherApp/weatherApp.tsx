import React, { useState, KeyboardEvent, ChangeEvent } from 'react';
import './weatherApp.css';
import axios from 'axios';
import clear_icon from "../Assets/clear.png";
import cloud_icon from "../Assets/cloud.png";
import drizzle_icon from "../Assets/drizzle.png";
import rain_icon from "../Assets/rain.png";
import snow_icon from "../Assets/snow.png";
import wind_icon from "../Assets/wind.png";
import humidity_icon from "../Assets/humidity.png";

const WeatherApp: React.FC = () => {
  const api_key = "5244e93659f399eab07325b1e1fc8856";
  
  const [wicon, setWicon] = useState<string>(cloud_icon);
  const [cityInput, setCityInput] = useState<string>('');

  const search = async () => {
    if (cityInput === "") return;

    try {
      let url = `https://api.openweathermap.org/data/2.5/weather?q=${cityInput}&units=Metric&appid=${api_key}`;
      let response = await axios.get(url);
      let data = response.data;
      
      const humidity = document.getElementsByClassName("humidity-percent")[0];
      const wind = document.getElementsByClassName("wind-rate")[0];
      const temperature = document.getElementsByClassName("weather-temp")[0];
      const location = document.getElementsByClassName("weather-location")[0];

      if (humidity) humidity.innerHTML = `${data.main.humidity}%`;
      if (wind) wind.innerHTML = `${Math.floor(data.wind.speed)}km/h`;
      if (temperature) temperature.innerHTML = `${Math.floor(data.main.temp)}°c`;
      if (location) location.innerHTML = data.name;

      const icon = data.weather[0].icon;
      if (icon === "01d" || icon === "01n") setWicon(clear_icon);
      else if (icon.startsWith("02")) setWicon(cloud_icon);
      else if (icon.startsWith("03") || icon.startsWith("04")) setWicon(drizzle_icon);
      else if (icon.startsWith("09") || icon.startsWith("10")) setWicon(rain_icon);
      else if (icon === "13d" || icon === "13n") setWicon(snow_icon);
      else setWicon(clear_icon);

    } catch (error) {
      console.error("Error fetching weather data:", error);
    }
  };

  const handleKeyPress = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") search();
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setCityInput(event.target.value);
  };

  return (
    <div className='container'>
      <div className="top-bar">
        <input
          type="text"
          className='cityInput'
          placeholder='search'
          value={cityInput}
          onChange={handleInputChange}
          onKeyDown  ={handleKeyPress}
        />
      </div>
      <div className="weather-image">
        <img src={wicon} alt="" />
      </div>
      <div className="weather-temp">24 </div>
      <div className="weather-location">London</div>
      <div className="data-container">
        <div className="element">
          <img src={humidity_icon} alt="" className='icon' />
          <div className="data">
            <div className="humidity-percent">64%</div>
            <div className="text">humidity</div>
          </div>
        </div>
        <div className="element">
          <img src={wind_icon} alt="" className='icon' />
          <div className="data">
            <div className="wind-rate">18km/h</div>
            <div className="text">wind speed</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherApp;
