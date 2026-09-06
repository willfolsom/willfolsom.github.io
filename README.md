# Will Folsom

Personal website, served directly by GitHub Pages. No dependency installation or build step is required.

## Local preview

From the repository root:

```sh
python3 -m http.server 8080 --bind 127.0.0.1
```

Open http://127.0.0.1:8080. Use an HTTP server rather than opening `index.html` directly, because the JavaScript uses native ES modules.

## Editing

- `index.html`: homepage copy, profile links, and card markup.
- `style.css`: typography, responsive layout, transparent card, and hover lighting.
- `app.js`: card flip, keyboard focus, hover response, and star pause control.
- `starfield.js`: randomized near/far stars, drift, and parallax.
- `assets/fonts/`: locally hosted fonts; licenses are in `assets/licenses/`.

The motion respects reduced-motion preferences. The homepage and profile links remain available without JavaScript. The optional WebMCP tools use the same flip actions as the visible controls.

The existing `CNAME` sets the custom domain to `willfolsom.com`. The wedding page, its stylesheet and images, and the existing 404 page are retained.

To publish, commit and push through the repository's existing GitHub Pages workflow.
