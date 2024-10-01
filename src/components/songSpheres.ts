import * as THREE from 'three';
import * as d3 from 'd3'
import CameraControls from 'camera-controls';

CameraControls.install( { THREE: THREE } );

type SongArray = Array<{id:string,name:string,tsne:[number,number,number],energy:number,valence:number,danceability:number}>

const dimensions = {width:800,height:600}

const setUpScene = ()=> {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, dimensions.width / dimensions.height, 0.01, 1000);
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  const clock = new THREE.Clock();
  renderer.setSize(dimensions.width, dimensions.height);
  document.body.appendChild(renderer.domElement);
  
  const cameraControls = new CameraControls( camera, renderer.domElement );
  cameraControls.setLookAt(12,4,15,0,2,0,false)
  cameraControls.maxZoom = 25
  cameraControls.minZoom = .5
  cameraControls.smoothTime = .3
  return {cameraControls,scene,clock, camera, renderer}
}

const addSpheres = (songs:SongArray,scene:THREE.Scene) => {
  const spheres: THREE.Mesh[] = [];
  const sphereGeometry = new THREE.SphereGeometry(.15, 16, 16);
  const sampleSphereGeometry = new THREE.SphereGeometry(.4, 16, 16);
  const sphereMaterial = new THREE.MeshBasicMaterial();
  songs.forEach((song) => {
    const isSample = song.id.includes("sample_")
    const sampleColor = new THREE.Color(200,180,200)
    const color = new THREE.Color(d3.hsl(song.energy * song.valence * song.danceability * 360,.8,.5).toString());
    const material = sphereMaterial.clone();
    material.color = isSample? sampleColor : color;
  
    const sphere = new THREE.Mesh(isSample? sampleSphereGeometry : sphereGeometry, material);
    sphere.userData = song
    sphere.position.set(...song.tsne);
    spheres.push(sphere);
    scene.add(sphere);
  });
  return spheres
}
const addLight = (scene:THREE.Scene) => {
  /**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.2);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.set(1024, 1024);
directionalLight.shadow.camera.far = 15;
directionalLight.shadow.camera.left = -7;
directionalLight.shadow.camera.top = 7;
directionalLight.shadow.camera.right = 7;
directionalLight.shadow.camera.bottom = -7;
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);
}
const addFloor = (scene:THREE.Scene)=> {
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 30),
    new THREE.MeshStandardMaterial({
      color: "#ffffff",
      metalness: 0.3,
      roughness: 0.4,
    })
  );
  floor.receiveShadow = true;
  floor.position.y = -10
  floor.rotation.x = -Math.PI * 0.5;
  scene.add(floor);
}
const addGrids = (scene:THREE.Scene)=> {
  const gridHelperXY = new THREE.GridHelper(15,15,'white','white')
  const gridHelperYZ = new THREE.GridHelper(15,15,'white','white')
  const gridHelperXZ = new THREE.GridHelper(15,15,'white','white')
  gridHelperXY.rotation.x = -Math.PI * .5
  gridHelperYZ.rotation.z = -Math.PI * .5
  scene.add(gridHelperXY)
  scene.add(gridHelperYZ)
  scene.add(gridHelperXZ)
}
const addHighlightRing = (scene:THREE.Scene)=>{
// Ring for highlighting hovered sphere
const ringGeometry = new THREE.RingGeometry(.22, .27, 32);
const ringMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
const highlightRing = new THREE.Mesh(ringGeometry, ringMaterial);
highlightRing.visible = false;
scene.add(highlightRing);
return highlightRing
}
const onMouseMove = (event: MouseEvent,mouse: THREE.Vector2, tooltip:HTMLDivElement|null)=> {
  const {offsetY, offsetX} = event

  mouse.x = (offsetX / dimensions.width) * 2 - 1;
  mouse.y = -(offsetY / dimensions.height) * 2 + 1;
  if (tooltip){
    tooltip.style.left = `${event.clientX + 10}px`;
    tooltip.style.top = `${event.clientY + 10}px`;
  }
}
const onMouseClick = (event: MouseEvent,mouse: THREE.Vector2, raycaster:THREE.Raycaster,cameraControls:CameraControls,camera:THREE.Camera,spheres:THREE.Mesh<THREE.BufferGeometry<THREE.NormalBufferAttributes>, THREE.Material | THREE.Material[], THREE.Object3DEventMap>[])=>  {
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
      camera.position.x, camera.position.y, camera.position.z,
      targetPosition.x, targetPosition.y, targetPosition.z,
      true // Animation enabled for smooth transition
    );
    const audioPlayer = document.querySelector('#player') as HTMLAudioElement
    audioPlayer.src = intersected.userData.preview_url
  }
}

const animate = () => {}



export const songSpheres = (songs:SongArray) => {
// Setup Scene, Camera, and Renderer
const {clock,scene,cameraControls,camera, renderer} = setUpScene()
addLight(scene)
addGrids(scene)
const spheres = addSpheres(songs,scene)
const highlightRing = addHighlightRing(scene)

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const tooltip = document.getElementById('tooltip')as HTMLDivElement|null

window.addEventListener('mousemove', (e)=>onMouseMove(e,mouse,tooltip));
window.addEventListener('click', (e)=>onMouseClick(e,mouse,raycaster,cameraControls,camera,spheres));

// Animation Loop
function animate() {
  requestAnimationFrame(animate);

  // Update raycaster with mouse position and camera
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(spheres);
  
  // Highlight the intersected sphere
  if (intersects.length > 0) {
    const intersected = intersects[0].object;

    if (tooltip){
      tooltip.innerHTML = `<strong>${intersected.userData.name}</strong><br>${intersected.userData.artist}<br>Energy: ${intersected.userData.energy}<br>Valence: ${intersected.userData.valence}<br>Danceability: ${intersected.userData.danceability} ${intersected.userData.preview_url? 'click for details': ''}`;
      tooltip.style.opacity = '1'
      tooltip.style.visibility = 'visible';
    }

    highlightRing.position.copy(intersected.position);
    highlightRing.lookAt(camera.position);
    highlightRing.visible = true;
  } else {
    if (tooltip){
      tooltip.style.opacity = '0'
      tooltip.style.visibility = 'hidden'
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
return renderer.domElement
}