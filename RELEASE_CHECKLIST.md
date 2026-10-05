# CLES Release Gate

`python qa_agent.py` がPASSしない限りリリースしない。

## 自動検査
- JSON構文
- 必須項目
- 問題ID重複
- 各Weekが実在する10問で構成
- 同一Week内の同一内容
- 全体の英文重複
- Balanced ReviewのFunction多様性
- 参照ファイル存在
- JavaScript構文
- バージョン一致

## 手動スモークテスト
- Androidで通常WeekとWeek05
- iOS/iPadOSで通常WeekとWeek05
- Q1・Q5・Q10を回答
- 次へ、レビュー、ログ保存
- 学習者ログと管理ログの分離

## VOC-001
現象: Week05の10問が全て同一内容。
根本原因: Q041〜Q050へコピー内容が残存。
流出原因: 重複内容を検出するリリース検査がなかった。
恒久対策: QA Agentが同一Week内重複を検出し、リリースをFAILにする。

## v1.6.1 mandatory persistence regression gate
- [ ] Answer one question in learner mode: canonical log count increases by exactly 1.
- [ ] Reload page: count is unchanged and the new row remains.
- [ ] My Progress count equals learner log count.
- [ ] Backup JSON contains the same new row.
- [ ] A storage write/read verification failure blocks moving to the next question and is visible to the user.
- [ ] Confirm test device/browser/origin. localStorage does NOT sync between Android/iPhone/iPad/PC or browsers.
