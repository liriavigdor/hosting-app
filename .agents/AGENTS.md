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
