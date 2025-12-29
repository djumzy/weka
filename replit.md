# VSLA Management System

## Overview

This is a comprehensive Village Savings and Loan Association (VSLA) management system built as a full-stack web application. The system enables administrators to manage multiple VSLA groups, track member savings and loans, process financial transactions, and organize community meetings. It provides a complete digital solution for traditional community banking operations with features for member management, financial tracking, loan processing, and reporting.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript for type safety and modern development practices
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management and caching
- **UI Framework**: Shadcn/ui components with Radix UI primitives for consistent, accessible interface components
- **Styling**: Tailwind CSS with CSS variables for theming and responsive design
- **Build Tool**: Vite for fast development and optimized production builds
- **Layout Pattern**: Dashboard layout with sidebar navigation and main content area

### Backend Architecture
- **Runtime**: Node.js with TypeScript and ES modules
- **Framework**: Express.js for RESTful API endpoints
- **Database ORM**: Drizzle ORM for type-safe database operations and schema management
- **Authentication**: Replit Auth integration with OpenID Connect for user authentication
- **Session Management**: Express sessions with PostgreSQL session storage
- **API Design**: RESTful endpoints organized by resource types (groups, members, transactions, loans, meetings)

### Database Design
- **Database**: PostgreSQL with connection pooling via Neon serverless
- **Schema Management**: Drizzle migrations for version-controlled database changes
- **Core Entities**:
  - Users: Authentication and profile information
  - Groups: VSLA group management with meeting frequency and member limits
  - Members: Individual participants within groups with savings balances
  - Transactions: Financial activities (deposits, withdrawals, loan payments)
  - Loans: Loan applications and repayment tracking
  - Meetings: Scheduled group meetings with attendance tracking
- **Relationships**: Hierarchical structure with groups containing members, and transactions/loans linked to both groups and members

### Authentication & Authorization
- **Provider**: Replit Auth with OpenID Connect flow
- **Session Storage**: PostgreSQL-backed sessions with automatic expiration
- **Security**: HTTP-only cookies, HTTPS enforcement, and session-based authentication
- **User Flow**: Landing page for unauthenticated users, automatic redirect to dashboard after authentication

### Data Management Patterns
- **Validation**: Zod schemas shared between client and server for consistent data validation
- **Error Handling**: Centralized error handling with proper HTTP status codes and user-friendly messages
- **Caching**: Client-side caching via React Query with optimistic updates
- **Real-time Updates**: Query invalidation for immediate UI updates after mutations

## External Dependencies

### Core Infrastructure
- **Database**: Neon PostgreSQL serverless database with connection pooling
- **Authentication**: Replit Auth service for user authentication and session management
- **Build & Development**: Vite with React plugin and TypeScript support

### UI & Styling
- **Component Library**: Radix UI primitives for accessible, unstyled components
- **Design System**: Shadcn/ui for pre-built component implementations
- **Styling**: Tailwind CSS with PostCSS for utility-first styling
- **Icons**: Lucide React for consistent iconography
- **Fonts**: Google Fonts integration (Inter, DM Sans, Fira Code, Geist Mono)

### Development Tools
- **Type Checking**: TypeScript with strict configuration
- **Form Handling**: React Hook Form with Zod validation resolvers
- **Date Handling**: date-fns for date formatting and manipulation
- **Utilities**: clsx and tailwind-merge for conditional CSS classes
- **Development**: ESBuild for server bundling, TSX for development server

### Runtime Dependencies
- **Session Storage**: connect-pg-simple for PostgreSQL session storage
- **WebSocket**: WebSocket polyfill for Neon database connections
- **Memory Management**: Memoizee for caching expensive operations
- **ID Generation**: Nanoid for unique identifier generation