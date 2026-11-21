import { chromium } from 'playwright'

async function run() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

  const errors = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  page.on('pageerror', (err) => errors.push(err.message))

  console.log('Navigating to http://localhost:5173...')
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' })

  // Check role switcher buttons
  const roleButtons = await page.locator('.role-chip').allTextContents()
  console.log('Role chips present:', roleButtons)

  // 1. Check Student button in RoleDock
  const studentChip = page.locator('.role-chip', { hasText: 'Student' })
  const hasStudent = await studentChip.count()
  console.log('Student role chip count:', hasStudent)

  // Take screenshot of default view (Admin)
  await page.screenshot({ path: 'qa/test-admin-view.png' })

  // Switch to Student role
  await studentChip.click()
  await page.waitForTimeout(600)

  // Check student dashboard title and stats
  const heroTitle = await page.locator('.student-hero h2').textContent()
  console.log('Student Hero Title:', heroTitle)

  // Verify tabs
  const tabButtons = page.locator('.hero-actions button')
  console.log('Student action tabs:', await tabButtons.allTextContents())

  // Screenshot student overview
  await page.screenshot({ path: 'qa/test-student-overview.png' })

  // Click Timetable tab
  await page.locator('.hero-actions button', { hasText: 'My Timetable' }).click()
  await page.waitForTimeout(400)
  await page.screenshot({ path: 'qa/test-student-timetable.png' })

  // Click Courses tab
  await page.locator('.hero-actions button', { hasText: 'My Courses' }).click()
  await page.waitForTimeout(400)
  await page.screenshot({ path: 'qa/test-student-courses.png' })

  // Click Attendance tab
  await page.locator('.hero-actions button', { hasText: 'Attendance' }).click()
  await page.waitForTimeout(400)
  await page.screenshot({ path: 'qa/test-student-attendance.png' })

  // Click Calendar tab
  await page.locator('.hero-actions button', { hasText: 'Calendar' }).click()
  await page.waitForTimeout(400)
  await page.screenshot({ path: 'qa/test-student-calendar.png' })

  // Switch back to HOD, Faculty, Admin and verify navigation works
  const hodChip = page.locator('.role-chip', { hasText: 'HOD' })
  await hodChip.click()
  await page.waitForTimeout(500)
  console.log('Switched to HOD. Topbar title:', await page.locator('.topbar-title h1').textContent())

  const facultyChip = page.locator('.role-chip', { hasText: 'Faculty' })
  await facultyChip.click()
  await page.waitForTimeout(500)
  console.log('Switched to Faculty. Topbar title:', await page.locator('.topbar-title h1').textContent())

  const adminChip = page.locator('.role-chip', { hasText: 'Admin' })
  await adminChip.click()
  await page.waitForTimeout(500)
  console.log('Switched to Admin. Topbar title:', await page.locator('.topbar-title h1').textContent())

  // Check local storage persistence by reloading
  await studentChip.click()
  await page.waitForTimeout(500)
  await page.reload({ waitUntil: 'networkidle' })
  console.log('After reload, active role user:', await page.locator('.sidebar-user strong').textContent())

  console.log('Browser errors:', errors)
  await browser.close()
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
