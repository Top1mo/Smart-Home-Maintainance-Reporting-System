export interface Trade {
  id: string;
  slug: string;
  name_en: string;
  name_ar: string;
  icon: string;
  order_index: number;
  subcategories: Array<{
    id: string;
    trade_id: string;
    slug: string;
    name_en: string;
    name_ar: string;
    is_elv?: boolean;
    symptoms: Array<{
      id: string;
      symptom_en: string;
      symptom_ar: string;
      default_severity: string;
      is_hazard: boolean;
      hazard_instruction_en?: string;
      hazard_instruction_ar?: string;
    }>;
  }>;
}

export const FALLBACK_TRADES: Trade[] = [
  {
    id: "trade_plumbing",
    slug: "PLUMBING",
    name_en: "Plumbing",
    name_ar: "سباكة",
    icon: "wrench",
    order_index: 1,
    subcategories: [
      {
        id: "sub_plumb_valves",
        trade_id: "trade_plumbing",
        slug: "PLUMBING_VALVES",
        name_en: "Taps, Mixers & Valves",
        name_ar: "خلاطات ومحابس",
        symptoms: [
          {
            id: "sym_plumb_tap_leak",
            symptom_en: "Faucet / Mixer Dripping Constantly",
            symptom_ar: "تسريب أو تنقيط مياه مستمر من خلاط المياه",
            default_severity: "LOW",
            is_hazard: false,
          },
          {
            id: "sym_plumb_shattaf_burst",
            symptom_en: "Bidet Spray Hose Burst / Flooding",
            symptom_ar: "خرطوم الشطاف مكسور وبيغرق الحمام مياه",
            default_severity: "HIGH",
            is_hazard: false,
          },
        ],
      },
      {
        id: "sub_plumb_drainage",
        trade_id: "trade_plumbing",
        slug: "PLUMBING_DRAINAGE",
        name_en: "Drainage & Traps",
        name_ar: "صرف صحي ومجاري",
        symptoms: [
          {
            id: "sym_plumb_drain_clog",
            symptom_en: "Kitchen Sink Blocked / Backing Up",
            symptom_ar: "انسداد حوض المطبخ وطفح مياه الصرف",
            default_severity: "MEDIUM",
            is_hazard: false,
          },
        ],
      },
    ],
  },
  {
    id: "trade_electrical",
    slug: "ELECTRICAL",
    name_en: "Electrical",
    name_ar: "كهرباء",
    icon: "zap",
    order_index: 2,
    subcategories: [
      {
        id: "sub_elec_panel",
        trade_id: "trade_electrical",
        slug: "ELECTRICAL_PANEL",
        name_en: "Distribution Boards & Breakers",
        name_ar: "لوحات التوزيع والقواطع",
        symptoms: [
          {
            id: "sym_elec_sparks",
            symptom_en: "Sparks / Arcing from Breaker Panel",
            symptom_ar: "شرز كهربائي أو فرقعة نارية من لوحة القواطع",
            default_severity: "CRITICAL",
            is_hazard: true,
            hazard_instruction_en: "Turn off main breaker immediately. Do not touch charred fixtures.",
            hazard_instruction_ar: "افصل القاطع العمومي فوراً ولا تلمس المفاتيح المحترقة.",
          },
          {
            id: "sym_elec_breaker_tripping",
            symptom_en: "Main Breaker Tripping Repeatedly",
            symptom_ar: "القاطع الرئيسي ينزل باستمرار بدون سبب واضح",
            default_severity: "HIGH",
            is_hazard: false,
          },
        ],
      },
      {
        id: "sub_elv_cctv",
        trade_id: "trade_electrical",
        slug: "ELECTRICAL_ELV_CCTV",
        name_en: "CCTV Camera Surveillance",
        name_ar: "كاميرات المراقبة",
        is_elv: true,
        symptoms: [
          {
            id: "sym_cctv_offline",
            symptom_en: "Camera Offline / No Live Feed",
            symptom_ar: "كاميرا المراقبة فاصلة ولا تعرض صورة",
            default_severity: "MEDIUM",
            is_hazard: false,
          },
        ],
      },
      {
        id: "sub_elv_intercom",
        trade_id: "trade_electrical",
        slug: "ELECTRICAL_ELV_INTERCOM",
        name_en: "Intercom & Access Control",
        name_ar: "الإنتركم والتحكم في الدخول",
        is_elv: true,
        symptoms: [
          {
            id: "sym_intercom_dead",
            symptom_en: "Handset / Indoor Monitor Does Not Ring",
            symptom_ar: "سماعة الإنتركم لا ترن أو الشاشة سوداء",
            default_severity: "MEDIUM",
            is_hazard: false,
          },
        ],
      },
      {
        id: "sub_elv_wifi",
        trade_id: "trade_electrical",
        slug: "ELECTRICAL_ELV_WIFI",
        name_en: "Wi-Fi Access Points & LAN",
        name_ar: "نقاط الواي فاي والشبكات",
        is_elv: true,
        symptoms: [
          {
            id: "sym_wifi_offline",
            symptom_en: "Ceiling Access Point Offline",
            symptom_ar: "نقطة توزيع الواي فاي فاصلة باور",
            default_severity: "MEDIUM",
            is_hazard: false,
          },
        ],
      },
    ],
  },
  {
    id: "trade_hvac",
    slug: "HVAC",
    name_en: "HVAC & Air Conditioning",
    name_ar: "تكييف وتبريد",
    icon: "fan",
    order_index: 3,
    subcategories: [
      {
        id: "sub_hvac_split",
        trade_id: "trade_hvac",
        slug: "HVAC_SPLIT",
        name_en: "Split & Concealed Units",
        name_ar: "أجهزة التكييف الاسبليت والكونسيلد",
        symptoms: [
          {
            id: "sym_hvac_warm",
            symptom_en: "A/C Blowing Warm Air",
            symptom_ar: "التكييف شغال هواء عادي ومابيسقعش خالص",
            default_severity: "MEDIUM",
            is_hazard: false,
          },
          {
            id: "sym_hvac_water_leak",
            symptom_en: "Water Dripping Inside Room",
            symptom_ar: "التكييف بينقط مياه جوه الغرفة على الحيطة",
            default_severity: "HIGH",
            is_hazard: false,
          },
        ],
      },
    ],
  },
  {
    id: "trade_carpentry",
    slug: "CARPENTRY",
    name_en: "Carpentry & Joinery",
    name_ar: "نجارة وأبواب",
    icon: "hammer",
    order_index: 4,
    subcategories: [
      {
        id: "sub_carp_doors",
        trade_id: "trade_carpentry",
        slug: "CARPENTRY_DOORS",
        name_en: "Wooden Doors & Frames",
        name_ar: "أبواب وشبابيك وحلوق خشب",
        symptoms: [
          {
            id: "sym_carp_door_scrape",
            symptom_en: "Door Scraping Floor / Binding",
            symptom_ar: "الباب يحك في الأرضية أو الحلق مريح",
            default_severity: "LOW",
            is_hazard: false,
          },
        ],
      },
    ],
  },
  {
    id: "trade_aluminum",
    slug: "ALUMINUM",
    name_en: "Aluminum & Glazing Works",
    name_ar: "ألوميتال وزجاج",
    icon: "square",
    order_index: 5,
    subcategories: [
      {
        id: "sub_alum_windows",
        trade_id: "trade_aluminum",
        slug: "ALUMINUM_WINDOWS",
        name_en: "Sliding Windows & Rollers",
        name_ar: "شبابيك ألوميتال وسكك جرارة",
        symptoms: [
          {
            id: "sym_alum_jammed",
            symptom_en: "Sliding Window Jammed / Heavy",
            symptom_ar: "دلفة شباك الألوميتال تقيلة أو العجل بايظ",
            default_severity: "LOW",
            is_hazard: false,
          },
        ],
      },
    ],
  },
  {
    id: "trade_gypsum",
    slug: "GYPSUM",
    name_en: "Gypsum Boards & False Ceilings",
    name_ar: "جبس بورد وأسقف معلقة",
    icon: "layers",
    order_index: 6,
    subcategories: [
      {
        id: "sub_gyp_suspension",
        trade_id: "trade_gypsum",
        slug: "GYPSUM_SUSPENSION",
        name_en: "Suspension & Framing",
        name_ar: "هيكل التعليق والشاسيه",
        symptoms: [
          {
            id: "sym_gyp_sagging",
            symptom_en: "Visible Sagging / Belly in Gypsum Ceiling",
            symptom_ar: "ترخيم وهبوط ملحوظ في منتصف لوح الجبس بورد",
            default_severity: "CRITICAL",
            is_hazard: true,
            hazard_instruction_en: "Collapse hazard! Evacuate area directly below ceiling immediately.",
            hazard_instruction_ar: "خطر انهيار وسقوط السقف! أخلِ المنطقة أسفل السقف المعلق فوراً.",
          },
        ],
      },
    ],
  },
  {
    id: "trade_painting",
    slug: "PAINTING",
    name_en: "Painting & Surface Finishes",
    name_ar: "نقاشة ودهانات",
    icon: "paint-bucket",
    order_index: 7,
    subcategories: [
      {
        id: "sub_pnt_interior",
        trade_id: "trade_painting",
        slug: "PAINTING_INTERIOR",
        name_en: "Interior Wall Painting",
        name_ar: "دهانات الحوائط الداخلية",
        symptoms: [
          {
            id: "sym_pnt_peeling",
            symptom_en: "Paint Peeling / Blistering from Damp",
            symptom_ar: "تقشير وتطبيل الدهان بسبب الرطوبة والرشح",
            default_severity: "LOW",
            is_hazard: false,
          },
        ],
      },
    ],
  },
  {
    id: "trade_pool",
    slug: "POOL",
    name_en: "Swimming Pool & Water Amenities",
    name_ar: "حمام سباحة",
    icon: "waves",
    order_index: 8,
    subcategories: [
      {
        id: "sub_pool_filtration",
        trade_id: "trade_pool",
        slug: "POOL_FILTRATION",
        name_en: "Pumps & Sand Filters",
        name_ar: "طلمبات وفلاتر المسبح",
        symptoms: [
          {
            id: "sym_pool_pump_dead",
            symptom_en: "Pool Pump Not Starting / Humming",
            symptom_ar: "طلمبة المسبح لا تعمل أو تصدر أزيز مرتفع",
            default_severity: "MEDIUM",
            is_hazard: false,
          },
        ],
      },
    ],
  },
  {
    id: "trade_civil",
    slug: "CIVIL_TILING",
    name_en: "Civil, Masonry & Tiling",
    name_ar: "سيراميك وبلاط وبناء",
    icon: "grid",
    order_index: 9,
    subcategories: [
      {
        id: "sub_cvl_tiling",
        trade_id: "trade_civil",
        slug: "CIVIL_TILING_FLOOR",
        name_en: "Floor & Wall Ceramic Tiles",
        name_ar: "سيراميك وبورسلين أرضيات وحوائط",
        symptoms: [
          {
            id: "sym_cvl_tile_hollow",
            symptom_en: "Hollow / Broken Floor Tile",
            symptom_ar: "بلاط السيراميك بيطبل أو مكسور ومفكوك",
            default_severity: "LOW",
            is_hazard: false,
          },
        ],
      },
    ],
  },
  {
    id: "trade_appliances",
    slug: "APPLIANCES",
    name_en: "Major Landlord Appliances",
    name_ar: "أجهزة منزلية",
    icon: "tv",
    order_index: 10,
    subcategories: [
      {
        id: "sub_app_washers",
        trade_id: "trade_appliances",
        slug: "APPLIANCES_WASHERS",
        name_en: "Washing Machines & Dishwashers",
        name_ar: "غسالات أوتوماتيك وأطباق",
        symptoms: [
          {
            id: "sym_app_washer_spin",
            symptom_en: "Washing Machine Drum Banging",
            symptom_ar: "حلة الغسالة ترتج وترزع بقوة عند العصر",
            default_severity: "HIGH",
            is_hazard: false,
          },
        ],
      },
    ],
  },
  {
    id: "trade_grounds",
    slug: "GROUNDS_EXTERIOR",
    name_en: "Grounds, Exterior & Roofing",
    name_ar: "واجهات وأسطح وحدائق",
    icon: "home",
    order_index: 11,
    subcategories: [
      {
        id: "sub_grd_facades",
        trade_id: "trade_grounds",
        slug: "GROUNDS_FACADES",
        name_en: "Facades & Railings",
        name_ar: "واجهات وبروزات وسور السطح",
        symptoms: [
          {
            id: "sym_grd_parapet_crack",
            symptom_en: "Loose Facade Cladding",
            symptom_ar: "حجر تجليد هاشمي مخلوع من الواجهة ومعرض للسقوط",
            default_severity: "CRITICAL",
            is_hazard: true,
            hazard_instruction_en: "Falling hazard! Cordon off area below building facade immediately.",
            hazard_instruction_ar: "خطر سقوط حجارة! امنع مرور المشاة أسفل واجهة المبنى فوراً.",
          },
        ],
      },
    ],
  },
];
