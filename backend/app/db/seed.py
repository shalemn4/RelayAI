import random
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from backend.app.core.security import get_password_hash
from backend.app.models.user import User
from backend.app.models.customer import Customer
from backend.app.models.agent import Agent
from backend.app.models.lead import Lead
from backend.app.models.conversation import Conversation
from backend.app.models.message import Message
from backend.app.models.call import Call, CallUtterance
from backend.app.models.saved_filter import SavedFilter
from backend.app.models.analytics_event import AnalyticsEvent

CUSTOMERS_DATA = [
    ("Sarah Jenkins", "sarah.j@apexlogistics.io", "+1 (415) 892-4012", "Apex Logistics"),
    ("Marcus Chen", "mchen@stratahealth.org", "+1 (650) 331-9982", "Strata Health"),
    ("Elena Rostova", "elena@vanguardfin.com", "+1 (212) 440-1928", "Vanguard Financial"),
    ("David Kim", "dkim@hyperionlabs.ai", "+1 (408) 552-8174", "Hyperion Labs"),
    ("Chloe Moreau", "chloe@luxeatelier.fr", "+33 1 42 68 55 00", "Luxe Atelier"),
    ("Liam Gallagher", "liam@pulsecreative.co.uk", "+44 20 7946 0912", "Pulse Creative"),
    ("Aaliyah Patel", "aaliyah@zenithenergy.in", "+91 22 2490 8821", "Zenith Energy"),
    ("Carlos Mendoza", "cmendoza@novabio.io", "+1 (305) 782-9011", "Nova BioSystems"),
    ("Hannah Schmidt", "h.schmidt@krupptech.de", "+49 30 2095 4410", "Krupp Tech"),
    ("Kenji Sato", "sato@omnitech.jp", "+81 3 5555 0143", "OmniTech Tokyo"),
    ("Rachel Green", "rachel@bloomretail.com", "+1 (206) 912-3844", "Bloom Retail"),
    ("Omar Al-Mansoor", "omar@gulfstreamholdings.ae", "+971 4 312 9900", "GulfStream Holdings"),
    ("Natalie Dormer", "natalie@crestviewcapital.com", "+1 (312) 880-4921", "Crestview Capital"),
    ("Brian O'Connor", "brian@fastlinefreight.ie", "+353 1 496 0122", "FastLine Freight"),
    ("Priya Sharma", "priya@synthetica.ai", "+1 (617) 402-9931", "Synthetica AI"),
    ("Lucas Silva", "lucas@rioventures.br", "+55 11 3088 4100", "Rio Ventures"),
    ("Emma Watson", "emma@luminarymedia.co", "+1 (917) 604-1823", "Luminary Media"),
    ("Devon Brooks", "devon@cloudforge.net", "+1 (512) 330-8199", "CloudForge Networks"),
    ("Siddharth Roy", "sroy@vectordynamics.com", "+1 (404) 771-0922", "Vector Dynamics"),
    ("Tara Donnelly", "tara@solarpulse.io", "+1 (720) 449-3381", "SolarPulse CleanTech"),
    ("Viktor Novak", "viktor@nordiclogix.se", "+46 8 123 4567", "Nordic Logix"),
    ("Jasmine Zhao", "jzhao@nexustalent.com", "+1 (415) 609-8812", "Nexus Talent"),
    ("Mateo Rossi", "mateo@torinocars.it", "+39 011 555 2200", "Torino Mobility"),
    ("Amara Okafor", "amara@saharapay.ng", "+234 1 234 5678", "SaharaPay"),
    ("Justin Trudeau-Smith", "justin@mapleleaftech.ca", "+1 (416) 555-0199", "MapleLeaf Tech"),
    ("Grace Hopperly", "grace@compilersec.io", "+1 (202) 555-0144", "CompilerSec"),
    ("Arthur Dent", "arthur@galaxytrans.org", "+44 1632 960012", "Galaxy Trans"),
    ("Maya Lin", "maya@urbanarch.studio", "+1 (213) 555-0178", "UrbanArch Studio"),
    ("Frank Castle", "frank@defenselogix.gov.mock", "+1 (703) 555-0133", "Defense Logix"),
    ("Zoe Saldana", "zoe@orionmedia.space", "+1 (310) 555-0188", "Orion Media")
]

