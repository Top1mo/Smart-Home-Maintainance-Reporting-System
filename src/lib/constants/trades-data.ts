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
    "id": "trade_plumbing",
    "slug": "PLUMBING",
    "name_en": "Plumbing",
    "name_ar": "سباكة",
    "icon": "wrench",
    "order_index": 1,
    "subcategories": [
      {
        "id": "sub_plumb_pumps",
        "trade_id": "trade_plumbing",
        "slug": "PLUMBING_PUMPS",
        "name_en": "Booster Pumps & Roof Tanks",
        "name_ar": "مواتير وخزانات المياه",
        "is_elv": false,
        "symptoms": [
          {
            "id": "sym_pump_running_continuous",
            "symptom_en": "Booster Pump Running Continuously Without Taps Open",
            "symptom_ar": "موتور المياه شغال باستمرار ومبيفصلش بالفلماك",
            "default_severity": "MEDIUM",
            "is_hazard": false
          },
          {
            "id": "sym_tank_overflow",
            "symptom_en": "Roof Tank Overflowing Down Facade",
            "symptom_ar": "عوامة خزان السطح معطلة والمياه تفيض على الواجهة",
            "default_severity": "HIGH",
            "is_hazard": false
          },
          {
            "id": "sym_pump_flomac_rapid_cycling",
            "symptom_en": "Electronic Flow-Control (Flomac) Rapidly Clicking On/Off",
            "symptom_ar": "جهاز الفلماك بيفصل ويشتغل كل ثانيتين بتكتكة سريعة",
            "default_severity": "MEDIUM",
            "is_hazard": false
          },
          {
            "id": "sym_tank_algae_odor",
            "symptom_en": "Roof Water Tank Biofilm / Mud Sediment Buildup",
            "symptom_ar": "رواسب طمي وطحالب داخل خزان المياه العلوي",
            "default_severity": "MEDIUM",
            "is_hazard": false
          }
        ]
      },
      {
        "id": "sub_plumb_drainage",
        "trade_id": "trade_plumbing",
        "slug": "PLUMBING_DRAINAGE",
        "name_en": "Drainage & Traps",
        "name_ar": "صرف صحي ومجاري",
        "is_elv": false,
        "symptoms": [
          {
            "id": "sym_plumb_drain_clog",
            "symptom_en": "Shower / Floor Drain Backing Up",
            "symptom_ar": "انسداد بيبة الحمام والمياه طافية على الأرض",
            "default_severity": "HIGH",
            "is_hazard": false
          },
          {
            "id": "sym_plumb_toilet_overflow",
            "symptom_en": "Toilet Bowl Overflowing Sewage",
            "symptom_ar": "طفح مياه الصرف من قاعدة التواليت",
            "default_severity": "CRITICAL",
            "is_hazard": true,
            "hazard_instruction_en": "Sanitary hazard! Do not flush toilet. Keep bathroom door shut.",
            "hazard_instruction_ar": "خطر تلوث بيئي وصحي! لا تضغط على السيفون واقفل باب الحمام."
          },
          {
            "id": "sym_plumb_sewer_odor",
            "symptom_en": "Foul Sewer Gas Odor from Traps",
            "symptom_ar": "رائحة مجاري نفاذة خارجة من سيفونات الأحواض",
            "default_severity": "MEDIUM",
            "is_hazard": false
          },
          {
            "id": "sym_plumb_kitchen_sink_slow",
            "symptom_en": "Kitchen Sink Draining Extremely Slowly",
            "symptom_ar": "حوض المطبخ مسدود والمياه تصرف ببطء شديد",
            "default_severity": "LOW",
            "is_hazard": false
          },
          {
            "id": "sym_plumb_siphon_leak",
            "symptom_en": "Bottle Trap / Flexible Siphon Dripping Under Basin",
            "symptom_ar": "تسريب مياه من كوع صرف الحوض البلاستيك",
            "default_severity": "MEDIUM",
            "is_hazard": false
          }
        ]
      },
      {
        "id": "sub_plumb_valves",
        "trade_id": "trade_plumbing",
        "slug": "PLUMBING_VALVES",
        "name_en": "Taps, Mixers & Valves",
        "name_ar": "خلاطات ومحابس",
        "is_elv": false,
        "symptoms": [
          {
            "id": "sym_plumb_tap",
            "symptom_en": "Dripping or Running Tap",
            "symptom_ar": "حنفية بتنقط ومابتفصلش",
            "default_severity": "LOW",
            "is_hazard": false
          },
          {
            "id": "sym_plumb_mixer_leak",
            "symptom_en": "Mixer Base Leaking Water Under Basin",
            "symptom_ar": "تسريب مياه من قعدة الخلاط تحت الحوض",
            "default_severity": "MEDIUM",
            "is_hazard": false
          },
          {
            "id": "sym_plumb_angle_valve",
            "symptom_en": "Stuck or Seized Angle Valve",
            "symptom_ar": "محبس زاوية مجيم ومابيقفلش",
            "default_severity": "LOW",
            "is_hazard": false
          },
          {
            "id": "sym_plumb_shattaf_burst",
            "symptom_en": "Shattaf Hose Burst Under High Pressure",
            "symptom_ar": "انفجار خرطوم الشطاف بسبب ضغط المياه",
            "default_severity": "HIGH",
            "is_hazard": false
          },
          {
            "id": "sym_plumb_cartridge_grind",
            "symptom_en": "Single-Lever Ceramic Cartridge Stiff / Grinding",
            "symptom_ar": "قلب الخلاط السيراميك ثقيل جداً وبيزيق",
            "default_severity": "LOW",
            "is_hazard": false
          }
        ]
      },
      {
        "id": "sub_plumb_heaters",
        "trade_id": "trade_plumbing",
        "slug": "PLUMBING_HEATERS",
        "name_en": "Water Heaters",
        "name_ar": "سخانات المياه",
        "is_elv": false,
        "symptoms": [
          {
            "id": "sym_gas_leak",
            "symptom_en": "Gas Water Heater Gas Smell / Leak",
            "symptom_ar": "رائحة غاز نفاذة من سخان الغاز",
            "default_severity": "CRITICAL",
            "is_hazard": true,
            "hazard_instruction_en": "Explosion risk! Do NOT touch light switches. Shut off gas supply and open windows.",
            "hazard_instruction_ar": "خطر انفجار! لا تشعل أو تطفئ الكهرباء واقفل محبس الغاز وافتح النوافذ."
          },
          {
            "id": "sym_electric_heater_leak",
            "symptom_en": "Water Dripping from Electric Heater Body",
            "symptom_ar": "تنقيط مياه من جسم السخان الكهربائي",
            "default_severity": "CRITICAL",
            "is_hazard": true,
            "hazard_instruction_en": "Risk of electric shock! Turn off water heater circuit breaker immediately.",
            "hazard_instruction_ar": "خطر صعق كهربائي! افصل مفتاح السخان الكهربائي فوراً."
          },
          {
            "id": "sym_heater_no_hot",
            "symptom_en": "Heater Runs but No Hot Water Produced",
            "symptom_ar": "السخان شغال بس مفيش مياه سخنة بتنزل",
            "default_severity": "MEDIUM",
            "is_hazard": false
          },
          {
            "id": "sym_heater_safety_valve_dripping",
            "symptom_en": "Safety Relief Valve Constantly Discharging Steaming Water",
            "symptom_ar": "بلف الأمان في السخان بينزل مياه مغلية باستمرار",
            "default_severity": "HIGH",
            "is_hazard": false
          },
          {
            "id": "sym_heater_gas_pilot_out",
            "symptom_en": "Gas Heater Pilot Light Failing to Ignite / Spark Clicking",
            "symptom_ar": "شعلة سخان الغاز لا تعمل رغم استبدال الحجارة",
            "default_severity": "LOW",
            "is_hazard": false
          }
        ]
      },
      {
        "id": "sub_plumb_supply",
        "trade_id": "trade_plumbing",
        "slug": "PLUMBING_SUPPLY",
        "name_en": "Water Supply Pipes",
        "name_ar": "مواسير وتغذية مياه",
        "is_elv": false,
        "symptoms": [
          {
            "id": "sym_plumb_pipe_burst",
            "symptom_en": "Burst Concealed PPR Water Pipe",
            "symptom_ar": "كسر ماسورة مياه مدفونة PPR",
            "default_severity": "CRITICAL",
            "is_hazard": true,
            "hazard_instruction_en": "Flood danger! Shut off the main water valve to the apartment immediately.",
            "hazard_instruction_ar": "خطر غرق الشقة! اغلق المحبس العمومي للمياه فوراً."
          },
          {
            "id": "sym_plumb_low_pressure",
            "symptom_en": "Severe Drop in Water Pressure",
            "symptom_ar": "ضعف شديد في ضغط المياه في كل الحنفيات",
            "default_severity": "MEDIUM",
            "is_hazard": false
          },
          {
            "id": "sym_plumb_rusty_water",
            "symptom_en": "Discolored / Rusty Water from Taps",
            "symptom_ar": "مياه صفراء معكرة أو برائحة صدأ",
            "default_severity": "MEDIUM",
            "is_hazard": false
          },
          {
            "id": "sym_plumb_water_hammer",
            "symptom_en": "Severe Water Hammer / Banging Pipes on Tap Closure",
            "symptom_ar": "صوت خبط ورزع قوي في المواسير عند قفل الحنفية",
            "default_severity": "MEDIUM",
            "is_hazard": false
          },
          {
            "id": "sym_plumb_riser_damp",
            "symptom_en": "Moisture Seeping from Main Plumbing Shaft Riser",
            "symptom_ar": "رشح ورطوبة داكنة في منور العمارة من صاعد التغذية",
            "default_severity": "HIGH",
            "is_hazard": false
          }
        ]
      }
    ]
  },
  {
    "id": "trade_electrical",
    "slug": "ELECTRICAL",
    "name_en": "Electrical",
    "name_ar": "كهرباء",
    "icon": "zap",
    "order_index": 2,
    "subcategories": [
      {
        "id": "sub_elv_gates",
        "trade_id": "trade_electrical",
        "slug": "ELECTRICAL_ELV_GATES",
        "name_en": "Automated Gates & Barriers",
        "name_ar": "بوابات أوتوماتيكية وإلكترونية",
        "is_elv": true,
        "symptoms": [
          {
            "id": "sym_gate_beam",
            "symptom_en": "Safety Photocell Failure / Crushing Risk",
            "symptom_ar": "حساس الأمان معطل والبوابة تغلق على السيارات/الأشخاص",
            "default_severity": "CRITICAL",
            "is_hazard": true,
            "hazard_instruction_en": "Crush hazard! Stop electric gate operation and switch to manual clutch.",
            "hazard_instruction_ar": "خطر سحق ميكانيكي! أوقف تشغيل البوابة وحولها للفتح اليدوي."
          },
          {
            "id": "sym_gate_remote_unresponsive",
            "symptom_en": "Automated Sliding Gate Unresponsive to Remotes",
            "symptom_ar": "بوابة الجراج الإلكترونية لا تستجيب للريموت",
            "default_severity": "HIGH",
            "is_hazard": false
          },
          {
            "id": "sym_gate_motor_grind",
            "symptom_en": "Gate Motor Loud Grinding Sound / Stuck Mid-Travel",
            "symptom_ar": "صوت تكسير تروس في موتور البوابة وهي واقفة بالنص",
            "default_severity": "HIGH",
            "is_hazard": false
          },
          {
            "id": "sym_gate_limit_switch_miss",
            "symptom_en": "Gate Overrunning End Stops / Slams End Post",
            "symptom_ar": "مفتاح نهاية المشوار لا يفصل والبوابة تصطدم بالقائم بقوة",
            "default_severity": "HIGH",
            "is_hazard": false
          },
          {
            "id": "sym_gate_flashing_lamp_blown",
            "symptom_en": "Gate Movement Warning Flashing Strobe Blown",
            "symptom_ar": "فلاشر التنبيه الضوئي لحركة البوابة محروق",
            "default_severity": "LOW",
            "is_hazard": false
          }
        ]
      },
      {
        "id": "sub_elv_cctv",
        "trade_id": "trade_electrical",
        "slug": "ELECTRICAL_ELV_CCTV",
        "name_en": "CCTV Camera Surveillance",
        "name_ar": "كاميرات المراقبة",
        "is_elv": true,
        "symptoms": [
          {
            "id": "sym_cctv_black",
            "symptom_en": "Camera Black Screen / Video Loss",
            "symptom_ar": "شاشة سوداء أو فقدان إشارة الفيديو للكاميرا",
            "default_severity": "MEDIUM",
            "is_hazard": false
          },
          {
            "id": "sym_cctv_nvr_offline",
            "symptom_en": "NVR Storage Unit Offline / Not Recording",
            "symptom_ar": "جهاز التسجيل NVR فاصل ومابيسجلش",
            "default_severity": "HIGH",
            "is_hazard": false
          },
          {
            "id": "sym_cctv_night_vision",
            "symptom_en": "Infrared Night Vision LEDs Blown",
            "symptom_ar": "الرؤية الليلية للكاميرا لا تعمل في الظلام",
            "default_severity": "LOW",
            "is_hazard": false
          },
          {
            "id": "sym_cctv_ptz_stuck",
            "symptom_en": "PTZ Motorized Camera Pan/Tilt Mechanical Freeze",
            "symptom_ar": "كاميرا متحركة PTZ معلقة ولا تستجيب لأوامر الدوران والزووم",
            "default_severity": "MEDIUM",
            "is_hazard": false
          },
          {
            "id": "sym_cctv_water_condensation",
            "symptom_en": "Internal Condensation / Moisture Inside Camera Glass Dome",
            "symptom_ar": "تكثف بخار ماء وضباب داخل زجاج قبة كاميرا المراقبة",
            "default_severity": "LOW",
            "is_hazard": false
          }
        ]
      },
      {
        "id": "sub_elec_panel",
        "trade_id": "trade_electrical",
        "slug": "ELECTRICAL_PANEL",
        "name_en": "Distribution Boards & Breakers",
        "name_ar": "لوحات التوزيع والقواطع",
        "is_elv": false,
        "symptoms": [
          {
            "id": "sym_elec_sparks",
            "symptom_en": "Sparks / Arcing from Breaker Panel",
            "symptom_ar": "شرز كهربائي أو فرقعة نارية من لوحة القواطع",
            "default_severity": "CRITICAL",
            "is_hazard": true,
            "hazard_instruction_en": "Turn off main breaker immediately. Do not touch charred fixtures.",
            "hazard_instruction_ar": "افصل القاطع العمومي فوراً ولا تلمس المفاتيح المحترقة."
          },
          {
            "id": "sym_elec_tripping_breaker",
            "symptom_en": "Main Breaker Tripping Repeatedly",
            "symptom_ar": "القاطع الرئيسي بيفصل باستمرار ولا يقبل الرفع",
            "default_severity": "HIGH",
            "is_hazard": false
          },
          {
            "id": "sym_elec_panel_smell",
            "symptom_en": "Acrid Burning Plastic Smell from Electrical Board",
            "symptom_ar": "رائحة شياط بلاستيك قوية خارجة من لوحة الكهرباء",
            "default_severity": "CRITICAL",
            "is_hazard": true,
            "hazard_instruction_en": "Fire risk! Disconnect main switch and do not restore until inspected.",
            "hazard_instruction_ar": "خطر حريق! افصل السكينة العمومية فوراً ولا تعيد تشغيلها قبل الفحص."
          },
          {
            "id": "sym_elec_busbar_overheat",
            "symptom_en": "Copper Busbar Discoloration / Scorched Insulation",
            "symptom_ar": "سخونة شديدة وتفحم في بارة النحاس الرئيسية باللوحة",
            "default_severity": "CRITICAL",
            "is_hazard": true,
            "hazard_instruction_en": "Fire risk! Shut main supply down immediately.",
            "hazard_instruction_ar": "خطر حريق داهم! اقطع التيار من المصدر الرئيسي فوراً."
          },
          {
            "id": "sym_elec_earth_leakage_trip",
            "symptom_en": "RCD / ELCB Ground Leakage Trip Won't Reset",
            "symptom_ar": "مفتاح إيرث ليكدج الحماية من الصعق ساقط ولا يقبل الرفع",
            "default_severity": "HIGH",
            "is_hazard": false
          }
        ]
      },
      {
        "id": "sub_elec_grounding",
        "trade_id": "trade_electrical",
        "slug": "ELECTRICAL_GROUNDING",
        "name_en": "Earthing & Leakage Hazards",
        "name_ar": "التأريض والماس الكهربائي",
        "is_elv": false,
        "symptoms": [
          {
            "id": "sym_elec_shock",
            "symptom_en": "Electric Shock Touching Appliance or Tap",
            "symptom_ar": "لدغة كهرباء عند لمس الغسالة أو الثلاجة أو الصنبور",
            "default_severity": "CRITICAL",
            "is_hazard": true,
            "hazard_instruction_en": "Earthing failure! Stop using appliance/tap immediately and unplug safely.",
            "hazard_instruction_ar": "عطل خطير في التأريض! توقف عن لمس الجهاز أو فتح الصنبور فوراً."
          },
          {
            "id": "sym_elec_neutral_float",
            "symptom_en": "Floating Neutral / Lights Dimming and Surging Abnormally",
            "symptom_ar": "تذبذب خطير في الفولت وارتفاع مفاجئ يحرق الأجهزة الكهربائية",
            "default_severity": "CRITICAL",
            "is_hazard": true,
            "hazard_instruction_en": "Overvoltage hazard! Disconnect sensitive electronics immediately.",
            "hazard_instruction_ar": "خطر احتراق الأجهزة! افصل فيش الأجهزة الإلكترونية الحساسة فوراً."
          },
          {
            "id": "sym_elec_ground_rod_disconnected",
            "symptom_en": "Main Earthing Electrode Disconnected / Corroded",
            "symptom_ar": "كابل التأريض الأرضي العمومي مقطوع في غرفة الكهرباء",
            "default_severity": "HIGH",
            "is_hazard": false
          }
        ]
      },
      {
        "id": "sub_elv_intercom",
        "trade_id": "trade_electrical",
        "slug": "ELECTRICAL_ELV_INTERCOM",
        "name_en": "Intercom & Access Control",
        "name_ar": "الإنتركم والتحكم في الدخول",
        "is_elv": true,
        "symptoms": [
          {
            "id": "sym_intercom_dead",
            "symptom_en": "Handset / Indoor Monitor Does Not Ring",
            "symptom_ar": "سماعة الإنتركم لا ترن عند الضغط من الخارج",
            "default_severity": "MEDIUM",
            "is_hazard": false
          },
          {
            "id": "sym_intercom_lock_release",
            "symptom_en": "Intercom Door Release Button Not Unlocking Gate",
            "symptom_ar": "زر فتح الباب بالإنتركم مبيفتحش كالون العمارة",
            "default_severity": "HIGH",
            "is_hazard": false
          },
          {
            "id": "sym_intercom_audio_static",
            "symptom_en": "Severe Audio Static / Cannot Hear Visitor",
            "symptom_ar": "وش وشوشرة قوية في صوت سماعة الإنتركم",
            "default_severity": "LOW",
            "is_hazard": false
          },
          {
            "id": "sym_intercom_outdoor_panel_buttons",
            "symptom_en": "Outdoor Call Panel Push Buttons Stuck Depressed",
            "symptom_ar": "أزرار لوحة الإنتركم الخارجية معلقة ومضغوطة للداخل",
            "default_severity": "MEDIUM",
            "is_hazard": false
          },
          {
            "id": "sym_intercom_rfid_fob_unrecognized",
            "symptom_en": "RFID Keyfob Reader Refuses Access to Residents",
            "symptom_ar": "قارئ الميداليات الإلكترونية للباب يرفض الفتح للسكان",
            "default_severity": "HIGH",
            "is_hazard": false
          }
        ]
      },
      {
        "id": "sub_elec_lighting",
        "trade_id": "trade_electrical",
        "slug": "ELECTRICAL_LIGHTING",
        "name_en": "Lighting Fixtures & Drivers",
        "name_ar": "إضاءة وليد وسبوتات",
        "is_elv": false,
        "symptoms": [
          {
            "id": "sym_elec_water",
            "symptom_en": "Water Dripping Through Light Fixture",
            "symptom_ar": "مياه بتنزل من داخل بيت النور أو السبوت لايت",
            "default_severity": "CRITICAL",
            "is_hazard": true,
            "hazard_instruction_en": "Deadly electrocution hazard! Disconnect main electrical breaker, then shut water stopcock.",
            "hazard_instruction_ar": "خطر صعق مميت! افصل القاطع العمومي أولاً ثم أغلق محبس المياه العمومي."
          },
          {
            "id": "sym_elec_led_flicker",
            "symptom_en": "LED Strips / Spotlights Rapidly Flickering",
            "symptom_ar": "رعشة شديدة في إضاءة الليد بروفايل أو السبوتات",
            "default_severity": "LOW",
            "is_hazard": false
          },
          {
            "id": "sym_elec_driver_failure",
            "symptom_en": "Hidden LED Power Supply / Driver Blown",
            "symptom_ar": "احتراق ترانس أو درايفر الليد المخفي في السقف",
            "default_severity": "MEDIUM",
            "is_hazard": false
          },
          {
            "id": "sym_elec_chandelier_loose",
            "symptom_en": "Heavy Ceiling Chandelier Hook Pulling Out of Concrete",
            "symptom_ar": "جنش النجفة مخلوع والنجفة مائلة ومهددة بالسقوط",
            "default_severity": "CRITICAL",
            "is_hazard": true,
            "hazard_instruction_en": "Falling object danger! Do not walk underneath chandelier.",
            "hazard_instruction_ar": "خطر سقوط النجفة! لا تقف أو تمر أسفلها فوراً."
          },
          {
            "id": "sym_elec_stair_timer_fail",
            "symptom_en": "Staircase Automatic Timer Relay Jammed On",
            "symptom_ar": "ماكينة سلم العمارة معلقة وإضاءة المدخل لا تفصل نهائياً",
            "default_severity": "LOW",
            "is_hazard": false
          }
        ]
      },
      {
        "id": "sub_elec_outlets",
        "trade_id": "trade_electrical",
        "slug": "ELECTRICAL_OUTLETS",
        "name_en": "Outlets, Switches & Power Points",
        "name_ar": "برايز ومفاتيح وفيش",
        "is_elv": false,
        "symptoms": [
          {
            "id": "sym_elec_socket_burnt",
            "symptom_en": "Charred / Blackened Wall Outlet",
            "symptom_ar": "بريزة كهرباء محروقة وفيها آثار سواد وشياط",
            "default_severity": "HIGH",
            "is_hazard": false
          },
          {
            "id": "sym_elec_loose_socket",
            "symptom_en": "Loose Wall Socket Hanging Out of Wall",
            "symptom_ar": "فيشة مخلوعة من الحيطة والأسلاك مكشوفة",
            "default_severity": "CRITICAL",
            "is_hazard": true,
            "hazard_instruction_en": "Exposed live wires! Keep children away. Do not insert any plugs.",
            "hazard_instruction_ar": "أسلاك حية مكشوفة! امنع الأطفال من الاقتراب ولا تستخدم الفيشة."
          },
          {
            "id": "sym_elec_switch_failure",
            "symptom_en": "Light Switch Not Activating Circuit",
            "symptom_ar": "مفتاح الإنارة مبيوصلش كهرباء للغرفة",
            "default_severity": "LOW",
            "is_hazard": false
          },
          {
            "id": "sym_elec_shuttered_socket_stuck",
            "symptom_en": "Child Safety Socket Shutter Jammed Shut",
            "symptom_ar": "ستارة أمان الأطفال في الفيشة معلقة والفيشة لا تقبل دخول الشاحن",
            "default_severity": "LOW",
            "is_hazard": false
          },
          {
            "id": "sym_elec_dimmer_hum",
            "symptom_en": "Rotary Dimmer Switch Buzzing & Radiating Heat",
            "symptom_ar": "مفتاح الديمر الدوار بيزن بشدة وسخن جداً عند لمسه",
            "default_severity": "MEDIUM",
            "is_hazard": false
          }
        ]
      },
      {
        "id": "sub_elv_wifi",
        "trade_id": "trade_electrical",
        "slug": "ELECTRICAL_ELV_WIFI",
        "name_en": "Wi-Fi Access Points & LAN",
        "name_ar": "نقاط الواي فاي والشبكات",
        "is_elv": true,
        "symptoms": [
          {
            "id": "sym_wifi_offline",
            "symptom_en": "Ceiling Access Point Offline (No PoE Power)",
            "symptom_ar": "نقطة توزيع الواي فاي فاصلة باور",
            "default_severity": "MEDIUM",
            "is_hazard": false
          },
          {
            "id": "sym_wifi_switch_loop",
            "symptom_en": "Network Switch Flapping / LAN Drops",
            "symptom_ar": "سويتش شبكة البيانات بيفصل نت عن الشقة",
            "default_severity": "MEDIUM",
            "is_hazard": false
          },
          {
            "id": "sym_wifi_slow_roaming",
            "symptom_en": "Dead Zones in Villa / Seamless Roaming Dropping Calls",
            "symptom_ar": "مناطق ميتة في التغطية وتقطيع مستمر في المكالمات",
            "default_severity": "LOW",
            "is_hazard": false
          },
          {
            "id": "sym_wifi_patch_cable_damaged",
            "symptom_en": "Cat6 Structured Cable Pinched Behind Skirting",
            "symptom_ar": "سلك النت الرئيسي مقطوع ومضغوط خلف وزرة الحائط",
            "default_severity": "LOW",
            "is_hazard": false
          },
          {
            "id": "sym_wifi_rack_overheating",
            "symptom_en": "Server / Patch Cabinet Fan Failure / Overheating",
            "symptom_ar": "مروحة كابينة السيرفر معطلة والراوتر يفصل من السخونة",
            "default_severity": "MEDIUM",
            "is_hazard": false
          },
          {
            "id": "sym_other_custom",
            "symptom_en": "[عطل مخصص: الحنكلولو]",
            "symptom_ar": "[عطل مخصص: الحنكلولو]",
            "default_severity": "MEDIUM",
            "is_hazard": false
          }
        ]
      }
    ]
  },
  {
    "id": "trade_hvac",
    "slug": "HVAC",
    "name_en": "HVAC & Air Conditioning",
    "name_ar": "تكييف وتبريد",
    "icon": "fan",
    "order_index": 3,
    "subcategories": [
      {
        "id": "sub_hvac_central",
        "trade_id": "trade_hvac",
        "slug": "HVAC_CENTRAL",
        "name_en": "Central & Ducted Systems",
        "name_ar": "تكييف كونسيلد ومركزي",
        "is_elv": false,
        "symptoms": [
          {
            "id": "sym_hvac_tray_overflow",
            "symptom_en": "Concealed Unit Drain Tray Overflowing Above Gypsum",
            "symptom_ar": "طشت صرف التكييف الكونسيلد طافح فوق الجبس بورد",
            "default_severity": "CRITICAL",
            "is_hazard": true,
            "hazard_instruction_en": "Ceiling soak hazard! Turn off AC system immediately to stop condensation drip.",
            "hazard_instruction_ar": "خطر سقوط السقف! اقفل جهاز التكييف فوراً لمنع تراكم مياه الصرف."
          },
          {
            "id": "sym_hvac_thermostat_dead",
            "symptom_en": "Digital Wall Thermostat Screen Blank / No Response",
            "symptom_ar": "شاشة ثرموستات التكييف الكونسيلد طافية تماماً",
            "default_severity": "MEDIUM",
            "is_hazard": false
          },
          {
            "id": "sym_hvac_duct_whistle",
            "symptom_en": "Air Supply Grille Whistling Under Air Velocity",
            "symptom_ar": "صوت صفير هواء عالي جداً من جريلات التكييف في الصالة",
            "default_severity": "LOW",
            "is_hazard": false
          },
          {
            "id": "sym_hvac_vav_stuck",
            "symptom_en": "Zone Damper Stuck / Freezing One Room While Other Is Hot",
            "symptom_ar": "دمبر توزيع الهواء معلق؛ غرفة مثلجة وغرفة تانية حارة",
            "default_severity": "MEDIUM",
            "is_hazard": false
          }
        ]
      },
      {
        "id": "sub_hvac_refrigerant",
        "trade_id": "trade_hvac",
        "slug": "HVAC_REFRIGERANT",
        "name_en": "Refrigerant & Compressors",
        "name_ar": "غاز الفريون والكمبروسور",
        "is_elv": false,
        "symptoms": [
          {
            "id": "sym_hvac_freon_hiss",
            "symptom_en": "Audible Freon Gas Hissing Leak",
            "symptom_ar": "صوت تنفيس غاز فريون واضح من خطوط النحاس",
            "default_severity": "HIGH",
            "is_hazard": false
          },
          {
            "id": "sym_hvac_compressor_hum_trip",
            "symptom_en": "Compressor Stalled / Loud Hum Tripping Breaker",
            "symptom_ar": "كمبروسور التكييف بيزن ومابيقومش ويفصل مفتاح اللوحة",
            "default_severity": "HIGH",
            "is_hazard": false
          },
          {
            "id": "sym_hvac_expansion_valve_frost",
            "symptom_en": "Thermal Expansion Valve Clogged / Frosted Thin Pipe",
            "symptom_ar": "انسداد بلف الانتشار وتجمد خط السائل النحاسي الرفيع",
            "default_severity": "MEDIUM",
            "is_hazard": false
          },
          {
            "id": "sym_hvac_fan_capacitor_bulge",
            "symptom_en": "Outdoor Fan Motor Capacitor Swollen / Fan Inactive",
            "symptom_ar": "كباستور مروحة الوحدة الخارجية منتفخ والمروحة لا تدور",
            "default_severity": "MEDIUM",
            "is_hazard": false
          }
        ]
      },
      {
        "id": "sub_hvac_split",
        "trade_id": "trade_hvac",
        "slug": "HVAC_SPLIT",
        "name_en": "Split A/C Units",
        "name_ar": "تكييفات سبليت جدارية",
        "is_elv": false,
        "symptoms": [
          {
            "id": "sym_hvac_warm",
            "symptom_en": "A/C Blowing Warm Air / Compressor Inactive",
            "symptom_ar": "التكييف شغال هواء عادي ومابيسقعش خالص",
            "default_severity": "MEDIUM",
            "is_hazard": false
          },
          {
            "id": "sym_hvac_water_leak",
            "symptom_en": "A/C Indoor Unit Dripping Water on Furniture",
            "symptom_ar": "الوحدة الداخلية للتكييف بتسرب مياه على الفرش",
            "default_severity": "HIGH",
            "is_hazard": false
          },
          {
            "id": "sym_hvac_ice_buildup",
            "symptom_en": "Evaporator Coils Frozen with Solid Ice",
            "symptom_ar": "تكون ثلج كثيف على سربنتينة التكييف والمواسير",
            "default_severity": "MEDIUM",
            "is_hazard": false
          },
          {
            "id": "sym_hvac_fan_rattle",
            "symptom_en": "Indoor Cross-Flow Blower Fan Imbalanced & Rattling",
            "symptom_ar": "صوت خبط ورعشة قوية في مروحة بلاور التكييف الداخلي",
            "default_severity": "LOW",
            "is_hazard": false
          },
          {
            "id": "sym_hvac_stale_odor",
            "symptom_en": "Musty Vinegar / Mold Odor When A/C Fan Starts",
            "symptom_ar": "رائحة كمكمة وعفونة قوية تخرج مع بداية تشغيل التكييف",
            "default_severity": "LOW",
            "is_hazard": false
          }
        ]
      }
    ]
  },
  {
    "id": "trade_carpentry",
    "slug": "CARPENTRY",
    "name_en": "Carpentry & Joinery",
    "name_ar": "نجارة وأبواب",
    "icon": "hammer",
    "order_index": 4,
    "subcategories": [
      {
        "id": "sub_carp_cabinets",
        "trade_id": "trade_carpentry",
        "slug": "CARPENTRY_CABINETS",
        "name_en": "Cabinets & Wardrobes",
        "name_ar": "مطابخ وخزائن ملابس",
        "is_elv": false,
        "symptoms": [
          {
            "id": "sym_carp_cabinet_hinge",
            "symptom_en": "Kitchen Cabinet Door Fallen Off Hinges",
            "symptom_ar": "دلفة مطبخ ساقطة ومفصلاتها مكسورة",
            "default_severity": "LOW",
            "is_hazard": false
          },
          {
            "id": "sym_carp_drawer_slide",
            "symptom_en": "Dressing Room Heavy Drawer Slide Broken",
            "symptom_ar": "مجرى درج الدريسنج مكسور والدرج واقع",
            "default_severity": "LOW",
            "is_hazard": false
          },
          {
            "id": "sym_carp_shelf_bowing",
            "symptom_en": "Pantry Wooden Shelf Severely Bowed / Ready to Snap",
            "symptom_ar": "رف دولاب الخزين مقوس بشدة ومعرض للكسر والسقوط",
            "default_severity": "MEDIUM",
            "is_hazard": false
          },
          {
            "id": "sym_carp_sliding_wardrobe_derail",
            "symptom_en": "Heavy Mirror Wardrobe Sliding Door Off Upper Rail",
            "symptom_ar": "دلفة دولاب جرار ثقيلة بمرايا خارجة عن المجرى العلوي",
            "default_severity": "HIGH",
            "is_hazard": false
          }
        ]
      },
      {
        "id": "sub_carp_doors",
        "trade_id": "trade_carpentry",
        "slug": "CARPENTRY_DOORS",
        "name_en": "Doors & Windows",
        "name_ar": "أبواب وشبابيك خشب",
        "is_elv": false,
        "symptoms": [
          {
            "id": "sym_carp_door_scrape",
            "symptom_en": "Door Scraping Floor / Binding Against Frame",
            "symptom_ar": "الباب يحك في الأرضية أو الحلق",
            "default_severity": "LOW",
            "is_hazard": false
          },
          {
            "id": "sym_carp_door_swollen",
            "symptom_en": "Bathroom Door Warped / Swollen from Steam",
            "symptom_ar": "باب الحمام متمدد من الرطوبة ومبيفتحش غير بالعافية",
            "default_severity": "LOW",
            "is_hazard": false
          },
          {
            "id": "sym_carp_architrave_loose",
            "symptom_en": "Door Wooden Architrave Moulding Coming Off Wall",
            "symptom_ar": "برور الباب الخشب مخلوعة من الحائط والمسامير بارزة",
            "default_severity": "LOW",
            "is_hazard": false
          },
          {
            "id": "sym_carp_door_glass_rattle",
            "symptom_en": "Glazed Interior Door Glass Bead Loose / Danger of Drop",
            "symptom_ar": "سدابة زجاج الباب الداخلي مفكوكة واللوح الزجاجي يهتز",
            "default_severity": "MEDIUM",
            "is_hazard": false
          }
        ]
      },
      {
        "id": "sub_carp_locks",
        "trade_id": "trade_carpentry",
        "slug": "CARPENTRY_LOCKS",
        "name_en": "Locks, Latches & Hinges",
        "name_ar": "كوالين ومقابض ومفصلات",
        "is_elv": false,
        "symptoms": [
          {
            "id": "sym_carp_lock_jam",
            "symptom_en": "Front Door Cylinder Seized / Resident Trapped",
            "symptom_ar": "كالون باب الشقة مجيم والمفتاح معلق داخل القلب",
            "default_severity": "HIGH",
            "is_hazard": false
          },
          {
            "id": "sym_carp_hinge_loose",
            "symptom_en": "Door Hinge Screws Stripped from Jamb",
            "symptom_ar": "مفصلات الباب مفكوكة من الحلق والباب ساقط",
            "default_severity": "MEDIUM",
            "is_hazard": false
          },
          {
            "id": "sym_carp_handle_loose",
            "symptom_en": "Door Handle Spindle Slipping / Handle Droops",
            "symptom_ar": "أكرة الباب بتلف على الفاضي واللسان لا يتحرك",
            "default_severity": "LOW",
            "is_hazard": false
          },
          {
            "id": "sym_carp_door_closer_leak",
            "symptom_en": "Hydraulic Overhead Door Closer Leaking Oil & Slams",
            "symptom_ar": "دفاش الباب الهيدروليكي يسرب زيت والباب يرزع بقوة",
            "default_severity": "MEDIUM",
            "is_hazard": false
          }
        ]
      }
    ]
  },
  {
    "id": "trade_aluminum",
    "slug": "ALUMINUM",
    "name_en": "Aluminum & Glazing Works",
    "name_ar": "ألوميتال وزجاج",
    "icon": "square",
    "order_index": 5,
    "subcategories": [
      {
        "id": "sub_alum_windows",
        "trade_id": "trade_aluminum",
        "slug": "ALUMINUM_WINDOWS",
        "name_en": "Aluminum Windows & Balconies",
        "name_ar": "شبابيك وبلكونات ألوميتال",
        "is_elv": false,
        "symptoms": [
          {
            "id": "sym_alum_slider_stuck",
            "symptom_en": "Jumbo Balcony Slider Derailed / Jammed",
            "symptom_ar": "دلفة شباك ألوميتال جامبو خارجة عن المجرى ومعلقة",
            "default_severity": "MEDIUM",
            "is_hazard": false
          },
          {
            "id": "sym_alum_water_ingress",
            "symptom_en": "Rain Water Leaking Through Window Frame Seals",
            "symptom_ar": "تسريب مياه أمطار من فواصل قطاع الألوميتال",
            "default_severity": "HIGH",
            "is_hazard": false
          },
          {
            "id": "sym_alum_latch_broken",
            "symptom_en": "Aluminum Window Crescent Sash Lock Broken",
            "symptom_ar": "سكاكة شباك الألوميتال الهلالية مكسورة ولا تحكم الغلق",
            "default_severity": "LOW",
            "is_hazard": false
          },
          {
            "id": "sym_alum_flyscreen_torn",
            "symptom_en": "Insect Screen Mesh Wire Torn / Pushed Out",
            "symptom_ar": "سلك شباك الألوميتال مقطوع ويدخل الحشرات",
            "default_severity": "LOW",
            "is_hazard": false
          }
        ]
      },
      {
        "id": "sub_alum_glass",
        "trade_id": "trade_aluminum",
        "slug": "ALUMINUM_GLASS",
        "name_en": "Glass Panes & Mirrors",
        "name_ar": "ألواح زجاج ومرايات",
        "is_elv": false,
        "symptoms": [
          {
            "id": "sym_alum_double_glazed_fog",
            "symptom_en": "Double-Glazed Panel Fogged / Seal Failure",
            "symptom_ar": "تغبش وضباب داخل لوح الزجاج الدبل وفقدان العزل",
            "default_severity": "LOW",
            "is_hazard": false
          },
          {
            "id": "sym_alum_balcony_glass_wobble",
            "symptom_en": "Glass Balustrade Clamping Shoes Loose",
            "symptom_ar": "لوح درابزين البلكونة الزجاجي يتحرك بشدة وغير مثبت جيداً",
            "default_severity": "CRITICAL",
            "is_hazard": true,
            "hazard_instruction_en": "Fall danger! Keep off balcony until railing is secured.",
            "hazard_instruction_ar": "خطر سقوط من علو! لا تقترب من درابزين التراس لحين تثبيته."
          },
          {
            "id": "sym_alum_mirror_black_edge",
            "symptom_en": "Bathroom Mirror Silver Backing Desilvered / Black Edges",
            "symptom_ar": "سواد وتآكل في طبقة الفضة الخلفية لمرايا الحمام",
            "default_severity": "LOW",
            "is_hazard": false
          },
          {
            "id": "sym_alum_window_crank_stripped",
            "symptom_en": "Awning Window Friction Stay Arm Rivet Snapped",
            "symptom_ar": "ذراع مقص شباك الحمام الألوميتال القلاب مكسور واللوح معلق",
            "default_severity": "MEDIUM",
            "is_hazard": false
          }
        ]
      },
      {
        "id": "sub_alum_shower",
        "trade_id": "trade_aluminum",
        "slug": "ALUMINUM_SHOWER",
        "name_en": "Shower Cabins & Tempered Glass",
        "name_ar": "كبائن شاور وزجاج سيكوريت",
        "is_elv": false,
        "symptoms": [
          {
            "id": "sym_glass_crack",
            "symptom_en": "Cracked / Chipped Tempered Glass Shower Door",
            "symptom_ar": "شرخ أو نقرة في زجاج الشاور السيكوريت",
            "default_severity": "CRITICAL",
            "is_hazard": true,
            "hazard_instruction_en": "Shatter risk! Tempered glass may burst. Do not slide or force door.",
            "hazard_instruction_ar": "خطر انفجار الزجاج! الزجاج السيكوريت المشروخ قد يتفتت فجأة."
          },
          {
            "id": "sym_alum_shower_wheel",
            "symptom_en": "Shower Cabin Upper Roller Wheel Snapped",
            "symptom_ar": "عجلة كابينة الشاور مكسورة واللوح الزجاجي مائل",
            "default_severity": "HIGH",
            "is_hazard": false
          },
          {
            "id": "sym_alum_shower_magnetic_seal",
            "symptom_en": "Shower Door Magnetic Rubber Seal Detached",
            "symptom_ar": "الكاوتش المغناطيسي لكابينة الشاور مفكوك ويسرب مياه للخارج",
            "default_severity": "LOW",
            "is_hazard": false
          },
          {
            "id": "sym_alum_shower_hinge_creak",
            "symptom_en": "Stainless Glass-to-Wall Hinge Binding / Sagging",
            "symptom_ar": "مفصلة زجاج السيكوريت مخلوعة من الحائط والباب ساقط على الأرض",
            "default_severity": "HIGH",
            "is_hazard": false
          }
        ]
      }
    ]
  },
  {
    "id": "trade_gypsum",
    "slug": "GYPSUM",
    "name_en": "Gypsum Boards & False Ceilings",
    "name_ar": "جبس بورد وأسقف معلقة",
    "icon": "layers",
    "order_index": 6,
    "subcategories": [
      {
        "id": "sub_gyp_joints",
        "trade_id": "trade_gypsum",
        "slug": "GYPSUM_JOINTS",
        "name_en": "Joints, Cracks & Openings",
        "name_ar": "شروخ وفواصل وفتحات",
        "is_elv": false,
        "symptoms": [
          {
            "id": "sym_gyp_joint_crack",
            "symptom_en": "Hairline Cracking Along Tape Joints",
            "symptom_ar": "شروخ وتشققات شعرية على فواصل ألواح الجبس والمعجون",
            "default_severity": "LOW",
            "is_hazard": false
          },
          {
            "id": "sym_gyp_access_door_drop",
            "symptom_en": "AC Inspection Hatch Door Displaced / Hanging Open",
            "symptom_ar": "باب فتحة الصيانة للتكييف مخلوع ويتدلى من السقف",
            "default_severity": "MEDIUM",
            "is_hazard": false
          },
          {
            "id": "sym_gyp_curtain_box_split",
            "symptom_en": "Hidden Curtain Pelmet Box Separating from Ceiling",
            "symptom_ar": "بيت الستارة الجبس بورد مشروخ ومفصول عن السقف الرئيسي",
            "default_severity": "LOW",
            "is_hazard": false
          },
          {
            "id": "sym_gyp_corner_bead_dent",
            "symptom_en": "Metal Corner Bead Dented / Plaster Spalled on Edge",
            "symptom_ar": "زاوية الكورنر بيد المعدنية منبعجة والمعجون متكسر من الصدمة",
            "default_severity": "LOW",
            "is_hazard": false
          }
        ]
      },
      {
        "id": "sub_gyp_suspension",
        "trade_id": "trade_gypsum",
        "slug": "GYPSUM_SUSPENSION",
        "name_en": "Structural Suspension & Sagging",
        "name_ar": "هبوط وترخيم الأسقف",
        "is_elv": false,
        "symptoms": [
          {
            "id": "sym_gyp_sagging",
            "symptom_en": "Visible Sagging / Belly in Gypsum Ceiling",
            "symptom_ar": "ترخيم وهبوط ملحوظ في منتصف لوح الجبس بورد",
            "default_severity": "CRITICAL",
            "is_hazard": true,
            "hazard_instruction_en": "Collapse hazard! Evacuate area directly below ceiling immediately. Keep room clear.",
            "hazard_instruction_ar": "خطر انهيار وسقوط السقف! أخلِ المنطقة أسفل السقف المعلق فوراً وامنع دخول الأطفال للغرفة."
          },
          {
            "id": "sym_gyp_rod_anchor_slip",
            "symptom_en": "Ceiling Steel Suspension Hanger Pulling Out of Concrete",
            "symptom_ar": "تيش التعليق المعدني مفكوك من الخرسانة والسقف يميل",
            "default_severity": "CRITICAL",
            "is_hazard": true,
            "hazard_instruction_en": "Collapse risk! Do not enter room until shoring is installed.",
            "hazard_instruction_ar": "خطر انهيار! لا تدخل الغرفة حتى يتم تدعيم وتأمين السقف."
          },
          {
            "id": "sym_gyp_shadow_gap_crack",
            "symptom_en": "Perimeter Shadow Gap Channel Detaching from Wall",
            "symptom_ar": "شاسيه الشادو جاب الجانبي مفكوك من الحائط والسقف يهتز",
            "default_severity": "HIGH",
            "is_hazard": false
          },
          {
            "id": "sym_gyp_heavy_light_pulling",
            "symptom_en": "Heavy Light Fixture Tearing Through Gypsum Core",
            "symptom_ar": "ثقل النجفة يمزق لوح الجبس بورد بدون تثبيت في السقف الخرساني",
            "default_severity": "CRITICAL",
            "is_hazard": true,
            "hazard_instruction_en": "Falling object hazard! Keep area clear.",
            "hazard_instruction_ar": "خطر سقوط! أخلِ المنطقة أسفل النجفة فوراً."
          }
        ]
      },
      {
        "id": "sub_gyp_water",
        "trade_id": "trade_gypsum",
        "slug": "GYPSUM_WATER",
        "name_en": "Water Damage & Leaks",
        "name_ar": "تأثر السقف بالمياه والرطوبة",
        "is_elv": false,
        "symptoms": [
          {
            "id": "sym_gyp_water_soaked",
            "symptom_en": "Waterlogged / Discolored Gypsum Board Flaking",
            "symptom_ar": "لوح جبس بورد مشبع بمياه تسريب علوي ومتفتت",
            "default_severity": "CRITICAL",
            "is_hazard": true,
            "hazard_instruction_en": "Fall risk! Saturated gypsum loses integrity quickly. Do not stand under wet spots.",
            "hazard_instruction_ar": "خطر سقوط السقف المبتل! الجبس المشبع بالماء يفقد تماسكه ويسقط فجأة."
          },
          {
            "id": "sym_gyp_yellow_water_stain",
            "symptom_en": "Yellow Brown Water Ring Stains on Painted Ceiling",
            "symptom_ar": "بقع صفراء ودوائر مياه جافة واضحة في سقف الصالة",
            "default_severity": "LOW",
            "is_hazard": false
          },
          {
            "id": "sym_gyp_mold_spores",
            "symptom_en": "Fungal Growth Along Hidden Gypsum Cavity",
            "symptom_ar": "نمو عفونة وفطريات خضراء داخل بيت النور بالسقف المعلق",
            "default_severity": "MEDIUM",
            "is_hazard": false
          }
        ]
      }
    ]
  },
  {
    "id": "trade_painting",
    "slug": "PAINTING",
    "name_en": "Painting & Surface Finishes",
    "name_ar": "نقاشة ودهانات",
    "icon": "paint-bucket",
    "order_index": 7,
    "subcategories": [
      {
        "id": "sub_paint_cracks",
        "trade_id": "trade_painting",
        "slug": "PAINTING_CRACKS",
        "name_en": "Cracks & Structural Joints",
        "name_ar": "شروخ دهان وحوائط",
        "is_elv": false,
        "symptoms": [
          {
            "id": "sym_paint_settlement_crack",
            "symptom_en": "Diagonal Wall Crack Across Plaster",
            "symptom_ar": "شروخ مائلة وترييح في المحارة ودهان الحوائط",
            "default_severity": "MEDIUM",
            "is_hazard": false
          },
          {
            "id": "sym_paint_column_beam_joint",
            "symptom_en": "Horizontal Crack at Column to Brickwork Interface",
            "symptom_ar": "شرخ أفقي فاصل بين العمود الخرساني ومباني الطوب",
            "default_severity": "MEDIUM",
            "is_hazard": false
          },
          {
            "id": "sym_paint_crazing_spider",
            "symptom_en": "Fine Spiderweb Crazing Across Final Coat",
            "symptom_ar": "شروخ عنكبوتية رفيعة جداً في وش الدهان الأخير",
            "default_severity": "LOW",
            "is_hazard": false
          }
        ]
      },
      {
        "id": "sub_paint_mold",
        "trade_id": "trade_painting",
        "slug": "PAINTING_MOLD",
        "name_en": "Mold & Damp Blemishes",
        "name_ar": "عفونة وبقع وتشطيبات",
        "is_elv": false,
        "symptoms": [
          {
            "id": "sym_paint_black_mold",
            "symptom_en": "Toxic Black Mold Colony Behind Bedroom Wardrobe",
            "symptom_ar": "بقع عفونة سوداء وفطريات رطوبة خلف الدواليب",
            "default_severity": "MEDIUM",
            "is_hazard": false
          },
          {
            "id": "sym_paint_condensation_mildew",
            "symptom_en": "Bathroom Ceiling Surface Mildew Spots",
            "symptom_ar": "نقط سوداء ورطوبة تكثيف في سقف الحمام الداخلي",
            "default_severity": "LOW",
            "is_hazard": false
          },
          {
            "id": "sym_paint_roller_texture_mismatch",
            "symptom_en": "Patchy Touch-Up Marks Differing from Surrounding Wall",
            "symptom_ar": "ترقيعات ولطشات دهان سابقة بلون ولمعة مختلفة عن الحائط",
            "default_severity": "LOW",
            "is_hazard": false
          },
          {
            "id": "sym_paint_grease_stains_kitchen",
            "symptom_en": "Cooking Grease Smoke Penetrating Wall Paint",
            "symptom_ar": "اصفرار ودهون متراكمة فوق دهان حوائط المطبخ",
            "default_severity": "LOW",
            "is_hazard": false
          }
        ]
      },
      {
        "id": "sub_paint_peeling",
        "trade_id": "trade_painting",
        "slug": "PAINTING_PEELING",
        "name_en": "Paint Peeling & Efflorescence",
        "name_ar": "تقشير وتمليح الجدران",
        "is_elv": false,
        "symptoms": [
          {
            "id": "sym_paint_peel",
            "symptom_en": "Paint Flaking / Bubbling Due to Salt Damp",
            "symptom_ar": "تقشير وانتفاخ طبقات الدهان بسبب تمليح الحوائط",
            "default_severity": "LOW",
            "is_hazard": false
          },
          {
            "id": "sym_paint_efflorescence_powder",
            "symptom_en": "White Crystalline Salt Powder Pushing Through Paint",
            "symptom_ar": "بودرة بيضاء وتمليح كلسي يخرج من تحت الدهان أسفل الحائط",
            "default_severity": "LOW",
            "is_hazard": false
          },
          {
            "id": "sym_paint_exterior_chalking",
            "symptom_en": "Exterior Facade Emulsion Chalking Heavily in Sun",
            "symptom_ar": "بودرة وتجيير شديد في دهان واجهة الفيلا الخارجية بفعل الشمس",
            "default_severity": "LOW",
            "is_hazard": false
          }
        ]
      }
    ]
  },
  {
    "id": "trade_pool",
    "slug": "POOL",
    "name_en": "Swimming Pool & Water Amenities",
    "name_ar": "حمام سباحة",
    "icon": "waves",
    "order_index": 8,
    "subcategories": [
      {
        "id": "sub_pool_shell",
        "trade_id": "trade_pool",
        "slug": "POOL_SHELL",
        "name_en": "Pool Shell & Drains",
        "name_ar": "تسريبات وبلاط المسبح",
        "is_elv": false,
        "symptoms": [
          {
            "id": "sym_pool_suction",
            "symptom_en": "Main Suction Drain Cover Missing/Broken",
            "symptom_ar": "غطاء صفاية القاع مفقود أو مكسور",
            "default_severity": "CRITICAL",
            "is_hazard": true,
            "hazard_instruction_en": "Fatal suction entrapment hazard! Turn off pump and do not enter pool.",
            "hazard_instruction_ar": "خطر احتجاز قاتل بالشفط! أوقف المضخة وامنع نزول المسبح نهائياً."
          },
          {
            "id": "sym_pool_tile_sharp",
            "symptom_en": "Broken Sharp Ceramic Edge Inside Pool",
            "symptom_ar": "بلاطة موزاييك مكسورة بحافة حادة قد تسبب جروح",
            "default_severity": "HIGH",
            "is_hazard": false
          },
          {
            "id": "sym_pool_underwater_light_wire",
            "symptom_en": "Underwater Pool Light Niche Flooded / Loose Cable",
            "symptom_ar": "كشاف إضاءة المسبح الغاطس مفكوك ويسبح في المياه",
            "default_severity": "CRITICAL",
            "is_hazard": true,
            "hazard_instruction_en": "Electrocution hazard! Cut pool transformer power immediately.",
            "hazard_instruction_ar": "خطر صعق بالمياه! افصل محول إضاءة المسبح فوراً."
          },
          {
            "id": "sym_pool_skimmer_cracked",
            "symptom_en": "Skimmer Throat Cracked Leaking Pool Water Into Ground",
            "symptom_ar": "شرخ في حلق الاسكيمر يسرب مياه الحمام إلى التربة المحيطة",
            "default_severity": "HIGH",
            "is_hazard": false
          }
        ]
      },
      {
        "id": "sub_pool_filtration",
        "trade_id": "trade_pool",
        "slug": "POOL_FILTRATION",
        "name_en": "Pumps & Filtration",
        "name_ar": "طلمبات وفلاتر المسبح",
        "is_elv": false,
        "symptoms": [
          {
            "id": "sym_pool_pump_burnt",
            "symptom_en": "Pool Filtration Pump Humming Loudly / No Suction",
            "symptom_ar": "طلمبة فلترة المسبح بتزن جامد ومبتسحبش مياه",
            "default_severity": "HIGH",
            "is_hazard": false
          },
          {
            "id": "sym_pool_sand_filter_leak",
            "symptom_en": "Multiport Valve Returning Sand into Pool Basin",
            "symptom_ar": "فلتر الرمل يرجع رمل ناعم داخل الحمام مع المياه النظيفة",
            "default_severity": "MEDIUM",
            "is_hazard": false
          },
          {
            "id": "sym_pool_pipe_air_leak",
            "symptom_en": "Bubbles Blowing from Inlets / Air Leak on Suction Line",
            "symptom_ar": "خروج فقاقيع هواء كثيفة من نوزلات المياه وتسريب هواء بالطلمبة",
            "default_severity": "LOW",
            "is_hazard": false
          }
        ]
      },
      {
        "id": "sub_pool_quality",
        "trade_id": "trade_pool",
        "slug": "POOL_WATER_QUALITY",
        "name_en": "Water Quality & Chemicals",
        "name_ar": "جودة ومعالجة المياه",
        "is_elv": false,
        "symptoms": [
          {
            "id": "sym_pool_green_algae",
            "symptom_en": "Water Turned Green with Algae Overgrowth",
            "symptom_ar": "مياه المسبح خضراء ومعكرة بسبب نمو الطحالب",
            "default_severity": "MEDIUM",
            "is_hazard": false
          },
          {
            "id": "sym_pool_chlorine_burning_eyes",
            "symptom_en": "Chemical Smell / Severe Eye & Skin Stinging",
            "symptom_ar": "رائحة كلور حارقة والتهاب شديد في العين والجلد عند السباحة",
            "default_severity": "HIGH",
            "is_hazard": false
          },
          {
            "id": "sym_pool_cloudy_calcium",
            "symptom_en": "Milky Water Cloudiness / Calcium Hardness Scaling",
            "symptom_ar": "مياه المسبح حليبية بيضاء وترسبات جيرية على الجدران",
            "default_severity": "LOW",
            "is_hazard": false
          }
        ]
      }
    ]
  },
  {
    "id": "trade_civil",
    "slug": "CIVIL_TILING",
    "name_en": "Civil, Masonry & Tiling",
    "name_ar": "سيراميك وبلاط وبناء",
    "icon": "grid",
    "order_index": 9,
    "subcategories": [
      {
        "id": "sub_civil_tiles",
        "trade_id": "trade_civil",
        "slug": "CIVIL_TILES",
        "name_en": "Floor & Wall Ceramic",
        "name_ar": "سيراميك وبلاط أرضيات وحوائط",
        "is_elv": false,
        "symptoms": [
          {
            "id": "sym_civil_hollow_tiles",
            "symptom_en": "Hollow Popping Porcelain Floor Tiles",
            "symptom_ar": "بلاط وسيراميك مطبل وبيطقطق ومفكوك من المونة",
            "default_severity": "MEDIUM",
            "is_hazard": false
          },
          {
            "id": "sym_civil_grout_erosion",
            "symptom_en": "Shower Grout Eroded / Cavities Exposing Screed",
            "symptom_ar": "تآكل عراميس وفواصل السيراميك في الشاور وتسريب تحت البلاط",
            "default_severity": "MEDIUM",
            "is_hazard": false
          },
          {
            "id": "sym_civil_skirting_loose",
            "symptom_en": "Corridor Marble Skirting Tiles Detached",
            "symptom_ar": "وزرات الرخام في الطرقات مخلوعة من الحائط ومعرضة للكسر",
            "default_severity": "LOW",
            "is_hazard": false
          },
          {
            "id": "sym_civil_tile_lippage_trip",
            "symptom_en": "Uneven Tile Lip / Resident Tripping Hazard",
            "symptom_ar": "بروز حافة بلاطة بارتفاع يسبب تعثر السكان عند المشي",
            "default_severity": "LOW",
            "is_hazard": false
          }
        ]
      },
      {
        "id": "sub_civil_masonry",
        "trade_id": "trade_civil",
        "slug": "CIVIL_MASONRY",
        "name_en": "Plastering & Masonry",
        "name_ar": "محارة وبناء ودرج السلالم",
        "is_elv": false,
        "symptoms": [
          {
            "id": "sym_civil_step_cracked",
            "symptom_en": "Marble Stair Tread Cracked / Trip Hazard",
            "symptom_ar": "كسر في رخام درج السلم يسبب خطر التعثر والسقوط",
            "default_severity": "HIGH",
            "is_hazard": false
          },
          {
            "id": "sym_civil_plaster_spalling",
            "symptom_en": "Loose Plaster Chunk Ready to Fall from Ceiling Arch",
            "symptom_ar": "طبقة محارة سميكة مخلوعة من كمرة المدخل ومعرضة للسقوط",
            "default_severity": "CRITICAL",
            "is_hazard": true,
            "hazard_instruction_en": "Falling hazard! Keep area underneath clear of residents.",
            "hazard_instruction_ar": "خطر سقوط قطع محارة! امنع مرور السكان أسفل الكمرة."
          },
          {
            "id": "sym_civil_ramp_cracking",
            "symptom_en": "Wheelchair Ramp Concrete Settled and Split",
            "symptom_ar": "هبوط وشروخ في خرسانة مطلع الكراسي المتحركة بمدخل العمارة",
            "default_severity": "MEDIUM",
            "is_hazard": false
          }
        ]
      },
      {
        "id": "sub_civil_waterproof",
        "trade_id": "trade_civil",
        "slug": "CIVIL_WATERPROOF",
        "name_en": "Waterproofing Membranes",
        "name_ar": "عزل مائي ورطوبة خرسانية",
        "is_elv": false,
        "symptoms": [
          {
            "id": "sym_civil_balcony_leak",
            "symptom_en": "Balcony Membrane Failed / Leaking to Lower Floor",
            "symptom_ar": "فشل عزل التراس وتسريب مياه للجار بالدور الأسفل",
            "default_severity": "HIGH",
            "is_hazard": false
          },
          {
            "id": "sym_civil_bathroom_slab_damp",
            "symptom_en": "Bathroom Floor Bitumen Waterproofing Breached",
            "symptom_ar": "تسريب مياه من عزل أرضية الحمام إلى حديد تسليح السقف",
            "default_severity": "HIGH",
            "is_hazard": false
          },
          {
            "id": "sym_civil_planter_box_drip",
            "symptom_en": "Built-in Facade Planter Box Waterproofing Failed",
            "symptom_ar": "أحواض زرع الواجهة تسرب مياه الري وتتلف الدهان الخارجي",
            "default_severity": "MEDIUM",
            "is_hazard": false
          }
        ]
      }
    ]
  },
  {
    "id": "trade_appliances",
    "slug": "APPLIANCES",
    "name_en": "Major Landlord Appliances",
    "name_ar": "أجهزة منزلية",
    "icon": "tv",
    "order_index": 10,
    "subcategories": [
      {
        "id": "sub_app_cooking",
        "trade_id": "trade_appliances",
        "slug": "APPLIANCES_COOKING",
        "name_en": "Cookers, Ovens & Hobs",
        "name_ar": "بوتاجازات وأفران بلت إن",
        "is_elv": false,
        "symptoms": [
          {
            "id": "sym_app_cooker_spark_fail",
            "symptom_en": "Gas Hob Electric Ignition Clicking Non-Stop",
            "symptom_ar": "إشعال ذاتي للبوتاجاز شغال تك تك بدون توقف",
            "default_severity": "MEDIUM",
            "is_hazard": false
          },
          {
            "id": "sym_app_oven_glass_shattered",
            "symptom_en": "Built-in Oven Inner Heat-Resistant Glass Panel Cracked",
            "symptom_ar": "شرخ في الزجاج الحراري الداخلي لباب الفرن البلت إن",
            "default_severity": "HIGH",
            "is_hazard": false
          },
          {
            "id": "sym_app_hob_yellow_flame_soot",
            "symptom_en": "Burner Producing Yellow Sooty Flame / Carbon Monoxide",
            "symptom_ar": "شعلة البوتاجاز صفراء وتنتج هباب أسود ورائحة احتراق غير تام",
            "default_severity": "HIGH",
            "is_hazard": false
          }
        ]
      },
      {
        "id": "sub_app_refrig",
        "trade_id": "trade_appliances",
        "slug": "APPLIANCES_REFRIGERATION",
        "name_en": "Refrigerators & Freezers",
        "name_ar": "ثلاجات وديب فريزر",
        "is_elv": false,
        "symptoms": [
          {
            "id": "sym_app_fridge_warm",
            "symptom_en": "Built-in Refrigerator Not Cooling / Food Spoiling",
            "symptom_ar": "الثلاجة البلت إن لا تبرد والأطعمة تلفت",
            "default_severity": "HIGH",
            "is_hazard": false
          },
          {
            "id": "sym_app_fridge_frost_drain",
            "symptom_en": "No-Frost Drain Clogged / Water Pooling Under Crisper",
            "symptom_ar": "انسداد مجرى تصريف الديفروست وتجمع مياه أسفل درج الخضار",
            "default_severity": "LOW",
            "is_hazard": false
          },
          {
            "id": "sym_app_fridge_gasket_seal",
            "symptom_en": "Magnetic Door Gasket Split / Warm Air Ingress",
            "symptom_ar": "كاوتشة باب الفريزر مشققة والباب لا يغلق بإحكام",
            "default_severity": "LOW",
            "is_hazard": false
          }
        ]
      },
      {
        "id": "sub_app_washers",
        "trade_id": "trade_appliances",
        "slug": "APPLIANCES_WASHERS",
        "name_en": "Washing Machines & Dishwashers",
        "name_ar": "غسالات أوتوماتيك وأطباق",
        "is_elv": false,
        "symptoms": [
          {
            "id": "sym_app_washer_error",
            "symptom_en": "Washing Machine Trapped with Water / Drain Error",
            "symptom_ar": "الغسالة معلقة والباب مقفول والمياه مش بتصرف",
            "default_severity": "MEDIUM",
            "is_hazard": false
          },
          {
            "id": "sym_app_washer_violent_spin",
            "symptom_en": "Washing Machine Drum Banging Violently in Spin Cycle",
            "symptom_ar": "حلة الغسالة ترتج وترزع بقوة شديدة عند العصر وتتحرك من مكانها",
            "default_severity": "HIGH",
            "is_hazard": false
          },
          {
            "id": "sym_app_dishwasher_tablet_door",
            "symptom_en": "Dishwasher Detergent Dispenser Door Stays Closed",
            "symptom_ar": "دلفة مسحوق غسالة الأطباق مابتفتحش أثناء دورة الغسيل",
            "default_severity": "LOW",
            "is_hazard": false
          }
        ]
      }
    ]
  },
  {
    "id": "trade_grounds",
    "slug": "GROUNDS_EXTERIOR",
    "name_en": "Grounds, Exterior & Roofing",
    "name_ar": "واجهات وأسطح وحدائق",
    "icon": "home",
    "order_index": 11,
    "subcategories": [
      {
        "id": "sub_grd_facades",
        "trade_id": "trade_grounds",
        "slug": "GROUNDS_FACADES",
        "name_en": "Facades & Railings",
        "name_ar": "واجهات وبروزات وسور السطح",
        "is_elv": false,
        "symptoms": [
          {
            "id": "sym_grd_parapet_crack",
            "symptom_en": "Loose Facade Stone Cladding / Danger to Pedestrians",
            "symptom_ar": "حجر تجليد هاشمي مخلوع من الواجهة ومعرض للسقوط",
            "default_severity": "CRITICAL",
            "is_hazard": true,
            "hazard_instruction_en": "Falling hazard! Cordon off area below building facade immediately.",
            "hazard_instruction_ar": "خطر سقوط حجارة! امنع مرور المشاة أسفل واجهة المبنى فوراً."
          },
          {
            "id": "sym_grd_railing_corrosion",
            "symptom_en": "Roof Parapet Iron Railing Base Severely Corroded",
            "symptom_ar": "صدأ وتآكل قاعدة درابزين سور السطح الحديدي وضعف تثبيته",
            "default_severity": "HIGH",
            "is_hazard": false
          },
          {
            "id": "sym_grd_downspout_detached",
            "symptom_en": "Rain Water PVC Downspout Pipe Bracket Detached",
            "symptom_ar": "ماسورة مزاريب مياه المطر الخارجية مفكوكة من الواجهة",
            "default_severity": "LOW",
            "is_hazard": false
          }
        ]
      },
      {
        "id": "sub_grd_landscape",
        "trade_id": "trade_grounds",
        "slug": "GROUNDS_LANDSCAPE",
        "name_en": "Landscape Irrigation & Lights",
        "name_ar": "شبكات ري وإنارة الحدائق",
        "is_elv": false,
        "symptoms": [
          {
            "id": "sym_grd_irrigation_leak",
            "symptom_en": "Underground Garden Irrigation Line Burst",
            "symptom_ar": "كسر خط ري الحدائق ومياه غزيرة تغرق الممشى",
            "default_severity": "MEDIUM",
            "is_hazard": false
          },
          {
            "id": "sym_grd_garden_post_light_broken",
            "symptom_en": "Driveway Garden Bollard Light Smashed Exposed Wires",
            "symptom_ar": "عامود إضاءة الحديقة مكسور وأسلاك الكهرباء مكشوفة على العشب",
            "default_severity": "CRITICAL",
            "is_hazard": true,
            "hazard_instruction_en": "Shock risk on wet lawn! Cut garden lighting breaker immediately.",
            "hazard_instruction_ar": "خطر صعق على العشب المبتل! افصل قاطع إنارة الحديقة فوراً."
          },
          {
            "id": "sym_grd_sprinkler_head_sheared",
            "symptom_en": "Lawn Pop-Up Sprinkler Head Sheared by Mower",
            "symptom_ar": "رشاش الري المدفون مكسور ونافورة مياه تهدر بدون توقف",
            "default_severity": "LOW",
            "is_hazard": false
          }
        ]
      },
      {
        "id": "sub_grd_roofing",
        "trade_id": "trade_grounds",
        "slug": "GROUNDS_ROOFING",
        "name_en": "Roof Drainage & Waterproofing",
        "name_ar": "عزل الأسطح ومزاريب المطر",
        "is_elv": false,
        "symptoms": [
          {
            "id": "sym_grd_roof_drain_clog",
            "symptom_en": "Roof Rain Gulley Blocked / Ponding Water",
            "symptom_ar": "انسداد ميزاب مطر السطح وتجمع بركة مياه كبيرة",
            "default_severity": "HIGH",
            "is_hazard": false
          },
          {
            "id": "sym_grd_roof_bitumen_bubble",
            "symptom_en": "Roof Bitumen Membrane Bubbled & Splitting Under Sun",
            "symptom_ar": "انتفاخ وتقطيع في لفائف عزل الرطوبة البيتوميني على السطح",
            "default_severity": "MEDIUM",
            "is_hazard": false
          },
          {
            "id": "sym_grd_expansion_joint_seal",
            "symptom_en": "Building Structural Expansion Joint Rubber Extruded",
            "symptom_ar": "تلف مطاط فاصل الهبوط والتمدد الانشائي على سطح المبنى",
            "default_severity": "HIGH",
            "is_hazard": false
          }
        ]
      }
    ]
  },
  {
    "id": "trade_other",
    "slug": "OTHER",
    "name_en": "Other / Unlisted",
    "name_ar": "تخصص آخر / غير مدرج",
    "icon": "help-circle",
    "order_index": 99,
    "subcategories": [
      {
        "id": "sub_other_general",
        "trade_id": "trade_other",
        "slug": "OTHER_GENERAL",
        "name_en": "General / Other",
        "name_ar": "عام / غير مدرج",
        "is_elv": false,
        "symptoms": [
          {
            "id": "sym_other_general",
            "symptom_en": "Other Custom Fault",
            "symptom_ar": "عطل آخر غير مدرج",
            "default_severity": "MEDIUM",
            "is_hazard": false
          }
        ]
      }
    ]
  }
];
