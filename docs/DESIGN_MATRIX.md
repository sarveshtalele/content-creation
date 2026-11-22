# Design decision matrix

Used by `studio.py plan` to pick the design for a given piece of content. Built from the six reference designs supplied for this project (a grey-studio isometric reel with orange belts and glass panels, a dark isometric cloud-pipeline infographic, a blue 3D marketing funnel with a numbered list, an editorial funnel-as-building, and two bold-type poster layouts), analysed by eye from screenshots. The reference reel and Pinterest pin themselves could not be opened from the sandbox.

| Content shape | Signals in the source | Best design | Why (from the references) |
|---|---|---|---|
| Things that pass or fail checks | gates, review, approval, queue, pass rates | `conveyor` (grey studio, orange belt) | Motion shows who drops out; matches the reel reference |
| Narrowing numbers | conversion, drop-off, shares, "of those" | `funnel` (3D drums + beads) | The silhouette is the data; the numbered side list from the funnel reference |
| Stages of a build or system | layers, floors, stack | `tower` / `exploded` / `lanes` | One object with labelled levels, as in the editorial funnel-tower |
| Data or request moving between systems | pipeline, ETL, request path | `isoflow` / `pipeline` | Glowing path between platforms, labels with leader lines |
| Ranking or sizes | top N, biggest, share | `skyline` | Height encodes the number |
| Bold opinion or contrarian claim (carousel) | "stop", "never", "myth", short claim | Poster slide: giant sans headline, one highlighted word on a coloured box | Both poster references lead with one huge line and one highlighted word |
| Steps to do | numbered steps, commands | `terminal` / `flow` carousel slides | Numbered list beside a visual |
| Two options | vs, instead of | `compare` carousel slide | Side-by-side cards |
| Lists of links | URLs | `shot` slides + comment text | Link cards |

Scoring: for each row count the signal words in the source (weight 2), numbers (weight 1) and whether the output is a carousel, GIF or Reel. The highest total wins; ties go to the template that fits the item count (3-5 items). `studio.py plan` prints the ranking and the reason.
