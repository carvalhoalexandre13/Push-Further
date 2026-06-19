# Push Further

A bodyweight training PWA — one exercise a day, planned weekly, with a live team leaderboard.

This guide assumes **zero coding experience**. Follow it top to bottom and you'll have
a working app on your phone (and your friend's) in about 10–15 minutes.

\---

## Step 1 — Set up the database (Supabase)

1. Go to [supabase.com](https://supabase.com) and sign up (free, no credit card).
2. Click **New project**. Pick any name (e.g. "push-further") and a region close to you.
Set a database password — save it somewhere, you won't need it again for this app.
3. Wait \~2 minutes for the project to finish setting up.
4. In the left sidebar, click **SQL Editor → New query**.
5. Open the file `supabase-schema.sql` from this project, copy everything in it,
paste it into the SQL editor, and click **Run**.
You should see "Success. No rows returned."
6. In the left sidebar, click **Settings → API**.
You'll need two values from this page in Step 3:

   * **Project URL** (looks like `https://abcdefgh.supabase.co`) ---- https://pqwhdxdngydyzfkdxcdq.supabase.co
   * **anon public** key (a long string under "Project API keys") --- sb\_publishable\_vTSw5EIj5sZw1wn\_P0ESIA\_fM8UoJoI

\---

## Step 2 — Get the code onto GitHub

1. Go to [github.com](https://github.com) and sign up if you don't have an account.
2. Click the **+** in the top right → **New repository**. Name it `push-further`,
keep it Public or Private (either works), click **Create repository**.
3. On the new repo page, click **uploading an existing file**.
4. Drag in **every file and folder** from this project (keep the folder structure —
`src/`, `public/`, `package.json`, `vite.config.js`, `index.html`,
`supabase-schema.sql`, `.env.example`, this `README.md`).
5. Scroll down, click **Commit changes**.

\---

## Step 3 — Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and sign up using your **GitHub account**
(this makes Step 5 — future updates — automatic).
2. Click **Add New → Project**.
3. Select your `push-further` repo and click **Import**.
4. Before deploying, expand **Environment Variables** and add:

|Name|Value|
|-|-|
|`VITE\_SUPABASE\_URL`|(your Project URL from Step 1)|
|`VITE\_SUPABASE\_ANON\_KEY`|(your anon public key from Step 1)|

5. Click **Deploy**. Wait \~1 minute.
6. You'll get a live URL like `https://push-further-yourname.vercel.app` — that's your app!

\---

## Step 4 — Install it on your iPhone (and your friend's)

1. Open the Vercel URL in **Safari** on the iPhone (must be Safari, not Chrome).
2. Tap the **Share** button (square with an arrow).
3. Tap **Add to Home Screen**.
4. It now opens full-screen like a real app, with its own icon.

Send the same URL to your friend — they do the same steps on their phone.
One of you taps **"New team"** to get a team code, shares that code, the other
taps **"Join team"** and enters it. Now you'll see each other in the **Team** tab.

\---

## Step 5 — Making changes later

Whenever you want to tweak something (new exercise, new colors, new feature):

1. Ask Claude to make the change and give you the updated file(s).
2. Go to your GitHub repo, open the file being changed, click the **pencil (edit)** icon,
paste in the new content, and **Commit changes**.
3. Vercel automatically detects the change and redeploys — usually live within a minute.
4. Your phone (and your friend's) will load the new version next time the app is opened.
If it doesn't seem to update, close the app fully (swipe it away) and reopen it.

No reinstalling, no new links to send — same icon, same URL, just updated.

\---

## Notes

* **Free tier limits:** Supabase's free tier and Vercel's free tier are both generous
enough for a couple of friends using this casually — you won't hit limits.
* **Team codes act as the "password":** anyone with the code can join and see/update
that team's data. Keep codes between friends, don't post them publicly.
* **Local files in this project:**

  * `src/App.jsx` — the whole app UI and logic
  * `src/supabaseClient.js` — connects to your database
  * `supabase-schema.sql` — the one-time database setup script
  * `.env.example` — template for your Supabase keys (you set the real ones in Vercel, not in a file)

