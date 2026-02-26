import type { BlogPost } from '../../types/blog';
import { IMAGES } from '../images';

const AMAZON_TAG = 'camperplann04-21';

const amazonUrl = (asin: string) => `https://www.amazon.co.uk/dp/${asin}?tag=${AMAZON_TAG}`;

const post: BlogPost = {
  slug: 'essential-campervan-gear',
  title: 'Essential Gear for Your European Campervan Adventure',
  description:
    'A practical, budget-conscious guide to the gear you actually need for a European campervan or motorhome trip — from safety equipment and kitchen essentials to solar panels and country-specific legal requirements.',
  author: 'CamperPlanning',
  publishedDate: '2026-02-26',
  category: 'vehicle-guides',
  tags: [
    'gear',
    'equipment',
    'packing-list',
    'campervan',
    'motorhome',
    'safety',
    'solar',
    'kitchen',
  ],
  readingTime: 14,
  heroImage: IMAGES.campervanGear.hero,
  relatedSlugs: ['motorhome-vs-campervan-guide', 'first-time-motorhome-guide-europe'],
  content: [
    // ── Introduction ──────────────────────────────────────────────
    {
      type: 'heading',
      level: 2,
      content: 'The Gear That Actually Matters',
    },
    {
      type: 'image',
      image: IMAGES.campervanGear.hero,
    },
    {
      type: 'paragraph',
      content:
        'Every campervan forum on the internet has a packing list. Most of them are absurdly long, filled with items you will never use, and written by people who apparently travel with a removal van trailing behind them. This guide is different. It covers the gear that genuinely makes a European trip safer, more comfortable, and less stressful -- based on what experienced travellers actually carry and what European law actually requires.',
    },
    {
      type: 'paragraph',
      content:
        'We have split everything into clear categories: safety equipment you legally need, kitchen essentials that earn their space, electrical and solar gear for off-grid freedom, navigation tools, comfort items that make the difference between surviving and thriving, and the country-specific legal requirements that catch out first-timers every year.',
    },
    {
      type: 'tip',
      content:
        'Where we mention specific products, we have included links to Amazon UK for convenience. These are affiliate links -- if you buy through them, we earn a small commission at no extra cost to you. It helps keep CamperPlanning free.',
    },

    // ── Safety Equipment ──────────────────────────────────────────
    {
      type: 'heading',
      level: 2,
      content: 'Safety Equipment',
    },
    {
      type: 'paragraph',
      content:
        'Safety gear is not optional -- much of it is a legal requirement in European countries and you can be fined on the spot for not carrying it. Even items that are not legally mandated in every country are worth having because you are driving a vehicle loaded with gas, electrics, and flammable soft furnishings.',
    },
    {
      type: 'heading',
      level: 3,
      content: 'Warning Triangle and Hi-Vis Vests',
    },
    {
      type: 'paragraph',
      content:
        'A <a href="' +
        amazonUrl('B08FX3MBSF') +
        '" target="_blank" rel="sponsored noopener noreferrer">warning triangle</a> is legally required in almost every European country. You must place it 30-100 metres behind your vehicle in the event of a breakdown. France, Spain, Italy, Austria, Germany, and most Eastern European countries all mandate carrying one. Some countries (Spain, for example) require two triangles if the vehicle is registered there.',
    },
    {
      type: 'paragraph',
      content:
        'Hi-visibility vests are mandatory for the driver and all passengers in France, Spain, Italy, Austria, Portugal, and Belgium. They must be inside the cabin -- not in the boot or garage -- because you need to put one on before exiting the vehicle at the roadside. Buy a <a href="' +
        amazonUrl('B07FKRHKP4') +
        '" target="_blank" rel="sponsored noopener noreferrer">multi-pack of hi-vis vests</a> and keep them in the glove box.',
    },
    {
      type: 'heading',
      level: 3,
      content: 'Fire Extinguisher and Fire Blanket',
    },
    {
      type: 'paragraph',
      content:
        'A compact <a href="' +
        amazonUrl('B00NPWP6GI') +
        '" target="_blank" rel="sponsored noopener noreferrer">dry powder fire extinguisher</a> (1 kg minimum) should be within easy reach of the cab. Cooking with gas in a confined space, combined with curtains and upholstery, makes a campervan fire a genuine risk. A fire blanket near the hob is equally important for smothering pan fires.',
    },
    {
      type: 'heading',
      level: 3,
      content: 'First Aid Kit',
    },
    {
      type: 'paragraph',
      content:
        'A <a href="' +
        amazonUrl('B08RS495MJ') +
        '" target="_blank" rel="sponsored noopener noreferrer">DIN 13164 first aid kit</a> is legally required in Germany, Austria, and several other countries. Even where not mandatory, carrying a proper kit is common sense. The DIN 13164 standard is the benchmark -- it includes bandages, dressings, gloves, scissors, and a foil blanket. Keep it accessible, not buried under luggage.',
    },
    {
      type: 'warning',
      content:
        'Check expiry dates on your first aid kit before each trip. Plasters and antiseptic wipes degrade over time. Many roadside checks will reject an out-of-date kit.',
    },
    {
      type: 'heading',
      level: 3,
      content: 'Carbon Monoxide and Gas Detectors',
    },
    {
      type: 'paragraph',
      content:
        'If your vehicle has a gas system (LPG hob, heater, or fridge), a <a href="' +
        amazonUrl('B0897NJP33') +
        '" target="_blank" rel="sponsored noopener noreferrer">carbon monoxide detector</a> is essential. CO is odourless and lethal. Mount it near sleeping areas. A separate LPG gas detector near floor level will catch leaks before they become dangerous. These are cheap, light, and potentially life-saving.',
    },

    // ── Kitchen Essentials ───────────────────────────────────────
    {
      type: 'heading',
      level: 2,
      content: 'Kitchen Essentials',
    },
    {
      type: 'paragraph',
      content:
        'The campervan kitchen is where you save the most money on a European trip. Eating out in France, Italy, or Scandinavia adds up fast. A well-equipped compact kitchen means you can eat well for a fraction of restaurant prices -- and cooking with fresh local produce from European markets is one of the genuine pleasures of van life.',
    },
    {
      type: 'heading',
      level: 3,
      content: 'Cooking Setup',
    },
    {
      type: 'paragraph',
      content:
        'If your van does not have a built-in hob, a <a href="' +
        amazonUrl('B0080VG7SU') +
        '" target="_blank" rel="sponsored noopener noreferrer">portable gas camping stove</a> is the most versatile option. Single-burner stoves that use standard EN417 gas cartridges are widely available, and replacement cartridges can be found in supermarkets and petrol stations across Europe. For longer trips or families, a twin-burner stove is worth the extra weight.',
    },
    {
      type: 'paragraph',
      content:
        'A compact set of nesting pots, a good frying pan, and a kettle cover most cooking needs. Look for hard-anodised aluminium sets designed for camping -- they are light, durable, and stack neatly. Add a sharp knife (kept safely in a blade guard), a wooden spoon, tongs, a tin opener, and a compact chopping board.',
    },
    {
      type: 'heading',
      level: 3,
      content: 'Water and Storage',
    },
    {
      type: 'paragraph',
      content:
        'A collapsible water container (10 litres) is invaluable for topping up your onboard tank from campsite taps. Collapsible washing-up bowls save space when not in use. Airtight food containers prevent smells and keep insects out -- particularly important in Mediterranean climates where ants will find any crumb within minutes.',
    },
    {
      type: 'tip',
      content:
        'Invest in a good insulated water bottle per person. Tap water is safe to drink in most of Western Europe, and refilling at campsite taps instead of buying bottled water saves money and plastic.',
    },

    // ── Electrical and Solar ─────────────────────────────────────
    {
      type: 'heading',
      level: 2,
      content: 'Electrical and Solar Gear',
    },
    {
      type: 'paragraph',
      content:
        'Electricity is the limiting factor for off-grid camping. If you rely on campsites with hookups, you need less gear. But if you want the freedom to park at aires, wild camp (where legal), or stay at basic sites without power, some form of independent electricity is transformative.',
    },
    {
      type: 'heading',
      level: 3,
      content: 'Portable Solar Panels',
    },
    {
      type: 'paragraph',
      content:
        'A foldable 100-120W solar panel is the sweet spot for most campervans. It generates enough power to keep a leisure battery topped up for lighting, phone charging, and running a compressor fridge. Panels in this range fold down to briefcase size and weigh 3-5 kg. Place them in direct sunlight during the day and store them inside overnight.',
    },
    {
      type: 'paragraph',
      content:
        'If you have roof space and plan to travel frequently, a permanently mounted rigid panel (100-200W) with a solar charge controller is a better long-term investment. Pair it with a lithium leisure battery (100Ah minimum) for reliable all-day power.',
    },
    {
      type: 'heading',
      level: 3,
      content: 'Power Stations and Inverters',
    },
    {
      type: 'paragraph',
      content:
        'Portable power stations (from brands like EcoFlow, Jackery, and Bluetti) have become popular as all-in-one solutions. A 500-1000Wh unit can charge laptops, phones, cameras, and run small appliances. They charge from solar panels, the vehicle cigarette lighter, or mains hookup. The downside is weight (5-10 kg) and cost, but for tech-heavy travellers they simplify the entire electrical setup.',
    },
    {
      type: 'heading',
      level: 3,
      content: 'Hookup Cable and Adapters',
    },
    {
      type: 'paragraph',
      content:
        'If you use campsite hookups, you need a standard CEE blue 16A hookup cable (25 metres is the safe minimum length). European campsites universally use this connector, but older sites in France and Southern Europe occasionally have non-standard sockets. Carry a mains adapter kit and a polarity tester -- reverse polarity is surprisingly common on European campsites and can damage sensitive electronics.',
    },

    // ── Navigation ───────────────────────────────────────────────
    {
      type: 'heading',
      level: 2,
      content: 'Navigation Tools',
    },
    {
      type: 'paragraph',
      content:
        'Your phone is an excellent navigation device, but it should not be your only one. Mobile signal can be patchy in mountain valleys, rural Scandinavia, and large parts of Southern and Eastern Europe. Battery life is also a concern on long driving days.',
    },
    {
      type: 'heading',
      level: 3,
      content: 'Dedicated Sat Nav',
    },
    {
      type: 'paragraph',
      content:
        'A dedicated sat nav with campervan or motorhome profiles (like the Garmin Camper series or TomTom GO Camper) is worth the investment. These devices let you enter your vehicle height, width, weight, and length, and then calculate routes that avoid low bridges, narrow roads, and weight-restricted zones. This is particularly important for motorhomes over 3 metres tall or 3,500 kg.',
    },
    {
      type: 'heading',
      level: 3,
      content: 'Offline Maps',
    },
    {
      type: 'paragraph',
      content:
        'Download offline maps for every country you plan to visit before you leave. Google Maps, Maps.me, and OsmAnd all support offline downloads. CamperPlanning works offline once loaded -- plan your route at a campsite with Wi-Fi and navigate from the cached data the next day.',
    },
    {
      type: 'paragraph',
      content:
        'A paper road atlas might seem old-fashioned, but it is genuinely useful for big-picture route planning and as a backup when electronics fail. The Michelin road atlas series covers all of Europe and costs less than a restaurant meal.',
    },

    // ── Comfort Items ────────────────────────────────────────────
    {
      type: 'heading',
      level: 2,
      content: 'Comfort Items That Earn Their Space',
    },
    {
      type: 'paragraph',
      content:
        'Space in a campervan is precious. Every item you bring must justify its weight and volume. These comfort items consistently prove their worth over thousands of kilometres.',
    },
    {
      type: 'heading',
      level: 3,
      content: 'Levelling Ramps',
    },
    {
      type: 'paragraph',
      content:
        'Very few pitches are perfectly flat. Sleeping on a slope is miserable, and a tilted fridge runs inefficiently. A set of <a href="' +
        amazonUrl('B003V58SBO') +
        '" target="_blank" rel="sponsored noopener noreferrer">Milenco levelling ramps</a> or <a href="' +
        amazonUrl('B00GX7LYGI') +
        '" target="_blank" rel="sponsored noopener noreferrer">Fiamma Level Up ramps</a> solves this instantly. Drive one side of the van onto the ramp, check with a spirit level, done. They are heavy but used every single night.',
    },
    {
      type: 'heading',
      level: 3,
      content: 'Outdoor Furniture',
    },
    {
      type: 'paragraph',
      content:
        'A pair of lightweight folding chairs and a small table transform a parking space into a living room. You will spend far more time sitting outside your van than inside it -- especially in Mediterranean climates. Look for camping chairs that pack small and weigh under 3 kg each. An awning or tarp provides shade and rain protection if your van does not have a built-in awning.',
    },
    {
      type: 'heading',
      level: 3,
      content: 'Bedding and Temperature Control',
    },
    {
      type: 'paragraph',
      content:
        'European temperatures vary wildly. Summer in Andalusia can hit 40 degrees; autumn in the Scottish Highlands drops to near freezing. A good sleeping bag rated to 5 degrees (or a duvet if you have the space) covers most conditions. Add a silk liner for extra warmth in cold weather and use it alone on hot nights.',
    },
    {
      type: 'paragraph',
      content:
        'Thermal window covers (internal silver screens or external insulated covers) make a huge difference. They block light for sleeping in, retain heat on cold mornings, and keep the interior cool in summer. Custom-cut covers for your specific van model are worth the premium over universal reflective sheets.',
    },
    {
      type: 'heading',
      level: 3,
      content: 'Portable Toilet',
    },
    {
      type: 'paragraph',
      content:
        'If your van does not have a built-in toilet, a compact portable cassette toilet is worth considering for overnight stops where facilities are not available. Models from Thetford and Dometic are the established brands. Even if you never use it at a campsite, it provides peace of mind at aires and motorhome stopovers where the nearest toilet block might be a long walk away at 3am.',
    },

    // ── Country-Specific Requirements ────────────────────────────
    {
      type: 'heading',
      level: 2,
      content: 'Country-Specific Legal Requirements',
    },
    {
      type: 'paragraph',
      content:
        'European driving regulations vary by country, and police in many nations carry out roadside checks where they inspect your vehicle for mandatory equipment. Fines are issued on the spot and can be substantial. This section covers the items most likely to catch out British and Northern European travellers heading south.',
    },
    {
      type: 'heading',
      level: 3,
      content: 'France',
    },
    {
      type: 'list',
      items: [
        'Warning triangle: mandatory',
        'Hi-vis vest: mandatory for every occupant (must be inside the cabin)',
        'Headlamp beam deflectors or adjustment: required for right-hand-drive vehicles (to prevent dazzle)',
        'Breathalyser: technically still required by law, though the fine for not carrying one was suspended. Carry one anyway -- they cost almost nothing',
        "Crit'Air vignette: required for driving in low-emission zones in Paris, Lyon, Strasbourg, and other cities. Order online at certificat-air.gouv.fr before you travel",
      ],
    },
    {
      type: 'heading',
      level: 3,
      content: 'Spain',
    },
    {
      type: 'list',
      items: [
        'Two warning triangles: mandatory for Spanish-registered vehicles. Foreign vehicles need one, but carrying two is advisable',
        'Hi-vis vest: mandatory',
        'Spare wheel or tyre repair kit: recommended',
        'Headlamp beam deflectors: required for right-hand-drive vehicles',
        'DGT sticker: new low-emission zone regulations are expanding in Barcelona, Madrid, and other cities. Check current rules before arrival',
      ],
    },
    {
      type: 'heading',
      level: 3,
      content: 'Germany and Austria',
    },
    {
      type: 'list',
      items: [
        'First aid kit (DIN 13164): mandatory in both countries',
        'Warning triangle: mandatory',
        'Hi-vis vest: mandatory in Austria; recommended in Germany',
        'Austria motorway vignette: mandatory for all motorways. Available at border petrol stations or online at asfinag.at. Digital vignette available. Fine for not displaying one is EUR 120+',
        'Germany Umweltplakette (emission sticker): required for environmental zones in most German cities. Order online before you travel',
      ],
    },
    {
      type: 'heading',
      level: 3,
      content: 'Italy',
    },
    {
      type: 'list',
      items: [
        'Warning triangle: mandatory',
        'Hi-vis vest: mandatory',
        'Headlamp beam deflectors: required for right-hand-drive vehicles',
        'ZTL zones: many Italian city centres have restricted traffic zones (Zona Traffico Limitato). Driving into one without a permit triggers an automatic fine from cameras. Research ZTL zones for every city you plan to visit. This catches out thousands of tourists every year',
      ],
    },
    {
      type: 'heading',
      level: 3,
      content: 'Switzerland and Scandinavia',
    },
    {
      type: 'list',
      items: [
        'Switzerland motorway vignette: CHF 40, valid for one calendar year. Mandatory for all motorways. Available at border crossings or online at e-vignette.ch',
        'Norway: no vignette, but toll roads are common and charged automatically via AutoPASS (register at autopass.no for a visitor account or charges are sent to your registered address)',
        'Sweden: congestion charges in Stockholm and Gothenburg are automatic. Register your vehicle for foreign-registered cars at transportstyrelsen.se',
        'Winter tyres: mandatory in several Nordic countries from October to April. Check specific dates and rules for each country before winter travel',
      ],
    },
    {
      type: 'warning',
      content:
        'Country regulations change frequently. Always verify current requirements with the relevant national motoring authority or the RAC/AA European driving guides before you travel. The information above was accurate at time of writing (February 2026) but may not reflect recent changes.',
    },

    // ── The Essential Packing Checklist ──────────────────────────
    {
      type: 'heading',
      level: 2,
      content: 'The Essential Packing Checklist',
    },
    {
      type: 'paragraph',
      content:
        'Here is a condensed checklist of everything covered in this guide. Print it, tick items off as you pack, and resist the temptation to add everything else you see in camping shops.',
    },
    {
      type: 'heading',
      level: 3,
      content: 'Safety (Non-Negotiable)',
    },
    {
      type: 'list',
      items: [
        'Warning triangle (two if visiting Spain)',
        'Hi-vis vests for every occupant',
        'Fire extinguisher (1 kg dry powder)',
        'Fire blanket',
        'First aid kit (DIN 13164 standard)',
        'Carbon monoxide detector',
        'LPG gas detector (if gas system fitted)',
      ],
    },
    {
      type: 'heading',
      level: 3,
      content: 'Kitchen',
    },
    {
      type: 'list',
      items: [
        'Portable gas stove (if no built-in hob)',
        'Gas cartridges (EN417 standard)',
        'Nesting pot and pan set',
        'Kettle',
        'Sharp knife with blade guard',
        'Chopping board, wooden spoon, tongs, tin opener',
        'Collapsible water container (10L)',
        'Collapsible washing-up bowl',
        'Airtight food containers',
        'Insulated water bottles',
      ],
    },
    {
      type: 'heading',
      level: 3,
      content: 'Electrical',
    },
    {
      type: 'list',
      items: [
        'CEE 16A hookup cable (25m)',
        'Mains adapter kit',
        'Polarity tester',
        'Portable solar panel (100W+) or power station',
        'USB charging cables and multi-adapter',
        'LED torch or headlamp',
      ],
    },
    {
      type: 'heading',
      level: 3,
      content: 'Navigation',
    },
    {
      type: 'list',
      items: [
        'Dedicated sat nav with vehicle profile (or phone mount)',
        'Offline maps downloaded for all countries',
        'Paper road atlas as backup',
        'Phone mount for dashboard',
      ],
    },
    {
      type: 'heading',
      level: 3,
      content: 'Comfort',
    },
    {
      type: 'list',
      items: [
        'Levelling ramps',
        'Spirit level',
        'Folding chairs (x2) and small table',
        'Sleeping bags or duvet',
        'Silk liner',
        'Thermal window covers',
        'Portable toilet (if no built-in)',
      ],
    },
    {
      type: 'heading',
      level: 3,
      content: 'Country-Specific',
    },
    {
      type: 'list',
      items: [
        'Headlamp beam deflectors (right-hand-drive vehicles)',
        'Motorway vignettes (Austria, Switzerland)',
        "Emission stickers (France Crit'Air, Germany Umweltplakette)",
        'Breathalyser (France)',
        'Vehicle registration document (V5C) and valid insurance green card',
        'International driving permit (if required for your licence type)',
      ],
    },

    // ── CTA ──────────────────────────────────────────────────────
    {
      type: 'heading',
      level: 2,
      content: 'Plan Your Route Around the Gear You Have',
    },
    {
      type: 'paragraph',
      content:
        'The right gear means nothing without the right route. A well-planned itinerary keeps you near water fill-up points, LPG refill stations, and campsites with the hookups you need. CamperPlanning lets you set your vehicle dimensions, find campsites along your route, and estimate fuel costs -- so you can focus on the trip, not the logistics.',
    },
    {
      type: 'cta',
      content:
        'Open the CamperPlanning route planner to start mapping your European adventure. Enter your vehicle profile, find campsites, and plan your stops. Free to use, no account required.',
    },
  ],
};

export default post;
