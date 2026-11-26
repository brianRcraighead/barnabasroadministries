# Ministry design themes

Researched November 26, 2026. These are original Barnabas designs informed by prominent discipleship sites found in search and inspected directly in a browser. Search results vary; this is not a claim about exact Google rankings. No third-party copy, logos, photographs, proprietary fonts or scripts were copied.

| Theme | Observed reference | Barnabas treatment |
| --- | --- | --- |
| Quiet Way | [Practicing the Way](https://www.practicingtheway.org/) uses warm earth tones, generous type and prominent introductions. | Warm paper, terracotta actions, light sans headings, centered text-only introductions and open spacing. |
| Rooted | [Renovare](https://renovare.org/) pairs an understated cream surface and green with large editorial serif typography. | Parchment and forest green, Georgia headings, restrained lines and narrower reading sections. |
| Fellowship | [The Navigators](https://www.navigators.org/) uses strong hierarchy, photography and teal-led sections to organize discipleship resources. | Teal and white, a left-aligned introduction, strong dividers, numbered culture lists and open ministry rows. |
| Scripture | [BibleProject](https://bibleproject.com/) uses bold typography, clear resource categories and a dark illustrated seasonal introduction. | Navy and gold, a solid dark introduction, centered text, bold sans headings and warm reading sections. No illustration or animation is required. |

In Organization & style, select a preview tile, choose a page and Desktop/Phone preview, then Use theme. Preview is temporary; Use theme changes only project.theme in the draft. Save and Publish remain explicit separate actions. Existing palette choices remain available in the Theme dropdown. Undo or Versions can restore a previous choice. Theme changes preserve all content, IDs, page paths, links, photos, navigation layout, integration settings, and custom canvas artwork. Freeform canvas colors and positions remain manually controlled.

Themes are shared by the editor, HTML/ZIP exports and Astro through public/lib/themes.js and public/lib/site.js. Only the selected theme stylesheet is emitted. System fonts avoid external font requests. Public pages remain static with no visitor JavaScript. Base text/button colors have contrast checks; custom canvas colors and manually chosen content require their own review.

Future maintenance: add catalog metadata and selected CSS, include its ID in validation through supportedThemeIds, and extend the invariance/contrast tests. Do not create a parallel content template per design or replace draft pages when selecting a theme.
