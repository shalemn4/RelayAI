# ERD 004: Voice AI Calls & Live Transcript Interface

## 1. Problem
Call center and field operations teams handle incoming customer phone inquiries via automated AI voice agents. However, supervisors have no live visibility into active calls, cannot review progressive transcripts in real time, and cannot intervene when a caller becomes confused or frustrated.

## 2. Goal
Provide a real-time Voice AI Calls monitor with active call indicators, an interactive live transcript feed over WebSockets, speaker sentiment/intent tracking, confidence scores, and an instant human takeover capability.

## 3. User Stories
- As a supervisor, I want to see a list of active and past phone calls with caller identity, duration, and status.
- As a supervisor, I want to click into an ongoing call and view utterances streaming in real-time as customer and AI speak.
- As a supervisor, I want to see AI intent and sentiment tags on each transcript turn so I know if the call is going well.
- As a supervisor, I want to take over the call from the AI agent with a single tap if escalation is required.

## 4. Functional Requirements
- **Call States**: `connecting`, `ai_speaking`, `customer_speaking`, `processing`, `escalating`, `human_takeover`, `completed`.
- **Live Transcript Stream**: Real-time utterances received over WebSocket with timestamp, speaker role (`agent` / `customer`), sentiment (`positive`, `neutral`, `negative`), and speech confidence score.
- **Audio Visualizer Simulation**: Subtle pulsing waveform animation representing active speech.
- **Takeover Action**: Changes call status to `human_takeover`, stops AI automated audio generation, routes audio stream to supervisor.
- **End Call**: Allows termination of call session with summary card generation.

## 5. Non-Functional Requirements
- Live transcript latency < 350ms from speech recognition event to UI render.
- Smooth auto-scrolling to bottom of transcript with user manual-scroll override detection.

## 6. Technical Approach
- **WebSocket Protocol**: Subscribes to `call:{id}`, receives `call.transcript.updated` events.
- **State Management**: Utterances appended locally to active session in TanStack Query cache.
- **Telephony Abstraction**: Backend provides high-fidelity call simulation engine emitting realistic multi-turn dialogues with dynamic audio state transitions.

## 7. API Requirements
- `GET /api/v1/calls`: List calls with status, duration, caller.
- `GET /api/v1/calls/{id}`: Detailed call metadata and transcript history.
- `POST /api/v1/calls/{id}/takeover`: Escalate to human operator.
- `POST /api/v1/calls/{id}/end`: Conclude call.

## 8. Analytics Events
- `call_opened`: `{ call_id, status, duration }`
- `call_takeover_triggered`: `{ call_id, utterance_count }`
- `call_completed`: `{ call_id, total_duration, outcome }`

## 9. Testing Strategy
- Unit test: Utterance stream parsing and chronological sorting.
- Component test: Live call status pill and auto-scroll behavior.
- E2E test: Open Calls tab -> select active call -> observe live streaming transcript -> trigger human takeover.

## 10. Success Metrics
- Average supervisor intervention response time < 5 seconds upon negative sentiment detection.
