# Vercel デプロイ手順

## 必要なアカウント（すべて無料）
- GitHub: https://github.com
- Neon (PostgreSQL): https://neon.tech
- Vercel: https://vercel.com

---

## Step 1 — Neon で PostgreSQL を作成

1. https://neon.tech にアクセスしてサインアップ
2. 「New Project」をクリック
3. Project name: `business-card-app`、Region: `Asia Pacific (Singapore)` を選択
4. 作成後、**Connection string** をコピーする
   - 例: `postgresql://user:pass@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require`

---

## Step 2 — GitHub にリポジトリを作成してプッシュ

```bash
# business-card-app-vercel フォルダで実行
cd C:\Users\naoyu\OneDrive\デスクトップ\business-card-app-vercel

git init
git add .
git commit -m "first commit"
git branch -M main

# GitHub で新規リポジトリを作成してから:
git remote add origin https://github.com/<あなたのユーザー名>/business-card-app.git
git push -u origin main
```

---

## Step 3 — Vercel でデプロイ

1. https://vercel.com にアクセス → **Add New Project**
2. 作成した GitHub リポジトリを選択
3. **Framework Preset**: Vite（自動検出されるはず）
4. **Environment Variables** に以下を追加:

| 変数名 | 値 |
|---|---|
| `DATABASE_URL` | Neon の Connection string |
| `BLOB_READ_WRITE_TOKEN` | ※下記 Step 4 で取得 |

5. **Deploy** をクリック

---

## Step 4 — Vercel Blob を有効化

1. Vercel ダッシュボード → プロジェクト → **Storage** タブ
2. **Create Database** → **Blob** を選択
3. 作成すると `BLOB_READ_WRITE_TOKEN` が自動で Environment Variables に追加される

---

## Step 5 — データベースのマイグレーション

Vercel のデプロイ後、Neon のデータベースにテーブルを作成する:

```bash
# ローカルで実行（.env に DATABASE_URL を設定してから）
echo DATABASE_URL="<NeonのConnectionString>" > .env
npx prisma migrate deploy
```

または Neon のダッシュボードの SQL Editor で以下を実行:

```sql
CREATE TABLE IF NOT EXISTS "cards" (
  "id"               TEXT NOT NULL PRIMARY KEY,
  "imageUrl"         TEXT,
  "thumbnailUrl"     TEXT,
  "rawOcrText"       TEXT,
  "name"             TEXT,
  "nameKana"         TEXT,
  "company"          TEXT,
  "department"       TEXT,
  "title"            TEXT,
  "email"            TEXT,
  "phone"            TEXT,
  "mobile"           TEXT,
  "fax"              TEXT,
  "address"          TEXT,
  "postalCode"       TEXT,
  "website"          TEXT,
  "exchangeDate"     TIMESTAMP(3),
  "exchangeLocation" TEXT,
  "memo"             TEXT,
  "tags"             TEXT NOT NULL DEFAULT '[]',
  "isFavorite"       BOOLEAN NOT NULL DEFAULT false,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3) NOT NULL
);
CREATE INDEX IF NOT EXISTS "cards_name_idx" ON "cards"("name");
CREATE INDEX IF NOT EXISTS "cards_company_idx" ON "cards"("company");
CREATE INDEX IF NOT EXISTS "cards_isFavorite_idx" ON "cards"("isFavorite");
```

---

## 完了

デプロイ後、`https://<プロジェクト名>.vercel.app` でアクセスできます。
