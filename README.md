# Better MCQ

A focused hackathon demo showing that multiple-choice correctness and demonstrated reading comprehension are not the same thing.

Students answer one question about *The Three Little Pigs* and defend their answer in writing. The result reports answer correctness separately from the comprehension shown in the explanation. Teachers see every student's analysis and a live class-wide skill summary at `/teacher`.

## Run locally

```bash
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:5173`. The Vite development server proxies `/api` requests to the Express server on port 3001.

The quiz works without an API key using a built-in story-specific evaluator. To use live model evaluation, add `PIONEER_API_KEY` to `.env`. The server calls Claude Haiku 4.5 through Pioneer's Anthropic-compatible endpoint and falls back to the built-in evaluator if the model call fails.

## Production

```bash
npm run build
npm start
```

The Express server serves the built frontend and API together on `PORT` (default `3001`).

## What the analysis measures

- Multiple-choice correctness
- Overall comprehension: strong, partial, or weak
- Use of story evidence
- Cause-and-effect reasoning
- Recognition of the central lesson
- Student-facing strengths and a concrete next step

The evaluator prompt is in `server/evaluate.ts`. It judges understanding independently from answer correctness and evaluates textual evidence rather than writing quality.
