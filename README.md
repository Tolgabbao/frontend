# E-Commerce Frontend

A modern e-commerce frontend built with Next.js 14, TypeScript, and Tailwind CSS.

## Features

- 🛍️ Product browsing and filtering
- 🛒 Shopping cart management
- 👤 User authentication
- 🌓 Dark/Light mode support
- 🎨 Modern UI with shadcn/ui components
- 📱 Responsive design

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui Components
- Lucide Icons
- next-themes

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Create .env.local file
cp .env.example .env.local

# Update environment variables
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Development

```bash
# Run development server
npm run dev
```

Visit `http://localhost:3000`

### Building for Production

```bash
# Create production build
npm run build

# Start production server
npm start
```

## Project Structure

```
frontend/
├── app/                  # App router pages
├── components/          # Reusable components
│   ├── ui/             # shadcn/ui components
│   └── ...             # Custom components
├── api/                # API integration
├── lib/                # Utility functions
└── public/             # Static assets
```

## API Integration

The frontend communicates with a Django REST backend. Main API endpoints:

- `/auth/*` - Authentication endpoints
- `/api/products/*` - Product management
- `/api/carts/*` - Shopping cart operations
- `/api/orders/*` - Order management

## Component Library

We use shadcn/ui for UI components. Key components:

- Button
- Card
- Select
- Badge
- Avatar
- DropdownMenu

## Theme System

The app supports system, light, and dark themes using `next-themes`. Theme variables are defined in `globals.css`.

## Contributing

1. Follow the existing code style
2. Use TypeScript for type safety
3. Implement responsive designs
4. Add proper error handling
