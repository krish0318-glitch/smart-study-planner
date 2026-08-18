import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./App.css";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
const api = axios.create({ baseURL: API });

function Auth({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const r = await api.post(`/users/${mode}`, form);
      localStorage.setItem("token", r.data.token); localStorage.setItem("user", JSON.stringify(r.data.user)); onLogin(r.data.user);
    } catch (err) { setError(err.response?.data?.message || "Something went wrong"); }
    finally { setLoading(false); }
  };
  return <div className="auth-page"><div className="auth-card">
    <div className="brand"><span>📚</span><div><h1>Smart Study Planner</h1><p>Plan smarter. Study better.</p></div></div>
    <div className="auth-tabs"><button className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>Login</button><button className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>Create account</button></div>
    <form onSubmit={submit}>{mode === "register" && <label>Name<input required value={form.name} onChange={e => setForm({...form,name:e.target.value})} placeholder="Your name" /></label>}
      <label>Email<input required type="email" value={form.email} onChange={e => setForm({...form,email:e.target.value})} placeholder="you@example.com" /></label>
      <label>Password<input required minLength="6" type="password" value={form.password} onChange={e => setForm({...form,password:e.target.value})} placeholder="Minimum 6 characters" /></label>
      {error && <div className="error">{error}</div>}<button className="primary full" disabled={loading}>{loading ? "Please wait..." : mode === "login" ? "Sign in →" : "Create account →"}</button>
    </form><p className="hint">Built with React • Node.js • Express • MongoDB</p>
  </div></div>;
}

