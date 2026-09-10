# G.P. Porwal College Central Library — Netlify Version 2

## What this is
A mobile-friendly free/open academic resource discovery portal for **G.P. Porwal College Central Library, Sindagi**.

### Student workflow
1. Student opens the public website.
2. Searches a subject/title/author.
3. The Netlify serverless API searches supported sources:
   - Open Library (open/full-text indicators)
   - Internet Archive text items
   - Google Books Full View
4. Student opens the original resource.
5. Student can generate a QR code for a result.
6. The QR opens a college-branded resource landing page.
7. The student taps **Read / Open / Download** and is sent to the original provider.

The app does **not** copy or re-host books. Access and download rights remain with the original provider.

## Netlify deployment
This project uses Netlify's current serverless Functions model with an ES module function (`.mjs`). Netlify's current documentation shows JavaScript/TypeScript functions in `netlify/functions` and supports custom function routing in `netlify.toml`.

### Option A — GitHub + Netlify
1. Create a GitHub repository.
2. Upload every file/folder from this project.
3. In Netlify choose **Add new project → Import an existing project**.
4. Select the GitHub repository.
5. Build command: leave blank.
6. Publish directory: `.`
7. Deploy.

The included `netlify.toml` already declares the functions directory and `/api/search` route.

### Option B — Netlify CLI
Install Node.js 22+, then:

    npm install -g netlify-cli
    netlify login
    cd gp_porwal_netlify_v2
    netlify deploy

For the first deployment, follow the prompts. To publish to production:

    netlify deploy --prod

## Important QR behavior
QR codes are generated in the student's browser and encode the current site's URL plus the original resource URL. Therefore, after deployment, QR codes point to your actual Netlify domain automatically.

Example concept:

    https://YOUR-SITE.netlify.app/?resource=https%3A%2F%2F...&title=...

This means you do not need to know the Netlify URL while developing.

## College website
Once deployed, you can place a button/link on the college website such as:

    Central Library → Free E-Resources

You can also later use a custom subdomain if your DNS/college web administration permits it.

## Why this version is not Python
Netlify's current Functions documentation centers on JavaScript/TypeScript for standard serverless Functions. This version therefore uses JavaScript for the Netlify API while remaining a simple web application. It is more reliable on Netlify than trying to run a persistent Python/Streamlit server there.

## Future Version 3
Possible additions:
- More open-resource APIs
- Dedicated e-book detail page
- PDF/full-download detection
- Subject/discipline filters
- Kannada + English interface
- Librarian dashboard
- QR print sheet (A4)
- Analytics without collecting student personal information
- Optional Netlify Blobs/database for curated resources
