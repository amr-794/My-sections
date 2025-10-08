import React, { useMemo } from 'react'

const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
const DAY_COLORS = ['#0fffc1','#39ff14','#7bffb2','#8affc1','#6bff9a','#73ffad','#59ffb0']

function toMin(t){ const [hh,mm]=t.split(':').map(Number); return hh*60+mm }

function layoutForDay(items){
  const evs = items.map(it=>{
    return { ...it, start: toMin(it.time), end: toMin(it.time) + (Number(it.duration)||60) }
  }).sort((a,b)=> a.start - b.start)
  const columns = []
  evs.forEach(ev=>{
    let placed = false
    for(let c=0;c<columns.length;c++){
      const last = columns[c][columns[c].length-1]
      if(ev.start >= last.end){ columns[c].push(ev); placed=true; break }
    }
    if(!placed) columns.push([ev])
  })
  const flat = []
  columns.forEach((col,idx)=> col.forEach(ev=> flat.push({...ev, col: idx, totalCols: columns.length})))
  return flat
}

export default function Timetable({schedules}){
  const perDay = useMemo(()=>{
    const map = {}
    DAYS.forEach(d=> map[d]=[])
    schedules.forEach(s=>{
      if(!map[s.day]) map[s.day]=[]
      map[s.day].push(s)
    })
    const layout = {}
    DAYS.forEach(d=>{
      layout[d] = layoutForDay(map[d] || [])
    })
    return layout
  },[schedules])

  return (
    <div className="timetable-root">
      <div className="timetable-header">
        <div className="time-column-header">Time</div>
        {DAYS.map((d,i)=> <div className="day-column-header" key={d}>
          <div className="day-name">{d}</div>
        </div>)}
      </div>

      <div className="timetable-body">
        <div className="time-column">
          {Array.from({length:24}).map((_,h)=> <div key={h} className="time-cell">{String(h).padStart(2,'0')}:00</div>)}
        </div>

        {DAYS.map((d,di)=> <div className="day-column" key={d}>
          <div className="day-grid">
            {Array.from({length:24}).map((_,h)=> <div key={h} className="hour-line" style={{top: `${h*60}px`}}></div>)}

            {perDay[d].map(ev=>{
              const top = ev.start
              const height = Math.max(30, ev.end - ev.start)
              const widthPercent = 100 / ev.totalCols
              const leftPercent = ev.col * widthPercent
              const bg = 'linear-gradient(180deg, rgba(57,255,20,0.12), rgba(57,255,20,0.06))'
              return (
                <div key={ev.id} className="event-block" style={{
                  top: top + 'px',
                  height: height + 'px',
                  width: `calc(${widthPercent}% - 6px)`,
                  left: `calc(${leftPercent}% + 3px)`,
                  borderLeft: `4px solid ${DAY_COLORS[di] || '#39ff14'}`,
                  background: bg,
                  boxShadow: '0 6px 18px rgba(0,0,0,0.5)',
                }}>
                  <div className="ev-title">{ev.subject}</div>
                  <div className="ev-sub">{ev.type} • {String(Math.floor(ev.start/60)).padStart(2,'0')}:{String(ev.start%60).padStart(2,'0')} • {ev.room}</div>
                </div>
              )
            })}
          </div>
        </div>)}
      </div>
      <div className="legend">Tip: timetable shows 24 hours (00:00–23:59). Events starting at the exact same minute are blocked. Overlaps are shown side-by-side.</div>
    </div>
  )
}
