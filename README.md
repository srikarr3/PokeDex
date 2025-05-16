# Pokédex App

A modern, feature-rich Pokédex built with Next.js, TypeScript, and Tailwind CSS. Browse, search, and explore Pokémon with advanced features like team building, battle simulation, and achievements.

## 🌟 Features
- Pokémon database with search and details
- Team builder
- Battle simulator
- Type calculator
- Achievement system
- Responsive design
- Favorites system
- Pokéball loading spinner
- Faint Pokéball background pattern
- Custom Pokéball favicon
- Performance optimizations (pagination, lazy loading)

## 🛠️ Tech Stack
- Next.js 14
- TypeScript
- Tailwind CSS
- Framer Motion
- PokeAPI

## 🚀 Getting Started

### Prerequisites

- Node.js 18.0 or later
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/pokedex-app.git
cd pokedex-app
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📱 Features in Detail

### Pokémon Details
- Comprehensive Pokémon information
- Evolution chains
- Base stats
- Moves and abilities
- Type effectiveness

### Team Builder
- Create and save multiple teams
- Drag and drop interface
- Team analysis
- Type coverage visualization

### Battle Simulator
- Turn-based battle system
- Move selection
- Damage calculation
- Battle history

### Achievements
- Track progress
- Unlock rewards
- Points system
- Progress persistence

## 🚀 Deployment

This project is deployed on Vercel. To deploy your own version:

1. Fork this repository
2. Create a Vercel account
3. Import your repository
4. Deploy!

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [PokeAPI](https://pokeapi.co/) for the Pokémon data
- [Next.js](https://nextjs.org/) for the framework
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Framer Motion](https://www.framer.com/motion/) for animations

## Favicon
- The app uses a custom Pokéball SVG favicon (`public/favicon.svg`).
- You can replace this with any SVG/PNG icon by updating the file and the `<link rel="icon" ... />` in `src/app/layout.tsx`.

## Pokéball Loading Screen
- The Pokéball loading spinner is shown during route transitions using Next.js's `loading.tsx` files.
- You can customize the spinner in `src/components/LoadingSpinner.tsx`.

## Performance Best Practices
- **Pagination:** Only 20 Pokémon are fetched and rendered per page for fast load times.
- **Lazy Loading:** Pokémon images use Next.js `<Image />` for automatic lazy loading and optimization.
- **Hydration Warnings:** If you see hydration mismatch warnings about Grammarly or other browser extensions, they are harmless and can be ignored. For a clean test, use an incognito window with extensions disabled.

## Customization
- Change the background pattern in `public/pokeball-pattern.svg`.
- Adjust the color palette in Tailwind config or component classes.
- Swap out the favicon or loading spinner for your own style.
