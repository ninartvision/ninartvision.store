/**
 * Ninart Vision — legal / merchant info (single source of truth).
 * Set identificationCode and legalAddress* from your registration certificate
 * before submitting to the bank for online payments.
 */
(function (global) {
  'use strict';

  global.NV_LEGAL = Object.freeze({
    brand: 'Ninart Vision',
    legalNameKa: 'შ.პ.ს. „ნინართ ვიჟენ"',
    legalNameEn: 'Ninart Vision LLC',
    /** 9-digit Georgian company identification code (ს/ნ) — update from registry */
    identificationCode: '',
    legalFormKa: 'შეზღუდული პასუხისმგებლობის საზოგადოება (შ.პ.ს.)',
    legalFormEn: 'Limited Liability Company (LLC)',
    legalAddressKa: 'საქართველო, ქ. თბილისი',
    legalAddressEn: 'Tbilisi, Georgia',
    directorKa: 'ნინი მჟავია',
    directorEn: 'Nini Mzhavia',
    phoneDisplay: '+995 579 388 833',
    phoneHref: '995579388833',
    email: 'ninartvision@gmail.com',
    website: 'https://ninartvision.store',
    lastUpdated: '2026-05-29',
    productDescriptionKa:
      'ორიგინალური ქართული ხელოვნება — ნახატები, ტაპისტრი და ხელოვნების ნამუშევრები ონლაინ მაღაზიით; შეკვეთა, მიწოდება და ონლაინ გადახდა.',
    productDescriptionEn:
      'Original Georgian art — paintings, tapestry and collectible artworks sold online with order fulfilment, delivery and online card payment.',
    paymentMethodsKa: [
      'Visa და Mastercard ბარათით ონლაინ გადახდა (TBC Bank / Bank of Georgia)',
      'ბანკის გადარიცხვა',
      'WhatsApp-ით შეთანხმებული გადახდა',
    ],
    paymentMethodsEn: [
      'Online card payment via Visa and Mastercard (TBC Bank / Bank of Georgia)',
      'Bank transfer',
      'Payment arranged via WhatsApp',
    ],
  });
})(typeof window !== 'undefined' ? window : globalThis);
