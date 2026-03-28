// src/pages/labs/JanePanel.jsx
// Floating command-palette style AI assistant
// Changes Needed !

import { useState, useRef, useEffect } from "react";

const SUGGESTIONS = [
  "Explain this file",
  "Find bugs in my code",
  "Write a README for this project",
  "Refactor this function",
  "Add TypeScript types",
  "Generate unit tests",
  "Optimize performance",
  "Add error handling",
];

export default function JanePanel({ onClose, activeFile }){
  const [input,setInput]   = useState("");
  const [msgs,setMsgs]     = useState([
    { role:"assistant", content:"Hey — I'm Jane. Ask me anything about your code, or pick a suggestion below." }
  ]);
  const [loading,setLoading] = useState(false);
  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);

  useEffect(()=>{ inputRef.current?.focus(); },[]);
  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:"smooth"}); },[msgs]);

  // Close on Escape
  useEffect(()=>{
    const fn=e=>{ if(e.key==="Escape")onClose(); };
    window.addEventListener("keydown",fn);
    return()=>window.removeEventListener("keydown",fn);
  },[onClose]);

  const send = async (text) => {
    const q = (text||input).trim();
    if(!q||loading) return;
    setInput("");

    const context = activeFile
      ? `The user has "${activeFile.name}" open.\n\nFile content:\n\`\`\`\n${activeFile.content?.slice(0,4000)||""}\n\`\`\`\n\n`
      : "";

    const userMsg = { role:"user", content:q };
    setMsgs(m=>[...m,userMsg]);
    setLoading(true);

    try {
      // Use Electron IPC to call Anthropic API (key stays in main process)
      const reply = await window.studio?.jane?.ask(
        "You are Jane, a concise coding assistant inside Visrodeck Studio.",
        context + q,
        msgs
      );
      setMsgs(m=>[...m,{role:"assistant",content:reply||"Sorry, no response."}]);
    } catch(e){
      setMsgs(m=>[...m,{role:"assistant",content:`Error: ${e.message}`}]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{CSS}</style>
      <div className="jp-overlay" onClick={onClose}>
        <div className="jp-panel" onClick={e=>e.stopPropagation()}>
          {/* Header */}
          <div className="jp-header">
            <div className="jp-brand">
              <span className="jp-icon">✦</span>
              <span className="jp-name">JANE</span>
              <span className="jp-sub">AI Assistant</span>
            </div>
            {activeFile&&(
              <div className="jp-context">
                <span className="jp-ctx-dot"/>
                {activeFile.name}
              </div>
            )}
            <button className="jp-close" onClick={onClose}>✕</button>
          </div>

          {/* Messages */}
          <div className="jp-msgs">
            {msgs.map((m,i)=>(
              <div key={i} className={`jp-msg jp-msg-${m.role}`}>
                <span className="jp-msg-avatar">
                  {m.role==="assistant"?"✦":"You"}
                </span>
                <div className="jp-msg-body">
                  {m.content.split("```").map((chunk,ci)=>(
                    ci%2===0
                      ? <span key={ci} className="jp-msg-text">{chunk}</span>
                      : <pre key={ci} className="jp-msg-code"><code>{chunk.replace(/^[a-z]+\n/,"")}</code></pre>
                  ))}
                </div>
              </div>
            ))}
            {loading&&(
              <div className="jp-msg jp-msg-assistant">
                <span className="jp-msg-avatar">✦</span>
                <div className="jp-typing"><span/><span/><span/></div>
              </div>
            )}
            <div ref={bottomRef}/>
          </div>

          {/* Suggestions */}
          {msgs.length<2&&(
            <div className="jp-suggestions">
              {SUGGESTIONS.map(s=>(
                <button key={s} className="jp-sug" onClick={()=>send(s)}>{s}</button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="jp-input-row">
            <textarea
              ref={inputRef}
              className="jp-input"
              placeholder="Ask Jane anything about your code…"
              value={input}
              onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>{ if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();} }}
              rows={2}
            />
            <button className="jp-send" onClick={()=>send()} disabled={!input.trim()||loading}>
              {loading?<span className="jp-spin"/>:"↑"}
            </button>
          </div>
          <div className="jp-footer">Enter to send · Shift+Enter for newline · Esc to close</div>
        </div>
      </div>
    </>
  );
}

const CSS=`
.jp-overlay{position:fixed;inset:0;background:rgba(0,0,0,.6);backdrop-filter:blur(6px);z-index:2000;display:flex;align-items:flex-start;justify-content:center;padding-top:80px;animation:jp-fade .12s ease;}
@keyframes jp-fade{from{opacity:0}to{opacity:1}}
.jp-panel{width:660px;max-height:70vh;background:#111113;border:1px solid #2a2a2e;border-radius:8px;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 32px 96px rgba(0,0,0,.9),0 0 0 1px rgba(184,127,212,.1);animation:jp-in .12s ease;}
@keyframes jp-in{from{transform:translateY(-12px) scale(.97)}to{transform:translateY(0) scale(1)}}

.jp-header{display:flex;align-items:center;gap:12px;padding:14px 18px;border-bottom:1px solid #1e1e22;flex-shrink:0;}
.jp-brand{display:flex;align-items:center;gap:8px;}
.jp-icon{font-size:16px;color:#b87fd4;}
.jp-name{font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:700;letter-spacing:.12em;color:#fff;}
.jp-sub{font-family:'JetBrains Mono',monospace;font-size:9px;color:#444;}
.jp-context{display:flex;align-items:center;gap:5px;font-family:'JetBrains Mono',monospace;font-size:10px;color:#666;background:#161618;border:1px solid #2a2a2e;padding:2px 8px;border-radius:2px;margin-left:auto;}
.jp-ctx-dot{width:4px;height:4px;border-radius:50%;background:#b87fd4;}
.jp-close{margin-left:8px;background:transparent;border:none;color:#444;font-size:14px;cursor:pointer;padding:4px;border-radius:2px;transition:all .12s;outline:none;}
.jp-close:hover{color:#e2e2e2;background:#222;}

.jp-msgs{flex:1;overflow-y:auto;padding:16px 18px;display:flex;flex-direction:column;gap:14px;}
.jp-msgs::-webkit-scrollbar{width:3px;}
.jp-msgs::-webkit-scrollbar-thumb{background:#2a2a2e;}
.jp-msg{display:flex;gap:10px;align-items:flex-start;}
.jp-msg-avatar{font-family:'JetBrains Mono',monospace;font-size:9px;font-weight:700;flex-shrink:0;padding-top:2px;width:28px;}
.jp-msg-assistant .jp-msg-avatar{color:#b87fd4;}
.jp-msg-user .jp-msg-avatar{color:#888;text-align:right;}
.jp-msg-user{flex-direction:row-reverse;}
.jp-msg-user .jp-msg-body{background:#1c1c1f;border:1px solid #2a2a2e;border-radius:6px 0 6px 6px;padding:8px 12px;}
.jp-msg-assistant .jp-msg-body{max-width:calc(100% - 40px);}
.jp-msg-text{font-size:13px;color:#d4d4d4;line-height:1.65;white-space:pre-wrap;font-family:'Space Grotesk',sans-serif;}
.jp-msg-code{background:#0a0a0b;border:1px solid #1e1e22;border-radius:4px;padding:10px 12px;margin:6px 0;overflow-x:auto;}
.jp-msg-code code{font-family:'JetBrains Mono',monospace;font-size:11px;color:#e2e2e2;line-height:1.6;}

.jp-typing{display:flex;gap:4px;padding:8px 4px;align-items:center;}
.jp-typing span{width:5px;height:5px;border-radius:50%;background:#b87fd4;animation:jpty .9s ease-in-out infinite;}
.jp-typing span:nth-child(2){animation-delay:.2s;}
.jp-typing span:nth-child(3){animation-delay:.4s;}
@keyframes jpty{0%,60%,100%{opacity:.2;transform:scale(1)}30%{opacity:1;transform:scale(1.2)}}

.jp-suggestions{display:flex;flex-wrap:wrap;gap:6px;padding:0 18px 12px;flex-shrink:0;}
.jp-sug{background:#161618;border:1px solid #2a2a2e;color:#666;font-family:'JetBrains Mono',monospace;font-size:10px;padding:5px 10px;border-radius:2px;cursor:pointer;transition:all .12s;outline:none;}
.jp-sug:hover{border-color:#b87fd444;color:#b87fd4;background:#1c1c1f;}

.jp-input-row{display:flex;align-items:flex-end;gap:8px;padding:12px 18px;border-top:1px solid #1e1e22;flex-shrink:0;}
.jp-input{flex:1;background:#0a0a0b;border:1px solid #2a2a2e;color:#e2e2e2;font-family:'JetBrains Mono',monospace;font-size:12px;padding:9px 12px;border-radius:4px;resize:none;outline:none;transition:border-color .15s;line-height:1.5;}
.jp-input:focus{border-color:#b87fd444;}
.jp-input::placeholder{color:#333;}
.jp-send{width:36px;height:36px;background:#b87fd4;border:none;border-radius:4px;color:#fff;font-size:16px;cursor:pointer;transition:all .12s;outline:none;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.jp-send:hover:not(:disabled){background:#c897e4;}
.jp-send:disabled{opacity:.3;cursor:not-allowed;}
.jp-spin{display:inline-block;width:12px;height:12px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:jpspin .6s linear infinite;}
@keyframes jpspin{to{transform:rotate(360deg)}}
.jp-footer{text-align:center;font-family:'JetBrains Mono',monospace;font-size:8px;color:#2a2a2e;padding:6px 18px;flex-shrink:0;}
`;
