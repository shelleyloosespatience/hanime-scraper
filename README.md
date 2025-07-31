# 🍑 hanime-scraper

A literal website that pulls NSFW content from [Hanime.to](https://hanime.to) and Redgifs via clean proxying and some spicy header tricks. Built entirely to stream and browse anime corn like it's Netflix for degenerates.  
You can self-host it on Vercel or any other platform — or just peek the code for the sneaky tricks.

## 💻 By [@me_straight](https://discord.com/users/YOUR_ID_HERE) on Discord  
> I made this for fun and boredom. If you're tryna commission something nasty or clever — **hit me up**.

---

## ✅ Features
- Clean UI (Tailwind, Next.js)
- HLS streaming with auto quality (no lag BS)
- Full metadata + search support
- Scrapes Hanime API directly
- Bypasses CORS like a ninja
- No captcha, no popups, no interruptions  
- Works from Vercel with 0 backend setup stress

---

## ⚠️ LEGAL NOTE
This is for **educational purposes only**. I do not condone piracy or distribution of NSFW content without permission. This is a demonstration of proxy architecture and API handling.  
**If you deploy or use this inappropriately — that’s on you, not me.**

---

## 📦 Tech Stack

| Frontend | Backend | Hosting | Streaming |
|----------|---------|---------|-----------|
| Next.js  | Express | Vercel  | HLS.js    |

---

## 🧠 How It Works

- Finds Hanime’s open API (no auth)
- Bypasses CORS using a custom Node.js proxy
- Spoofs headers to pretend it's a real Firefox user
- Pipes data cleanly to frontend using Next.js API routes
- Supports streaming `.m3u8` (HLS) videos with controls and previews

---

## 🚀 How To Run

### 🧪 Local (Dev Mode)
```bash
git clone https://github.com/shelleyloosespatience/hanime-scraper.git
cd hanime-scraper
pnpm install
pnpm run dev
````

Then open `http://localhost:3000` and enjoy you degenerate mf :Skull:

### ☁️ Production (Host It)

To deploy on **Vercel**, **Netlify**, or any Node-supported platform:

```bash
pnpm install
pnpm run build
pnpm start
```

> Tip: Vercel is easiest. Just import the GitHub repo there — done.

---

## 🤝 Wanna Hire Me?

If you want:

* An API ( Check My work --> https://www.laxenta.tech/ ) 
* Full-stack NSFW (or SFW) websites
* UI/UX work or custom streaming setups
* Or Discord Bots or anything else, like Expanding an existing site of yours.

> Reach out on **Discord: @me\_straight**

---

## 👻 Demo Preview

No live demo hosted for *obvious reasons*.
Just run locally, it takes like 60 seconds.

---

> “I just wanted a smooth fap experience, so I built one.”
> — `@me_straight` on Discord LOL- contact for any kind of work im down bad for money frfr :3

```
