import asyncio
import random
from typing import AsyncGenerator, Dict, Any, List
from backend.app.schemas.conversation import AISuggestionRead

class AIService:
    """
    AI Orchestration Service providing suggestions, confidence telemetry,
    reasoning traces, and simulated token streaming.
    """

    RESPONSES_BY_CATEGORY = {
        "pricing": [
            {
                "text": "Hi {name}, thanks for inquiring about our pricing! Our Growth Tier starts at $499/mo for up to 5,000 monthly active conversations and includes multi-channel AI agents. Would you like me to send over the full feature breakdown or schedule a 15-minute walkthrough?",
                "confidence": 0.94,
                "category": "Pricing & Packaging",
                "reasoning": [
                    "Detected inquiry regarding tier limits and subscription costs",
                    "Customer company size matches Growth tier profile",
                    "Appended low-friction scheduling CTA"
                ]
            },
            {
                "text": "Hello {name}, our plans are transparent and designed to scale with {company}. The Growth tier is $499/month and includes unlimited team seats, voice + chat AI copilot, and bi-directional CRM sync. What monthly conversation volume is your team expecting?",
                "confidence": 0.96,
                "category": "Pricing & Packaging",
                "reasoning": [
                    "Emphasized unlimited seats and multi-channel AI copilot",
                    "Targeted qualification for conversation volume limits",
                    "Executive consultative tone"
                ]
            },
            {
                "text": "Hi {name}, happy to help with pricing for {company}! Most teams start on our Growth plan ($499/mo) and expand as needs grow. I can also set up a 14-day full sandbox with sample CRM data so you can test AI accuracy firsthand. Would you like access?",
                "confidence": 0.92,
                "category": "Pricing & Packaging",
                "reasoning": [
                    "Highlighted low barrier to entry with 14-day sandbox",
                    "Addressed data verification requirements",
                    "Action-oriented trial closing hook"
                ]
            }
        ],
        "demo": [
            {
                "text": "Hello {name}, I'd be delighted to arrange a live demonstration tailored for {company}. We have availability tomorrow at 2:00 PM EST or Thursday at 10:00 AM EST. Do either of those times work for your team?",
                "confidence": 0.96,
                "category": "Demo Request & Qualification",
                "reasoning": [
                    "High buyer intent detected in customer query",
                    "Verified executive availability in calendar slots",
                    "Personalized company name CTA"
                ]
            },
            {
                "text": "Hi {name}, absolutely! I can organize an executive walkthrough of RelayAI focused on {company}'s specific use cases and CRM stack. Are mornings or afternoons generally better for you this week?",
                "confidence": 0.95,
                "category": "Demo Request & Qualification",
                "reasoning": [
                    "Confirmed executive walkthrough request",
                    "Oriented around customer's specific tech stack integration",
                    "Reduced friction by asking for general time-of-day preference"
                ]
            },
            {
                "text": "Hello {name}, we'd love to show you RelayAI in action. I can set up a 20-minute guided session where we demonstrate automated lead triage, voice handoffs, and omnichannel routing. Would Friday at 11:00 AM EST suit you?",
                "confidence": 0.93,
                "category": "Demo Request & Qualification",
                "reasoning": [
                    "Outlined concrete 20-minute demo agenda",
                    "Highlighted voice handoffs and omnichannel triage",
                    "Offered specific high-availability calendar slot"
                ]
            }
        ],
        "technical": [
            {
                "text": "Hi {name}, our platform integrates directly via REST Webhooks and native Zapier/Make connectors. Payload latency is typically under 120ms with automatic retry on 5xx responses. You can test this immediately in sandbox mode.",
                "confidence": 0.89,
                "category": "Technical Specifications",
                "reasoning": [
                    "Customer asked about API throughput and webhook reliability",
                    "Referenced developer documentation and sandbox endpoint",
                    "Confirmed SLA latency guarantees"
                ]
            },
            {
                "text": "Hello {name}, RelayAI exposes full OpenAPI 3.1 endpoints and real-time WebSocket event streams with sub-100ms delivery. We also provide official Python and TypeScript SDKs for rapid integration with {company}'s architecture. Would you like our API docs and Postman collection?",
                "confidence": 0.94,
                "category": "Technical Specifications",
                "reasoning": [
                    "Provided architectural specs for WebSocket streams and REST API",
                    "Referenced SDK availability in Python and TypeScript",
                    "Offered developer quickstart assets (docs + Postman)"
                ]
            },
            {
                "text": "Hi {name}, regarding {company}'s technical requirements: we support bi-directional webhooks with HMAC-SHA256 signature verification, idempotent event delivery, and 99.99% uptime SLAs. I can connect you with one of our solutions architects if you'd like a deep dive.",
                "confidence": 0.91,
                "category": "Technical Specifications",
                "reasoning": [
                    "Detailed enterprise security (HMAC-SHA256) and idempotency guarantees",
                    "Referenced 99.99% infrastructure availability SLA",
                    "Escalated offer to Solutions Architecture team"
                ]
            }
        ],
        "general": [
            {
                "text": "Hello {name}, thank you for reaching out to RelayAI. I've noted your request and our team is reviewing the account details now. Is there anything specific you would like us to prioritize?",
                "confidence": 0.88,
                "category": "General Support / Triaged",
                "reasoning": [
                    "Identified general inquiry",
                    "Acknowledged receipt with reassuring tone",
                    "Requested clarification to speed up resolution"
                ]
            },
            {
                "text": "Hi {name}, thanks for getting in touch! We're actively looking into this for {company} and will have an update shortly. If this is urgent, let me know and I can fast-track it to our primary support queue.",
                "confidence": 0.90,
                "category": "General Support / Triaged",
                "reasoning": [
                    "Prompt acknowledgment with warm, attentive tone",
                    "Offered expedited escalation if time-critical",
                    "Recorded customer account context"
                ]
            },
            {
                "text": "Hello {name}, welcome to RelayAI! I'm here to assist you and {company} with any questions about our platform, integrations, or setup. What's the main goal you're looking to achieve today?",
                "confidence": 0.87,
                "category": "General Support / Triaged",
                "reasoning": [
                    "Welcoming consultative approach",
                    "Open-ended discovery question to understand primary objective",
                    "Ready to assist across multiple product areas"
                ]
            }
        ]
    }

    _variation_tracker: Dict[int, int] = {}

    @classmethod
    def generate_suggestion(
        cls,
        customer_name: str,
        company_name: str,
        last_message_content: str,
        conversation_id: int,
        regenerate: bool = False
    ) -> AISuggestionRead:
        lower_msg = (last_message_content or "").lower()
        if any(k in lower_msg for k in ["price", "cost", "quote", "tier", "plan"]):
            cat_key = "pricing"
        elif any(k in lower_msg for k in ["demo", "schedule", "call", "meet", "time"]):
            cat_key = "demo"
        elif any(k in lower_msg for k in ["api", "webhook", "integration", "tech", "sdk"]):
            cat_key = "technical"
        else:
            cat_key = "general"

        variations = cls.RESPONSES_BY_CATEGORY[cat_key]
        last_idx = cls._variation_tracker.get(conversation_id, -1)
        if regenerate:
            next_idx = (last_idx + 1) % len(variations)
        else:
            next_idx = 0 if last_idx == -1 else last_idx

        cls._variation_tracker[conversation_id] = next_idx
        template = variations[next_idx]

        formatted_text = template["text"].format(
            name=customer_name or "there",
            company=company_name or "your team"
        )
        confidence = template["confidence"] + round(random.uniform(-0.02, 0.02), 2)
        confidence = max(0.70, min(0.99, confidence))

        return AISuggestionRead(
            id=f"sug-{conversation_id}-{int(random.random()*10000)}",
            conversation_id=conversation_id,
            text=formatted_text,
            confidence=round(confidence, 2),
            category=template["category"],
            reasoning_steps=template["reasoning"],
            created_at="just now",
            state="ready"
        )

    @classmethod
    async def stream_tokens(cls, full_text: str) -> AsyncGenerator[str, None]:
        words = full_text.split(" ")
        for i, word in enumerate(words):
            yield word + (" " if i < len(words) - 1 else "")
            await asyncio.sleep(0.04)  # 40ms per word creates smooth, realistic streaming
