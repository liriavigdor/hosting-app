# Project Generation Protocol

When the user provides an idea for a new application (e.g. "אפליקציית אתגרים"), the assistant should automatically execute Phases 2, 3, and 4:

1. **Phase 2: Project Setup & Tooling**
   - Initialize Vite + React project.
   - Install packages and configure tools (Oxlint, Firebase if needed).
   - Configure Firebase initial files and rules if backend is required.

2. **Phase 3: Design System & UX**
   - Create CSS variables, dark/light theme toggle structure.
   - Design beautiful custom CSS (glassmorphism, gradients, transitions).
   - Add responsive grid/flex layout and icons.

3. **Phase 4: Core Components & Mock Data**
   - Create mock data for immediate testing.
   - Develop core components, pages, tabs, and navigation.
   - Implement initial state management and Firebase hooks.

After completing these phases, present the working base to the user to begin Phase 5 (Fine-tuning).

# Strict Production Menu Protection Rule (איסור מוחלט על שינוי תפריט)
- **לעולם, בשום אופן ומצב, אין להוסיף, לשנות, להמציא או לערוך פריטים בתפריט האפליקציה (בין אם ב-Firestore, ב-DEFAULT_MENU או בנתוני דמה)**.
- האפליקציה משמשת לקוחות ועובדים פעילים בייצור חי יום-יום. כל פריט בתפריט מייצג מלאי אמיתי.
- מותר לבצע שינויים בתפריט **אך ורק** כאשר המשתמש מספק במפורש את שמות הפריטים והוראה מפורשת לעשות זאת, ללא כל יוזמות אישיות או המצאות נוספות.

# Strict Git Push Prohibition (איסור מוחלט על דחיפה ל-Git)
- **חל איסור מוחלט לבצע `git push` באופן אוטומטי או עצמאי.**
- לעולם אין לדחוף שינויים ל-Git (או לפרוס ל-Production) ללא בקשה מפורשת ואישור ספציפי מהמשתמש.

# Strict App Modification Approval (אישור מראש לכל שינוי באפליקציה)
- **אין לבצע שום שינוי בקוד, בקבצים או במבנה האפליקציה ללא אישור והנחיה ישירה מהמשתמש.**


