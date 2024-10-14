import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { BokehPass } from "three/examples/jsm/postprocessing/BokehPass.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";
import { FontLoader } from "three/addons/loaders/FontLoader.js";

import * as d3 from "d3";
import CameraControls from "camera-controls";
CameraControls.install({ THREE: THREE });

type Song = {
  artists: Array<{ name: string }>;
  id: string;
  name: string;
  tsne: [number, number, number];
  energy: number;
  valence: number;
  danceability: number;
  acousticness: number;
  loudness: number;
  key: number;
  mode: 0 | 1;
  timeSignature: number;
  previewUrl?: string;
  isRepresentative?: boolean;
  clusterDescription?: string;
  cluster: number;
};

type SongArray = Array<Song>;

const dimensions = { width: 1200, height: 800 };

const pitchClassMap = {
  0: "C ",
  1: "C♯",
  2: "D ",
  3: "D♯",
  4: "E ",
  5: "F ",
  6: "F♯",
  7: "G ",
  8: "G♯",
  9: "A ",
  10: "A♯",
  11: "B",
};

const setUpScene = () => {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    75,
    dimensions.width / dimensions.height,
    0.1,
    1000
  );
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  const clock = new THREE.Clock();
  renderer.setSize(dimensions.width, dimensions.height);
  renderer.shadowMap.enabled = true; // Enable shadows for realism
  renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Use soft shadows
  document.body.appendChild(renderer.domElement);

  const cameraControls = new CameraControls(camera, renderer.domElement);
  cameraControls.setLookAt(-12, 4, -12, 0, 0, 0, true);
  cameraControls.maxZoom = 25;
  cameraControls.minZoom = 0.5;
  cameraControls.smoothTime = 0.3;

  return { cameraControls, scene, clock, camera, renderer };
};

