export const INITIAL_USER = {
  id: "currentUser",
  name: "חן כהן",
  city: "תל אביב",
  neighborhood: "פלורנטין",
  image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
  allergies: ["בוטנים"],
  dietaryRestrictions: ["כשר"],
  bio: "חובב בישול ביתי מושבע, אוהב לנסות טעמים חדשים ולארח חברים לסופי שבוע קולינריים.",
  signatureDish: "חריימה בורי חריף עם חלה ביתית",
  hostingStyle: "חם, שמח, ורועש עם המון מוזיקה ישראלית ברקע"
};

export const MOCK_USERS = [
  {
    id: "user1",
    name: "יובל לוי",
    city: "תל אביב",
    neighborhood: "כרם התימנים",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
    allergies: [],
    dietaryRestrictions: ["צמחוני"],
    bio: "מתמחה במטבח ים-תיכוני טבעוני וצמחוני. מאמין שחומרי גלם טריים עושים את כל ההבדל.",
    signatureDish: "טורטליני דלעת ערמונים בחמאת מרווה",
    hostingStyle: "רגוע, אינטימי, עם תאורת נרות ויין טוב"
  },
  {
    id: "user2",
    name: "מיכל אברהם",
    city: "תל אביב",
    neighborhood: "נווה צדק",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200",
    allergies: ["גלוטן"],
    dietaryRestrictions: ["ללא גלוטן"],
    bio: "שוקולטיירית חובבת ואופה ללא גלוטן. אוהבת לשלב מתוק ומלוח בכל מנה.",
    signatureDish: "פילה סלמון בגלזורה של מייפל, סויה וג'ינג'ר",
    hostingStyle: "אלגנטי, מעוצב בקפידה, עם דגש על אסתטיקה וקינוחים מטורפים"
  },
  {
    id: "user3",
    name: "דניאל מזרחי",
    city: "תל אביב",
    neighborhood: "צפון ישן",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200",
    allergies: ["לקטוז"],
    dietaryRestrictions: ["רגיש ללקטוז"],
    bio: "בשרים זה החיים שלי. מעשן בשרים מקצועי במרפסת, תמיד שמח לחלוק נתח טוב עם אנשים מעניינים.",
    signatureDish: "בריסקט מעושן 12 שעות עם רוטב ברביקיו ביתי",
    hostingStyle: "חברתי, מלא בבירה קרה, צחוקים וריח של עישון באוויר"
  }
];

export const MOCK_CYCLES = [
  {
    id: "cycle1",
    name: "סבב תל אביב מרכז - שבוע אוגוסט",
    location: "תל אביב",
    status: "active",
    participants: ["currentUser", "user1", "user2", "user3"],
    dinners: [
      {
        id: "dinner1",
        hostId: "user1",
        date: "יום ראשון, 10 באוגוסט",
        status: "completed",
        menu: {
          appetizer: "קרפצ'יו סלק עם גבינת עיזים מקורמלת, אגוזי מלך ובלסמי מצומצם",
          main: "טורטליני דלעת ערמונים בחמאת מרווה וערמונים קלויים",
          dessert: "טארט לימון מפורק עם מרנג איטלקי שרוף"
        },
        ratings: {
          currentUser: { food: 8, hospitality: 9, atmosphere: 8 },
          user2: { food: 9, hospitality: 10, atmosphere: 9 },
          user3: { food: 7, hospitality: 8, atmosphere: 9 }
        }
      },
      {
        id: "dinner2",
        hostId: "user2",
        date: "יום שלישי, 12 באוגוסט",
        status: "completed",
        menu: {
          appetizer: "סלט אנדייב עם אגסים ביין אדום, גבינת כחולה ופקאן מסוכר",
          main: "פילה סלמון בגלזורה של מייפל וסויה, על מצע פירה בטטה קרמי ללא לקטוז",
          dessert: "סופלה שוקולד ולרונה עשיר ללא גלוטן עם גלידת וניל מדגסקר"
        },
        ratings: {
          currentUser: { food: 9, hospitality: 9, atmosphere: 10 },
          user1: { food: 9, hospitality: 8, atmosphere: 9 },
          user3: { food: 8, hospitality: 9, atmosphere: 8 }
        }
      },
      {
        id: "dinner3",
        hostId: "currentUser",
        date: "יום חמישי, 14 באוגוסט",
        status: "upcoming",
        menu: {
          appetizer: "סביצ'ה דג ים טרי על קרם אבוקדו, כוסברה, צ'ילי אדום וטורטייה קריספית",
          main: "חריימה בורי חריף אסלי בקדירת חרס לצד חלה מתוקה קלועה חמה",
          dessert: "מלבי קוקוס עשיר עם מי ורדים, פיסטוקים קלויים וקוקוס קלוי (פרווה)"
        },
        ratings: {}
      },
      {
        id: "dinner4",
        hostId: "user3",
        date: "יום שבת, 16 באוגוסט",
        status: "upcoming",
        menu: {
          appetizer: "אסאדו מפורק על לחמניית בריוש מאודה עם איולי כמהין ביתי",
          main: "סלייסים של אנטריקוט מיושן 28 יום עם תפוחי אדמה מדורה וצ'ימיצ'ורי",
          dessert: "מוס שוקולד מריר ואספרסו עם שברי אגוזי לוז מקורמלים"
        },
        ratings: {}
      }
    ]
  }
];

export const MOCK_CHAT = [
  { id: "m1", userId: "user1", text: "היי לכולם! מתרגש מאוד לארח אתכם מחר לארוחה הראשונה!", timestamp: "18:00" },
  { id: "m2", userId: "user2", text: "איזה כיף! יש מצב לקבל כיוון לגבי המרכיבים? רגישות לגלוטן פשוט :)", timestamp: "18:05" },
  { id: "m3", userId: "user1", text: "אל תדאגי מיכל, המנה הראשונה והקינוח מותאמים לחלוטין ללא גלוטן, ולמנה העיקרית יש לי פסטה מיוחדת ללא גלוטן עבורך!", timestamp: "18:08" },
  { id: "m4", userId: "user2", text: "וואו מדהים! תודה רבה יובל!", timestamp: "18:10" },
  { id: "m5", userId: "user3", text: "אני בא רעב. יובל, יש בירה מקרר?", timestamp: "19:30" },
  { id: "m6", userId: "user1", text: "ברור דניאל, קרות מהחבית!", timestamp: "19:32" }
];
