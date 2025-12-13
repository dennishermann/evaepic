# EvaEpic

A full-stack web application with Next.js frontend and FastAPI backend.

## Project Structure

```
evaepic/
├── frontend/          # Next.js application
│   ├── app/          # App Router pages and components
│   ├── types/        # TypeScript type definitions
│   ├── public/       # Static assets
│   └── package.json  # Frontend dependencies
└── backend/          # FastAPI application
    ├── agents/       # LangChain agents
    │   ├── tools/    # Custom agent tools
    │   └── prompts/  # Prompt templates
    ├── models/       # Pydantic data models
    ├── main.py       # FastAPI app entry point
    ├── pyproject.toml # Python dependencies
    └── .venv/        # Python virtual environment
```

## Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **React 19** - UI library

### Backend
- **FastAPI** - Modern Python web framework
- **Python 3.12** - Programming language
- **UV** - Fast Python package manager
- **Uvicorn** - ASGI server
- **LangChain** - AI agent framework
- **LangGraph** - Agent workflow orchestration

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) and npm
- **Python** (v3.12 or higher)
- **UV** - Python package manager ([installation guide](https://github.com/astral-sh/uv))

### Installing UV

```bash
# macOS/Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# Windows
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"

# Or with pip
pip install uv
```

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd evaepic
```

### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Create environment file
cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:8000
EOF

# Start development server
npm run dev
```

The frontend will be available at [http://localhost:3000](http://localhost:3000)

### 3. Backend Setup

```bash
# Navigate to backend directory (from project root)
cd backend

# Create virtual environment (if not already created)
uv venv

# Activate virtual environment
# On macOS/Linux:
source .venv/bin/activate
# On Windows:
# .venv\Scripts\activate

# Install dependencies (already in pyproject.toml)
uv sync

# Create .env file from example template
cp .env.example .env

# Edit .env and add your API keys:
# - OPENAI_API_KEY (required for LangChain agents)
# - LANGCHAIN_API_KEY (optional, for LangSmith tracing)

# Start the server
uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The backend API will be available at [http://localhost:8000](http://localhost:8000)

## Running the Application

### Development Mode

You'll need two terminal windows:

**Terminal 1 - Backend:**
```bash
cd backend
source .venv/bin/activate  # Windows: .venv\Scripts\activate
uv run uvicorn main:app --reload
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Then visit [http://localhost:3000](http://localhost:3000) in your browser.

## API Endpoints

The backend provides the following endpoints:

- `GET /` - Root endpoint
- `GET /api/health` - Health check endpoint
- `GET /api/hello?name={name}` - Sample greeting endpoint

### Example API Usage

```bash
# Health check
curl http://localhost:8000/api/health

# Hello endpoint
curl http://localhost:8000/api/hello?name=YourName
```

## API Documentation

FastAPI automatically generates interactive API documentation:

- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

## Available Scripts

### Frontend

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Backend

- `uv run uvicorn main:app --reload` - Start development server
- `uv run python main.py` - Alternative way to start server
- `uv add <package>` - Add new dependency
- `uv sync` - Install all dependencies

## Project Features

### Frontend Features
- ✅ Modern UI with Tailwind CSS
- ✅ Client-side API integration
- ✅ Error handling and loading states
- ✅ Dark mode support
- ✅ Responsive design

### Backend Features
- ✅ CORS configuration for frontend
- ✅ Environment variable support
- ✅ Type validation with Pydantic
- ✅ Auto-generated API documentation
- ✅ Health check endpoint

## Environment Variables

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Backend (.env)
```env
# Add your backend environment variables here
# DATABASE_URL=postgresql://user:password@localhost/dbname
# SECRET_KEY=your-secret-key
```

## Troubleshooting

### Port Already in Use

If you get a "port already in use" error:

**Frontend:**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

**Backend:**
```bash
# Kill process on port 8000
lsof -ti:8000 | xargs kill -9
```

### CORS Issues

If you encounter CORS errors, ensure:
1. Backend is running on port 8000
2. Frontend is running on port 3000
3. `NEXT_PUBLIC_API_URL` in `.env.local` matches backend URL

### UV Command Not Found

Make sure UV is installed and in your PATH:
```bash
uv --version
```

If not installed, follow the [UV installation guide](https://github.com/astral-sh/uv).

## Development Tips

1. **Hot Reload**: Both frontend and backend support hot reload in development mode
2. **Type Safety**: Use TypeScript in frontend for better developer experience
3. **API Documentation**: Visit `/docs` on backend for interactive API testing
4. **Linting**: Run `npm run lint` in frontend to catch issues early

## Next Steps

- Add database integration (PostgreSQL, MongoDB, etc.)
- Implement authentication (JWT, OAuth)
- Add more API endpoints
- Create additional frontend pages
- Set up Docker for containerization
- Add testing (Jest, Pytest)
- Configure CI/CD pipeline

## License

This project is open source and available under the [MIT License](LICENSE).

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

