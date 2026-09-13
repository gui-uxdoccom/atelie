/**
 * i18n for the CUSTOMER-FACING pages only (/tamanho).
 *
 * Her three screens stay pt-BR — she's the only user of those, and translating
 * them would be work nobody reads.
 *
 * Four things change per locale, not one:
 *   1. strings
 *   2. text direction (ar is RTL)
 *   3. the SIZE LETTERS — the DB stores P/M/G (Portuguese). Showing a Saudi
 *      customer "G" for large is meaningless; she expects S/M/L.
 *   4. the SHOP NAMES in the sizing question. "Renner" is a Brazilian chain and
 *      means nothing in Riyadh. The question only works if it names a shop the
 *      person has actually bought clothes in.
 *
 * Arabic is written in MSA and addressed to a female customer throughout
 * (تعرفينه / تواصلي), which is correct for a swimwear shop. Have a native
 * speaker read it before it goes live — the grammar is sound but register and
 * warmth are what a translator earns their fee on.
 */

export const LOCALES = ['pt', 'en', 'ar'];
export const DEFAULT_LOCALE = 'pt';
export const RTL = new Set(['ar']);

export const LOCALE_NAMES = { pt: 'Português', en: 'English', ar: 'العربية' };

/** DB size value → what this locale's customer expects to see. */
const SIZE_LABELS = {
  pt: { P: 'P', M: 'M', G: 'G' },
  en: { P: 'S', M: 'M', G: 'L' },
  ar: { P: 'S', M: 'M', G: 'L' }, // Latin size letters are the GCC retail norm
};
export const sizeLabel = (size, locale = DEFAULT_LOCALE) =>
  SIZE_LABELS[locale]?.[size] ?? size;

export const isRtl = (locale) => RTL.has(locale);
export const dirOf = (locale) => (RTL.has(locale) ? 'rtl' : 'ltr');
export const htmlLang = { pt: 'pt-BR', en: 'en', ar: 'ar' };

/** Prices: AED either way, but grouping and placement differ. */
export function formatMoney(minor, currency = 'AED', locale = DEFAULT_LOCALE) {
  const tag = { pt: 'pt-BR', en: 'en-AE', ar: 'ar-AE' }[locale] ?? 'en';
  try {
    return new Intl.NumberFormat(tag, {
      style: 'currency', currency, maximumFractionDigits: 0,
      numberingSystem: 'latn', // Western digits — standard in Gulf commerce
    }).format(minor / 100);
  } catch {
    return `${currency} ${Math.round(minor / 100)}`;
  }
}

const S = {
  pt: {
    brand: 'ATELIÊ',
    q: (n, of) => `Pergunta ${n} de ${of}`,
    noPhoto: 'Sem foto e sem fita métrica — só o que você já sabe.',
    back: 'Voltar',
    resultTitle: (n) => `${n} ${n === 1 ? 'peça' : 'peças'} no seu tamanho`,
    yourSize: (t, b) => `Top ${t}  ·  Calcinha ${b}`,
    change: 'mudar',
    hidden: (n) => `Escondemos ${n} ${n === 1 ? 'peça que não temos' : 'peças que não temos'} no seu tamanho agora.`,
    talk: 'Falar com a loja',
    splitNote: 'Você provavelmente usa tamanhos diferentes em cima e embaixo — normal, e a gente vende separado.',
    unsure: 'Não deu pra ter certeza. Manda uma mensagem que a gente te ajuda.',
    none: 'Nada no seu tamanho agora',
    noneSub: 'Chega peça nova toda semana. Manda mensagem que a gente avisa você.',
  },
  en: {
    brand: 'ATELIÊ',
    q: (n, of) => `Question ${n} of ${of}`,
    noPhoto: 'No photo, no tape measure — just what you already know.',
    back: 'Back',
    resultTitle: (n) => `${n} ${n === 1 ? 'piece' : 'pieces'} in your size`,
    yourSize: (t, b) => `Top ${t}  ·  Bottom ${b}`,
    change: 'change',
    hidden: (n) => `We've hidden ${n} ${n === 1 ? 'piece' : 'pieces'} we don't have in your size right now.`,
    talk: 'Message the shop',
    splitNote: 'You most likely wear different sizes top and bottom — that’s common, and we sell them separately.',
    unsure: 'We couldn’t be certain. Send us a message and we’ll help.',
    none: 'Nothing in your size right now',
    noneSub: 'New pieces arrive every week. Message us and we’ll let you know.',
  },
  ar: {
    brand: 'ATELIÊ',
    q: (n, of) => `السؤال ${n} من ${of}`,
    noPhoto: 'بدون صورة وبدون شريط قياس — فقط ما تعرفينه بالفعل.',
    back: 'رجوع',
    resultTitle: (n) => (n === 1 ? 'قطعة واحدة بمقاسك' : `${n} قطع بمقاسك`),
    yourSize: (t, b) => `الأعلى ${t}  ·  الأسفل ${b}`,
    change: 'تغيير',
    hidden: (n) => `أخفينا ${n} ${n === 1 ? 'قطعة غير متوفرة' : 'قطع غير متوفرة'} بمقاسك حالياً.`,
    talk: 'تواصلي مع المتجر',
    splitNote: 'غالباً مقاسك مختلف بين الأعلى والأسفل — وهذا طبيعي، ونبيعهما منفصلين.',
    unsure: 'لم نتمكن من التأكد. راسلينا وسنساعدك.',
    none: 'لا يوجد شيء بمقاسك حالياً',
    noneSub: 'تصلنا قطع جديدة كل أسبوع. راسلينا وسنخبرك فور توفرها.',
  },
};

