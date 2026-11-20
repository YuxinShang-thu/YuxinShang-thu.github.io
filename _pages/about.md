---
layout: home
permalink: /
title: "Yuxin Shang"
redirect_from:
  - /about/
  - /about.html
# The short introduction under your name.
lead: "I'm a Ph.D. student in astronomy at [The Ohio State University](https://astronomy.osu.edu), working on gravitational microlensing for the [Roman](https://roman.gsfc.nasa.gov) Galactic Bulge Time Domain Survey. Before OSU, I once worked on microlensing and weak lensing in my undergraduate period."
# Set to false to hide the interactive figure.
lens_figure: true
# The last sentence of the figure caption.
lens_note: "This is the well-known close–wide degeneracy. There are MORE problematic degeneracies in microlensing, which can cause severe mistake in statistics! My [first paper](/publications/2025-11-21-binary-lens-degeneracy/) is about the degeneracies that do: cases where the competing models disagree on <i>q</i>, such as a planet versus a stellar binary. Those events are treated specially or left out of statistical samples, and accounting for that lowers the planetary sensitivity of a pure-survey sample by 5–10%."
---

<section class="section" id="about">
<h2 class="section__title">About</h2>
<div class="section__body prose" markdown="1">

I'm a new Ph.D. graduate student in astronomy at [The Ohio State University](https://www.osu.edu). I come from China and get a B.S. degree in Mathematics and Physics from [Tsinghua University](https://www.tsinghua.edu.cn/en/). Before entering university, I grew up and got my education in [Luanchuan County, Luoyang](https://en.wikipedia.org/wiki/Luanchuan_County), a beautiful place. Through ["Ziqiang Program"](https://join-tsinghua.edu.cn/gnxs/zqjh.htm), I entered Tsinghua University in 2022 successfully. You can learn my high school life in this [blog](https://outputasinterest.blogspot.com/2026/09/blog-post.html).

</div>
</section>

<section class="section" id="research">
<h2 class="section__title">Research</h2>
<div class="section__body">
<div class="prose" markdown="1">

I have a broad interest in different fields of astronomy, from exoplanet to cosmology, from theory to observation. In detail, I have related research experience in microlensing (theory and observation, supervised by Prof. [Shude Mao](https://en.westlake.edu.cn/faculty/Shude-Mao.html)) as well as weak lensing (theory on intrinsic alignment, supervised by Prof. [Henk Hoekstra](https://www.universiteitleiden.nl/en/staffmembers/henk-hoekstra)). I also worked on deep learning and combine it with the weak lensing work as the topic of my graduate thesis (supervised by Prof. [Yuan-sen Ting](https://www.google.com/search?client=safari&rls=en&q=Yuansen+Ting&ie=UTF-8&oe=UTF-8)).

My first first-author paper on microlensing has been [published](https://iopscience.iop.org/article/10.3847/1538-3881/ae14f3) in AJ, revealing a 5–10% overestimation on microlensing planetary sensitivity caused by the ignorance of binary-lens degeneracy. This effect is necessary to be mitigated in next-generation microlensing mission like [Earth 2.0](https://arxiv.org/abs/2206.06693) and [Roman](https://roman.gsfc.nasa.gov) GBTDS.

</div>
{%- assign pubs = site.publications | sort: "date" | reverse %}
{%- for pub in pubs limit: 3 %}
{% include publication-item.html pub=pub %}
{%- endfor %}
{%- if pubs.size > 3 %}
<p class="more"><a href="{{ '/publications/' | relative_url }}">All publications</a></p>
{%- endif %}
</div>
</section>

<section class="section" id="talks">
<h2 class="section__title">Recent talks</h2>
<div class="section__body">
{%- assign talks = site.talks | sort: "date" | reverse %}
{%- for talk in talks limit: 3 %}
{% include talk-item.html talk=talk compact=true %}
{%- endfor %}
{%- if talks.size > 3 %}
<p class="more"><a href="{{ '/talks/' | relative_url }}">All talks</a></p>
{%- endif %}
</div>
</section>

<section class="section" id="life">
<h2 class="section__title">Outside research</h2>
<div class="section__body prose" markdown="1">

In daily life, I am really into the nature. Besides the starry sky we always study, I like forests, mountains and especially the sea. I am good at hiking, which is a skill I learned when I was a child in my mountain hometown. I am now fascinated by skiing and expecting next winter. After several out-seas experiences, I become enjoying cooking and I can cook several Chinese cuisine very well, like [Hot Oil-Splashed Noodles](https://tastecooking.com/recipes/hot-oil-seared-biang-biang-noodles/), [Big Plate Chicken](https://en.wikipedia.org/wiki/Dapanji), and [Cold Noodles with Sesame Sauce](https://www.thekitchn.com/sesame-noodles-recipe-23281160).

</div>
</section>

<section class="section" id="outreach">
<h2 class="section__title">Outreach</h2>
<div class="section__body prose" markdown="1">

I consider the connection between people important. When in Tsinghua University, I devoted a lot of time into the social organization and scientific outreach by joining Tsinghua Astronomy Society (TAS). TAS is an interest-club in Tsinghua University, with more than 2000 members including undergraduates and graduates. I was the scientific minister during 2024–2025. The focus of this position is about popularization of science and scientific outreach. You can follow the WeChat channel "<span lang="zh-Hans">清华天协</span>" (with 20k fans by now) to receive the notifications of our news, articles as well as activities.

</div>
</section>
