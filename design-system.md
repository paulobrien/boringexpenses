# Boring Expenses Design System

## Brand Overview

Boring Expenses is positioned as a trustworthy yet innovative AI-powered expense management platform. Our design system reflects this through a professional color palette enhanced with vibrant accents, clean typography, and thoughtful micro-interactions.

**Brand Personality:** Professional, Innovative, Trustworthy, Approachable, Efficient

---

## Color System

### Primary Colors

- **Primary Blue:** `#1E40AF` (rgb(30, 64, 175))
  - Usage: Primary CTAs, navigation highlights, brand elements
  - Hover state: `#1E3A8A` (rgb(30, 58, 138))
  - Light variant: `#3B82F6` (rgb(59, 130, 246))

- **Primary Blue Light:** `#3B82F6` (rgb(59, 130, 246))
  - Usage: Secondary buttons, links, accent elements
  - Background variant: `#DBEAFE` (rgb(219, 234, 254))

### Secondary Colors

- **Amber/Gold:** `#F59E0B` (rgb(245, 158, 11))
  - Usage: Innovation highlights, success states, special callouts
  - Light variant: `#FEF3C7` (rgb(254, 243, 199))

### Semantic Colors

- **Success Green:** `#10B981` (rgb(16, 185, 129))
  - Light variant: `#D1FAE5` (rgb(209, 250, 229))

- **Warning Orange:** `#F97316` (rgb(249, 115, 22))
  - Light variant: `#FED7AA` (rgb(254, 215, 170))

- **Error Red:** `#EF4444` (rgb(239, 68, 68))
  - Light variant: `#FECACA` (rgb(254, 202, 202))

- **Info Blue:** `#3B82F6` (rgb(59, 130, 246))
  - Light variant: `#DBEAFE` (rgb(219, 234, 254))

### Neutral Colors

- **Gray 900:** `#111827` (rgb(17, 24, 39)) - Headings, primary text
- **Gray 800:** `#1F2937` (rgb(31, 41, 55)) - Secondary headings
- **Gray 700:** `#374151` (rgb(55, 65, 81)) - Body text
- **Gray 600:** `#4B5563` (rgb(75, 85, 99)) - Secondary text
- **Gray 500:** `#6B7280` (rgb(107, 114, 128)) - Placeholder text
- **Gray 400:** `#9CA3AF` (rgb(156, 163, 175)) - Disabled text
- **Gray 300:** `#D1D5DB` (rgb(209, 213, 219)) - Borders
- **Gray 200:** `#E5E7EB` (rgb(229, 231, 235)) - Light borders
- **Gray 100:** `#F3F4F6` (rgb(243, 244, 246)) - Background
- **Gray 50:** `#F9FAFB` (rgb(249, 250, 251)) - Light background

### Background Colors

- **Primary White:** `#FFFFFF` - Main content areas
- **Light Gray:** `#F9FAFB` - Section backgrounds
- **Blue Gradient:** `linear-gradient(135deg, #EBF4FF 0%, #FFFFFF 50%, #FEF3C7 100%)` - Hero sections

---

## Typography

### Font Family
- **Primary:** System font stack optimized for readability
- **Fallback:** `-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif`

### Font Weights
- **Regular:** 400 - Body text
- **Medium:** 500 - Emphasized text, labels
- **Semibold:** 600 - Subheadings, important UI elements
- **Bold:** 700 - Headlines, primary CTAs

### Typography Scale

#### Headings
- **H1:** 48px (3rem), Line height: 1.2, Font weight: 700
  - Mobile: 36px (2.25rem)
- **H2:** 36px (2.25rem), Line height: 1.2, Font weight: 700
  - Mobile: 30px (1.875rem)
- **H3:** 30px (1.875rem), Line height: 1.3, Font weight: 600
  - Mobile: 24px (1.5rem)
- **H4:** 24px (1.5rem), Line height: 1.3, Font weight: 600
- **H5:** 20px (1.25rem), Line height: 1.4, Font weight: 600
- **H6:** 18px (1.125rem), Line height: 1.4, Font weight: 600

#### Body Text
- **Large:** 20px (1.25rem), Line height: 1.6, Font weight: 400
- **Base:** 16px (1rem), Line height: 1.5, Font weight: 400
- **Small:** 14px (0.875rem), Line height: 1.4, Font weight: 400
- **Extra Small:** 12px (0.75rem), Line height: 1.3, Font weight: 400

### Line Heights
- **Headings:** 120% (1.2)
- **Body Text:** 150% (1.5)
- **UI Elements:** 140% (1.4)

---

## Spacing System

Based on 8px grid system for consistent visual rhythm.

### Spacing Scale
- **xs:** 4px (0.25rem)
- **sm:** 8px (0.5rem)
- **md:** 16px (1rem)
- **lg:** 24px (1.5rem)
- **xl:** 32px (2rem)
- **2xl:** 48px (3rem)
- **3xl:** 64px (4rem)
- **4xl:** 96px (6rem)

### Component Spacing
- **Button padding:** 12px horizontal, 8px vertical (small), 16px horizontal, 12px vertical (medium), 24px horizontal, 16px vertical (large)
- **Card padding:** 24px (small), 32px (medium), 48px (large)
- **Section padding:** 80px top/bottom, 16px horizontal (mobile), 96px top/bottom, 24px horizontal (desktop)

