import React from 'react';
import { 
  CalendarOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined,
  PlayCircleOutlined,
  CheckOutlined,
  StarOutlined,
  ArrowRightOutlined,
  SafetyOutlined,
  DollarOutlined,
  UserOutlined,
  HistoryOutlined
} from '@ant-design/icons';

const HowItWork = () => {
  const steps = [
    {
      id: 1,
      icon: <CalendarOutlined />,
      title: "ការកក់",
      description: "ជ្រើសរើសសេវាកម្ម និង កំណត់ពេលវេលាដែលអ្នកចង់បាន",
      color: "text-blue-400",
      bgColor: "bg-blue-500/10"
    },
    {
      id: 2,
      icon: <CheckCircleOutlined />,
      title: "ទទួលស្គាល់",
      description: "អ្នកផ្តល់សេវាកម្មទទួលស្គាល់ការកក់ និង បញ្ជាក់ការទទួលបាន",
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10"
    },
    {
      id: 3,
      icon: <ClockCircleOutlined />,
      title: "ការណាត់ជួប",
      description: "កំណត់ពេលវេលាជួប និង ទីតាំងសម្រាប់ការផ្តល់សេវាកម្ម",
      color: "text-purple-400",
      bgColor: "bg-purple-500/10"
    },
    {
      id: 4,
      icon: <PlayCircleOutlined />,
      title: "ចាប់ផ្តើម",
      description: "អ្នកផ្តល់សេវាកម្មចាប់ផ្តើមផ្តល់សេវាកម្មតាមការកំណត់",
      color: "text-orange-400",
      bgColor: "bg-orange-500/10"
    },
    {
      id: 5,
      icon: <CheckOutlined />,
      title: "បានបញ្ចប់",
      description: "សេវាកម្មត្រូវបានបញ្ចប់ដោយជោគជ័យ និង បានផ្តល់ឱ្យអតិថិជន",
      color: "text-green-400",
      bgColor: "bg-green-500/10"
    },
    {
      id: 6,
      icon: <StarOutlined />,
      title: "ការបញ្ចប់ចុងក្រោយ",
      description: "ទូទាត់ប្រាក់ ទុកយោបល់ និង បញ្ចប់ដំណើរការទាំងស្រុង",
      color: "text-cyan-400",
      bgColor: "bg-cyan-500/10"
    }
  ];

  const features = [
    {
      icon: <SafetyOutlined />,
      title: "សុវត្ថិភាព",
      description: "ការបង់ប្រាក់តាមរយៈប្រព័ន្ធធានារ៉ាប់រង"
    },
    {
      icon: <DollarOutlined />,
      title: "តម្លៃថ្លៃត្រង់",
      description: "គ្មានការបង់ប្រាក់លាក់កំបាំង តម្លៃថ្លៃត្រង់"
    },
    {
      icon: <UserOutlined />,
      title: "អ្នកផ្តល់សេវាកម្មផ្ទៀងផ្ទាត់",
      description: "បុគ្គលិកទាំងអស់បានឆ្លងកាត់ការផ្ទៀងផ្ទាត់"
    },
    {
      icon: <HistoryOutlined />,
      title: "តាមដានពេលវេលាពិត",
      description: "មើលដំណើរការសេវាកម្មពេលវេលាពិត"
    }
  ];

  return (
    <section className="py-16 px-4 bg-black">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            របៀបដែលវាដំណើរការ
          </h2>
          <p className="text-lg text-gray-400">
            ដំណើរការសាមញ្ញ ៦ ជំហានពីការកក់ទៅការបញ្ចប់
          </p>
        </div>

        {/* Steps - Horizontal Timeline */}
        <div className="relative mb-16">
          {/* Timeline Line */}
          <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-gradient-to-r from-blue-500/20 via-emerald-500/20 to-cyan-500/20 -translate-y-1/2 hidden md:block"></div>
          
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 md:gap-0 relative">
            {steps.map((step, index) => (
              <div key={step.id} className="relative">
                {/* Step Container */}
                <div className="flex flex-col items-center text-center">
                  {/* Icon Circle */}
                  <div className={`w-16 h-16 rounded-full ${step.bgColor} border-2 border-white/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <div className={`text-2xl ${step.color}`}>
                      {step.icon}
                    </div>
                  </div>
                  
                  {/* Step Number */}
                  <div className="absolute top-0 md:top-1/2 left-1/2 -translate-x-1/2 md:-translate-y-1/2 w-8 h-8 rounded-full bg-black border-2 border-white/20 flex items-center justify-center z-10">
                    <span className="text-sm font-bold text-white">{step.id}</span>
                  </div>
                  
                  {/* Content */}
                  <div className="mt-2">
                    <h3 className="font-bold text-white text-lg mb-1">
                      {step.title}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      {step.description}
                    </p>
                  </div>
                </div>
                
                {/* Connector Arrows for Mobile */}
                {index < steps.length - 1 && (
                  <>
                    <div className="md:hidden flex justify-center mt-4">
                      <ArrowRightOutlined className="text-gray-600" />
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Features Grid */}
        <div className="mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((feature, index) => (
              <div key={index} className="bg-gray-900/50 rounded-lg p-4 border border-gray-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <div className="text-emerald-400">
                      {feature.icon}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold text-white">{feature.title}</h4>
                    <p className="text-gray-400 text-sm">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-gray-900 to-black rounded-xl p-6 border border-gray-800">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-white mb-2">
                ត្រៀមខ្លួនដើម្បីចាប់ផ្តើម?
              </h3>
              <p className="text-gray-400">
                ចាប់ផ្តើមការកក់សេវាកម្មរបស់អ្នកឥឡូវនេះ
              </p>
            </div>
            <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-medium transition-colors whitespace-nowrap">
              ចាប់ផ្តើមការកក់
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          <div className="text-center p-4 bg-gray-900/30 rounded-lg">
            <div className="text-2xl font-bold text-emerald-400 mb-1">98%</div>
            <div className="text-gray-400 text-sm">ការពេញចិត្ត</div>
          </div>
          <div className="text-center p-4 bg-gray-900/30 rounded-lg">
            <div className="text-2xl font-bold text-emerald-400 mb-1">24/7</div>
            <div className="text-gray-400 text-sm">ការគាំទ្រ</div>
          </div>
          <div className="text-center p-4 bg-gray-900/30 rounded-lg">
            <div className="text-2xl font-bold text-emerald-400 mb-1">30m</div>
            <div className="text-gray-400 text-sm">ការឆ្លើយតប</div>
          </div>
          <div className="text-center p-4 bg-gray-900/30 rounded-lg">
            <div className="text-2xl font-bold text-emerald-400 mb-1">100%</div>
            <div className="text-gray-400 text-sm">សុវត្ថិភាព</div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default HowItWork;