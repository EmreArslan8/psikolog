/**
 * İşletme künyesi — tek kaynak.
 *
 * Ad, adres ve telefon (NAP) Google İşletme Profili ile HARFİ HARFİNE aynı
 * olmak zorundadır; yerel SEO'da tutarsızlık doğrudan sıralama kaybıdır.
 * Bu değerleri değiştirirken Google İşletme Profili'ni de güncelleyin.
 */

export const business = {
  name: 'Psikolog Selin Ünal',
  legalName: 'Psikolog Selin Ünal',
  role: 'Psikolog · Aile Danışmanı',

  email: 'psk.selinunal@gmail.com',
  instagram: 'https://www.instagram.com/psk.selinunal/',
  instagramHandle: '@psk.selinunal',

  phone: {
    display: '0542 131 78 94',
    href: 'tel:+905421317894',
    e164: '+905421317894',
    intl: '+90 542 131 78 94',
    whatsapp: 'https://wa.me/905421317894',
  },

  address: {
    street: 'Emek Mahallesi, Muradiye Caddesi, Gelincik Sokak No: 2/7',
    postalCode: '78600',
    district: 'Safranbolu',
    province: 'Karabük',
    country: 'TR',
    countryName: 'Türkiye',
    /** Kartlarda / footer'da kullanılan kısa gösterim */
    short: 'Emek Mah., Safranbolu / Karabük',
    /** Tam tek satır gösterim — Google profilindeki yazımla birebir */
    full: 'Emek Mahallesi, Muradiye Caddesi, Gelincik Sokak No: 2/7, 78600 Safranbolu / Karabük',
  },

  /**
   * Google Haritalar embed + yol tarifi sorgusu.
   * Kesin koordinat (lat/lng) profilden alındığında `geo` doldurulmalı;
   * yanlış koordinat girmek boş bırakmaktan kötüdür.
   */
  maps: {
    query: 'Psikolog Selin Ünal, Emek Mahallesi Muradiye Caddesi Gelincik Sokak No:2/7, 78600 Safranbolu/Karabük',
    geo: null as null | { lat: number; lng: number },
  },

  /** Google İşletme Profili ile aynı: Pzt–Cmt 10.00–19.00, Pazar kapalı */
  hours: {
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    opens: '10:00',
    closes: '19:00',
    display: 'Pazartesi–Cumartesi 10.00–19.00',
    displayShort: 'Pzt–Cmt 10.00–19.00',
    closedNote: 'Pazar kapalı',
  },

  /** Yüz yüze hizmet verilen yerleşimler — schema areaServed ve footer metni */
  serviceAreas: ['Safranbolu', 'Karabük', 'Eskipazar', 'Yenice', 'Eflani', 'Ovacık'],
} as const;

export const mapsEmbedUrl =
  `https://www.google.com/maps?q=${encodeURIComponent(business.maps.query)}&hl=tr&z=16&output=embed`;

export const mapsDirectionsUrl =
  `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(business.maps.query)}`;

/** schema.org PostalAddress — her sayfada aynı nesne kullanılsın diye burada */
export const postalAddress = {
  '@type': 'PostalAddress',
  streetAddress: business.address.street,
  postalCode: business.address.postalCode,
  addressLocality: business.address.district,
  addressRegion: business.address.province,
  addressCountry: business.address.country,
};

export const openingHoursSpecification = [
  {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: [...business.hours.days],
    opens: business.hours.opens,
    closes: business.hours.closes,
  },
];
