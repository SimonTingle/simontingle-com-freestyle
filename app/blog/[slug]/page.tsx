"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";

const blogContent: Record<string, any> = {
  "building-dj-mixer": {
    title: "Building a DJ Mixer in the Browser",
    date: "2025-04-08",
    readTime: "12 min read",
    tags: ["web-audio-api", "react", "javascript"],
    author: "Simon Tingle",
    content: `
## Introduction

Building a DJ mixer in the browser is an exciting challenge that combines audio processing, real-time UI updates, and user interaction design. In this article, I'll walk through the key concepts and implementation details of creating a professional-grade digital audio workstation (DAW) using modern web technologies.

## Core Technologies

The foundation of our DJ mixer is built on:

- **React** for UI state management and component architecture
- **Web Audio API** for audio processing and manipulation
- **TypeScript** for type safety
- **Tailwind CSS** for styling

## Architecture

The mixer consists of several key components:

### Dual Turntables

Each turntable has its own audio context, allowing independent control of playback speed, volume, and effects. We use the Web Audio API's \`AudioContext\` to manage the audio graph.

\`\`\`typescript
const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
const deckA = new Deck(audioContext, 'deckA');
const deckB = new Deck(audioContext, 'deckB');
\`\`\`

### Mixer Bus

The mixer bus combines signals from both decks and applies master effects like EQ and compression.

### BPM Synchronization

One of the most important features for DJs is BPM (beats per minute) synchronization. This allows seamless beatmatching between tracks:

\`\`\`typescript
const masterBPM = deckA.bpm;
const ratio = masterBPM / deckB.bpm;
deckB.playbackRate = ratio;
\`\`\`

## Performance Considerations

Working with audio in the browser requires careful performance optimization:

1. Use \`ScriptProcessorNode\` or \`AudioWorklet\` for custom audio processing
2. Minimize DOM updates during playback
3. Use WebWorkers for heavy computations
4. Optimize the React render cycle with memoization

## Challenges and Solutions

### Challenge 1: Precise Timing

Web Audio API timing can drift due to the JavaScript event loop. Solution: Use \`AudioContext.currentTime\` instead of \`Date.now()\`.

### Challenge 2: Audio File Loading

Loading large audio files can be slow. Solution: Stream the audio and use IndexedDB for caching.

### Challenge 3: Cross-Browser Compatibility

Different browsers have different Web Audio API implementations. Solution: Use polyfills and feature detection.

## Conclusion

Building a DJ mixer teaches us valuable lessons about audio processing, real-time systems, and user experience design. The Web Audio API is powerful enough for professional music production tools, and with careful optimization, you can build smooth, responsive applications in the browser.

The full source code is available on GitHub. Happy mixing!
    `,
  },
  "react-threejs-performance": {
    title: "React + Three.js: Performance Gotchas",
    date: "2025-04-01",
    readTime: "10 min read",
    tags: ["three.js", "react", "performance"],
    author: "Simon Tingle",
    content: `
## Overview

React Three Fiber is an amazing library for integrating Three.js with React, but it comes with some unique performance challenges. In this post, I'll share common gotchas and how to avoid them.

## Key Performance Issues

### 1. Unnecessary Re-renders

React's component model can cause unnecessary re-renders in your 3D scene. Use \`memo\` and \`useMemo\` to prevent this.

### 2. Large Geometries

Complex geometries can slow down your scene. Use level-of-detail (LOD) techniques and geometry simplification.

### 3. Memory Leaks

Always clean up resources in \`useEffect\` cleanup functions. Failing to do so will cause memory leaks.

## Best Practices

- Profile your scene with Chrome DevTools
- Use \`useFrame\` sparingly
- Implement frustum culling
- Use texture atlasing to reduce draw calls

## Conclusion

With proper optimization techniques, you can build smooth 60fps 3D experiences in React.
    `,
  },
  "web-audio-api-guide": {
    title: "Audio Processing with Web Audio API",
    date: "2025-03-25",
    readTime: "15 min read",
    tags: ["web-audio-api", "javascript", "music"],
    author: "Simon Tingle",
    content: `
## Web Audio API Fundamentals

The Web Audio API provides a powerful and versatile system for controlling audio on the web. Let's explore its core concepts.

### Audio Context

The AudioContext is your gateway to audio manipulation:

\`\`\`javascript
const audioContext = new AudioContext();
\`\`\`

### Audio Nodes

Audio nodes are the building blocks of audio graphs. Common nodes include:

- AudioBufferSourceNode: Plays audio data
- GainNode: Controls volume
- BiquadFilterNode: Applies EQ
- AnalyserNode: Provides frequency analysis

### Audio Graph

Connect nodes together to create complex audio processing chains:

\`\`\`javascript
source.connect(filter);
filter.connect(gain);
gain.connect(audioContext.destination);
\`\`\`

## Advanced Techniques

### Real-time Frequency Analysis

Use the Analyser node to get frequency data for visualizations:

\`\`\`javascript
const analyser = audioContext.createAnalyser();
const dataArray = new Uint8Array(analyser.frequencyBinCount);
analyser.getByteFrequencyData(dataArray);
\`\`\`

### Custom Audio Processing

For advanced processing, use AudioWorklet:

\`\`\`javascript
audioContext.audioWorklet.addModule('processor.js');
const workletNode = new AudioWorkletNode(audioContext, 'my-processor');
\`\`\`

## Conclusion

The Web Audio API opens up endless possibilities for creative audio applications. Start simple and gradually add complexity as you learn the APIs.
    `,
  },
};

