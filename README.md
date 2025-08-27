# 🍑 Hanime-scraper (for people who have sites blocked on thier network)

( This includes the api functions for scraping content from api on demand and is not a standalone scraper but rather a site page )
A literal full open source website that pulls NSFW content from [Hanime.to](https://hanime.to) and Redgifs via clean proxying and some spicy header tricks. Built entirely to stream and browse anime corn like it's Netflix for degenerates.  
You can self-host it on Vercel or any other platform — or just peek the code for the sneaky tricks.

## 💻 By [@me_straight](https://discord.com/@me_Straight) on Discord, Hobbyist dev :3  
> I made this for fun and boredom. If you're tryna commission something nasty or clever idc, i will do it for fun and **pretty less** price — **hit me up**.

---

## ✅ Features
- Clean UI (Tailwind, Next.ts)
- HLS streaming with auto quality (no lag BS)
- Full metadata + search support
- Scrapes Hanime API directly
- Bypasses CORS by proxying simply with fake user-agent header :)
- No captcha, no popups, no interruptions  
- Works from Vercel with 0 backend setup stress

---

## ⚠️ LEGAL NOTE
This is for **educational purposes only**. I do not condone piracy or distribution of NSFW content without permission. This is a demonstration of proxy architecture and API handling.  
**If you deploy or use this inappropriately — that’s on you, not me.**

---

## 📦 Tech Stack ( just for an simple outline )

| Frontend | Backend | Hosting | Streaming |
|----------|---------|---------|-----------|
| Next.ts  | Next.ts | Vercel? | HLS.js    |

---

## 🧠 How It Works

- Finds Hanime’s open API
- Bypasses CORS using our proxy api 
- Spoofs headers as a user-agent to pretend its a user, not a scraper
- Pipes data cleanly to frontend using Next.js API fr : ) 
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

> “I just wanted a smooth fap experience for my gooner friends- so I built one.”
> — `@me_straight` on Discord LOL- contact for any kind of work im down bad for money frfr :3

```
