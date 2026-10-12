export interface ProductType {
    id: number;
    name: string;
    category: 'tortlar' | 'bento' | 'desertlar' | 'kapkeyk';
    price: number; // in UZS (so'm)
    description: string;
    ingredients: string;
    badge?: string;
    url: string;
    customizable: boolean;
    prepTime: string;
    weightOptions?: { label: string; multiplier: number }[];
    fillings?: string[];
}

export const CATEGORIES = [
    { id: 'all', name: 'Barchasi', icon: '✨' },
    { id: 'tortlar', name: 'Katta Tortlar', icon: '🎂' },
    { id: 'bento', name: 'Bento Tortlar', icon: '🍰' },
    { id: 'desertlar', name: 'Desertlar & Chizkeyk', icon: '🍮' },
    { id: 'kapkeyk', name: 'Kapkeyk & Makaronlar', icon: '🧁' },
];

export const FILLINGS_LIST = [
    "Klassik krem-chiz va rezavor mevalar",
    "Belgiya shokoladi va ganash",
    "Snickers (karamel, yeryong'oq, nuga)",
    "Raffaello (kokos, bodom, oq shokolad)",
    "Malina va pista (nordon-shirin lazzat)",
    "Qulupnayli qaymoqli konfi"
];

export const WEIGHT_OPTIONS_DEFAULT = [
    { label: "1 kg (4-6 kishi)", multiplier: 1 },
    { label: "1.5 kg (8-10 kishi)", multiplier: 1.5 },
    { label: "2 kg (12-14 kishi)", multiplier: 2 },
    { label: "3 kg (18-20 kishi)", multiplier: 3 }
];