function App() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("user") || "null"));
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [tasks, setTasks] = useState([]); const [stats, setStats] = useState(null); const [view, setView] = useState("dashboard");
  const [filter, setFilter] = useState("all"); const [search, setSearch] = useState(""); const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ title:"", subject:"", description:"", priority:"Medium", dueDate:"", estimatedTime:60 });
  const authConfig = { headers: { Authorization: `Bearer ${token}` } };
  const load = async () => { if (!token) return; setLoading(true); try { const [t,s] = await Promise.all([api.get("/tasks",authConfig),api.get("/tasks/stats/summary",authConfig)]); setTasks(t.data); setStats(s.data); } catch(e) { if(e.response?.status===401) logout(); } finally { setLoading(false); } };
  useEffect(() => { load(); }, [token]);
  const logout = () => { localStorage.clear(); setToken(null); setUser(null); };
  const addTask = async e => { e.preventDefault(); if(!form.title.trim()) return; try { await api.post("/tasks/add",form,authConfig); setForm({title:"",subject:"",description:"",priority:"Medium",dueDate:"",estimatedTime:60}); load(); } catch(e){ alert(e.response?.data?.message || "Could not add task"); } };
  const toggle = async t => { try { await api.put(`/tasks/${t._id}`,{completed:!t.completed},authConfig); load(); } catch(e){ alert("Could not update task"); } };
  const remove = async id => { if(!window.confirm("Delete this task?")) return; await api.delete(`/tasks/${id}`,authConfig); load(); };
  const filtered = useMemo(() => tasks.filter(t => (filter === "all" || (filter === "completed" ? t.completed : !t.completed)) && (`${t.title} ${t.subject}`.toLowerCase().includes(search.toLowerCase()))), [tasks,filter,search]);
  const today = new Date().toISOString().slice(0,10); const todayTasks = tasks.filter(t => t.dueDate?.slice(0,10) === today);
  const smartPlan = () => { const pending = tasks.filter(t=>!t.completed).sort((a,b)=>(a.dueDate||"9999").localeCompare(b.dueDate||"9999")); if(!pending.length) return ["🎉 All your tasks are complete! Great work."]; return pending.slice(0,5).map((t,i)=>`${i+1}. ${t.subject || "General"}: ${t.title} — ${t.priority} priority${t.dueDate ? ` • due ${new Date(t.dueDate).toLocaleDateString()}` : ""}`); };
  if(!token) return <Auth onLogin={u=>{setUser(u);setToken(localStorage.getItem("token"));}} />;
  return <div className="app-shell"><aside className="sidebar"><div className="side-brand"><span>📚</span><b>Study<span>Planner</span></b></div><nav><button className={view==="dashboard"?"selected":""} onClick={()=>setView("dashboard")}>⌂ Dashboard</button><button className={view==="tasks"?"selected":""} onClick={()=>setView("tasks")}>✓ Tasks</button><button className={view==="analytics"?"selected":""} onClick={()=>setView("analytics")}>◈ Analytics</button></nav><div className="side-bottom"><div className="user-mini"><div className="avatar">{user?.name?.[0]?.toUpperCase()||"U"}</div><div><b>{user?.name || "Student"}</b><small>{user?.email}</small></div></div><button onClick={logout} className="logout">↪ Logout</button></div></aside>
  <main className="main"><header><div><p className="eyebrow">YOUR PRODUCTIVITY HUB</p><h1>Good to see you, {user?.name?.split(" ")[0] || "Student"} 👋</h1><p className="muted">Stay consistent and make progress every day.</p></div><div className="date-chip">📅 {new Date().toLocaleDateString(undefined,{weekday:"short",month:"short",day:"numeric"})}</div></header>
  {view === "dashboard" && <><section className="stat-grid"><Stat icon="📌" label="Total Tasks" value={stats?.total||0}/><Stat icon="✅" label="Completed" value={stats?.completed||0}/><Stat icon="⏳" label="Pending" value={stats?.pending||0}/><Stat icon="🎯" label="Completion" value={`${stats?.completionRate||0}%`}/></section><section className="grid-2"><div className="panel"><div className="panel-head"><div><h2>Quick Add</h2><p className="muted">Create your next study task.</p></div></div><form className="task-form" onSubmit={addTask}><input required placeholder="What do you need to study?" value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/><div className="form-row"><input placeholder="Subject" value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})}/><select value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}><option>Low</option><option>Medium</option><option>High</option></select></div><div className="form-row"><input type="date" value={form.dueDate} onChange={e=>setForm({...form,dueDate:e.target.value})}/><input type="number" min="0" placeholder="Minutes" value={form.estimatedTime} onChange={e=>setForm({...form,estimatedTime:e.target.value})}/></div><textarea placeholder="Short description (optional)" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/><button className="primary">＋ Add task</button></form></div><div className="panel smart"><div><span className="ai-badge">✦ SMART PLAN</span><h2>Today's Focus</h2><p className="muted">Prioritized from your pending tasks.</p></div><div className="focus-list">{smartPlan().map((x,i)=><div className="focus-item" key={i}>{x}</div>)}</div><button className="secondary" onClick={()=>setView("tasks")}>View all tasks →</button></div></section><section className="panel"><div className="panel-head"><div><h2>Today's Tasks</h2><p className="muted">{todayTasks.length} task{todayTasks.length!==1?'s':''} scheduled today.</p></div><button className="secondary" onClick={()=>setView("tasks")}>Manage tasks</button></div><TaskList tasks={todayTasks.slice(0,5)} toggle={toggle} remove={remove} empty="No tasks due today. Enjoy the extra time! 🎉"/></section></>}
  {view === "tasks" && <section className="panel"><div className="panel-head"><div><h2>Task Manager</h2><p className="muted">Organize your study workload.</p></div><button className="primary" onClick={()=>setView("dashboard")}>＋ New task</button></div><div className="toolbar"><input placeholder="🔎 Search tasks or subjects..." value={search} onChange={e=>setSearch(e.target.value)}/><div>{["all","pending","completed"].map(f=><button key={f} className={filter===f?"filter active":"filter"} onClick={()=>setFilter(f)}>{f[0].toUpperCase()+f.slice(1)}</button>)}</div></div><TaskList tasks={filtered} toggle={toggle} remove={remove} empty="No matching tasks found."/></section>}
  {view === "analytics" && <section className="analytics"><div className="panel progress-panel"><h2>Progress Overview</h2><div className="big-progress"><div className="ring" style={{"--progress":`${stats?.completionRate||0}%`}}><strong>{stats?.completionRate||0}%</strong><small>complete</small></div><div><p><b>{stats?.completed||0}</b> completed tasks</p><p><b>{stats?.pending||0}</b> tasks remaining</p><p><b>{Math.round((stats?.totalMinutes||0)/60*10)/10}h</b> estimated study time</p></div></div></div><div className="panel"><h2>Subject Performance</h2>{(stats?.subjects||[]).length ? stats.subjects.map(s=><div className="subject-row" key={s.subject}><div><b>{s.subject}</b><span>{s.completed}/{s.total} completed</span></div><div className="bar"><i style={{width:`${s.progress}%`}}/></div><strong>{s.progress}%</strong></div>) : <p className="muted">Add tasks with subjects to see analytics.</p>}</div></section>}
  {loading && <div className="loading">Syncing...</div>}</main></div>;
}
function Stat({icon,label,value}){return <div className="stat"><span>{icon}</span><div><small>{label}</small><strong>{value}</strong></div></div>}
function TaskList({tasks,toggle,remove,empty}){return <div className="task-list">{tasks.length?tasks.map(t=><div className={`task ${t.completed?'done':''}`} key={t._id}><button className="check" onClick={()=>toggle(t)}>{t.completed?'✓':''}</button><div className="task-info"><b>{t.title}</b><div><span>{t.subject||"General"}</span><span className={`priority ${t.priority?.toLowerCase()}`}>{t.priority}</span>{t.dueDate&&<span>📅 {new Date(t.dueDate).toLocaleDateString()}</span>}</div></div><small>{t.estimatedTime||0}m</small><button className="delete" onClick={()=>remove(t._id)}>×</button></div>):<div className="empty">{empty}</div>}</div>}
export default App;
