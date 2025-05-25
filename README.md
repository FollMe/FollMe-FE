# FollMe Frontend

FollMe Frontend is a React-based web application that provides an interactive user interface for managing posts, comments, and real-time interactions. This project is designed to deliver a seamless user experience with modern web technologies.

## Features

- **Post Management**: Create, view, and manage posts.
- **Comment System**: Add, retrieve, and manage comments for posts.
- **Real-Time Updates**: WebSocket-based real-time interactions for comments and notifications.
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
