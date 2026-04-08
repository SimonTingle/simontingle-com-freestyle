# Portfolio Blog Website - Setup & Customization Guide

## Quick Start

```bash
# Install dependencies (already done)
npm install --legacy-peer-deps

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

The app will be available at `http://localhost:3000`

## Project Structure

```
├── app/
│   ├── page.tsx                 # Home page (hero + about + projects)
│   ├── layout.tsx               # Root layout with metadata
│   ├── globals.css              # Global styles
│   └── blog/
│       ├── page.tsx             # Blog listing
│       └── [slug]/
│           └── page.tsx         # Individual blog post
├── components/
│   ├── Hero3D.tsx              # Three.js rolling hills
│   ├── Navigation.tsx          # Top navigation bar
│   ├── About.tsx               # About section
│   ├── ProjectCard.tsx         # Single project card
│   ├── ProjectShowcase.tsx     # Project grid
│   ├── Contact.tsx             # Contact form section
│   └── Footer.tsx              # Footer
├── lib/
│   └── projects.ts             # Project data & types
└── public/
    └── projects/               # Project images (add here)
```

## How to Customize

### 1. Update Projects

Edit `lib/projects.ts` to add, remove, or modify projects:

```typescript
export const projects: Project[] = [
  {
    id: "project-id",
    name: "Project Name",
    description: "Short description",
    longDescription: "Longer description for detail pages",
    tech: ["React", "TypeScript"],
    liveUrl: "https://example.com",
    githubUrl: "https://github.com/...",
    featured: true,
    image: "/projects/project.png",
    color: "from-purple-500 to-pink-500", // gradient colors
  },
  // ... more projects
];
```

**Color Gradient Options:**
- `from-purple-500 to-pink-500`
- `from-blue-500 to-cyan-500`
- `from-emerald-500 to-teal-500`
- `from-orange-500 to-red-500`
- `from-indigo-500 to-purple-500`

### 2. Add Project Images

1. Export your project screenshot/thumbnail as PNG or WEBP
2. Save to `public/projects/project-name.png`
3. Update the `image` field in `projects.ts` to `/projects/project-name.png`

**Image Requirements:**
- Size: 1200x800px recommended
- Format: PNG, WEBP, or JPG
- Size: Optimize to < 300KB (use TinyPNG or similar)

### 3. Update About Section

Edit `components/About.tsx` to change:
- Bio text
- Tech skills list
- Links (GitHub, LinkedIn, etc.)

### 4. Add Blog Posts

Blog posts are stored in `app/blog/[slug]/page.tsx` as content objects. To add a new post:

1. Open `app/blog/[slug]/page.tsx`
2. Add new entry to the `blogContent` object:

```typescript
const blogContent: Record<string, any> = {
  "your-post-slug": {
    title: "Your Post Title",
    date: "2025-04-08",
    readTime: "10 min read",
    tags: ["tag1", "tag2"],
    author: "Simon Tingle",
    content: `
## Heading

Your markdown content here...

\`\`\`javascript
// Code blocks work
const example = true;
\`\`\`
    `,
  },
};
```

3. Add to the `blogPosts` array in `app/blog/page.tsx`:

```typescript
const blogPosts: BlogPost[] = [
  {
    id: "3",
    title: "Your Post Title",
    excerpt: "Short excerpt for the blog listing",
    date: "2025-04-08",
    readTime: "10 min read",
    tags: ["tag1", "tag2"],
    slug: "your-post-slug",
  },
  // ... other posts
];
```

### 5. Update Contact Information

Edit `components/Contact.tsx` and `components/Footer.tsx` to update:
- Email address
- Social media links
- Contact form handling (currently logs to console)

To integrate with email service:
- Use Resend, SendGrid, or Nodemailer
- Add backend API route in `app/api/send-email/route.ts`

Example with Resend:

```typescript
// app/api/send-email/route.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  const { email, message } = await req.json();
  
  const result = await resend.emails.send({
    from: 'noreply@yourdomain.com',
    to: 'your-email@domain.com',
    subject: `New message from ${email}`,
    html: `<p>${message}</p>`,
  });

  return Response.json(result);
}
```

Then update the form handler in `Contact.tsx` to POST to this endpoint.

### 6. Customize Hero Scene

The Three.js rolling hills are generated procedurally in `components/Hero3D.tsx`. You can customize:

- **Colors:** Change the `<meshPhongMaterial color="#3b82f6" />`
- **Speed:** Adjust `autoRotateSpeed` in `<OrbitControls />`
- **Hills shape:** Modify the sine/cosine formula in the geometry generation
- **Lighting:** Adjust `<ambientLight />` and `<pointLight />` intensities

### 7. Update Metadata & SEO

Edit `app/layout.tsx` to update:
- Site title
- Description
- Keywords
- Author info

Update `app/page.tsx` metadata if you add dynamic meta tags.

### 8. Customize Colors & Styling

Tailwind CSS is configured. Update `tailwind.config.ts` if you want custom colors. Current color scheme:
- Primary: Blue (`bg-blue-600`)
- Text: Gray
- Accents: Gradient effects

## Deployment to Vercel

### 1. Push to GitHub

```bash
git init (if not already a git repo)
git add .
git commit -m "Initial portfolio commit"
git remote add origin https://github.com/yourusername/portfolio
git push -u origin main
```

### 2. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "Add New" → "Project"
4. Select your portfolio repository
5. Vercel will auto-detect Next.js configuration
6. Click "Deploy"

### 3. Custom Domain

After deployment:
1. Go to your Vercel project settings
2. Navigate to "Domains"
3. Add your custom domain (e.g., simontingle.com)
4. Update DNS records according to Vercel's instructions

## Performance Optimization

The site is optimized for performance:
- ✅ Three.js scene uses LOD (level of detail)
- ✅ Images should be WebP format and optimized
- ✅ Framer Motion uses GPU acceleration
- ✅ Code splitting by route (Next.js automatic)

**Lighthouse Targets:**
- Performance: >80
- Accessibility: >95
- Best Practices: >95
- SEO: >95

Run `npm run build` and check build output for optimization hints.

## Troubleshooting

### Three.js scene not rendering

- Check browser console for errors
- Ensure Three.js dependencies are installed: `npm list three`
- Try disabling browser extensions that might conflict with WebGL

### Blog posts not showing

- Verify slug matches between `blogContent` and `blogPosts` array
- Check date format (should be YYYY-MM-DD)

### Images not loading

- Verify image path is correct (relative to `public/`)
- Image should be in `public/projects/` folder
- Check file extension matches in code

### Vercel deployment fails

- Check Node version requirement (v20.9.0+)
- Run `npm run build` locally and fix any errors
- Check environment variables are set if needed

## Next Steps

1. **Add your projects** - Update `lib/projects.ts` with your real projects
2. **Upload project images** - Add screenshots to `public/projects/`
3. **Write blog posts** - Add articles to `app/blog/[slug]/page.tsx`
4. **Set up email** - Integrate email service for contact form
5. **Deploy to Vercel** - Push to GitHub and deploy
6. **Add custom domain** - Configure your domain in Vercel

## Support

For issues with:
- **Next.js**: https://nextjs.org/docs
- **Three.js**: https://threejs.org/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **React Three Fiber**: https://docs.pmnd.rs/react-three-fiber

Good luck building! 🚀