export default function BlogPost({ params }: { params: { slug: string } }) {
  const post = blogContent[params.slug];

  if (!post) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col items-center justify-center">
        <Navigation />
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Post not found
          </h1>
          <Link
            href="/blog"
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-semibold"
          >
            Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col">
      <Navigation />
      <main className="flex-1 pt-20">
        <div className="max-w-3xl mx-auto px-4 md:px-8 py-12">
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Header */}
            <div className="mb-12 pb-8 border-b border-gray-200 dark:border-gray-700">
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4">
                {post.title}
              </h1>

              <div className="flex flex-wrap gap-6 text-gray-600 dark:text-gray-400 text-sm md:text-base mb-6">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">By {post.author}</span>
                </div>
                <div className="flex items-center gap-2">
                  <time dateTime={post.date}>
                    {new Date(post.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </time>
                </div>
                <div>•</div>
                <div>{post.readTime}</div>
              </div>

              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="text-xs px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="prose dark:prose-invert max-w-none mb-12">
              {post.content.split("\n\n").map((paragraph: string, idx: number) => {
                if (paragraph.startsWith("##")) {
                  return (
                    <h2 key={idx} className="text-3xl font-bold mt-8 mb-4 text-gray-900 dark:text-white">
                      {paragraph.replace("## ", "")}
                    </h2>
                  );
                } else if (paragraph.startsWith("###")) {
                  return (
                    <h3 key={idx} className="text-2xl font-bold mt-6 mb-3 text-gray-900 dark:text-white">
                      {paragraph.replace("### ", "")}
                    </h3>
                  );
                } else if (paragraph.startsWith("```")) {
                  const lang = paragraph.match(/```(\w+)/)?.[1] || "text";
                  const code = paragraph.replace(/```[\w]*\n?/, "").replace(/```/, "");
                  return (
                    <pre key={idx} className="bg-gray-800 text-gray-100 p-4 rounded-lg overflow-x-auto my-6">
                      <code className={`language-${lang}`}>{code.trim()}</code>
                    </pre>
                  );
                } else {
                  return (
                    <p key={idx} className="text-lg text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                      {paragraph}
                    </p>
                  );
                }
              })}
            </div>

            {/* Navigation */}
            <div className="pt-8 border-t border-gray-200 dark:border-gray-700">
              <Link
                href="/blog"
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-semibold transition-colors"
              >
                ← Back to Blog
              </Link>
            </div>
          </motion.article>
        </div>
      </main>
      <Footer />
    </div>
  );
}