AGENTS_DATA = [
    ("Maya - Inbound SDR", "Sales Qualification", "Qualifies leads, schedules demos, and calculates enterprise tier estimates.", "online", 0.94, 0.06),
    ("Alex - Tier 2 Support", "Technical Support", "Troubleshoots webhooks, API tokens, payload errors, and integration outages.", "online", 0.91, 0.12),
    ("Sophia - Billing & Renewal", "Account Management", "Assists with invoice discrepancies, card updates, and contract upgrades.", "online", 0.95, 0.04),
    ("David - Solutions Architect", "Enterprise Pre-Sales", "Reviews custom security compliance, HIPAA/SOC2 questionnaires, and SLA terms.", "busy", 0.89, 0.18),
    ("Elena - VIP Escalations", "Executive Support", "Handles high-sentiment escalations, executive account complaints, and urgent handoffs.", "online", 0.93, 0.22)
]

def seed_database(db: Session):
    # Check if already seeded
    if db.query(User).filter(User.email == "operator@relayai.com").first():
        return

    now = datetime.now(timezone.utc)

    # 1. Operators / Users
    operator = User(
        email="operator@relayai.com",
        name="Jordan Hayes",
        hashed_password=get_password_hash("RelayOperator123!"),
        role="operator",
        avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
    )
    supervisor = User(
        email="supervisor@relayai.com",
        name="Morgan Sterling",
        hashed_password=get_password_hash("RelaySupervisor123!"),
        role="supervisor",
        avatar_url="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"
    )
    db.add_all([operator, supervisor])
    db.commit()

    # 2. AI Agents
    agents = []
    for name, role, desc, status, conf, to_rate in AGENTS_DATA:
        agent = Agent(
            name=name,
            role=role,
            description=desc,
            status=status,
            conversations_handled=random.randint(120, 450),
            avg_confidence=conf,
            takeover_rate=to_rate,
            model="gpt-4o-relay-hybrid"
        )
        agents.append(agent)
    db.add_all(agents)
    db.commit()

    # 3. Customers
    customers = []
    for name, email, phone, company in CUSTOMERS_DATA:
        cust = Customer(
            name=name,
            email=email,
            phone=phone,
            company=company,
            avatar_url=f"https://api.dicebear.com/7.x/initials/svg?seed={name.replace(' ', '+')}",
            timezone=random.choice(["America/New_York", "America/Los_Angeles", "Europe/London", "Asia/Tokyo"])
        )
        customers.append(cust)
    db.add_all(customers)
    db.commit()

    # 4. Leads (20 leads)
    stages = ["new", "contacted", "qualified", "demo", "won", "lost"]
    leads = []
    for i in range(20):
        cust = customers[i]
        stg = stages[i % len(stages)]
        score = random.randint(45, 98)
        lead = Lead(
            customer_id=cust.id,
            stage=stg,
            score=score,
            deal_value=random.choice([2500, 5000, 12000, 24000, 48000, 95000]),
            source=random.choice(["Inbound Web", "Product Demo", "Outbound Email", "Referral", "Partner"]),
            owner_id=operator.id if i % 2 == 0 else supervisor.id,
            last_activity_at=now - timedelta(hours=random.randint(1, 120)),
            notes=f"High interest in AI auto-triage for {cust.company} operations."
        )
        leads.append(lead)
    db.add_all(leads)
    db.commit()

    # 5. Conversations & Messages (50+ conversations)
    channels = ["sms", "whatsapp", "email", "webchat"]
    statuses = ["ai_active", "human_assigned", "escalated", "resolved"]
    sentiments = ["positive", "neutral", "negative"]
    priorities = ["normal", "high", "urgent", "low"]

    CONV_STARTERS = [
        ("Hi there, does RelayAI support direct SMS webhooks for our field drivers?", "pricing"),
        ("We need to schedule a product demo for our executive team this Thursday.", "demo"),
        ("Can you clarify the pricing tier for 20,000 monthly active conversations?", "pricing"),
        ("Our webhook endpoint received a 504 timeout during peak load earlier.", "technical"),
        ("We would like to upgrade from Starter to the Enterprise plan next month.", "pricing"),
        ("Does your voice AI agent support Spanish speech transcription?", "technical"),
        ("I need to speak to an account manager right now regarding our billing invoice.", "general"),
        ("How does the human takeover handoff work when an agent gets stuck?", "technical"),
        ("We love the prototype! What are the onboarding timelines for 50 operators?", "demo"),
        ("Is there SOC2 Type II compliance documentation available for our review?", "technical")
    ]

    conversations = []
    for i in range(50):
        cust = customers[i % len(customers)]
        channel = channels[i % len(channels)]
        status = statuses[i % len(statuses)]
        sentiment = sentiments[i % len(sentiments)]
        priority = priorities[i % len(priorities)]
        assigned_agent = agents[i % len(agents)]
        assigned_user = operator if status == "human_assigned" else None
        lead = leads[i % len(leads)] if i < len(leads) else None

        starter_text, category = CONV_STARTERS[i % len(CONV_STARTERS)]
        created_time = now - timedelta(days=random.randint(0, 14), hours=random.randint(1, 23))

        conv = Conversation(
            customer_id=cust.id,
            channel=channel,
            status=status,
            sentiment=sentiment,
            priority=priority,
            assigned_agent_id=assigned_agent.id,
            assigned_user_id=assigned_user.id if assigned_user else None,
            last_activity_at=created_time,
            unread_count=random.choice([0, 0, 1, 2]),
            tags=random.sample(["VIP", "High Intent", "Enterprise", "Bug", "Follow-up", "Q3 Target"], k=random.randint(1, 3)),
            lead_id=lead.id if lead else None
        )
        conversations.append(conv)
    db.add_all(conversations)
    db.commit()

    # Populate messages for each conversation (at least 2-4 messages per conversation)
    all_messages = []
    for i, conv in enumerate(conversations):
        cust = conv.customer
        starter_text, category = CONV_STARTERS[i % len(CONV_STARTERS)]
        
        # Turn 1: Customer initial message
        t1_time = conv.last_activity_at - timedelta(minutes=15)
        m1 = Message(
            conversation_id=conv.id,
            sender_role="customer",
            sender_name=cust.name,
            content=starter_text,
            status="sent",
            created_at=t1_time
        )
        all_messages.append(m1)

        # Turn 2: AI or Human response
        t2_time = conv.last_activity_at - timedelta(minutes=10)
        if conv.status == "human_assigned":
            m2 = Message(
                conversation_id=conv.id,
                sender_role="human",
                sender_name=operator.name,
                content=f"Hello {cust.name}, Jordan here from RelayAI. I've taken over this thread and I'm actively reviewing your question regarding {cust.company}.",
                status="delivered",
                created_at=t2_time
            )
        else:
            m2 = Message(
                conversation_id=conv.id,
                sender_role="ai",
                sender_name=conv.assigned_agent.name if conv.assigned_agent else "Relay Assistant",
                content=f"Hi {cust.name}, thanks for reaching out! I can certainly assist with your request for {cust.company}. Let me pull up the technical specifications for you.",
                status="delivered",
                metadata_payload={
                    "confidence": 0.94,
                    "category": category,
                    "reasoning": ["Customer asked about integration capabilities", "Verified enterprise tier availability"]
                },
                created_at=t2_time
            )
        all_messages.append(m2)

        # Turn 3: Customer follow-up
        t3_time = conv.last_activity_at
        m3 = Message(
            conversation_id=conv.id,
            sender_role="customer",
            sender_name=cust.name,
            content=f"Sounds great. Could you confirm if we can start with a 14-day trial on {conv.channel.upper()}?",
            status="delivered",
            created_at=t3_time
        )
        all_messages.append(m3)

    db.add_all(all_messages)
    db.commit()

    # 6. Calls & Utterances (15 calls)
    calls = []
    call_statuses = ["completed", "completed", "ai_speaking", "customer_speaking", "human_takeover", "connecting"]
    for i in range(15):
        cust = customers[i]
        agent = agents[i % len(agents)]
        st = call_statuses[i % len(call_statuses)]
        dur = random.randint(45, 380) if st == "completed" else random.randint(15, 95)
        call = Call(
            customer_id=cust.id,
            agent_id=agent.id,
            status=st,
            duration_seconds=dur,
            sentiment=random.choice(["positive", "neutral", "negative"]),
            intent_summary=f"Inbound inquiry regarding {cust.company} contract renewal.",
            started_at=now - timedelta(minutes=random.randint(5, 300))
        )
        calls.append(call)
    db.add_all(calls)
    db.commit()

    # Add realistic utterances to each call
    utterances = []
    for call in calls:
        u1 = CallUtterance(
            call_id=call.id,
            speaker="agent",
            text="Thank you for calling RelayAI. My name is Maya. How can I assist your business today?",
            sentiment="positive",
            confidence=0.98,
            timestamp=call.started_at
        )
        u2 = CallUtterance(
            call_id=call.id,
            speaker="customer",
            text=f"Hi Maya, I'm calling from {call.customer.company}. We noticed an alert on our SMS dispatch line.",
            sentiment="neutral",
            confidence=0.94,
            timestamp=call.started_at + timedelta(seconds=12)
        )
        u3 = CallUtterance(
            call_id=call.id,
            speaker="agent",
            text="I see your account. The rate limit was temporarily throttled during the 2 PM surge. I've re-routed the queue.",
            sentiment="positive",
            confidence=0.96,
            timestamp=call.started_at + timedelta(seconds=28)
        )
        utterances.extend([u1, u2, u3])
    db.add_all(utterances)
    db.commit()

    # 7. Saved Filters (Visual AST examples)
    filter1 = SavedFilter(
        name="Hot SMS Inbound",
        ast={
            "id": "root-1",
            "operator": "AND",
            "conditions": [
                {"id": "c1", "field": "channel", "operator": "eq", "value": "sms"},
                {"id": "c2", "field": "lead_status", "operator": "eq", "value": "qualified"}
            ]
        },
        is_favorite=True,
        user_id=operator.id
    )
    filter2 = SavedFilter(
        name="Escalated & Negative",
        ast={
            "id": "root-2",
            "operator": "OR",
            "conditions": [
                {"id": "c3", "field": "status", "operator": "eq", "value": "escalated"},
                {"id": "c4", "field": "sentiment", "operator": "eq", "value": "negative"}
            ]
        },
        is_favorite=True,
        user_id=operator.id
    )
    filter3 = SavedFilter(
        name="WhatsApp Enterprise Leads",
        ast={
            "id": "root-3",
            "operator": "AND",
            "conditions": [
                {"id": "c5", "field": "channel", "operator": "eq", "value": "whatsapp"},
                {"id": "c6", "field": "lead_score", "operator": "gt", "value": 75}
            ]
        },
        is_favorite=False,
        user_id=operator.id
    )
    db.add_all([filter1, filter2, filter3])
    db.commit()

    # 8. Analytics Events (150+ granular events spanning 30 days)
    # This fulfills: "Make analytics genuinely data-driven, not just hardcoded dashboard numbers."
    analytics_events = []
    event_types = [
        ("ai_suggestion_accepted", 0.72),
        ("ai_suggestion_rejected", 0.16),
        ("ai_suggestion_edited", 0.12),
        ("human_takeover", 0.10),
        ("message_sent", 0.85)
    ]

    for day_offset in range(30):
        day_date = now - timedelta(days=day_offset)
        # 5 - 12 events per day
        daily_count = random.randint(5, 12)
        for _ in range(daily_count):
            rand_choice = random.random()
            if rand_choice < 0.50:
                etype = "ai_suggestion_accepted"
            elif rand_choice < 0.65:
                etype = "ai_suggestion_rejected"
            elif rand_choice < 0.75:
                etype = "ai_suggestion_edited"
            elif rand_choice < 0.85:
                etype = "human_takeover"
            else:
                etype = "message_sent"

            ev = AnalyticsEvent(
                event_type=etype,
                conversation_id=random.choice(conversations).id,
                channel=random.choice(channels),
                lead_stage=random.choice(stages),
                confidence=round(random.uniform(0.78, 0.98), 2),
                response_time_ms=random.randint(12000, 42000),  # 12s - 42s
                timestamp=day_date - timedelta(hours=random.randint(0, 23), minutes=random.randint(0, 59))
            )
            analytics_events.append(ev)

    db.add_all(analytics_events)
    db.commit()
    print("RelayAI seed completed successfully!")

if __name__ == "__main__":
    from backend.app.db.database import Base, engine, SessionLocal
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    seed_database(db)
    db.close()
