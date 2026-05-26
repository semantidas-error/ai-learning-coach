# AI Learning Coach

An intelligent educational platform that analyzes learner answers, provides personalized feedback, and generates customized learning roadmaps using a three-stage LLM pipeline.

## Features

- **Answer Analysis**: Uses Mistral-7B to evaluate learner responses and assign scores (0-100) and proficiency levels
- **Adaptive Guidance**: Routes learners to beginner-friendly explanations or advanced challenges based on performance
- **Personalized Roadmaps**: Generates 4-week learning plans tailored to skill level and assessment score
- **Security-First**: Validates inputs to prevent prompt injection attacks and rejects sensitive personal information
- **Robust Error Handling**: Gracefully handles model failures and malformed outputs

## Project Structure

```
ai-learning-coach/
├── app.py                 # Flask backend with LLM pipeline
├── package.json           # Frontend dependencies
├── src/                   # React frontend code
└── README.md             # This file
```

## Backend: Flask LLM Pipeline

### Architecture

The backend runs a three-call LLM pipeline:

**Call 1 (Mistral)** → Analyze learner answers → Score + Level
- Extracts strengths and weaknesses
- Assigns skill level (beginner or advanced)

**Call 2 (Zephyr)** → Generate adaptive guidance
- Beginner: Simple explanations of variables, loops, functions
- Advanced: Three challenging problems (DSA, REST API, System Design)

**Call 3 (Mistral)** → Create personalized roadmap
- 4-week learning plan with weekly goals, technologies, and practice tasks

### Models Used

- **ANALYSIS_MODEL**: `mistralai/Mistral-7B-Instruct-v0.2:featherless-ai`
- **GUIDANCE_MODEL**: `HuggingFaceH4/zephyr-7b-beta:featherless-ai`
- **Router**: HuggingFace OpenAI-compatible API endpoint

### Security Features

#### Personal Information Protection
The API blocks inputs containing:
- Email addresses (user@domain.com)
- Phone numbers ((123) 456-7890, +1 123 456 7890, etc.)
- Bank account numbers (8-17 digit sequences)
- Credit card numbers (13-19 digit sequences)
- Social Security Numbers (XXX-XX-XXXX)
- Routing numbers (9 consecutive digits)
- Sensitive keywords (CVV, PIN, SWIFT, IBAN, etc.)

Returns a `400` error with a clear message if sensitive data is detected.

#### Prompt Injection Prevention
- Removes curly braces `{}` that could break f-string templates
- Enforces strict input length (10-5000 characters)
- Validates JSON responses with fallback regex extraction

### API Endpoints

#### `POST /api/evaluate`
Evaluates learner answers and generates personalized feedback.

**Request:**
```json
{
  "answers": "I understand variables store data, and loops repeat code..."
}
```

**Response:**
```json
{
  "success": true,
  "score": 75,
  "level": "advanced",
  "responseType": "advanced_challenge",
  "analysis": {
    "score": 75,
    "level": "advanced",
    "strengths": ["Understanding of loops", "Good code examples"],
    "weaknesses": ["Variable scope confusion"]
  },
  "guidance": "Here are 3 advanced challenges...",
  "roadmap": "Week 1: Master async/await — JavaScript — Build async functions..."
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Input contains sensitive information (email address). Please remove any personal data before submitting."
}
```

#### `GET /`
Health check endpoint. Returns `200 OK` with status message.

## Setup Instructions

### Prerequisites
- Python 3.9+
- HuggingFace API token (from huggingface.co)
- Node.js 14+ (for frontend)

### Backend Setup

1. **Create `.env` file:**
```bash
HF_TOKEN=hf_your_token_here
FLASK_DEBUG=false
```

2. **Install dependencies:**
```bash
pip install flask flask-cors openai python-dotenv
```

3. **Run the server:**
```bash
python app.py
```

Server runs on `http://localhost:5000`

### Frontend Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Start development server:**
```bash
npm start
```

Frontend runs on `http://localhost:3000`

3. **Build for production:**
```bash
npm run build
```

## Input Validation Rules

- **Minimum length**: 10 characters
- **Maximum length**: 5,000 characters
- **No personal info**: Phone, email, bank details, SSN rejected
- **No prompt injection**: Curly braces stripped before LLM processing

## Error Handling

All errors return structured JSON responses:

| Error | Status | Cause |
|-------|--------|-------|
| Missing JSON body | 400 | Malformed request |
| Invalid answer type | 400 | `answers` is not a string |
| Too short/long | 400 | Length validation failed |
| Personal info detected | 400 | Sensitive data in input |
| Analysis parse failed | 500 | LLM output couldn't be parsed |
| Model unavailable | 500 | HF_TOKEN invalid or model unreachable |

## Development

### Logging
- Level: INFO
- Format: `[timestamp] [LEVEL] message`
- Location: stdout/stderr

### Testing
Test the API with curl:
```bash
curl -X POST http://localhost:5000/api/evaluate \
  -H "Content-Type: application/json" \
  -d '{"answers": "Variables store values that can change. Loops repeat code blocks."}'
```

Test personal info rejection:
```bash
curl -X POST http://localhost:5000/api/evaluate \
  -H "Content-Type: application/json" \
  -d '{"answers": "My email is john@example.com and I want to learn Python"}'
```

## Production Considerations

- Use a production WSGI server (Gunicorn, uWSGI)
- Implement rate limiting to prevent abuse
- Add authentication for learner tracking (optional)
- Cache roadmaps for repeated requests
- Monitor LLM API costs and set rate limits
- Enable HTTPS for secure data transmission

## Troubleshooting

### "HF_TOKEN is not set"
Add `HF_TOKEN=hf_xxxx` to your `.env` file and restart the server.

### "Model call failed"
- Check HF_TOKEN is valid
- Verify HuggingFace router is accessible
- Check model identifiers are correct

### "Analysis parse failed"
- May indicate model output was corrupted
- Check logs for the raw response
- Verify model is responding correctly

## License

Educational use. Built with HuggingFace and Flask.
