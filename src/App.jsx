import { useState, useEffect } from 'react';

const TEAM = {
  'Nick': ['Carlo', 'Build Club'],
  'Matt': ['Meridian', 'Haast'],
  'Molly': ['Quarterzip'],
  'Tash': ['Lorikeet', 'KC Ventures']
};

const MONTHS = ['January', 'February', 'March'];

const EMOTIONAL_CODES = ['Power', 'Order', 'Curiosity', 'Status', 'Tranquility', 'Saving', 'Vengeance'];

const SPRINT_DATES = {
  'January': [
    { label: 'W3-4', range: 'Mon 20th – Fri 31st Jan', close: 'Fri 17th Jan, 3pm' }
  ],
  'February': [
    { label: 'W1-2', range: 'Mon 3rd – Fri 14th Feb', close: 'Fri 31st Jan, 3pm' },
    { label: 'W3-4', range: 'Mon 17th – Fri 28th Feb', close: 'Fri 14th Feb, 3pm' }
  ],
  'March': [
    { label: 'W1-2', range: 'Mon 3rd – Fri 14th Mar', close: 'Fri 28th Feb, 3pm' },
    { label: 'W3-4', range: 'Mon 17th – Fri 28th Mar', close: 'Fri 14th Mar, 3pm' }
  ]
};

const getMonthConfig = (month) => {
  const sprints = SPRINT_DATES[month] || [];
  if (month === 'January') {
    return { sprints, reportingPeriods: ['Monthly'] };
  }
  return { sprints, reportingPeriods: ['1st-2nd Week', '3rd-4th Week'] };
};

const initData = () => {
  const d = {};
  Object.keys(TEAM).forEach(strat => {
    d[strat] = {};
    MONTHS.forEach(month => {
      const config = getMonthConfig(month);
      d[strat][month] = {
        planning: {
          narrativeArc: { done: false, notes: '' },
          emotionalCodes: { done: false, selected: [] },
          capacityConfirmed: { done: false },
          calendarSent: { done: false },
          customerSignoff: { done: false }
        },
        sprints: {},
        reporting: {}
      };
      config.sprints.forEach(sp => {
        d[strat][month].sprints[sp.label] = {
          scopeNotes: '',
          scopeLocked: false,
          allScheduled: false,
          qaComplete: false,
          zeroTypos: false,
          cleanRunway: false
        };
      });
      config.reportingPeriods.forEach(rp => {
        d[strat][month].reporting[rp] = {
          performanceSignals: false,
          qualitativeWins: false,
          nextSteps: false,
          notes: ''
        };
      });
    });
  });
  return d;
};

const STORAGE_KEY = 'kindling-q1-tracker';

