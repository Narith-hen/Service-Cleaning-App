import React, { createContext, useState, useContext, useEffect } from 'react';

const TranslationContext = createContext();

const translations = {
  en: {
    // Navigation
    home: "Home",
    reviews: "Reviews",
    services: "Services",
    categories: "Categories",
    about: "About Us",
    contact: "Contact",
    login: "Login",
    signup: "Sign Up",
    writeReview: "Write a Review",
    searchPlaceholder: "Search services, companies, reviews...",
    
    // Home Page
    heroTitle: "Find Trusted Services Through Real Reviews",
    heroSubtitle: "Read authentic reviews from real customers. Make informed decisions with SevaNow.",
    browseReviews: "Browse Reviews",
    featuredReviews: "Featured Reviews",
    latestReviews: "Latest Reviews",
    whyChooseUs: "Why Choose SevaNow?",
    
    // Features
    authenticReviews: "Authentic Reviews",
    authenticDesc: "Verified reviews from real customers",
    trustedRatings: "Trusted Ratings",
    trustedDesc: "Accurate ratings based on actual experiences",
    easySearch: "Easy Search",
    easyDesc: "Find services quickly with advanced search",
    communityDriven: "Community Driven",
    communityDesc: "Powered by our community of users",
    
    // Reviews
    excellentService: "Excellent Service",
    greatValue: "Great Value",
    professionalTeam: "Professional Team",
    homeServices: "Home Services",
    itServices: "IT Services",
    professional: "Professional",
    
    // Services
    homeCleaning: "Home Cleaning",
    itSupport: "IT Support",
    plumbing: "Plumbing",
    electrician: "Electrician",
    reviewsCount: "reviews",
    
    // Common
    readMore: "Read More",
    viewAll: "View All",
    shareExperience: "Share Your Experience",
    helpOthers: "Help others make better decisions",
    writeReviewNow: "Write a Review Now",
    
    // Footer
    company: "Company",
    quickLinks: "Quick Links",
    connectWithUs: "Connect With Us",
    stayUpdated: "Stay Updated",
    subscribe: "Subscribe",
    privacy: "Privacy Policy",
    terms: "Terms of Service",
    cookies: "Cookie Policy",
    sitemap: "Sitemap",
    
    // Settings
    language: "Language",
    darkMode: "Dark Mode",
    settings: "Settings",
    english: "English",
    khmer: "Khmer",
    theme: "Theme",
    notifications: "Notifications",
    account: "Account",
  },
  kh: {
    // Navigation
    home: "ទំព័រដើម",
    reviews: "ការពិនិត្យឡើងវិញ",
    services: "សេវាកម្ម",
    categories: "ប្រភេទ",
    about: "អំពីយើង",
    contact: "ទំនាក់ទំនង",
    login: "ចូល",
    signup: "ចុះឈ្មោះ",
    writeReview: "សរសេរការពិនិត្យ",
    searchPlaceholder: "ស្វែងរកសេវាកម្ម ក្រុមហ៊ុន ការពិនិត្យ...",
    
    // Home Page
    heroTitle: "ស្វែងរកសេវាកម្មដែលទុកចិត្តតាមរយៈការពិនិត្យឡើងវិញពិតប្រាកដ",
    heroSubtitle: "អានការពិនិត្យឡើងវិញពិតប្រាកដពីអតិថិជនពិត។ ធ្វើការសម្រេចចិត្តដែលច្បាស់លាស់ជាមួយ SevaNow។",
    browseReviews: "រាវរកការពិនិត្យឡើងវិញ",
    featuredReviews: "ការពិនិត្យឡើងវិញពិសេស",
    latestReviews: "ការពិនិត្យឡើងវិញថ្មីៗ",
    whyChooseUs: "ហេតុអ្វីត្រូវជ្រើសរើស SevaNow?",
    
    // Features
    authenticReviews: "ការពិនិត្យឡើងវិញពិតប្រាកដ",
    authenticDesc: "ការពិនិត្យឡើងវិញដែលបានផ្ទៀងផ្ទាត់ពីអតិថិជនពិត",
    trustedRatings: "ការវាយតម្លៃដែលទុកចិត្ត",
    trustedDesc: "ការវាយតម្លៃត្រឹមត្រូវដោយផ្អែកលើបទពិសោធន៍ពិត",
    easySearch: "ការស្វែងរកងាយស្រួល",
    easyDesc: "ស្វែងរកសេវាកម្មយ៉ាងឆ្បាស់លាស់ជាមួយការស្វែងរកដែលកម្រិតខ្ពស់របស់យើង",
    communityDriven: "បណ្តាញសហគមន៍",
    communityDesc: "ដំណើរការដោយសហគមន៍អ្នកប្រើប្រាស់របស់យើង",
    
    // Reviews
    excellentService: "សេវាកម្មល្អឥតខ្ចោះ",
    greatValue: "តម្លៃដ៏អស្ចារ្យ",
    professionalTeam: "ក្រុមអ្នកជំនាញ",
    homeServices: "សេវាកម្មផ្ទះ",
    itServices: "សេវាកម្ម IT",
    professional: "វិជ្ជាជីវៈ",
    
    // Services
    homeCleaning: "សម្អាតផ្ទះ",
    itSupport: "ជំនួយ IT",
    plumbing: "ជាងពង្រាបទឹក",
    electrician: "ជាងភ្លើង",
    reviewsCount: "ការពិនិត្យឡើងវិញ",
    
    // Common
    readMore: "អានបន្ថែម",
    viewAll: "មើលទាំងអស់",
    shareExperience: "ចែករំលែកបទពិសោធន៍របស់អ្នក",
    helpOthers: "ជួយអ្នកដទៃធ្វើការសម្រេចចិត្តប្រសើរជាងមុន",
    writeReviewNow: "សរសេរការពិនិត្យឡើងវិញឥឡូវនេះ",
    
    // Footer
    company: "ក្រុមហ៊ុន",
    quickLinks: "តំណភ្ជាប់រហ័ស",
    connectWithUs: "ទាក់ទងជាមួយយើង",
    stayUpdated: "ទទួលបានព័ត៌មានថ្មីៗ",
    subscribe: "ជាវ",
    privacy: "គោលការណ៍ភាពឯកជន",
    terms: "លក្ខខណ្ឌសេវាកម្ម",
    cookies: "គោលការណ៍ខូគី",
    sitemap: "ផែនទីគេហទំព័រ",
    
    // Settings
    language: "ភាសា",
    darkMode: "របៀបងងឹត",
    settings: "ការកំណត់",
    english: "អង់គ្លេស",
    khmer: "ខ្មែរ",
    theme: "រូបរាង",
    notifications: "ការជូនដំណឹង",
    account: "គណនី",
  }
};

export const TranslationProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'en';
  });
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    localStorage.setItem('darkMode', darkMode);
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [darkMode]);

  const t = (key) => {
    return translations[language]?.[key] || key;
  };

  const changeLanguage = (lang) => {
    setLanguage(lang);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <TranslationContext.Provider value={{
      language,
      darkMode,
      t,
      changeLanguage,
      toggleDarkMode,
      translations
    }}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within TranslationProvider');
  }
  return context;
};