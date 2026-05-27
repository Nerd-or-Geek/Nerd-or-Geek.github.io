# Image Setup Instructions

## Quick Setup

I've created the folder structure for your images. Now follow these steps to place them:

### Step 1: Main Logo
Place the **main circular "Nerd or Geek?" logo** at:
```
assets/img/logo.png
```

This logo appears in the header navigation bar.

### Step 2: Favicon (Optional but Recommended)
Place a **favicon version** of your logo at:
```
assets/img/favicons/favicon.ico
```

This appears in the browser tab. You can:
- Use the same logo but sized to 32x32 or 64x64 pixels
- Or skip this and the website will still work (will show default browser icon)

### Step 3: Project Images
Place your project images in:
```
assets/img/projects/
```

You provided 3 images that could be projects:
- **Mobius App Icon** → Save as: `assets/img/projects/project-1.png`
- **Minecraft Raspberry** → Save as: `assets/img/projects/project-2.png`
- Or name them based on actual project names

If you have other/different project images, name them:
- `project-1.png`
- `project-2.png`
- `project-3.png`
- etc.

The HTML is already configured to display images from this folder.

## Folder Structure After Setup

```
assets/
├── img/
│   ├── logo.png                          ← Main header logo
│   ├── favicons/
│   │   └── favicon.ico                   ← Browser tab icon
│   └── projects/
│       ├── project-1.png                 ← First project image
│       ├── project-2.png                 ← Second project image
│       └── project-3.png                 ← Third project image
```

## Image Requirements

- **Format**: PNG or JPG (PNG recommended for logos with transparency)
- **Logo**: Should work at 50px height in the header
- **Project Images**: 280px wide x 180px height works best (will auto-scale)
- **Favicon**: 32x32px minimum, 64x64px recommended

## What's Already Done

✅ Created all necessary image folders
✅ Updated HTML to reference images properly
✅ Added image display CSS with hover effects
✅ Configured favicon link in header
✅ Project images will now display in the project cards instead of placeholders

## Need to Rename Projects?

To change project names, edit `index.html` and update the `alt` text and `<h3>` titles in the project cards.

Example:
```html
<img src="assets/img/projects/project-1.png" alt="Your Project Name">
<h3>Your Project Name</h3>
```

## Testing

After placing the images:
1. Open `index.html` in a browser
2. Logo should appear in the header
3. Project images should display in the cards below
4. Hovering over projects should show a subtle zoom effect
5. Logo should be clickable and navigate to homepage
