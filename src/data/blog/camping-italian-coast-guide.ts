import type { BlogPost } from '../../types/blog';
import { IMAGES } from '../images';

const post: BlogPost = {
  slug: 'camping-italian-coast-guide',
  title: 'Camping the Italian Coast: From Amalfi to Cinque Terre',
  description:
    "A complete guide to campervan and motorhome travel along Italy's stunning coastline, from the dramatic Amalfi Coast through Calabria and Puglia to the colourful villages of Cinque Terre, with practical advice on ZTL zones, soste, and narrow roads.",
  author: 'CamperPlanning',
  publishedDate: '2026-02-05',
  category: 'destination-guides',
  tags: ['italy', 'amalfi-coast', 'cinque-terre', 'coastal-camping', 'destination-guide'],
  readingTime: 13,
  heroImage: IMAGES.italianCoast.hero,
  relatedSlugs: ['best-camper-routes-southern-france', 'croatia-coastal-camping'],
  content: [
    // ── Introduction ──────────────────────────────────────────────
    {
      type: 'heading',
      level: 2,
      content: "Italy's Coast: Spectacular, Challenging, and Unforgettable",
    },
    {
      type: 'image',
      image: IMAGES.italianCoast.hero,
    },
    {
      type: 'paragraph',
      content:
        'Italy has over 7,600 kilometres of coastline, and much of it ranks among the most beautiful in Europe. From the vertiginous cliffs of the Amalfi Coast to the pastel-coloured fishing villages of the Ligurian Riviera, from the wild beaches of Sardinia to the Baroque seaside towns of Sicily, the Italian coast offers a lifetime of exploration. It is also one of the most rewarding -- and occasionally most challenging -- countries in Europe for campervan and motorhome travel.',
    },
    {
      type: 'paragraph',
      content:
        'The challenges are real. Italian coastal roads are often narrow, steep, and winding, with blind corners and no hard shoulder. Town centres are maze-like and frequently restricted by ZTL zones (Zona a Traffico Limitato) that will earn you an automatic fine if you enter without authorisation. Parking can be fiercely competitive in summer, and some of the most famous stretches of coast are genuinely unsuitable for large motorhomes. But with careful planning and the right vehicle, Italy rewards camper travellers with experiences no hotel-bound tourist will ever have.',
    },
    {
      type: 'paragraph',
      content:
        'This guide covers the major coastal regions from south to north, with specific advice on road conditions, campsites, soste (designated motorhome parking areas), and the practicalities of navigating Italian bureaucracy and driving culture.',
    },

    // ── Amalfi Coast ─────────────────────────────────────────────
    {
      type: 'heading',
      level: 2,
      content: 'The Amalfi Coast: Beautiful but Brutal',
    },
    {
      type: 'paragraph',
      content:
        'The Amalfi Coast between Sorrento and Salerno is arguably the most famous stretch of coastline in Europe, and it deserves every superlative. The SS163 Amalfitana road clings to sheer cliffs above the Tyrrhenian Sea, passing through tunnels carved from rock and villages that cascade down ravines to tiny harbours. The views are breathtaking. The driving is not.',
    },
    {
      type: 'warning',
      content:
        'The SS163 Amalfi Coast road is not suitable for motorhomes over 6 metres long or 2.1 metres wide. The road is extremely narrow with blind corners, overhanging buildings, and oncoming buses that take up the entire lane. Large vehicles are banned during peak summer hours. Even in a compact campervan, this road demands complete concentration.',
    },
    {
      type: 'paragraph',
      content:
        "The practical approach for camper travellers is to use the Amalfi Coast as a day-trip destination rather than a driving route. Base yourself at a campsite in Sorrento, Salerno, or Pompei and use the excellent SITA bus service or the ferry network to visit Amalfi, Positano, and Ravello without your vehicle. Campeggio Santa Fortunata in Sorrento has sea-view pitches and direct beach access. Camping Nube d'Argento near Sorrento offers terraced pitches among lemon groves with shuttle bus access to the town centre.",
    },
    {
      type: 'paragraph',
      content:
        'If you do drive the coast, go early in the morning (before 8am), use the smallest vehicle possible, and be prepared for lengthy reversing manoeuvres when you meet a tour bus on a single-track section. The western approach from Sorrento via Positano is slightly easier than the eastern approach from Salerno, as you will be on the cliff side of the road with better visibility.',
    },
    {
      type: 'tip',
      content:
        'The ferry from Salerno to Amalfi and Positano runs multiple times daily in summer and costs around 8-12 euros per person. It is by far the most relaxing and scenic way to experience the coast. Leave your vehicle at Salerno port car park (which accepts campervans) and enjoy the view from the deck.',
    },

    // ── Campania Region ──────────────────────────────────────────
    {
      type: 'heading',
      level: 2,
      content: 'Campania: Naples, Pompei, and the Islands',
    },
    {
      type: 'paragraph',
      content:
        'The broader Campania region offers far more camper-friendly options than the Amalfi road itself. Naples is chaotic but extraordinary -- park at a campsite on the Phlegraean Fields west of the city (Camping Vulcano Solfatara in Pozzuoli is well-located) and use the metro and Circumvesuviana train to explore. Pompei is an essential stop: the archaeological site is vast and you need at least half a day. Camping Spartacus and Camping Zeus are both within walking distance of the ruins, with motorhome services and secure parking.',
    },
    {
      type: 'paragraph',
      content:
        'The islands of Capri and Ischia are accessible by ferry from Naples and Sorrento, but you cannot bring vehicles. Procida, the smallest of the three, is a genuine hidden gem -- less touristic than its famous neighbours and authentically charming. Ferries from Pozzuoli take about 40 minutes.',
    },

    // ── Cilento Coast ────────────────────────────────────────────
    {
      type: 'heading',
      level: 2,
      content: "The Cilento Coast: Italy's Hidden Riviera",
    },
    {
      type: 'paragraph',
      content:
        'South of Salerno, the Cilento coast is everything the Amalfi Coast is -- dramatic, beautiful, Mediterranean -- but without the crowds, the impossible roads, and the inflated prices. The Cilento and Vallo di Diano National Park is a UNESCO World Heritage Site that remains remarkably under-visited by international tourists. The coast between Agropoli and Sapri has clean sandy beaches, clear water, and a string of attractive campsites with direct beach access.',
    },
    {
      type: 'paragraph',
      content:
        'Acciaroli and Pioppi are small fishing villages with excellent local restaurants and a pace of life that feels decades removed from the frenzy of the Amalfi towns. Paestum, at the northern end of the Cilento, has three of the best-preserved Greek temples outside of Greece -- they are genuinely awe-inspiring and far less crowded than Pompei. Several campsites near Paestum (including Camping Villaggio dei Pini and Camping Apollo) provide convenient access to both the temples and the beach.',
    },
    {
      type: 'tip',
      content:
        'The Cilento coast is ideal for families with children. Beaches are sandy rather than rocky, the sea is clean and shallow near shore, and campsites tend to be larger and better equipped than those closer to Naples. It is also significantly cheaper -- expect to pay 20-30 euros per night for a good campsite pitch in high season, compared to 35-50 euros near Sorrento.',
    },

    // ── Calabria ─────────────────────────────────────────────────
    {
      type: 'heading',
      level: 2,
      content: 'Calabria: The Wild Toe of Italy',
    },
    {
      type: 'paragraph',
      content:
        "Calabria is the toe of the Italian boot, and it remains one of the least-visited regions in mainland Italy despite having some of the country's most dramatic coastline. The Tyrrhenian coast around Tropea features white sand beaches backed by cliffs, with the town itself perched on a rocky promontory overlooking a turquoise bay. Capo Vaticano, south of Tropea, has a string of secluded coves accessible by foot or by boat that rival anything in Sardinia.",
    },
    {
      type: 'paragraph',
      content:
        "The Ionian coast is wilder and less developed, with long stretches of empty beach, ancient Greek ruins at Locri and Crotone, and the extraordinary mountain villages of the Aspromonte and Sila national parks within easy reach of the coast. Camping is affordable here -- 15-22 euros per night at most sites -- and the food is exceptional, with Calabria's fiery nduja sausage, fresh swordfish, and Ciro wines featuring on every menu.",
    },
    {
      type: 'paragraph',
      content:
        'Road quality in Calabria is variable. The A2 autostrada runs the length of the region and is well-maintained, but secondary roads can be rough and poorly signposted. Some mountain roads have no crash barriers and loose surfaces. Drive cautiously and leave extra time for journeys on smaller roads.',
    },

    // ── Puglia ───────────────────────────────────────────────────
    {
      type: 'heading',
      level: 2,
      content: 'Puglia: The Heel and the Adriatic',
    },
    {
      type: 'paragraph',
      content:
        'Puglia occupies the heel of Italy and faces the Adriatic Sea. It is a flatter, gentler landscape than the western coast -- olive groves, stone-walled fields, and whitewashed towns rather than mountains and cliffs. The region has become increasingly popular in recent years, but it still feels less hectic than Campania or Liguria. The coastline alternates between rocky stretches and long sandy beaches, with the water on the southern Salento peninsula reaching Caribbean levels of clarity.',
    },
    {
      type: 'paragraph',
      content:
        'Lecce, the Baroque capital of Puglia, is worth a full day of exploration. Park at a campsite or sosta outside the ZTL zone and walk into the honey-coloured centro storico. The trulli of Alberobello -- conical stone houses unique to this part of Italy -- are a UNESCO site that looks like something from a fairy tale. Polignano a Mare is a dramatic cliff-top town with a beach wedged into a cave-like cove below the main square. Ostuni, the White City, gleams on its hilltop like a Greek island village transplanted to Italian farmland.',
    },
    {
      type: 'paragraph',
      content:
        'Puglia is excellent campervan territory. Roads are wider and flatter than the western coast, campsites are reasonably priced (18-30 euros in high season), and soste are plentiful. The SS16 Adriatic coast road is mostly straight and easy driving, though it gets congested around Bari. The interior roads through olive groves and past stone walls are a joy to drive in a compact vehicle.',
    },

    // ── Cinque Terre ─────────────────────────────────────────────
    {
      type: 'heading',
      level: 2,
      content: 'Cinque Terre and the Ligurian Riviera',
    },
    {
      type: 'paragraph',
      content:
        'The five villages of Cinque Terre -- Riomaggiore, Manarola, Corniglia, Vernazza, and Monterosso al Mare -- are among the most photographed places in Italy. They cling to steep, terraced hillsides above the Ligurian Sea, connected by footpaths and a regional train line but deliberately disconnected from the road network. You cannot drive to most of the villages, and where roads exist they are impossibly narrow and end in tiny car parks that are invariably full.',
    },
    {
      type: 'warning',
      content:
        'Do not attempt to drive a motorhome or campervan into any of the Cinque Terre villages. Roads are severely restricted, there is no motorhome parking, and you risk getting stuck on a road too narrow to turn around. Use the train from La Spezia or Levanto instead.',
    },
    {
      type: 'paragraph',
      content:
        'The strategy for camper travellers is to park at La Spezia or Levanto and use the frequent Cinque Terre Express train (a day pass costs about 16 euros and includes unlimited train travel between all five villages plus trail access). In La Spezia, Camping Il Golfo is a short walk from the station. In Levanto, several campsites and an aire provide convenient overnight parking with a 5-minute walk to the station. Levanto itself is a lovely small town with a good beach and far fewer tourists than the five villages.',
    },
    {
      type: 'paragraph',
      content:
        'The wider Ligurian Riviera beyond Cinque Terre is more accessible by road and offers beautiful coastal camping. Sestri Levante, with its twin bays, Camogli, with its painted houses, and Portofino (park in Santa Margherita and take the boat) are all worthwhile stops. The Riviera di Ponente west of Genoa towards the French border is sunnier and has wider beaches, though it is more built up. Finale Ligure and Alassio are good bases with established campsites.',
    },

    // ── Italian Campsite Culture ─────────────────────────────────
    {
      type: 'heading',
      level: 2,
      content: 'Italian Campsite Culture and the Sosta System',
    },
    {
      type: 'paragraph',
      content:
        'Italy has over 2,500 registered campsites and a well-developed network of soste -- designated motorhome parking areas, often run by local councils or private operators. Soste are the Italian equivalent of French aires, though they tend to be more basic. A typical sosta offers a flat parking area, fresh water, grey and black water disposal, and sometimes electricity. Prices range from free to 15 euros per night. They are legal overnight parking areas and are signposted with the standard motorhome symbol.',
    },
    {
      type: 'paragraph',
      content:
        'Italian campsites are generally well-maintained and family-oriented. Many coastal sites have direct beach access, swimming pools, restaurants, and organised entertainment. Pitches tend to be larger than in northern Europe, often with mature shade trees -- essential in the Italian summer heat. Expect to pay 25-50 euros per night for a pitch at a well-equipped coastal campsite in July or August, dropping to 15-30 euros in May, June, September, and October.',
    },
    {
      type: 'list',
      items: [
        'Campsites: Book ahead for July and August, especially on the Ligurian and Adriatic coasts. Many sites require minimum stays of 3-7 nights in peak season.',
        'Soste: Found via the CamperPlanning campsite layer or apps like Camper Contact and Park4Night. Quality varies widely -- check reviews.',
        'Agriturismo: Some Italian farms offer campervan parking with meals available. Similar to the French France Passion network but less formalised.',
        'Wild camping: Technically illegal throughout Italy, though enforcement varies by region. Fines range from 100 to 500 euros. Sardinia is particularly strict.',
      ],
    },

    // ── ZTL Zones ────────────────────────────────────────────────
    {
      type: 'heading',
      level: 2,
      content: 'Navigating ZTL Zones',
    },
    {
      type: 'paragraph',
      content:
        'ZTL (Zona a Traffico Limitato) zones are the single biggest headache for camper travellers in Italy. These are restricted traffic areas in town and city centres, marked by electronic signs and monitored by cameras. If you drive into a ZTL without authorisation, you will receive an automatic fine of 50-100 euros per offence -- and each camera you pass counts as a separate offence. Fines are mailed to your home address or, for rental vehicles, charged to your credit card. There is no warning, no grace period, and no practical way to contest the fine from abroad.',
    },
    {
      type: 'paragraph',
      content:
        'ZTL zones exist in virtually every Italian city and in many smaller towns, including many tourist destinations. They are often active only during certain hours (commonly 7am-7pm), but schedules vary by city and even by street. The electronic signs at ZTL entrances display "VARCO ATTIVO" when the zone is restricted and "VARCO NON ATTIVO" when it is open, but these signs are easy to miss when you are concentrating on navigation.',
    },
    {
      type: 'warning',
      content:
        'Standard car GPS units and even Google Maps do not reliably warn about ZTL zones. Before entering any Italian city centre, research the ZTL boundaries and schedules in advance. The best strategy is to park outside the ZTL and walk or use public transport. CamperPlanning flags ZTL zones when you plan routes through Italian cities.',
    },

    // ── Driving Tips ─────────────────────────────────────────────
    {
      type: 'heading',
      level: 2,
      content: 'Driving Tips for the Italian Coast',
    },
    {
      type: 'list',
      items: [
        'Drive defensively. Italian driving culture is assertive. Expect close overtaking, aggressive use of horns, and creative interpretations of lane markings.',
        'Carry a full set of spare bulbs, a reflective warning triangle, and a hi-vis vest -- all legally required in Italy.',
        'Motorway speed limit for motorhomes over 3.5 tonnes is 100 km/h (not 130 km/h as for cars). Speed cameras are common and fines are steep.',
        'Fuel is expensive -- typically 1.70-1.90 euros per litre for diesel. Supermarket fuel stations (IP, Conad) are 10-15 cents cheaper than motorway and branded stations.',
        'Toll roads (autostrada) are efficient but add up. The A1 from Milan to Naples costs approximately 50-60 euros for a standard motorhome. The toll-free SS roads are slower but scenic.',
        'Avoid driving in Naples city itself. Traffic is chaotic, streets are narrow, and parking is virtually impossible. Use campsites on the outskirts and the metro.',
      ],
    },

    // ── Best Time to Visit ───────────────────────────────────────
    {
      type: 'heading',
      level: 2,
      content: 'Best Time to Visit',
    },
    {
      type: 'paragraph',
      content:
        'The Italian coast is at its best in May, June, September, and October. July and August bring scorching heat (35-40 degrees on southern coasts), wall-to-wall crowds, and peak prices. Italian domestic holidays mean that the first three weeks of August are especially congested, with Ferragosto (15 August) being the single busiest day of the year. Campsites often enforce minimum stays of a week during this period.',
    },
    {
      type: 'paragraph',
      content:
        'Shoulder season offers warm swimming temperatures (the Mediterranean stays above 22 degrees from June through October), manageable crowds, lower campsite fees, and vastly more pleasant driving conditions. Southern Italy -- Calabria, Puglia, and Sicily -- is warm enough for beach camping from April through November, making it an excellent destination for spring and autumn trips when northern Europe is too cold.',
    },

    // ── CTA ──────────────────────────────────────────────────────
    {
      type: 'heading',
      level: 2,
      content: 'Plan Your Italian Coastal Route',
    },
    {
      type: 'paragraph',
      content:
        'Italy rewards camper travellers who plan ahead. Knowing which roads to avoid, where the ZTL zones are, and which campsites to book in advance is the difference between a frustrating trip and a magical one. The coast from Amalfi to Cinque Terre is one of the great European road trips -- but only if you respect the limitations of the roads and your vehicle.',
    },
    {
      type: 'cta',
      content:
        'Plan your Italian coastal adventure with CamperPlanning. Set your vehicle dimensions, add your waypoints from Salerno to La Spezia, and the planner will calculate a route that avoids height restrictions and narrow roads. Explore nearby campsites and soste along your route. Free, private, no account needed.',
      waypoints: [
        { name: 'Genoa', lat: 44.4056, lng: 8.9463 },
        { name: 'Cinque Terre', lat: 44.1268, lng: 9.7098 },
        { name: 'Amalfi', lat: 40.634, lng: 14.6027 },
      ],
    },
  ],
};

export default post;
