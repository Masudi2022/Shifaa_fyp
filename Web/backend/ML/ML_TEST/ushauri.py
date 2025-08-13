"""
ML/ML_TEST/ushauri.py
---------------------
Kifurushi cha ushauri wa kitabibu (kwa Kiswahili) kwa magonjwa yanayotambuliwa na
mfumo wa "smart doctor". Faili hili lina:

1) DATA: KAMUSI ya ushauri (ADVICE_DB) kwa kila ugonjwa
2) Utils: kazi/functons kuleta ushauri, kukagua jina, na kuunganisha na matokeo ya
   utabiri wa mfano (model predictions)

Kanusho (Disclaimer):
Huu ni msaada wa elimu/ushauri wa jumla tu. Hauchukui nafasi ya daktari halisi.
Mtumiaji anapaswa kumwona mtaalamu wa afya kwa uchunguzi na tiba kamili, hasa
ikiwa kuna DALILI ZA HATARI zilizoainishwa hapa.
"""
from __future__ import annotations
from typing import Dict, Any, List

from rapidfuzz import process, fuzz

# ==========================
#  Core Advice Knowledgebase
# ==========================
# NOTE: Make sure keys match (or are close to) the labels your model outputs.
# Add additional keys/aliases under 'majina_mengine' if your model uses synonyms.
ADVICE_DB: Dict[str, Dict[str, Any]] = {
    "Malaria": {
        "majina_mengine": ["Homa ya mbu", "malaria"],
        "maelezo_fupi": (
            "Malaria husababishwa na vimelea (Plasmodium) vinavyoenezwa na kung'atwa na mbu. "
            "Huleta homa, baridi/kutetemeka, maumivu ya kichwa, uchovu, kichefuchefu na kutapika."
        ),
        "dalili_za_kuangalia": [
            "Homa inayoanza ghafla na kutetemeka",
            "Maumivu ya kichwa na misuli",
            "Kichefuchefu/kutapika",
        ],
        "vipimo": ["RDT (rapid diagnostic test)", "Blood smear (thick & thin)", "FBC"],
        "tiba": ["ACT (artemisinin-based combination therapy) kama ilivyoelekezwa", "Paracetamol kwa homa"],
        "kinga": ["Matumizi ya chandarua imara (LLIN)", "Ondoa maji yaliyotuama"],
        "ushauri_wa_nyumbani": ["Pumzika, kunywa maji mengi, fuata dozi ya dawa"],
        "dalili_za_hatari": ["Kupumua kwa shida", "Kuchanganyikiwa", "Kutapika kila kitu"],
        "tafadhali_kumbuka": "Usibadilishe dawa bila ushauri wa daktari, wajawazito wanahitaji hakikisho la haraka.",
    },

    "Kifua_Kikuu": {
        "majina_mengine": ["TB", "Kifua kikuu"],
        "maelezo_fupi": (
            "Kifua kikuu (TB) ni maambukizi ya bakteria yanayoathiri mapafu na mara nyingine tishu nyingine. "
            "Huleta kikohozi kisichoisha, homa ya muda mrefu, jasho la usiku na kupungua uzito."
        ),
        "dalili_za_kuangalia": ["Kikohozi cha wiki kadhaa", "Kupungua uzito", "Jasho la usiku"],
        "vipimo": ["Sputum AFB/GeneXpert", "X-ray ya kifua"],
        "tiba": ["Dawa maalumu za TB kwa miezi mingi (fuata mwongozo)", "Ufuatiliaji wa kliniki"],
        "kinga": ["Pima mapema, chanjo ya BCG kwa watoto", "Epuka msongamano wa watu ikiwa mgonjwa hana matibabu"] ,
        "ushauri_wa_nyumbani": ["Pumzika, lishe bora, funika mdomo unapokohoa"],
        "dalili_za_hatari": ["Kupumua kwa shida", "Damu ndani ya makohozi"],
    },

    "Homa_ya_Dengue": {
        "majina_mengine": ["Dengue"],
        "maelezo_fupi": (
            "Dengue ni ugonjwa unaosababishwa na virusi vinavyoenezwa na mbu Aedes. "
            "Huleta homa, maumivu makali ya misuli/viungo, maumivu ya kichwa na upele."
        ),
        "dalili_za_kuangalia": ["Homa ya juu", "Maumivu makali ya mwili", "Upele"],
        "vipimo": ["NS1/IgM/IgG (rapid/ELISA)", "FBC kuangalia platelets"],
        "tiba": ["Udhibiti wa dalili (paracetamol), maji mengi, ufuatiliaji wa karibu"],
        "kinga": ["Kuzuia kung'atwa na mbu, chandarua"],
        "ushauri_wa_nyumbani": ["Kunywa maji, pumzika, epuka aspirin/NSAIDs bila ushauri"],
        "dalili_za_hatari": ["Kutokwa damu kirahisi", "Maumivu makali ya tumbo", "Kizunguzungu kikubwa"],
    },

    "Kichocho": {
        "majina_mengine": ["Schistosomiasis", "kichocho"],
        "maelezo_fupi": (
            "Kichocho ni maambukizi ya vimelea yanayotokana na maji machafu; huonyesha mkojo wenye damu au matatizo ya tumbo."
        ),
        "dalili_za_kuangalia": ["Mkojo wenye damu", "Maumivu wakati wa kukojoa", "Kuhepa/kuhara"],
        "vipimo": ["Sampuli ya mkojo/kinyesi kuangalia mayai"],
        "tiba": ["Praziquantel kama ilivyoelekezwa na mtaalamu"],
        "kinga": ["Epuka kuogelea katika maji yasiyo salama", "Usafi wa maji"] ,
        "ushauri_wa_nyumbani": ["Kunywa maji safi, ripoti dalili mapema"],
        "dalili_za_hatari": ["Kukosa hamu ya kula, damu nyingi kwenye mkojo/kinyesi"],
    },

    "Kichocho_cha_Tumbo": {
        "majina_mengine": ["Amebiasis", "Giardiasis", "kichocho cha tumbo"],
        "maelezo_fupi": "Maambukizi ya vimelea kwenye utumbo yanayosababisha kuharisha, maumivu ya tumbo na mara nyingine damu katika kinyesi.",
        "dalili_za_kuangalia": ["Kuharisha", "Maumivu ya tumbo", "Kinyesi chenye damu"],
        "vipimo": ["Sampuli ya kinyesi (O&P)", "Antigen tests"],
        "tiba": ["Metronidazole/tinidazole kwa utambuzi sahihi", "Rehydration (ORS)"],
        "kinga": ["Maji safi, usafi wa chakula"],
    },

    "Trikomonasi": {
        "majina_mengine": ["Trichomoniasis", "trikomonasi"],
        "maelezo_fupi": "Maambukizi ya zinaa yanayosababisha uchafu na kuwasha sehemu za siri; kwa wanawake dalili zaidi huonekana.",
        "dalili_za_kuangalia": ["Uchafu wa uke wenye harufu", "Muwasho/kuwasha"],
        "vipimo": ["Microscopy/NAAT ya majimaji ya uke/urethra"],
        "tiba": ["Metronidazole/Tinidazole kwa mtaalamu"] ,
        "kinga": ["Condom, upimaji wa wenza"],
    },

    "Maambukizi_ya_Njia_ya_Mkojo": {
        "majina_mengine": ["UTI", "maambukizi ya njia ya mkojo"],
        "maelezo_fupi": "Maambukizi ya njia ya mkojo yanayoleta kuungua wakati wa kukojoa, mkojo wa rangi isiyo ya kawaida na kwenda mara nyingi.",
        "dalili_za_kuangalia": ["Kuungua wakati wa kukojoa", "Kwenda mara nyingi kidogo"],
        "vipimo": ["Urinalysis (dipstick)", "Urine culture"] ,
        "tiba": ["Antibiotiki inayofaa kwa ushauri wa daktari"],
        "kinga": ["Kunywa maji mengi", "Kusafisha vizuri baada ya kukojoa"] ,
    },

    "Kaswende": {
        "majina_mengine": ["Syphilis", "kaswende"],
        "maelezo_fupi": "Maambukizi ya zinaa yanayoweza kuathiri viungo vingi ikiwa hayatatibiwa.",
        "dalili_za_kuangalia": ["Kidonda kisicho na maumivu", "Upele"],
        "vipimo": ["RPR/VDRL + TPHA/FTA-ABS"],
        "tiba": ["Penicillin (benzathine) kama inavyopendekezwa"],
        "kinga": ["Condom, upimaji wa mara kwa mara"],
    },

    # Additional shorter entries for diseases seen in dataset samples
    "Homa_ya_Matumbo": {
        "majina_mengine": ["Homa ya tumbo"],
        "maelezo_fupi": "Homa inayohusiana na dalili za utumbo (kuharisha, maumivu).",
        "dalili_za_kuangalia": ["Kuharisha", "Maumivu ya tumbo"],
        "vipimo": ["Sampuli ya kinyesi"],
        "tiba": ["Rehydration, dawa za vimelea kama ilivyoelekezwa"]
    },

    "Homa_ya_Ini_A": {"majina_mengine": ["Homa ya ini A"], "maelezo_fupi": "Homa ya ini A - maelezo ya awali.", "dalili_za_kuangalia": ["Manjano"], "vipimo": ["LFTs"], "tiba": ["Tiba ya msaada"]},
    "Homa_ya_Ini_B": {"majina_mengine": ["Homa ya ini B"], "maelezo_fupi": "Homa ya ini B - maelezo ya awali.", "dalili_za_kuangalia": ["Manjano"], "vipimo": ["HBsAg/serology"], "tiba": ["Ufuatiliaji wa kliniki"]},
    "Kisonono": {"majina_mengine": ["gonorrhea", "kisonono"], "maelezo_fupi": "Maambukizi ya zinaa (gonorrhea).", "dalili_za_kuangalia": ["Kutokwa/uchafu"], "vipimo": ["NAAT"], "tiba": ["Antibiotics kama mwongozo"]},
    "Malaria_Severe": {"majina_mengine": ["Malaria kali"], "maelezo_fupi": "Malaria kali - tibu haraka.", "dalili_za_kuangalia": ["Kuchanganyikiwa", "Kutapika kila kitu"], "vipimo": ["RDT/Blood smear"], "tiba": ["Huduma ya dharura"]},
}

