import officeImage from '../assets/office.png';
import homeImage from '../assets/home.png';
import windowImage from '../assets/window.png';
import constructionImage from '../assets/Construction Cleaning.png';
import customerHomeImage from '../assets/customer_home.png';
import carpetImage from '../assets/Carpet.png';
import floorBuffingImage from '../assets/Floor Buffing.png';
import deepCleaningImage from '../assets/Deep.png';
import homesServiceImage from '../assets/Homes .png';
import airConditioningImage from '../assets/co.png';
import moveImage from '../assets/move.png';
import shopImage from '../assets/shop.png';
import proImage from '../assets/pro.png';

const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const API_BASE_URL = rawApiBaseUrl.endsWith('/api') ? rawApiBaseUrl.slice(0, -4) : rawApiBaseUrl;

const getFirstText = (...values) => {
  for (const value of values) {
    const text = String(value || '').trim();
    if (text) return text;
  }
  return '';
};

const getRawServiceImage = (item) => getFirstText(
  item?.service?.image,
  item?.service_image,
  item?.serviceImage,
  item?.image,
  item?.imageUrl,
  item?.image_url
);

export const toAbsoluteImageUrl = (imageUrl) => {
  const normalized = String(imageUrl || '').replace(/\\/g, '/').trim();
  if (!normalized) return '';
  if (/^https?:\/\//i.test(normalized) || normalized.startsWith('data:')) return normalized;
  return `${API_BASE_URL}${normalized.startsWith('/') ? '' : '/'}${normalized}`;
};

export const getServiceDisplayName = (item, fallback = 'Cleaning Service') => {
  const serviceName = getFirstText(
    item?.service?.name,
    item?.service_name,
    item?.serviceName,
    item?.serviceTitle,
    item?.title
  );

  if (!serviceName || serviceName.toLowerCase() === 'cleaning job') {
    return fallback;
  }

  return serviceName;
};

export const getServiceTypeHint = (item, fallback = '') => getFirstText(
  item?.serviceType,
  item?.service_type,
  item?.service?.description,
  item?.service_description,
  fallback
);

export const getServiceDisplayImage = (item) => {
  const apiImage = toAbsoluteImageUrl(getRawServiceImage(item));
  if (apiImage) return apiImage;

  const title = getServiceDisplayName(item, '').toLowerCase();
  const serviceType = getServiceTypeHint(item).toLowerCase();

  if (title.includes('carpet') || serviceType.includes('carpet')) return carpetImage;
  if (title.includes('floor buff') || title.includes('pressure wash') || serviceType.includes('floor')) return floorBuffingImage;
  if (title.includes('air') || title.includes('conditioning') || serviceType.includes('air')) return airConditioningImage;
  if (title.includes('deep')) return deepCleaningImage;
  if (title.includes('move')) return moveImage;
  if (title.includes('shop')) return shopImage;
  if (title.includes('pro')) return proImage;
  if (title.includes('homes & offices') || title.includes('home') || title.includes('house') || serviceType.includes('home')) return homesServiceImage;
  if (title.includes('office') || serviceType.includes('office')) return officeImage;
  if (title.includes('window') || serviceType.includes('window')) return windowImage;
  if (title.includes('construction') || serviceType.includes('construction')) return constructionImage;
  if (title.includes('customer') || serviceType.includes('customer')) return customerHomeImage;

  return homeImage;
};
