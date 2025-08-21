// ==== File: app/data/symptomDescriptions.js ====
// Export a mapping of symptom keys to friendly Swahili descriptions and quick advice.
// Usage: import { getSymptomDescription, formatSymptomKey } from './data/symptomDescriptions';

export const SYMPTOM_DESCRIPTIONS = {
  ugonjwa: {
    title: 'Ugonjwa (jumla)',
    short: 'Dalili zinazoonyesha kuna shida ya kiafya. Chunguza dalili maalum hapa chini.',
    details: 'Hii ni neno la jumla linalomaanisha kuna hali isiyo ya kawaida ya kiafya. Angalia dalili maalum kama homa, kukohoa, au maumivu kwa usahihi zaidi.',
    whenToSeeDoctor: 'Ikiwa dalili zinaendelea au ni kubwa, wasiliana na mtaalamu wa afya.'
  },

  homa: {
    title: 'Homa (joto la mwili)',
    short: 'Mwili una joto kupita kawaida, mara nyingi kutokana na maambukizi.',
    details: 'Homa inaweza kuonyesha maambukizi ya viini au virusi. Angalia joto kwa kipimo na dalili za kuambukiza kama kukohoa au homa kali.',
    whenToSeeDoctor: 'Tafuta msaada ikiwa homa ni >39°C, haiishi kwa siku 3, au iwapo kuna hali za hatari (kama ugonjwa wa moyo, watoto wadogo, au wazee).'
  },

  homa_kali: {
    title: 'Homa kali',
    short: 'Joto la mwili lisilo la kawaida, linaweza kuhitaji huduma ya haraka.',
    details: 'Hii ni homa ya kiwango cha juu ambayo inaweza kusababisha kutokwa na jasho nyingi, kuhisi jasho kali, au kutapika.',
    whenToSeeDoctor: 'Nenda hospitali au kliniki mara moja ikiwa joto ni >39°C au kuna kutokwa na fahamu.'
  },

  baridi: {
    title: 'Baridi / Kukae kwenye baridi',
    short: 'Hisia ya baridi au kutetemeka—mara nyingi inafuata homa au maambukizi.',
    details: 'Baridi mara nyingi inakuja kabla au baada ya homa. Inaweza kuhitaji kupumzika, kunywa maji, na kufuatilia joto.',
    whenToSeeDoctor: 'Ikiwa inaambatana na ugumu wa kupumua au dalili mbaya, tafuta daktari.'
  },

  maumivu_ya_kichwa: {
    title: 'Maumivu ya kichwa (homa ya kichwa)',
    short: 'Maumivu au shinikizo kichwani; aina zinaweza kutofautiana.',
    details: 'Inaweza kuwa migraine, msongo, au dalili ya homa/maambukizi. Angalia nguvu, mahali, na kuambatana na dalili nyingine.',
    whenToSeeDoctor: 'Tafuta msaada ikiwa maumivu ni makali, yakitokana na kuanguka, au yanaambatana na udhaifu wa mwili.'
  },

  maumivu_makali_ya_misuli: {
    title: 'Maumivu makali ya misuli',
    short: 'Maumivu ya ndani ya misuli, yanaweza kuhusiana na maambukizi au shughuli ngumu.',
    details: 'Pumzika, tumia compress, na weka tahadhari ikiwa kuna uvimbe au utofauti wa mkao.',
    whenToSeeDoctor: 'Ikiwa maumivu ni sugu au yanapoteza uwezo wa kutumia sehemu husika, wasiliana na mtaalamu.'
  },

  maumivu_ya_viungo: {
    title: 'Maumivu ya viungo',
    short: 'Maumivu katika viungo (mifupa au viungo), inaweza kuwa arthiritis au majeraha.',
    details: 'Angalia uvimbe, joto, au kuharibika kwa mwendo. Daktari anaweza kupendekeza vipimo au tiba.',
    whenToSeeDoctor: 'Tafuta msaada ikiwa kuna maumivu makali, kuvimba, au kushindwa kutembea/kuvunja.'
  },

  upele: {
    title: 'Upele (ngozi)',
    short: 'Mabadiliko ya ngozi kama madoa, vidonda, au vipele.',
    details: 'Upele unaweza kutokana na mnyororo wa mzio, maambukizi, au magonjwa ya ngozi. Angalia kama una maambukizi (chembechembe, harufu).',
    whenToSeeDoctor: 'Ikiwa upele unaenea, una maumivu, au msumari/tega, tafuta daktari.'
  },

  macho_kuwasha_na_wekundu: {
    title: 'Macho kuwasha na wekundu',
    short: 'Kuungua, kuwasha, au kutoa macho maji.',
    details: 'Inaweza kuwa conjunctivitis (ama viral, bacterial, au allergic). Usiguse macho, fisshera na safisha kwa maji safi.',
    whenToSeeDoctor: 'Ikiwa maono yanachanganyikiwa, maumivu makali, au uingizaji wa madoa, tafuta huduma.'
  },

  kikohozi: {
    title: 'Kikohozi',
    short: 'Kikohozi chochote, kikohozi kavu au chenye unyevu.',
    details: 'Angalia uimara, uvimbe wa koo, au kama kikohozi kina mkojo wa damu.',
    whenToSeeDoctor: 'Ikiwa kikohozi ni sugu >2 wiki, kina damu, au una shida ya kupumua, tafuta daktari.'
  },

  kikohozi_kisichoisha: {
    title: 'Kikohozi kisichoisha',
    short: 'Kikohozi kisichoisha au kinachorudia mara kwa mara.',
    details: 'Hii inaweza kuonyesha maambukizi sugu, bronchitis, au matatizo ya mapafu.',
    whenToSeeDoctor: 'Tafuta huduma ikiwa kinaendelea, kuna maumivu ya kifua, au kupumua kwa shida.'
  },

  kupumua_kwa_shida: {
    title: 'Kupumua kwa shida',
    short: 'Kushindwa kupumua vizuri, kupumua kwa haraka, au kupumua kwa njaa ya hewa.',
    details: 'Hii ni dalili ya hatari; inaweza kuwa asthama, pneumonia, au tatizo la moyo.',
    whenToSeeDoctor: 'Nenda hospitali kwa haraka ikiwa una kupumua kwa shida, kizunguzungu, au rangi ya ngozi kubadilika.'
  },

  maumivu_ya_kifua: {
    title: 'Maumivu ya kifua',
    short: 'Maumivu au shinikizo kifua kinachoweza kuwa cha moyo au mapafu.',
    details: 'Tafadhali zingatia kama pain inaenea kwenye mkono au shingoni, au inaleta kizunguzungu.',
    whenToSeeDoctor: 'Ikiwa maumivu ni makali au kuna hisia ya kushindwa kupumua, pata msaada wa dharura.'
  },

  kutokwa_na_jasho_usiku: {
    title: 'Kutokwa na jasho usiku',
    short: 'Kuota jasho wakati wa kulala au wakati wa kupumzika.',
    details: 'Inaweza kuhusiana na infections, homa, au dawa. Chunguza mabadiliko ya uzito/chembe.',
    whenToSeeDoctor: 'Ikiwa ni sugu au inashangaza, wasiliana na daktari.'
  },

  kupungua_uzito: {
    title: 'Kupungua uzito (kutoa uzito)',
    short: 'Kupoteza uzito bila kufanya diets; inaweza kuwa ishara ya tatizo.',
    details: 'Angalia mabadiliko ya hamu, uchovu, au mkojo wenye rangi, na uchunguzi wa kina unahitajika.',
    whenToSeeDoctor: 'Tafuta uchunguzi wa daktari ikiwa kupungua uzito ni haraka au bila sababu.'
  },

  kukosa_hamu_ya_kula: {
    title: 'Kutokua na hamu ya kula',
    short: 'Kukohoa hamu ya kula, inaweza kuja na matatizo ya tumbo au kisaikolojia.',
    details: 'Fuatilia ikiwa kuna kutapika, maumivu ya tumbo, au dalili za kifo cha damu.',
    whenToSeeDoctor: 'Ikiwa ni sugu au inapelekea kupungua uzito, wasiliana na mtaalamu.'
  },

  maumivu_ya_tumbo: {
    title: 'Maumivu ya tumbo',
    short: 'Maumivu sehemu ya tumbo; aina inaweza kuwa cramp, sharp, au dull.',
    details: 'Angalia kama kuna kutapika, kuharisha, au damu kwenye kukojoa/choo.',
    whenToSeeDoctor: 'Ikiwa maumivu ni makali, kuna mkojo wa damu, au kuhisi uchungu wa ndani, tafuta huduma.'
  },

  kuhara_kwa_maji_mengi: {
    title: 'Kuhara kwa maji mengi',
    short: 'Kuzaa maji mengi kwenye njia ya haja ndogo—hatari kwa upungufu maji mwilini.',
    details: 'Kunywa maji, rafiki wa chumvi za rehydration, na kuangalia dalili za upungufu maji mwilini.',
    whenToSeeDoctor: 'Ikiwa ni sugu, kuna dalili za upungufu maji mwilini (kama matatizo ya akili), tafuta afya.'
  },

  kuhara_kunaodamu: {
    title: 'Kuhara yenye damu',
    short: 'Kuharisha mara kwa mara na damu katika kinyesi.',
    details: 'Hii inaweza kuwa ishara ya maambukizi, magonjwa ya tumbo, au jeraha. Mfanyiwa vipimo.',
    whenToSeeDoctor: 'Pata msaada haraka ikiwa kuna damu au dalili za dehydration.'
  },

  kutapika: {
    title: 'Kutapika',
    short: 'Kuondoa yaliyomo tumboni kwa njia ya mdomo.',
    details: 'Tumia mlo mdogo, kunywa maji kidogo kidogo, na pumzika.',
    whenToSeeDoctor: 'Ikiwa kutapika ni sugu, kuna damu, au huwezi kunywa maji, tafuta daktari.'
  },

  kichefuchefu: {
    title: 'Kichefuchefu',
    short: 'Hisia ya kutaka kutapika.',
    details: 'Inaweza kuja kabla ya kutapika au kutokana na matatizo ya tumbo.',
    whenToSeeDoctor: 'Ikiwa kichefuchefu ni sugu au kuna dalili za ugonjwa mkubwa, tafuta msaada.'
  },

  upungufu_wa_maji_mwilini: {
    title: 'Upungufu wa maji mwilini (dehydration)',
    short: 'Kuna upungufu wa maji mwilini kutokana na kuhara, kutapika, au kutokunywa maji.',
    details: 'Tafuta rehydration (ORS), kunywa maji, na upate huduma ikiwa hali ni mbaya.',
    whenToSeeDoctor: 'Ikiwa mgonjwa ni mtoto, mzee, au sehemu ya mwili inakuwa dhaifu, tafuta daktari.'
  },

  manjano_ya_macho_na_mwili: {
    title: 'Manjano ya macho na mwili (jaundice)',
    short: 'Rangi ya manjano kwenye macho, ngozi na mkojo weusi; inaashiria tatizo la ini.',
    details: 'Inaweza kuashiria maambukizi ya ini, au matatizo ya bile duct. Tafuta uchunguzi wa ini.',
    whenToSeeDoctor: 'Nenda hospitali kwa uchunguzi wa haraka.'
  },

  mkojo_mweusi: {
    title: 'Mkojo mweusi',
    short: 'Mkojo wenye rangi giza unaoweza kuashiria shida ya ini au damu iliyovunjika.',
    details: 'Angalia pamoja na manjano au maumivu ya tumbo juu.',
    whenToSeeDoctor: 'Nenda kwa uchunguzi wa haraka ikiwa unaona mkojo mweusi.'
  },

  mara_nyingi_kwenda_choo_kidogo: {
    title: 'Kuendelea kwenda chooni lakini kiasi kidogo',
    short: 'Hii inaweza kuonyesha maambukizi wa njia ya mkojo au matatizo ya kibofu.',
    details: 'Angalia maumivu wakati wa kukojoa, mkojo unaodumu, au mkojo wenye damu.',
    whenToSeeDoctor: 'Ikiwa kuna maumivu au mkojo unaodumu, pata uchunguzi.'
  },

  maumivu_wakati_wa_kukojoa: {
    title: 'Maumivu wakati wa kukojoa',
    short: 'Maumivu au kuwasha wakati wa kukojoa; kawaida ni kwa maambukizi ya mkojo.',
    details: 'Tafuta mabadiliko ya mkojo (harufu, rangi), na joto la mwili.',
    whenToSeeDoctor: 'Tafuta daktari ikiwa kuna damu au maumivu makali.'
  },

  maumivu_ya_ubavu: {
    title: 'Maumivu ya ubavu (pelvic pain)',
    short: 'Maumivu upande wa chini wa tumbo; kwa wanawake inaweza kuhusiana na mifumo ya uzazi.',
  }
}

export function formatSymptomKey(raw) {
  if (!raw) return '';
  return String(raw).replace(/\s+/g, '_').replace(/__+/g, '_').toLowerCase().replace(/[^a-z0-9_]/g, '');
}

export function getSymptomDescription(rawKey) {
  const key = formatSymptomKey(rawKey);
  return SYMPTOM_DESCRIPTIONS[key] || null;
}
