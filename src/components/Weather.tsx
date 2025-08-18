// src/components/Weather.tsx
// This component uses the OpenWeatherMap API to fetch weather data for a given city
// It displays the current weather, rendering an icon from lucide-react
// It also displays the temperature and a general weather description
// The component is styled with Tailwind CSS and uses the OpenWeatherMap API
// It needs to be small since it will display in the navbar next the notification bell.

import { useEffect, useState } from 'react';
import { WeatherData } from '@/types/weather';
import { CloudFog, CloudIcon, CloudLightning, CloudMoon, CloudMoonRain, CloudSun, CloudSunRain, Haze, MoonIcon, Snowflake, SunIcon, SunSnow } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface WeatherProps {
    city?: string;
}

export const WeatherIcon = ({ icon }: { icon: string }) => {
    // switch on the icon and return the appropriate icon using lucide-react
    switch (icon) {
        case '01d': // clear sky day
            return <SunIcon />;
        case '01n': // clear sky night
            return <MoonIcon />;
        case '02d': // few clouds day
            return <CloudSun />;
        case '02n': // few clouds night
            return <CloudMoon />;
        case '03d': // scattered clouds day
            return <CloudSun />;
        case '03n': // scattered clouds night
            return <CloudMoon />;
        case '04d': // broken clouds day
            return <CloudSun />;
        case '04n': // broken clouds night
            return <CloudMoon />;
        case '09d': // shower rain day
            return <CloudSunRain />;
        case '09n': // shower rain night
            return <CloudMoonRain />;
        case '10d': // rain day
            return <CloudSunRain />;
        case '10n': // rain night
            return <CloudMoonRain />;
        case '11d': // thunderstorm day
            return <CloudLightning />;
        case '11n': // thunderstorm night
            return <CloudLightning />;
        case '13d': // snow day
            return <SunSnow />;
        case '13n': // snow night
            return <Snowflake />;
        case '50d': // mist day
            return <Haze />;
        case '50n': // mist night
            return <CloudFog />;
        default:
            return <CloudIcon />;
    }
}

export default function Weather({ city }: WeatherProps) {
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);

    useEffect(() => {
        const getLocation = () => {
            if (!navigator.geolocation) {
                setError('Geolocation is not supported by your browser');
                setLoading(false);
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocation({
                        lat: position.coords.latitude,
                        lon: position.coords.longitude
                    });
                }
            );
        };

        getLocation();
    }, []);

    useEffect(() => {
        const fetchWeather = async () => {
            if (!location && !city) {
                return;
            }

            try {
                const url = location
                    ? `/api/weather?lat=${location.lat}&lon=${location.lon}`
                    : `/api/weather?city=${city}`;

                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error('Failed to fetch weather data');
                }
                const responseData = await response.json();
                // Extract the weather data from the wrapped response
                const data: WeatherData = responseData.data;
                setWeather(data);
                setLoading(false);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred');
                setLoading(false);
            }
        };

        fetchWeather();
    }, [location, city]);

    if (loading) {
        return <div className="text-sm text-gray-500">Loading weather...</div>;
    }

    if (error) {
        return <div className="text-sm text-red-500">Weather unavailable</div>;
    }

    return (
        <div className="weather-container">
            <div className="flex items-center">
                <div className="flex-shrink-0">
                    {weather?.icon && (
                        <Tooltip>
                            <TooltipTrigger>
                                <WeatherIcon icon={weather.icon} />
                            </TooltipTrigger>
                            <TooltipContent>
                                {weather.city}: {weather.description} ({Math.round(weather.temperature)}°F)<br />
                                But the weather is always perfect in California!
                            </TooltipContent>
                        </Tooltip>
                    )}
                </div>
            </div>
        </div>
    );
}
