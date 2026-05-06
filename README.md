# AI-Powered Resume Analyzer and Job Recommendation App

A full-stack web app that analyzes resumes (PDF, DOCX, TXT), scores resume quality, highlights skill gaps, recommends roles/jobs, predicts shortlist chance, and tracks resume improvement over time.

## Features

- Resume upload and parsing for `.pdf`, `.docx`, and `.txt`
- NLP-style extraction of:
  - Skills
  - Projects
  - Experience highlights
  - Education
- Resume scoring (0-100) across:
  - Structure
  - Role relevance
  - Content quality
- Actionable improvement suggestions
- Skill Gap Analyzer against target role requirements
- Role and job listing recommendations
- Shortlisting chance prediction (heuristic)
- Candidate progress tracking across multiple resume versions
- Interactive dashboard with score trend chart and history table

## Tech Stack

- Backend: Node.js, Express, Multer, `pdf-parse`, `mammoth`
- Frontend: HTML, CSS, vanilla JavaScript
- Storage: local JSON file (`data/store.json`)

## Setup

```bash
npm install
npm run dev
```

Open `http://localhost:4000`.

## Usage

1. Upload a resume and choose target role.
2. Optionally reuse Candidate ID to track future versions.
3. Review extracted insights, score breakdown, skill gaps, and recommendations.
4. Upload updated resumes over time and monitor trend in the progress section.

## API Endpoints

- `GET /api/health` - server health
- `GET /api/job-profiles` - available target roles
- `POST /api/analyze` - upload and analyze resume
- `GET /api/candidates/:candidateId` - fetch saved history and latest analysis

## Notes

- Resume scoring and predictions are heuristic and intended for learning guidance.
- You can customize role requirements in `server.js` under `JOB_PROFILES`.
- Job listings are sample data stored in `JOB_LISTINGS`.
