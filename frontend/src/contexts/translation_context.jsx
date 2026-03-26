import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';

const TranslationContext = createContext(null);

const SUPPORTED_LANGUAGES = new Set(['en', 'km']);

const normalizeLanguage = (value) => {
  const normalized = String(value || 'en').trim().toLowerCase();
  if (normalized === 'kh') return 'km';
  return SUPPORTED_LANGUAGES.has(normalized) ? normalized : 'en';
};

const keyTranslations = {
  en: {
    language: 'Language',
    darkMode: 'Dark Mode',
    settings: 'Settings',
    english: 'English',
    khmer: 'Khmer',
    notifications: 'Notifications',
    account: 'Account',
    theme: 'Theme'
  },
  km: {
    language: 'ភាសា',
    darkMode: 'របៀបងងឹត',
    settings: 'ការកំណត់',
    english: 'អង់គ្លេស',
    khmer: 'ខ្មែរ',
    notifications: 'ការជូនដំណឹង',
    account: 'គណនី',
    theme: 'រូបរាង'
  }
};

const adminPhraseTranslations = {
  km: {
    'Dashboard': 'ផ្ទាំងគ្រប់គ្រង',
    'Bookings': 'ការកក់',
    'Cleaners': 'អ្នកសម្អាត',
    'Customers': 'អតិថិជន',
    'Services': 'សេវាកម្ម',
    'Promotions': 'ប្រូម៉ូសិន',
    'Reviews': 'ការវាយតម្លៃ',
    'Revenue Analysis': 'វិភាគចំណូល',
    'Performance': 'ប្រសិទ្ធភាព',
    'Settings': 'ការកំណត់',
    'Logout': 'ចាកចេញ',
    'Are you sure want to logout?': 'តើអ្នកប្រាកដថាចង់ចាកចេញមែនទេ?',
    'Enterprise Edition': 'កំណែសហគ្រាស',
    'Admin User': 'អ្នកគ្រប់គ្រង',
    'Administrator': 'អ្នកគ្រប់គ្រង',
    'Notifications': 'ការជូនដំណឹង',
    'Mark all read': 'សម្គាល់ទាំងអស់ថាបានអាន',
    'Loading...': 'កំពុងផ្ទុក...',
    'No notifications': 'មិនមានការជូនដំណឹង',
    'View all notifications': 'មើលការជូនដំណឹងទាំងអស់',
    'My Profile': 'ប្រវត្តិរូបរបស់ខ្ញុំ',
    'Edit Profile': 'កែប្រវត្តិរូប',
    'Edit Password': 'កែពាក្យសម្ងាត់',
    'Cancel': 'បោះបង់',
    'Sign Out': 'ចាកចេញ',
    'Manage Settings': 'គ្រប់គ្រងការកំណត់',
    'Control your admin profile, interface preferences, and account security.': 'គ្រប់គ្រងប្រវត្តិរូបអ្នកគ្រប់គ្រង ការកំណត់ចំណង់ចំណូលចិត្ត និងសុវត្ថិភាពគណនី។',
    'Language': 'ភាសា',
    'English': 'អង់គ្លេស',
    'Khmer': 'ខ្មែរ',
    'Notification Alerts': 'ការជូនដំណឹង',
    'Receive platform and account activity updates.': 'ទទួលព័ត៌មានថ្មីៗពីសកម្មភាពគណនី និងប្រព័ន្ធ។',
    'Dark Mode Preference': 'ជម្រើសរបៀបងងឹត',
    'Dark mode': 'របៀបងងឹត',
    'Dark Mode': 'របៀបងងឹត',
    'Light mode': 'របៀបភ្លឺ',
    'Light Mode': 'របៀបភ្លឺ',
    'Save the theme mode you want applied in the admin interface.': 'រក្សាទុករបៀបរូបរាងដែលអ្នកចង់ប្រើនៅផ្ទាំងអ្នកគ្រប់គ្រង។',
    'Save Preferences': 'រក្សាទុកការកំណត់',
    'Saving...': 'កំពុងរក្សាទុក...',
    'Account Profile': 'ប្រវត្តិរូបគណនី',
    'Security': 'សុវត្ថិភាព',
    'Save Profile': 'រក្សាទុកប្រវត្តិរូប',
    'Saved in account settings': 'បានរក្សាទុកក្នុងការកំណត់គណនី',
    'Enabled': 'បើក',
    'Muted': 'បិទសំឡេង',
    'Platform alerts and updates': 'ការជូនដំណឹង និងព័ត៌មានថ្មីៗពីប្រព័ន្ធ',
    'Currently active in admin UI': 'កំពុងប្រើក្នុងផ្ទាំងអ្នកគ្រប់គ្រង',
    'Ready to switch when saved': 'រួចរាល់សម្រាប់ប្ដូរ ពេលរក្សាទុក',
    'Change profile image': 'ប្តូររូបប្រវត្តិរូប',
    'No email available': 'មិនមានអ៊ីមែល',
    'Secure Access': 'ការចូលប្រើសុវត្ថិភាព',
    'Account Health': 'សុខភាពគណនី',
    'Keep your profile and preferences up to date so the admin workspace stays consistent across sessions.': 'ធ្វើបច្ចុប្បន្នភាពប្រវត្តិរូប និងការកំណត់របស់អ្នកជានិច្ច ដើម្បីឲ្យផ្ទាំងគ្រប់គ្រងមានភាពស្របគ្នាគ្រប់វគ្គប្រើប្រាស់។',
    'Update the main admin contact details used across the platform.': 'ធ្វើបច្ចុប្បន្នភាពព័ត៌មានទំនាក់ទំនងសំខាន់របស់អ្នកគ្រប់គ្រងដែលប្រើនៅក្នុងប្រព័ន្ធ។',
    'Enter first name': 'បញ្ចូលនាមខ្លួន',
    'Enter last name': 'បញ្ចូលនាមត្រកូល',
    'Enter email address': 'បញ្ចូលអាសយដ្ឋានអ៊ីមែល',
    'Enter phone number': 'បញ្ចូលលេខទូរស័ព្ទ',
    'Enter city': 'បញ្ចូលទីក្រុង',
    'Enter state': 'បញ្ចូលរដ្ឋ/ខេត្ត',
    'Enter country': 'បញ្ចូលប្រទេស',
    'Preferences': 'ចំណង់ចំណូលចិត្ត',
    'Control interface defaults and how you receive admin notifications.': 'កំណត់ចំណូលចិត្តចម្បងនៃផ្ទាំង និងរបៀបទទួលការជូនដំណឹង។',
    'Change your admin password and keep account access protected.': 'ប្តូរពាក្យសម្ងាត់អ្នកគ្រប់គ្រង និងរក្សាសុវត្ថិភាពការចូលប្រើគណនី។',
    'Enter current password': 'បញ្ចូលពាក្យសម្ងាត់បច្ចុប្បន្ន',
    'Enter new password': 'បញ្ចូលពាក្យសម្ងាត់ថ្មី',
    'Confirm new password': 'បញ្ជាក់ពាក្យសម្ងាត់ថ្មី',
    'Password tip': 'គន្លឹះពាក្យសម្ងាត់',
    'Use at least 6 characters and avoid reusing old passwords across different accounts.': 'ប្រើយ៉ាងតិច 6 តួអក្សរ និងកុំប្រើពាក្យសម្ងាត់ចាស់ឡើងវិញលើគណនីផ្សេងៗ។',
    'Update Password': 'ប្តូរពាក្យសម្ងាត់',
    'Updating...': 'កំពុងធ្វើបច្ចុប្បន្នភាព...',
    'Current Password': 'ពាក្យសម្ងាត់បច្ចុប្បន្ន',
    'New Password': 'ពាក្យសម្ងាត់ថ្មី',
    'Confirm New Password': 'បញ្ជាក់ពាក្យសម្ងាត់ថ្មី',
    'First Name': 'នាមខ្លួន',
    'Last Name': 'នាមត្រកូល',
    'Email Address': 'អាសយដ្ឋានអ៊ីមែល',
    'Phone Number': 'លេខទូរស័ព្ទ',
    'City': 'ទីក្រុង',
    'State / Province': 'រដ្ឋ / ខេត្ត',
    'Country': 'ប្រទេស',
    'Manage Bookings': 'គ្រប់គ្រងការកក់',
    'Manage, track and coordinate all cleaning appointments.': 'គ្រប់គ្រង តាមដាន និងសម្របសម្រួលការណាត់សេវាសម្អាតទាំងអស់។',
    'Admin Dashboard': 'ផ្ទាំងគ្រប់គ្រង',
    'View platform activity, bookings, and performance insights.': 'មើលសកម្មភាពប្រព័ន្ធ ការកក់ និងទិន្នន័យប្រសិទ្ធភាព។',
    'Manage Cleaners': 'គ្រប់គ្រងអ្នកសម្អាត',
    'Manage Customers': 'គ្រប់គ្រងអតិថិជន',
    'Manage your cleaning staff, monitor performance and verify statuses.': 'គ្រប់គ្រងក្រុមអ្នកសម្អាត តាមដានប្រសិទ្ធភាព និងផ្ទៀងផ្ទាត់ស្ថានភាព។',
    'View and manage your registered customer database.': 'មើល និងគ្រប់គ្រងទិន្នន័យអតិថិជនដែលបានចុះឈ្មោះ។',
    'Manage Services': 'គ្រប់គ្រងសេវាកម្ម',
    'Configure and manage your service offerings and pricing tiers.': 'កំណត់ និងគ្រប់គ្រងសេវាកម្ម និងកម្រិតតម្លៃរបស់អ្នក។',
    'Add New Service': 'បន្ថែមសេវាកម្មថ្មី',
    'Manage Reviews': 'គ្រប់គ្រងការវាយតម្លៃ',
    'Monitor customer feedback and service quality trends.': 'តាមដានមតិយោបល់អតិថិជន និងនិន្នាការគុណភាពសេវាកម្ម។',
    'Manage Payments': 'គ្រប់គ្រងការទូទាត់',
    'Manage Users': 'គ្រប់គ្រងអ្នកប្រើប្រាស់',
    'Revenue Trend': 'និន្នាការចំណូល',
    'Top Cleaners': 'អ្នកសម្អាតល្អបំផុត',
    'Recent Bookings': 'ការកក់ថ្មីៗ',
    'Dashboard View': 'ទិដ្ឋភាពផ្ទាំងគ្រប់គ្រង',
    'Booking Review': 'ពិនិត្យការកក់',
    'Weekly': 'ប្រចាំសប្ដាហ៍',
    'Monthly': 'ប្រចាំខែ',
    'All': 'ទាំងអស់',
    'TOTAL BOOKINGS': 'ការកក់សរុប',
    'SERVICES CONFIRMED': 'សេវាកម្មដែលបានបញ្ជាក់',
    'SERVICES COMPLETED': 'សេវាកម្មដែលបានបញ្ចប់',
    'SERVICES CANCELLED': 'សេវាកម្មដែលបានបោះបង់',
    'Search by Booking ID, Customer...': 'ស្វែងរកតាមលេខកក់ ឬអតិថិជន...',
    'Status: All': 'ស្ថានភាព: ទាំងអស់',
    'Service Type': 'ប្រភេទសេវាកម្ម',
    'BOOKING ID': 'លេខកក់',
    'CUSTOMER': 'អតិថិជន',
    'SERVICE TYPE': 'ប្រភេទសេវាកម្ម',
    'CLEANER': 'អ្នកសម្អាត',
    'DATE & TIME': 'កាលបរិច្ឆេទ និងម៉ោង',
    'AMOUNT': 'ចំនួនទឹកប្រាក់',
    'STATUS': 'ស្ថានភាព',
    'ACTIONS': 'សកម្មភាព',
    'Loading booking data...': 'កំពុងផ្ទុកទិន្នន័យការកក់...',
    'No bookings match the current filters.': 'មិនមានការកក់ត្រូវនឹងតម្រងបច្ចុប្បន្នទេ។',
    'Showing': 'កំពុងបង្ហាញ',
    'of': 'ក្នុងចំណោម',
    'results': 'លទ្ធផល',
    'Rows per page': 'ចំនួនជួរ/ទំព័រ',
    'Next': 'បន្ទាប់',
    'This Week': 'សប្ដាហ៍នេះ',
    'This Month': 'ខែនេះ',
    'All Time': 'គ្រប់ពេល',
    'View all': 'មើលទាំងអស់',
    'Booking Performance': 'ប្រសិទ្ធភាពការកក់',
    'Latest Reviews': 'ការវាយតម្លៃថ្មីៗ',
    'Monitor booking execution, cleaner output, and operational status trends.': 'តាមដានការអនុវត្តការកក់ លទ្ធផលអ្នកសម្អាត និងនិន្នាការស្ថានភាពប្រតិបត្តិការ។',
    'Performance Window': 'រយៈពេលវាយតម្លៃប្រសិទ្ធភាព',
    'Track revenue flow, paid bookings, and the services driving income.': 'តាមដានលំហូរចំណូល ការកក់ដែលបានបង់ប្រាក់ និងសេវាកម្មដែលជំរុញចំណូល។',
    'Report Range': 'ជួររបាយការណ៍',
    'Add Cleaner': 'បន្ថែមអ្នកសម្អាត'
    ,
    'Failed to load settings': 'ផ្ទុកការកំណត់មិនបាន',
    'Could not load your admin preferences.': 'មិនអាចផ្ទុកចំណង់ចំណូលចិត្តអ្នកគ្រប់គ្រងបានទេ។',
    'Invalid image': 'រូបភាពមិនត្រឹមត្រូវ',
    'Please choose an image file.': 'សូមជ្រើសរើសឯកសាររូបភាព។',
    'Profile image updated': 'បានធ្វើបច្ចុប្បន្នភាពរូបប្រវត្តិរូប',
    'Failed to update profile image': 'មិនអាចធ្វើបច្ចុប្បន្នភាពរូបប្រវត្តិរូប',
    'Unable to update profile image.': 'មិនអាចធ្វើបច្ចុប្បន្នភាពរូបប្រវត្តិរូបបានទេ។',
    'Please try again.': 'សូមព្យាយាមម្តងទៀត។',
    'Email is required': 'ត្រូវការអ៊ីមែល',
    'Profile updated successfully': 'បានធ្វើបច្ចុប្បន្នភាពប្រវត្តិរូបដោយជោគជ័យ',
    'Failed to update profile': 'មិនអាចធ្វើបច្ចុប្បន្នភាពប្រវត្តិរូប',
    'Preferences saved': 'បានរក្សាទុកការកំណត់',
    'Your admin preferences were updated successfully.': 'ចំណង់ចំណូលចិត្តអ្នកគ្រប់គ្រងត្រូវបានធ្វើបច្ចុប្បន្នភាពដោយជោគជ័យ។',
    'Failed to save preferences': 'មិនអាចរក្សាទុកការកំណត់',
    'All password fields are required': 'ត្រូវបំពេញវាលពាក្យសម្ងាត់ទាំងអស់',
    'New password must be at least 6 characters': 'ពាក្យសម្ងាត់ថ្មីត្រូវមានយ៉ាងតិច 6 តួអក្សរ',
    'Passwords do not match': 'ពាក្យសម្ងាត់មិនត្រូវគ្នា',
    'Password updated successfully': 'បានធ្វើបច្ចុប្បន្នភាពពាក្យសម្ងាត់ដោយជោគជ័យ',
    'Failed to update password': 'មិនអាចធ្វើបច្ចុប្បន្នភាពពាក្យសម្ងាត់'
    ,
    'Track transactions, payouts, and payment statuses.': 'តាមដានប្រតិបត្តិការ ការទូទាត់ និងស្ថានភាពការបង់ប្រាក់។',
    'View and manage admin, cleaner, and customer accounts.': 'មើល និងគ្រប់គ្រងគណនីអ្នកគ្រប់គ្រង អ្នកសម្អាត និងអតិថិជន។',
    'Manage your admin profile image and account details.': 'គ្រប់គ្រងរូបប្រវត្តិរូប និងព័ត៌មានគណនីអ្នកគ្រប់គ្រង។',
    'Upload profile image': 'ផ្ទុកឡើងរូបប្រវត្តិរូប'
  }
};

export const TranslationProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => normalizeLanguage(localStorage.getItem('language') || 'en'));

  useEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.lang = language;
  }, [language]);

  const t = (key) => keyTranslations[language]?.[key] || keyTranslations.en[key] || key;

  const ta = useMemo(() => {
    const phraseMap = adminPhraseTranslations[language] || {};
    const entries = Object.entries(phraseMap).sort((left, right) => right[0].length - left[0].length);

    return (text) => {
      if (typeof text !== 'string' || !text) return text;
      if (entries.length === 0) return text;

      let next = text;
      for (const [en, translated] of entries) {
        if (next.includes(en)) {
          next = next.split(en).join(translated);
        }
      }
      return next;
    };
  }, [language]);

  const changeLanguage = (lang) => {
    setLanguage(normalizeLanguage(lang));
  };

  return (
    <TranslationContext.Provider
      value={{
        language,
        isKhmer: language === 'km',
        t,
        ta,
        changeLanguage,
        translations: keyTranslations
      }}
    >
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
};
