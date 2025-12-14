
# Experiment Factory

A lightweight **Next.js** + **GraphQL** prototyping platform for managing and running experiments. This project demonstrates deterministic A/B assignment, event logging, and role-based access control in a modern React + TypeScript stack.

## Features

* **Next.js 13 App Router** – Fully server/client components with optimized routing
* **GraphQL API** – Queries and mutations for experiments, assignments, and events
* **Firebase Authentication** – User sign-in and role-based authorization (admin vs. non-admin)
* **Experiment Management** – Create, update, and track experiments with multiple variants
* **Deterministic Assignments** – Users are consistently assigned variants
* **Event Logging** – Track exposure, interaction, and conversion events
* **Tailwind CSS** – Utility-first styling for rapid UI development

## Getting Started

### Prerequisites

* Node.js >= 20
* npm or yarn
* Firebase project with Authentication enabled

### Install

```bash
npm install
# or
yarn install
```

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=project_id
NEXT_PUBLIC_FIREBASE_APP_ID=project_app_id
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=message_sender_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=storage_bucket

NEXT_PUBLIC_ADMIN_EMAIL_ALLOWLIST=you@example.com

FIREBASE_ADMIN_PROJECT_ID=project_id
FIREBASE_ADMIN_PRIVATE_KEY=private_key
FIREBASE_ADMIN_CLIENT_EMAIL=admin@example.com

ADMIN_EMAIL_ALLOWLIST=you@example.com,another@example.com
```

### Run

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app in your browser.

## Project Structure

```
/app         # Next.js pages and layouts
/lib         # Client-side utilities (GraphQL fetch, UI helpers)
/server      # GraphQL schema, resolvers, and Firebase integration
```

## Available Scripts

* `dev` – Runs the development server
* `build` – Builds the project for production
* `start` – Starts the production server

## Technologies Used

* Next.js 13
* React + TypeScript
* GraphQL (graphql-yoga)
* Firebase Authentication
* Tailwind CSS

## License

This project is open-source and free to use.

---
