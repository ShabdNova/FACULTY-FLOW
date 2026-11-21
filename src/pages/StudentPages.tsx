import { useState } from 'react'
import type { AppStore } from '../state/useAppData'
import type { Page } from '../types-ui'
import { Icon, type IconName } from '../components/Icon'

interface StudentPagesProps {
  store: AppStore
  onNavigate: (page: Page) => void
}

const STUDENT = {
  studentId: '24CSE042',
  name: 'Aarav Singhania',
  email: 'aarav.2024cse@kce.ac.in',
  phone: '+91 98765 20442',
  section: 'CSE-2B',
  semester: 'Semester 6',
  department: 'Computer Science & Engineering',
  program: 'B.Tech — Computer Science & Engineering',
  batch: '2024 – 2028',
  advisor: 'Dr. Anita Sharma',
  hostel: 'Boys Hostel B — Room 214',
  bloodGroup: 'B+',
  address: '14, Rajendra Nagar, Indore, Madhya Pradesh 452012',
}

const RESULT_ROWS = [
  { code: 'CS301', title: 'Data Structures & Algorithms', credits: 4, internal: 27, external: 56, total: 83, grade: 'A', points: 9 },
  { code: 'CS302', title: 'Database Management Systems', credits: 4, internal: 29, external: 61, total: 90, grade: 'A+', points: 10 },
  { code: 'CS303', title: 'Operating Systems', credits: 4, internal: 22, external: 48, total: 70, grade: 'B+', points: 8 },
  { code: 'CS304', title: 'Computer Networks', credits: 3, internal: 25, external: 52, total: 77, grade: 'A', points: 9 },
  { code: 'CS305P', title: 'DBMS Laboratory', credits: 2, internal: 28, external: 57, total: 85, grade: 'A', points: 9 },
  { code: 'MA301', title: 'Discrete Mathematics', credits: 3, internal: 24, external: 50, total: 74, grade: 'B+', points: 8 },
]

const EXAM_SCHEDULE = [
  { code: 'CS302', title: 'Database Management Systems', date: '02 Dec 2026', time: '09:30 – 12:30', hall: 'Exam Hall A-3', seat: 'B-24' },
  { code: 'CS303', title: 'Operating Systems', date: '05 Dec 2026', time: '09:30 – 12:30', hall: 'Exam Hall A-3', seat: 'B-24' },
  { code: 'CS304', title: 'Computer Networks', date: '08 Dec 2026', time: '14:00 – 17:00', hall: 'Exam Hall B-1', seat: 'C-11' },
  { code: 'MA301', title: 'Discrete Mathematics', date: '11 Dec 2026', time: '09:30 – 12:30', hall: 'Exam Hall A-1', seat: 'A-07' },
  { code: 'CS301', title: 'Data Structures & Algorithms', date: '14 Dec 2026', time: '14:00 – 17:00', hall: 'Exam Hall B-1', seat: 'C-11' },
]

const FEE_ROWS = [
  { id: 'TXN-2607-8841', head: 'Semester 6 tuition fee', amount: 68500, date: '12 Jul 2026', mode: 'UPI / SBI', status: 'Paid' },
  { id: 'TXN-2607-8842', head: 'Examination fee (End-sem)', amount: 2400, date: '14 Jul 2026', mode: 'Net banking', status: 'Paid' },
  { id: 'TXN-2607-9013', head: 'Hostel & mess (Jul – Dec)', amount: 42000, date: '18 Jul 2026', mode: 'Card', status: 'Paid' },
  { id: 'TXN-2611-2290', head: 'Semester 6 lab & library fee', amount: 6500, date: '02 Nov 2026', mode: 'UPI / SBI', status: 'Paid' },
  { id: 'DUE-2612-0007', head: 'Semester 7 advance tuition', amount: 68500, date: 'Due 15 Dec 2026', mode: '—', status: 'Due' },
]

