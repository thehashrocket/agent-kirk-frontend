// src/app/api/weather/route.ts
// This file is a route handler for the weather API
// It uses the OpenWeatherMap API to fetch weather data for a given city or coordinates
// It returns the weather data in JSON format
// It is a serverless function that is called by the Weather component

import { NextRequest } from 'next/server';
import { WeatherData } from '@/types/weather';
import { ApiErrors, createSuccessResponse } from '@/lib/api/weather/utils';

async function getCoordinatesFromCity(city: string, apiKey: string) {
  const response = await fetch(
    `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${apiKey}`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch city coordinates');
  }

  const data = await response.json();
  if (!data || data.length === 0) {
    throw new Error('City not found');
  }

  return {
    lat: data[0].lat,
    lon: data[0].lon,
    name: data[0].name,
    state: data[0].state,
    country: data[0].country
  };
}

async function getWeatherData(lat: number, lon: number, apiKey: string) {
  const response = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=imperial`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch weather data');
  }
  return response.json();
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get('city');
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');
  const apiKey = process.env.OPENWEATHERMAP_API_KEY;

  if (!apiKey) {
    return ApiErrors.serverError('OpenWeatherMap API key not configured');
  }

  try {
    let locationData;
    let weatherData;

    if (lat && lon) {
      // Use provided coordinates
      weatherData = await getWeatherData(parseFloat(lat), parseFloat(lon), apiKey);
      locationData = {
        name: weatherData.name,
        state: weatherData.sys.country,
        country: weatherData.sys.country
      };
    } else if (city) {
      // Get coordinates from city name
      locationData = await getCoordinatesFromCity(city, apiKey);
      weatherData = await getWeatherData(locationData.lat, locationData.lon, apiKey);
    } else {
      return ApiErrors.badRequest('Either city or coordinates must be provided');
    }

    const weatherResponse: WeatherData = {
      city: locationData.state ? `${locationData.name}, ${locationData.state}` : locationData.name,
      temperature: weatherData.main.temp,
      description: weatherData.weather[0].description,
      icon: weatherData.weather[0].icon,
    };

    return createSuccessResponse(weatherResponse);
  } catch (error) {
    console.error('Error fetching weather data:', error);
    return ApiErrors.serverError('Failed to fetch weather data');
  }
}
