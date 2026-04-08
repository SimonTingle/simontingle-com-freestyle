export interface Project {
  id: string;
  name: string;
  description: string;
  longDescription?: string;
  tech: string[];
  liveUrl: string;
  githubUrl?: string;
  featured: boolean;
  image: string;
  color?: string;
}

export const projects: Project[] = [
  {
    id: "dj-tingle",
    name: "DJ Tingle",
    description: "Web-based digital audio workstation for DJ mixing with dual decks, effects, and real-time BPM synchronization.",
    longDescription: "A professional-grade DJ mixing application built with React and Web Audio API. Features dual turntables with independent controls, mixer with EQ, hot cues, looping, playlist management, and audio effects.",
    tech: ["React", "Web Audio API", "TypeScript", "Tailwind CSS"],
    liveUrl: "https://djtingle-0326-production.up.railway.app/",
    featured: true,
    image: "/projects/dj-tingle.png",
    color: "from-purple-500 to-pink-500",
  },
  {
  id: "street-driver",
  name: "Street Driver Radio Edition",
  description: "Open-world 3D driving game with real-world maps, live radio stations, multiplayer, and a GPS-driven economy system.",
  longDescription: "A browser-based open-world driving game powered by Three.js and real OpenStreetMap data. Drive through any city on Earth — the map loads live from GPS coordinates. Features a multiplayer driver network with proximity voice chat, 30,000+ live radio stations that auto-tune by location, an in-game economy with delivery jobs, aircraft tracking, video billboards, and a full HUD with compass, radar, and leaderboard.",
  tech: ["React", "Three.js", "TypeScript", "Socket.io", "Prisma", "PostgreSQL", "Tailwind CSS", "Vite"],
  liveUrl: "https://street-driver-radio-edition-production.up.railway.app/",
  featured: true,
  image: "/projects/streetdriver.png",
  color: "from-cyan-500 to-blue-700",
  },
  {
  id: "international-energy",
  name: "Live Fuel Tracker",
  description: "Real-time global fuel dashboard tracking oil reserves, production, R/P ratios, and live maritime disruptions — zero mock data, all values fetched live from public APIs.",
  longDescription: "A full-stack Next.js 15 dashboard that tracks international energy data in real-time. Pulls oil reserves and production from EIA, OWID (Our World in Data), and World Bank APIs. Live maritime disruption feed aggregates @WindwardAI Gulf shipping alerts via Nitter RSS (no Twitter API key needed), MARAD official advisories, gCaptain, and MarineTraffic RSS. Features a 20-source fallback chain per request — if one data source fails, the next is tried automatically. Sortable country table with R/P ratio calculations, US weekly inventory tracking (crude, gasoline, distillate), and live Brent crude price.",
  tech: ["Next.js 15", "TypeScript", "Tailwind CSS", "EIA API", "OWID CSV", "World Bank API", "Nitter RSS", "MARAD"],
  liveUrl: "https://international-energy-production.up.railway.app/",
  featured: true,
  image: "/projects/internationalenergy.png",
  color: "from-amber-500 to-orange-600",
  },
];

export const getFeaturedProjects = () => projects.filter((p) => p.featured);
export const getProjectById = (id: string) => projects.find((p) => p.id === id);
