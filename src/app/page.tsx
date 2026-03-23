"use client"

import { motion } from "framer-motion"
import {
  Sparkles,
  BookOpen,
  Moon,
  Palette,
  Volume2,
  Shield,
  Star,
  ChevronRight,
  Users,
  Wand2,
  CloudMoon,
  Heart,
  ImagePlus,
  Quote,
  Download,
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { DemoStoryPlayer } from "@/components/demo-story-player"

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
}

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
}

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-primary/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Sparkles className="w-7 h-7 text-primary" />
            <span className="font-heading text-2xl font-bold text-primary">
              PixieTales
            </span>
          </Link>
          <div className="flex items-center gap-4 sm:gap-8">
            <a href="#features" className="text-sm sm:text-base text-text-muted hover:text-primary transition-colors cursor-pointer">
              Features
            </a>
            <a href="#how-it-works" className="hidden sm:inline text-text-muted hover:text-primary transition-colors cursor-pointer">
              How It Works
            </a>
            <a href="#pricing" className="text-sm sm:text-base text-text-muted hover:text-primary transition-colors cursor-pointer">
              Pricing
            </a>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/login">
              <Button size="sm" variant="outline">Sign In</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">Get Started Free</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        {/* Background stars - deterministic positions to avoid hydration mismatch */}
        <div className="absolute inset-0 pointer-events-none">
          {[
            { x: 12, y: 8, d: 0, s: 14 }, { x: 85, y: 15, d: 0.3, s: 10 },
            { x: 45, y: 5, d: 0.6, s: 18 }, { x: 72, y: 22, d: 0.9, s: 12 },
            { x: 28, y: 30, d: 1.2, s: 16 }, { x: 92, y: 35, d: 1.5, s: 9 },
            { x: 8, y: 42, d: 1.8, s: 20 }, { x: 55, y: 48, d: 2.1, s: 11 },
            { x: 38, y: 55, d: 2.4, s: 15 }, { x: 78, y: 60, d: 2.7, s: 13 },
            { x: 18, y: 68, d: 0.2, s: 17 }, { x: 65, y: 72, d: 0.5, s: 10 },
            { x: 42, y: 78, d: 0.8, s: 19 }, { x: 88, y: 82, d: 1.1, s: 12 },
            { x: 5, y: 88, d: 1.4, s: 14 }, { x: 52, y: 92, d: 1.7, s: 16 },
            { x: 32, y: 18, d: 2.0, s: 11 }, { x: 95, y: 50, d: 2.3, s: 15 },
            { x: 22, y: 95, d: 2.6, s: 13 }, { x: 60, y: 38, d: 2.9, s: 18 },
          ].map((star, i) => (
            <div
              key={i}
              className="absolute twinkle"
              style={{
                left: `${star.x}%`,
                top: `${star.y}%`,
                animationDelay: `${star.d}s`,
              }}
            >
              <Star className="text-secondary/50" size={star.s} />
            </div>
          ))}
        </div>

        <div className="max-w-7xl mx-auto text-center relative">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
          >
            <motion.div variants={fadeUp} className="mb-6">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold">
                <Sparkles className="w-4 h-4" />
                AI-Powered Bedtime Stories
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="font-heading text-5xl sm:text-6xl lg:text-7xl font-bold text-text leading-tight mb-6"
            >
              Magical Stories for
              <br />
              <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
                Sweet Dreams
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="text-xl text-text-muted max-w-2xl mx-auto mb-10 leading-relaxed"
            >
              Personalized bedtime stories crafted by AI for your little one.
              Beautiful illustrations, soothing narration, and calming bedtime
              routines -- all in one magical app.
            </motion.p>

            <motion.div
              variants={fadeUp}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link href="/signup">
                <Button size="lg" className="w-full sm:w-auto">
                  <Wand2 className="w-5 h-5" />
                  Get Started Free
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </Link>
              <a href="#how-it-works">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  <BookOpen className="w-5 h-5" />
                  How It Works
                </Button>
              </a>
            </motion.div>

            {/* Trust badges */}
            <motion.div
              variants={fadeUp}
              className="mt-12 flex flex-wrap justify-center gap-6 text-sm text-text-muted"
            >
              <span className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-success" />
                COPPA Compliant
              </span>
              <span className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-accent" />
                No Ads Ever
              </span>
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                Made for Ages 1-8
              </span>
            </motion.div>
          </motion.div>

          {/* Demo Story Player */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="mt-16"
          >
            <DemoStoryPlayer />
          </motion.div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-16 px-4 border-y border-primary/10 bg-surface/50">
        <div className="max-w-7xl mx-auto">
          {/* Stats Bar */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16"
          >
            {[
              { value: "10,000+", label: "Stories Created", icon: BookOpen },
              { value: "2,500+", label: "Happy Families", icon: Users },
              { value: "4.9", label: "Average Rating", icon: Star },
              { value: "50,000+", label: "Chapters Read", icon: Download },
            ].map((stat, i) => (
              <motion.div key={i} variants={fadeUp} className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <stat.icon className="w-5 h-5 text-primary" />
                  <span className="font-heading text-3xl sm:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    {stat.value}
                  </span>
                </div>
                <span className="text-sm text-text-muted">{stat.label}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* Testimonials */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16"
          >
            {[
              {
                quote: "My daughter asks for PixieTales every night now. The stories with her name in them make her feel so special. Bedtime went from a battle to the best part of our day.",
                name: "Sarah M.",
                role: "Mom of 2",
                stars: 5,
              },
              {
                quote: "The drawing-to-story feature is genius. My son draws a dinosaur and gets a whole adventure about it. He's so proud seeing his art come to life in a real story.",
                name: "James K.",
                role: "Dad of 1",
                stars: 5,
              },
              {
                quote: "We use the bedtime mode every night -- the breathing exercise followed by a story and then sleep sounds. Our 3-year-old falls asleep in minutes now.",
                name: "Priya R.",
                role: "Mom of 3",
                stars: 5,
              },
            ].map((testimonial, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className="relative p-6 rounded-2xl bg-surface border border-primary/10"
              >
                <Quote className="w-8 h-8 text-primary/20 mb-3" />
                <p className="text-text-muted text-sm leading-relaxed mb-4">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
                <div className="flex items-center gap-1 mb-2">
                  {Array.from({ length: testimonial.stars }).map((_, j) => (
                    <Star key={j} className="w-3.5 h-3.5 text-secondary fill-secondary" />
                  ))}
                </div>
                <div>
                  <span className="text-sm font-semibold text-text">{testimonial.name}</span>
                  <span className="text-xs text-text-muted ml-2">{testimonial.role}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Trust / As Featured In */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-center"
          >
            <p className="text-xs text-text-muted/60 uppercase tracking-widest mb-6">
              Trusted by parents worldwide
            </p>
            <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 opacity-40">
              {["Product Hunt", "IndieHackers", "Parents Magazine", "TechCrunch"].map((name) => (
                <span
                  key={name}
                  className="font-heading text-lg sm:text-xl font-bold text-text-muted"
                >
                  {name}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-surface">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.h2
              variants={fadeUp}
              className="font-heading text-4xl font-bold text-text mb-4"
            >
              Everything for Bedtime
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className="text-lg text-text-muted max-w-2xl mx-auto"
            >
              From story creation to sleep sounds, PixieTales is the complete
              bedtime companion for your family.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={stagger}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {[
              {
                icon: Wand2,
                title: "AI Story Generator",
                description:
                  "Choose a theme or type your own idea. Our AI crafts a unique, age-appropriate story personalized with your child's name.",
                color: "text-primary",
                bg: "bg-primary/10",
              },
              {
                icon: Palette,
                title: "Beautiful Illustrations",
                description:
                  "Every chapter comes with a gorgeous watercolor-style illustration generated just for your story.",
                color: "text-accent",
                bg: "bg-accent/10",
              },
              {
                icon: Volume2,
                title: "Soothing Narration",
                description:
                  "Listen to stories read aloud with gentle storyteller voices. Perfect for wind-down time.",
                color: "text-secondary",
                bg: "bg-secondary/10",
              },
              {
                icon: ImagePlus,
                title: "Drawing to Story",
                description:
                  "Upload your child's drawing and watch it transform into a magical adventure story.",
                color: "text-success",
                bg: "bg-success/10",
              },
              {
                icon: CloudMoon,
                title: "Bedtime Mode",
                description:
                  "Calming routines with ambient music, breathing exercises, and sleep sounds. Screen dims to warm amber.",
                color: "text-primary-light",
                bg: "bg-primary-light/10",
              },
              {
                icon: Users,
                title: "Family Profiles",
                description:
                  "Create profiles for each child with their age, favorite themes, and companion character.",
                color: "text-accent-light",
                bg: "bg-accent/10",
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className="p-8 rounded-2xl bg-surface border border-primary/10 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 group cursor-pointer"
              >
                <div
                  className={`w-14 h-14 rounded-xl ${feature.bg} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}
                >
                  <feature.icon className={`w-7 h-7 ${feature.color}`} />
                </div>
                <h3 className="font-heading text-xl font-semibold text-text mb-3">
                  {feature.title}
                </h3>
                <p className="text-text-muted leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.h2
              variants={fadeUp}
              className="font-heading text-4xl font-bold text-text mb-4"
            >
              Three Simple Steps
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid grid-cols-1 md:grid-cols-3 gap-12"
          >
            {[
              {
                step: "1",
                title: "Pick a Theme",
                description:
                  "Choose from Adventure, Space, Animals, Magic, and more -- or describe your own story idea.",
                icon: Sparkles,
              },
              {
                step: "2",
                title: "AI Creates the Story",
                description:
                  "Our AI writes a personalized tale with your child's name, their favorite companion, and beautiful illustrations.",
                icon: Wand2,
              },
              {
                step: "3",
                title: "Sweet Dreams",
                description:
                  "Read along, listen to narration, or let bedtime mode guide your child gently to sleep.",
                icon: Moon,
              },
            ].map((item, i) => (
              <motion.div key={i} variants={fadeUp} className="text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent text-white flex items-center justify-center text-2xl font-heading font-bold mx-auto mb-5 shadow-lg shadow-primary/40">
                  {item.step}
                </div>
                <h3 className="font-heading text-xl font-semibold text-text mb-3">
                  {item.title}
                </h3>
                <p className="text-text-muted leading-relaxed">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 bg-surface">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.h2
              variants={fadeUp}
              className="font-heading text-4xl font-bold text-text mb-4"
            >
              Simple, Family-Friendly Pricing
            </motion.h2>
            <motion.p variants={fadeUp} className="text-lg text-text-muted">
              Start free. Upgrade when your family is ready.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {[
              {
                name: "Free",
                price: "$0",
                period: "forever",
                features: [
                  "3 stories per month",
                  "1 child profile",
                  "Core sleep sounds",
                  "Basic themes",
                ],
                cta: "Get Started",
                popular: false,
              },
              {
                name: "Family",
                price: "$7.99",
                period: "/month",
                features: [
                  "Unlimited stories",
                  "5 child profiles",
                  "All voice options",
                  "Bedtime routines",
                  "Drawing-to-story",
                  "All themes & companions",
                ],
                cta: "Start 7-Day Trial",
                popular: true,
              },
              {
                name: "Annual",
                price: "$59.99",
                period: "/year",
                features: [
                  "Everything in Family",
                  "Save 37%",
                  "Priority generation",
                  "Early access to new features",
                ],
                cta: "Best Value",
                popular: false,
              },
            ].map((plan, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className={`relative p-8 rounded-2xl border-2 transition-all ${
                  plan.popular
                    ? "border-primary bg-surface shadow-xl shadow-primary/20 scale-105"
                    : "border-primary/10 bg-surface hover:border-primary/30"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-primary to-accent text-white text-sm font-semibold rounded-full">
                    Most Popular
                  </div>
                )}
                <h3 className="font-heading text-2xl font-bold text-text mb-2">
                  {plan.name}
                </h3>
                <div className="mb-6">
                  <span className="font-heading text-4xl font-bold text-text">
                    {plan.price}
                  </span>
                  <span className="text-text-muted ml-1">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-center gap-3 text-text-muted">
                      <Star className="w-4 h-4 text-secondary flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link href="/signup">
                  <Button
                    variant={plan.popular ? "primary" : "outline"}
                    className="w-full"
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.h2
              variants={fadeUp}
              className="font-heading text-4xl font-bold text-text mb-6"
            >
              Ready for Bedtime Magic?
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className="text-lg text-text-muted mb-8"
            >
              Join thousands of families creating magical bedtime moments.
              Start your first story in under a minute.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <Button size="lg">
                  <Sparkles className="w-5 h-5" />
                  Get Started Free
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline">
                  Sign In
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-primary/10 bg-surface">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="font-heading text-lg font-bold text-primary">
              PixieTales
            </span>
          </div>
          <div className="flex items-center gap-6 text-sm text-text-muted">
            <Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
            <span>No ads. No data sold. COPPA compliant.</span>
          </div>
          <div className="text-sm text-text-muted">
            &copy; {new Date().getFullYear()} PixieTales. Made with love for
            bedtime.
          </div>
        </div>
      </footer>
    </div>
  )
}
