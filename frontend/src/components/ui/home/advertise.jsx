import React, { useState, useEffect } from 'react';
import { Modal } from 'antd';
import { 
  CloseOutlined, 
  RightOutlined,
  LeftOutlined,
  DownloadOutlined,
  GiftOutlined,
  StarFilled,
  FireFilled
} from '@ant-design/icons';

const Advertise = ({ visible, onClose, advertisements = [] }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Modern advertisements with better images
  const defaultAds = [
    {
      id: 1,
      image: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
      title: "ទាញយក App SEVANOW",
      description: "ទទួលបានការបញ្ចុះតម្លៃ 20% សម្រាប់អ្នកប្រើប្រាស់ថ្មី",
      features: ["សេវាកម្មពេញលេញ", "គ្មានការបង់ប្រាក់លាក់កំបាំង", "ការគាំទ្រ 24/7"],
      buttonText: "ទាញយកឥឡូវនេះ",
      link: "/download",
      icon: <DownloadOutlined />,
      color: "from-emerald-500 to-cyan-500"
    },
    {
      id: 2,
      image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
      title: "សេវាកម្មថ្មីៗ",
      description: "ស្គាល់សេវាកម្មថ្មីៗជាង 50+ ប្រភេទនៅក្នុង App",
      features: ["សេវាកម្មដឹកជញ្ជូន", "សេវាកម្មសំណង់", "សេវាកម្មវេជ្ជសាស្ត្រ"],
      buttonText: "មើលសេវាកម្មទាំងអស់",
      link: "/services",
      icon: <GiftOutlined />,
      color: "from-blue-500 to-purple-500"
    },
    {
      id: 3,
      image: "https://images.unsplash.com/photo-1556742111-a301b5f64d6d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
      title: "ការផ្តល់ជូនពិសេស",
      description: "សម្រាប់សមាជិកថ្មី - រង្វាន់ពិសេសកំពុងរង់ចាំអ្នក",
      features: ["ប្រាក់រង្វាន់ចូល", "ការបញ្ចុះតម្លៃពិសេស", "សេវាកម្មដំបូងឥតគិតថ្លៃ"],
      buttonText: "ចូលរួមឥឡូវ",
      link: "/promotion",
      icon: <FireFilled />,
      color: "from-orange-500 to-pink-500"
    }
  ];

  const adsToShow = advertisements.length > 0 ? advertisements : defaultAds;

  const handleNext = () => {
    if (currentSlide < adsToShow.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      handleSkip();
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('advertisement_shown', 'true');
    onClose();
  };

  const handleActionClick = (ad) => {
    if (ad.link) {
      window.open(ad.link, '_blank');
    }
    // If it's the last slide, close modal
    if (currentSlide === adsToShow.length - 1) {
      handleSkip();
    } else {
      handleNext();
    }
  };

  const currentAd = adsToShow[currentSlide];

  return (
    <Modal
      open={visible}
      onCancel={handleSkip}
      footer={null}
      closable={false}
      centered
      width={800}
      className="advertise-modal"
      styles={{
        body: {
          padding: 0,
          overflow: 'hidden'
        },
        mask: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(4px)'
        }
      }}
    >
      <div className="relative bg-black">
        
        {/* Close button */}
        <button
          onClick={handleSkip}
          className="absolute top-3 right-3 z-50 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full w-8 h-8 flex items-center justify-center transition-colors"
          style={{ zIndex: 1000 }}
        >
          <CloseOutlined className="text-white text-sm" />
        </button>
        
        {/* Main Content */}
        <div className="relative h-[450px] overflow-hidden">
          {/* Background Image with Overlay */}
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${currentAd.image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent" />
          </div>
          
          {/* Content Container */}
          <div className="relative h-full flex flex-col p-6">
            
            {/* Top Info */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                <span className="text-white/70 text-xs">ការផ្សព្វផ្សាយ</span>
              </div>
              <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm rounded px-2 py-1">
                <span className="text-white text-xs">
                  {currentSlide + 1}/{adsToShow.length}
                </span>
              </div>
            </div>
            
            {/* Main Content */}
            <div className="flex-1 flex flex-col justify-center">
              {/* Icon */}
              <div className={`mb-4 w-12 h-12 rounded-xl bg-gradient-to-br ${currentAd.color} flex items-center justify-center text-white text-xl`}>
                {currentAd.icon}
              </div>
              
              {/* Title */}
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                {currentAd.title}
              </h2>
              
              {/* Description */}
              <p className="text-base text-white/80 mb-6 max-w-xl">
                {currentAd.description}
              </p>
              
              {/* Features */}
              <div className="space-y-2 mb-6">
                {currentAd.features?.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <StarFilled className="text-emerald-400 text-xs" />
                    <span className="text-white/70 text-sm">{feature}</span>
                  </div>
                ))}
              </div>
              
              {/* CTA Button */}
              <div className="flex items-center gap-3">
                <button
                  className={`bg-gradient-to-r ${currentAd.color} hover:opacity-90 text-white font-medium py-3 px-6 rounded-lg flex items-center gap-2 transition-all`}
                  onClick={() => handleActionClick(currentAd)}
                >
                  {currentAd.icon}
                  <span>{currentAd.buttonText}</span>
                </button>
                
                <button
                  className="text-white/60 hover:text-white text-sm transition-colors"
                  onClick={handleSkip}
                >
                  រំលង
                </button>
              </div>
            </div>
            
            {/* Navigation & Progress */}
            <div className="flex items-center justify-between pt-6">
              {/* Progress Dots */}
              <div className="flex gap-1.5">
                {adsToShow.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`transition-all duration-300 ${
                      index === currentSlide 
                        ? 'w-6 bg-white' 
                        : 'w-1.5 bg-white/30 hover:bg-white/50'
                    } h-1.5 rounded-full`}
                  />
                ))}
              </div>
              
              {/* Navigation Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handlePrev}
                  disabled={currentSlide === 0}
                  className={`text-white hover:text-emerald-400 p-1.5 ${
                    currentSlide === 0 ? 'opacity-30 cursor-not-allowed' : ''
                  }`}
                >
                  <LeftOutlined />
                </button>
                <button
                  onClick={handleNext}
                  className="text-white hover:text-emerald-400 p-1.5 flex items-center gap-1"
                >
                  {currentSlide === adsToShow.length - 1 ? 'ចាប់ផ្តើម' : 'បន្ទាប់'}
                  <RightOutlined className="text-xs" />
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Floating Badge */}
        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white px-3 py-0.5 rounded-full text-xs font-bold transform rotate-12">
          ថ្មី!
        </div>
      </div>
    </Modal>
  );
};

// Custom hook to handle advertisement logic
export const useAdvertise = () => {
  const [showAdvertise, setShowAdvertise] = useState(false);

  useEffect(() => {
    // Check if advertisement has been shown before
    const hasShownAd = localStorage.getItem('advertisement_shown');
    
    // For testing: uncomment to always show ads
    // localStorage.removeItem('advertisement_shown');
    
    if (!hasShownAd) {
      // Show advertisement after a delay (better UX)
      const timer = setTimeout(() => {
        setShowAdvertise(true);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  const handleCloseAdvertise = () => {
    setShowAdvertise(false);
    localStorage.setItem('advertisement_shown', 'true');
  };

  return {
    showAdvertise,
    setShowAdvertise,
    handleCloseAdvertise
  };
};

export default Advertise;