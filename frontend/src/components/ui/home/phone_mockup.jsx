import React, { useState, useRef } from 'react';
import { 
  AppleOutlined, 
  AndroidOutlined, 
  PlayCircleOutlined, 
  PauseOutlined,
  WifiOutlined,
  // BatteryOutlined
} from '@ant-design/icons';

const PhoneMockup = ({ 
  screenContent = null,
  size = 'medium' 
}) => {
  const [platform, setPlatform] = useState('ios'); // 'ios' or 'android'
  const [isPlaying, setIsPlaying] = useState(true);
  const videoRef = useRef(null);

  const togglePlay = () => {
    if (videoRef.current) {
      isPlaying ? videoRef.current.pause() : videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="flex flex-col items-center gap-8">

      {/* 2. The Device Container with 3D Perspective */}
      <div className="relative group transition-all duration-500 hover:rotate-y-6" style={{ perspective: '1000px' }}>
        
        {/* Metallic Frame (The "Silver" Edge) */}
        <div className="relative bg-[#e2e2e2] p-[3px] rounded-[3.5rem] shadow-[20px_20px_60px_rgba(0,0,0,0.4),-5px_-5px_20px_rgba(255,255,255,0.1)] border-t border-l border-white/50">
          
          {/* Black Bezel */}
          <div className="bg-black p-[12px] rounded-[3.3rem] relative">
            
            {/* Screen Area */}
            <div className="relative aspect-[9/19.5] w-[280px] md:w-[320px] bg-gray-900 rounded-[2.5rem] overflow-hidden">
              
              {/* Dynamic Island / Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-7 bg-black rounded-b-3xl z-50 flex items-center justify-center">
                <div className="w-12 h-1 bg-gray-800 rounded-full" /> {/* Speaker grill */}
              </div>

              {/* Status Bar */}
              <div className="absolute top-2 left-0 right-0 px-8 flex justify-between items-center z-40 text-[10px] font-bold text-white">
                <span>9:41</span>
                <div className="flex gap-1 items-center">
                  <WifiOutlined />
                  {/* <BatteryOutlined className="rotate-90" /> */}
                </div>
              </div>

              {/* Content Render */}
              <div className="w-full h-full relative">
                {screenContent}
                
                {/* Modern Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
              </div>

              {/* Android Navigation Bar (Conditional) */}
              {platform === 'android' && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-8 items-center opacity-50">
                  <div className="w-3 h-3 border-2 border-white rounded-sm" />
                  <div className="w-4 h-4 border-2 border-white rounded-full" />
                  <div className="w-0 h-0 border-y-[6px] border-y-transparent border-r-[10px] border-r-white" />
                </div>
              )}

              {/* iOS Home Indicator (Conditional) */}
              {platform === 'ios' && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/40 rounded-full" />
              )}
            </div>
          </div>

          {/* Side Buttons (Physical details) */}
          <div className="absolute -left-[3px] top-24 w-[3px] h-12 bg-[#c0c0c0] rounded-l-md shadow-sm" /> {/* Volume Up */}
          <div className="absolute -left-[3px] top-40 w-[3px] h-12 bg-[#c0c0c0] rounded-l-md shadow-sm" /> {/* Volume Down */}
          <div className="absolute -right-[3px] top-32 w-[3px] h-20 bg-[#c0c0c0] rounded-r-md shadow-sm" /> {/* Power */}
        </div>
      </div>
    </div>
  );
};

export default PhoneMockup;