# Stock Investment Analysis System - Development Plan (uv + Tavily)

I have updated the plan to strictly follow your **isolated development environment** requirements using **`uv`**, alongside the previous Tavily and Architecture decisions.

## 1. Environment & Architecture
*   **Backend Environment**: **Strictly Isolated** using `uv`.
    *   **Tool**: `uv` for venv creation, dependency resolution, and locking (`uv.lock`).
    *   **Framework**: FastAPI (Python).
*   **Frontend**: React (Vite + TypeScript) + Tailwind CSS.
*   **Data Source**: **Tavily API** (Default).
*   **Database**: SQLite (Dev).

## 2. Implementation Roadmap

### Phase 1: Isolated Environment & Project Initialization (Immediate Focus)
1.  **Directory Structure**: Create `backend` and `frontend` directories.
2.  **Backend Setup (Strict `uv` Protocol)**:
    *   **Initialize**: Create `pyproject.toml` in `backend/`.
    *   **Create Venv**: Run `uv venv` to create a local, isolated `.venv`.
    *   **Install Dependencies**: Use `uv add` to install `fastapi`, `uvicorn`, `sqlalchemy`, `httpx` (for Tavily), `python-dotenv`.
    *   **Lock**: Generate `uv.lock` to ensure reproducibility.
    *   **Verification**: Execute a verification script to confirm:
        *   Python interpreter path points to the local `.venv`.
        *   Package list matches `uv.lock`.
        *   No cross-contamination with global python.
3.  **Frontend Setup**:
    *   Initialize React + Vite + TypeScript.
4.  **Data Migration**:
    *   Migrate `prompts.js` to the backend database.

### Phase 2: Core Development
1.  **Tavily Service**: Implement `TavilyClient` with error handling and caching.
2.  **API Development**: Watchlist, Portfolio, and Prompt Analysis endpoints.
3.  **UI Implementation**: Port the "Prompt Workbench" and build the new Dashboard.

## 3. Execution Plan for This Turn
1.  Create `backend` directory.
2.  Initialize `uv` project and define dependencies.
3.  Create the virtual environment and install packages.
4.  **Run Verification**: I will output the environment details to prove isolation.
5.  Initialize Frontend.

Do you approve this plan with the strict `uv` environment setup?