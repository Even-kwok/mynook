

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { IconHeart, IconBookmark } from './Icons';

const blogPosts = [
    {
      id: 'post-1',
      imageUrl: 'https://storage.googleapis.com/aistudio-hosting/blog/blog_1.png',
      author: {
        name: 'AI Writer',
        avatarUrl: 'https://storage.googleapis.com/aistudio-hosting/blog/avatar.png'
      },
      title: "Modern Minimalist vs. Japandi: Which is Right for You?",
      excerpt: "A deep dive into the philosophies, key elements, and subtle differences between Modern Minimalist and Japandi design styles.",
      tags: ["Minimalist", "Japandi", "Style Guide"],
      tagKeys: ['minimalist', 'japandi', 'style-guide'],
      readMoreLink: '#'
    },
    {
      id: 'post-2',
      imageUrl: 'https://storage.googleapis.com/aistudio-hosting/blog/blog_2.png',
      author: {
        name: 'AI Writer',
        avatarUrl: 'https://storage.googleapis.com/aistudio-hosting/blog/avatar.png'
      },
      title: "Maximizing Small Spaces: AI-Powered Layout Ideas",
      excerpt: "Learn how to use AI to generate clever and beautiful layouts for small apartments and studios, making the most of every square foot.",
      tags: ["Small Spaces", "AI Design", "+1"],
      tagKeys: ['small-spaces', 'ai-design', 'plus-one'],
      readMoreLink: '#'
    },
    {
      id: 'post-3',
      imageUrl: 'https://storage.googleapis.com/aistudio-hosting/blog/blog_3.png',
      author: {
        name: 'AI Writer',
        avatarUrl: 'https://storage.googleapis.com/aistudio-hosting/blog/avatar.png'
      },
      title: "The Ultimate Guide to Perfect Lighting with AI",
      excerpt: "Discover how to use AI prompts to achieve the perfect lighting for any mood, from cozy and warm to bright and airy.",
      tags: ["Lighting", "How-To", "Pro Tips"],
      tagKeys: ['lighting', 'how-to', 'pro-tips'],
      readMoreLink: '#'
    },
    {
      id: 'post-4',
      imageUrl: 'https://storage.googleapis.com/aistudio-hosting/blog/blog_4.png',
      author: {
        name: 'AI Writer',
        avatarUrl: 'https://storage.googleapis.com/aistudio-hosting/blog/avatar.png'
      },
      title: "Color Theory in Interior Design: An AI Perspective",
      excerpt: "A step-by-step guide on how to leverage AI to test and perfect color palettes for your interior design projects.",
      tags: ["Color Theory", "AI Tools", "Guides"],
      tagKeys: ['color-theory', 'ai-tools', 'guides'],
      readMoreLink: '#'
    }
];

const tags = [
    { key: 'all', name: 'All' },
    { key: 'ai-tools-guide', name: 'AI Tools Guide' },
    { key: 'api-development', name: 'Inspiration' },
    { key: 'chat-guides', name: 'Design Trends' },
    { key: 'model-comparison', name: 'Model Comparison' },
    { key: 'technical-skills', name: 'Technical Skills' },
    { key: 'image-generation', name: 'Image Generation' },
    { key: 'product-review', name: 'How-To Guides' },
    { key: 'optimization', name: 'Optimization' },
    { key: 'how-to', name: 'How-To' },
];

export const BlogPage: React.FC = () => {
    const [activeTag, setActiveTag] = useState('all');

    const filteredPosts = activeTag === 'all'
        ? blogPosts
        : blogPosts.filter(post => post.tagKeys.includes(activeTag));

    return (
        <main className="flex-1 overflow-y-auto bg-slate-50 scrollbar-hide pt-[72px]">
            <section className="py-16">
                <div className="container mx-auto max-w-5xl flex justify-center flex-wrap gap-2 px-4">
                    {tags.map((tag, index) => (
                        <motion.button
                            key={tag.key}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            onClick={() => setActiveTag(tag.key)}
                            className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                                activeTag === tag.key 
                                ? 'bg-indigo-600 text-white shadow' 
                                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                            }`}
                        >
                            {tag.name}
                        </motion.button>
                    ))}
                </div>
            </section>

            <section className="pb-16 px-4">
                <div className="container mx-auto max-w-5xl">
                    <motion.div 
                        initial="hidden"
                        animate="visible"
                        variants={{
                            visible: { transition: { staggerChildren: 0.1 } }
                        }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-8"
                    >
                        {filteredPosts.map(post => (
                            <motion.div 
                                key={post.id}
                                variants={{
                                    hidden: { opacity: 0, y: 20 },
                                    visible: { opacity: 1, y: 0 }
                                }}
                                className="bg-white rounded-3xl border border-slate-100 shadow-lg shadow-slate-500/5 hover:shadow-xl hover:shadow-slate-500/10 transition-shadow flex flex-col"
                            >
                                <div className="aspect-video overflow-hidden rounded-t-3xl">
                                    <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover" />
                                </div>
                                <div className="p-6 flex flex-col flex-grow">
                                    <div className="flex items-center gap-3 mb-4">
                                        <img src={post.author.avatarUrl} alt={post.author.name} className="w-8 h-8 rounded-full" />
                                        <span className="text-sm font-semibold text-slate-800">{post.author.name}</span>
                                    </div>
                                    <h2 className="text-xl font-bold text-slate-900 leading-snug">{post.title}</h2>
                                    <p className="mt-2 text-slate-600 text-sm flex-grow">{post.excerpt}</p>
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        {post.tags.map(tag => (
                                            <span key={tag} className="bg-slate-100 text-slate-600 text-xs font-medium px-2.5 py-1 rounded-full">{tag}</span>
                                        ))}
                                    </div>
                                    <div className="mt-6 pt-4 border-t border-slate-200 flex justify-between items-center">
                                        <a href={post.readMoreLink} className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">
                                            Read more →
                                        </a>
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <button className="p-2 rounded-full hover:bg-slate-100 hover:text-red-500 transition-colors">
                                                <IconHeart className="w-5 h-5"/>
                                            </button>
                                            <button className="p-2 rounded-full hover:bg-slate-100 hover:text-slate-700 transition-colors">
                                                <IconBookmark className="w-5 h-5"/>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>
        </main>
    );
};