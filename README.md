# DocFlowAI - Intelligent Document Processing Pipeline

> **Problem:** Taking notes from educational videos wastes time. Pausing to manually transcribe text from video cards disrupts learning flow and reduces productivity.

> **Solution:** Upload or paste screenshots → Get extracted text + AI summary → Copy and continue learning.

---

## Why This Exists

When learning from video tutorials, I constantly pause to transcribe text from slides and diagrams into my notes. A 1-hour tutorial becomes 2+ hours of stop-and-type cycles.

DocFlow eliminates this friction: screenshot → paste → extract → copy. The learning flow stays unbroken.

**This project demonstrates:**
- Backend system design for async document processing
- AI integration with constraint-aware decision making
- Real-time progress tracking via WebSockets
- Production-ready error handling and retry logic

---

## The System (60-Second Overview)

**Flow:**
```
User uploads document
    ↓
MinIO Storage
    ↓
FastAPI queues job
    ↓
Celery Worker processes:
    • OCR extraction (Tesseract)
    • Metadata extraction (dates, emails, amounts)
    • AI summarization (Ollama)
    ↓
PostgreSQL stores results
    ↓
WebSocket pushes real-time updates
    ↓
Frontend displays: Text + Summary + Metadata
```

**Input:** PDF, PNG, JPG, JPEG (single or batch)  
**Processing:** OCR → Metadata Extraction → AI Summary  
**Output:** Searchable text + copyable summary + structured metadata

---

## Key Design Decisions

### 1. Async Processing Over Synchronous
**Why:** OCR + AI processing takes 5-30 seconds per document. Blocking the API would timeout.

**Trade-off:** Added complexity (Celery + Redis) but gained horizontal scalability and better UX.

### 2. Ollama (Local LLM) Over OpenAI
**Why:** Budget constraint - this project is for personal/educational use.

**Trade-off:** Summaries are less polished than GPT-4, but free and runs locally.

**If constraints shifted:** In production with budget, I'd use OpenAI/Anthropic for higher quality summaries and add cost monitoring.

### 3. WebSocket for Real-Time Updates
**Why:** Users need to know processing status without polling.

**Trade-off:** Persistent connections use server resources, but provide superior UX compared to polling every 2 seconds.

### 4. MinIO Over AWS S3
**Why:** Local development + zero storage costs.

**Trade-off:** Not production-ready at scale. In production, I'd use S3 with lifecycle policies and CDN caching.

### 5. Single Database Over Microservices
**Why:** Shared state between API and workers simplifies development.

**Trade-off:** Harder to scale independently. In production, I'd consider event sourcing with separate read/write models.

---

## What Worked Well

✅ **Optimistic UI updates** - Documents disappear instantly when deleted (rollback on failure)  
✅ **Batch processing** - Upload 10+ documents, all process in parallel  
✅ **Full-text search** - PostgreSQL indexing makes search fast even with thousands of documents  
✅ **Responsive design** - Works on mobile, tablet, desktop without CSS frameworks  
✅ **Error recovery** - Celery retries failed jobs with exponential backoff  

---

## What I'd Improve

### If I Had More Time
1. **Document preview** - Show PDF/image inline instead of just extracted text
2. **Better AI prompting** - Fine-tune prompts for more structured summaries
3. **Export functionality** - Download processed documents as JSON/CSV
4. **OCR accuracy metrics** - Show confidence scores from Tesseract
5. **User quotas** - Rate limiting and usage tracking per user

### If This Were Production
1. **Containerization** - Docker + Kubernetes for easier deployment and scaling
2. **Observability** - Prometheus metrics, distributed tracing (Jaeger), centralized logging (ELK)
3. **CDN + Caching** - CloudFront for document delivery, Redis for API response caching
4. **Security hardening** - Rate limiting, API key rotation, encrypted document storage
5. **Database optimization** - Read replicas, connection pooling, query optimization
6. **CI/CD pipeline** - Automated testing, staged deployments, rollback mechanisms
7. **Cost monitoring** - AI API usage tracking, storage lifecycle policies
8. **Better AI** - Switch to Claude/GPT-4 with streaming responses and token limits

---

## What Broke (And What I Learned)

### Bug: Upload time showing NULL
**Cause:** `server_default=func.now()` doesn't work when SQLAlchemy doesn't specify the column.  
**Fix:** Changed to Python-side `default=lambda: datetime.now(timezone.utc)`  
**Lesson:** Server defaults vs. application defaults matter in ORMs.

