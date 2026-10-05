# CLES logging incident — diagnosis and corrective action

## Known Good State
v1.6.0 screenshots show 61 total logs / 61 learner logs / 0 admin-test logs. Progress also shows 61 questions, so read + aggregate were functioning on that device/browser at that point.

## Root-cause findings
1. The application stores learning history only in browser `localStorage` (`cles.userdata.v1`). This storage is origin + browser/profile + device local. It is not cloud synchronization. A log visible on the son's Android browser will not automatically appear on an iPhone/iPad/PC or another browser.
2. v1.6.0 wrote the full log bundle with `localStorage.setItem()` and immediately advanced the UI. There was no read-after-write verification. Therefore a persistence failure could be silent to the learner.
3. The old QA agent checked syntax/content/version integrity, but did not execute a storage persistence regression test. It could report PASS without proving that an answer survives save/reload/export.
4. Learner/admin separation is intentional. A run recorded as developer/test is excluded from My Progress. This can make “logs exist but learning count did not increase” look like loss unless mode is checked.

## v1.6.1 corrective action
- Added `CLESStorage.appendLog()` with exact +1 count verification.
- Added write → read-back verification for canonical storage.
- On persistence failure, progression is blocked and an explicit error is shown.
- Added `healthCheck()` diagnostics.
- Added Node runtime regression test covering append → reload → export → second append.
- Added this runtime test to the QA release gate.
- Release QA now passes with 0 errors / 0 warnings.

## Remaining architecture limitation
This release makes local persistence detectable and testable, but it does not create cross-device synchronization. True multi-device history requires a backend/cloud datastore or an explicit backup/import workflow.
