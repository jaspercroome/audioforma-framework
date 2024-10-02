---
theme: dashboard
title: Explore
toc: false
---

# Explore

Take a look at how 700+ spotify songs compare to one another

```ts
const tracks = await FileAttachment("./data/tracks.json").json();
```

```ts
const mySongs = await FileAttachment("./data/my_songs.json").json();
display(mySongs);
```

```ts
const artists = Array.from(
  new Set(tracks.map((track) => (track.preview_url ? track.artist : "")))
).sort();
const artistsSelection = view(
  Inputs.select(artists, { multiple: true, label: "Focus Artists" })
);
```

```html
<div
  id="tooltip"
  style="
    position: absolute;
    padding: 8px;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    border-radius: 4px;
    pointer-events: none;
    visibility: hidden;
    transition: opacity 0.2s ease-out;"
>
  <p id="tooltip-title"></p>
  <p id="preview-prompt" style="visibility: hidden;">
    Click the sphere for a 30s preview
  </p>
  <div
    class="tooltip-line"
    style="
    display: flex; 
    width: 100%;
    flex-direction: row;
    justify-content: space-between;
    "
  >
    <p>key:</p>
    <p id="key-value"></p>
  </div>

  <div
    class="tooltip-line"
    style="
    display: flex; 
    width: 100%;
    flex-direction: row;
    justify-content: space-between;
    "
  >
    <p>danceability</p>
    <p id="danceability-value"></p>
  </div>
  <div
    class="tooltip-line"
    style="
    display: flex; 
    width: 100%;
    flex-direction: row;
    justify-content: space-between;
    "
  >
    <p>energy</p>
    <p id="energy-value"></p>
  </div>
</div>
```

```js
import { songSpheres } from "./components/songSpheres.js";
```

```ts
display(songSpheres(tracks, artistsSelection));
```

```html
<audio id="player" src="" controls autoplay />
```
