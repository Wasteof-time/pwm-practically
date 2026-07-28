# PWM Playground — Product Requirements (in progress)

## Stack
- React 19, TypeScript, TailwindCSS, Framer Motion
- Recharts or D3 for graphs
- shadcn/ui, Lucide React icons
- 100% client-side: NO backend, NO database, NO authentication
- NO internet required after loading

## General Design
- Modern digital laboratory
- Inspired by: Oscilloscope, Logic Analyzer, Arduino IDE, VS Code Dark, Apple UI, Linear.app, Figma, NASA dashboards
- Dark theme
- Background: `#09090B`
- Cards: `#18181B`
- Accent: Electric Blue, Cyan, Purple
- Rounded corners, smooth shadows, glassmorphism

## Layout

### Top Navbar
- PWM Playground
- Navigation: Home, Learn, Simulator, Challenges, Settings
- Theme Toggle
- Install App

### Main Workspace
- Split layout
- LEFT 30%: Interactive Controls
- RIGHT 70%: Visualization
- Bottom: Live Formula Panel

## LEFT PANEL
- Create collapsible cards

### CARD 1 — PWM Controls

#### Duty Cycle
- Slider
- 0–100%
- step 1%
- Display: 65% (default)

#### Frequency
- Logarithmic slider
- 1 Hz → 100 kHz
- Display: 1200 Hz (default)

#### Supply Voltage
- Slider
- 0–24V
- Step: 0.1V
- Display: (TBD)

#### Resolution
- Dropdown
- Options: 4 bit, 6 bit, 8 bit, 10 bit, 12 bit, 16 bit
- Default: TBD

---
*Continue pasting PRD sections below or in chat.*
