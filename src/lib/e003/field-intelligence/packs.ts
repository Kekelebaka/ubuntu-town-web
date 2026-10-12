// src/lib/e003/field-intelligence/packs.ts — REAL field intelligence (town packs).
// SOURCE: ubuntu-town-field-os/intelligence/runtime_exports/ubuntu_town_master_town_packs_v1
// (import_ready/master_town_packs_v1 — 10 town packs, v1). Class: FIELD INTELLIGENCE (DERIVED/
// AUTHORED research artefacts, generated_at stamps preserved). review_required is honoured:
// these packs are research intelligence, NOT verified operational records.

export interface FieldPack {
  pack_id: string; version: string; generated_at: string; town: string; municipality: string;
  municipality_id: string; province: string; anchor_role: string; archetype: string;
  township_nodes: string[]; satellite_towns: string[]; local_economy_summary: string;
  opportunity_domains: { domain_id: string; domain_name: string; rationale: string; confidence: number }[];
  ecosystem_fit: { entity: string; fit_score: number; rationale: string }[];
  recommended_workpacks: { workpack_id: string; title: string; priority: string; why_this_town: string; proof_required: string[] }[];
  first_3_actions: string[];
  coordinator_strategy: string; sponsor_angle: string;
  risk_flags: unknown[]; kopano_one_liner?: string; kopano_context_summary?: string;
  operator_notes: unknown[]; confidence: number; review_required: boolean; review_reasons: string[];
}