const LIBRARY_BOOKS = [
  { title: 'Operating System Concepts', author: 'Silberschatz, Galvin & Gagne', code: '005.43 SIL', issued: '04 Nov 2026', due: '18 Dec 2026', status: 'Issued' },
  { title: 'Database System Concepts', author: 'Korth, Sudarshan & Silberschatz', code: '005.74 KOR', issued: '11 Nov 2026', due: '25 Dec 2026', status: 'Issued' },
  { title: 'Computer Networks', author: 'Andrew S. Tanenbaum', code: '004.6 TAN', issued: '22 Oct 2026', due: '05 Nov 2026', status: 'Returned' },
  { title: 'Introduction to Algorithms', author: 'Cormen, Leiserson et al.', code: '005.1 COR', issued: '02 Sep 2026', due: '16 Sep 2026', status: 'Returned' },
]

const NOTICES = [
  { id: 'n1', title: 'End-semester examination timetable released', body: 'The December 2026 end-semester schedule is published. Verify your hall ticket seat numbers on the ERP portal before 28 Nov.', date: '18 Nov 2026', tag: 'Examination', pinned: true },
  { id: 'n2', title: 'Semester 7 pre-registration opens on 25 Nov', body: 'Registration for elective baskets opens at 10:00. Students with pending dues must clear fees first to be eligible.', date: '16 Nov 2026', tag: 'Registration', pinned: true },
  { id: 'n3', title: 'Library extended hours during exams', body: 'The central library will remain open until 23:00 from 28 Nov to 18 Dec. Silent zones on floors 2 and 3 are reservation-only.', date: '14 Nov 2026', tag: 'Library', pinned: false },
  { id: 'n4', title: 'Coding club hackathon — registrations open', body: '48-hour campus hackathon on 6–7 Dec at the Innovation Lab. Teams of up to four; prizes worth ₹75,000.', date: '12 Nov 2026', tag: 'Events', pinned: false },
  { id: 'n5', title: 'Attendance shortfall counselling session', body: 'Students below 75% attendance in any subject must attend the academic advisor session on 26 Nov at 15:00 in CSE seminar hall.', date: '09 Nov 2026', tag: 'Academic', pinned: false },
]

const circularBtn = (active: boolean) => `btn ${active ? 'btn-primary' : 'btn-secondary'}`

function StudentPageShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string
  subtitle: string
  actions?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="page stagger">
      <div className="page-head">
        <div>
          <h2 className="greeting">{title}</h2>
          <p className="page-sub">{subtitle}</p>
        </div>
        {actions}
      </div>
      {children}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Notice board                                                        */
/* ------------------------------------------------------------------ */

export function StudentNoticesPage({ onNavigate }: StudentPagesProps) {
  const [filter, setFilter] = useState<'all' | 'Examination' | 'Academic' | 'Events' | 'Library' | 'Registration'>('all')
  const visible = NOTICES.filter((n) => filter === 'all' || n.tag === filter)
  const tabs: Array<typeof filter> = ['all', 'Examination', 'Academic', 'Registration', 'Library', 'Events']

  return (
    <StudentPageShell
      title="Notice board"
      subtitle="Circulars, examination notices, registrations and campus announcements for your section."
      actions={<span className="badge-velvet">{NOTICES.filter((n) => n.pinned).length} pinned</span>}
    >
      <div className="filterbar">
        {tabs.map((t) => (
          <button
            key={t}
            type="button"
            className="chip-btn"
            aria-pressed={filter === t}
            style={
              filter === t
                ? { borderColor: '#b9d9f2', background: 'var(--ice-soft)', color: 'var(--text)', fontWeight: 600 }
                : undefined
            }
            onClick={() => setFilter(t)}
          >
            {t === 'all' ? 'All notices' : t}
          </button>
        ))}
      </div>

      <div className="student-notice-grid">
        {visible.map((n) => (
          <article key={n.id} className={`student-notice-card${n.pinned ? ' is-pinned' : ''}`}>
            <div className="student-notice-top">
              <span className="student-tag">{n.tag}</span>
              {n.pinned && (
                <span className="student-pin">
                  <Icon name="star" size={12} /> Pinned
                </span>
              )}
            </div>
            <h3>{n.title}</h3>
            <p>{n.body}</p>
            <footer>
              <span className="muted small">{n.date}</span>
              <button type="button" className="link-btn" onClick={() => onNavigate('calendar')}>
                View calendar <Icon name="arrow-right" size={14} />
              </button>
            </footer>
          </article>
        ))}
      </div>
    </StudentPageShell>
  )
}

