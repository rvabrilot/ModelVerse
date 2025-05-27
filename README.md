# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Development

To develop this project locally, follow these steps:

### Prerequisites

*   [Node.js](https://nodejs.org/) (version 20 or later recommended, as specified in `package.json` engines)
*   [npm](https://www.npmjs.com/) (comes with Node.js)

### Setup

1.  **Clone the repository (if you haven't already):**
    If you're working in Firebase Studio, your project is likely already set up. If you're cloning it fresh:
    ```bash
    git clone <your-repository-url>
    cd <your-project-directory>
    ```

2.  **Install dependencies:**
    Navigate to the project's root directory in your terminal and run:
    ```bash
    npm install
    ```

### Running the Development Servers

This project uses Next.js for the frontend and Genkit for AI functionalities. You'll typically need to run both development servers concurrently in separate terminal windows.

1.  **Start the Next.js development server:**
    This server handles the web application.
    ```bash
    npm run dev
    ```
    Your application will usually be available at `http://localhost:9002` (as per the `dev` script in `package.json`).

2.  **Start the Genkit development server:**
    This server handles AI flows and provides a developer UI for testing Genkit functionalities.
    ```bash
    npm run genkit:dev
    ```
    Alternatively, to have Genkit automatically restart when flow files change:
    ```bash
    npm run genkit:watch
    ```
    The Genkit developer UI will usually be available at `http://localhost:4000`.

### Building for Production

To create an optimized production build of the Next.js application:
```bash
npm run build
```
This command will compile your Next.js app and prepare it for deployment.

### Linting and Type Checking

To ensure code quality and catch potential errors:

*   **Lint:**
    This command uses ESLint to analyze your code for style and potential issues.
    ```bash
    npm run lint
    ```

*   **Type Check:**
    This command uses the TypeScript compiler (`tsc`) to check for type errors in your codebase.
    ```bash
    npm run typecheck
    ```

### Additional Notes

*   **Firebase Emulators:** If your project uses Firebase services like Authentication, Firestore, or Functions (beyond Genkit flows), consider setting up and using the [Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite) for local development and testing.
*   **Environment Variables:** If your application requires environment variables (e.g., API keys), ensure you have a `.env.local` file set up as per Next.js conventions. Do not commit this file to version control if it contains sensitive information.