export const FIELD_PACKS: FieldPack[] = [
 {
  "pack_id": "Dihlabeng_Local_Municipality_Bethlehem",
  "version": "v1",
  "generated_at": "2023-10-05T12:00:00Z",
  "town": "Bethlehem",
  "municipality": "Dihlabeng Local Municipality",
  "municipality_id": "FS192",
  "province": "Free State",
  "anchor_role": "municipal_anchor_town",
  "archetype": "Logistics Corridor Town",
  "township_nodes": [
   "Bohlokong"
  ],
  "satellite_towns": [
   "Clarens",
   "Fouriesburg"
  ],
  "local_economy_summary": "Bethlehem serves as a regional service and logistics node.",
  "opportunity_domains": [
   {
    "domain_id": "transport_logistics",
    "domain_name": "Transport and Logistics",
    "rationale": "As a logistics corridor town, Bethlehem can leverage its strategic position to enhance transportation and logistics services.",
    "confidence": 0.8
   },
   {
    "domain_id": "community_civic_intelligence",
    "domain_name": "Community Civic Intelligence",
    "rationale": "Improving civic engagement and community intelligence can support better planning and service delivery.",
    "confidence": 0.7
   }
  ],
  "ecosystem_fit": [
   {
    "entity": "Kopano",
    "fit_score": 0.9,
    "rationale": "Kopano can provide robust communication and collaboration tools to support logistics operations and community initiatives."
   }
  ],
  "recommended_workpacks": [
   {
    "workpack_id": "wp_town_opportunity_scan",
    "title": "Town Opportunity Scan",
    "priority": "high",
    "why_this_town": "To identify and prioritize opportunities for economic growth and service enhancement.",
    "proof_required": [
     "market_research",
     "stakeholder_feedback"
    ]
   },
   {
    "workpack_id": "wp_community_podcast_capture",
    "title": "Community Podcast Capture",
    "priority": "medium",
    "why_this_town": "To engage the community and gather insights through podcast content.",
    "proof_required": [
     "podcast_transcripts",
     "listener_engagement_data"
    ]
   }
  ],
  "first_3_actions": [
   "Conduct a market research survey to identify logistics and community needs.",
   "Organize a town hall meeting to gather stakeholder feedback on logistics and community initiatives.",
   "Develop a pilot project for a community podcast to engage residents."
  ],
  "coordinator_strategy": "Engage local businesses and community leaders to form a logistics and community development committee.",
  "sponsor_angle": "Local businesses and community organizations can benefit from improved logistics and enhanced community engagement.",
  "risk_flags": [],
  "kopano_one_liner": "Leverage Kopano's communication tools to enhance logistics operations and community engagement.",
  "kopano_context_summary": "Kopano can support logistics coordination and community intelligence in Bethlehem.",
  "operator_notes": [],
  "confidence": 0.8,
  "review_required": true,
  "review_reasons": [
   "More detailed market research is needed.",
   "Stakeholder feedback should be more diverse."
  ]
 },
 {
  "pack_id": "FS181_Senekal_Agriculture_Hub",
  "version": "v1",
  "generated_at": "2023-10-05T12:00:00Z",
  "town": "Senekal",
  "municipality": "Setsoto Local Municipality",
  "municipality_id": "FS181",
  "province": "Free State",
  "anchor_role": "municipal_anchor_town",
  "archetype": "Agriculture Hub",
  "township_nodes": [
   "Matwabeng"
  ],
  "satellite_towns": [],
  "local_economy_summary": "Senekal is an agriculture-focused hub with significant agricultural service activities.",
  "opportunity_domains": [
   {
    "domain_id": "agriculture_green_economy",
    "domain_name": "Agriculture Green Economy",
    "rationale": "The town's focus on agriculture presents opportunities for sustainable farming practices and green initiatives.",
    "confidence": 90
   },
   {
    "domain_id": "youth_employment",
    "domain_name": "Youth Employment",
    "rationale": "There is potential to create employment opportunities for young people through agricultural training and support programs.",
    "confidence": 85
   }
  ],
  "ecosystem_fit": [
   {
    "entity": "Kopano",
    "fit_score": 85,
    "rationale": "Kopano can provide digital tools and platforms to enhance agricultural productivity and sustainability."
   },
   {
    "entity": "Ops",
    "fit_score": 90,
    "rationale": "Ops can support local infrastructure improvements and digital services to benefit the agricultural sector."
   }
  ],
  "recommended_workpacks": [
   {
    "workpack_id": "wp_agri_supplier_scan",
    "title": "Agricultural Supplier Scan",
    "priority": "high",
    "why_this_town": "To identify local and regional suppliers of agricultural inputs and services.",
    "proof_required": [
     "Supplier list",
     "Market analysis report"
    ]
   },
   {
    "workpack_id": "wp_youth_cv_activation",
    "title": "Youth CV Activation",
    "priority": "medium",
    "why_this_town": "To engage and train young people in agricultural skills and job readiness.",
    "proof_required": [
     "Training program details",
     "Participant feedback"
    ]
   }
  ],
  "first_3_actions": [
   "Conduct a supplier scan to identify local agricultural suppliers.",
   "Develop a training program for youth in agricultural skills.",
   "Implement digital tools to improve agricultural productivity and sustainability."
  ],
  "coordinator_strategy": "Coordinate with local farmers and agricultural organizations to leverage existing networks.",
  "sponsor_angle": "Engage local businesses and agricultural cooperatives as sponsors for training programs and supply chain initiatives.",
  "risk_flags": [],
  "kopano_one_liner": "Leverage Kopano’s digital tools to enhance agricultural productivity and sustainability in Senekal.",
  "kopano_context_summary": "Kopano can provide digital solutions to support agricultural practices and improve supply chain efficiency.",
  "operator_notes": [],
  "confidence": 85,
  "review_required": true,
  "review_reasons": [
   "Further research needed on specific agricultural challenges and opportunities."
  ]
 },
 {
  "pack_id": "atlantis_intelligence_pack",
  "version": "v1",
  "generated_at": "2023-10-05T12:00:00Z",
  "town": "Atlantis",
  "municipality": "City of Cape Town Metropolitan Municipality",
  "municipality_id": "CPT",
  "province": "Western Cape",
  "anchor_role": "municipal_anchor_town",
  "archetype": "Industrial Transition Town",
  "township_nodes": [
   "Wesfleur"
  ],
  "satellite_towns": [
   "Mamre"
  ],
  "local_economy_summary": "The town is undergoing an industrial transition with a focus on technical skills and repair services.",
  "opportunity_domains": [
   {
    "domain_id": "repair_service_economy",
    "domain_name": "Repair Service Economy",
    "rationale": "Atlantis has a skilled industrial workforce that can be redirected towards repair and maintenance services.",
    "confidence": 80
   },
   {
    "domain_id": "youth_employment",
    "domain_name": "Youth Employment",
    "rationale": "There is a need to provide employment opportunities for the youth transitioning from industrial roles.",
    "confidence": 75
   },
   {
    "domain_id": "sme_activation",
    "domain_name": "SME Activation",
    "rationale": "Supporting local small and medium enterprises (SMEs) can help stabilize the local economy.",
    "confidence": 90
   },
   {
    "domain_id": "transport_logistics",
    "domain_name": "Transport Logistics",
    "rationale": "The town's location can be leveraged for logistics and transportation services.",
    "confidence": 70
   }
  ],
  "ecosystem_fit": [
   {
    "entity": "Kopano",
    "fit_score": 85,
    "rationale": "Kopano can provide tools and platforms to support the digital transformation of local businesses."
   },
   {
    "entity": "Ops",
    "fit_score": 90,
    "rationale": "Ops can manage and coordinate the implementation of workpacks to ensure smooth execution."
   },
   {
    "entity": "Workpack Engine",
    "fit_score": 95,
    "rationale": "The Workpack Engine can efficiently manage and prioritize workpacks based on the town's needs."
   }
  ],
  "recommended_workpacks": [
   {
    "workpack_id": "wp_town_opportunity_scan",
    "title": "Town Opportunity Scan",
    "priority": "high",
    "why_this_town": "To identify and prioritize opportunities for economic growth.",
    "proof_required": [
     "market_analysis",
     "industry_reports"
    ]
   },
   {
    "workpack_id": "wp_local_business_directory",
    "title": "Local Business Directory",
    "priority": "medium",
    "why_this_town": "To create a directory of local businesses for marketing and networking purposes.",
    "proof_required": [
     "business_listings",
     "contact_information"
    ]
   },
   {
    "workpack_id": "wp_youth_cv_activation",
    "title": "Youth CV Activation",
    "priority": "high",
    "why_this_town": "To connect unemployed youth with job opportunities.",
    "proof_required": [
     "job_positions",
     "training_programs"
    ]
   }
  ],
  "first_3_actions": [
   "Conduct a market analysis to identify key repair service sectors.",
   "Develop a local business directory to promote SMEs.",
   "Launch a job fair to connect youth with employers."
  ],
  "coordinator_strategy": "Coordinate with local stakeholders to implement workpacks and support economic initiatives.",
  "sponsor_angle": "Engage local businesses and community organizations as sponsors to support economic development.",
  "risk_flags": [],
  "kopano_one_liner": "Leverage Kopano tools to streamline economic development efforts.",
  "kopano_context_summary": "Kopano can provide digital solutions to support the repair service economy, youth employment, and SME activation.",
  "operator_notes": [],
  "confidence": 85,
  "review_required": true,
  "review_reasons": [
   "Uncertainty about the exact market demand for repair services."
  ]
 },
 {
  "pack_id": "MANTSOPA_LOCAL_MUNICIPALITY_PACK",
  "version": "v1",
  "generated_at": "2023-10-05T12:00:00Z",
  "town": "Ladybrand",
  "municipality": "Mantsopa Local Municipality",
  "municipality_id": "FS196",
  "province": "Free State",
  "anchor_role": "municipal_anchor_town",
  "archetype": "Border Trade Town",
  "township_nodes": [
   "Manyatseng"
  ],
  "satellite_towns": [],
  "local_economy_summary": "Ladybrand is a border-linked trade and service hub, with potential for local commerce and tourism.",
  "opportunity_domains": [
   {
    "domain_id": "township_commerce",
    "domain_name": "Township Commerce",
    "rationale": "Manyatseng has potential for local businesses and commerce activities.",
    "confidence": 0.8
   },
   {
    "domain_id": "tourism_hospitality",
    "domain_name": "Tourism and Hospitality",
    "rationale": "As a border town, Ladybrand can leverage its location for tourism and hospitality opportunities.",
    "confidence": 0.7
   }
  ],
  "ecosystem_fit": [
   {
    "entity": "Kopano",
    "fit_score": 0.9,
    "rationale": "Kopano can support local businesses and tourism initiatives effectively."
   },
   {
    "entity": "Ops",
    "fit_score": 0.8,
    "rationale": "Ops can manage and enhance local infrastructure to support commerce and tourism."
   }
  ],
  "recommended_workpacks": [
   {
    "workpack_id": "wp_town_opportunity_scan",
    "title": "Scan for Local Business Opportunities",
    "priority": "high",
    "why_this_town": "To identify and support local businesses in Manyatseng.",
    "proof_required": [
     "business_profiles",
     "market_analysis"
    ]
   },
   {
    "workpack_id": "wp_event_opportunity_capture",
    "title": "Capture Tourism Event Opportunities",
    "priority": "medium",
    "why_this_town": "To capitalize on tourism events and attract visitors to Ladybrand.",
    "proof_required": [
     "event_data",
     "visitor_statistics"
    ]
   }
  ],
  "first_3_actions": [
   "Conduct a business census in Manyatseng to identify local enterprises.",
   "Develop a marketing campaign to promote Ladybrand as a tourist destination.",
   "Establish a local business directory to connect suppliers and customers."
  ],
  "coordinator_strategy": "Engage local stakeholders to form a community-driven initiative.",
  "sponsor_angle": "Local businesses and tourism stakeholders can benefit from increased visibility and support.",
  "risk_flags": [],
  "kopano_one_liner": "Leverage Kopano to enhance local commerce and tourism in Ladybrand.",
  "kopano_context_summary": "Kopano can provide tools and resources to support local businesses and tourism initiatives.",
  "operator_notes": [],
  "confidence": 0.9,
  "review_required": true,
  "review_reasons": [
   "More detailed market analysis needed",
   "Clarify stakeholder engagement strategy"
  ]
 },
 {
  "pack_id": "MAL193_HARRISMITH",
  "version": "v1",
  "generated_at": "2023-10-05T14:30:00Z",
  "town": "Harrismith",
  "municipality": "Maluti-a-Phofung Local Municipality",
  "municipality_id": "FS193",
  "province": "Free State",
  "anchor_role": "municipal_anchor_town",
  "archetype": "Logistics Corridor Town",
  "township_nodes": [
   "Intabazwe"
  ],
  "satellite_towns": [],
  "local_economy_summary": "Harrismith is a logistics corridor town with significant service economy potential.",
  "opportunity_domains": [
   {
    "domain_id": "transport_logistics",
    "domain_name": "Transport and Logistics",
    "rationale": "Harrismith's position as a logistics corridor presents opportunities for enhancing transportation services and supporting local businesses.",
    "confidence": 80
   },
   {
    "domain_id": "township_commerce",
    "domain_name": "Township Commerce",
    "rationale": "The Intabazwe township offers potential for local commerce and economic activities, which can be leveraged to boost the local economy.",
    "confidence": 75
   }
  ],
  "ecosystem_fit": [
   {
    "entity": "Kopano",
    "fit_score": 85,
    "rationale": "Kopano can provide robust digital infrastructure to support logistics and commerce initiatives in Harrismith."
   },
   {
    "entity": "Ops",
    "fit_score": 90,
    "rationale": "Ops can facilitate the implementation of logistics and commerce projects through efficient resource management and coordination."
   }
  ],
  "recommended_workpacks": [
   {
    "workpack_id": "wp_town_opportunity_scan",
    "title": "Town Opportunity Scan",
    "priority": "high",
    "why_this_town": "To identify and prioritize opportunities for growth in logistics and commerce sectors.",
    "proof_required": [
     "market_analysis",
     "stakeholder_interviews"
    ]
   },
   {
    "workpack_id": "wp_local_business_directory",
    "title": "Local Business Directory",
    "priority": "medium",
    "why_this_town": "To create a directory of local businesses that can be used for marketing and networking purposes.",
    "proof_required": [
     "business_listings",
     "community_feedback"
    ]
   }
  ],
  "first_3_actions": [
   "Conduct a market analysis to identify key logistics and commerce opportunities.",
   "Engage with local stakeholders to gather insights on current business needs and challenges.",
   "Develop a plan to enhance digital infrastructure in the Intabazwe township."
  ],
  "coordinator_strategy": "Coordinate with local businesses and community leaders to drive economic development initiatives.",
  "sponsor_angle": "Partner with local and regional businesses to support logistics and commerce projects.",
  "risk_flags": [],
  "kopano_one_liner": "Leverage Kopano’s digital infrastructure to enhance logistics and commerce in Harrismith.",
  "kopano_context_summary": "Kopano can provide essential digital tools to support logistics and commerce initiatives in Harrismith.",
  "operator_notes": [],
  "confidence": 85,
  "review_required": true,
  "review_reasons": [
   "More detailed market analysis needed",
   "Stakeholder engagement strategy requires refinement"
  ]
 },
 {
  "pack_id": "FS194_Maluti-a-Phofung_Local_Municipality",
  "version": "v1",
  "generated_at": "2023-10-05T14:30:00Z",
  "town": "Phuthaditjhaba",
  "municipality": "Maluti-a-Phofung Local Municipality",
  "municipality_id": "FS194",
  "province": "Free State",
  "anchor_role": "municipal_anchor_town",
  "archetype": "Rural Service Town",
  "township_nodes": [
   "QwaQwa",
   "Bluegumbosch"
  ],
  "satellite_towns": [],
  "local_economy_summary": "The local economy is driven by strong youth and community engagement, with potential in education and activation.",
  "opportunity_domains": [
   {
    "domain_id": "youth_employment",
    "domain_name": "Youth Employment",
    "rationale": "The town has a significant youth population that can be engaged in employment opportunities.",
    "confidence": 80
   },
   {
    "domain_id": "education_digital_literacy",
    "domain_name": "Education and Digital Literacy",
    "rationale": "There is a need to enhance digital literacy among the youth and community members.",
    "confidence": 75
   },
   {
    "domain_id": "community_civic_intelligence",
    "domain_name": "Community Civic Intelligence",
    "rationale": "The town has strong community ties that can be leveraged for civic engagement initiatives.",
    "confidence": 85
   }
  ],
  "ecosystem_fit": [
   {
    "entity": "Kopano",
    "fit_score": 70,
    "rationale": "Kopano can support digital literacy and community engagement initiatives."
   },
   {
    "entity": "Ops",
    "fit_score": 80,
    "rationale": "Ops can assist in coordinating and implementing community-based projects."
   }
  ],
  "recommended_workpacks": [
   {
    "workpack_id": "wp_youth_cv_activation",
    "title": "Youth CV Activation",
    "priority": "high",
    "why_this_town": "To engage the youth in job readiness programs.",
    "proof_required": [
     "Youth interest survey"
    ]
   },
   {
    "workpack_id": "wp_community_podcast_capture",
    "title": "Community Podcast Capture",
    "priority": "medium",
    "why_this_town": "To leverage community voices and stories for civic engagement.",
    "proof_required": [
     "Community interest survey"
    ]
   },
   {
    "workpack_id": "wp_town_opportunity_scan",
    "title": "Town Opportunity Scan",
    "priority": "low",
    "why_this_town": "To identify and document local opportunities for economic growth.",
    "proof_required": [
     "Local business directory"
    ]
   }
  ],
  "first_3_actions": [
   "Conduct a youth interest survey to gauge participation in job readiness programs.",
   "Organize a community meeting to discuss the idea of a podcast capturing local stories.",
   "Create a local business directory to identify potential partners for economic development."
  ],
  "coordinator_strategy": "Engage local leaders and community members to build a network for project implementation.",
  "sponsor_angle": "Partner with educational institutions and local businesses to support youth employment and digital literacy.",
  "risk_flags": [],
  "kopano_one_liner": "Support digital literacy and community engagement initiatives in Phuthaditjhaba.",
  "kopano_context_summary": "Phuthaditjhaba has a strong youth and community base, making it ideal for digital literacy and civic engagement projects.",
  "operator_notes": [],
  "confidence": 85,
  "review_required": true,
  "review_reasons": [
   "More detailed data on youth employment needs is required."
  ]
 },
 {
  "pack_id": "",
  "version": "v1",
  "generated_at": "",
  "town": "Rustenburg",
  "municipality": "Rustenburg Local Municipality",
  "municipality_id": "NW373",
  "province": "North West",
  "anchor_role": "municipal_anchor_town",
  "archetype": "Mining Support Town",
  "township_nodes": [
   "Tlhabane"
  ],
  "satellite_towns": [],
  "local_economy_summary": "Mining support, contractor and technical workforce economy.",
  "opportunity_domains": [
   {
    "domain_id": "repair_service_economy",
    "domain_name": "Repair and Service Economy",
    "rationale": "Supporting the mining industry requires robust repair and service capabilities for machinery and infrastructure.",
    "confidence": 0
   },
   {
    "domain_id": "youth_employment",
    "domain_name": "Youth Employment",
    "rationale": "Creating job opportunities for young people is crucial to stabilize the local economy and reduce unemployment.",
    "confidence": 0
   },
   {
    "domain_id": "sme_activation",
    "domain_name": "Small and Medium Enterprise Activation",
    "rationale": "Encouraging local SMEs can provide additional services and products to support the mining sector.",
    "confidence": 0
   }
  ],
  "ecosystem_fit": [
   {
    "entity": "Kopano",
    "fit_score": 0,
    "rationale": "Kopano can provide digital tools to enhance communication and collaboration within the local business community."
   },
   {
    "entity": "Ops",
    "fit_score": 0,
    "rationale": "Ops can leverage Kopano's tools to improve operational efficiency and support the local economy."
   },
   {
    "entity": "Workpack Engine",
    "fit_score": 0,
    "rationale": "The Workpack Engine can utilize Kopano's tools to manage and execute workpacks more effectively."
   }
  ],
  "recommended_workpacks": [
   {
    "workpack_id": "wp_town_opportunity_scan",
    "title": "Town Opportunity Scan",
    "priority": "high",
    "why_this_town": "To identify and capitalize on existing and potential opportunities in the local economy.",
    "proof_required": [
     "market_research",
     "industry_reports"
    ]
   },
   {
    "workpack_id": "wp_community_podcast_capture",
    "title": "Community Podcast Capture",
    "priority": "medium",
    "why_this_town": "To engage the community and promote local businesses through podcast content.",
    "proof_required": [
     "podcast_theme",
     "content_creation_plan"
    ]
   },
   {
    "workpack_id": "wp_local_sponsor_lead_mapping",
    "title": "Local Sponsor Lead Mapping",
    "priority": "low",
    "why_this_town": "To establish relationships with potential sponsors and map out lead generation strategies.",
    "proof_required": [
     "sponsor_identification",
     "lead_generation_plan"
    ]
   }
  ],
  "first_3_actions": [
   "Conduct a market research study to identify key opportunities in the repair and service economy.",
   "Develop a plan to create job opportunities for young people in the local economy.",
   "Identify and engage local SMEs to support the mining sector."
  ],
  "coordinator_strategy": "Coordinate with local businesses and stakeholders to implement the identified workpacks.",
  "sponsor_angle": "Engage local businesses and mining companies as potential sponsors for community development initiatives.",
  "risk_flags": [],
  "kopano_one_liner": "Leverage Kopano's digital tools to enhance communication and collaboration within the local business community.",
  "kopano_context_summary": "Kopano can provide digital solutions to support communication, collaboration, and operational efficiency.",
  "operator_notes": [],
  "confidence": 0,
  "review_required": true,
  "review_reasons": [
   "Uncertain about specific market research details",
   "Need more clarity on sponsorship engagement strategies"
  ]
 },
 {
  "pack_id": "MAN_Bloemfontein_v1",
  "version": "v1",
  "generated_at": "2023-10-05T12:00:00Z",
  "town": "Bloemfontein",
  "municipality": "Mangaung Metropolitan Municipality",
  "municipality_id": "MAN",
  "province": "Free State",
  "anchor_role": "municipal_anchor_town",
  "archetype": "Government / Admin Town",
  "township_nodes": [
   "Mangaung"
  ],
  "satellite_towns": [
   "Botshabelo",
   "Thaba Nchu"
  ],
  "local_economy_summary": "Bloemfontein is an administrative and educational hub with significant NGO and service concentration.",
  "opportunity_domains": [
   {
    "domain_id": "youth_employment",
    "domain_name": "Youth Employment",
    "rationale": "The town has a young population that can benefit from employment opportunities.",
    "confidence": 80
   },
   {
    "domain_id": "education_digital_literacy",
    "domain_name": "Education Digital Literacy",
    "rationale": "With a focus on education, there is potential to enhance digital literacy among students and educators.",
    "confidence": 90
   },
   {
    "domain_id": "community_civic_intelligence",
    "domain_name": "Community Civic Intelligence",
    "rationale": "The town can leverage its civic engagement to improve local governance and services.",
    "confidence": 75
   }
  ],
  "ecosystem_fit": [
   {
    "entity": "Kopano",
    "fit_score": 85,
    "rationale": "Kopano can support digital literacy initiatives and community engagement programs."
   },
   {
    "entity": "Ops",
    "fit_score": 90,
    "rationale": "Ops can manage and coordinate various digital literacy and civic engagement projects."
   }
  ],
  "recommended_workpacks": [
   {
    "workpack_id": "wp_youth_cv_activation",
    "title": "Youth CV Activation",
    "priority": "high",
    "why_this_town": "To provide job readiness training and job placement services for youth.",
    "proof_required": [
     "job market analysis",
     "youth employment statistics"
    ]
   },
   {
    "workpack_id": "wp_community_podcast_capture",
    "title": "Community Podcast Capture",
    "priority": "medium",
    "why_this_town": "To engage the community through podcast content that highlights local issues and solutions.",
    "proof_required": [
     "community interest survey",
     "podcast hosting platform"
    ]
   },
   {
    "workpack_id": "wp_town_opportunity_scan",
    "title": "Town Opportunity Scan",
    "priority": "low",
    "why_this_town": "To identify and document existing and potential economic opportunities in the town.",
    "proof_required": [
     "local business directory",
     "economic development report"
    ]
   }
  ],
  "first_3_actions": [
   "Conduct a job market analysis to identify key industries and skills needed.",
   "Develop a digital literacy curriculum for schools and community centers.",
   "Organize a community engagement workshop to gather feedback on local needs."
  ],
  "coordinator_strategy": "Coordinate with local NGOs and educational institutions to implement digital literacy and youth employment programs.",
  "sponsor_angle": "Partner with local businesses and NGOs to fund and support these initiatives.",
  "risk_flags": [],
  "kopano_one_liner": "Support digital literacy and community engagement in Bloemfontein.",
  "kopano_context_summary": "Bloemfontein is an educational and administrative center with a focus on civic engagement and youth employment.",
  "operator_notes": [],
  "confidence": 85,
  "review_required": true,
  "review_reasons": [
   "More detailed data on youth employment and digital literacy needs required."
  ]
 },
 {
  "pack_id": "Soweto_Township_Commerce_Pack",
  "version": "v1",
  "generated_at": "2023-10-05T14:30:00Z",
  "town": "Soweto",
  "municipality": "City of Johannesburg Metropolitan Municipality",
  "municipality_id": "JHB",
  "province": "Gauteng",
  "anchor_role": "municipal_anchor_town",
  "archetype": "Township Commerce Town",
  "township_nodes": [
   "Soweto"
  ],
  "satellite_towns": [],
  "local_economy_summary": "High-density township commerce with significant youth, culture, and creator economy.",
  "opportunity_domains": [
   {
    "domain_id": "township_commerce",
    "domain_name": "Township Commerce",
    "rationale": "Soweto's high-density commerce provides opportunities for local businesses and supports the local economy.",
    "confidence": 1
   },
   {
    "domain_id": "youth_employment",
    "domain_name": "Youth Employment",
    "rationale": "The high youth population presents an opportunity to create employment through various initiatives.",
    "confidence": 1
   },
   {
    "domain_id": "creator_culture_economy",
    "domain_name": "Creator Culture Economy",
    "rationale": "Soweto has a vibrant culture and creator economy that can be leveraged for economic growth.",
    "confidence": 1
   }
  ],
  "ecosystem_fit": [
   {
    "entity": "Kopano",
    "fit_score": 8,
    "rationale": "Kopano can support local businesses and improve digital literacy, aligning well with the town's needs."
   },
   {
    "entity": "Ops",
    "fit_score": 9,
    "rationale": "Ops can enhance infrastructure and services to support the growing commerce and cultural activities."
   }
  ],
  "recommended_workpacks": [
   {
    "workpack_id": "wp_town_opportunity_scan",
    "title": "Town Opportunity Scan",
    "priority": "high",
    "why_this_town": "To identify and prioritize opportunities for economic growth and community development.",
    "proof_required": [
     "market_analysis",
     "community_feedback"
    ]
   },
   {
    "workpack_id": "wp_community_podcast_capture",
    "title": "Community Podcast Capture",
    "priority": "medium",
    "why_this_town": "To leverage Soweto's culture and creator economy by capturing and promoting local stories and talents.",
    "proof_required": [
     "content_creation",
     "distribution_channels"
    ]
   },
   {
    "workpack_id": "wp_local_business_directory",
    "title": "Local Business Directory",
    "priority": "low",
    "why_this_town": "To create a directory of local businesses to support township commerce and attract investment.",
    "proof_required": [
     "business_participation",
     "directory_design"
    ]
   }
  ],
  "first_3_actions": [
   "Conduct a market analysis to identify key opportunities in township commerce.",
   "Engage with local youth groups to understand their employment needs and interests.",
   "Collaborate with local creators to develop content that showcases Soweto's culture and economy."
  ],
  "coordinator_strategy": "Establish a community coordinator to oversee and facilitate local initiatives.",
  "sponsor_angle": "Leverage local sponsors to support youth employment programs and cultural events.",
  "risk_flags": [],
  "kopano_one_liner": "Support local businesses and enhance digital literacy in Soweto.",
  "kopano_context_summary": "Kopano can play a crucial role in supporting local commerce and digital engagement in Soweto.",
  "operator_notes": [],
  "confidence": 0.8,
  "review_required": true,
  "review_reasons": [
   "More detailed market analysis needed",
   "Clarify sponsorship strategies"
  ]
 },
 {
  "pack_id": "EC443_Mthatha_UET",
  "version": "v1",
  "generated_at": "2023-10-05T14:30:00Z",
  "town": "Mthatha",
  "municipality": "King Sabata Dalindyebo Local Municipality",
  "municipality_id": "EC443",
  "province": "Eastern Cape",
  "anchor_role": "municipal_anchor_town",
  "archetype": "University / Education Town",
  "township_nodes": [],
  "satellite_towns": [],
  "local_economy_summary": "Mthatha is an education hub with strong regional service provision, offering significant opportunities for youth employment and civic engagement.",
  "opportunity_domains": [
   {
    "domain_id": "youth_employment",
    "domain_name": "Youth Employment",
    "rationale": "The presence of educational institutions and regional services creates a ripe environment for youth employment initiatives.",
    "confidence": 90
   },
   {
    "domain_id": "education_digital_literacy",
    "domain_name": "Education Digital Literacy",
    "rationale": "Enhancing digital literacy among students and educators can improve educational outcomes and prepare them for the digital economy.",
    "confidence": 85
   },
   {
    "domain_id": "community_civic_intelligence",
    "domain_name": "Community Civic Intelligence",
    "rationale": "Empowering the community through civic intelligence can lead to better local governance and service delivery.",
    "confidence": 80
   }
  ],
  "ecosystem_fit": [
   {
    "entity": "University",
    "fit_score": 95,
    "rationale": "The university plays a central role in the local economy and has a direct impact on youth employment and education."
   },
   {
    "entity": "Regional Services",
    "fit_score": 90,
    "rationale": "Regional services support the broader community and provide essential infrastructure for economic activities."
   }
  ],
  "recommended_workpacks": [
   {
    "workpack_id": "wp_youth_cv_activation",
    "title": "Youth CV Activation",
    "priority": "high",
    "why_this_town": "To address youth unemployment by providing job readiness training and CV workshops.",
    "proof_required": [
     "Job placement rates",
     "Participant feedback"
    ]
   },
   {
    "workpack_id": "wp_community_podcast_capture",
    "title": "Community Podcast Capture",
    "priority": "medium",
    "why_this_town": "To enhance community engagement and civic intelligence through regular podcast content.",
    "proof_required": [
     "Podcast downloads",
     "Listener feedback"
    ]
   },
   {
    "workpack_id": "wp_town_opportunity_scan",
    "title": "Town Opportunity Scan",
    "priority": "low",
    "why_this_town": "To identify and document existing and potential economic opportunities in Mthatha.",
    "proof_required": [
     "Opportunity reports",
     "Stakeholder interviews"
    ]
   }
  ],
  "first_3_actions": [
   "Initiate a pilot program for digital literacy workshops at the local university.",
   "Organize a job fair targeting local businesses and educational institutions.",
   "Launch a community podcast series focusing on local issues and solutions."
  ],
  "coordinator_strategy": "Collaborate with the university and regional service providers to leverage their resources and expertise.",
  "sponsor_angle": "Supporting youth employment and community development can lead to long-term economic benefits and improved quality of life.",
  "risk_flags": [],
  "kopano_one_liner": "Leverage the university's influence to drive youth employment and digital literacy initiatives.",
  "kopano_context_summary": "Mthatha's education and regional service sectors offer robust opportunities for enhancing youth employment and digital literacy.",
  "operator_notes": [],
  "confidence": 85,
  "review_required": true,
  "review_reasons": [
   "Some data points are inferred from the known notes."
  ]
 }
];

// Provenance display — flags source-data gaps instead of rewriting them.
export function packProvenance(p: FieldPack): string {
  const id = p.pack_id || '(pack id missing — source data quality)';
  const date = p.generated_at ? p.generated_at.slice(0, 10) : '(date missing)';
  return `${id} · ${date}`;
}

export function packForTown(townName: string): FieldPack | undefined {
  return FIELD_PACKS.find((p) => p.town.toLowerCase() === townName.toLowerCase());
}