---

## Component Library

### Buttons

#### Primary Button
```css
background: #1E40AF;
color: white;
padding: 12px 24px;
border-radius: 8px;
font-weight: 600;
transition: all 200ms ease;

&:hover {
  background: #1E3A8A;
  transform: translateY(-1px);
}
```

#### Secondary Button
```css
background: white;
color: #374151;
border: 1px solid #D1D5DB;
padding: 12px 24px;
border-radius: 8px;
font-weight: 600;
transition: all 200ms ease;

&:hover {
  background: #F9FAFB;
  border-color: #3B82F6;
}
```

### Cards
```css
background: white;
border: 1px solid #E5E7EB;
border-radius: 16px;
padding: 24px;
box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
transition: all 300ms ease;

&:hover {
  border-color: #3B82F6;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}
```

### Form Elements
```css
/* Input Fields */
input, textarea, select {
  background: white;
  border: 1px solid #D1D5DB;
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 16px;
  transition: all 200ms ease;
}

input:focus, textarea:focus, select:focus {
  outline: none;
  border-color: #3B82F6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
```

---

## Layout & Grid

### Breakpoints
- **Mobile:** 0px - 767px
- **Tablet:** 768px - 1023px
- **Desktop:** 1024px+

### Container
- **Max width:** 1280px (7xl)
- **Padding:** 16px (mobile), 24px (tablet), 32px (desktop)

### Grid System
- **Mobile:** Single column
- **Tablet:** 2-3 columns
- **Desktop:** Up to 4 columns for feature grids, 2 columns for content sections

---

## Iconography

### Icon Library
- **Primary:** Lucide React icons
- **Style:** Stroke-based, 2px stroke width
- **Sizes:** 16px (small), 20px (medium), 24px (large), 32px (extra large)

### Common Icons
- **Navigation:** Menu, X, ArrowRight
- **Features:** Brain, Camera, CheckCircle, CreditCard, BarChart3, Users, Shield, Zap
- **Contact:** Mail, Phone, MapPin, Calendar
- **Social:** Twitter, Linkedin, Github

---

## Imagery Guidelines

### Photography Style
- **Professional business environments**
- **Clean, modern office spaces**
- **Diverse team representations**
- **Natural lighting preferred**
- **Source:** Pexels for stock photography

### Image Specifications
- **Hero images:** 1200x600px minimum
- **Team photos:** 400x400px (square)
- **Testimonial avatars:** 100x100px (circular crop)
- **Format:** WebP preferred, JPG fallback

---

## Animation & Interactions

### Transition Timing
- **Standard:** 200ms ease
- **Slow:** 300ms ease
- **Page transitions:** 500ms ease

### Hover Effects
- **Buttons:** Slight lift (translateY(-1px)) + color change
- **Cards:** Border color change + shadow enhancement
- **Links:** Color transition to primary blue

### Micro-interactions
- **Form focus:** Subtle border glow with box-shadow
- **Loading states:** Pulse animation
- **Success states:** Checkmark animation
- **Button clicks:** Brief scale animation (0.95)

---

## Accessibility Standards

### Color Contrast
- **AA Compliant:** Minimum 4.5:1 ratio for normal text
- **AAA Preferred:** 7:1 ratio where possible
- **Large text:** Minimum 3:1 ratio

### Focus States
- **Visible focus indicators** on all interactive elements
- **Keyboard navigation** support throughout
- **Screen reader** compatibility with semantic HTML

### Color Dependencies
- **Never rely solely on color** to convey information
- **Include text labels** or icons for status indicators
- **Provide alternative formats** for color-coded data

---

## Brand Voice & Tone

### Voice Characteristics
- **Professional yet approachable**
- **Confident without being arrogant**
- **Clear and concise**
- **Helpful and solution-focused**

### Tone Variations
- **Marketing copy:** Enthusiastic, benefit-focused
- **Product descriptions:** Clear, feature-focused
- **Error messages:** Helpful, non-blame oriented
- **Success messages:** Positive, encouraging

### Writing Guidelines
- **Use active voice** whenever possible
- **Keep sentences concise** (under 20 words when possible)
- **Avoid jargon** unless necessary for technical accuracy
- **Focus on user benefits** rather than just features
- **Use "you" to address users directly**

---

## Implementation Notes

### CSS Custom Properties
```css
:root {
  --color-primary: #1E40AF;
  --color-primary-light: #3B82F6;
  --color-accent: #F59E0B;
  --color-success: #10B981;
  --color-warning: #F97316;
  --color-error: #EF4444;
  
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  
  --border-radius: 8px;
  --border-radius-lg: 16px;
  --transition: all 200ms ease;
}
```

### Responsive Design Approach
- **Mobile-first** design philosophy
- **Progressive enhancement** for larger screens
- **Flexible grid systems** using CSS Grid and Flexbox
- **Scalable typography** using rem units

---

This design system serves as the foundation for all Boring Expenses digital properties, ensuring consistency, accessibility, and scalability across all touchpoints.