# ==========================
#  Defaults & Utilities
# ==========================
DEFAULT_ADVICE = {
    "maelezo_fupi": (
        "Ugonjwa huu unahitaji uchunguzi na ushauri wa daktari. Tafadhali wasiliana na kituo cha afya kwa tathmini kamili."
    ),
    "dalili_za_hatari": [
        "Kuchanganyikiwa, kupoteza fahamu, degedege",
        "Kupumua kwa shida, maumivu makali ya kifua/ tumbo",
        "Kutapika damu/kinyesi cheusi, damu nyingi mahali popote",
    ],
    "ushauri_wa_nyumbani": ["Kunywa maji ya kutosha, pumzika, na andika dalili zako muhimu (muda, ukali)."],
}

# build canonical lower->key map
_CANONICAL = {k.lower(): k for k in ADVICE_DB.keys()}


def _normalize_str(s: str) -> str:
    return (s or "").strip().lower()


def normalize_disease_name(name: str) -> str:
    """Return canonical ADVICE_DB key for `name` if possible.

    Strategies tried (in order):
      - exact key match
      - case-insensitive key match
      - underscore/space variants
      - synonyms listed under `majina_mengine`
      - fuzzy match against keys and synonyms (thresholds chosen to avoid false matches)
    """
    if not name:
        return name
    name_str = str(name).strip()
    # exact key
    if name_str in ADVICE_DB:
        return name_str
    low = _normalize_str(name_str)
    # case-insensitive direct
    if low in _CANONICAL:
        return _CANONICAL[low]
    # variants
    alt1 = name_str.replace(" ", "_")
    alt2 = name_str.replace("_", " ")
    if alt1 in ADVICE_DB:
        return alt1
    if alt2 in ADVICE_DB:
        return alt2
    # synonyms
    for k, v in ADVICE_DB.items():
        for syn in v.get("majina_mengine", []) or []:
            if _normalize_str(syn) == low:
                return k
    # fuzzy match against keys
    keys = list(ADVICE_DB.keys())
    if keys:
        best = process.extractOne(name_str, keys, scorer=fuzz.WRatio)
        if best:
            match_key, score, _ = best
            if score >= 86:
                return match_key
    # fuzzy match against synonyms
    syn_map = {}
    syn_list = []
    for k, v in ADVICE_DB.items():
        for syn in v.get("majina_mengine", []) or []:
            if syn:
                syn_list.append(syn)
                syn_map[syn] = k
    if syn_list:
        best = process.extractOne(name_str, syn_list, scorer=fuzz.WRatio)
        if best:
            match_syn, score, _ = best
            if score >= 88:
                return syn_map.get(match_syn)
    # fallback to original name
    return name_str


