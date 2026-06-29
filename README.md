# AEGIS

AEGIS is a QA test-case governance tool that reviews exported test cases against business rules and canonical workflow building blocks.
It uses a two-phase LLM pipeline to flag stale, inconsistent, or structurally invalid test cases for human review.

## What It Does

- Imports BA rule datasets.
- Imports Building Block documents.
- Imports ticket/test-case datasets.
- Stores raw uploaded test-case data separately from derived normalized data.
- Supports reusable Project Context entries for domain-specific evaluation guidance.
- Prepares a two-phase Dify workflow:
  - Phase 1 routes each test case to the most relevant Building Block.
  - Phase 2 evaluates frame conformance and requirement currency.

AEGIS is designed to assist QA review. It does not auto-fix test cases or update Jira tickets.

## Tech Stack

- Frontend: React, TypeScript, Vite
- Backend: Node.js, Express, TypeScript
- Database: MongoDB
- Pipeline: Python
- LLM workflow: Dify
- Containerization: Docker Compose

## Project Structure

```text
.
├── docker-compose.yml
├── aegis
│   ├── BackEnd
│   │   ├── controllers
│   │   ├── database
│   │   ├── models
│   │   ├── pipeline
│   │   ├── routes
│   │   └── services
│   └── FrontEnd
│       ├── src/components
│       ├── src/containers
│       └── src/api
└── testdata
```

## Core Data Collections

- `BALists`: imported BA rule tables.
- `BuildingBlocks`: uploaded Building Block documents.
- `TicketSets`: parent upload records for ticket/test-case datasets.
- `RawTestCases`: exact uploaded raw ticket tables.
- `DerivedTestCases`: normalized ticket tables derived from raw uploads.
- `PipelineRuns`: records of pipeline execution inputs and status.
- `ProjectContexts`: reusable project/domain context for LLM evaluation.

## Local Development

Install dependencies:

```bash
cd aegis
npm run install:all
```

Run frontend and backend locally:

```bash
cd aegis
npm run all
```

Default local services:

```text
Frontend: http://localhost:5173
Backend:  http://localhost:3000
MongoDB:  mongodb://localhost:27017/AEGIS
```

## Docker

Run the full stack:

```bash
docker compose up -d --build
```

Useful checks:

```bash
docker ps
curl http://localhost:3000/health
```

## Environment Variables

Backend `.env` values can be placed at the repo root or inside `aegis/BackEnd`.

```env
MONGO_URI=mongodb://localhost:27017/AEGIS

JIRA_BASE_URL=
JIRA_EMAIL=
JIRA_API_TOKEN=

DIFY_BASE_URL=https://api.dify.ai/v1
DIFY_ROUTING_API_KEY=
DIFY_EVALUATION_API_KEY=
```

The Dify routing/evaluation keys are intended for the two separate Dify Workflow apps.

## Dify Workflow Design

AEGIS uses two Dify workflow apps:

```text
AEGIS Phase 1 - Building Block Routing
AEGIS Phase 2 - Frame Currency Evaluation
```

Phase 1 receives:

```text
system_prompt
routing_prompt
pipeline_run_id
ticket_json
bb_candidates_json
project_context_text
user_prompt_text
```

Phase 2 receives:

```text
system_prompt
evaluation_prompt
pipeline_run_id
ticket_json
ba_context_json
building_block_json
project_context_text
user_prompt_text
```

Both workflows should return the LLM structured output through an Output node named `result`.

## Tests

Run Python pipeline tests:

```bash
cd aegis/BackEnd
python3 -m unittest discover -s pipeline/tests
```

Run frontend build check:

```bash
npm run build --prefix aegis/FrontEnd
```

Run backend TypeScript check:

```bash
cd aegis/BackEnd
npx --no-install tsc --noEmit
```

## Current Status

Implemented:

- BA rule upload/listing.
- Building Block upload/listing and DOCX preview.
- Ticket upload with raw and derived test-case storage.
- Project Context page and backend CRUD.
- Pipeline loaders and normalizers.
- Generic prompt builders for Dify Phase 1 and Phase 2.
- Dify client foundation.

In progress:

- Final orchestration from `run_pipeline.py`.
- Calling Dify Phase 1 and Phase 2 in sequence.
- Persisting final pipeline results.
- Wiring Project Context snapshots into PipelineRuns.

## Notes

Do not commit secrets, Dify API keys, Jira API tokens, local `.env` files, generated caches, or private test datasets.
