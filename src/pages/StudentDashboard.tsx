import { useMemo, useState } from 'react'
import type { AppStore } from '../state/useAppData'
import type { Day } from '../types'
import type { Page } from '../types-ui'
import { DAY_NAMES, PERIODS } from '../data/seed'
import { periodLabel, todayKey } from '../lib/timetable'
import { Icon } from '../components/Icon'
import { TermSwitch } from '../components/TermSwitch'

interface StudentDashboardProps {
  store: AppStore
  onNavigate: (page: Page) => void
}

interface AttendanceItem {
  code: string
  title: string
  faculty: string
  credits: number
  total: number
  attended: number
  percentage: number
}

type StudentTab = 'overview' | 'timetable' | 'courses' | 'attendance' | 'calendar'

const STUDENT_TABS: { id: StudentTab; label: string; icon: 'dashboard' | 'grid' | 'book' | 'clock-check' | 'calendar' }[] = [
  { id: 'overview', label: 'Overview', icon: 'dashboard' },
  { id: 'timetable', label: 'Timetable', icon: 'grid' },
  { id: 'courses', label: 'Courses', icon: 'book' },
  { id: 'attendance', label: 'Attendance', icon: 'clock-check' },
  { id: 'calendar', label: 'Calendar', icon: 'calendar' },
]

// Sample attendance data tailored to CSE-2B courses
const SAMPLE_ATTENDANCE: AttendanceItem[] = [
  { code: 'CS301', title: 'Data Structures & Algorithms', faculty: 'Dr. Anita Sharma', credits: 4, total: 36, attended: 32, percentage: 88.9 },
  { code: 'CS302', title: 'Database Management Systems', faculty: 'Prof. Rajesh Iyer', credits: 4, total: 34, attended: 29, percentage: 85.3 },
  { code: 'CS303', title: 'Operating Systems', faculty: 'Prof. Rajesh Iyer', credits: 4, total: 32, attended: 23, percentage: 71.9 }, // <75% warning!
  { code: 'CS304', title: 'Computer Networks', faculty: 'Dr. Suresh Nair', credits: 3, total: 28, attended: 24, percentage: 85.7 },
  { code: 'CS305P', title: 'DBMS Laboratory', faculty: 'Prof. Rajesh Iyer', credits: 2, total: 16, attended: 15, percentage: 93.8 },
  { code: 'MA301', title: 'Discrete Mathematics', faculty: 'Dr. K. Meenakshi', credits: 3, total: 30, attended: 26, percentage: 86.7 },
]

