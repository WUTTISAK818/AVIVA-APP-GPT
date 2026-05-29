<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:deploy-report-rule -->
# Deploy Rule (MANDATORY — ทุกครั้งที่ git push)

After EVERY `git push`, you MUST do ALL of the following steps in order:

## Step 1 — อัปเดตเวอร์ชันในโค้ด (ก่อน commit สุดท้าย)
Bump the version number in BOTH files:
- `src/app/dashboard/page.tsx` — badge text เช่น `v2.9.1` → `v2.9.2`
- `src/app/settings/page.tsx`  — text เช่น `Version 2.9.1` → `Version 2.9.2`

Version format: `v{MAJOR}.{MINOR}.{PATCH}` — increment PATCH for fixes, MINOR for new features.

## Step 2 — บันทึก Deploy Report ลง Google Drive
Create a report in Thai using `mcp__8faf3051-cdce-4013-97eb-37b094e28b96__create_file`:
- Filename: `AVIVA-ONE-deploy-report-v{VERSION}-{DATE}.txt`
- Content must include ALL of:
  - version number
  - date/time (วันที่ + เวลา, โซน Asia/Bangkok)
  - **web app link (URL ของเว็บแอปที่ deploy)** — see WEB APP URL below
  - list of changes
  - files changed
  - commit hashes

## Step 3 — แจ้งผู้ใช้
Report to the user:
- Version deployed (e.g., v2.9.2)
- Date/time
- **Web app link (URL)**
- Google Drive file link/ID

## WEB APP URL (canonical — ใช้ในทุกรายงาน)
- Production URL: `https://win-vote.netlify.app`
- Platform: Netlify (ดู `netlify.toml`) — site name: `win-vote`

This rule is PERMANENT and applies to every deploy session without exception.
หมายเหตุ: ข้อมูลที่ต้องมีในรายงานทุกครั้ง = เวอร์ชัน + วันที่/เวลา + ลิงก์เว็บแอป (+ รายการแก้ไข/ไฟล์/commit)
<!-- END:deploy-report-rule -->