def advice_for(disease: str) -> Dict[str, Any]:
    """Return canonical advice dict for a disease.

    Always returns a dict containing at least the DEFAULT_ADVICE keys and an 'ugonjwa' key.
    """
    dnorm = normalize_disease_name(disease)
    data = ADVICE_DB.get(dnorm)
    if data:
        # return a copy to avoid accidental modification
        out = {"ugonjwa": dnorm}
        out.update(data)
        return out
    # fallback: try case-insensitive match
    for k, v in ADVICE_DB.items():
        if _normalize_str(k) == _normalize_str(disease):
            out = {"ugonjwa": k}
            out.update(v)
            return out
    # final fallback: DEFAULT_ADVICE
    out = {"ugonjwa": disease}
    out.update(DEFAULT_ADVICE)
    return out


def enrich_predictions_with_advice(predictions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Enrich model predictions with advice objects.

    Input: [{"disease": "Malaria", "probability": 0.82}, ...]
    Output: [{"disease": "Malaria", "probability":0.82, "advice": {...}}, ...]
    """
    enriched: List[Dict[str, Any]] = []
    for p in predictions:
        dname = p.get("disease") or p.get("ugonjwa")
        adv = advice_for(dname)
        item = dict(p)  # copy
        # attach advice under a single key for compatibility
        item["advice"] = adv
        enriched.append(item)
    return enriched


# expose module-level variables for callers
__all__ = ["ADVICE_DB", "DEFAULT_ADVICE", "normalize_disease_name", "advice_for", "enrich_predictions_with_advice"]


# ==========================
#  Quick manual test when run directly
# ==========================
if __name__ == "__main__":
    samples = [
        {"disease": "Malaria", "probability": 0.82},
        {"disease": "Kifua_Kikuu", "probability": 0.73},
        {"disease": "Homa_ya_Dengue", "probability": 0.65},
        {"disease": "Kichocho", "probability": 0.61},
        {"disease": "Kichocho_cha_Tumbo", "probability": 0.58},
        {"disease": "Trikomonasi", "probability": 0.50},
        {"disease": "Maambukizi_ya_Njia_ya_Mkojo", "probability": 0.49},
        {"disease": "Kaswende", "probability": 0.44},
    ]

    enriched = enrich_predictions_with_advice(samples)
    for item in enriched:
        print("\n====", item["advice"]["ugonjwa"], f"({item['probability']:.1%})", "====")
        adv = item.get("advice", {})
        for k in [
            "maelezo_fupi",
            "dalili_za_kuangalia",
            "vipimo",
            "tiba",
            "kinga",
            "ushauri_wa_nyumbani",
            "dalili_za_hatari",
            "tafadhali_kumbuka",
        ]:
            if adv.get(k):
                print(f"- {k}:", adv.get(k))
