# CLES GitHub Pages 配置手順

このフォルダの**中身をすべて**GitHubリポジトリの直下へ配置してください。
外側のフォルダ名をアップロードするのではなく、`index.html` がリポジトリ直下に見える状態にします。

## 必須ファイル

- `index.html`
- `app.js`
- `storage_manager.js`
- `data.json`
- `weekly.json`
- `today.json`
- `assets/header/default.jpeg`
- `.nojekyll`

## QA関連

- `qa_agent.py`
- `.github/workflows/qa.yml`
- `RELEASE_CHECKLIST.md`
- `QA_REPORT.md`
- `qa_report.json`

GitHubへpushすると、GitHub ActionsでQAが自動実行されます。
エラーがある場合はActionsが赤く失敗します。

## 公開

GitHubの Settings → Pages で、公開元を `Deploy from a branch`、Branchを `main / root` に設定します。

## 学習ログ

学習ログはブラウザの `localStorage` キー `cles.userdata.v1` に保存されます。
同じGitHub Pages URLへ上書き更新する限り、ログは維持されます。
URLやドメインを変える前には、アプリの「バックアップ」でJSONを書き出してください。

## 注意

`2026 Summer_2026-07-23.json` などの個人ログファイルは、公開リポジトリへ置かないでください。
