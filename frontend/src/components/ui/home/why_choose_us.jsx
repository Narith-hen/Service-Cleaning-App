import React from 'react';
import { 
  SafetyOutlined,
  StarFilled,
  ClockCircleOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  TeamOutlined,
  UserOutlined,
  MessageOutlined
} from '@ant-design/icons';

const WhyChooseUs = () => {
  const features = [
    {
      icon: <SafetyOutlined />,
      title: "សុវត្ថិភាពខ្ពស់",
      description: "ការបង់ប្រាក់តាមរយៈប្រព័ន្ធធានារ៉ាប់រង និង ការពារទិន្នន័យ"
    },
    {
      icon: <DollarOutlined />,
      title: "តម្លៃថ្លៃត្រង់",
      description: "គ្មានការបង់ប្រាក់លាក់កំបាំង តម្លៃថ្លៃត្រង់ពីដើម"
    },
    {
      icon: <ClockCircleOutlined />,
      title: "សេវាកម្មរហ័ស",
      description: "ការឆ្លើយតបរហ័សក្នុងរយៈពេល 30 នាទី សេវាកម្ម 24/7"
    },
    {
      icon: <CheckCircleOutlined />,
      title: "គុណភាពធានា",
      description: "សេវាកម្មគុណភាពខ្ពស់ដោយអ្នកជំនាញផ្ទៀងផ្ទាត់"
    },
    {
      icon: <TeamOutlined />,
      title: "សហគមន៍ធំ",
      description: "ជាង 10,000 អ្នកប្រើប្រាស់ និង 2,500 អ្នកផ្តល់សេវាកម្ម"
    },
    {
      icon: <StarFilled />,
      title: "ការពេញចិត្តខ្ពស់",
      description: "98% អតិថិជនពេញចិត្តជាមួយនឹងសេវាកម្មរបស់យើង"
    }
  ];

  const reviews = [
    {
      name: "វណ្ណា",
      role: "អ្នកប្រើប្រាស់",
      rating: 5,
      comment: "សេវាកម្មល្អណាស់! អ្នកផ្តល់សេវាកម្មមកទាន់ពេលវេលា និង ធ្វើការងារបានល្អ។",
      date: "២ ខែមុន"
    },
    {
      name: "សុខ",
      role: "អាជីវកម្មតូច",
      rating: 5,
      comment: "ជួយរកអ្នកជំនាញបានលឿន និង ចំណាយត្រឹមត្រូវ។ អ្នកផ្តល់សេវាកម្មមានគុណភាព។",
      date: "១ ខែមុន"
    },
    {
      name: "មុនី",
      role: "អ្នកប្រើប្រាស់ធម្មតា",
      rating: 4,
      comment: "កម្មវិធីងាយស្រួលប្រើ សេវាកម្មពេញលេញ។ ចង់ឲ្យមានសេវាកម្មបន្ថែមទៀត។",
      date: "៣ សប្តាហ៍មុន"
    }
  ];

  const stats = [
    { value: "10,000+", label: "អ្នកប្រើប្រាស់" },
    { value: "2,500+", label: "អ្នកផ្តល់សេវាកម្ម" },
    { value: "98%", label: "ការពេញចិត្ត" },
    { value: "30m", label: "ការឆ្លើយតបជាមធ្យម" }
  ];

  return (
    <section className="py-16 px-4 bg-black">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            ហេតុអ្វីគួរជ្រើសរើសពួកយើង?
          </h2>
          <p className="text-lg text-gray-400">
            ការជឿទុកចិត្តរបស់អ្នកគឺជាអាទិភាពរបស់យើង
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {features.map((feature, index) => (
            <div key={index} className="bg-gray-900/50 rounded-xl p-6 border border-gray-800 hover:border-emerald-500/30 transition-colors">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <div className="text-emerald-400 text-xl">
                    {feature.icon}
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {stats.map((stat, index) => (
            <div key={index} className="text-center p-6 bg-gray-900/30 rounded-xl">
              <div className="text-3xl font-bold text-emerald-400 mb-2">
                {stat.value}
              </div>
              <div className="text-gray-400">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Reviews Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">
                មតិយោបល់ពីអ្នកប្រើប្រាស់
              </h3>
              <p className="text-gray-400">
                អ្វីដែលអតិថិជនរបស់យើងនិយាយអំពីយើង
              </p>
            </div>
            <div className="flex items-center gap-2">
              <StarFilled className="text-yellow-400 text-xl" />
              <span className="text-white text-xl font-bold">4.8</span>
              <span className="text-gray-400">(1,254 ការវាយតម្លៃ)</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reviews.map((review, index) => (
              <div key={index} className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
                {/* Quote Icon */}
                <div className="mb-4">
                  <MessageOutlined className="text-emerald-400 text-2xl" />
                </div>
                
                {/* Rating */}
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <StarFilled 
                      key={i} 
                      className={`text-sm ${i < review.rating ? 'text-yellow-400' : 'text-gray-600'}`}
                    />
                  ))}
                </div>
                
                {/* Review Comment */}
                <p className="text-gray-300 mb-6 italic">
                  "{review.comment}"
                </p>
                
                {/* Reviewer Info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                      <UserOutlined className="text-emerald-400" />
                    </div>
                    <div>
                      <div className="font-bold text-white">{review.name}</div>
                      <div className="text-gray-400 text-sm">{review.role}</div>
                    </div>
                  </div>
                  <div className="text-gray-500 text-sm">
                    {review.date}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-gray-900 to-black rounded-xl p-8 border border-gray-800">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-white mb-4">
              ត្រៀមខ្លួនដើម្បីចាប់ផ្តើម?
            </h3>
            <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
              ចូលរួមជាមួយសហគមន៍ដែលកំពុងលូតលាស់របស់យើង និង ស្វែងរកសេវាកម្មដែលអ្នកពិតជាត្រូវការ។
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-lg font-medium transition-colors">
                ចាប់ផ្តើមការកក់
              </button>
              <button className="bg-transparent hover:bg-gray-800 text-white px-8 py-3 rounded-lg font-medium border border-gray-700 transition-colors">
                ទាញយកកម្មវិធី
              </button>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default WhyChooseUs;