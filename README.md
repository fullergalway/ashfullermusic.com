# Ash Fuller

The public site is the `docs/` folder. GitHub Pages serves that folder at [ashfullermusic.com](https://ashfullermusic.com/). The `media/` folder holds the full-size photos. It is not published. Do not edit or delete those files when you only want to change the site.

Preview on your computer from the `docs/` folder:

```bash
python3 -m http.server 8765
```

Open `http://127.0.0.1:8765/`.

## Add a show

Edit `docs/data/shows.json` on GitHub. Add one object:

| Field | What to put |
| --- | --- |
| `date` | `YYYY-MM-DD` |
| `venue` | Venue name |
| `city` | City |
| `note` | Short line, or `""` |
| `ticketUrl` | An `https://` link, or `""` |
| `soldOut` | `true` or `false` |

Save the file. The page sorts the list. A date of today or later is upcoming, soonest first. An earlier date moves into past shows, most recent first. A sold-out show gets a Sold out tag. A ticket link is shown only on an upcoming show.

If the file is missing or empty of upcoming dates, the page keeps this line: "No dates announced right now. Follow on Instagram to hear first."

## Add a merch item

Edit `docs/data/merch.json`. The file ships as `[]`, and the Merch section stays hidden. Add an object:

| Field | What to put |
| --- | --- |
| `name` | Item name |
| `image` | Path from the page, such as `assets/img/shirt-960.webp` |
| `price` | Text, such as `€20` |
| `url` | An `https://` link |

When the list has at least one item with a name and a link, the Merch section and the Merch link in the header appear.

## Add a video

In `docs/index.html`, copy the Watch block that starts with `<article class="video">`. Set three things:

- the link `href` to the YouTube watch URL
- `data-id` to the 11-character video id
- `data-title` to the video title

Use a photo that is already on the site as the thumbnail. Add only a video from Ash Fuller's own YouTube channel. The player loads after a click.

## Add a photo

1. Put the full-size JPEG in `media/`. Do not put `media/` on the website.
2. Add the file name, without `.jpg`, to the `stems` list in `tools/build-images.mjs`.
3. In `tools/`, run `npm install` once, then `npm run build`.
4. Commit the new files in `docs/assets/img/`.
5. Add one `<figure>` in the gallery in `docs/index.html`. Write alt text from what is in the picture. Write a caption with the place and the photographer.

The build writes WebP and JPEG at 480, 960 and 1600 wide. It does not enlarge a photo, and it does not write a file wider than 1600. The hero photo also gets an 800-wide copy, so a phone does not download the 960 file. The build also refreshes `docs/assets/img/og.jpg` from the hero photo.

The local preview server does not use `docs/404.html` for a missing path. GitHub Pages does.

## Go live

1. Push this repository to GitHub.
2. Open Settings, then Pages. Under Build and deployment, choose Deploy from a branch. Branch: `main`. Folder: `/docs`. Save.
3. At the domain registrar, set four A records on the apex `ashfullermusic.com`:
   - `185.199.108.153`
   - `185.199.109.153`
   - `185.199.110.153`
   - `185.199.111.153`
4. Set a CNAME record for `www` to the GitHub Pages hostname. GitHub shows that name under Settings, then Pages. It looks like `yourname.github.io`.
5. Add a file `docs/CNAME` with one line, `ashfullermusic.com`, and push it. You can also type that domain under Settings, then Pages. GitHub writes the same file.
6. When the certificate is ready, turn on Enforce HTTPS.

Leave `docs/CNAME` out until the domain records are in place. With that file present, GitHub sends the `github.io` address to `ashfullermusic.com`.
