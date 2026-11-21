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

  const loginVisible = await page.locator('.auth-card h2').count()
  if (loginVisible > 0) {
    console.log('Login page title:', await page.locator('.auth-card h2').first().textContent())
    await page.screenshot({ path: 'qa/test-login-page.png' })
  }

  const collapseBtn = page.locator('.role-collapse')
  if (await collapseBtn.count() > 0) {
    await collapseBtn.click()
    await page.waitForTimeout(300)
    await page.screenshot({ path: 'qa/test-role-dock-collapsed.png' })
    await collapseBtn.click()
    await page.waitForTimeout(300)
  }

  await page.locator('.role-chip', { hasText: 'Student' }).click()
  await page.waitForTimeout(600)

  console.log('Student nav items:', await page.locator('.nav-link').allTextContents())
  console.log('Student tabs:', await page.locator('.student-tab').allTextContents())

  await page.screenshot({ path: 'qa/test-student-overview-full.png', fullPage: true })

  // In-dashboard tabs
  for (const [label, file] of [
    ['Timetable', 'tab-timetable'],
    ['Courses', 'tab-courses'],
    ['Attendance', 'tab-attendance'],
    ['Calendar', 'tab-calendar'],
  ]) {
    await page.locator('.student-tab', { hasText: label }).click()
    await page.waitForTimeout(450)
    await page.screenshot({ path: `qa/test-student-${file}.png`, fullPage: true })
  }

  // New student-only sidebar sections
  await page.locator('.nav-link', { hasText: 'Notice Board' }).first().click()
  await page.waitForTimeout(450)
  await page.screenshot({ path: 'qa/test-student-notices.png', fullPage: true })
  console.log('Notices topbar:', await page.locator('.topbar-title h1').textContent())

  for (const [label, file] of [
    ['Exams & Results', 'results'],
    ['Fees & Payments', 'fees'],
    ['Library', 'library'],
    ['My Profile', 'profile'],
    ['My Attendance', 'sidebar-attendance'],
    ['Academic Calendar', 'sidebar-calendar'],
  ]) {
    await page.locator('.nav-link', { hasText: label }).first().click()
    await page.waitForTimeout(450)
    await page.screenshot({ path: `qa/test-student-${file}.png`, fullPage: true })
    console.log(`${label} → topbar:`, await page.locator('.topbar-title h1').textContent())
  }

  // Laptop viewport
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.locator('.nav-link', { hasText: 'Dashboard' }).first().click()
  await page.waitForTimeout(400)
  await page.screenshot({ path: 'qa/test-student-laptop-viewport.png' })

  // Other roles unaffected
  for (const r of ['HOD', 'Faculty', 'Admin']) {
    await page.locator('.role-chip', { hasText: r }).click()
    await page.waitForTimeout(450)
    console.log(`${r} topbar:`, await page.locator('.topbar-title h1').textContent())
    await page.screenshot({ path: `qa/test-role-${r.toLowerCase()}.png` })
  }

  console.log('All tests completed. Errors encountered:', errors)
  await browser.close()
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
