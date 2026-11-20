# yuxinshang-thu.github.io

Source of [Yuxin Shang's website](https://yuxinshang-thu.github.io). It is a
[Jekyll](https://jekyllrb.com) site that GitHub Pages builds on every push to
`master`. There is no other build step: no Sass, no npm, no JavaScript bundler.

## Where things are

| To change… | Edit |
| --- | --- |
| Home page text, the introduction under your name | `_pages/about.md` |
| CV (education, research, skills, awards, service) | `_data/cv.yml` |
| Name, email, office, profile links, site description | `_config.yml` |
| Links in the top bar | `_data/navigation.yml` |
| Papers | one file per paper in `_publications/` |
| Talks | one file per talk in `_talks/` |
| Profile photo | `images/profile-portrait.jpg` (4:5, about 720 × 900 px) |
| Colours, fonts, spacing | `assets/css/site.css` (the variables at the top) |

The Publications and Talks pages, the lists on the home page and the lists on
the CV are all generated from `_publications/` and `_talks/`.

### Add a paper

Create `_publications/YYYY-MM-DD-short-name.md`:

```yaml
---
title: "Title of the paper"
collection: publications
category: manuscripts          # manuscripts, conferences or books (see _config.yml)
date: 2026-05-01
venue: "The Astrophysical Journal"
citation: "Yuxin Shang et al 2026 ApJ 999 1"
excerpt: "One or two sentences on the result."
paperurl: "https://..."        # optional
arxiv: "https://arxiv.org/abs/..."   # optional
ads: "https://ui.adsabs.harvard.edu/abs/..."   # optional
code: "https://github.com/..."       # optional
---
The abstract goes here.
```

### Add a talk

Create `_talks/YYYY-MM-DD-short-name.md`:

```yaml
---
title: "Title of the talk"
collection: talks
type: "Conference Talk"
venue: "Name of the meeting"
location: "City, Country"
date: 2026-05-01
permalink: /talks/2026-05-01-short-name
---
A paragraph about the talk. Markdown links work.
```

### The figure on the home page

The interactive microlensing figure is `_includes/lens-figure.html` (labels,
caption, starting values) and `assets/js/lens.js` (the lensing calculation and
the drawing). To remove it, set `lens_figure: false` at the top of
`_pages/about.md`.

`images/lens-figure.png` is a still of the figure for visitors without
JavaScript. If you change the starting values, replace it with a new screenshot.

### Math

MathJax is not loaded. For the occasional symbol, write HTML in the Markdown
file, for example `<i>O</i>(10<sup>3</sup>)`.

## Preview on your computer

```bash
bundle install
bundle exec jekyll serve
```

Then open <http://localhost:4000>. Restart the server after editing
`_config.yml`. The `Dockerfile` and `.devcontainer` from the original template
still work if you prefer those.

## Credits

- Typefaces: [STIX Two Text](https://github.com/stipub/stixfonts) and
  [Archivo](https://github.com/Omnibus-Type/Archivo), both under the SIL Open
  Font License (copies in `assets/fonts/`). The files here are subsets with
  Latin and Greek only.
- The repository started from the
  [Academic Pages](https://github.com/academicpages/academicpages.github.io)
  template (MIT, see `LICENSE`). `markdown_generator/`, `scripts/` and the
  `talkmap` files are left over from it.
