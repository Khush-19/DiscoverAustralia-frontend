## Project Directory and File Descriptions

The project is organized into two main sections: **Core Project Files** and **Auto-generated/Cache Files**.

### 1. Core Project Files
These are the essential code and configuration files that require active maintenance and focus during development.

| Directory/File | Description |
| :--- | :--- |
| **`screens/`** | **Page Components**. Contains all screen pages of the application (e.g., Login, Profile, Home). |
| **`components/`** | **Shared Components**. Reusable UI elements (e.g., Buttons, Inputs, Cards). |
| **`navigation/`** | **Navigation Config**. Defines page routing logic and the application's navigation structure. |
| **`services/`** | **Backend Services/API**. Contains API request logic and backend data interaction code. |
| **`context/`** | **State Management**. Uses React Context API to handle global state (e.g., User Info, Themes). |
| **`hooks/`** | **Custom Hooks**. Encapsulated logic designed for reuse across different components. |
| **`constants/`** | **Constants Config**. Stores color schemes, API endpoints, static strings, etc. |
| **`src/`** (Removed) | **Web Source Code**. Contained the entry point (`main.jsx`) and styles (`App.css`) used by Vite. |
| **`App.jsx`** (Checked) | **Mobile Entry Point**. The first React component loaded by Expo when starting the app. |
| **`app.json`** (Checked) | **Expo Configuration**. Defines mobile attributes like App Name, Icon, Splash Screen, and Permissions. |
| **`package.json`** (Updated) | **Dependency Management**. Records project libraries (Dependencies) and execution scripts. |
| **`tailwind.config.js`** (Checked) | **Style Configuration**. Defines style rules if using NativeWind or Tailwind CSS. |
| **`metro.config.js`** (Updated) | **Metro Bundler Config**. Settings for the React Native asset bundler (Metro). |
| **`vite.config.js`** (Removed) | **Web Build Config**. Configuration settings for the Vite tool. |
| **`global.css`** (Updated) | **Global Styles**. Defines cross-platform CSS variables and foundational styles. |

---

### 2. Auto-generated & Cache Files
These files are generated automatically by tools and generally do not require manual modification.

| Directory/File | Description | Source |
| :--- | :--- | :--- |
| **`.expo/`** | **Dev Cache**. Stores recent connection info and development server settings. | Generated via `npx expo start`. |
| **`node_modules/`** | **Dependencies**. Stores all downloaded third-party packages. | Generated via `npm install`. |
| **`package-lock.json`** | **Version Lock**. Ensures consistent library versions across the development team. | Updated automatically by `npm`. |
| **`android/`** | **Android Native Project**. Contains Java/Kotlin native code. | Generated via `npx expo prebuild`. |

---

### 3. Miscellaneous Files
- **`.gitignore`**: Specifies which files and folders Git should ignore. (Updated)
- **`README.md`**: Project documentation (this file). (Ongoing updates)
- **`babel.config.js`**: JavaScript transpiler configuration. (Updated)
- **`eslint.config.js`**: Code linting and style enforcement configuration. (Updated)