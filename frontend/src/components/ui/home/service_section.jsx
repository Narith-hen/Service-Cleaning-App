import React from 'react';
import { Button } from 'antd';
import { 
  CarOutlined,
  ToolOutlined,
  ShoppingOutlined,
  MedicineBoxOutlined,
  BankOutlined,
  WifiOutlined,
  EyeOutlined,
  ArrowRightOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const ServiceSection = () => {
  const navigate = useNavigate();

  // Show only 6 main services
  const mainServices = [
    {
      id: 'transport',
      icon: <CarOutlined />,
      title: "សេវាកម្មដឹកជញ្ជូន",
      description: "ដឹកជញ្ជូនទំនិញ និង អ្នកដំណើរ",
      count: "150+"
    },
    {
      id: 'construction',
      icon: <ToolOutlined />,
      title: "សេវាកម្មសំណង់",
      description: "សំណង់ផ្ទះ និង អគារ",
      count: "120+"
    },
    {
      id: 'business',
      icon: <ShoppingOutlined />,
      title: "សេវាកម្មអាជីវកម្ម",
      description: "អាជីវកម្ម និង ពាណិជ្ជកម្ម",
      count: "180+"
    },
    {
      id: 'health',
      icon: <MedicineBoxOutlined />,
      title: "សេវាកម្មសុខភាព",
      description: "សុខភាព និង វេជ្ជសាស្ត្រ",
      count: "250+"
    },
    {
      id: 'finance',
      icon: <BankOutlined />,
      title: "សេវាកម្មហិរញ្ញវត្ថុ",
      description: "ធនាគារ និង ហិរញ្ញវត្ថុ",
      count: "95+"
    },
    {
      id: 'it',
      icon: <WifiOutlined />,
      title: "សេវាកម្ម IT",
      description: "បច្ចេកវិទ្យា និង ទំនាក់ទំនង",
      count: "85+"
    }
  ];

  // Handle view all
  const handleViewAll = () => {
    navigate('/services');
  };

  return (
    <section className="py-12 md:py-16 px-4 md:px-8 bg-gradient-to-b from-gray-900 to-black">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="text-center mb-10 md:mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            សេវាកម្មរបស់យើង
          </h2>
          <p className="text-lg text-white/70 max-w-2xl mx-auto mb-6">
            សេវាកម្មពេញលេញនៅក្នុងកម្មវិធីតែមួយ
          </p>
        </div>

        {/* Main Services Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {mainServices.map((service) => (
            <div 
              key={service.id}
              className="group bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-emerald-500/30 transition-all duration-300 hover:transform hover:-translate-y-1 cursor-pointer"
              onClick={() => navigate(`/services?category=${service.id}`)}
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-emerald-500/10 rounded-xl group-hover:bg-emerald-500/20 transition-colors">
                  <div className="text-2xl text-emerald-400 group-hover:text-emerald-300">
                    {service.icon}
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-semibold text-lg mb-2">
                    {service.title}
                  </h3>
                  <p className="text-white/60 text-sm mb-3">
                    {service.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-400 text-sm font-medium">
                      {service.count} សេវាកម្ម
                    </span>
                    <ArrowRightOutlined className="text-white/50 group-hover:text-emerald-400 transition-colors" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* View All Button & Stats */}
        <div className="text-center">
          <div className="inline-flex flex-col items-center gap-6 px-6 py-8 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 max-w-2xl mx-auto w-full">
            
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
              <div className="text-center p-3">
                <div className="text-2xl md:text-3xl font-bold text-emerald-400">6</div>
                <div className="text-white/70 text-xs md:text-sm">ប្រភេទសេវាកម្មចម្បង</div>
              </div>
              <div className="text-center p-3">
                <div className="text-2xl md:text-3xl font-bold text-emerald-400">24</div>
                <div className="text-white/70 text-xs md:text-sm">ប្រភេទសេវាកម្ម</div>
              </div>
              <div className="text-center p-3">
                <div className="text-2xl md:text-3xl font-bold text-emerald-400">2500+</div>
                <div className="text-white/70 text-xs md:text-sm">សេវាកម្មសរុប</div>
              </div>
              <div className="text-center p-3">
                <div className="text-2xl md:text-3xl font-bold text-emerald-400">100%</div>
                <div className="text-white/70 text-xs md:text-sm">សេវាកម្មពេញលេញ</div>
              </div>
            </div>

            {/* View All Button */}
            <Button
              type="primary"
              size="large"
              className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 border-0 px-8 h-12 text-white font-medium"
              icon={<EyeOutlined />}
              onClick={handleViewAll}
            >
              មើលសេវាកម្មទាំងអស់
            </Button>

            <p className="text-white/60 text-sm">
              ចុចដើម្បីមើលសេវាកម្មពេញលេញទាំង ២៥០០+ នៅលើទំព័រសេវាកម្ម
            </p>
          </div>
        </div>

      </div>
    </section>
  );
};

export default ServiceSection;