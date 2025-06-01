# Same Worksheets

An AI-powered educational worksheet generator for teachers and educators. This application allows users to create customized worksheets for different grade levels, subjects, and difficulty levels.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Features

- **AI-Powered Worksheet Generation**: Uses Google AI Studio to create educational worksheets tailored to specific grade levels, subjects, and topics
- **Customizable Difficulty Levels**: Adjust the complexity of worksheets to match student abilities
- **Multiple Question Types**: Supports multiple-choice, fill-in-the-blank, short answer, and essay questions
- **PDF Export**: Generate professional-looking PDFs for printing or digital distribution
- **Answer Keys**: Automatically create answer keys for easy grading
- **User Dashboard**: Track created worksheets and student progress

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- Google AI Studio API key (for AI-powered worksheet generation)

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
# or
yarn
# or
pnpm install
# or
bun install
```

3. Set up environment variables:
   - Create a `.env.local` file in the root directory
   - Add your Google AI Studio API key: `GOOGLE_AI_STUDIO_API_KEY=your_api_key_here`

4. Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## AI Worksheet Generation

This application uses Google AI Studio (Gemini) to generate educational worksheets. The AI integration:

1. Takes input parameters like grade level, subject type, topics, and difficulty
2. Generates appropriate questions based on educational standards
3. Creates answer keys with explanations
4. Formats everything into a professional worksheet

### Customizing AI Generation

You can modify the AI prompts and generation parameters in `src/lib/ai-generator.ts` to adjust:

- Question types and distribution
- Prompt engineering for different subjects
- Response formatting
- Temperature and other generation parameters

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

To learn more about Google AI Studio:

- [Google AI Studio Documentation](https://ai.google.dev/docs) - learn about Google's AI models and APIs.
- [Gemini API Reference](https://ai.google.dev/api/rest/v1beta/models/generateContent) - details on the generateContent API used in this project.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
