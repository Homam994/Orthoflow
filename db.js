const DB = (() => {
  let BIN_ID  = localStorage.getItem('db_bin_id')  || '';
  let API_KEY = localStorage.getItem('db_api_key') || '';
  const BASE  = 'https://api.jsonbin.io/v3';
  let _cache  = null;
  let _lastFetch = 0;
  const TTL   = 30000;

  const DEFAULTS = {
    clinicInfo: {
      name:'مركز لؤلؤة الابتسامة', slogan:'لطب الأسنان المتخصص',
      whatsapp:'966500000000', phone:'920-000-000',
      address:'شارع الأمير محمد بن عبدالعزيز، حي العليا، الرياض',
      email:'info@pearl-dental.com',
      mapEmbed:'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d462560.3069641489!2d46.5390756!3d24.7136!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3e2f03890d489399%3A0xba974d1c98e79fd5!2sRiyadh!5e0!3m2!1sen!2s!4v1',
      about1:'يضم مركزنا نخبة من أمهر أطباء الأسنان المتخصصين في مختلف فروع طب الأسنان، مزوّدين بأحدث الأجهزة والتقنيات.',
      about2:'نؤمن بأن ابتسامتك هي انعكاس لصحتك وثقتك بنفسك، لذلك نحرص على تقديم تجربة علاجية راقية في بيئة مريحة وآمنة.',
      footerDesc:'مركز متكامل لطب الأسنان يجمع بين الخبرة العلمية والتقنيات الحديثة.',
      logoUrl:'',
    },
    hero: {
      badge:'مركز متخصص في طب الأسنان',
      title1:'ابتسامة', titleGold:'أكثر إشراقاً', title2:'في يد خبراء',
      desc:'نقدّم لك رعاية أسنان عالية المستوى في بيئة راقية تجمع بين الخبرة الطبية الاحترافية وأحدث التقنيات.',
      btnPrimary:'احجز موعدك الآن', btnSecondary:'تعرّف علينا',
      stat1Num:'+5000', stat1Label:'مريض راضٍ',
      stat2Num:'+15',   stat2Label:'سنة خبرة',
      stat4Num:'4.9',   stat4Label:'تقييم المراجعين',
      heroImg:'',
      card1Title:'معتمد دولياً', card1Sub:'JCI Accredited',
      card2Title:'معقّم بالكامل', card2Sub:'معايير عالمية',
    },
    about: {
      img:'', tag:'منذ 2009',
      lead:'رواد في تقديم الرعاية الأسنانية الشاملة منذ أكثر من خمسة عشر عاماً.',
      feat1:'أجهزة تشخيص حديثة', feat2:'أطباء معتمدون دولياً',
      feat3:'بروتوكولات تعقيم متقدمة', feat4:'مواعيد مرنة ودقيقة',
    },
    social: { instagram:'', twitter:'', snapchat:'', tiktok:'', facebook:'', youtube:'' },
    doctors: [
      {id:1,name:'د. أحمد المنصوري',specialty:'تقويم وجراحة الفم',   img:'',workDays:[0,1,2,3,4],  startTime:'9:00', endTime:'17:00',slotDuration:30},
      {id:2,name:'د. سارة الزهراني',specialty:'زراعة الأسنان',        img:'',workDays:[0,1,2,4,6],  startTime:'10:00',endTime:'18:00',slotDuration:45},
      {id:3,name:'د. خالد العتيبي', specialty:'طب الأسنان التجميلي',  img:'',workDays:[1,2,3,4,5],  startTime:'8:00', endTime:'16:00',slotDuration:30},
      {id:4,name:'د. نورة الشمري',  specialty:'طب أسنان الأطفال',     img:'',workDays:[0,1,2,3,4,5],startTime:'9:00', endTime:'17:00',slotDuration:30},
    ],
    specialties: [
      {icon:'fa fa-teeth',      title:'تقويم الأسنان',    desc:'علاج اعوجاج الأسنان بأحدث تقنيات التقويم الشفاف والمعدني.'},
      {icon:'fa fa-tooth',      title:'زراعة الأسنان',     desc:'حلول دائمة لفقدان الأسنان باستخدام أفضل أنواع الغرسات.'},
      {icon:'fa fa-star',       title:'الأسنان التجميلية',desc:'تحسين مظهر ابتسامتك عبر الفينيرز والقشور الخزفية.'},
      {icon:'fa fa-syringe',    title:'علاج جذور الأسنان',desc:'حل فعال لإنقاذ الأسنان المتضررة من العدوى والتلف.'},
      {icon:'fa fa-face-smile', title:'تبييض الأسنان',    desc:'جلسات احترافية بأنظمة مرخصة وآمنة تمنحك بريقاً ساطعاً.'},
      {icon:'fa fa-child',      title:'طب أسنان الأطفال', desc:'رعاية متخصصة ولطيفة في بيئة ودية تقلل من القلق.'},
    ],
    reviews: [
      {name:'أم عبدالله',       initial:'أ',rating:5,text:'تجربة رائعة جداً! الطاقم محترف ومتفهم.',          date:'منذ أسبوع',   doctor:'د. أحمد المنصوري'},
      {name:'محمد الغامدي',     initial:'م',rating:5,text:'أفضل مركز زرته. الدكتورة سارة خبيرة.',           date:'منذ شهر',     doctor:'د. سارة الزهراني'},
      {name:'نوف الحربي',       initial:'ن',rating:5,text:'جئت للتجميل وخرجت بابتسامة أحلم بها!',           date:'منذ 3 أسابيع',doctor:'د. خالد العتيبي'},
      {name:'عبدالرحمن الدوسري',initial:'ع',rating:4,text:'المركز ممتاز والمواعيد دقيقة.',                  date:'منذ شهرين',   doctor:'د. خالد العتيبي'},
      {name:'هيفاء القحطاني',   initial:'ه',rating:5,text:'ابنتي كانت تخاف حتى جاءت هنا!',                 date:'منذ أسبوعين', doctor:'د. نورة الشمري'},
      {name:'فهد الشهراني',     initial:'ف',rating:5,text:'زرعة الأسنان اكتملت بنجاح. فريق محترف.',        date:'منذ شهر',     doctor:'د. سارة الزهراني'},
    ],
    hoursOverride: null,
  };

  // ===== إصلاح رئيسي: دمج عميق للكائنات المتداخلة =====
  // المشكلة القديمة: {...DEFAULTS, ...record} يستبدل hero/about/social بالكامل
  // الحل: دمج كل كائن متداخل على حدة
  function deepMerge(defaults, saved) {
    const result = JSON.parse(JSON.stringify(defaults));
    if (!saved || typeof saved !== 'object') return result;
    Object.keys(saved).forEach(k => {
      const isNestedObj =
        saved[k] !== null &&
        typeof saved[k] === 'object' &&
        !Array.isArray(saved[k]) &&
        result[k] !== undefined &&
        typeof result[k] === 'object';
      if (isNestedObj) {
        result[k] = { ...result[k], ...saved[k] };
      } else {
        result[k] = saved[k];
      }
    });
    return result;
  }

  function hdrs() {
    return {
      'Content-Type':     'application/json',
      'X-Master-Key':     API_KEY,
      'X-Bin-Versioning': 'false',
    };
  }

  function ok() { return !!(BIN_ID && API_KEY); }

  async function read() {
    if (!ok()) return JSON.parse(JSON.stringify(DEFAULTS));
    const now = Date.now();
    if (_cache && (now - _lastFetch) < TTL) return _cache;
    try {
      const r = await fetch(`${BASE}/b/${BIN_ID}/latest`, { headers: hdrs() });
      if (!r.ok) throw new Error('fetch ' + r.status);
      const j = await r.json();
      _cache = deepMerge(DEFAULTS, j.record);
      _lastFetch = now;
      return _cache;
    } catch(e) {
      console.warn('DB read error:', e.message);
      return _cache || JSON.parse(JSON.stringify(DEFAULTS));
    }
  }

  async function write(data) {
    if (!ok()) throw new Error('DB not configured');
    const r = await fetch(`${BASE}/b/${BIN_ID}`, {
      method:  'PUT',
      headers: hdrs(),
      body:    JSON.stringify(data),
    });
    if (!r.ok) throw new Error('write failed: ' + r.status);
    // تحديث الكاش مباشرة بعد الكتابة الناجحة
    _cache = JSON.parse(JSON.stringify(data));
    _lastFetch = Date.now();
    return true;
  }

  function configure(b, k) {
    BIN_ID = b; API_KEY = k;
    localStorage.setItem('db_bin_id', b);
    localStorage.setItem('db_api_key', k);
    _cache = null; _lastFetch = 0;
  }

  function getConfig() { return { binId: BIN_ID, apiKey: API_KEY }; }
  function isReady()   { return ok(); }

  return { read, write, configure, getConfig, isReady, DEFAULTS };
})();
