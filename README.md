DocFlowAI - Intelligent Document Processing Pipeline

Problem: Taking notes from educational videos wastes time. Pausing to manually transcribe text from video cards disrupts learning flow and reduces productivity.


Solution: Upload or paste screenshots → Get extracted text + AI summary → Copy and continue learning.


Why This Exists
When learning from video tutorials, I constantly pause to transcribe text from slides and diagrams into my notes. A 1-hour tutorial becomes 2+ hours of stop-and-type cycles.
DocFlow eliminates this friction: screenshot → paste → extract → copy. The learning flow stays unbroken.
This project demonstrates:

Backend system design for async document processing
AI integration with constraint-aware decision making
Real-time progress tracking via WebSockets
Production-ready error handling and retry logic


The System (60-Second Overview)
User uploads document → MinIO Storage
                     ↓
                FastAPI queues job → Celery Worker
                                          ↓
                                    OCR (Tesseract)
                                          ↓
                                    Metadata Extraction
                                          ↓
                                    AI Summary (Ollama)
                                          ↓
                    WebSocket ← Progress Updates → PostgreSQL
                         ↓
                    Frontend displays: Text + Summary + Metadata
Input: PDF, PNG, JPG, JPEG (single or batch)
Processing: OCR → Extract dates/emails/amounts → Generate summary
Output: Searchable text + copyable summary + structured metadata

Key Design Decisions and Trade-offs
1. Async Processing Over Synchronous
Why: OCR + AI processing takes 5-30 seconds per document. Blocking the API would timeout.
Trade-off: Added complexity (Celery + Redis) but gained horizontal scalability and better UX.
2. Ollama (Local LLM) Over OpenAI
Why: Budget constraint - this project is for personal/educational use.
Trade-off: Summaries are less polished than GPT-4, but free and runs locally.
If constraints shifted: In production with budget, I'd use OpenAI/Anthropic for higher quality summaries and add cost monitoring.
3. WebSocket for Real-Time Updates
Why: Users need to know processing status without polling.
Trade-off: Persistent connections use server resources, but provide superior UX compared to polling every 2 seconds.
4. MinIO Over AWS S3
Why: Local development + zero storage costs.
Trade-off: Not production-ready at scale. In production, I'd use S3 with lifecycle policies and CDN caching.
5. Single Database Over Microservices
Why: Shared state between API and workers simplifies development.
Trade-off: Harder to scale independently. In production, I'd consider event sourcing with separate read/write models.

What Worked Well
✅ Optimistic UI updates - Documents disappear instantly when deleted (rollback on failure)
✅ Batch processing - Upload 10+ documents, all process in parallel
✅ Full-text search - PostgreSQL indexing makes search fast even with thousands of documents
✅ Responsive design - Works on mobile, tablet, desktop without CSS frameworks
✅ Error recovery - Celery retries failed jobs with exponential backoff

What I'd Improve
If I Had More Time:

Document preview - Show PDF/image inline instead of just extracted text
Better AI prompting - Fine-tune prompts for more structured summaries
Export functionality - Download processed documents as JSON/CSV
OCR accuracy metrics - Show confidence scores from Tesseract
User quotas - Rate limiting and usage tracking per user

If This Were Production:

Containerization - Docker + Kubernetes for easier deployment and scaling
Observability - Prometheus metrics, distributed tracing (Jaeger), centralized logging (ELK)
CDN + Caching - CloudFront for document delivery, Redis for API response caching
Security hardening - Rate limiting, API key rotation, encrypted document storage
Database optimization - Read replicas, connection pooling, query optimization
CI/CD pipeline - Automated testing, staged deployments, rollback mechanisms
Cost monitoring - AI API usage tracking, storage lifecycle policies
Better AI - Switch to Claude/GPT-4 with streaming responses and token limits


What Broke (And What I Learned)
Bug: Upload time showing NULL
Cause: server_default=func.now() doesn't work when SQLAlchemy doesn't specify the column.
Fix: Changed to Python-side default=lambda: datetime.now(timezone.utc)
Lesson: Server defaults vs. application defaults matter in ORMs.
Bug: Infinite WebSocket reconnections
Cause: Frontend reconnected on every state change.
Fix: Moved WebSocket connection to useEffect with empty dependency array.
Lesson: React hooks require careful dependency management.
Bug: Responsive overflow on mobile
Cause: Fixed widths and missing overflow: hidden on containers.
Fix: Added responsive breakpoints and minWidth: 0 for flex children.
Lesson: CSS flex containers need explicit overflow handling.

Technical Deep Dive
Architecture Patterns Used:

Task Queue Pattern - Celery workers decouple API from long-running jobs
Pub/Sub Pattern - Redis broadcasts processing status to WebSocket connections
Repository Pattern - SQLAlchemy models abstract database operations
Optimistic UI - Immediate UI updates with server reconciliation

Performance Characteristics:

Upload: < 200ms (file → MinIO)
OCR Processing: 3-10 seconds (depends on image quality)
AI Summary: 5-15 seconds (depends on text length)
Search: < 50ms (PostgreSQL full-text index)
Concurrent Workers: Scales horizontally (tested with 4 workers)

Security Considerations:

JWT authentication with token expiration
Password hashing with bcrypt
Input validation on file types and sizes
SQL injection protection via SQLAlchemy ORM
CORS configured for frontend domain only

Production Gaps:

No rate limiting on API endpoints
No virus scanning on uploaded files
No encrypted document storage
No audit logging for compliance


Tech Stack Rationale
TechnologyWhyAlternative ConsideredFastAPIAsync support + automatic OpenAPI docsFlask (lacks async)PostgreSQLACID guarantees + full-text searchMongoDB (no transactions)CeleryMature task queue with retry logicRabbitMQ + custom workersTesseractFree, battle-tested OCRGoogle Vision API (costs money)OllamaFree local LLMOpenAI (budget constraint)MinIOS3-compatible for local devAWS S3 (overkill for local)ReactComponent reusabilityVue (less ecosystem)

Running Locally
Prerequisites:

Python 3.12+
PostgreSQL 14+
Redis 7+
Node.js 18+
Tesseract OCR
Ollama (optional, for AI summaries)

Quick Start:
bash# Backend
python -m venv venv
source venv/Scripts/activate  # Windows Git Bash
pip install -r requirements.txt
alembic upgrade head
uvicorn services.api.main:app --reload

# Celery Worker
celery -A services.worker.app worker --loglevel=info --pool=solo

# Frontend
cd frontend
npm install
npm start
Full setup guide: See SETUP.md for detailed Windows/Linux instructions.

What This Project Shows
This isn't just "a document processor."
It demonstrates:
✅ System thinking - Async architecture with distributed workers
✅ Constraint awareness - Budget-driven AI choice, trade-offs documented
✅ Production mindset - Error handling, retries, monitoring, security
✅ Real problem solving - Built for actual workflow pain point
✅ Decision transparency - Every choice has documented reasoning
Target roles: Backend Engineer, Full-Stack Engineer, ML Engineer positions requiring API design, async processing, and AI integration.

Project Status
Current State: Fully functional for personal use
Known Limitations: AI summaries variable quality, no virus scanning, no rate limiting
Next Steps: Containerization, production deployment hardening, AI model upgrade

License
MIT License - Built as a learning project and portfolio piece.

This project mirrors real-world backend challenges: async processing, AI integration, real-time updates, and scaling considerations. Happy to discuss architecture decisions or trade-offs.