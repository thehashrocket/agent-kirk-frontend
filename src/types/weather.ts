// src/types/weather.tsx
// This file defines the WeatherData type, which is used to store weather data
// It includes properties for the city, temperature, description, and icon
// The icon is a string that represents the weather icon from the OpenWeatherMap API
// The temperature is a number that represents the temperature in Fahrenheit


export interface WeatherData {
    city: string;
    temperature: number;
    description: string;
    icon: string;
}
