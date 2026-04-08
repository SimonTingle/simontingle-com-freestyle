# Quick Start Guide

## What You Got

Your portfolio blog website is **fully built and ready to customize**. Here's what's included:

✅ **Three.js Hero** - Interactive rolling hills landing section  
✅ **Project Showcase** - Grid layout for your projects  
✅ **About Section** - Bio and tech skills  
✅ **Contact Form** - Get in touch section  
✅ **Blog System** - Full blog with posts and listing  
✅ **Navigation** - Responsive header and mobile menu  
✅ **Dark Mode** - Built-in dark theme support  

## Get Started in 3 Steps

### Step 1: Add Your Projects

Open `lib/projects.ts` and update the projects array:

```typescript
{
  id: "street-driver-radio",
  name: "Street Driver Radio Edition",
  description: "Your app description here",
  tech: ["React", "TypeScript", "etc"],
  liveUrl: "https://street-driver-radio-edition-production-436e.up.railway.app/",
  featured: true,
  image: "/projects/street-driver.png",
}
```

### Step 2: Add Project Images

1. Save your project screenshots to `public/projects/`
2. Update the `image` path in `projects.ts`

### Step 3: Deploy to Vercel

```bash
# Initialize git (if needed)
git init

# Create repo on GitHub, then:
git remote add origin https://github.com/yourusername/portfolio
git add .
git commit -m "Initial portfolio"
git push -u origin main

# Then go to vercel.com and import your GitHub repo
```

## File Guide

| File | Purpose |
|------|---------|
| `lib/projects.ts` | **📌 Update your projects here** |
| `components/Hero3D.tsx` | Three.js rolling hills scene |
| `components/About.tsx` | Bio and skills section |
| `app/blog/[slug]/page.tsx` | **📌 Add blog posts here** |
| `components/Contact.tsx` | Contact form section |
| `public/projects/` | **📌 Add project images here** |

## Live Preview

1. Run `npm run dev`
2. Open `http://localhost:3000`
3. See your portfolio in action

## Key Sections

### Hero Section
- Three.js interactive landscape
- Your name and tagline
- Scroll indicator

### Projects
- Grid of your work
- Live demo buttons
- GitHub links
- Tech badges

### Blog
- Blog listing page (`/blog`)
- Individual posts (`/blog/slug-name`)
- Tags and reading time
- Sample posts included

### Contact
- Email form
- Social links
- Direct contact methods

## Customization Tips

**Want to change colors?**
- Primary blue: Search `bg-blue-600` in components
- Gradients: Search `from-` and `to-` in projectcard

**Want different hero?**
- Edit `components/Hero3D.tsx`
- Adjust camera, lighting, colors

**Want different layout?**
- Edit component files directly
- Everything is commented

## Email Setup (Optional)

To make the contact form actually send emails:

1. Sign up for Resend, SendGrid, or similar
2. Create API route: `app/api/send-email/route.ts`
3. Update form handler in `Contact.tsx`

See SETUP.md for detailed code example.

## What's Next?

1. ✏️ Update projects in `lib/projects.ts`
2. 🖼️ Add project images to `public/projects/`
3. ✍️ Add blog posts to `app/blog/[slug]/page.tsx`
4. 📧 Set up email service (optional)
5. 🚀 Deploy to Vercel
6. 🌐 Add custom domain

## Common Tasks

### Add a project
Edit `lib/projects.ts` and add to projects array

### Add a blog post
Add to `blogContent` in `app/blog/[slug]/page.tsx`  
Add to `blogPosts` in `app/blog/page.tsx`

### Change about section
Edit `components/About.tsx`

### Update contact email
Edit `components/Contact.tsx` and `components/Footer.tsx`

### Change hero colors
Edit `<meshPhongMaterial color="#3b82f6" />` in `Hero3D.tsx`

## Deployment Checklist

- [ ] Add all your projects
- [ ] Add project images
- [ ] Update about section
- [ ] Add blog posts
- [ ] Push to GitHub
- [ ] Deploy on Vercel
- [ ] Configure custom domain
- [ ] Set up email service

## Troubleshooting

**Three.js not showing?**
- Check browser console for errors
- Ensure dependencies installed: `npm list three`

**Blog post not appearing?**
- Verify slug is consistent in both arrays
- Check date format (YYYY-MM-DD)

**Images not loading?**
- Ensure images are in `public/projects/`
- Check path in projects.ts is correct

## Resources

- **Next.js**: https://nextjs.org/docs
- **Three.js**: https://threejs.org/docs
- **Tailwind**: https://tailwindcss.com/docs
- **Vercel**: https://vercel.com/docs

---

💡 **Pro Tip**: Use the `SETUP.md` file for detailed instructions on any customization.

Happy building! 🚀