export default function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [strat, setStrat] = useState('Nick');
  const [month, setMonth] = useState('January');
  const [view, setView] = useState('checklist');

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setData(JSON.parse(stored));
      } catch {
        setData(initData());
      }
    } else {
      setData(initData());
    }
    setLoading(false);
  }, []);

  const save = (d) => {
    setData(d);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
  };

  const update = (path, value) => {
    const d = JSON.parse(JSON.stringify(data));
    const keys = path.split('.');
    let obj = d[strat][month];
    for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
    obj[keys[keys.length - 1]] = value;
    save(d);
  };

  const toggle = (path) => {
    const d = JSON.parse(JSON.stringify(data));
    const keys = path.split('.');
    let obj = d[strat][month];
    for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
    obj[keys[keys.length - 1]] = !obj[keys[keys.length - 1]];
    save(d);
  };

  const getProgress = (strategist, m) => {
    if (!data?.[strategist]?.[m]) return { done: 0, total: 0, pct: 0 };
    const md = data[strategist][m];
    let done = 0, total = 0;
    
    Object.values(md.planning).forEach(v => {
      total++;
      if (typeof v === 'object' ? v.done : v) done++;
    });
    
    Object.values(md.sprints).forEach(sp => {
      ['scopeLocked', 'allScheduled', 'qaComplete', 'zeroTypos', 'cleanRunway'].forEach(k => {
        total++; if (sp[k]) done++;
      });
    });
    
    Object.values(md.reporting).forEach(rp => {
      ['performanceSignals', 'qualitativeWins', 'nextSteps'].forEach(k => {
        total++; if (rp[k]) done++;
      });
    });
    
    return { done, total, pct: total > 0 ? Math.round((done/total)*100) : 0 };
  };

  const getDueToday = () => {
    const now = new Date();
    const day = now.getDate();
    const dow = now.getDay();
    const alerts = [];
    
    if (day >= 15 && day < 20) alerts.push({ level: 'warning', msg: 'Monthly calendar due to customer by 20th' });
    if (day >= 20 && day <= 23) alerts.push({ level: 'urgent', msg: 'Customer sign-off must be locked by 23rd' });
    if (dow === 5) alerts.push({ level: 'urgent', msg: 'SPRINT CLOSE: All content must be scheduled by 3pm today' });
    if (dow === 1) alerts.push({ level: 'info', msg: 'Sprint start: Confirm scope is locked for this fortnight' });
    
    return alerts;
  };

  if (loading) return <div style={{ fontFamily: 'Georgia, serif', padding: 40, textAlign: 'center' }}>Loading...</div>;

  const md = data?.[strat]?.[month];
  const config = getMonthConfig(month);
  const alerts = getDueToday();

  const Pill = ({ active, onClick, children }) => (
    <button onClick={onClick} style={{
      padding: '6px 14px', borderRadius: 20, border: '1px solid #000', cursor: 'pointer',
      backgroundColor: active ? '#000' : '#fff', color: active ? '#fff' : '#000',
      fontSize: 13, fontFamily: 'system-ui', transition: 'all 0.15s'
    }}>{children}</button>
  );

  const Check = ({ checked, onChange, label, sub }) => (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0', borderBottom: '1px solid #f5f5f5' }}>
      <div onClick={onChange} style={{
        width: 22, height: 22, borderRadius: 6, border: '2px solid #000', cursor: 'pointer',
        backgroundColor: checked ? '#000' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, marginTop: 1
      }}>
        {checked && <span style={{ color: '#fff', fontSize: 14 }}>✓</span>}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15, textDecoration: checked ? 'line-through' : 'none', opacity: checked ? 0.5 : 1 }}>{label}</div>
        {sub && <div style={{ fontSize: 13, opacity: 0.5, marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );

  const Section = ({ title, sub, children }) => (
    <section style={{ marginBottom: 32 }}>
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', margin: 0, opacity: 0.4 }}>{title}</h3>
        {sub && <p style={{ fontSize: 13, opacity: 0.6, margin: '4px 0 0' }}>{sub}</p>}
      </div>
      {children}
    </section>
  );

  const ProgressBar = ({ pct }) => (
    <div style={{ height: 6, backgroundColor: '#eee', borderRadius: 3, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', backgroundColor: pct === 100 ? '#22c55e' : '#000', transition: 'width 0.3s' }} />
    </div>
  );

  return (
    <div style={{ fontFamily: 'Georgia, serif', maxWidth: 720, margin: '0 auto', padding: '24px 16px' }}>
      <header style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', opacity: 0.4, margin: '0 0 4px' }}>Kindling CS</p>
        <h1 style={{ fontSize: 24, fontWeight: 400, margin: 0 }}>Q1 2026 Tracker</h1>
      </header>

      {alerts.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          {alerts.map((a, i) => (
            <div key={i} style={{
              padding: '10px 14px', marginBottom: 6, borderRadius: 8, fontSize: 14,
              backgroundColor: a.level === 'urgent' ? '#fef2f2' : a.level === 'warning' ? '#fffbeb' : '#f0fdf4',
              borderLeft: `3px solid ${a.level === 'urgent' ? '#ef4444' : a.level === 'warning' ? '#f59e0b' : '#22c55e'}`
            }}>{a.msg}</div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <Pill active={view === 'checklist'} onClick={() => setView('checklist')}>Checklist</Pill>
        <Pill active={view === 'overview'} onClick={() => setView('overview')}>Team Overview</Pill>
      </div>

      {view === 'overview' ? (
        <div style={{ display: 'grid', gap: 16 }}>
          {Object.entries(TEAM).map(([name, customers]) => (
            <div key={name} style={{ padding: 16, border: '1px solid #e5e5e5', borderRadius: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontWeight: 600 }}>{name}</span>
                <span style={{ fontSize: 13, opacity: 0.5 }}>{customers.join(', ')}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 12 }}>
                {MONTHS.map(m => {
                  const p = getProgress(name, m);
                  return (
                    <div key={m} onClick={() => { setStrat(name); setMonth(m); setView('checklist'); }}
                      style={{ padding: 10, borderRadius: 6, cursor: 'pointer', border: '1px solid #eee', backgroundColor: p.pct === 100 ? '#f0fdf4' : '#fff' }}>
                      <div style={{ fontSize: 12, opacity: 0.5, marginBottom: 6 }}>{m}</div>
                      <ProgressBar pct={p.pct} />
                      <div style={{ fontSize: 11, opacity: 0.5, marginTop: 4 }}>{p.done}/{p.total}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
            {Object.keys(TEAM).map(s => <Pill key={s} active={strat === s} onClick={() => setStrat(s)}>{s}</Pill>)}
          </div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
            {MONTHS.map(m => <Pill key={m} active={month === m} onClick={() => setMonth(m)}>{m}</Pill>)}
          </div>
          <p style={{ fontSize: 13, opacity: 0.5, marginBottom: 20 }}>Customers: {TEAM[strat].join(', ')}</p>

          {md && (
            <>
              <div style={{ marginBottom: 24 }}>
                <ProgressBar pct={getProgress(strat, month).pct} />
                <p style={{ fontSize: 12, opacity: 0.5, marginTop: 6 }}>{getProgress(strat, month).pct}% complete</p>
              </div>

              <Section title="Monthly Planning" sub="Calendar to customer by 20th · Sign-off by 23rd">
                <Check checked={md.planning.narrativeArc.done} onChange={() => toggle('planning.narrativeArc.done')} label="Narrative arc defined" sub="What's the story this month?" />
                <textarea
                  value={md.planning.narrativeArc.notes}
                  onChange={e => update('planning.narrativeArc.notes', e.target.value)}
                  placeholder="Describe the monthly narrative arc..."
                  style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #e5e5e5', fontSize: 14, fontFamily: 'Georgia, serif', resize: 'vertical', minHeight: 60, marginBottom: 12, boxSizing: 'border-box' }}
                />
                
                <Check checked={md.planning.emotionalCodes.done} onChange={() => toggle('planning.emotionalCodes.done')} label="Emotional codes selected" sub="Primary codes for this month's content" />
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16, marginLeft: 34 }}>
                  {EMOTIONAL_CODES.map(code => {
                    const sel = md.planning.emotionalCodes.selected?.includes(code);
                    return (
                      <button key={code} onClick={() => {
                        const curr = md.planning.emotionalCodes.selected || [];
                        update('planning.emotionalCodes.selected', sel ? curr.filter(c => c !== code) : [...curr, code]);
                      }} style={{
                        padding: '4px 10px', borderRadius: 12, fontSize: 12, cursor: 'pointer',
                        border: sel ? '1px solid #000' : '1px solid #ddd',
                        backgroundColor: sel ? '#000' : '#fff', color: sel ? '#fff' : '#666'
                      }}>{code}</button>
                    );
                  })}
                </div>

                <Check checked={md.planning.capacityConfirmed} onChange={() => toggle('planning.capacityConfirmed')} label="Capacity confirmed" sub="Team can deliver this scope" />
                <Check checked={md.planning.calendarSent} onChange={() => toggle('planning.calendarSent')} label="Monthly calendar sent to customer" sub="Due by 20th" />
                <Check checked={md.planning.customerSignoff} onChange={() => toggle('planning.customerSignoff')} label="Customer sign-off locked" sub="Due by 23rd" />
              </Section>

              {config.sprints.map(sprint => {
                const sp = md.sprints[sprint.label];
                
                return (
                  <Section key={sprint.label} title={`Sprint ${sprint.label}`} sub={`${sprint.range} · Close: ${sprint.close}`}>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ fontSize: 13, opacity: 0.6, display: 'block', marginBottom: 6 }}>What's in scope this sprint?</label>
                      <textarea
                        value={sp.scopeNotes}
                        onChange={e => update(`sprints.${sprint.label}.scopeNotes`, e.target.value)}
                        placeholder="List the content pieces, shoots, edits..."
                        style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #e5e5e5', fontSize: 14, fontFamily: 'Georgia, serif', resize: 'vertical', minHeight: 70, boxSizing: 'border-box' }}
                      />
                    </div>

                    <Check checked={sp.scopeLocked} onChange={() => toggle(`sprints.${sprint.label}.scopeLocked`)} label="Scope locked" sub="No changes without a swap or deferral" />
                    <Check checked={sp.allScheduled} onChange={() => toggle(`sprints.${sprint.label}.allScheduled`)} label="All content scheduled" sub="2 weeks of content ready to go" />
                    <Check checked={sp.qaComplete} onChange={() => toggle(`sprints.${sprint.label}.qaComplete`)} label="QA complete" />
                    <Check checked={sp.zeroTypos} onChange={() => toggle(`sprints.${sprint.label}.zeroTypos`)} label="Zero typos verified" />
                    <Check checked={sp.cleanRunway} onChange={() => toggle(`sprints.${sprint.label}.cleanRunway`)} label="Clean runway for customer" />
                  </Section>
                );
              })}

              <Section title="Reporting" sub={month === 'January' ? 'Monthly report' : 'Fortnightly reports'}>
                {config.reportingPeriods.map(rp => {
                  const r = md.reporting[rp];
                  return (
                    <div key={rp} style={{ marginBottom: 20 }}>
                      {config.reportingPeriods.length > 1 && <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, opacity: 0.7 }}>{rp}</p>}
                      <Check checked={r.performanceSignals} onChange={() => toggle(`reporting.${rp}.performanceSignals`)} label="Performance signals included" />
                      <Check checked={r.qualitativeWins} onChange={() => toggle(`reporting.${rp}.qualitativeWins`)} label="Screenshots / qualitative wins" />
                      <Check checked={r.nextSteps} onChange={() => toggle(`reporting.${rp}.nextSteps`)} label='"What this enables next" documented' />
                      <textarea value={r.notes} onChange={e => update(`reporting.${rp}.notes`, e.target.value)}
                        placeholder="Report notes..." style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #e5e5e5', fontSize: 13, resize: 'vertical', minHeight: 50, marginTop: 8, boxSizing: 'border-box' }} />
                    </div>
                  );
                })}
              </Section>
            </>
          )}
        </>
      )}

      <footer style={{ marginTop: 32, paddingTop: 16, borderTop: '1px solid #eee', fontSize: 11, opacity: 0.4 }}>
        Q1 2026 · Kindling Creative Strategy
      </footer>
    </div>
  );
}