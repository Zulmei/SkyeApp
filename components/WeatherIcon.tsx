import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface WeatherIconProps {
  type: string;
  size?: number;
}

export default function WeatherIcon({ type, size = 32 }: WeatherIconProps) {
  const getEmoji = () => {
    switch (type) {
      case 'sunny': return '☀️';
      case 'partly-cloudy': return '⛅';
      case 'cloudy': return '☁️';
      case 'rainy': return '🌧️';
      case 'stormy': return '⛈️';
      case 'snowy': return '❄️';
      case 'night': return '🌙';
      default: return '⛅';
    }
  };

  return (
    <Text style={{ fontSize: size, lineHeight: size * 1.3 }}>{getEmoji()}</Text>
  );
}
