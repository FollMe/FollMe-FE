# FollMe Frontend

FollMe helps couples get ready for their big day: check compatibility (xem tuổi), pick a wedding date (chọn ngày cưới) and send online invitations that guests answer and sign. A lunar calendar with daily horoscopes brings people back; the author's blog and stories live in a small corner.

## Features

- **Cưới hỏi** (`/cuoi-hoi`): the three-step journey below, with FAQ.
- **Chọn ngày cưới** (`/cuoi-hoi/chon-ngay`): good wedding days for the couple in a range, with reasons, good hours and Kim Lâu warnings; one click to an invitation for that day.
- **Thiệp mời online**: wedding, engagement, birthday and party invitations in four themes; personal links per guest and a public link (`/e/:eventId`) for group chats; RSVP with headcount; wishes wall; host dashboard with answers, QR and wish moderation.
- **Analytics**: Vercel Web Analytics via a script tag; `util/analytics.track()` records funnel events.

- **Post Management**: Create, view, and manage posts.
- **Comment System**: Add, retrieve, and manage comments for posts.
- **Real-Time Updates**: WebSocket-based real-time interactions for comments and notifications.
- **Reading Experience**: Table of contents, "thả tim" reactions, live comments and related posts on blogs; authors can edit and delete their posts.
- **Site Search**: Ctrl/⌘ + K (or `/`) opens a command palette over pages, blogs and stories, matching Vietnamese with or without accents.
- **Lịch vạn niên & tử vi hôm nay**: Daily lunar calendar with can chi, ngày hoàng đạo, giờ hoàng đạo and tiết khí, plus a daily reading for each of the 12 con giáp; visitors pick their animal once (`/fortune/lich`).
- **Xem tuổi hợp nhau**: Compatibility of two people with a score, explanations, a share link and a downloadable image (`/fortune/hop-tuoi`).
- **Đọc sau & Tiếp tục đọc**: Bookmarks and reading history kept in the browser (no account needed); series resume at the last chapter (`/doc-sau`).
- **Installable**: Web app manifest with icons and shortcuts.
- **Responsive Design**: Optimized for both desktop and mobile devices.

## Project Structure

The project is organized into the following main directories:

- **public/**: Contains static assets such as the favicon, HTML template, and images.
- **src/**: Contains the main application code.
  - **components/**: Reusable UI components such as headers, footers, and carousels.
  - **pages/**: Page-level components for different routes (e.g., Blog, SignIn, Story).
  - **layouts/**: Layout components for structuring pages.
  - **contexts/**: React context providers for managing global state (e.g., user info, WebSocket).
  - **customHooks/**: Custom React hooks for reusable logic.
  - **util/**: Utility functions for common operations (e.g., date formatting, API requests).
  - **config/**: Configuration files for constants and enums.

## Design System

- **Tokens** live in [src/index.css](src/index.css) as CSS variables (`--brand`, `--bg`, `--surface`, `--text`, `--border`, …) with a `[data-theme='dark']` override. Use them instead of hard-coded colors so components work in both themes.
- **MUI theme** is generated per color mode in [src/theme.js](src/theme.js); keep its hex values in sync with the CSS tokens.
- **Dark mode** is resolved before first paint in `public/index.html` (saved choice, else system preference) and toggled via `useColorMode()`.
- **Typography**: Be Vietnam Pro for UI, Lora for headings and long-form reading (`.prose`).
- **Shared building blocks**: `PageHeader`, `PostCard`, `ArticleHeader`, `Avatar`, `Reveal`, `ReadingProgress`.

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/FollMe-Frontend.git
   cd FollMe-Frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

## Available Scripts

- **`npm start`**: Runs the app in development mode.
- **`npm test`**: Launches the test runner in interactive watch mode.
- **`npm run build`**: Builds the app for production.

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Commit your changes with clear and descriptive messages.
4. Push your changes to your fork.
5. Submit a pull request.

## License

This project is authored by [Sum Duong](https://github.com/sumsv50). All rights reserved. You are free to use, modify, and distribute this software as long as proper credit is given to the author.