export function StudentDashboard({ store, onNavigate }: StudentDashboardProps) {
  const { data, activeTerm, termConfig, setTerm, calendarEvents } = store
  const [activeTab, setActiveTab] = useState<StudentTab>('overview')

  const studentProfile = {
    studentId: '24CSE042',
    name: 'Aarav Singhania',
    section: 'CSE-2B',
    department: 'Computer Science & Engineering',
    semester: 'Semester 6',
    academicYear: termConfig.academicYear || '2026–27',
  }

  const today = todayKey()
  const currentDays: Day[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  // Lectures for the student's enrolled section (CSE-2B) in the active term
  const enrolledSlots = useMemo(() => {
    return data.slots.filter(
      (s) => s.section === studentProfile.section && (s.term ?? 'odd') === activeTerm,
    )
  }, [data.slots, studentProfile.section, activeTerm])

  // Today's lectures sorted by period
  const todaySlots = useMemo(() => {
    return enrolledSlots
      .filter((s) => s.day === today)
      .sort((a, b) => a.period - b.period)
  }, [enrolledSlots, today])

  // Current time to calculate ongoing vs upcoming lectures
  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()

  const enrichedTodaySlots = useMemo(() => {
    return todaySlots.map((slot) => {
      const periodObj = PERIODS.find((p) => p.period === slot.period)
      const course = data.courses.find((c) => c.id === slot.courseId)
      const faculty = data.faculty.find((f) => f.id === slot.facultyId)
      const room = data.rooms.find((r) => r.id === slot.roomId)

      const start = periodObj?.start ?? '00:00'
      const end = periodObj?.end ?? '00:00'
      const [sh, sm] = start.split(':').map(Number)
      const [eh, em] = end.split(':').map(Number)
      const startMin = sh * 60 + sm
      const endMin = eh * 60 + em

      const isOngoing = currentMinutes >= startMin && currentMinutes < endMin
      const isPast = currentMinutes >= endMin
      const isUpcoming = currentMinutes < startMin

      return {
        slot,
        periodObj,
        course,
        faculty,
        room,
        isOngoing,
        isPast,
        isUpcoming,
      }
    })
  }, [todaySlots, data.courses, data.faculty, data.rooms, currentMinutes])

  // Next upcoming lecture (first upcoming slot today, or next in upcoming days)
  const nextLecture = useMemo(() => {
    // 1. Check today's upcoming
    const todayNext = enrichedTodaySlots.find((s) => s.isUpcoming || s.isOngoing)
    if (todayNext) {
      return {
        day: today,
        ...todayNext,
      }
    }
    // 2. Otherwise look at subsequent days
    const todayIndex = currentDays.indexOf(today)
    for (let offset = 1; offset < 7; offset++) {
      const nextDay = currentDays[(todayIndex + offset) % currentDays.length]
      const nextDaySlots = enrolledSlots
        .filter((s) => s.day === nextDay)
        .sort((a, b) => a.period - b.period)
      if (nextDaySlots.length > 0) {
        const firstSlot = nextDaySlots[0]
        return {
          day: nextDay,
          slot: firstSlot,
          periodObj: PERIODS.find((p) => p.period === firstSlot.period),
          course: data.courses.find((c) => c.id === firstSlot.courseId),
          faculty: data.faculty.find((f) => f.id === firstSlot.facultyId),
          room: data.rooms.find((r) => r.id === firstSlot.roomId),
          isOngoing: false,
          isPast: false,
          isUpcoming: true,
        }
      }
    }
    return null
  }, [enrichedTodaySlots, currentDays, today, enrolledSlots, data.courses, data.faculty, data.rooms])

  // Enrolled courses for this section
  const enrolledCourses = useMemo(() => {
    const courseIds = new Set(enrolledSlots.map((s) => s.courseId))
    // Fallback: if slots are few in this term, include courses whose semester matches or all active
    const list = data.courses.filter((c) => courseIds.has(c.id))
    if (list.length === 0) {
      return data.courses.slice(0, 6)
    }
    return list
  }, [enrolledSlots, data.courses])

  // Attendance stats
  const attendanceOverall = useMemo(() => {
    const totalConducted = SAMPLE_ATTENDANCE.reduce((acc, cur) => acc + cur.total, 0)
    const totalAttended = SAMPLE_ATTENDANCE.reduce((acc, cur) => acc + cur.attended, 0)
    const pct = totalConducted > 0 ? (totalAttended / totalConducted) * 100 : 0
    const lowCount = SAMPLE_ATTENDANCE.filter((a) => a.percentage < 75).length
    return {
      totalConducted,
      totalAttended,
      percentage: Math.round(pct * 10) / 10,
      lowCount,
    }
  }, [])

  // Academic calendar filtered for students (upcoming events in active term)
  const studentEvents = useMemo(() => {
    return calendarEvents
      .filter((e) => !e.term || e.term === activeTerm)
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [calendarEvents, activeTerm])

  const upcomingHolidays = studentEvents.filter((e) => e.category === 'Holiday')
  const upcomingExams = studentEvents.filter((e) => e.category === 'Exam')
  const academicMilestones = studentEvents.filter((e) => e.category !== 'Holiday' && e.category !== 'Exam')

  return (
    <div className="page student-portal stagger">
      {/* Student Profile Hero Header */}
      <section className="dashboard-hero student-hero" aria-labelledby="student-dash-title">
        <div className="hero-copy">
          <div className="hero-kicker">
            <span className="badge-velvet">Student Portal</span>
            <span>{studentProfile.academicYear} · {termConfig.label}</span>
          </div>

          <h2 id="student-dash-title" className="hero-title">
            Welcome, {studentProfile.name.split(' ')[0]} 👋
          </h2>
          <p className="hero-sub">
            Enrolled in <strong>{studentProfile.department}</strong>, Section <strong>{studentProfile.section}</strong>. Roll No:{' '}
            <strong className="mono">{studentProfile.studentId}</strong>.
          </p>

          <div className="hero-stats" aria-live="polite">
            <div className="hero-stat">
              <strong className="mono">{String(todaySlots.length).padStart(2, '0')}</strong>
              <span>lectures today</span>
            </div>
            <div className="hero-stat">
              <strong className="mono">{enrolledSlots.length}</strong>
              <span>weekly lectures</span>
            </div>
            <div className="hero-stat">
              <strong className="mono">{enrolledCourses.length}</strong>
              <span>enrolled courses</span>
            </div>
            <div className="hero-stat">
              <strong className="mono" style={{ color: attendanceOverall.percentage < 75 ? 'var(--red, #e04545)' : 'inherit' }}>
                {attendanceOverall.percentage}%
              </strong>
              <span>overall attendance</span>
            </div>
          </div>

          <div className="hero-actions">
            <button type="button" className="btn btn-primary" onClick={() => setActiveTab('timetable')}>
              <Icon name="grid" size={15} /> My timetable
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => setActiveTab('attendance')}>
              <Icon name="clock-check" size={15} /> Attendance
            </button>
          </div>
        </div>

        <div className="hero-term" aria-label="Semester selection">
          <div>
            <h3>Active Term</h3>
            <p className="muted small">Switch between odd and even semester timetables &amp; courses.</p>
          </div>
          <TermSwitch value={activeTerm} onChange={setTerm} />
          <div className="term-meta">
            <span>
              <Icon name="calendar" size={15} />
              <strong>{termConfig.label}</strong>
            </span>
            <span>
              <Icon name="user" size={15} /> {studentProfile.semester} ({studentProfile.section})
            </span>
          </div>
          <p className="muted small" style={{ lineHeight: 1.5 }}>
            Read-only student access. Your course registrations and class timetables are synchronized with the university ERP.
          </p>
        </div>
      </section>

      {/* Section tabs — one clean strip instead of buttons crowding the hero */}
      <div className="student-tabs" role="tablist" aria-label="Student sections">
        {STUDENT_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={activeTab === t.id}
            className={`student-tab${activeTab === t.id ? ' is-active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            <Icon name={t.icon} size={15} />
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* ============================================================== */}
      {/* TAB 1: OVERVIEW                                                */}
      {/* ============================================================== */}
      {activeTab === 'overview' && (
        <div className="stagger">
          {/* Key Metrics / Highlights Bar */}
          <section className="stats" aria-label="Student overview stats">
            <div className="stat">
              <p className="stat-label">Next Lecture</p>
              <p className="stat-value" style={{ fontSize: '20px' }}>
                {nextLecture ? (
                  <>
                    {nextLecture.course?.code ?? 'Lecture'}
                    <span className="stat-unit" style={{ display: 'block', fontSize: '13px', marginTop: '2px' }}>
                      {DAY_NAMES[nextLecture.day]}, {periodLabel(nextLecture.slot.period).slice(0, 5)}
                    </span>
                  </>
                ) : (
                  'No upcoming lectures'
                )}
              </p>
              <p className="stat-note">
                {nextLecture
                  ? `${nextLecture.room?.name ?? 'Classroom'} · ${nextLecture.faculty?.name ?? 'Faculty'}`
                  : 'All scheduled lectures completed for this week'}
              </p>
            </div>

            <div className="stat">
              <p className="stat-label">Today&apos;s Lectures</p>
              <p className="stat-value">
                {todaySlots.length}
                <span className="stat-unit">lectures scheduled</span>
              </p>
              <p className="stat-note">
                {todaySlots.length > 0 ? `Starts at ${periodLabel(todaySlots[0].period).slice(0, 5)}` : 'No classes scheduled today'}
              </p>
            </div>

            <div className="stat">
              <p className="stat-label">Weekly Schedule</p>
              <p className="stat-value">
                {enrolledSlots.length}
                <span className="stat-unit">hours / week</span>
              </p>
              <p className="stat-note">Across {enrolledCourses.length} enrolled subjects</p>
            </div>

            <div className="stat">
              <p className="stat-label">Attendance Warning</p>
              <p className="stat-value" style={{ color: attendanceOverall.lowCount > 0 ? '#c2410c' : '#15803d' }}>
                {attendanceOverall.lowCount > 0 ? `${attendanceOverall.lowCount} Subject` : 'All Clean'}
                <span className="stat-unit">{attendanceOverall.lowCount > 0 ? 'below 75%' : '≥ 75%'}</span>
              </p>
              <p className="stat-note">
                {attendanceOverall.lowCount > 0
                  ? 'Immediate attention required for mandatory eligibility'
                  : 'Meets minimum attendance requirement'}
              </p>
            </div>
          </section>

          <div className="dash-grid">
            <div className="dash-main">
              {/* Today's Schedule Card */}
              <section className="panel">
                <header className="panel-head">
                  <div>
                    <h3>Today&apos;s Schedule</h3>
                    <p>
                      {DAY_NAMES[today]}, Section {studentProfile.section}
                    </p>
                  </div>
                  <button type="button" className="link-btn" onClick={() => setActiveTab('timetable')}>
                    Full weekly timetable <Icon name="arrow-right" size={15} />
                  </button>
                </header>

                {enrichedTodaySlots.length === 0 ? (
                  <div className="empty compact">
                    <span className="empty-icon">
                      <Icon name="calendar" size={22} />
                    </span>
                    <p className="empty-title">No lectures scheduled today</p>
                    <p className="muted">You have no classes allotted for section {studentProfile.section} today. Enjoy your study time!</p>
                  </div>
                ) : (
                  <ul className="today-list">
                    {enrichedTodaySlots.map(({ slot, periodObj, course, faculty, room, isOngoing, isPast }) => (
                      <li
                        key={slot.id}
                        className={`today-item${isOngoing ? ' is-active-slot' : ''}${isPast ? ' is-past-slot' : ''}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '16px',
                          padding: '12px 14px',
                          borderBottom: '1px solid var(--border-subtle, #f1f5f9)',
                          borderLeft: isOngoing ? '4px solid var(--primary, #2563eb)' : undefined,
                          background: isOngoing ? 'rgba(37, 99, 235, 0.05)' : undefined,
                        }}
                      >
                        <div className="today-time" style={{ minWidth: '100px', display: 'flex', flexDirection: 'column' }}>
                          <strong className="mono" style={{ fontSize: '13.5px', color: 'var(--text-main, #0f172a)' }}>
                            {periodObj?.start ?? periodLabel(slot.period).slice(0, 5)}
                          </strong>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)' }}>
                            to {periodObj?.end ?? ''}
                          </span>
                        </div>
                        <div className="today-body" style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <strong>{course?.title || course?.code}</strong>
                            <span className="chip-code">{course?.code}</span>
                            {isOngoing && (
                              <span className="badge" style={{ background: '#dbeafe', color: '#1e40af', fontWeight: 600 }}>
                                Ongoing Lecture
                              </span>
                            )}
                            {isPast && <span className="muted small">Completed</span>}
                          </div>
                          <p className="muted small" style={{ marginTop: '3px' }}>
                            Faculty: <strong>{faculty?.name || 'Assigned Lecturer'}</strong> · Room: <strong>{room?.name}</strong> ({room?.building})
                          </p>
                        </div>
                        <div className="today-actions">
                          <span className="badge-ghost">{room?.kind || 'Classroom'}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* Attendance Quick Snapshot */}
              <section className="panel" style={{ marginTop: '20px' }}>
                <header className="panel-head">
                  <div>
                    <h3>Attendance Summary</h3>
                    <p>Current semester progress across all enrolled subjects</p>
                  </div>
                  <button type="button" className="link-btn" onClick={() => setActiveTab('attendance')}>
                    View detailed attendance <Icon name="arrow-right" size={15} />
                  </button>
                </header>

                <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {SAMPLE_ATTENDANCE.slice(0, 4).map((att) => {
                    const isLow = att.percentage < 75
                    return (
                      <div key={att.code} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px' }}>
                          <span>
                            <strong>{att.code}</strong> — {att.title}
                          </span>
                          <span style={{ fontWeight: 600, color: isLow ? '#dc2626' : '#16a34a' }}>
                            {att.attended}/{att.total} ({att.percentage}%) {isLow ? '⚠️ Below 75%' : ''}
                          </span>
                        </div>
                        <div style={{ width: '100%', height: '8px', background: 'var(--surface-sunk, #f1f5f9)', borderRadius: '999px', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${Math.min(100, att.percentage)}%`,
                              height: '100%',
                              background: isLow ? '#ef4444' : '#22c55e',
                              borderRadius: '999px',
                              transition: 'width 0.4s ease',
                            }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            </div>

            {/* Side Panel: Academic Milestones & Student Card */}
            <aside className="dash-side">
              <section className="panel">
                <header className="panel-head">
                  <h3>Enrolled Courses</h3>
                  <button type="button" className="link-btn" onClick={() => setActiveTab('courses')}>
                    All ({enrolledCourses.length})
                  </button>
                </header>
                <ul className="free-rooms-list" style={{ padding: '8px 16px' }}>
                  {enrolledCourses.slice(0, 5).map((c) => {
                    const fac = data.faculty.find((f) => f.id === c.facultyId)
                    return (
                      <li key={c.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <strong style={{ fontSize: '14px', display: 'block' }}>{c.code}</strong>
                            <small className="muted" style={{ display: 'block' }}>
                              {c.title}
                            </small>
                            <small style={{ color: 'var(--text-muted)' }}>{fac?.name}</small>
                          </div>
                          <span className="badge-ghost">{c.credits} cr</span>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </section>

              <section className="panel" style={{ marginTop: '20px' }}>
                <header className="panel-head">
                  <h3>Upcoming Milestones</h3>
                  <button type="button" className="link-btn" onClick={() => setActiveTab('calendar')}>
                    Calendar
                  </button>
                </header>
                <ul style={{ padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {studentEvents.slice(0, 4).map((ev) => (
                    <li key={ev.id} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      <div
                        style={{
                          padding: '6px 8px',
                          borderRadius: '8px',
                          background: ev.category === 'Exam' ? '#fee2e2' : ev.category === 'Holiday' ? '#dcfce7' : '#e0e7ff',
                          color: ev.category === 'Exam' ? '#991b1b' : ev.category === 'Holiday' ? '#166534' : '#3730a3',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          textAlign: 'center',
                          minWidth: '58px',
                        }}
                      >
                        {ev.category}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <strong style={{ fontSize: '13.5px', display: 'block' }}>{ev.title}</strong>
                        <span className="muted small" style={{ display: 'block' }}>
                          {ev.date} {ev.endDate ? `– ${ev.endDate}` : ''}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            </aside>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: MY TIMETABLE                                            */}
      {/* ============================================================== */}
      {activeTab === 'timetable' && (
        <section className="panel stagger" aria-label="Student weekly timetable">
          <header className="panel-head" style={{ flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3>My Weekly Timetable</h3>
              <p>
                Weekly schedule for Section <strong>{studentProfile.section}</strong> (Monday to Saturday)
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="badge" style={{ background: '#dbeafe', color: '#1e40af' }}>
                Today: {DAY_NAMES[today]}
              </span>
              <span className="badge-ghost">{enrolledSlots.length} Total Lectures</span>
            </div>
          </header>

          <div style={{ padding: '16px', overflowX: 'auto' }}>
            <table className="tt-grid" style={{ minWidth: '880px', width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ width: '90px', padding: '12px 10px', background: 'var(--surface-sunk)' }}>Day</th>
                  {PERIODS.map((p) => (
                    <th key={p.period} style={{ padding: '12px 8px', textAlign: 'center', background: 'var(--surface-sunk)' }}>
                      <div style={{ fontWeight: 600, fontSize: '13.5px' }}>Period {p.period}</div>
                      <div className="muted small" style={{ fontSize: '11px', marginTop: '2px' }}>
                        {p.start} – {p.end}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentDays.map((day) => {
                  const isCurrentDay = day === today
                  return (
                    <tr
                      key={day}
                      style={{
                        background: isCurrentDay ? 'rgba(37, 99, 235, 0.04)' : undefined,
                        borderLeft: isCurrentDay ? '4px solid var(--primary, #2563eb)' : undefined,
                      }}
                    >
                      <td
                        style={{
                          padding: '12px 10px',
                          fontWeight: isCurrentDay ? 700 : 600,
                          color: isCurrentDay ? 'var(--primary, #2563eb)' : 'inherit',
                          verticalAlign: 'middle',
                          borderBottom: '1px solid var(--border)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {DAY_NAMES[day]}
                        {isCurrentDay && (
                          <span style={{ display: 'block', fontSize: '10.5px', color: 'var(--primary, #2563eb)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Today
                          </span>
                        )}
                      </td>
                      {PERIODS.map((p) => {
                        const slot = enrolledSlots.find((s) => s.day === day && s.period === p.period)
                        if (!slot) {
                          return (
                            <td
                              key={p.period}
                              style={{
                                padding: '10px 8px',
                                textAlign: 'center',
                                borderBottom: '1px solid var(--border)',
                                color: 'var(--text-muted)',
                                fontSize: '12px',
                                background: 'rgba(0,0,0,0.01)',
                              }}
                            >
                              —
                            </td>
                          )
                        }

                        const course = data.courses.find((c) => c.id === slot.courseId)
                        const faculty = data.faculty.find((f) => f.id === slot.facultyId)
                        const room = data.rooms.find((r) => r.id === slot.roomId)

                        // Highlight ongoing & upcoming when looking at today
                        const [sh, sm] = p.start.split(':').map(Number)
                        const [eh, em] = p.end.split(':').map(Number)
                        const startMin = sh * 60 + sm
                        const endMin = eh * 60 + em
                        const isOngoing = isCurrentDay && currentMinutes >= startMin && currentMinutes < endMin
                        const isUpcoming = isCurrentDay && currentMinutes < startMin

                        return (
                          <td
                            key={p.period}
                            style={{
                              padding: '8px',
                              borderBottom: '1px solid var(--border)',
                              verticalAlign: 'top',
                            }}
                          >
                            <div
                              style={{
                                padding: '8px',
                                borderRadius: '8px',
                                background: isOngoing
                                  ? 'rgba(37, 99, 235, 0.12)'
                                  : isUpcoming
                                    ? 'rgba(234, 245, 255, 0.9)'
                                    : 'var(--surface-sunk, #f8fafc)',
                                border: isOngoing
                                  ? '1.5px solid #2563eb'
                                  : isUpcoming
                                    ? '1px solid #bfdbfe'
                                    : '1px solid var(--border)',
                                boxShadow: isOngoing ? '0 2px 8px rgba(37,99,235,0.18)' : 'none',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '3px',
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <strong style={{ fontSize: '13px', color: isOngoing ? '#1e40af' : 'inherit' }}>
                                  {course?.code}
                                </strong>
                                {isOngoing && (
                                  <span style={{ fontSize: '10px', background: '#2563eb', color: '#fff', padding: '1px 5px', borderRadius: '4px', fontWeight: 600 }}>
                                    NOW
                                  </span>
                                )}
                              </div>
                              <span style={{ fontSize: '11.5px', color: 'var(--text)', fontWeight: 500, lineHeight: 1.2 }}>
                                {course?.title}
                              </span>
                              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                {faculty?.name}
                              </span>
                              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ice-ink, #0369a1)', marginTop: '2px' }}>
                                📍 {room?.name}
                              </span>
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ============================================================== */}
      {/* TAB 3: MY COURSES                                              */}
      {/* ============================================================== */}
      {activeTab === 'courses' && (
        <section className="panel stagger" aria-label="Student enrolled courses">
          <header className="panel-head">
            <div>
              <h3>My Enrolled Courses</h3>
              <p>Registered courses for {studentProfile.semester} ({studentProfile.department})</p>
            </div>
            <span className="badge-ghost">Total Credits: {enrolledCourses.reduce((acc, c) => acc + c.credits, 0)}</span>
          </header>

          <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {enrolledCourses.map((course) => {
              const faculty = data.faculty.find((f) => f.id === course.facultyId)
              const lecturesThisWeek = enrolledSlots.filter((s) => s.courseId === course.id).length

              return (
                <div
                  key={course.id}
                  className="card"
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    padding: '16px 18px',
                    background: 'var(--surface)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span className="chip-code">{course.code}</span>
                      <h4 style={{ fontSize: '16px', fontWeight: 600, marginTop: '6px' }}>{course.title}</h4>
                    </div>
                    <span className="badge-velvet">{course.credits} Credits</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13.5px', color: 'var(--text-muted)' }}>
                    <div>
                      Instructor: <strong style={{ color: 'var(--text)' }}>{faculty?.name || 'TBA'}</strong> ({faculty?.designation || 'Faculty'})
                    </div>
                    <div>
                      Contact: <span>{faculty?.email || 'department@kce.ac.in'}</span>
                    </div>
                    <div>
                      Department: <span>{course.department}</span> · Semester: <span>{course.semester}</span>
                    </div>
                    <div>
                      Weekly Allotment: <strong style={{ color: 'var(--text)' }}>{lecturesThisWeek} periods/week</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                    <span className="badge-ghost" style={{ fontSize: '12px' }}>
                      Status: Enrolled (Active)
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ============================================================== */}
      {/* TAB 4: ATTENDANCE                                              */}
      {/* ============================================================== */}
      {activeTab === 'attendance' && (
        <section className="panel stagger" aria-label="Student attendance details">
          <header className="panel-head" style={{ flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3>Subject-Wise Attendance Record</h3>
              <p>Official lecture attendance percentage for {studentProfile.semester}</p>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span className="badge" style={{ background: attendanceOverall.percentage < 75 ? '#fee2e2' : '#dcfce7', color: attendanceOverall.percentage < 75 ? '#991b1b' : '#166534', fontWeight: 600 }}>
                Overall: {attendanceOverall.percentage}%
              </span>
              <span className="badge-ghost">Requirement: 75% minimum</span>
            </div>
          </header>

          <div style={{ padding: '20px' }}>
            {attendanceOverall.lowCount > 0 && (
              <div
                style={{
                  padding: '14px 18px',
                  borderRadius: '10px',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#991b1b',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '20px',
                  fontSize: '14px',
                }}
              >
                <Icon name="warning" size={20} />
                <div>
                  <strong>Attendance Shortfall Warning:</strong> You have {attendanceOverall.lowCount} subject(s) with attendance below 75%. Please consult your course instructor or academic advisor.
                </div>
              </div>
            )}

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '650px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)', background: 'var(--surface-sunk)' }}>
                    <th style={{ padding: '12px 14px' }}>Course</th>
                    <th style={{ padding: '12px 14px' }}>Faculty In-Charge</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center' }}>Conducted</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center' }}>Attended</th>
                    <th style={{ padding: '12px 14px', width: '220px' }}>Progress &amp; Percentage</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {SAMPLE_ATTENDANCE.map((item) => {
                    const isBelow = item.percentage < 75
                    return (
                      <tr key={item.code} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '14px' }}>
                          <strong style={{ display: 'block', fontSize: '14px' }}>{item.code}</strong>
                          <span className="muted small">{item.title}</span>
                        </td>
                        <td style={{ padding: '14px', fontSize: '14px' }}>{item.faculty}</td>
                        <td style={{ padding: '14px', textAlign: 'center', fontWeight: 600 }}>{item.total}</td>
                        <td style={{ padding: '14px', textAlign: 'center', fontWeight: 600 }}>{item.attended}</td>
                        <td style={{ padding: '14px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '4px' }}>
                            <span style={{ fontWeight: 600, color: isBelow ? '#dc2626' : '#16a34a' }}>
                              {item.percentage}%
                            </span>
                          </div>
                          <div style={{ width: '100%', height: '8px', background: 'var(--surface-sunk, #e2e8f0)', borderRadius: '999px', overflow: 'hidden' }}>
                            <div
                              style={{
                                width: `${Math.min(100, item.percentage)}%`,
                                height: '100%',
                                background: isBelow ? '#ef4444' : '#22c55e',
                                borderRadius: '999px',
                              }}
                            />
                          </div>
                        </td>
                        <td style={{ padding: '14px', textAlign: 'center' }}>
                          {isBelow ? (
                            <span style={{ background: '#fee2e2', color: '#991b1b', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>
                              Shortfall (&lt;75%)
                            </span>
                          ) : (
                            <span style={{ background: '#dcfce7', color: '#166534', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>
                              Eligible (≥75%)
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* ============================================================== */}
      {/* TAB 5: ACADEMIC CALENDAR                                      */}
      {/* ============================================================== */}
      {activeTab === 'calendar' && (
        <section className="panel stagger" aria-label="Student academic calendar">
          <header className="panel-head">
            <div>
              <h3>Academic Calendar &amp; Holidays</h3>
              <p>Key university dates, exam schedules and institutional holidays for {termConfig.label}</p>
            </div>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => onNavigate('calendar')}>
              Open Full Interactive Calendar <Icon name="arrow-right" size={14} />
            </button>
          </header>

          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Examination Dates */}
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icon name="clock" size={16} /> Examination Schedule
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                {upcomingExams.length === 0 ? (
                  <p className="muted">No examination dates posted yet for this term.</p>
                ) : (
                  upcomingExams.map((ex) => (
                    <div
                      key={ex.id}
                      style={{
                        padding: '14px',
                        borderRadius: '10px',
                        border: '1px solid #fecaca',
                        background: '#fef2f2',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                      }}
                    >
                      <strong style={{ color: '#991b1b', fontSize: '14.5px' }}>{ex.title}</strong>
                      <span style={{ fontSize: '13px', fontWeight: 600 }}>
                        📅 {ex.date} {ex.endDate ? `– ${ex.endDate}` : ''}
                      </span>
                      <p style={{ fontSize: '12.5px', color: '#7f1d1d', margin: 0 }}>{ex.description}</p>
                      {ex.location && <span style={{ fontSize: '12px', color: '#991b1b' }}>📍 {ex.location}</span>}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Upcoming Holidays */}
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icon name="sun" size={16} /> Upcoming Holidays
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                {upcomingHolidays.length === 0 ? (
                  <p className="muted">No holidays recorded in this semester window.</p>
                ) : (
                  upcomingHolidays.map((hol) => (
                    <div
                      key={hol.id}
                      style={{
                        padding: '14px',
                        borderRadius: '10px',
                        border: '1px solid #bbf7d0',
                        background: '#f0fdf4',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                      }}
                    >
                      <strong style={{ color: '#166534', fontSize: '14.5px' }}>{hol.title}</strong>
                      <span style={{ fontSize: '13px', fontWeight: 600 }}>
                        📅 {hol.date} {hol.endDate ? `– ${hol.endDate}` : ''}
                      </span>
                      <p style={{ fontSize: '12.5px', color: '#14532d', margin: 0 }}>{hol.description}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Academic Milestones */}
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icon name="star" size={16} /> Academic Milestones &amp; Events
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                {academicMilestones.length === 0 ? (
                  <p className="muted">No upcoming milestones.</p>
                ) : (
                  academicMilestones.map((ms) => (
                    <div
                      key={ms.id}
                      style={{
                        padding: '14px',
                        borderRadius: '10px',
                        border: '1px solid var(--border)',
                        background: 'var(--surface)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        boxShadow: 'var(--shadow-sm)',
                      }}
                    >
                      <strong style={{ fontSize: '14.5px' }}>{ms.title}</strong>
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                        📅 {ms.date} {ms.endDate ? `– ${ms.endDate}` : ''}
                      </span>
                      <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: 0 }}>{ms.description}</p>
                      {ms.location && <span style={{ fontSize: '12px', color: 'var(--primary)' }}>📍 {ms.location}</span>}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
