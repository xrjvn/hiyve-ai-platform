import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

function formatICSDate(date) {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

import { signIn, signOut, useSession } from 'next-auth/react'

function AuthButtons() {
  const { data: session } = useSession()

  if (session) {
    return (
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 13 }}>Signed in as <strong>{session.user.email}</strong></p>
        <button
          onClick={() => signOut()}
          style={{
            fontSize: 13,
            padding: '6px 12px',
            background: '#ddd',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer'
          }}
        >
          Sign Out
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => signIn('google')}
      style={{
        fontSize: 13,
        padding: '6px 12px',
        background: '#4285F4',
        color: '#fff',
        border: 'none',
        borderRadius: 4,
        cursor: 'pointer'
      }}
    >
      Sign in with Google
    </button>
  )
}

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [role, setRole] = useState('');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [showEventForm, setShowEventForm] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventDuration, setEventDuration] = useState('');

  const chatEndRef = useRef(null);

  useEffect(() => {
    const fetchHistory = async () => {
      const res = await axios.get('/api/history');
      setHistory(res.data || []);
    };
    fetchHistory();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async () => {
    if (!input || !role) return;
    setLoading(true);
    const newMessage = { role: 'user', content: input };
    const updatedMessages = [...messages, newMessage];

    const res = await axios.post('/api/agent', {
      role,
      messages: updatedMessages,
    });

    const aiMessage = { role: 'assistant', content: res.data.result };
    setMessages([...updatedMessages, aiMessage]);
    setInput('');
    setLoading(false);
  };

  const handleSendEmail = async () => {
    const responseMsg = messages.reverse().find(m => m.role === 'assistant')?.content;
    if (!responseMsg) return;
    const parts = responseMsg.split('\n\n');
    const subject = parts[0].replace(/^Subject:\s*/i, '').trim();
    const body = parts.slice(1).join('\n\n').trim();
    await axios.post('/api/send-email', { subject, body });
    alert('Email sent!');
  };

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'Arial, sans-serif' }}>
      
      {/* Sidebar */}
      <aside style={{
        width: 250,
        background: '#f4f4f4',
        borderRight: '1px solid #ddd',
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 20 }}>🧠 AI Agent</h1>
          <AuthButtons />
          <label style={{ fontWeight: 'bold', fontSize: 14 }}>Select Role:</label>
          <select
            value={role}
            onChange={e => setRole(e.target.value)}
            style={{ width: '100%', padding: 8, marginTop: 6, marginBottom: 20 }}
          >
            <option value="">Choose...</option>
            <option value="executive">Executive Assistant</option>
            <option value="social">Social Media Manager</option>
          </select>

          <div>
            <h3 style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 10 }}>Chat History</h3>
            <ul style={{ fontSize: 13, listStyle: 'none', paddingLeft: 0 }}>
              {history.map((h, i) => (
                <li key={i} style={{
                  marginBottom: 10,
                  background: '#fff',
                  padding: 10,
                  borderRadius: 6,
                  border: '1px solid #ddd'
                }}>
                  <strong>{h.role}</strong>: {h.prompt.slice(0, 40)}...
                </li>
              ))}
            </ul>
          </div>
        </div>

        <button
          onClick={() => { setMessages([]); setInput(''); }}
          style={{
            marginTop: 20,
            fontSize: 14,
            background: '#eee',
            border: '1px solid #ccc',
            padding: '8px 12px',
            cursor: 'pointer'
          }}
        >
          Clear Chat
        </button>
      </aside>

      {/* Chat Area */}
      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        background: '#fff'
      }}>

        {/* Chat Messages */}
        <div style={{
          flex: 1,
          padding: 30,
          overflowY: 'auto',
          background: '#f9f9f9'
        }}>
          {messages.map((m, i) => (
            <div
              key={i}
              className="bubble"
              style={{
                maxWidth: '80%',
                marginBottom: 15,
                padding: 12,
                borderRadius: 10,
                background: m.role === 'user' ? '#DCF0FF' : '#F0F0F0',
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                animation: 'slideInFade 0.3s ease-out',
              }}
            >
              <div style={{ whiteSpace: 'pre-wrap', fontSize: 14 }}>
                {m.content}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <div style={{
          borderTop: '1px solid #ddd',
          padding: 20,
          background: '#fff'
        }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type your message..."
            rows={2}
            style={{
              width: '100%',
              padding: 10,
              borderRadius: 6,
              fontSize: 14,
              border: '1px solid #ccc',
              marginBottom: 10
            }}
          />
          <button
            onClick={handleSubmit}
            disabled={!input || !role || loading}
            style={{
              padding: '10px 20px',
              background: loading ? '#999' : '#0070f3',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: 'bold',
              width: '100%'
            }}
          >
            {loading ? 'Thinking...' : 'Send'}
          </button>

          {role === 'executive' && messages.some(m => m.role === 'assistant') && (
  <>
    <button
      onClick={handleSendEmail}
      style={{
        marginTop: 10,
        width: '100%',
        padding: '10px 20px',
        background: '#28a745',
        color: '#fff',
        border: 'none',
        borderRadius: 6,
        cursor: 'pointer',
        fontWeight: 'bold'
      }}
    >
      📧 Send as Email
    </button>

    {/* 📅 Export Calendar Button */}
    <button
      onClick={async () => {
        const latest = [...messages].reverse().find(m => m.role === 'assistant')?.content;
        if (!latest) return;

        const lines = latest.split('\n').filter(l =>
          /\d{4}|\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b/i.test(l)
        );

        const events = lines.map((line, i) => {
          const start = new Date(); // Just using current time as placeholder
          const end = new Date(start.getTime() + 60 * 60 * 1000); // 1hr later

          return `
BEGIN:VEVENT
UID:event-${i}@agent.ai
DTSTAMP:${formatICSDate(new Date())}
DTSTART:${formatICSDate(start)}
DTEND:${formatICSDate(end)}
SUMMARY:${line.trim()}
END:VEVENT`;
        }).join('\n');

        const ics = `BEGIN:VCALENDAR
VERSION:2.0
CALSCALE:GREGORIAN
${events}
END:VCALENDAR`;

        const blob = new Blob([ics], { type: 'text/calendar' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'schedule.ics';
        link.click();
      }}
      style={{
        marginTop: 10,
        width: '100%',
        padding: '10px 20px',
        background: '#ff9800',
        color: '#fff',
        border: 'none',
        borderRadius: 6,
        cursor: 'pointer',
        fontWeight: 'bold'
      }}
    >
      📅 Export as Calendar
    </button>
    <button
  onClick={() => {
    const latest = [...messages].reverse().find(m => m.role === 'assistant')?.content;
    if (!latest) return;

    // Extract first event-ish line
    const eventLine = latest.split('\n').find(l => l.trim());
    const title = encodeURIComponent(eventLine.slice(0, 100));
    
    // Sample time: now + 1hr
    const start = new Date();
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const format = d => d.toISOString().replace(/[-:]|(\.\d{3})/g, '');
    
    const url = `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${format(start)}/${format(end)}&details=Created+by+AI+Agent`;

    window.open(url, '_blank');
  }}
  style={{
    marginTop: 10,
    width: '100%',
    padding: '10px 20px',
    background: '#db4437',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontWeight: 'bold'
  }}
>
  🗓 Add to Google Calendar
</button>
  </>
  
)}

{role === 'executive' && (
  <>
    <div style={{
      border: '1px solid #ccc',
      padding: '12px',
      borderRadius: '8px',
      background: '#fefefe',
      margin: '20px 30px 0',
      fontSize: 14
    }}>
      <h3 style={{ marginBottom: 6 }}>📅 <strong>Smart Calendar Builder</strong></h3>
      <p>Try: <em>“Schedule team sync every Monday at 10am for July”</em></p>
      <button
        onClick={() => setShowEventForm(prev => !prev)}
        style={{
          marginTop: 10,
          padding: '6px 12px',
          borderRadius: 4,
          background: '#0070f3',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          fontSize: 13
        }}
      >
        {showEventForm ? 'Close Manual Form' : '📅 Add Manual Event'}
      </button>
    </div>

    {showEventForm && (
      <div style={{
        border: '1px solid #ccc',
        padding: '12px',
        borderRadius: '8px',
        background: '#fff',
        margin: '10px 30px',
        fontSize: 14
      }}>
        <label>Title:</label>
        <input value={eventTitle} onChange={e => setEventTitle(e.target.value)} style={{ width: '100%', padding: 6, marginBottom: 6 }} />
        <label>Date (YYYY-MM-DD):</label>
        <input value={eventDate} onChange={e => setEventDate(e.target.value)} style={{ width: '100%', padding: 6, marginBottom: 6 }} />
        <label>Time (e.g. 14:00):</label>
        <input value={eventTime} onChange={e => setEventTime(e.target.value)} style={{ width: '100%', padding: 6, marginBottom: 6 }} />
        <label>Duration (e.g. 1 hour):</label>
        <input value={eventDuration} onChange={e => setEventDuration(e.target.value)} style={{ width: '100%', padding: 6, marginBottom: 10 }} />
        
        <button
          onClick={() => {
            const manualMsg = `Schedule event titled "${eventTitle}" on ${eventDate} at ${eventTime} for ${eventDuration}.`;
            setMessages(prev => [...prev, { role: 'user', content: manualMsg }]);
            setInput(manualMsg);
            setShowEventForm(false);
            setEventTitle('');
            setEventDate('');
            setEventTime('');
            setEventDuration('');
          }}
          style={{
            padding: '8px 12px',
            background: '#28a745',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          ➕ Submit Event to Agent
        </button>
      </div>
    )}
    {/* 📝 Meeting Notes Assistant */}
    <div style={{
      border: '1px solid #ccc',
      padding: '12px',
      borderRadius: '8px',
      background: '#fefefe',
      margin: '20px 30px 0',
      fontSize: 14
    }}>
      <h3 style={{ marginBottom: 6 }}>📝 <strong>Meeting Notes Assistant</strong></h3>
      <p>Upload or paste raw meeting notes to get a summary or action items.</p>

      <textarea
        placeholder="Paste your meeting notes here..."
        rows={6}
        value={input}
        onChange={e => setInput(e.target.value)}
        style={{
          width: '100%',
          padding: 10,
          borderRadius: 6,
          border: '1px solid #ccc',
          marginTop: 10,
          marginBottom: 10
        }}
      />

      <button
        onClick={handleSubmit}
        disabled={!input || loading}
        style={{
          padding: '10px 16px',
          background: '#0070f3',
          color: '#fff',
          border: 'none',
          borderRadius: 6,
          cursor: 'pointer',
          fontWeight: 'bold',
          marginBottom: 10
        }}
      >
        {loading ? 'Summarizing...' : '🧠 Summarize Notes'}
      </button>

      <input
        type="file"
        accept=".txt,.pdf"
        onChange={async (e) => {
          const file = e.target.files[0];
          if (!file) return;

          const formData = new FormData();
          formData.append('file', file);

          setLoading(true);
          const res = await fetch('/api/parse-notes', {
            method: 'POST',
            body: formData
          });

          const data = await res.json();
          setInput(data.text || '');
          setLoading(false);
        }}
        style={{ marginTop: 10 }}
      />
    </div>
  </>
)}

        </div>
      </main>
    </div>
  );
}
