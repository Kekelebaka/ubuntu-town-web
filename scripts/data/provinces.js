// Ubuntu Town — Province Data
// Run: node scripts/data/provinces.js

const PROVINCES = [
  {
    name: "Free State",
    slug: "free-state",
    narrative: "The Free State is South Africa's breadbasket — vast golden wheat fields and sunflower plains stretch between dramatic mountain escarpments. This is where the Afrikaans language and Basotho culture live side by side, where farming communities hold together through drought and abundance alike, and where the annual MACUFE festival proves that the cultural heart of South Africa beats strongest in its heartland.",
    capital: "Bloemfontein",
    motto: "Ubuntu Ke Batho Ba Batho",
    population: "2,834,000",
    area_km2: "129,825",
    towns_count: 22
  },
  {
    name: "Western Cape",
    slug: "western-cape",
    narrative: "From the iconic flat top of Table Mountain to the wild Cederberg peaks, the Western Cape is where two oceans meet and cultures collide. This province carries the weight of colonial history and the energy of a creative, diverse modern society — its wine farms, art scene, and innovation hubs make it a microcosm of South Africa's possibilities.",
    capital: "Cape Town",
    motto: "Justitia et Pax",
    population: "7,433,000",
    area_km2: "129,462",
    towns_count: 17
  },
  {
    name: "Gauteng",
    slug: "gauteng",
    narrative: "Gauteng may be South Africa's smallest province by area, but it's the economic engine of the entire African continent. From Soweto's heritage streets to Sandton's glass towers, this is where gold was discovered, where apartheid was fought, and where Africa's 21st-century future is being built at breakneck speed.",
    capital: "Johannesburg (seat of government: Pretoria)",
    motto: "Unity in Diversity",
    population: "16,194,000",
    area_km2: "18,178",
    towns_count: 13
  },
  {
    name: "KwaZulu-Natal",
    slug: "kwazulu-natal",
    narrative: "KwaZulu-Natal is where Zulu heritage meets Indian Ocean beauty — a subtropical paradise with a fierce history. The battlefields, Drakensberg mountains, warm beaches, and cultural fusion make it one of South Africa's most diverse and dynamic provinces.",
    capital: "Pietermaritzburg",
    motto: "Masisizane",
    population: "11,531,000",
    area_km2: "94,361",
    towns_count: 12
  },
  {
    name: "Limpopo",
    slug: "limpopo",
    narrative: "Limpopo is Africa in miniature — baobab trees, subtropical fruit farms, ancient Venda culture, and the gateway to the Kruger National Park. This is where South Africa meets the rest of the continent, and where the rhythms of traditional life harmonise with modern ambition.",
    capital: "Polokwane",
    motto: "Tšhila, Tšhila",
    population: "5,927,000",
    area_km2: "125,754",
    towns_count: 9
  },
  {
    name: "Mpumalanga",
    slug: "mpumalanga",
    narrative: "Mpumalanga means 'where the sun rises' — and every morning over the Panorama Route is proof. From the Kruger's Big Five to the Gold Rush heritage of Pilgrim's Rest, this province is where nature and history conspire to take your breath away.",
    capital: "Mbombela (Nelspruit)",
    motto: "Empumalanga — Where the Sun Rises",
    population: "4,739,000",
    area_km2: "76,495",
    towns_count: 13
  },
  {
    name: "Eastern Cape",
    slug: "eastern-cape",
    narrative: "The Eastern Cape is South Africa's most dramatic province — the Wild Coast's cliffs, the Karoo's vastness, and the legacy of Mandela, Tambo, and Sobukwe. This is where the Xhosa heartland meets the frontier, and where community resilience is a way of life.",
    capital: "Bhisho",
    motto: "Development through Hard Work",
    population: "6,744,000",
    area_km2: "168,966",
    towns_count: 10
  },
  {
    name: "North West",
    slug: "north-west",
    narrative: "The North West is where platinum meets the Pilanesberg — a province of mining wealth, cultural festivals, and the Big Five roaming free at Sun City's doorstep. It's a place where industrial might and natural beauty exist side by side.",
    capital: "Mahikeng",
    motto: "Dumela — Be Welcoming",
    population: "4,022,000",
    area_km2: "104,882",
    towns_count: 8
  },
  {
    name: "Northern Cape",
    slug: "northern-cape",
    narrative: "The Northern Cape is South Africa's largest and most sparsely populated province — a land of red Kalahari dunes, the Big Hole of Kimberley, and the annual Namaqualand wildflower carpet. Its vastness is its identity: wide skies, big horizons, and communities that thrive against the odds.",
    capital: "Kimberley",
    motto: "Sa! — Yes!",
    population: "1,266,000",
    area_km2: "372,889",
    towns_count: 7
  }
];

export { PROVINCES };
