import React, { useState, useRef, useEffect } from 'react';
import { 
  ShieldCheck, 
  UserCheck, 
  Radio, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  PhoneOff, 
  Send, 
  RotateCcw, 
  Bot, 
  User, 
  CheckCircle2,
  Play
} from 'lucide-react';
import { useMockStore } from '../data/mockStore';

export const CallsView: React.FC = () => {
  const store = useMockStore();
  const call = store.activeCall;

  // Local state for supervisor speak console
  const [supervisorText, setSupervisorText] = useState('');
  const [isWhisper, setIsWhisper] = useState(false);
  const [isSpeakingOutLoud, setIsSpeakingOutLoud] = useState(false);
  const [lastSpokenId, setLastSpokenId] = useState<string | number | null>(null);

  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll transcript when new utterances arrive
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [call?.utterances?.length]);

  // Web Speech API text-to-speech helper
  const speakText = (text: string, speaker: string, utteranceId?: string | number) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    if (lastSpokenId === utteranceId && isSpeakingOutLoud) {
      setIsSpeakingOutLoud(false);
      setLastSpokenId(null);
      return;
    }

    const cleanText = text.replace(/\[.*?\]:?/g, '').trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;

    if (speaker === 'customer') {
      utterance.pitch = 1.15;
    } else if (speaker === 'supervisor') {
      utterance.pitch = 0.85;
    } else {
      utterance.pitch = 1.0;
    }

    utterance.onstart = () => {
      setIsSpeakingOutLoud(true);
      if (utteranceId) setLastSpokenId(utteranceId);
    };

    utterance.onend = () => {
      setIsSpeakingOutLoud(false);
      setLastSpokenId(null);
    };

    utterance.onerror = () => {
      setIsSpeakingOutLoud(false);
      setLastSpokenId(null);
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleSupervisorSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!supervisorText.trim()) return;

    store.supervisorSpeak(call.id, supervisorText.trim(), isWhisper);
    setSupervisorText('');
  };

  const handleQuickPrompt = (promptText: string) => {
    store.supervisorSpeak(call.id, promptText, isWhisper);
  };

  const formatDuration = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="animate-fade-in" style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* 1. Multi-Call Switcher Tabs */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', overflowX: 'auto', paddingBottom: '4px' }}>
        <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Active Calls:
        </span>
        {store.calls.map((c) => {
          const isSelected = c.id === store.activeCallId;
          const isTakeover = c.status === 'human_takeover';
          const isEscalated = c.status === 'escalating';

          return (
            <button
              key={c.id}
              type="button"
              id={`tab-call-${c.id}`}
              onClick={() => store.selectCall(c.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: '10px',
                background: isSelected ? 'rgba(234, 88, 12, 0.15)' : 'var(--bg-surface)',
                border: `1px solid ${isSelected ? 'var(--orange-500)' : 'var(--border-subtle)'}`,
                color: isSelected ? '#fff' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '12.5px',
                fontWeight: isSelected ? 700 : 500,
                transition: 'all 0.15s ease',
              }}
            >
              <span 
                style={{ 
                  width: '8px', 
                  height: '8px', 
                  borderRadius: '50%', 
                  background: isTakeover ? 'var(--green-500)' : isEscalated ? 'var(--rose-500)' : 'var(--orange-500)',
                  boxShadow: isSelected ? '0 0 8px currentColor' : 'none'
                }} 
              />
              <span>{c.customer_name}</span>
              <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginLeft: '4px' }}>
                ({formatDuration(c.duration_seconds)})
              </span>
            </button>
          );
        })}
      </div>

      {/* 2. Top Telemetry Banner */}
      <div 
        style={{
          background: call.status === 'human_takeover'
            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(20, 20, 24, 0.8) 100%)'
            : call.status === 'escalating'
            ? 'linear-gradient(135deg, rgba(244, 63, 94, 0.15) 0%, rgba(20, 20, 24, 0.8) 100%)'
            : 'linear-gradient(135deg, rgba(234, 88, 12, 0.12) 0%, rgba(20, 20, 24, 0.8) 100%)',
          border: `1px solid ${
            call.status === 'human_takeover' 
              ? 'rgba(16, 185, 129, 0.35)' 
              : call.status === 'escalating'
              ? 'rgba(244, 63, 94, 0.35)'
              : 'rgba(234, 88, 12, 0.3)'
          }`,
          borderRadius: '14px',
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
            <span className="live-pill" style={{ padding: '3px 8px' }}>
              <span className="live-dot" />
              {call.status === 'completed' ? 'CALL COMPLETED' : 'LIVE TELEMETRY STREAM'}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              WebRTC Opus 48kHz • {call.latency_ms || 180}ms Latency
            </span>
            <span style={{ fontSize: '11px', background: 'rgba(255, 255, 255, 0.06)', padding: '2px 8px', borderRadius: '10px', color: '#fff', fontWeight: 600 }}>
              ⏱ {formatDuration(call.duration_seconds)}
            </span>
          </div>

          <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>
            Voice Call with {call.customer_name}
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Phone: <strong>{call.customer_phone}</strong> • Agent: <strong style={{ color: call.status === 'human_takeover' ? 'var(--green-500)' : 'var(--orange-500)' }}>{call.agent_name}</strong>
          </p>
        </div>

        {/* Action Controls Toolbar */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Audio Listen Toggle */}
          <button
            type="button"
            className="btn-ghost"
            style={{
              padding: '8px 12px',
              fontSize: '12px',
              gap: '6px',
              color: isSpeakingOutLoud ? 'var(--green-500)' : 'var(--text-secondary)',
              borderColor: isSpeakingOutLoud ? 'var(--green-500)' : 'var(--border-subtle)',
            }}
            onClick={() => {
              if (call.utterances && call.utterances.length > 0) {
                const latest = call.utterances[call.utterances.length - 1];
                speakText(latest.text, latest.speaker, latest.id);
              }
            }}
            title="Read out the latest incoming spoken utterance"
          >
            {isSpeakingOutLoud ? <Volume2 size={16} /> : <VolumeX size={16} />}
            <span>{isSpeakingOutLoud ? 'Listening to Call...' : 'Listen to Live Audio'}</span>
          </button>

          {/* Mute Mic Toggle */}
          <button
            type="button"
            className="btn-ghost"
            style={{
              padding: '8px 12px',
              fontSize: '12px',
              gap: '6px',
              color: store.isMicMuted ? 'var(--rose-500)' : 'var(--text-secondary)',
            }}
            onClick={() => store.toggleMicMute()}
            title="Mute/Unmute Supervisor Microphone"
          >
            {store.isMicMuted ? <MicOff size={16} /> : <Mic size={16} />}
            <span>{store.isMicMuted ? 'Mic Muted' : 'Mic Active'}</span>
          </button>

          {/* Barge-In / Autonomous AI Toggle */}
          {call.status === 'human_takeover' ? (
            <button
              id="btn-return-ai"
              type="button"
              className="btn-ghost"
              style={{
                background: 'rgba(16, 185, 129, 0.15)',
                borderColor: 'var(--green-500)',
                color: 'var(--green-500)',
                gap: '8px',
                fontWeight: 700,
              }}
              onClick={() => store.returnControlToAI(call.id)}
              title="Return voice call control back to autonomous AI agent"
            >
              <Bot size={16} />
              <span>Operator Active (Hand back to AI)</span>
            </button>
          ) : (
            <button
              id="btn-barge-in"
              type="button"
              className="btn-primary"
              style={{ 
                background: 'linear-gradient(135deg, #ea580c, #c2410c)',
                gap: '8px',
                fontWeight: 700,
              }}
              onClick={() => store.bargeInCall(call.id)}
              title="Takeover live audio channel and speak as supervisor"
            >
              <UserCheck size={16} />
              <span>Supervisor Barge-In (Takeover)</span>
            </button>
          )}

          {/* End Call / Reset */}
          {call.status !== 'completed' ? (
            <button
              type="button"
              className="btn-ghost"
              style={{ color: 'var(--rose-500)', borderColor: 'rgba(244, 63, 94, 0.3)', padding: '8px 12px' }}
              onClick={() => store.endCall(call.id)}
              title="End call and generate AI summary"
            >
              <PhoneOff size={16} />
            </button>
          ) : (
            <button
              type="button"
              className="btn-ghost"
              style={{ color: 'var(--orange-500)', borderColor: 'rgba(234, 88, 12, 0.3)', padding: '8px 12px' }}
              onClick={() => store.restartCall(call.id)}
              title="Restart call simulation"
            >
              <RotateCcw size={16} />
            </button>
          )}
        </div>
      </div>

      {/* 3. Main Call Monitor Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        
        {/* Left Column: Live Speech-to-Text Timeline & Barge-In Console */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Transcript Box */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '14px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Radio size={16} color="var(--orange-500)" />
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>Streaming Audio Transcript</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Zero-PII Tokenizer Active</span>
                {call.status !== 'completed' && (
                  <button
                    type="button"
                    className="btn-ghost"
                    style={{ fontSize: '11px', padding: '4px 8px', gap: '4px', color: 'var(--orange-500)', borderColor: 'rgba(234, 88, 12, 0.3)' }}
                    onClick={() => store.simulateNextUtterance(call.id)}
                    title="Simulate the next incoming live spoken sentence"
                  >
                    <Play size={11} />
                    <span>Simulate Next Utterance</span>
                  </button>
                )}
              </div>
            </div>

            {/* Utterance List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '440px', overflowY: 'auto', paddingRight: '4px' }}>
              {call.utterances?.map((ut) => {
                const isAgent = ut.speaker === 'agent';
                const isSupervisor = ut.speaker === 'supervisor' || ut.text.includes('[Supervisor');
                const isCustomer = ut.speaker === 'customer';

                return (
                  <div 
                    key={ut.id}
                    style={{
                      background: isSupervisor 
                        ? 'rgba(16, 185, 129, 0.08)' 
                        : isAgent 
                        ? 'rgba(234, 88, 12, 0.08)' 
                        : 'rgba(255, 255, 255, 0.03)',
                      border: `1px solid ${
                        isSupervisor 
                          ? 'rgba(16, 185, 129, 0.3)' 
                          : isAgent 
                          ? 'rgba(234, 88, 12, 0.25)' 
                          : 'var(--border-subtle)'
                      }`,
                      borderRadius: '10px',
                      padding: '12px 16px',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {isCustomer && <User size={13} color="#fff" />}
                        {isAgent && <Bot size={13} color="var(--orange-500)" />}
                        {isSupervisor && <UserCheck size={13} color="var(--green-500)" />}

                        <span style={{ 
                          fontSize: '12px', 
                          fontWeight: 700, 
                          color: isSupervisor ? 'var(--green-500)' : isAgent ? 'var(--orange-500)' : '#fff' 
                        }}>
                          {isSupervisor 
                            ? `${store.currentUser.name} (Live Supervisor)` 
                            : isAgent 
                            ? call.agent_name 
                            : call.customer_name}
                        </span>
                        <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>• {ut.timestamp}</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {ut.confidence && (
                          <span style={{ fontSize: '10px', color: 'var(--green-500)', fontWeight: 700 }}>
                            {(ut.confidence * 100).toFixed(0)}% Match
                          </span>
                        )}
                        {ut.intent && (
                          <span style={{ fontSize: '9.5px', background: 'rgba(255, 255, 255, 0.06)', padding: '2px 6px', borderRadius: '6px', color: 'var(--text-secondary)' }}>
                            {ut.intent.replace('_', ' ')}
                          </span>
                        )}
                        {/* Play individual utterance speech */}
                        <button
                          type="button"
                          className="btn-ghost"
                          style={{ padding: '2px 6px', fontSize: '10px', border: 'none', background: 'transparent' }}
                          onClick={() => speakText(ut.text, ut.speaker, ut.id)}
                          title="Listen to this spoken utterance"
                        >
                          <Volume2 size={12} color="var(--text-muted)" />
                        </button>
                      </div>
                    </div>

                    <div style={{ fontSize: '13.5px', lineHeight: 1.5, color: 'var(--text-primary)' }}>
                      {ut.text}
                    </div>
                  </div>
                );
              })}
              <div ref={transcriptEndRef} />
            </div>
          </div>

          {/* Interactive Supervisor Live Barge-In Console */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '14px', padding: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mic size={16} color="var(--orange-500)" />
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>
                  Supervisor Barge-In Speech Console
                </span>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={isWhisper} 
                  onChange={(e) => setIsWhisper(e.target.checked)} 
                  style={{ accentColor: 'var(--orange-500)' }}
                />
                <span>Whisper to Agent only (Private)</span>
              </label>
            </div>

            {/* Quick Prompt Pills */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', alignSelf: 'center' }}>Quick Speak:</span>
              {[
                'Assure 99.9% Enterprise SLA',
                'Offer dedicated onboarding session',
                'Verify secondary webhook secret',
                'Apply VIP cross-border discount',
              ].map((pill) => (
                <button
                  key={pill}
                  type="button"
                  className="btn-ghost"
                  style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '12px', borderColor: 'var(--border-subtle)' }}
                  onClick={() => handleQuickPrompt(pill)}
                >
                  {pill}
                </button>
              ))}
            </div>

            {/* Speech Input Form */}
            <form onSubmit={handleSupervisorSubmit} style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                className="composer-input"
                style={{ flex: 1, padding: '10px 14px', fontSize: '13px', borderRadius: '8px' }}
                placeholder={isWhisper ? 'Whisper coaching instruction to AI agent...' : `Speak into live audio stream as ${store.currentUser.name}...`}
                value={supervisorText}
                onChange={(e) => setSupervisorText(e.target.value)}
              />
              <button
                type="submit"
                id="btn-supervisor-speak"
                className="btn-primary"
                style={{
                  background: isWhisper ? 'var(--green-600)' : 'linear-gradient(135deg, #ea580c, #c2410c)',
                  gap: '6px',
                  padding: '10px 18px',
                }}
              >
                <Send size={14} />
                <span>{isWhisper ? 'Whisper' : 'Speak into Call'}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Audio Waveform, Telemetry & PII Redaction */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* Waveform Card */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '14px', padding: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mic size={16} color={store.isAudioMuted ? 'var(--text-muted)' : 'var(--green-500)'} />
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>Real-time Frequency Waveform</span>
              </div>
              <span style={{ fontSize: '10px', color: store.isAudioMuted ? 'var(--rose-500)' : 'var(--green-500)', fontWeight: 700 }}>
                {store.isAudioMuted ? 'MUTED' : 'OPUS ACTIVE'}
              </span>
            </div>

            <div 
              style={{
                background: 'rgba(0, 0, 0, 0.5)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '10px',
                height: '70px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                padding: '0 12px',
                marginBottom: '14px',
              }}
            >
              {store.waveformBars.map((val, i) => (
                <div 
                  key={i} 
                  className="waveform-bar" 
                  style={{ 
                    height: store.isAudioMuted ? '4px' : `${val}%`, 
                    width: '5px',
                    background: call.status === 'human_takeover' 
                      ? 'var(--green-500)' 
                      : call.status === 'escalating' 
                      ? 'var(--rose-500)' 
                      : 'var(--orange-500)',
                    transition: 'height 0.1s ease',
                  }} 
                />
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px' }}>
              <div style={{ background: 'var(--bg-app)', padding: '10px', borderRadius: '8px' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Audio Packet Loss</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--green-500)' }}>
                  {call.packet_loss ? `${(call.packet_loss * 100).toFixed(2)}%` : '0.01%'}
                </div>
              </div>
              <div style={{ background: 'var(--bg-app)', padding: '10px', borderRadius: '8px' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Sentiment Score</div>
                <div style={{ 
                  fontSize: '14px', 
                  fontWeight: 700, 
                  color: call.sentiment === 'positive' ? 'var(--green-500)' : call.sentiment === 'negative' ? 'var(--rose-500)' : '#fff' 
                }}>
                  {call.sentiment.toUpperCase()} ({call.sentiment_score || 0.92})
                </div>
              </div>
            </div>
          </div>

          {/* Call Completion / Wrap-Up AI Card */}
          {call.status === 'completed' && (
            <div className="animate-fade-in" style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '14px', padding: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <CheckCircle2 size={16} color="var(--green-500)" />
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>Post-Call AI Summary</span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '12px' }}>
                <strong>Resolution:</strong> Customer confirmed cross-border EDI requirements. Fallback to WhatsApp and bilingual support approved for staging trial.
              </p>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div>• Follow-up action: Email EDI payload specs to engineering lead</div>
                <div>• CRM sync: Updated deal value to $48,000 (Stage: Demo)</div>
              </div>
            </div>
          )}

          {/* Security & Zero-PII */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '14px', padding: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <ShieldCheck size={16} color="var(--orange-500)" />
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>Zero-PII Audio Redaction</span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '12px' }}>
              All spoken SSNs, credit card numbers, and banking routing codes are dynamically scrubbed in memory before persisting to the transcript database.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--green-500)', background: 'rgba(16, 185, 129, 0.1)', padding: '6px 10px', borderRadius: '6px' }}>
              <CheckCircle2 size={13} />
              <span>14 sensitive telemetry tokens masked in real-time</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
