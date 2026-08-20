export const STORE_PHONE_INTL = '5541991543389';
export const STORE_PHONE_FORMATTED = '(41) 99154-3389';
export const STORE_CEP = '83420-001';
export const STORE_ADDRESS = 'Av. Dom Pedro II, 96 - Centro, Quatro Barras - PR, 83420-001';
export const STORE_EMAIL = 'planetacal4b@gmail.com';
export const STORE_INSTAGRAM_URL = 'https://www.instagram.com/planetacalcadosqb/';
export const STORE_INSTAGRAM_HANDLE = '@planetacalcadosqb';

export const getWhatsAppUrl = (message?: string): string => {
  const base = `https://wa.me/${STORE_PHONE_INTL}`;
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
};
