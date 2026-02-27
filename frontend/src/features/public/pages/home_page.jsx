import React, { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import HeroSection from '../components/hero_section';
import '../../../styles/public/home.scss';

const PublicHomePage = () => {
  const { user, isAuthenticated } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  // Services data
  const services = [
    {
      id: 1,
      name: 'Regular Cleaning',
      description: 'Bi-weekly or weekly maintenance cleaning',
      price: 45,
      duration: '2 hours',
      icon: 'home',
      color: 'blue'
    },
    {
      id: 2,
      name: 'Deep Cleaning',
      description: 'Thorough cleaning of entire space',
      price: 120,
      duration: '4 hours',
      icon: 'deep',
      color: 'purple'
    },
    {
      id: 3,
      name: 'Move Out/In',
      description: 'End of lease or move-in cleaning',
      price: 160,
      duration: '6 hours',
      icon: 'move',
      color: 'green'
    },
    {
      id: 4,
      name: 'Window Cleaning',
      description: 'Interior and exterior windows',
      price: 80,
      duration: '2 hours',
      icon: 'window',
      color: 'orange'
    }
  ];

  return (
    <div className="public-home" >
      <HeroSection number={1}/>
    </div>
  );
};

export default PublicHomePage;