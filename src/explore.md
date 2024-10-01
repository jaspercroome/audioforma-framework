---
theme: dashboard
title: Explore
toc: false
---

# Explore 

Take a look at how 700+ spotify songs compare to one another

```ts
const tracks = await FileAttachment("./data/tracks.json").json()
```
```html
<div id="tooltip" style="
    position: absolute;
    padding: 8px;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    border-radius: 4px;
    pointer-events: none;
    visibility: hidden;
    transition: opacity 0.2s ease-out;">
</div>
```
```js
import {songSpheres} from './components/songSpheres.js'
```
```ts
display(songSpheres(tracks))
```
```html
<audio id="player"src="" controls autoplay/>
```