/* ------------------------------------------------------------------ */
/* Exams & results                                                     */
/* ------------------------------------------------------------------ */

export function StudentResultsPage() {
  const totalCredits = RESULT_ROWS.reduce((a, c) => a + c.credits, 0)
  const weighted = RESULT_ROWS.reduce((a, c) => a + c.credits * c.points, 0)
  const sgpa = (weighted / totalCredits).toFixed(2)

  return (
    <StudentPageShell
      title="Exams & results"
      subtitle={`Internal and end-semester marks for ${STUDENT.semester}. Results published by the examination cell.`}
      actions={<span className="badge-ghost">SGPA {sgpa} / 10</span>}
    >
      <section className="stats" aria-label="Result summary">
        <div className="stat">
          <p className="stat-label">SGPA</p>
          <p className="stat-value">{sgpa}<span className="stat-unit">out of 10</span></p>
          <p className="stat-note">Semester grade point average</p>
        </div>
        <div className="stat">
          <p className="stat-label">Credits earned</p>
          <p className="stat-value">{totalCredits}<span className="stat-unit">registered</span></p>
          <p className="stat-note">All subjects cleared</p>
        </div>
        <div className="stat">
          <p className="stat-label">Best subject</p>
          <p className="stat-value" style={{ fontSize: '22px' }}>CS302</p>
          <p className="stat-note">DBMS · 90 marks · A+</p>
        </div>
        <div className="stat">
          <p className="stat-label">Next examination</p>
          <p className="stat-value" style={{ fontSize: '22px' }}>02 Dec</p>
          <p className="stat-note">09:30 · Exam Hall A-3 · seat B-24</p>
        </div>
      </section>

      <section className="panel flush">
        <header className="panel-head">
          <div>
            <h3>Published result</h3>
            <p>Marks are out of 30 (internal) and 70 (end semester).</p>
          </div>
        </header>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Code</th>
                <th scope="col">Course</th>
                <th scope="col" className="num">Credits</th>
                <th scope="col" className="num">Internal /30</th>
                <th scope="col" className="num">End-sem /70</th>
                <th scope="col" className="num">Total /100</th>
                <th scope="col">Grade</th>
              </tr>
            </thead>
            <tbody>
              {RESULT_ROWS.map((r) => (
                <tr key={r.code}>
                  <td className="mono strong">{r.code}</td>
                  <td>{r.title}</td>
                  <td className="num">{r.credits}</td>
                  <td className="num">{r.internal}</td>
                  <td className="num">{r.external}</td>
                  <td className="num strong">{r.total}</td>
                  <td>
                    <span className="count-pill">{r.grade}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <footer className="table-foot">
          <span>Result status: <strong>Passed</strong> · no backlog</span>
          <span className="muted">Published 16 Nov 2026 · revaluation window closed</span>
        </footer>
      </section>

      <section className="panel flush">
        <header className="panel-head">
          <div>
            <h3>End-semester examination seat allotment</h3>
            <p>December 2026 · report 20 minutes before the start time</p>
          </div>
        </header>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Course</th>
                <th scope="col">Time</th>
                <th scope="col">Hall</th>
                <th scope="col">Seat</th>
              </tr>
            </thead>
            <tbody>
              {EXAM_SCHEDULE.map((e) => (
                <tr key={e.code + e.date}>
                  <td className="mono">{e.date}</td>
                  <td>
                    <span className="strong">{e.code}</span>
                    <span className="cell-sub">{e.title}</span>
                  </td>
                  <td className="mono">{e.time}</td>
                  <td>{e.hall}</td>
                  <td className="mono">{e.seat}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </StudentPageShell>
  )
}

/* ------------------------------------------------------------------ */
/* Fees & payments                                                     */
/* ------------------------------------------------------------------ */

export function StudentFeesPage() {
  const paid = FEE_ROWS.filter((f) => f.status === 'Paid').reduce((a, c) => a + c.amount, 0)
  const due = FEE_ROWS.filter((f) => f.status === 'Due').reduce((a, c) => a + c.amount, 0)
  const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`

  return (
    <StudentPageShell
      title="Fees & payments"
      subtitle="Semester fee ledger, receipts and outstanding dues. Payments are reconciled daily with the accounts office."
      actions={<span className="badge" style={{ background: due > 0 ? '#fdf4e2' : '#e8f6ee', color: due > 0 ? '#9a5b06' : '#177a4c', fontWeight: 600 }}>{due > 0 ? `${inr(due)} due` : 'No dues'}</span>}
    >
      <section className="stats" aria-label="Fee summary">
        <div className="stat">
          <p className="stat-label">Total paid this year</p>
          <p className="stat-value">{inr(paid)}<span className="stat-unit">{FEE_ROWS.filter((f) => f.status === 'Paid').length} receipts</span></p>
          <p className="stat-note">Academic year 2026–27</p>
        </div>
        <div className="stat">
          <p className="stat-label">Outstanding</p>
          <p className="stat-value">{inr(due)}<span className="stat-unit">due 15 Dec</span></p>
          <p className="stat-note">Semester 7 advance tuition</p>
        </div>
        <div className="stat">
          <p className="stat-label">Scholarship credited</p>
          <p className="stat-value">₹25,000<span className="stat-unit">merit</span></p>
          <p className="stat-note">Adjusted in July 2026 invoice</p>
        </div>
        <div className="stat">
          <p className="stat-label">Payment mode</p>
          <p className="stat-value" style={{ fontSize: '22px' }}>UPI / SBI</p>
          <p className="stat-note">Autopay not enabled</p>
        </div>
      </section>

      <section className="panel flush">
        <header className="panel-head">
          <div>
            <h3>Fee ledger</h3>
            <p>{FEE_ROWS.length} entries · newest first</p>
          </div>
        </header>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Reference</th>
                <th scope="col">Particulars</th>
                <th scope="col" className="num">Amount</th>
                <th scope="col">Date</th>
                <th scope="col">Mode</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {FEE_ROWS.map((f) => (
                <tr key={f.id}>
                  <td className="mono">{f.id}</td>
                  <td>{f.head}</td>
                  <td className="num strong">{inr(f.amount)}</td>
                  <td>{f.date}</td>
                  <td>{f.mode}</td>
                  <td>
                    <span className={`count-pill${f.status === 'Due' ? ' count-short' : ''}`}>{f.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <footer className="table-foot">
          <span>Receipts are downloadable from the accounts office counter.</span>
          <span className="muted">Late payment attracts a ₹500 per week penalty.</span>
        </footer>
      </section>
    </StudentPageShell>
  )
}

/* ------------------------------------------------------------------ */
/* Library                                                             */
/* ------------------------------------------------------------------ */

export function StudentLibraryPage() {
  const issued = LIBRARY_BOOKS.filter((b) => b.status === 'Issued')

  return (
    <StudentPageShell
      title="Library"
      subtitle="Books issued to your roll number, due dates and borrowing limits from the central library."
      actions={<span className="badge-ghost">{issued.length} of 4 issued</span>}
    >
      <section className="stats" aria-label="Library summary">
        <div className="stat">
          <p className="stat-label">Books issued</p>
          <p className="stat-value">{issued.length}<span className="stat-unit">of 4 limit</span></p>
          <p className="stat-note">Return on or before the due date</p>
        </div>
        <div className="stat">
          <p className="stat-label">Next due date</p>
          <p className="stat-value" style={{ fontSize: '22px' }}>18 Dec</p>
          <p className="stat-note">Operating System Concepts</p>
        </div>
        <div className="stat">
          <p className="stat-label">Fine accrual</p>
          <p className="stat-value">₹0<span className="stat-unit">clean</span></p>
          <p className="stat-note">₹5 per day after due date</p>
        </div>
        <div className="stat">
          <p className="stat-label">Library hours</p>
          <p className="stat-value" style={{ fontSize: '22px' }}>08 – 23</p>
          <p className="stat-note">Extended hours during exams</p>
        </div>
      </section>

      <section className="panel flush">
        <header className="panel-head">
          <div>
            <h3>Borrowing history</h3>
            <p>Reading room access is restricted to the CSE floor after 18:00.</p>
          </div>
        </header>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Title</th>
                <th scope="col">Author</th>
                <th scope="col">Catalogue no.</th>
                <th scope="col">Issued</th>
                <th scope="col">Due</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {LIBRARY_BOOKS.map((b) => (
                <tr key={b.title}>
                  <td className="strong">{b.title}</td>
                  <td>{b.author}</td>
                  <td className="mono">{b.code}</td>
                  <td className="mono">{b.issued}</td>
                  <td className="mono">{b.due}</td>
                  <td>
                    <span className={`count-pill${b.status === 'Issued' ? '' : ' count-short'}`}>{b.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </StudentPageShell>
  )
}

/* ------------------------------------------------------------------ */
/* Profile                                                             */
/* ------------------------------------------------------------------ */

export function StudentProfilePage({ onNavigate }: StudentPagesProps) {
  const facts: Array<{ label: string; value: string; icon: IconName }> = [
    { label: 'Roll number', value: STUDENT.studentId, icon: 'user' },
    { label: 'Programme', value: STUDENT.program, icon: 'graduation-cap' },
    { label: 'Department', value: STUDENT.department, icon: 'building' },
    { label: 'Section', value: STUDENT.section, icon: 'grid' },
    { label: 'Semester', value: STUDENT.semester, icon: 'calendar' },
    { label: 'Batch', value: STUDENT.batch, icon: 'clock' },
    { label: 'Academic advisor', value: STUDENT.advisor, icon: 'shield' },
    { label: 'Hostel', value: STUDENT.hostel, icon: 'building' },
    { label: 'Email', value: STUDENT.email, icon: 'info' },
    { label: 'Phone', value: STUDENT.phone, icon: 'info' },
    { label: 'Blood group', value: STUDENT.bloodGroup, icon: 'star' },
    { label: 'Address', value: STUDENT.address, icon: 'dashboard' },
  ]

  return (
    <StudentPageShell
      title="My profile"
      subtitle="Read-only student record maintained by the academic section. Request corrections through your faculty advisor."
      actions={<span className="badge-ghost">Read only</span>}
    >
      <section className="student-profile-card">
        <div className="student-profile-avatar">{STUDENT.name.split(' ').map((p) => p[0]).join('')}</div>
        <div className="student-profile-head">
          <h3>{STUDENT.name}</h3>
          <p className="muted">{STUDENT.program}</p>
          <div className="student-profile-chips">
            <span className="badge-velvet">{STUDENT.section}</span>
            <span className="badge-ghost">{STUDENT.semester}</span>
            <span className="badge-ghost">{STUDENT.batch}</span>
          </div>
        </div>
        <div className="student-profile-actions">
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => onNavigate('attendance')}>
            <Icon name="clock-check" size={14} /> Attendance
          </button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => onNavigate('results')}>
            <Icon name="star" size={14} /> Results
          </button>
          <button type="button" className={circularBtn(false)} onClick={() => onNavigate('fees')}>
            <Icon name="chart" size={14} /> Fee ledger
          </button>
        </div>
      </section>

      <section className="student-facts">
        {facts.map((f) => (
          <div key={f.label} className="student-fact">
            <span className="student-fact-icon">
              <Icon name={f.icon} size={15} />
            </span>
            <div>
              <span className="student-fact-label">{f.label}</span>
              <strong>{f.value}</strong>
            </div>
          </div>
        ))}
      </section>
    </StudentPageShell>
  )
}
