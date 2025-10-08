import React, { useEffect, useState } from 'react'
import axios from 'axios'
import Timetable from './Timetable'

const API = import.meta.env.VITE_API_BASE || 'http://localhost:4000'

function useLocalSchedules(){
  const [list, setList] = useState(()=>{
    try{ return JSON.parse(localStorage.getItem('schedules_v3')||'[]') }catch(e){return []}
  })
  useEffect(()=> localStorage.setItem('schedules_v3', JSON.stringify(list)), [list])
  return [list, setList]
}

function timeToMinutes(t){
  const [hh,mm] = t.split(':').map(Number)
  return hh*60 + mm
}

export default function App(){
  const [schedules, setSchedules] = useLocalSchedules()
  const [form, setForm] = useState({subject:'',instructor:'',day:'Sunday',time:'08:00',duration:60,room:'',type:'Lecture',reminder:15})
  const [showTable, setShowTable] = useState(false)

  useEffect(()=>{
    if('Notification' in window && Notification.permission === 'default'){
      Notification.requestPermission().catch(()=>{})
    }
  },[])

  function overlapsExisting(day, start, end){
    return schedules.some(s=>{
      if(s.day !== day) return false
      const sStart = timeToMinutes(s.time)
      const sEnd = sStart + Number(s.duration || 60)
      // overlap if ranges intersect (not just touching)
      return !(end <= sStart || start >= sEnd)
    })
  }

  function add(){
    if(!form.subject) return alert('Subject required')
    const start = timeToMinutes(form.time)
    const end = start + Number(form.duration || 60)
    // exact same minute start collision
    if(schedules.find(s=> s.day===form.day && timeToMinutes(s.time)===start)){
      return alert('Conflict: another item already starts at the same minute on that day.')
    }
    // if fully overlapping, still allow but will layout side-by-side; requirement: if adding exactly same minute forbidden; else allow
    const item = {...form, id: Date.now().toString()}
    setSchedules(prev=> [...prev, item])
    setForm({subject:'',instructor:'',day:'Sunday',time:'08:00',duration:60,room:'',type:'Lecture',reminder:15})
  }

  async function uploadBackup(){
    try{
      const payload = { schedules, ts: Date.now() }
      const res = await axios.post(`${API}/api/upload-backup`, payload)
      alert('Uploaded: ' + (res.data.file || 'ok'))
    }catch(err){
      alert('Upload failed: ' + (err.message||err))
    }
  }

  function exportJSON(){
    const blob = new Blob([JSON.stringify({schedules}, null, 2)], {type:'application/json'})
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'schedules_backup.json'
    document.body.appendChild(a); a.click(); a.remove()
  }

  function importJSON(evt){
    const f = evt.target.files?.[0]; if(!f) return;
    const reader = new FileReader()
    reader.onload = e=>{
      try{
        const obj = JSON.parse(e.target.result)
        const arr = Array.isArray(obj) ? obj : obj.schedules || []
        const merged = [...schedules]
        arr.forEach(a=>{
          let candidate = {...a}
          if(!candidate.id) candidate.id = Date.now().toString() + Math.random().toString().slice(2,6)
          // avoid same-minute start collisions by bumping 1 minute if needed
          let start = timeToMinutes(candidate.time)
          while(merged.find(x=> x.day===candidate.day && timeToMinutes(x.time)===start)){
            start += 1
            const hh = String(Math.floor(start/60)).padStart(2,'0')
            const mm = String(start%60).padStart(2,'0')
            candidate.time = hh + ':' + mm
          }
          merged.push(candidate)
        })
        setSchedules(merged)
        alert('Imported ' + arr.length + ' items (merged)')
      }catch(e){ alert('Invalid JSON') }
    }
    reader.readAsText(f)
  }

  return (
    <div className="app">
      <div className="header">
        <div>
          <h2 className="title">Fullstack Schedule App v2</h2>
          <div className="subtitle">Neon timetable • minute-precision • animated</div>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button className="btn" onClick={exportJSON}>Export JSON</button>
          <button className="btn" onClick={()=> setShowTable(s=>!s)}>{showTable? 'Hide' : 'Show'} Timetable</button>
        </div>
      </div>

      <div className="card">
        <h3>Add Schedule</h3>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,alignItems:'center'}}>
          <input placeholder="Subject" value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})}/>
          <input placeholder="Instructor" value={form.instructor} onChange={e=>setForm({...form,instructor:e.target.value})}/>
          <select value={form.day} onChange={e=>setForm({...form,day:e.target.value})}>
            <option>Sunday</option><option>Monday</option><option>Tuesday</option><option>Wednesday</option><option>Thursday</option><option>Friday</option><option>Saturday</option>
          </select>
          <input type="time" value={form.time} onChange={e=>setForm({...form,time:e.target.value})}/>
          <input placeholder="Room" value={form.room} onChange={e=>setForm({...form,room:e.target.value})}/>
          <select value={form.type} onChange={e=>setForm({...form,type:e.target.value})}><option>Lecture</option><option>Section</option><option>Exam</option></select>
          <input type="number" value={form.duration} onChange={e=>setForm({...form,duration: Number(e.target.value)})} min="5" />
          <div style={{display:'flex',gap:8}}>
            <button className="btn" onClick={add}>Add</button>
            <button className="btn" onClick={uploadBackup}>Upload Backup</button>
            <label className="btn" style={{cursor:'pointer',padding:'8px 10px'}}>
              Import JSON<input type="file" accept=".json" onChange={importJSON} style={{display:'none'}}/>
            </label>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Schedules ({schedules.length})</h3>
        <div style={{display:'grid',gap:6}}>
          {schedules.map(s=> <div key={s.id} className="schedule-item">
            <div style={{fontWeight:700}}>{s.subject} <small className="muted">({s.type})</small></div>
            <div className="muted">{s.day} • {s.time} • {s.duration} min • {s.room} • {s.instructor}</div>
            <div style={{marginTop:6,display:'flex',gap:8}}>
              <button className="btn" onClick={()=>{
                navigator.clipboard.writeText(JSON.stringify(s, null, 2)).then(()=>alert('Copied'))
              }}>Copy JSON</button>
              <button className="btn" onClick={()=>{
                const rest = schedules.filter(x=> x.id !== s.id); setSchedules(rest)
              }}>Delete</button>
            </div>
          </div>)}
        </div>
      </div>

      {showTable && <div className="card">
        <Timetable schedules={schedules} />
      </div>}
    </div>
  )
}
