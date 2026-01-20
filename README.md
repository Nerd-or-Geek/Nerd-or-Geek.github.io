# Nerd or Geek? Website

A modern, responsive website for tech enthusiasts, built with HTML, CSS, TypeScript, and SCSS.

## Features

- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- **Sidebar Navigation**: Toggle-able sidebar for better mobile experience
- **Search Bar**: Integrated search functionality
- **GitHub Integration**: Direct link to GitHub profile
- **Logo & Branding**: Clickable logo that returns to homepage
- **Modern Styling**: Clean, professional design with smooth animations

## Project Structure

```
├── index.html                 # Main HTML file
├── src/
│   ├── styles/
│   │   ├── main.scss         # SCSS source file
│   │   └── main.css          # Compiled CSS
│   └── scripts/
│       └── main.ts           # TypeScript source
├── dist/
│   └── main.js              # Compiled JavaScript
├── assets/
│   └── img/                 # Images and logos
├── projects/                # Project pages (future)
├── package.json             # NPM configuration
└── tsconfig.json            # TypeScript configuration
```

## Getting Started

### Prerequisites

- Node.js and npm installed
- Git for version control

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Nerd-or-Geek/Nerd-or-Geek.github.io.git
   cd Nerd-or-Geek.github.io
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Development

Start the development mode with auto-compilation:

```bash
npm run dev
```

This will watch for changes in TypeScript and SCSS files and auto-compile them.

### Building

To build the project:

```bash
npm run build
```

Individual build commands:
- `npm run build:ts` - Compile TypeScript only
- `npm run build:scss` - Compile SCSS only

### Deployment

The project is configured for GitHub Pages deployment:

```bash
npm run deploy
```

Or manually:
1. Build the project: `npm run build`
2. Commit changes: `git add .`
3. Push to main branch: `git push`

GitHub Pages will automatically deploy from the main branch.

## File Descriptions

### index.html
- Main entry point of the website
- Contains header with logo, search bar, and GitHub link
- Includes sidebar navigation
- Features hero section and projects grid

### src/styles/main.scss
- SCSS source file with variables and mixins
- Organized into logical sections
- Responsive design with mobile-first approach
- Compiles to main.css

### src/styles/main.css
- Compiled CSS from SCSS
- Comprehensive styling for all components
- Ready to use if SCSS compilation isn't available

### src/scripts/main.ts
- TypeScript source file
- Handles sidebar toggling
- Search functionality
- Event listeners and DOM manipulation
- Compiled to dist/main.js

### dist/main.js
- Compiled JavaScript ready for browser
- All functionality from TypeScript
- Compatible with all modern browsers

## Features Explained

### Header
- **Logo**: Click to return to homepage
- **Site Name**: Displays "Nerd or Geek?" branding
- **Search Bar**: Full search functionality with Enter key support
- **GitHub Link**: Direct link to GitHub profile
- **Sidebar Toggle**: Mobile-friendly menu button

### Sidebar
- Smooth slide-in animation
- Navigation links to main sections
- Close button and escape key support
- Overlay for easy closing
- Mobile-optimized width

### Main Content
- Hero section with welcome message
- Featured projects grid
- Responsive layout that adapts to screen size
- Smooth animations and transitions

## Customization

### Colors
Edit the SCSS variables in `src/styles/main.scss`:
- `$primary-color`: Main accent color (default: #0ea5e9)
- `$secondary-color`: Dark background (default: #1e293b)
- `$text-light`: Light text color
- `$text-dark`: Dark text color

### Logo
Replace the logo image at `assets/img/logo.png` with your own

### Content
Edit `index.html` to customize:
- Site title
- Hero section text
- Project cards
- Navigation links

## Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Mobile browsers: Latest versions

## License

MIT License - see LICENSE file for details

## Author

Nerd or Geek?

## Contributing

Feel free to fork and submit pull requests for any improvements.

---

**Note**: This project uses GitHub Pages for hosting. Ensure your repository is named `username.github.io` for automatic GitHub Pages deployment.