const addSpheres = (songs: SongArray, scene: THREE.Scene) => {
  const spheres: THREE.Mesh[] = [];
  const sphereGeometry = new THREE.SphereGeometry(0.15, 32, 32);
  const xExtent = d3.extent(songs.map((item) => item.loudness)) as [
    number,
    number
  ];
  const yExtent = d3.extent(songs.map((item) => item.valence)) as [
    number,
    number
  ];
  const zExtent = d3.extent(songs.map((item) => item.danceability)) as [
    number,
    number
  ];
  const xScale = d3.scaleLinear().domain(xExtent).range([-8, 8]);
  const yScale = d3.scaleLinear().domain(yExtent).range([-8, 8]);
  const zScale = d3.scaleLinear().domain(zExtent).range([-8, 8]);

  songs.forEach((song) => {
    const colorAngle = 1 - song.valence;

    const color =
      colorAngle < 0
        ? "#afafaf"
        : new THREE.Color(d3.hsl(colorAngle * 250, 1, 0.5).toString());
    const material = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.5,
      metalness: 0.1,
    });

    const sphere = new THREE.Mesh(sphereGeometry, material);
    sphere.castShadow = true;
    sphere.userData = song;
    sphere.position.set(
      xScale(song.loudness),
      yScale(song.valence),
      zScale(song.danceability)
    );
    spheres.push(sphere);
    scene.add(sphere);
  });

  return spheres;
};
const addLight = (scene: THREE.Scene) => {
  // Ambient light for overall scene lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 1);
  scene.add(ambientLight);

  // Directional light for creating shadows
  const directionalLight = new THREE.DirectionalLight(0xffffff, 3);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.set(1024, 1024);
  directionalLight.position.set(5, 10, 5);
  scene.add(directionalLight);

  // Spotlight for highlighting specific areas
  const spotLight = new THREE.SpotLight(0xffffff, 1.5, 30, Math.PI / 6, 1.5);
  spotLight.position.set(-10, 20, 10);
  spotLight.castShadow = true;
  scene.add(spotLight);
};
const setUpComposer = (
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera
) => {
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  // Add Bokeh (depth of field) pass
  const bokehPass = new BokehPass(scene, camera, {
    focus: 12.0, // Adjust focus distance
    aperture: 0.025, // Aperture - affects bokeh intensity
    maxblur: 1.0, // Maximum blur
  });
  composer.addPass(bokehPass);

  return composer;
};
const addFloor = (scene: THREE.Scene) => {
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 30),
    new THREE.MeshStandardMaterial({
      color: "#ffffff",
      metalness: 0.3,
      roughness: 0.4,
    })
  );
  floor.receiveShadow = true;
  floor.position.y = -10;
  floor.rotation.x = -Math.PI * 0.5;
  scene.add(floor);
};
const addGrids = (scene: THREE.Scene) => {
  const fontLoader = new FontLoader();
  fontLoader.load("arial", (font) => {
    const textOptions = {
      font: font,
      size: 1, // Adjust to your desired text size
      height: 0.2, // Adjust to control depth of the text
      curveSegments: 12, // Quality of the text
    };

    const yAxisMarkerGeo = new TextGeometry("Valence", textOptions);
    const xAxisMarkerGeo = new TextGeometry("Loudness", textOptions);
    const zAxisMarkerGeo = new TextGeometry("Danceability", textOptions);

    const textMaterial = new THREE.MeshStandardMaterial({
      color: "#ffffff",
      metalness: 0.3,
      roughness: 0,
    });

    const yAxisMarkerMesh = new THREE.Mesh(yAxisMarkerGeo, textMaterial);
    yAxisMarkerMesh.position.set(8, 0, 8);
    yAxisMarkerMesh.rotation.y = Math.PI * 0.5;
    scene.add(yAxisMarkerMesh);

    const xAxisMarkerMesh = new THREE.Mesh(xAxisMarkerGeo, textMaterial);
    xAxisMarkerMesh.position.set(0, -8, 8);
    xAxisMarkerMesh.rotation.x = Math.PI * 0.5;
    scene.add(xAxisMarkerMesh);

    const zAxisMarkerMesh = new THREE.Mesh(zAxisMarkerGeo, textMaterial);
    zAxisMarkerMesh.position.set(8, -8, 0);
    zAxisMarkerMesh.rotation.x = Math.PI * 0.5;
    scene.add(zAxisMarkerMesh);
  });

  const gridHelperXY = new THREE.GridHelper(15, 15, "white", "white");
  const gridHelperYZ = new THREE.GridHelper(15, 15, "white", "white");
  const gridHelperXZ = new THREE.GridHelper(15, 15, "white", "white");
  gridHelperXY.rotation.x = -Math.PI * 0.5;
  gridHelperYZ.rotation.z = -Math.PI * 0.5;
  gridHelperXY.position.z = 8;
  gridHelperXZ.position.y = -8;
  gridHelperYZ.position.x = 8;
  scene.add(gridHelperXY);
  scene.add(gridHelperYZ);
  scene.add(gridHelperXZ);
};
const addHighlightRing = (scene: THREE.Scene) => {
  // Ring for highlighting hovered sphere
  const ringGeometry = new THREE.RingGeometry(0.4, 0.27, 32);
  const ringMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide,
  });
  const highlightRing = new THREE.Mesh(ringGeometry, ringMaterial);
  highlightRing.visible = false;
  scene.add(highlightRing);
  return highlightRing;
};
const onMouseMove = (
  event: MouseEvent,
  mouse: THREE.Vector2,
  tooltip: HTMLDivElement | null
) => {
  const { offsetY, offsetX } = event;

  mouse.x = (offsetX / dimensions.width) * 2 - 1;
  mouse.y = -(offsetY / dimensions.height) * 2 + 1;
  if (tooltip) {
    tooltip.style.left = `${event.clientX + 10}px`;
    tooltip.style.top = `${event.clientY + 10}px`;
  }
};
const onMouseClick = (
  event: MouseEvent,
  mouse: THREE.Vector2,
  raycaster: THREE.Raycaster,
  cameraControls: CameraControls,
  camera: THREE.Camera,
  spheres: THREE.Mesh<
    THREE.BufferGeometry<THREE.NormalBufferAttributes>,
    THREE.Material | THREE.Material[],
    THREE.Object3DEventMap
  >[]
) => {
  const { offsetX, offsetY } = event;
  mouse.x = (offsetX / dimensions.width) * 2 - 1;
  mouse.y = -(offsetY / dimensions.height) * 2 + 1;

  // Update raycaster with mouse position and camera
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(spheres);

  // If there's an intersection, update the camera target
  if (intersects.length > 0) {
    const intersected = intersects[0].object;
    const targetPosition = intersected.position;

    // Smoothly update the camera target to focus on the clicked sphere
    cameraControls.setLookAt(
      camera.position.x,
      camera.position.y,
      camera.position.z,
      targetPosition.x,
      targetPosition.y,
      targetPosition.z,
      true // Animation enabled for smooth transition
    );
    const audioPlayer = document.querySelector(
      "#sample-player"
    ) as HTMLAudioElement;
    audioPlayer.src = intersected.userData.previewUrl;
  }
};

