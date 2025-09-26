# Letterboxd Toolbox
Welcome to my little toolbox of custom userscripts for [Letterboxd](https://letterboxd.com/), a growing collection of enhancements that add (in my opinion) much-needed features to the site.

I love Letterboxd, but there are a few things that have always bugged me or felt like they were just... missing. So I stopped waiting and started adding them myself.

> These scripts are written for [Violentmonkey](https://violentmonkey.github.io/), but they’ll also work just fine with any compatible userscript manager like [Tampermonkey](https://www.tampermonkey.net/) or [Greasemonkey](https://www.greasespot.net/)

---

## 📦 Included Userscripts

| Script | Description |
|--------|-------------|
| [Profile Average Rating](./profile-average-rating/README.md) | Letterboxd shows you your star distribution, but not the actual *average*. This script does the math and adds a proper weighted score to profile pages, so you (and everyone else) can finally see your true average. |
| [10-Point Scale (Toggle)](./10-point-scale/README.md) | Sometimes 5 stars feels too cramped, sometimes you just want to see things on a 10-point scale (like IMDb). This script adds a tiny toggle button next to ratings so you can switch back and forth instantly. |
| [Readable Runtime](./readable-runtime/README.md) | "130 mins" is technically correct, but it always makes me do the mental math. This script replaces runtimes with a cleaner format: `2 hrs 10 mins / 130 mins`. |
| [Ratings Shield](./ratings-shield/README.md) | Ever had a film spoiled for you just by seeing that everyone hates it? Or caught yourself doubting your own opinion because you saw the average first? This script hides the entire ratings block until you’ve marked the movie as watched. |

---

## 🚀 Getting Started

### Installation

1. Install [Violentmonkey](https://violentmonkey.github.io/) (or another userscript manager of your choice).  
2. Open the **raw** version of any script (see above).  
3. Your userscript manager will prompt you to install it.  
4. Hard-refresh the page:  
   - Windows/Linux → `Ctrl+F5` or `Ctrl+Shift+R`  
   - Mac → `Cmd+Shift+R`.

Done. The scripts run automatically in the background.

---

## 🤔 Why This Exists

Because Letterboxd is great, but it’s not perfect.  
And because sometimes you want to stop waiting for a feature request and just build it yourself.
This repo is me doing exactly that.

Believe me, I’ve tried countless times to get in touch with the folks at Letterboxd and send them my feature requests, but they never responded. And at this point, I honestly doubt they’ll ever add any of these things, even for Pro or Patron users.  

But hey, if **YOU**, the person reading this, happen to work at Letterboxd (or know someone who does), maybe there’s still a chance one day these features make it in officially. Until then, here we are.
