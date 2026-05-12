# Alexandria - Complete Frontend Specification

**Version:** 3.0  
**Last Updated:** May 12, 2026  
**Status:** Implementation Guide for Full Feature Set

---

## Table of Contents
1. [Design System](#design-system)
2. [Color Palette & Typography](#color-palette--typography)
3. [Page Structure & Navigation](#page-structure--navigation)
4. [Component Library](#component-library)
5. [Features Breakdown](#features-breakdown)
6. [User Flows](#user-flows)
7. [API Integration Map](#api-integration-map)
8. [Performance & Optimization](#performance--optimization)
9. [Responsive Design](#responsive-design)
10. [Animation & Transitions](#animation--transitions)

---

## Design System

### Brand Identity: Alexandria
- **Tagline:** "Distill the noise. Discover the essence."
- **Core Mission:** Transform educational content consumption with intelligent AI summarization
- **Target Users:** Students, educators, knowledge workers, researchers
- **Tone:** Premium, intelligent, approachable, encouraging

### Design Philosophy
- **Minimalist with depth:** Clean interfaces with subtle visual hierarchy
- **Nature-inspired:** Botanical elements (Alexandria = ancient library + nature theme)
- **Accessibility-first:** WCAG AA compliance, high contrast ratios
- **Performance-optimized:** Fast interactions, lazy loading, smooth animations

---

## Color Palette & Typography

### Primary Color System

```
PRIMARY (Botanical Green):
- Primary: #061b0e (Deep Forest Green)
- Primary-50: #f0f9f6
- Primary-100: #d4f1e8
- Primary-200: #a8e3d0
- Primary-300: #7cd5b8
- Primary-400: #50c7a0
- Primary-500: #24b988 (Main Brand Green)
- Primary-600: #1a9d6f
- Primary-700: #128256
- Primary-800: #0a683d
- Primary-900: #031a0a

SECONDARY (Purple Accent):
- Secondary: #8b5cf6 (Vibrant Purple)
- Secondary-50: #faf5ff
- Secondary-100: #f3e8ff
- Secondary-200: #e9d5ff
- Secondary-300: #d946ef
- Secondary-400: #c084fc
- Secondary-500: #a855f7
- Secondary-600: #9333ea
- Secondary-700: #7e22ce
- Secondary-800: #6b21a8

TERTIARY (Teal Highlight):
- Tertiary: #0d9488 (Teal)
- Tertiary-50: #f0fdfa
- Tertiary-100: #ccfbf1
- Tertiary-200: #99f6e4
- Tertiary-300: #5eead4
- Tertiary-400: #2dd4bf
- Tertiary-500: #14b8a6
- Tertiary-600: #0d9488
- Tertiary-700: #0f766e

NEUTRAL (Text & Background):
- Surface: #fdf9f6 (Off-White)
- Surface-variant: #e8dfd7 (Light Taupe)
- On-surface: #1a1816 (Dark Text)
- On-surface-variant: #4a4642 (Secondary Text)
- Surface-dim: #ede9e4
- Outline: #7a7269
- Outline-variant: #bdb3a8

STATUS COLORS:
- Success: #22c55e (Green)
- Warning: #eab308 (Amber)
- Error: #ef4444 (Red)
- Info: #3b82f6 (Blue)
```

### Typography System

```
TYPEFACE STACK:
- Display: "Inter", "Segoe UI", system-ui (bold, 800-900)
- Body: "Inter", "Segoe UI", system-ui (400-600)
- Code: "Fira Code", "Courier New", monospace

SCALE (in rem):
- Display/H1: 4rem (64px) - Hero titles
- H2: 2.5rem (40px) - Section titles
- H3: 2rem (32px) - Subsection titles
- H4: 1.5rem (24px) - Card titles
- Body-L: 1.125rem (18px) - Large body text
- Body: 1rem (16px) - Primary body text
- Body-S: 0.95rem (15px) - Secondary body text
- Label: 0.875rem (14px) - Labels, hints
- Xs: 0.75rem (12px) - Captions, badges
- Xs-S: 0.6875rem (11px) - Fine print

LINE HEIGHTS:
- Display: 1.15 (tight)
- Heading: 1.25 (tight)
- Body: 1.6 (comfortable)
- Dense: 1.4 (compact)

LETTER SPACING:
- Display: -0.02em (tighter)
- Normal: 0em
- Wide: 0.04em
- Labels: 0.08em

FONT WEIGHTS:
- Regular: 400
- Medium: 500
- Semibold: 600
- Bold: 700
- Extra-Bold: 800
- Black: 900
```

### Spacing System (8px base)
```
xs: 0.25rem (2px)    → 2px
sm: 0.5rem (4px)     → 4px
base: 1rem (8px)     → 8px
lg: 1.5rem (12px)    → 12px
xl: 2rem (16px)      → 16px
2xl: 2.5rem (20px)   → 20px
3xl: 3rem (24px)     → 24px
4xl: 4rem (32px)     → 32px
5xl: 6rem (48px)     → 48px
6xl: 8rem (64px)     → 64px
```

### Shadow System
```
Shadow-xs: 0 1px 2px rgba(0,0,0,0.05)
Shadow-sm: 0 2px 4px rgba(0,0,0,0.08)
Shadow-md: 0 4px 12px rgba(0,0,0,0.12)
Shadow-lg: 0 8px 24px rgba(0,0,0,0.15)
Shadow-xl: 0 12px 32px rgba(0,0,0,0.18)
Shadow-2xl: 0 16px 48px rgba(0,0,0,0.2)
Glow-primary: 0 4px 12px rgba(36,185,136,0.2)
Glow-secondary: 0 4px 12px rgba(139,92,246,0.2)
```

### Border Radius
```
Rounded-sm: 0.375rem (6px)
Rounded-md: 0.5rem (8px)
Rounded-lg: 1rem (16px)
Rounded-xl: 1.5rem (24px)
Rounded-2xl: 2rem (32px)
Rounded-full: 9999px
```

---

## Page Structure & Navigation

### Site Navigation Hierarchy

```
MAIN ROUTES:
├── / (Landing/Home)
│   ├── Hero Section
│   ├── How It Works (3-step guide)
│   ├── Why Alexandria (Features showcase)
│   ├── Testimonials
│   ├── Pricing Plans
│   └── CTA Footer
│
├── /auth/login (Authentication)
│   ├── Email/Password Form
│   ├── Social Login (Optional)
│   ├── Remember Me
│   ├── Forgot Password Link
│   └── Sign Up Link
│
├── /auth/signup (Registration)
│   ├── Registration Form
│   ├── Email Verification
│   ├── Preferred Language Select
│   ├── Success Screen
│   └── Login Link
│
├── /auth/reset-password (Password Reset)
│   ├── Email Input
│   ├── Token Verification
│   ├── New Password Form
│   └── Success Screen
│
├── /dashboard (Authenticated Landing)
│   ├── Welcome Header (Hello, [Name])
│   ├── Quick Actions Bar
│   ├── Recently Accessed Videos
│   ├── Saved Videos Library
│   ├── Learning Stats/Analytics Preview
│   └── Recommended Content
│
├── /analyze (Main Analysis Interface)
│   ├── Top: URL Input / File Upload
│   ├── Left Sidebar: Navigation Tabs
│   │   ├── Chat
│   │   ├── Summaries
│   │   ├── Concepts
│   │   ├── Quiz
│   │   ├── Timeline
│   │   ├── Notes
│   │   └── Analytics
│   ├── Main Content: Dynamic Panel Based on Tab
│   ├── Right Sidebar: Video Player (sticky)
│   └── Bottom: Audio Controls
│
├── /analyze/:videoId (Specific Analysis)
│   └── [Same structure as /analyze]
│
├── /settings (User Settings)
│   ├── Profile
│   │   ├── Name / Email
│   │   ├── Profile Picture
│   │   └── Bio
│   ├── Preferences
│   │   ├── Language Selection
│   │   ├── Playback Speed Default
│   │   ├── Subtitle Preferences
│   │   └── Theme (Light/Dark)
│   ├── Privacy & Security
│   │   ├── Two-Factor Authentication
│   │   ├── Active Sessions
│   │   └── Devices
│   ├── Notifications
│   │   ├── Email Notifications
│   │   ├── In-App Notifications
│   │   └── Notification Frequency
│   └── Account
│       ├── Delete Account
│       └── Export Data
│
├── /library (Saved Videos)
│   ├── Filter/Search Bar
│   ├── Collections / Folders
│   ├── Grid/List View Toggle
│   ├── Video Cards with:
│   │   ├── Thumbnail
│   │   ├── Title
│   │   ├── Source Platform
│   │   ├── Last Viewed Date
│   │   ├── Tags
│   │   └── Action Menu
│   └── Sorting Options
│
├── /collections/:collectionId
│   ├── Collection Header
│   ├── Videos in Collection
│   └── Collection Settings
│
└── /admin (Admin Dashboard - Optional)
    ├── User Management
    ├── Analytics Dashboard
    ├── System Status
    └── Content Moderation
```

---

## Component Library

### 1. Navigation Components

#### Navbar (Top Navigation)
```jsx
Props:
- isAuthenticated: boolean
- user: { name, avatar, email }
- onLogout: () => void
- theme: 'light' | 'dark'

States:
- Unauthenticated: Logo | Links | [Login] [Sign Up]
- Authenticated: Logo | Links | [Help] [Notifications] [Profile Menu]

Design:
- Height: 80px
- Background: rgba(251, 249, 246, 0.8) with backdrop blur
- Sticky positioning (top: 0, z-index: 100)
- Responsive: Mobile hamburger menu at 768px
```

#### Sidebar Navigation
```jsx
Props:
- activeTab: string
- tabs: Array<{ id, label, icon }>
- onTabChange: (id) => void
- collapsed: boolean

Tabs in Analysis View:
1. Chat (MessageSquare icon)
2. Summaries (FileText icon)
3. Concepts (Lightbulb icon)
4. Quiz (HelpCircle icon)
5. Timeline (Clock icon)
6. Notes (BookOpen icon)
7. Analytics (BarChart3 icon)

Design:
- Width: 280px (expanded) / 80px (collapsed)
- Background: var(--surface)
- Smooth transitions
- Mobile: Bottom sheet or hamburger
```

#### Breadcrumb Navigation
```jsx
Props:
- items: Array<{ label, href }>
- currentPage: string

Usage:
- Home > Dashboard > Videos > [Current Video]
- Home > Settings > Preferences
```

### 2. Form Components

#### Input Field (Text)
```jsx
Props:
- label: string
- placeholder: string
- value: string
- onChange: (value) => void
- error: string | null
- type: 'text' | 'email' | 'password' | 'number'
- icon: React.Component
- disabled: boolean
- required: boolean

Styling:
- Padding: 0.75rem 1rem
- Border: 1px solid #bdb3a8
- Border-radius: 0.5rem
- Focus: Border color → #24b988, shadow: 0 0 0 3px rgba(36,185,136,0.1)
- Error state: Border → #ef4444, text → #ef4444
- Disabled: Background → #f5f5f5, opacity → 0.6
```

#### Select Dropdown (Language, etc.)
```jsx
Props:
- label: string
- options: Array<{ value, label, icon }>
- value: string
- onChange: (value) => void
- disabled: boolean
- searchable: boolean

Styling:
- Similar to text input
- Dropdown arrow indicator (chevron-down)
- Options styled with hover: background-color
```

#### Checkbox
```jsx
Props:
- label: string
- checked: boolean
- onChange: (checked) => void
- disabled: boolean

Styling:
- Size: 20x20px
- Border: 2px solid #bdb3a8
- Checked: Background → #24b988, checkmark icon
- Hover: Box-shadow
```

#### Toggle Switch
```jsx
Props:
- label: string
- checked: boolean
- onChange: (checked) => void
- disabled: boolean

Styling:
- Size: 48x28px
- Background: checked ? #24b988 : #e8dfd7
- Circle: 24x24px, smooth slide animation
```

#### Button Variants
```jsx
BUTTON STYLES:

1. Primary (CTA)
   - Background: #24b988
   - Text: white
   - Padding: 0.75rem 1.5rem
   - Border-radius: 9999px
   - Box-shadow: 0 4px 12px rgba(36,185,136,0.2)
   - Hover: Brightness 1.1, shadow increased
   - Active: Brightness 0.95
   - Disabled: Opacity 0.6, cursor: not-allowed

2. Secondary (Alternative)
   - Background: #f0f9f6
   - Text: #061b0e
   - Border: 1px solid #7cd5b8
   - Same padding/radius as primary
   - Hover: Background → #d4f1e8

3. Ghost (Tertiary)
   - Background: transparent
   - Text: #061b0e
   - Border: 1px solid #bdb3a8
   - Hover: Background → #f5f5f5

4. Danger (Delete/Logout)
   - Background: #ef4444
   - Text: white
   - Same styling as primary
   - Hover: Brightness 1.1

5. Loading State
   - Show spinner inside button
   - Disable interactions
   - Show "Processing..." text

Sizes:
- Small: 0.75rem padding, 0.875rem font
- Medium: 0.875rem padding, 1rem font (default)
- Large: 1rem padding, 1.125rem font
- Full Width: width: 100%
```

### 3. Panel Components (Analysis View)

#### Chat Panel
```jsx
Props:
- videoId: string
- sessionId: string
- onTimestampClick: (seconds) => void
- isProcessing: boolean

Features:
- Message history display (user left, AI right)
- Input field with send button
- Streaming response display
- Timestamp suggestions
- Copy message functionality
- Clear chat button
- Multi-turn conversation support

Styling:
- Chat bubbles with rounded corners
- User messages: Primary color background, white text
- AI messages: Surface background, bordered
- Timestamp pills: Secondary color, clickable
```

#### Summary Dashboard
```jsx
Props:
- videoId: string
- refreshKey: number

Sections:
1. Quick Summary (1-2 paragraphs)
2. Key Points (bulleted list, 5-8 items)
3. Topics Covered (tags/pills)
4. Estimated Reading Time

Export Options:
- Copy to Clipboard
- Download as PDF
- Export to Notion
- Export to Google Docs
- Share Link

Styling:
- Card-based layout
- Background: white with subtle shadow
- Border-left: 4px solid #24b988
- Padding: 2rem
```

#### Timeline Component
```jsx
Props:
- videoId: string
- timestamps: Array<{ time, title, chapter, importance }>
- onTimestampClick: (seconds) => void

Features:
- Vertical timeline display
- Time-based clickable segments
- Importance indicators (color-coded)
- Search/filter capability
- Expanded/collapsed view

Styling:
- Timeline line: 2px solid #d4f1e8
- Timeline dot: 12x12px, colored by importance
- Labels: Font size 0.95rem, color: #4a4642
- Hover: Background highlight, cursor pointer
```

#### Quiz Panel
```jsx
Props:
- videoId: string
- quizId: string
- onComplete: (score) => void

Sections:
1. Quiz Header (Progress: 3/5)
2. Question Display
3. Answer Options (radio buttons or checkboxes)
4. Answer Explanation (after submission)
5. Next Question Button
6. Results Summary (after completion)

Features:
- Timer (optional per question)
- Show/hide explanations
- Performance tracking
- Difficulty badges
- Retake option

Styling:
- Questions: Large, readable font (1.125rem)
- Options: Hover highlight, radio button indicator
- Correct answer: Green background
- Incorrect answer: Red background
- Explanation box: Bordered, background: #f0f9f6
```

#### Analytics Panel
```jsx
Props:
- videoId: string
- userId: string
- analyticsData: object

Displays:
1. Time Spent (total, per section)
2. Comprehension Score
3. Engagement Graph
4. Concept Mastery Heatmap
5. Learning Recommendations
6. Performance Trends (week/month)
7. Comparison with Peers (anonymized)

Charts:
- Line charts: using Chart.js or Recharts
- Heatmaps: custom grid-based
- Pie charts: concept distribution

Styling:
- Card-based layout
- Color-coded data series
- Responsive grid (1-3 columns)
- Legend below charts
```

#### Concepts Panel
```jsx
Props:
- videoId: string
- concepts: Array<{ name, importance, explanation }>

Features:
- Concept list with importance indicators
- Expandable explanations
- Related concepts links
- External resource links
- Save for later functionality

Styling:
- List-based layout
- Concept card: bordered, padding: 1.5rem
- Importance indicator: colored dot (red/yellow/green)
- Links: color: #24b988, underline on hover
```

#### Study Notes Panel
```jsx
Props:
- videoId: string
- notes: Array<{ id, title, content, timestamp, tags }>
- onSaveNote: (note) => void
- onDeleteNote: (id) => void

Features:
- Auto-generated notes from transcript
- User-editable notes
- Tagging system
- Search within notes
- Export notes
- Share notes
- Pin important notes
- Markdown support

Styling:
- Note card: bordered, padding: 1rem
- Pinned note: Gold star icon, border-left: 4px solid #eab308
- Edit mode: White background, black text input
- Read mode: Light gray background
```

#### Objectives Panel
```jsx
Props:
- videoId: string
- generatedObjectives: Array<string>
- userObjectives: Array<{ text, completed }>
- onObjectiveToggle: (id) => void
- onAddObjective: (text) => void

Features:
- AI-generated learning objectives
- User-defined custom objectives
- Completion checkboxes
- Suggestion system

Styling:
- Objective items: Checkbox + text
- Completed: Strikethrough, opacity: 0.6
- Suggestions: Italic, text-color: #4a4642
```

### 4. Media Components

#### Video Player
```jsx
Props:
- videoId: string
- autoPlay: boolean
- onTimeUpdate: (currentTime) => void
- onEnded: () => void

Features:
- Custom controls (play, pause, seek, volume)
- Playback speed selector (0.5x - 2x)
- Quality selector
- Fullscreen button
- Captions/Subtitles toggle
- Theater mode
- PiP support

Styling:
- Controls bar: Appears on hover, background: rgba(0,0,0,0.7)
- Timeline: Scrubber with progress indicator
- Buttons: White icons on dark background
- Time display: Font: 0.875rem, color: white
```

#### Audio Player
```jsx
Props:
- audioUrl: string
- onTimeUpdate: (time) => void

Features:
- Play/pause
- Volume control
- Playback speed
- Progress bar

Styling:
- Compact horizontal layout
- Controls: Icons 24x24px
- Progress bar: Full width with scrubber
```

### 5. Utility Components

#### Badge
```jsx
Props:
- label: string
- variant: 'success' | 'warning' | 'error' | 'info' | 'primary'
- size: 'sm' | 'md' | 'lg'
- icon: React.Component

Variants:
- Primary: Background #24b988, text: white
- Success: Background #22c55e, text: white
- Warning: Background #eab308, text: black
- Error: Background #ef4444, text: white
- Info: Background #3b82f6, text: white

Styling:
- Padding: 0.375rem 0.75rem (sm), 0.5rem 1rem (md), 0.625rem 1.25rem (lg)
- Border-radius: 0.375rem
- Font-size: 0.75rem
- Display: inline-flex
```

#### Modal Dialog
```jsx
Props:
- isOpen: boolean
- onClose: () => void
- title: string
- children: React.ReactNode
- footer: React.ReactNode
- size: 'sm' | 'md' | 'lg'

Styling:
- Overlay: Background rgba(0,0,0,0.5), z-index: 1000
- Modal: Background white, border-radius: 1rem
- Header: Padding 1.5rem, border-bottom: 1px solid #e8dfd7
- Body: Padding 1.5rem, max-height: 70vh, overflow-y: auto
- Footer: Padding 1rem 1.5rem, border-top: 1px solid #e8dfd7
- Close button: Top-right corner, background: transparent
```

#### Tooltip
```jsx
Props:
- content: string | React.ReactNode
- position: 'top' | 'bottom' | 'left' | 'right'
- children: React.ReactNode

Styling:
- Background: #1a1816
- Text: white
- Padding: 0.5rem 0.75rem
- Border-radius: 0.375rem
- Font-size: 0.875rem
- Arrow: Positioned pointing to trigger
- Animation: Fade-in 0.2s
```

#### Loading Skeleton
```jsx
Props:
- lines: number
- type: 'text' | 'card' | 'list'
- height: string

Styling:
- Background: #e8dfd7
- Border-radius: 0.375rem
- Animation: Pulse (opacity 0.6 -> 1.0, 1.5s infinite)
- Margin-bottom: 0.75rem per line
```

#### Notification Toast
```jsx
Props:
- message: string
- type: 'success' | 'error' | 'warning' | 'info'
- duration: number (ms)
- onClose: () => void

Position: Bottom-right
Styling:
- Background: Color-based (green/red/yellow/blue)
- Text: White
- Padding: 1rem
- Border-radius: 0.5rem
- Box-shadow: Shadow-lg
- Animation: Slide-in from right (0.3s)
- Auto-dismiss: After duration
```

#### Breadcrumb Separator
```
Design:
- Use "/" or ">" character
- Color: #4a4642
- Font-size: 0.95rem
- Spacing: 0.5rem left/right
```

#### Language Selector Dropdown
```jsx
Props:
- currentLanguage: string
- languages: Array<{ code, name, flag }>
- onChange: (code) => void

Languages Supported:
- English (en-US) 🇺🇸
- Spanish (es-ES) 🇪🇸
- French (fr-FR) 🇫🇷
- German (de-DE) 🇩🇪
- Mandarin (zh-CN) 🇨🇳
- Japanese (ja-JP) 🇯🇵
- Portuguese (pt-BR) 🇧🇷
- Hindi (hi-IN) 🇮🇳
- Arabic (ar-SA) 🇸🇦
- Russian (ru-RU) 🇷🇺

Styling:
- Dropdown menu
- Selected: Bold, checkmark indicator
- Hover: Background highlight
- Flag emoji before language name
```

---

## Features Breakdown

### Current Features (v3.0)

#### 1. Video Ingest & Analysis
- **YouTube Videos:** Paste URL → Auto-detect → Ingest transcript
- **File Upload:** MP4, MKV, MOV → Audio extraction → Transcription
- **Podcast URLs:** Spotify links → Feed parsing → Audio processing
- **Multi-Source Support:** Auto-detect source, use appropriate extraction method
- **Fallback Chain:** Transcript API → Subtitle parser → Audio transcription

**Frontend Components:**
- `IngestPanel.jsx` - URL/file input with progress indicator
- `VideoPlayer.jsx` - Embedded or external player

#### 2. AI Summaries & Smart Summaries
- **Quick Summary:** 1-2 paragraph overview
- **Topic-Based Summaries:** Grouped by main topics
- **Time-Based Summaries:** Every 5-min interval
- **Key Points:** Bulleted extraction (5-10 items)
- **Concepts Extraction:** Technical terms + definitions
- **Customizable Length:** Brief / Standard / Comprehensive

**Frontend Components:**
- `SummaryDashboard.jsx` - Display summaries
- `SummariesPanel.jsx` - Panel with multiple summary types

#### 3. Interactive Q&A
- **Context-Aware:** Questions answered from video content only
- **Timestamp Links:** Answers include video timestamps
- **Multi-Turn:** Conversation history
- **Answer Caching:** Same question = instant response
- **Streaming:** Real-time response display

**Frontend Components:**
- `ChatPanel.jsx` - Q&A interface

#### 4. Intelligent Quiz System
- **Auto-Generated:** Questions from video content
- **Difficulty Levels:** Easy / Medium / Hard
- **Multiple Choice & Short Answer:** Question type variety
- **Instant Feedback:** Explain correct answer
- **Performance Tracking:** Score, time taken, mastery
- **Spaced Repetition:** Suggest revisiting difficult concepts

**Frontend Components:**
- `QuizPanel.jsx` - Quiz interface

#### 5. Smart Timestamps
- **Auto-Generated:** AI identifies chapter boundaries
- **Semantic Segmentation:** Groups related content
- **Clickable Segments:** Jump to specific moments
- **Color-Coded:** By importance/topic
- **Time Display:** Formatted (mm:ss)

**Frontend Components:**
- `Timeline.jsx` - Timeline display

#### 6. Multi-Language Support
- **Auto-Detection:** Content language
- **Live Translation:** Summaries in any language
- **Interface Localization:** UI text translation
- **Subtitle Translation:** On-the-fly caption translation
- **Supported Languages:** 10+ languages

**Frontend Implementation:**
- Language selector in Settings
- Translation on demand
- Browser storage of preference

#### 7. User Authentication
- **Sign Up:** Email + password + optional name
- **Login:** Email + password
- **Session Management:** JWT tokens
- **Forgot Password:** Email reset link
- **Profile Management:** Name, email, preferences
- **Logout:** Clear session

**Frontend Components:**
- `LoginPage.jsx` - Login form
- `SignupPage.jsx` - Registration form
- Auth context for state management

#### 8. User Personalization & Analytics
- **Learning Profile:** Topics of interest, learning pace
- **Progress Tracking:** Videos watched, time spent, scores
- **Recommendations:** Suggested next videos
- **Performance Analytics:** Comprehension tracking
- **Achievement Badges:** Milestones and rewards
- **Learning Dashboard:** Personal dashboard with stats

**Frontend Components:**
- `AnalyticsPanel.jsx` - Analytics display
- `Dashboard.jsx` - User dashboard

#### 9. Study Materials & Export
- **Auto-Generated Notes:** From transcript
- **User Notes:** Create and edit
- **Tags & Organization:** Organize notes by topic
- **Export Options:**
  - PDF with formatting
  - Markdown
  - Notion integration
  - Google Docs sync
  - DOCX (Word)
- **Share Functionality:** Share notes/summaries

**Frontend Components:**
- `StudyNotesPanel.jsx` - Notes interface
- Export dialog/modal

#### 10. Saved Videos & Collections
- **Save for Later:** Bookmark videos
- **Collections:** Organize into folders
- **Library View:** Grid/list display
- **Search & Filter:** Find saved videos
- **Recently Viewed:** Quick access
- **Tags:** Categorize content

**Frontend Components:**
- `Library.jsx` - Video library view
- Saved videos grid/list

---

## User Flows

### Flow 1: First-Time User Journey
```
1. Land on Homepage (/home)
   ↓
2. Explore features & testimonials
   ↓
3. Click "Sign Up" → /auth/signup
   ↓
4. Enter email, password, name
   ↓
5. Select preferred language
   ↓
6. Email verification (or auto-verify in demo)
   ↓
7. Redirected to dashboard (/dashboard)
   ↓
8. See welcome message + quick tour
   ↓
9. Ready to paste first video URL
```

### Flow 2: Video Analysis
```
1. User on /analyze
   ↓
2. Paste YouTube URL or upload file
   ↓
3. System shows "Processing..." with progress
   ↓
4. Backend: Ingest → Transcription → Analysis
   ↓
5. Frontend receives analysis complete event
   ↓
6. Chat panel shows "Ready to ask questions"
   ↓
7. User selects tabs (Chat, Summary, Quiz, etc.)
   ↓
8. Content loads with lazy loading
   ↓
9. User interacts (ask question, take quiz, etc.)
```

### Flow 3: Saving & Organizing
```
1. User viewing video analysis (/analyze/:videoId)
   ↓
2. Clicks "Save Video" button
   ↓
3. Modal appears: Enter title, select/create collection
   ↓
4. Confirm save
   ↓
5. Toast: "Video saved successfully"
   ↓
6. Access from /library → Collections → [collection]
```

### Flow 4: Exporting
```
1. User viewing summary
   ↓
2. Clicks "Export" button
   ↓
3. Modal: Choose export type (PDF, Notion, Docs, etc.)
   ↓
4. For Notion/Docs: Authorize integration
   ↓
5. Select destination (page, folder, etc.)
   ↓
6. Export process starts
   ↓
7. Toast: "Export successful"
   ↓
8. For PDF: Auto-download
```

### Flow 5: Quiz Taking
```
1. User in Chat panel asking questions
   ↓
2. Suggestion: "Would you like to take a quiz?"
   ↓
3. User clicks "Start Quiz" button
   ↓
4. Redirects to /analyze/:videoId?tab=quiz
   ↓
5. Quiz header shows: "Question 1 of 5"
   ↓
6. Display question + 4 options
   ↓
7. User selects answer
   ↓
8. Submit button reveals correctness + explanation
   ↓
9. Next Question button
   ↓
10. After final question: Results screen with score
    ↓
11. Option to retake or return to summary
```

---

## API Integration Map

### Authentication Endpoints

```javascript
POST /auth/signup
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "full_name": "John Doe"
}
Response: {
  "access_token": "eyJhbGc...",
  "user_id": "uuid",
  "username": "john_doe",
  "email": "john@example.com",
  "preferred_language": "en-US"
}

POST /auth/login
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
Response: Same as signup

POST /auth/logout
Headers: Authorization: Bearer {token}
Response: { "message": "Logged out successfully" }

POST /auth/refresh-token
Headers: Authorization: Bearer {token}
Response: { "access_token": "new_token" }

POST /auth/forgot-password
{ "email": "john@example.com" }
Response: { "message": "Reset link sent" }

POST /auth/reset-password
{
  "token": "reset_token",
  "new_password": "NewPass123!"
}
Response: { "message": "Password reset successfully" }

GET /auth/me
Headers: Authorization: Bearer {token}
Response: {
  "user_id": "uuid",
  "username": "john_doe",
  "email": "john@example.com",
  "full_name": "John Doe",
  "preferred_language": "en-US",
  "created_at": "2026-05-12T10:00:00Z",
  "avatar_url": "https://..."
}

PUT /auth/preferences
Headers: Authorization: Bearer {token}
{
  "full_name": "John Doe Updated",
  "preferred_language": "es-ES",
  "theme": "dark"
}
Response: { "message": "Preferences updated" }
```

### Ingest Endpoints

```javascript
POST /ingest
{
  "video_url": "https://youtube.com/watch?v=...",
  "language": "auto"
}
Response: {
  "job_id": "uuid",
  "status": "processing",
  "video_id": "uuid",
  "progress": 10
}

GET /ingest-status/:jobId
Response: {
  "job_id": "uuid",
  "status": "completed" | "processing" | "failed",
  "progress": 100,
  "video_id": "uuid",
  "error": null
}

POST /ingest-file
FormData:
  - file: File object
  - title: string (optional)
  - language: string (optional)
Response: Same as POST /ingest

GET /timestamps/:videoId
Headers: Authorization: Bearer {token}
Response: {
  "video_id": "uuid",
  "timestamps": [
    { "time": 0, "title": "Introduction", "importance": "high" },
    { "time": 120, "title": "Main Topic", "importance": "medium" }
  ]
}
```

### Analysis Endpoints

```javascript
GET /analysis/:videoId
Headers: Authorization: Bearer {token}
Response: {
  "video_id": "uuid",
  "status": "ready",
  "summary": "...",
  "key_points": [...],
  "concepts": [...],
  "duration": 600
}

GET /summary/:videoId
Headers: Authorization: Bearer {token}
Response: {
  "quick_summary": "...",
  "detailed_summary": "...",
  "key_points": [...],
  "topics": [...]
}

GET /concepts/:videoId
Headers: Authorization: Bearer {token}
Response: {
  "concepts": [
    { "name": "AI", "explanation": "...", "importance": "high" },
    ...
  ]
}
```

### Chat/Q&A Endpoints

```javascript
POST /chat
Headers: Authorization: Bearer {token}
{
  "video_id": "uuid",
  "question": "What is the main topic?",
  "session_id": "uuid"
}
Response: {
  "answer": "The main topic is...",
  "sources": [...],
  "timestamps": [120, 240]
}

// Streaming endpoint
POST /chat/stream
Headers: Authorization: Bearer {token}
{
  "video_id": "uuid",
  "question": "What is the main topic?",
  "session_id": "uuid"
}
// Response: Server-Sent Events stream
```

### Quiz Endpoints

```javascript
POST /quiz/generate
Headers: Authorization: Bearer {token}
{
  "video_id": "uuid",
  "num_questions": 5,
  "difficulty": "medium"
}
Response: {
  "quiz_id": "uuid",
  "questions": [
    {
      "id": "uuid",
      "question": "What is...?",
      "options": [...],
      "type": "multiple-choice"
    }
  ]
}

POST /quiz/submit
Headers: Authorization: Bearer {token}
{
  "quiz_id": "uuid",
  "answers": [
    { "question_id": "uuid", "answer": "B" },
    ...
  ]
}
Response: {
  "score": 80,
  "results": [
    { "question_id": "uuid", "correct": true, "explanation": "..." }
  ]
}

GET /quiz/performance/:videoId
Headers: Authorization: Bearer {token}
Response: {
  "video_id": "uuid",
  "quizzes_taken": 3,
  "average_score": 82,
  "weak_concepts": ["Concept A", ...]
}
```

### User/Library Endpoints

```javascript
POST /library/save
Headers: Authorization: Bearer {token}
{
  "video_id": "uuid",
  "title": "My Video",
  "collection_id": "uuid" (optional)
}
Response: { "saved_video_id": "uuid" }

GET /library
Headers: Authorization: Bearer {token}
Response: {
  "videos": [
    {
      "saved_id": "uuid",
      "video_id": "uuid",
      "title": "My Video",
      "thumbnail_url": "...",
      "saved_at": "2026-05-12T10:00:00Z",
      "tags": [...]
    }
  ]
}

GET /analytics/dashboard
Headers: Authorization: Bearer {token}
Response: {
  "total_videos_watched": 42,
  "total_time_spent_minutes": 3600,
  "average_comprehension_score": 85,
  "topics_covered": ["AI", "ML", ...],
  "weekly_stats": [...],
  "recommendations": [...]
}
```

### Export Endpoints

```javascript
POST /export
Headers: Authorization: Bearer {token}
{
  "video_id": "uuid",
  "content_type": "summary" | "notes" | "quiz-results",
  "export_format": "pdf" | "markdown" | "notion" | "google-docs"
}
Response: {
  "export_id": "uuid",
  "download_url": "https://..." (for PDF/Markdown),
  "auth_required": false (for Notion/Google Docs)
}
```

### Translation Endpoints

```javascript
POST /translate
Headers: Authorization: Bearer {token}
{
  "video_id": "uuid",
  "target_language": "es-ES"
}
Response: {
  "summary_translated": "...",
  "concepts_translated": [...],
  "language": "es-ES"
}

GET /languages
Response: {
  "supported_languages": [
    { "code": "en-US", "name": "English" },
    { "code": "es-ES", "name": "Español" },
    ...
  ]
}
```

---

## Performance & Optimization

### Frontend Optimization Strategies

```
1. Code Splitting
   - Route-based: Lazy load pages with React.lazy()
   - Component-level: Lazy load heavy components (AnalyticsPanel, etc.)
   - Vendor splitting: Separate node_modules chunk

2. Caching Strategy
   - Browser cache: API responses cached for 5 minutes
   - IndexedDB: Store recent analyses for offline access
   - Service Worker: PWA caching for assets
   - API response deduplication: Don't refetch same data

3. Image Optimization
   - WebP format with JPEG fallback
   - Responsive images: srcset for different screen sizes
   - Lazy loading: Intersection Observer API
   - CDN delivery: Cloudflare or similar

4. Bundle Optimization
   - Tree shaking: Remove unused code
   - Minification: Production builds
   - Compression: Gzip for text, Brotli for larger files
   - Target size: < 200KB gzipped (main bundle)

5. Network Optimization
   - HTTP/2: Server push for critical assets
   - Connection reuse: Keep-alive headers
   - Request batching: Combine multiple API calls when possible
   - Prefetching: Preload likely next resources

6. Rendering Optimization
   - Virtual scrolling: For long lists
   - Memoization: React.memo for components
   - useCallback: Prevent unnecessary re-renders
   - useMemo: Cache expensive computations
   - Debouncing: For search/filter inputs (300ms)

7. Dynamic Content
   - Pagination: Load 20 items per page
   - Infinite scroll: For library view
   - Streaming responses: For long-running APIs
```

### Monitoring & Analytics

```javascript
// Sentry integration for error tracking
import * as Sentry from "@sentry/react";

// Performance monitoring
import { reportWebVitals } from 'web-vitals';

// Google Analytics 4
import { GoogleAnalytics } from '@react-ga/react-ga-next';

// User engagement tracking
- Page views
- Feature usage (quiz, export, etc.)
- Error rates
- API response times
- User session duration
```

---

## Responsive Design

### Breakpoints

```
xs: 320px   (Mobile small)
sm: 640px   (Mobile large)
md: 768px   (Tablet)
lg: 1024px  (Desktop small)
xl: 1280px  (Desktop)
2xl: 1536px (Desktop large)
```

### Layout Adaptations

```
MOBILE (xs-sm, < 640px):
- Single column layout
- Bottom navigation tabs (instead of left sidebar)
- Full-width video player
- Collapsible panels
- Hamburger menu for navbar
- Stack input fields vertically
- Font sizes reduced 10-15%

TABLET (md, 768px-1024px):
- Two-column layout (video + chat)
- Left sidebar + main content
- Video player: 50% width
- Smaller font sizes (0.9x)
- Adjusted padding/margins

DESKTOP (lg+, > 1024px):
- Three-column layout (sidebar + content + player)
- Optimal reading width: 65-70 chars/line
- Standard font sizes
- Full spacing/padding

MULTI-MONITOR (2xl+, > 1536px):
- Enhanced spacing
- Larger font sizes
- Wider panels
- Better use of whitespace
```

### Touch Optimization

```
- Button sizes: Minimum 44x44px (touch-friendly)
- Spacing between interactive elements: ≥ 8px
- Long-press context menus (750ms)
- Swipe gestures for panel navigation
- No hover states that block content
- Tap confirmation for destructive actions
```

---

## Animation & Transitions

### Standard Transitions

```css
/* Fast interactions (UI feedback) */
--transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1)

/* Standard interactions (most animations) */
--transition-base: 300ms cubic-bezier(0.4, 0, 0.2, 1)

/* Slow transitions (page transitions, heavy animations) */
--transition-slow: 500ms cubic-bezier(0.4, 0, 0.2, 1)

/* Easing functions */
--ease-in: cubic-bezier(0.4, 0, 1, 1)
--ease-out: cubic-bezier(0, 0, 0.2, 1)
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1)
```

### Keyframe Animations

```css
/* Fade in */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Slide in from left */
@keyframes slideInLeft {
  from { transform: translateX(-100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

/* Pulse (skeleton loader) */
@keyframes pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

/* Bounce (CTAs) */
@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

/* Rotate (loading spinner) */
@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```

### Component Animations

```
1. Page Transitions: Fade in (300ms) on mount
2. Modal Open/Close: Scale (0.95 → 1.0) + fade
3. Sidebar Collapse: Width transition (280px → 80px)
4. Panel Tabs: Underline slides to active tab (300ms)
5. Chat Messages: Fade in (150ms) with stagger (50ms per message)
6. Timestamp Click: Highlight pulse (200ms)
7. Quiz Option Hover: Background color transition (150ms)
8. Button Click: Background scale (1.0 → 0.98) then back (100ms)
9. Loading Toast: Slide in from right (300ms), auto-slide out (300ms)
10. Tooltip: Fade in on hover (200ms, 500ms delay)
```

---

## Upcoming Features (Roadmap)

### Phase 2 (Q3 2026)
- [ ] Live collaboration (multiple users on same analysis)
- [ ] Real-time transcription (live video support)
- [ ] Mobile apps (iOS/Android)
- [ ] Advanced analytics dashboard
- [ ] Custom branding for educational institutions
- [ ] LMS integrations (Canvas, Blackboard, Moodle)

### Phase 3 (Q4 2026)
- [ ] Video generation from summaries
- [ ] Voice cloning for summaries
- [ ] Augmented Reality (AR) learning overlays
- [ ] AI tutoring chatbot
- [ ] Peer collaboration features
- [ ] API access for third-party developers

---

## Summary

This specification provides a complete blueprint for Alexandria's frontend. It includes:

✅ **Design System:** Colors, typography, spacing, shadows, radius  
✅ **Component Library:** 30+ reusable components with specs  
✅ **Page Structure:** Complete site map and navigation  
✅ **User Flows:** 5 key user journeys mapped  
✅ **API Integration:** All endpoints documented  
✅ **Performance:** Optimization strategies  
✅ **Responsive Design:** Mobile-first approach  
✅ **Animations:** Transition guidelines  

**Implementation Priority:**
1. Auth system (Login/Signup)
2. API integration & user scoping
3. Language switching UI
4. Export functionality
5. Analytics dashboard
6. Export features
7. Settings page
8. Advanced features

---

**Next Steps:**
1. Create React context for authentication
2. Build Login/Signup components
3. Implement JWT token management
4. Update API client with auth headers
5. Create language selector component
6. Build export modal
7. Wire everything together
8. Test end-to-end flow

