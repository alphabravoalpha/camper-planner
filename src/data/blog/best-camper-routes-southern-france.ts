import type { BlogPost } from '../../types/blog';
import { IMAGES } from '../images';

const post: BlogPost = {
  slug: 'best-camper-routes-southern-france',
  title: "Best Camper Routes in Southern France: Provence, Cote d'Azur & Languedoc",
  description:
    'Three detailed motorhome itineraries through Southern France covering lavender fields, coastal drives, and wine country, with practical tips on tolls, low bridges, and campsite recommendations.',
  author: 'CamperPlanning',
  publishedDate: '2026-02-15',
  category: 'route-planning',
  tags: ['france', 'provence', 'cote-d-azur', 'route-planning', 'southern-france'],
  readingTime: 12,
  heroImage: IMAGES.southernFrance.hero,
  relatedSlugs: ['first-time-motorhome-guide-europe', 'wild-camping-europe-rules'],
  content: [
    // ── Introduction ──────────────────────────────────────────────
    {
      type: 'heading',
      level: 2,
      content: 'Why Southern France Is a Camper Paradise',
    },
    {
      type: 'image',
      image: IMAGES.southernFrance.hero,
    },
    {
      type: 'paragraph',
      content:
        'Southern France consistently ranks among the best motorhome destinations in Europe, and it is easy to understand why. The region packs an extraordinary diversity of landscapes into a manageable driving area: purple lavender plateaux, turquoise Mediterranean coves, limestone gorges deeper than the Grand Canyon, and vine-striped hills that have been producing wine since Roman times. You can wake up next to a 12th-century abbey, drive ninety minutes, and park overlooking a beach that rivals the Caribbean for water clarity.',
    },
    {
      type: 'paragraph',
      content:
        'France has the most developed motorhome infrastructure in Europe. The country operates over 6,000 dedicated aires de service -- designated overnight parking areas for campervans and motorhomes, most of which are either free or cost less than ten euros per night. Many include fresh water, waste disposal, and electricity hookups. Combined with an excellent network of municipal and private campsites, you rarely need to drive more than 30 minutes to find a legal, comfortable place to stop.',
    },
    {
      type: 'paragraph',
      content:
        'The three routes in this guide cover the most rewarding stretches of Southern France for camper travel. Each can be driven in five to seven days at a relaxed pace, or you can combine two or all three into an extended tour of three to four weeks. We have included specific campsite recommendations, low-bridge warnings, and toll-avoidance tips for each route so you can focus on enjoying the scenery rather than worrying about logistics.',
    },

    // ── Route 1: Provence ─────────────────────────────────────────
    {
      type: 'heading',
      level: 2,
      content: 'Route 1: The Provence Lavender Trail',
    },
    {
      type: 'paragraph',
      content:
        'Avignon \u2192 Gordes \u2192 Roussillon \u2192 Sault \u2192 Valensole Plateau \u2192 Moustiers-Sainte-Marie \u2192 Gorges du Verdon \u2192 Aix-en-Provence',
    },
    {
      type: 'paragraph',
      content: 'Distance: approximately 320 km. Recommended duration: 5--7 days.',
    },
    {
      type: 'image',
      image: IMAGES.southernFrance.provenceRoad,
    },
    {
      type: 'heading',
      level: 3,
      content: 'Avignon to Gordes: The Luberon Valley',
    },
    {
      type: 'paragraph',
      content:
        'Start in Avignon, where you can park at the large aire near Pont Saint-Benezet and spend a few hours exploring the medieval city walls and the Palais des Papes. The aire has motorhome service facilities and is a flat 15-minute walk to the historic centre. From Avignon, take the D900 east and then the D2 south into the Luberon. Avoid the temptation to use the A7 autoroute here -- the toll-free departmental roads are far more scenic and only add about twenty minutes to the journey.',
    },
    {
      type: 'paragraph',
      content:
        'Gordes is one of the most photographed hill villages in France, its honey-coloured stone buildings cascading down a cliff face above the Calavon valley. Parking a motorhome in the village itself is essentially impossible -- the streets are far too narrow and there are height restrictions on the main car park. Instead, use the dedicated motorhome parking area on the D15 about 800 metres south of the village centre, which is signposted. From there, it is a short uphill walk into the village. Nearby, the Senanque Abbey is surrounded by lavender rows that are in full bloom from mid-June to late July, making it one of the most iconic photo opportunities in all of Provence.',
    },
    {
      type: 'warning',
      content:
        'Gordes village centre has a 2.1m height barrier on the main car park entrance. Do not attempt to enter with a motorhome or high-top campervan. Use the dedicated aire on the D15 instead.',
    },
    {
      type: 'heading',
      level: 3,
      content: 'Roussillon and the Ochre Trail',
    },
    {
      type: 'paragraph',
      content:
        'From Gordes, continue east on the D2 to Roussillon, a village built on dramatic red and orange ochre cliffs. The Sentier des Ocres is a walking trail through old quarries that looks like a miniature painted desert -- it takes about 45 minutes and is well worth the stop. There is a motorhome-friendly car park on the western edge of the village, flat and shaded by plane trees. The village has several excellent bakeries where you can stock up on provisions before heading deeper into the lavender country.',
    },
    {
      type: 'heading',
      level: 3,
      content: 'Sault and the Valensole Plateau',
    },
    {
      type: 'paragraph',
      content:
        "The D943 from Apt to Sault climbs gradually onto the Plateau d'Albion, and from mid-June to early August the fields on both sides of the road are a solid sheet of purple. Sault is a quiet market town perched on a promontory, with a small but well-maintained municipal campsite (Camping Municipal de Sault) that accepts motorhomes up to 8 metres. Wednesday is market day, and the lavender honey from local producers is exceptional.",
    },
    {
      type: 'paragraph',
      content:
        'From Sault, head south-east towards Valensole via Banon and Riez. The Valensole Plateau is the largest lavender-growing area in France and the scale is breathtaking -- fields stretch unbroken to the horizon. There are several pull-off points along the D6 and D8 where you can park safely and walk into the fields. Harvest usually begins in the last week of July, so time your visit before then if you want the full purple display. The town of Valensole itself has a free aire with water and waste facilities on its northern edge.',
    },
    {
      type: 'tip',
      content:
        'Lavender season runs from mid-June to late July, with peak colour typically in the first two weeks of July. The Valensole Plateau is harvested first (usually late July), while higher-altitude fields around Sault last into early August. Plan accordingly if lavender is a priority.',
    },
    {
      type: 'heading',
      level: 3,
      content: "Gorges du Verdon: Europe's Grand Canyon",
    },
    {
      type: 'paragraph',
      content:
        'The Gorges du Verdon is a 25-kilometre limestone canyon with vertical walls dropping 700 metres to the turquoise Verdon River below. The Route des Cretes on the north rim (D23) offers the most spectacular viewpoints, with a series of belvederes carved into the cliff edge. This road is narrow in places -- comfortably passable for vehicles up to 7 metres, but challenging for anything longer. Passing oncoming traffic requires patience and occasionally reversing to a wider section.',
    },
    {
      type: 'paragraph',
      content:
        'Moustiers-Sainte-Marie, at the western end of the gorge, is a stunning village wedged into a gap in the cliffs with a golden star suspended on a chain between the two rock faces above. The village has a well-regarded municipal campsite (Camping Saint-Jean) and several private campsites along the road to Lac de Sainte-Croix. The lake itself is a magnificent emerald-green reservoir where you can rent electric boats and pedal boats -- swimming is permitted and the water is surprisingly warm from July onwards.',
    },
    {
      type: 'warning',
      content:
        'The Route des Cretes (D23) around the Gorges du Verdon has several tunnels with height limits of 3.0m to 3.5m. Check each tunnel clearance sign carefully before entering. The south rim road (D71) is narrower but has no tunnels and may be a better option for taller motorhomes.',
    },

    // ── Route 2: Cote d'Azur ──────────────────────────────────────
    {
      type: 'heading',
      level: 2,
      content: "Route 2: The Cote d'Azur Coastal Drive",
    },
    {
      type: 'paragraph',
      content:
        'Nice \u2192 Antibes \u2192 Cannes \u2192 Frejus \u2192 Saint-Tropez \u2192 Hyeres \u2192 Calanques de Cassis \u2192 Marseille',
    },
    {
      type: 'paragraph',
      content: 'Distance: approximately 280 km. Recommended duration: 5--7 days.',
    },
    {
      type: 'image',
      image: IMAGES.southernFrance.coteDazur,
    },
    {
      type: 'heading',
      level: 3,
      content: 'Nice and the Eastern Riviera',
    },
    {
      type: 'paragraph',
      content:
        'Nice is the logical starting point for a Riviera tour, with good motorhome access from the A8 autoroute and several campsites within 20 minutes of the city centre. Camping Urban Nice on the Route de Grenoble is one of the closest, with a regular bus service into the old town. The Promenade des Anglais, the Cours Saleya flower market, and the view from Castle Hill are all walkable from the main bus routes. Avoid driving your motorhome into the city centre at all costs -- the streets of Vieux Nice are impossibly narrow and several are restricted to vehicles under 1.9 metres wide.',
    },
    {
      type: 'paragraph',
      content:
        'From Nice, the Bord de Mer (coastal road) west to Antibes passes through Cagnes-sur-Mer and offers views across the Baie des Anges. Antibes has a large Port Vauban marina area and the excellent Musee Picasso housed in the Chateau Grimaldi. There is a motorhome aire on the Boulevard du Marechal Leclerc with space for about 30 vehicles. It fills up quickly in July and August, so arrive before midday if possible.',
    },
    {
      type: 'heading',
      level: 3,
      content: 'Cannes to Saint-Tropez via the Esterel',
    },
    {
      type: 'paragraph',
      content:
        "The stretch between Cannes and Frejus along the N7 and the Corniche de l'Esterel is one of the most beautiful coastal drives in the Mediterranean. The Esterel Massif is a range of ancient red porphyry rock that drops directly into deep blue water, creating a colour contrast that is almost unreal. There are several small parking areas along the corniche where you can stop for photos or a swim from the rocks. Be aware that some of these pull-offs have 2.3m height barriers to prevent overnight motorhome parking -- check before you commit.",
    },
    {
      type: 'paragraph',
      content:
        "Saint-Tropez is worth a visit for the harbour and the Musee de l'Annonciade, but it is not a motorhome-friendly town. Summer traffic on the single approach road can mean hour-long queues. The best strategy is to park at one of the campsites in Ramatuelle or Gassin, a few kilometres south, and either cycle or take the coastal shuttle boat from Port Grimaud. Camping Kon Tiki in Ramatuelle is a large, well-equipped site within cycling distance of Pampelonne beach.",
    },
    {
      type: 'tip',
      content:
        'From Port Grimaud, the Bateaux Verts shuttle boat crosses the bay to Saint-Tropez harbour in 15 minutes, completely avoiding the traffic. It runs every 20-30 minutes in summer and costs around 8 euros return. Bikes are allowed on board.',
    },
    {
      type: 'heading',
      level: 3,
      content: 'Hyeres, the Golden Islands, and the Calanques',
    },
    {
      type: 'paragraph',
      content:
        "West of Saint-Tropez, the coast becomes less developed and more wild. Hyeres is the gateway to the Iles d'Or (Golden Islands) -- Porquerolles, Port-Cros, and the Ile du Levant. Porquerolles in particular is worth a day trip: car-free, with white sand beaches and crystal-clear snorkelling water. Ferries run from La Tour Fondue, where there is a large (paid) car park that accepts motorhomes up to 3.5 tonnes.",
    },
    {
      type: 'paragraph',
      content:
        'The final stretch to Cassis takes you past the naval port of Toulon and through the coastal hills of Bandol and La Ciotat. The Calanques -- dramatic narrow inlets carved into white limestone cliffs between Cassis and Marseille -- are a highlight of the entire Mediterranean coast. You cannot drive into the Calanques; access is on foot or by boat from Cassis harbour. Camping Les Cigales in Cassis is well-positioned for both the Calanques walks and the charming village centre.',
    },
    {
      type: 'warning',
      content:
        'The road into Cassis descends steeply via the Route des Cretes (D141) with tight hairpin bends. Vehicles over 7.5 metres should use the D559 approach from the east instead. In summer, the Calanques National Park restricts access on high fire-risk days -- check the prefecture website before planning a hike.',
    },

    // ── Route 3: Languedoc ────────────────────────────────────────
    {
      type: 'heading',
      level: 2,
      content: 'Route 3: Languedoc Wine Country and the Canal du Midi',
    },
    {
      type: 'paragraph',
      content:
        'Montpellier \u2192 Sete \u2192 Beziers \u2192 Canal du Midi \u2192 Minerve \u2192 Carcassonne \u2192 Limoux \u2192 Narbonne \u2192 Gruissan',
    },
    {
      type: 'paragraph',
      content: 'Distance: approximately 350 km. Recommended duration: 5--7 days.',
    },
    {
      type: 'image',
      image: IMAGES.southernFrance.camargue,
    },
    {
      type: 'heading',
      level: 3,
      content: 'Montpellier and the Etang de Thau',
    },
    {
      type: 'paragraph',
      content:
        "Montpellier is a vibrant university city with a beautifully restored medieval centre, excellent food markets, and a lively atmosphere that feels distinctly different from the resort towns of the Riviera. The municipal campsite (Camping l'Oasis Palavasienne) is located at Palavas-les-Flots, 10 km south on the coast, with a tram connection into the city centre. Alternatively, there is a large free aire at Lattes, just south of Montpellier, with motorhome services.",
    },
    {
      type: 'paragraph',
      content:
        'From Montpellier, head south-west along the coast to Sete, a working fishing port built on a rocky peninsula between the Mediterranean and the Etang de Thau. Sete is often called the Venice of Languedoc for its network of canals, but it has a grittier, more authentic character than that comparison suggests. The covered market (Les Halles de Sete) is outstanding -- pick up tielle (a local octopus pie), oysters from the Etang de Thau, and local Picpoul de Pinet white wine. There is a motorhome aire near the Plage de la Corniche with views across to the Mont Saint-Clair.',
    },
    {
      type: 'heading',
      level: 3,
      content: 'Beziers and the Canal du Midi',
    },
    {
      type: 'paragraph',
      content:
        'Beziers is an underrated city perched above the River Orb, with the massive Cathedral Saint-Nazaire dominating the skyline. It is also where the Canal du Midi passes through on its 240-kilometre journey from Toulouse to the Mediterranean. The Fonseranes Locks, a UNESCO-listed staircase of eight locks just west of the city centre, are one of the great engineering achievements of the 17th century and free to visit. You can park your motorhome at the locks car park and watch boats navigate the 21-metre climb.',
    },
    {
      type: 'paragraph',
      content:
        'The Canal du Midi itself is a wonderful cycling route, lined with ancient plane trees that form a green tunnel over the water. Many sections have smooth, flat towpaths that are perfect for cycling, and you can ride from Beziers to the tunnel at Malpas (about 8 km) or west towards Capestang and its magnificent Gothic church. Several campsites along the canal cater specifically to motorhomes and have direct towpath access.',
    },
    {
      type: 'heading',
      level: 3,
      content: 'Minerve and the Minervois Wine Region',
    },
    {
      type: 'paragraph',
      content:
        'A short detour north from the canal brings you to Minerve, a fortified village perched on a rocky spur between two gorges. It was the site of a brutal siege during the Cathar Crusade in 1210 and today is one of the most dramatic small villages in France. The approach road is narrow but manageable for vehicles up to 7 metres. Park in the designated area at the entrance to the village -- do not attempt to drive across the narrow bridge into the village itself. The surrounding Minervois wine region produces excellent reds and rose at a fraction of Provence prices, and many domaines offer free tastings.',
    },
    {
      type: 'heading',
      level: 3,
      content: 'Carcassonne: The Walled City',
    },
    {
      type: 'paragraph',
      content:
        'Carcassonne is the largest medieval fortified city in Europe, with a double ring of walls, 52 towers, and a history stretching back to the Roman period. The Cite Medievale is undeniably touristy, but the scale and preservation of the fortifications are genuinely impressive and well worth a half-day visit. The lower town (Bastide Saint-Louis) has a more authentic atmosphere, with good restaurants and a Saturday morning market. Camping de la Cite is the closest campsite, just across the River Aude from the walled city, and it has full motorhome services and pitches with views of the floodlit walls at night.',
    },
    {
      type: 'paragraph',
      content:
        "From Carcassonne, you can loop south to Limoux -- famous for producing the world's oldest sparkling wine, Blanquette de Limoux, which predates Champagne by over a century -- before heading back east towards the coast via Narbonne. Narbonne was the first Roman colony in Gaul and has an excellent covered market (Les Halles de Narbonne) and the unfinished but enormous Cathedral Saint-Just-et-Saint-Pasteur. The coast south of Narbonne at Gruissan is wild and undeveloped, with salt flats, flamingos, and a distinctive village of chalets built on stilts above the Etang de Gruissan.",
    },
    {
      type: 'tip',
      content:
        "The Languedoc is significantly cheaper than Provence or the Cote d'Azur. Campsite fees are typically 30-50% lower, restaurant prices are more modest, and wine from local domaines can cost as little as 3-5 euros per bottle direct from the producer. If you are on a budget, this route offers the best value of the three.",
    },

    // ── Practical Tips ────────────────────────────────────────────
    {
      type: 'heading',
      level: 2,
      content: 'Practical Tips for Motorhome Travel in Southern France',
    },
    {
      type: 'heading',
      level: 3,
      content: 'Best Time to Visit',
    },
    {
      type: 'paragraph',
      content:
        'The ideal window for Southern France is mid-May to mid-October, but the character of your trip changes significantly within that range. May and June offer warm weather, manageable crowds, and wildflowers everywhere -- lavender begins in mid-June. July and August bring the full lavender season and the best swimming weather, but also the heaviest traffic, the most crowded campsites, and temperatures that regularly exceed 35 degrees. September and October are arguably the best months overall: the sea is still warm from the summer, the crowds have thinned dramatically, vineyards are being harvested, and campsite prices drop by 20-40%.',
    },
    {
      type: 'list',
      items: [
        'May-June: Warm, uncrowded, wildflowers, early lavender. Ideal for Provence and Languedoc.',
        'July-August: Peak season. Lavender in full bloom, best beach weather, but very busy. Book campsites ahead.',
        'September-October: Warm sea, wine harvest, fewer tourists, lower prices. Excellent for all three routes.',
        'November-April: Many campsites and aires close. Some coastal areas are pleasant in winter, but inland Provence can be cold and windy (the Mistral).',
      ],
    },
    {
      type: 'heading',
      level: 3,
      content: 'Tolls and Autoroutes',
    },
    {
      type: 'paragraph',
      content:
        "French autoroutes are expensive for motorhomes. Vehicles over 3.5 tonnes pay Class 2 rates, which are roughly 50% higher than car rates. For example, the A7 from Lyon to Marseille costs approximately 45-55 euros for a Class 2 vehicle in one direction. The A8 along the Cote d'Azur from Aix-en-Provence to Nice adds another 25-30 euros. These costs add up quickly on a multi-week trip.",
    },
    {
      type: 'paragraph',
      content:
        'Fortunately, Southern France has an excellent network of toll-free roads. The Routes Nationales (N roads) and Routes Departementales (D roads) run parallel to most autoroutes and are usually only 20-40 minutes slower for a typical motorhome journey. They are also significantly more scenic. The major toll-free alternatives are: N7 and D7N as an alternative to the A7 through the Rhone valley; N98 and D559 along the coast instead of the A8; and N113 through the Languedoc instead of the A9. Our route planner can calculate toll-free routes automatically when you set the avoid-tolls option in your vehicle profile.',
    },
    {
      type: 'tip',
      content:
        'If you must use a toll autoroute, the Liber-t electronic tag works for motorhomes and gives a slight discount. You can order one online before your trip or pick one up at most autoroute service areas. It also speeds passage through toll barriers, which is a significant advantage for a large vehicle.',
    },
    {
      type: 'heading',
      level: 3,
      content: 'Low Bridges, Narrow Roads, and Height Restrictions',
    },
    {
      type: 'paragraph',
      content:
        "Height restrictions are the most common hazard for motorhomes in Southern France. Medieval town centres often have archways and gates well under 3 metres. Car parks frequently have 2.0m or 2.1m height barriers. Even some modern supermarket car parks use barriers to prevent overnight motorhome parking. Always know your vehicle's exact height including any roof boxes, antennas, or air conditioning units, and watch for the diamond-shaped yellow height restriction signs posted before tunnels and underpasses.",
    },
    {
      type: 'paragraph',
      content:
        "Narrow village roads are another challenge, particularly in the Luberon, the hill villages above the Cote d'Azur, and the Cathar country of the Languedoc. Many D-roads through villages were built for horse carts and are genuinely too narrow for vehicles over 2.3 metres wide. Wing mirrors are vulnerable. As a general rule, if your GPS is routing you through the centre of a small hilltop village, look for an alternative route around it. Park outside and walk in -- the walk is usually short and always more pleasant than a stressful drive through streets where your mirrors scrape the shutters.",
    },
    {
      type: 'warning',
      content:
        "Never rely solely on a standard car GPS for motorhome navigation. Car GPS units will route you through low bridges, narrow streets, and weight-restricted roads. Use CamperPlanning's route planner or a dedicated motorhome GPS that factors in your vehicle dimensions.",
    },
    {
      type: 'heading',
      level: 3,
      content: 'Campsite and Aire Recommendations',
    },
    {
      type: 'paragraph',
      content:
        'France distinguishes between two main types of overnight stopping places for motorhomes. Campsites (campings) offer full facilities -- electricity, water, showers, toilets, and often swimming pools, restaurants, and activities. They range from basic municipal sites at 12-18 euros per night to luxury four-star sites at 40-60 euros. Aires de camping-car are simpler -- typically a hardstanding area with fresh water and waste disposal, sometimes with electricity. Many are free; others charge 5-12 euros. Both are legal and accepted places to park overnight.',
    },
    {
      type: 'paragraph',
      content:
        'For finding aires, the France Passion scheme is an excellent option: for an annual membership of about 30 euros, you get access to a network of over 10,000 farms, vineyards, and artisan producers who offer free overnight parking in exchange for the possibility (not obligation) of buying their products. In Southern France, this often means parking among the vines at a winery with a complimentary tasting. The Park4Night and Campercontact apps are also invaluable for locating free and paid aires along your route.',
    },
    {
      type: 'list',
      items: [
        'Municipal campsites: Best value, often in excellent locations. Book ahead in July-August as they fill up.',
        'France Passion: Free overnight stays at farms and vineyards. Annual membership around 30 euros. Over 10,000 hosts.',
        'Commercial aires: 5-12 euros per night with basic services. Found via Park4Night, Campercontact, or the CamperPlanning campsite layer.',
        'Free aires: Many towns provide free motorhome parking with services. Look for the blue P+campervan sign.',
        'Wild camping: Technically legal in France if you are discreet, but increasingly restricted in tourist areas. Never park overnight in the Calanques National Park, Verdon Natural Park, or any nature reserve.',
      ],
    },
    {
      type: 'heading',
      level: 3,
      content: 'Driving Tips for Large Vehicles',
    },
    {
      type: 'paragraph',
      content:
        'Southern France is generally easy driving, but a few rules make motorhome travel much smoother. Keep to the right-hand lane on dual carriageways and autoroutes -- French drivers can be aggressive about overtaking and will flash their lights if they feel you are blocking. Fill up with diesel at supermarket stations (Leclerc, Intermarche, Carrefour), which are consistently 10-15 cents per litre cheaper than autoroute or branded stations. Plan your fuel stops in advance, as some smaller D-roads in rural Provence and the Languedoc can have 50-kilometre stretches without a petrol station.',
    },
    {
      type: 'paragraph',
      content:
        'Wind is a factor that catches many motorhome drivers off guard. The Mistral is a powerful north-westerly wind that funnels down the Rhone valley and across Provence, sometimes reaching speeds of 100 km/h or more. It can make driving a high-sided motorhome genuinely dangerous, particularly on exposed bridges and open stretches of road. When the Mistral is blowing hard, avoid driving if possible, or stick to sheltered routes through valleys rather than exposed plateaux. The Mistral is most common in winter and spring, but can occur at any time of year. Weather forecasts in the region always mention it specifically.',
    },
    {
      type: 'paragraph',
      content:
        'Parking for shopping and sightseeing requires some planning. French supermarkets generally have large car parks that can accommodate motorhomes, but check for height barriers before entering. For sightseeing, look for dedicated motorhome parking areas (often signposted on the approach to tourist towns) or park in the outer zones of regular car parks. Never park in a space marked for disabled users, even briefly, as fines are steep and French traffic wardens are vigilant.',
    },
    {
      type: 'heading',
      level: 3,
      content: 'Overnight Parking and Security',
    },
    {
      type: 'paragraph',
      content:
        "Southern France is generally safe for motorhome travel, but vehicle break-ins do occur, particularly in the Cote d'Azur region and around Marseille. Autoroute rest areas are the highest-risk locations -- never leave valuables visible and consider using a security lock on your habitation door when sleeping at rest stops. Dedicated aires and campsites are much safer. Common-sense precautions apply: do not leave electronics, cameras, or bags visible through windows; use internal blinds and curtains when parked; and choose well-lit, populated stopping places when possible.",
    },
    {
      type: 'tip',
      content:
        'Download the official French government Bison Fute app or check bfrn.fr before travelling on weekends and public holidays. It provides real-time traffic forecasts and colour-coded warnings (green, orange, red, black) for traffic density on major routes. Black days -- typically the first and last weekends of August -- can see six-hour delays on the A7 and A9.',
    },

    // ── Combining the Routes ──────────────────────────────────────
    {
      type: 'heading',
      level: 2,
      content: 'Combining Routes: A Grand Tour of the South',
    },
    {
      type: 'paragraph',
      content:
        "If you have three to four weeks, you can link all three routes into a single grand loop. Start in Montpellier and head west through Languedoc to Carcassonne (Route 3), then cut south-east to the coast at Narbonne. Follow the coast east through Beziers and Sete back to Montpellier, then continue east via Nimes and Avignon to begin the Provence loop (Route 1). After the Gorges du Verdon, drop south to Aix-en-Provence and pick up the Cote d'Azur route (Route 2) from Cassis heading east to Nice. The total distance is roughly 950 km of actual driving, but with detours, sightseeing, and market visits, you will likely cover 1,200 km or more.",
    },
    {
      type: 'paragraph',
      content:
        'A grand tour like this benefits enormously from forward planning. Use the CamperPlanning route planner to map out your stops, check distances between campsites, and estimate daily driving times. Aim for no more than 150--200 km of driving per day, leaving plenty of time for exploration. Build in at least two rest days per week where you stay put -- the best trips are the ones where you resist the urge to keep moving and instead linger in the places that capture your attention.',
    },

    // ── CTA ───────────────────────────────────────────────────────
    {
      type: 'heading',
      level: 2,
      content: 'Plan Your Southern France Trip',
    },
    {
      type: 'paragraph',
      content:
        'Southern France rewards camper travellers who take the time to plan their route carefully. Knowing where the low bridges are, which villages to avoid driving through, and where to find the best-value campsites transforms a good trip into a great one. The difference between a stressful day of wrong turns and height barriers and a relaxed drive through lavender fields comes down to preparation.',
    },
    {
      type: 'cta',
      content:
        'Start planning your Southern France camper trip with CamperPlanning. Add your waypoints, set your vehicle dimensions, and let the planner calculate a safe, scenic route. It is free, works offline, and respects your privacy -- no account required.',
      waypoints: [
        { name: 'Avignon', lat: 43.9493, lng: 4.8055 },
        { name: 'Gorges du Verdon', lat: 43.7369, lng: 6.3261 },
        { name: 'Nice', lat: 43.7102, lng: 7.262 },
      ],
    },
  ],
};

export default post;