export const t = (locale) => S[locale] ?? S[DEFAULT_LOCALE];

/**
 * The four questions. Option VALUES are locale-independent (they go to the
 * sizing model); only labels and the named shops change.
 */
export function questions(locale = DEFAULT_LOCALE) {
  const L = locale;
  const sz = (s) => sizeLabel(s, L);

  const pick = (o) => o[L] ?? o.en ?? o.pt;

  return [
    {
      key: 'bra_band',
      q: pick({
        pt: 'Qual tamanho de sutiã você usa?',
        en: 'What bra size do you wear?',
        ar: 'ما مقاس حمالة الصدر التي ترتدينها؟',
      }),
      options: [
        { label: `36 / 38  (${sz('P')})`, value: 38 },
        { label: `40 / 42  (${sz('M')})`, value: 42 },
        { label: `44 / 46  (${sz('G')})`, value: 46 },
        { label: pick({ pt: 'Não sei dizer', en: 'I’m not sure', ar: 'لا أعرف' }), value: null },
      ],
    },
    {
      key: 'usual_size',
      // Naming a shop she has actually bought clothes in is the whole point.
      q: pick({
        pt: 'Que tamanho você usa na Zara / Renner?',
        en: 'What size do you wear at Zara / H&M?',
        ar: 'ما مقاسك في زارا / إتش آند إم؟',
      }),
      options: [
        { label: L === 'pt' ? 'P' : 'S', value: 'P' },
        { label: 'M', value: 'M' },
        { label: L === 'pt' ? 'G' : 'L', value: 'G' },
        { label: pick({ pt: 'Varia muito', en: 'It varies', ar: 'يختلف' }), value: null },
      ],
    },
    {
      key: 'height_cm',
      q: pick({ pt: 'Sua altura?', en: 'Your height?', ar: 'كم طولك؟' }),
      options:
        L === 'pt'
          ? [
              { label: 'menos de 1,60', value: 156 },
              { label: '1,60 – 1,70', value: 165 },
              { label: '1,70 – 1,78', value: 174 },
              { label: 'mais de 1,78', value: 182 },
            ]
          : [
              { label: pick({ en: 'under 160 cm', ar: 'أقل من 160 سم' }), value: 156 },
              { label: '160 – 170 cm', value: 165 },
              { label: '170 – 178 cm', value: 174 },
              { label: pick({ en: 'over 178 cm', ar: 'أكثر من 178 سم' }), value: 182 },
            ],
    },
    {
      key: 'weight_kg',
      q: pick({ pt: 'Seu peso, mais ou menos?', en: 'Roughly your weight?', ar: 'كم وزنك تقريباً؟' }),
      options: [
        { label: pick({ pt: 'menos de 55 kg', en: 'under 55 kg', ar: 'أقل من 55 كجم' }), value: 51 },
        { label: pick({ pt: '55 – 65 kg', en: '55 – 65 kg', ar: '55 – 65 كجم' }), value: 60 },
        { label: pick({ pt: '65 – 78 kg', en: '65 – 78 kg', ar: '65 – 78 كجم' }), value: 71 },
        { label: pick({ pt: 'mais de 78 kg', en: 'over 78 kg', ar: 'أكثر من 78 كجم' }), value: 84 },
      ],
    },
  ];
}

/** Pick a locale from ?l=, else the browser's Accept-Language, else pt. */
export function resolveLocale(searchParam, acceptLanguage = '') {
  if (LOCALES.includes(searchParam)) return searchParam;
  const wanted = acceptLanguage
    .split(',')
    .map((p) => p.split(';')[0].trim().toLowerCase())
    .filter(Boolean);
  for (const w of wanted) {
    if (w.startsWith('pt')) return 'pt';
    if (w.startsWith('ar')) return 'ar';
    if (w.startsWith('en')) return 'en';
  }
  return DEFAULT_LOCALE;
}