const Data: ProductType[] = [
    {
        id: 1,
        name: "Qizil Baxmal (Red Velvet)",
        category: "tortlar",
        price: 180000,
        description: "Yumshoq qizil biskvit, nozik krem-chiz va yangi rezavor mevalar bezagi. Romantik bayramlar uchun eng mashhur tanlov.",
        ingredients: "Tabiiy sariyog', qaymoqli krem-chiz, kakao, vanil ekstrakti, malina",
        badge: "Xit savdo 🔥",
        url: "https://images.unsplash.com/photo-1586788680434-30d324b2d46f?q=80&w=1200&auto=format&fit=crop",
        customizable: true,
        prepTime: "Bugun yoki ertaga yetkaziladi",
        weightOptions: WEIGHT_OPTIONS_DEFAULT,
        fillings: FILLINGS_LIST
    },
    {
        id: 2,
        name: "Snickers Premium Shokoladli Tort",
        category: "tortlar",
        price: 220000,
        description: "Boy shokoladli biskvit, cho'ziluvchan yumshoq karamel, qovurilgan yeryong'oq va natsional ganash kremi.",
        ingredients: "Belgiya shokoladi, yeryong'oq, tabiiy qaymoq, karamel",
        badge: "Top tanlov ⭐",
        url: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=1200&auto=format&fit=crop",
        customizable: true,
        prepTime: "Bugun yoki ertaga yetkaziladi",
        weightOptions: WEIGHT_OPTIONS_DEFAULT,
        fillings: FILLINGS_LIST
    },
    {
        id: 3,
        name: "Pista va Malinali Nafis Tort",
        category: "tortlar",
        price: 250000,
        description: "Eron pistasi pastasidan tayyorlangan xushbo'y biskvit, nordon malinali konfi va yengil vanil kremi.",
        ingredients: "Pista pastasi, tabiiy malina, maskarpone pishlog'i, sariyog'",
        badge: "Premial 👑",
        url: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?q=80&w=1200&auto=format&fit=crop",
        customizable: true,
        prepTime: "1 kun oldin buyurtma",
        weightOptions: WEIGHT_OPTIONS_DEFAULT,
        fillings: FILLINGS_LIST
    },
    {
        id: 4,
        name: "Bento 'Tug'ilgan kuningiz bilan!'",
        category: "bento",
        price: 95000,
        description: "1-2 kishilik qulay mini-tort. Istalgan tabrik yozuvi, shamchasi va qoshiqchasi bilan birga sovg'abop qutida beriladi.",
        ingredients: "Vanilli biskvit, rezavor kuli, krem-chiz",
        badge: "Tezkor (2-3 soat) ⚡",
        url: "https://images.unsplash.com/photo-1621303837174-89787a7d4729?q=80&w=1200&auto=format&fit=crop",
        customizable: true,
        prepTime: "Bugun tayyor bo'ladi (2 soat)",
        weightOptions: [
            { label: "Bento standart (400-450g)", multiplier: 1 },
            { label: "Bento MAXI (650-700g)", multiplier: 1.4 }
        ],
        fillings: FILLINGS_LIST.slice(0, 4)
    },
    {
        id: 5,
        name: "Bento 'Yurakcha' (Sevgi Izhori)",
        category: "bento",
        price: 110000,
        description: "Yurak shaklidagi romantik mini-tort. Shaxsiy iliq so'zlaringiz va chiroyli lentalar bilan bezatiladi.",
        ingredients: "Qizil baxmal biskvit, qulupnayli nachinka, qaymoqli krem",
        badge: "Romantik 💖",
        url: "https://images.unsplash.com/photo-1587314168485-3236d6710814?q=80&w=1200&auto=format&fit=crop",
        customizable: true,
        prepTime: "Bugun tayyor bo'ladi (2 soat)",
        weightOptions: [
            { label: "Bento yurak (450g)", multiplier: 1 },
            { label: "Bento yurak MAXI (700g)", multiplier: 1.4 }
        ],
        fillings: FILLINGS_LIST.slice(0, 4)
    },
    {
        id: 6,
        name: "San-Sebastyan Kuygan Chizkeyk",
        category: "desertlar",
        price: 190000,
        description: "Ispaniyaning afsonaviy pishirilgan chizkeyki. Ichki qismi nozik kremsimon, ustidan Belgiya sutli shokoladi quyiladi.",
        ingredients: "Philadelphia pishlog'i, tuxum, tabiiy qaymoq, vanil",
        badge: "Ishtahaochar 🍫",
        url: "https://images.unsplash.com/photo-1524351199678-941a58a3df50?q=80&w=1200&auto=format&fit=crop",
        customizable: false,
        prepTime: "Bugun mavjud",
        weightOptions: [
            { label: "Butun chizkeyk (1.2 kg)", multiplier: 1 }
        ]
    },
    {
        id: 7,
        name: "Fransuzcha Makaronlar To'plami (12 dona)",
        category: "kapkeyk",
        price: 140000,
        description: "100% bodom unidan tayyorlangan 6 xil ta'm: pista, malina, lavanda, mango-marakuya, shokolad va karamel.",
        ingredients: "Bodom uni, tuxum oqi, shakar upasi, tabiiy pyurelar",
        badge: "Sovg'abop 🎁",
        url: "https://images.unsplash.com/photo-1570476922354-81227cdbb76c?q=80&w=1200&auto=format&fit=crop",
        customizable: false,
        prepTime: "Bugun mavjud"
    },
    {
        id: 8,
        name: "Bayramona Kapkeyklar To'plami (6 dona)",
        category: "kapkeyk",
        price: 120000,
        description: "Shokoladli va vanilli asos, baland krem-chiz shlyapkasi, rezavor mevalar va shokolad bo'laklari bilan bezak.",
        ingredients: "Oliy nav un, kakao, tabiiy qaymoq, rezavorlar",
        badge: "Bayrambop 🎉",
        url: "https://images.unsplash.com/photo-1587668178277-295251f900ce?q=80&w=1200&auto=format&fit=crop",
        customizable: true,
        prepTime: "Bugun yoki ertaga",
        fillings: ["Shokoladli nachinka", "Karamelli nachinka", "Qulupnayli djem"]
    },
    {
        id: 9,
        name: "Klassik Italiyancha Tiramisu",
        category: "desertlar",
        price: 130000,
        description: "Savoyardi pechenyelari, yangi damlangan espresso qahvasi va haqiqiy Maskarpone kremi bilan tayyorlangan shohona desert.",
        ingredients: "Maskarpone, savoyardi pechenyesi, espresso, kakao kukuni",
        badge: "Klassika ☕",
        url: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?q=80&w=1200&auto=format&fit=crop",
        customizable: false,
        prepTime: "Bugun mavjud"
    },
    {
        id: 10,
        name: "Shohona To'y va Yubiley Torti (Ko'p qavatli)",
        category: "tortlar",
        price: 850000,
        description: "3 qavatli tantana torti. Tirik gullar, oziq-ovqat oltin zarralari (potallari) va nozik dekoratsiya bilan bezatiladi.",
        ingredients: "Premium biskvit, bir necha xil nachinkalar, barqaror krem",
        badge: "Eksklyuziv 👑",
        url: "https://images.unsplash.com/photo-1535254973040-607b474cb50d?q=80&w=1200&auto=format&fit=crop",
        customizable: true,
        prepTime: "2-3 kun oldin buyurtma",
        weightOptions: [
            { label: "3 qavat (5 kg)", multiplier: 1 },
            { label: "3 qavat (7 kg)", multiplier: 1.4 },
            { label: "4 qavat (10 kg)", multiplier: 2.0 }
        ],
        fillings: FILLINGS_LIST
    }
];

export default Data;