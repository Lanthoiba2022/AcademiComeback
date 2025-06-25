# AcademiComeback

**Empowering Students, Together.**  
AcademiComeback is on a mission to revolutionize collaborative learning. We blend technology, community, and creativity to help you achieve your academic dreams. Our platform is built by students, for students—with passion, innovation, and a spark of magic.

---

## 🚀 Tech Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, Framer Motion, Lucide React (icons), 21st.dev (UI components)
- **Backend/Realtime:** Supabase (Database, Auth, Storage, Edge Functions for real-time chat)
- **Payments & Premium:** RevenueCat
- **Data Visualization:** Recharts, react-calendar-heatmap
- **Utilities:** date-fns, libphonenumber-js, react-phone-input-2
- **Tooling:** ESLint, TypeScript, PostCSS, Autoprefixer, Terser, Vite
- **Deployment:** Netlify

---

## ✨ Features

- **Real-time Collaboration:** Study with friends and classmates in synchronized sessions with live and instant updates.
- **Integrated Chat:** Communicate seamlessly while studying with built-in text chat features.
- **Smart Note Taking:** Create, share, and collaborate on notes with rich formatting, LaTeX support, and version control.
- **Virtual Study Rooms:** Join or create study rooms with video conferencing, screen sharing, and collaborative whiteboards.
- **AI Study Assistant:** Get personalized study recommendations, quiz generation, and instant answers to your questions.
- **Performance Analytics:** Track your study progress, identify knowledge gaps, and optimize your learning efficiency.
- **Secure & Private:** Your data is encrypted and secure with enterprise-grade security and privacy controls.
- **Cross-platform Access:** Access your study materials from anywhere on any device with seamless synchronization.

---

## 🛠️ Local Setup Guide

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd AcademiComeback
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Setup environment variables:**
   - Copy `.env.example` to `.env` and fill in your Supabase credentials and other required values.

4. **Database & Storage:**
   - Run the Supabase migrations in `supabase/migrations/` to set up the database schema.
   - Create a storage bucket named `chat-attachments` in Supabase.
   - Configure Row Level Security (RLS) policies as described in the migration files.
   - Deploy any required Supabase Edge Functions for real-time features (see Supabase docs).

5. **Start the development server:**
   ```bash
   npm run dev
   ```

6. **Troubleshooting:**
   - Ensure `.env` is configured.
   - Verify database migration ran successfully.
   - Ensure Supabase Edge Functions are deployed and accessible.
   - Check browser console for connection errors.

---

## 📚 Documentation of Technologies Used

- **Supabase:**  
  Used for authentication, database, storage, and real-time features.  
  [Supabase Docs](https://supabase.com/docs)

- **Supabase Edge Functions:**  
  Used for real-time chat and collaboration, leveraging serverless functions for low-latency updates.  
  [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)

- **21st.dev:**  
  Used for modern, production-ready UI components to accelerate frontend development.  
  [21st.dev Docs](https://21st.dev/)

- **RevenueCat:**  
  Handles premium subscriptions and in-app purchases.  
  [RevenueCat Docs](https://www.revenuecat.com/docs)

- **Netlify:**  
  For continuous deployment and hosting.  
  [Netlify Docs](https://www.netlify.com/docs/)

- **Other Libraries:**  
  - **Framer Motion:** Animations and transitions.
  - **Recharts:** Data visualization and analytics.
  - **react-calendar-heatmap:** Study streak and activity visualization.
  - **Lucide React:** Icon library.
  - **date-fns:** Date utilities.
  - **libphonenumber-js, react-phone-input-2:** Phone number input and validation.

---
## AcademiComeback User Guide Flowchart

![Preview](/AcademiComeback/public/AcademiComebackUserGuideFlowchart.png) 

## 🔮 Future Plans & Scope

- **Mobile App:** Native mobile experience for iOS and Android.
- **Gamification:** More achievements, badges, and leaderboards.
- **AI Enhancements:** Smarter study recommendations, advanced quiz generation, and AI-powered note summarization.
- **Third-party Integrations:** Google Calendar, Notion, and more.
- **Expanded Analytics:** Deeper insights into study habits and performance.
- **Marketplace:** Rewards and perks for active users.
- **Community Features:** Public study rooms, events, and peer mentoring.
- **Accessibility:** Enhanced support for screen readers and keyboard navigation.

---

## 🤝 Contributing

We welcome contributions! Please open issues or pull requests for suggestions, bug fixes, or new features.

---

## 📬 Contact

- Email: [hello@academicomeback.online](mailto:hello@academicomeback.online)
- [LinkedIn](https://linkedin.com)
- [Twitter](https://twitter.com)
- [GitHub](https://github.com)

---

## 📝 License

MIT License