### Bug: Infinite WebSocket reconnections
**Cause:** Frontend reconnected on every state change.  
**Fix:** Moved WebSocket connection to useEffect with empty dependency array.  
**Lesson:** React hooks require careful dependency management.

### Bug: Responsive overflow on mobile
**Cause:** Fixed widths and missing `overflow: hidden` on containers.  
**Fix:** Added responsive breakpoints and `minWidth: 0` for flex children.  
**Lesson:** CSS flex containers need explicit overflow handling.

---

## Technical Deep Dive

### Architecture Patterns Used
- **Task Queue Pattern** - Celery workers decouple API from long-running jobs
- **Pub/Sub Pattern** - Redis broadcasts processing status to WebSocket connections
- **Repository Pattern** - SQLAlchemy models abstract database operations
- **Optimistic UI** - Immediate UI updates with server reconciliation

### Performance Characteristics

| Operation | Time | Notes |
|-----------|------|-------|
| File Upload | < 200ms | Upload to MinIO |
| OCR Processing | 3-10 sec | Depends on image quality |
| AI Summary | 5-15 sec | Depends on text length |
| Full-text Search | < 50ms | PostgreSQL indexed |
| Concurrent Workers | Scalable | Tested with 4 workers |

### Security Considerations
- JWT authentication with token expiration
- Password hashing with bcrypt
- Input validation on file types and sizes
- SQL injection protection via SQLAlchemy ORM
- CORS configured for frontend domain only

**Production Gaps:**
- No rate limiting on API endpoints
- No virus scanning on uploaded files
- No encrypted document storage
- No audit logging for compliance

---

## Tech Stack Rationale

### FastAPI
- **Why:** Native async support + automatic OpenAPI documentation
- **Alternative:** Flask (lacks first-class async)

### PostgreSQL
- **Why:** ACID guarantees + built-in full-text search
- **Alternative:** MongoDB (no multi-document transactions)

### Celery
- **Why:** Mature task queue with retry logic and monitoring
- **Alternative:** RabbitMQ + custom workers (more complexity)

### Tesseract OCR
- **Why:** Free, battle-tested, supports 100+ languages
- **Alternative:** Google Vision API (costs money)

### Ollama
- **Why:** Free local LLM, no API costs
- **Alternative:** OpenAI (budget constraint)

### MinIO
- **Why:** S3-compatible, perfect for local development
- **Alternative:** AWS S3 (overkill for local dev)

### React
- **Why:** Component reusability, massive ecosystem
- **Alternative:** Vue.js (smaller ecosystem)

---

## Running Locally

### Prerequisites
- Python 3.12+
- PostgreSQL 14+
- Redis 7+
- Node.js 18+
- Tesseract OCR
- Ollama (optional, for AI summaries)

### Quick Start

**1. Backend Setup**
```bash
# Create virtual environment
python -m venv venv
source venv/Scripts/activate  # Windows: .\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Start API server
uvicorn services.api.main:app --reload
```

**2. Start Celery Worker**
```bash
# In a new terminal
source venv/Scripts/activate
celery -A services.worker.app worker --loglevel=info --pool=solo
```

**3. Frontend Setup**
```bash
# In a new terminal
cd frontend
npm install
npm start
```

**4. Access the Application**
- Frontend: http://localhost:3000
- API Docs: http://localhost:8000/docs
- MinIO Console: http://localhost:9001

**Full setup guide:** See `SETUP.md` for detailed installation instructions.

---

## What This Project Shows

This isn't just "a document processor."

It demonstrates:

✅ **System thinking** - Async architecture with distributed workers  
✅ **Constraint awareness** - Budget-driven AI choice, trade-offs documented  
✅ **Production mindset** - Error handling, retries, monitoring, security  
✅ **Real problem solving** - Built for actual workflow pain point  
✅ **Decision transparency** - Every choice has documented reasoning  

**Target roles:** Backend Engineer, Full-Stack Engineer, ML Engineer positions requiring API design, async processing, and AI integration.

---

## Project Status

**Current State:** Fully functional for personal use  
**Known Limitations:** AI summaries variable quality, no virus scanning, no rate limiting  
**Next Steps:** Containerization, production deployment hardening, AI model upgrade

---

## License

MIT License - Built as a learning project and portfolio piece.

---

**Questions?** This project mirrors real-world backend challenges: async processing, AI integration, real-time updates, and scaling considerations. Happy to discuss architecture decisions or trade-offs.