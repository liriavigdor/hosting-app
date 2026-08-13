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

export const MOCK_MEALS = [
  {
    id: "meal1",
    name: "ערב שבת איטלקי קלאסי",
    area: "נווה צדק",
    date: "יום שישי, 21 באוגוסט ב-20:00",
    description: "מוזמנים לארוחה איטלקית עשירה ומפנקת עם פסטות עבודת יד, פוקצ'ה חמה ויין איכותי.",
    hostId: "user1",
    preferences: ["צמחוני", "כשר"],
    maxGuests: 4,
    participants: ["user1", "user2"],
    createdAt: Date.now() - 86400000
  },
  {
    id: "meal2",
    name: "פסטיבל בשרים מעושנים",
    area: "צפון ישן",
    date: "יום חמישי, 20 באוגוסט ב-19:30",
    description: "נתחי בשר מובחרים שעברו עישון איטי של 12 שעות במעשנת שלי במרפסת. בירה חופשית!",
    hostId: "user3",
    preferences: ["כשר"],
    maxGuests: 6,
    participants: ["user3"],
    createdAt: Date.now() - 43200000
  },
  {
    id: "meal3",
    name: "סעודה טבעונית בריאה מהטבע",
    area: "כרם התימנים",
    date: "יום שבת, 22 באוגוסט ב-13:00",
    description: "מגוון מנות המבוססות על חומרי גלם טריים מהשוק, קטניות, ירקות צלויים וקינוח טבעוני מפתיע.",
    hostId: "user2",
    preferences: ["טבעוני", "ללא גלוטן", "צמחוני"],
    maxGuests: 4,
    participants: ["user2", "user1"],
    createdAt: Date.now()
  }
];

export const MOCK_CHAT = [
  { id: "m1", userId: "user1", text: "היי לכולם! מתרגש מאוד לארח אתכם!", timestamp: "18:00" },
  { id: "m2", userId: "user2", text: "איזה כיף! תודה רבה על האירוח!", timestamp: "18:05" }
];