const animate = () => {};

const barScale = (value: number) => {
  const integerValue = value * 100;
  return `<div style='width:${integerValue}%; height:1em; background:${d3.hsl(
    160 * value,
    1,
    0.5
  )}; border-right:white 4px solid;'/>`;
};

const updateTooltip = (songData: Song, tooltip: HTMLDivElement | null) => {
  if (tooltip) {
    const title = document.getElementById("tooltip-title");
    const prompt = document.getElementById("preview-prompt");
    if (title) {
      title.innerHTML = `<strong>${songData.name} - ${songData.artists[0].name}</strong>`;
      if (songData.previewUrl) {
        if (prompt) {
          prompt.style.visibility = "visible";
        }
      } else {
        if (prompt) {
          prompt.style.visibility = "hidden";
        }
      }
    }
    // line2.innerHTML = `<p>mode:</p><strong>${
    //   songData.mode > 0 ? "Major" : "Minor"
    // }</strong>`;
    tooltip.style.opacity = "1";
    tooltip.style.visibility = "visible";
  }
};

export const songSpheres = (songs: SongArray, artists: Array<string>) => {
  // Setup Scene, Camera, and Renderer
  const { clock, scene, cameraControls, camera, renderer } = setUpScene();
  addLight(scene);
  addGrids(scene);
  // addFloor(scene);
  const filteredSongs = songs.filter(
    (song) =>
      song.id.includes("sample_") ||
      artists.includes(song.artists[0].name) ||
      artists.length === 0
  );
  const spheres = addSpheres(filteredSongs, scene);
  const highlightRing = addHighlightRing(scene);

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  const tooltip = document.getElementById("tooltip") as HTMLDivElement | null;

  window.addEventListener("mousemove", (e) => onMouseMove(e, mouse, tooltip));
  window.addEventListener("click", (e) =>
    onMouseClick(e, mouse, raycaster, cameraControls, camera, spheres)
  );
  // Set up post-processing with bokeh effect
  // const composer = setUpComposer(renderer, scene, camera);

  // Animation Loop
  function animate() {
    requestAnimationFrame(animate);

    // Update raycaster with mouse position and camera
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(spheres);

    // Highlight the intersected sphere
    if (intersects.length > 0) {
      const intersected = intersects[0].object;

      updateTooltip(intersected.userData as Song, tooltip);

      highlightRing.position.copy(intersected.position);
      highlightRing.lookAt(camera.position);
      highlightRing.visible = true;
    } else {
      if (tooltip) {
        tooltip.style.opacity = "0";
        tooltip.style.visibility = "hidden";
      }
      highlightRing.visible = false;
    }

    // Update controls and render the scene
    const delta = clock.getDelta();
    const hasControlsUpdated = cameraControls.update(delta);

    // Always render when highlight ring visibility or controls change
    if (highlightRing.visible || hasControlsUpdated) {
      renderer.render(scene, camera);
    }
  }

  animate();
  return renderer.domElement;
};
