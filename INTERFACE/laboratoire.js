import * as THREE from "three";
import { STLLoader } from "three/addons/loaders/STLLoader.js";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { ThreeMFLoader } from "three/addons/loaders/3MFLoader.js";

const $ = id => document.getElementById(id);
const api = async (path, options={}) => {
  if (!window.CEC_AUTH_API) throw new Error("Serveur de connexion non configuré.");
  const response = await fetch(window.CEC_AUTH_API + "/api" + path, {
    credentials: "include",
    headers: {"Content-Type":"application/json"},
    ...options
  });
  let data = {};
  try { data = await response.json(); } catch {}
  if (!response.ok) throw new Error(data.detail || data.error || "Erreur serveur.");
  return data;
};
let files = [];
let selectedId = null;
let renderer = null, scene = null, camera = null, controls = null, activeObject = null, resizeObserver = null, animationFrameId = 0;
let wireframeOn = false;
const objectUrls = new Set();
const textExtensions = new Set(["ino","cpp","c","h","hpp","py","js","ts","json","yaml","yml","xml","csv","txt","md","hex"]);
const imageExtensions = new Set(["png","jpg","jpeg","webp","gif","svg"]);
const modelExtensions = new Set(["stl","obj","glb","gltf","3mf"]);
const nativeCad = new Set(["step","stp","iges","igs","sldprt","sldasm","slddrw","slddrt","dxf","ai"]);
const extOf = name => (name.split(".").pop() || "").toLowerCase();
const fmtSize = n => n < 1024 ? n+" o" : n < 1024*1024 ? (n/1024).toFixed(1)+" Ko" : (n/1024/1024).toFixed(2)+" Mo";
const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const iconFor = ext => modelExtensions.has(ext) || nativeCad.has(ext) ? "🧊" : textExtensions.has(ext) ? "💻" : ext==="pdf" ? "📄" : imageExtensions.has(ext) ? "🖼️" : "📎";
function status(message, ok=false){ $("aiStatus").textContent=message; $("aiStatus").className="small "+(ok?"lab-success":"muted"); }
function requireSession(){
  api("/me").then(data=>{const user=data.user; $("labIdentity").textContent=(user.username||"Compte connecté")+" · "+(user.role==="prof"?"Professeur":user.role==="admin"?"Administrateur":"Élève"); if(user.role==="prof"){ $("askAi").disabled=true; status("Le compte professeur est en consultation seule. Connecte-toi avec un compte élève pour interroger l’IA."); } else { $("askAi").disabled=!selectedId; } }).catch(()=>{location.href="index.html";});
}
function revokeUrls(){ for(const url of objectUrls) URL.revokeObjectURL(url); objectUrls.clear(); }
function disposeObject(object){
  if(!object)return;
  object.traverse(child=>{
    if(child.geometry)child.geometry.dispose();
    if(child.material){
      const materials=Array.isArray(child.material)?child.material:[child.material];
      materials.forEach(material=>{
        if(!material)return;
        for(const value of Object.values(material)){if(value && value.isTexture)value.dispose();}
        material.dispose();
      });
    }
  });
}
function destroyViewer(){
  if(animationFrameId)cancelAnimationFrame(animationFrameId);
  animationFrameId=0;
  if(resizeObserver){resizeObserver.disconnect();resizeObserver=null;}
  if(controls?.dispose) controls.dispose();
  disposeObject(activeObject);
  if(renderer){renderer.dispose();renderer.domElement.remove();}
  renderer=null;scene=null;camera=null;controls=null;activeObject=null;wireframeOn=false;
  $("viewer").innerHTML='<div class="viewer-empty"><span>🧊</span><b>Ton aperçu apparaîtra ici</b><p>Les modèles 3D peuvent être tournés, déplacés et agrandis.</p></div>';
  $("viewerTools").hidden=true;$("modelStats").hidden=true;$("dimensionCheck").hidden=true;$("textPreview").hidden=true;$("unsupported").hidden=true;
}
function renderList(){
  const el=$("fileList");
  if(!files.length){el.innerHTML='<p class="notice">Aucun fichier ajouté. Commence par choisir un modèle, un programme ou un document.</p>';return;}
  el.innerHTML=files.map(f=>'<div class="file-row '+(f.id===selectedId?"selected":"")+'"><span class="file-symbol">'+iconFor(extOf(f.file.name))+'</span><button class="file-pick" type="button" data-pick="'+f.id+'"><strong>'+escapeHtml(f.file.name)+'</strong><small>'+fmtSize(f.file.size)+' · '+escapeHtml(extOf(f.file.name).toUpperCase()||"Fichier")+'</small></button><button class="file-remove" type="button" data-remove="'+f.id+'" aria-label="Retirer '+escapeHtml(f.file.name)+'">×</button></div>').join("");
}
function addFiles(incoming){
  for(const file of Array.from(incoming||[])){
    if(files.some(x=>x.file.name===file.name&&x.file.size===file.size&&x.file.lastModified===file.lastModified))continue;
    files.push({id:crypto.randomUUID?crypto.randomUUID():String(Date.now())+Math.random(),file});
  }
  renderList();
  if(!selectedId&&files.length)selectFile(files[0].id);
}
function selectFile(id){
  const item=files.find(f=>f.id===id);if(!item)return;
  selectedId=id;renderList();destroyViewer();
  const file=item.file,ext=extOf(file.name);
  $("selectedMeta").textContent=file.name+" · "+fmtSize(file.size)+" · "+(file.type||"type non précisé");
  $("formatPill").textContent=ext.toUpperCase()||"FICHIER";
  $("askAi").disabled=false;$("aiAnswer").hidden=true;
  status("Fichier sélectionné. Décris ce que tu veux comprendre.");
  if(modelExtensions.has(ext)){loadModel(file,ext).catch(e=>{destroyViewer();showUnsupported("Impossible d’ouvrir ce modèle : "+e.message);});return;}
  if(textExtensions.has(ext)){showText(file);return;}
  if(imageExtensions.has(ext)){showImage(file);return;}
  if(ext==="pdf"){showPdf(file);return;}
  if(nativeCad.has(ext)){showUnsupported(nativeCadHelp(ext));return;}
  if(ext==="zip"){showUnsupported("Archive ZIP reconnue. Décompresse-la sur ton appareil puis importe les fichiers utiles séparément.");return;}
  showUnsupported("Le fichier est bien ajouté, mais aucun aperçu direct n’est disponible pour ce format. Tu peux quand même transmettre son nom et demander une méthode d’ouverture ou de conversion à l’assistant.");
}
function nativeCadHelp(ext){
 const advice={
  step:"STEP/STP : format d’échange CAO. Exporte une copie en STL ou GLB pour visualiser la géométrie, ou ouvre-la dans FreeCAD pour conserver une géométrie plus précise.",
  stp:"STEP/STP : format d’échange CAO. Exporte une copie en STL ou GLB pour visualiser la géométrie, ou ouvre-la dans FreeCAD pour conserver une géométrie plus précise.",
  iges:"IGES/IGS : ouvre une copie dans FreeCAD ou ton logiciel CAO puis exporte en STL, STEP ou GLB.",
  igs:"IGES/IGS : ouvre une copie dans FreeCAD ou ton logiciel CAO puis exporte en STL, STEP ou GLB.",
  sldprt:"SLDPRT : pièce native SOLIDWORKS. Ouvre-la dans SOLIDWORKS puis exporte une copie en STL/STEP ou GLB. Le fichier original ne sera pas modifié.",
  sldasm:"SLDASM : assemblage SOLIDWORKS. Pour garder les pièces ensemble, exporte l’assemblage en 3MF/GLB ou enregistre une copie compatible.",
  slddrw:"SLDDRW : dessin SOLIDWORKS. Exporte une copie du dessin en PDF pour l’afficher ici.",
  slddrt:"SLDDRT : fond de plan SOLIDWORKS. Ce n’est pas une pièce 3D ; ouvre-le dans SOLIDWORKS pour l’utiliser dans un dessin.",
  dxf:"DXF : plan 2D. Exporte-le en PDF ou SVG depuis ton logiciel de dessin pour le consulter ici.",
  ai:"AI : fichier Adobe Illustrator. Exporte une copie en PDF ou SVG."
 };
 return advice[ext]||"Format CAO reconnu, mais conversion nécessaire pour un aperçu direct.";
}
function showUnsupported(message){
 $("unsupported").hidden=false;$("unsupported").textContent=message;
 $("viewer").innerHTML='<div class="viewer-empty"><span>🛠️</span><b>Aperçu direct indisponible</b><p>Consulte les instructions ci-dessous.</p></div>';
}
async function showText(file){
 if(file.size>2*1024*1024){showUnsupported("Le fichier texte dépasse 2 Mo. Utilise un extrait plus petit pour garder l’interface fluide.");return;}
 const text=await file.text();$("textPreview").hidden=false;$("textPreview").textContent=text.slice(0,60000)+(text.length>60000?"\n… aperçu limité aux 60 000 premiers caractères":"");
 $("viewer").innerHTML='<div class="viewer-empty"><span>💻</span><b>Aperçu texte prêt</b><p>'+escapeHtml(file.name)+'</p></div>';
}
function showImage(file){const url=URL.createObjectURL(file);objectUrls.add(url);$("viewer").innerHTML='<img alt="'+escapeHtml(file.name)+'" src="'+url+'">';}
function showPdf(file){const url=URL.createObjectURL(file);objectUrls.add(url);$("viewer").innerHTML='<iframe title="Aperçu PDF" src="'+url+'"></iframe>';}
function setupRenderer(){
 const host=$("viewer");
 const width=Math.max(host.clientWidth,1),height=Math.max(host.clientHeight,1);
 renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,preserveDrawingBuffer:true});
 renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
 renderer.setSize(width,height);
 renderer.setClearColor(0x101820);
 renderer.outputColorSpace=THREE.SRGBColorSpace;
 host.innerHTML="";
 host.appendChild(renderer.domElement);
 scene=new THREE.Scene();
 scene.background=new THREE.Color(0x101820);
 camera=new THREE.PerspectiveCamera(45,width/height,0.001,1000000);
 camera.position.set(3,3,5);
 scene.add(new THREE.HemisphereLight(0xffffff,0x64748b,2.2));
 const key=new THREE.DirectionalLight(0xffffff,2.3);
 key.position.set(5,8,6);
 scene.add(key);
 const grid=new THREE.GridHelper(10,20,0x64748b,0x334155);
 grid.name="lab-grid";
 grid.position.y=-0.001;
 scene.add(grid);
 const axes=new THREE.AxesHelper(1);
 axes.name="lab-axes";
 scene.add(axes);
}
async function loadModel(file,ext){
 const OrbitControls= (await import("three/addons/controls/OrbitControls.js")).OrbitControls;
 setupRenderer();
 controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.08;
 const url=URL.createObjectURL(file);objectUrls.add(url);
 let object;
 if(ext==="stl"){
   const geometry=STLLoader.prototype?new STLLoader().parse(await file.arrayBuffer()):null;
   geometry.computeVertexNormals();object=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color:0x8eb4d8,metalness:.18,roughness:.48}));
 }else if(ext==="obj"){
   object=new OBJLoader().parse(await file.text());
   object.traverse(child=>{if(child.isMesh){child.material=new THREE.MeshStandardMaterial({color:0x8eb4d8,metalness:.12,roughness:.55});}});
 }else if(ext==="3mf"){
   object=new ThreeMFLoader().parse(await file.arrayBuffer());
 }else{
   const manager=new THREE.LoadingManager();
   manager.setURLModifier(resourceUrl=>{
     const clean=decodeURIComponent(resourceUrl.split(/[?#]/)[0].split("/").pop()||"");
     const dependency=files.find(entry=>entry.file.name===clean);
     if(!dependency)return resourceUrl;
     const dependencyUrl=URL.createObjectURL(dependency.file);
     objectUrls.add(dependencyUrl);
     return dependencyUrl;
   });
   const loader=new GLTFLoader(manager);
   const buffer=await file.arrayBuffer();
   const gltf=await new Promise((resolve,reject)=>loader.parse(buffer,"",resolve,reject));
   object=gltf.scene;
 }
 activeObject=object;scene.add(object);fitObject();$("viewerTools").hidden=false;
 const box=new THREE.Box3().setFromObject(object),size=box.getSize(new THREE.Vector3());
 let triangles=0,meshes=0;
 object.traverse(child=>{if(child.isMesh){meshes++;const g=child.geometry;if(g){triangles+=g.index?g.index.count/3:(g.attributes.position?.count||0)/3;}}});
 $("modelStats").hidden=false;$("modelStats").innerHTML=[
  ["Axe X",size.x],["Axe Y",size.y],["Axe Z",size.z]
 ].map(([label,value])=>'<div class="stat-chip"><small>'+label+' · unités du fichier</small><b>'+Number(value).toFixed(3)+'</b></div>').join("")+
 '<div class="stat-chip"><small>Maillages</small><b>'+meshes+'</b></div><div class="stat-chip"><small>Triangles estimés</small><b>'+Math.round(triangles).toLocaleString("fr-FR")+'</b></div><div class="stat-chip"><small>Fichier</small><b>'+fmtSize(file.size)+'</b></div>';
 $("dimensionCheck").hidden=false;
 updateDimensionCheck(size);
 const animate=()=>{if(!renderer||!scene||!camera)return;animationFrameId=requestAnimationFrame(animate);controls?.update();renderer.render(scene,camera);};
 animate();
 resizeObserver=new ResizeObserver(()=>{
   if(!renderer||!camera)return;
   const w=Math.max(host.clientWidth,1),h=Math.max(host.clientHeight,1);
   camera.aspect=w/h;
   camera.updateProjectionMatrix();
   renderer.setSize(w,h);
 });
 resizeObserver.observe(host);
}
function updateDimensionCheck(sizeOverride=null){
 if(!activeObject)return;
 const size=sizeOverride||new THREE.Box3().setFromObject(activeObject).getSize(new THREE.Vector3());
 const mmPerUnit=Math.max(0,Number($("mmPerUnit").value)||0);
 const longAxis=$("lengthAxis").value, verticalAxis=$("heightAxis").value;
 const axisNames={x:"X",y:"Y",z:"Z"};
 const dims={x:size.x*mmPerUnit,y:size.y*mmPerUnit,z:size.z*mmPerUnit};
 const widthAxis=["x","y","z"].find(a=>a!==longAxis&&a!==verticalAxis);
 const valid=mmPerUnit>0&&longAxis!==verticalAxis&&!!widthAxis;
 const result=$("dimensionResults");
 if(!valid){result.innerHTML='<p class="dimension-warning">Choisis deux axes différents et une échelle positive.</p>';return;}
 const measurements=[
  {label:"Longueur",value:dims[longAxis],limit:Number($("maxLength").value),axis:axisNames[longAxis]},
  {label:"Largeur",value:dims[widthAxis],limit:Number($("maxWidth").value),axis:axisNames[widthAxis]},
  {label:"Hauteur",value:dims[verticalAxis],limit:Number($("maxHeight").value),axis:axisNames[verticalAxis]}
 ];
 result.innerHTML=measurements.map(m=>{
  const hasLimit=Number.isFinite(m.limit)&&m.limit>0;
  const pass=hasLimit&&m.value<=m.limit;
  const close=pass&&(m.limit-m.value)<=2;
  const state=!hasLimit?"Limite à renseigner":!pass?"DÉPASSEMENT":close?"Conforme, marge ≤ 2 mm":"Conforme";
  const cls=!hasLimit?"dimension-unknown":!pass?"dimension-fail":close?"dimension-close":"dimension-pass";
  return '<div class="dimension-result '+cls+'"><span>'+m.label+' <small>(axe '+m.axis+')</small></span><b>'+m.value.toFixed(2)+' mm</b><small>Limite : '+(hasLimit?m.limit.toFixed(2)+' mm':"non définie")+'</small><strong>'+state+'</strong></div>';
 }).join("");
 $("dimensionSummary").textContent=measurements.every(m=>Number.isFinite(m.limit)&&m.limit>0)
  ?(measurements.every(m=>m.value<=m.limit)?"Le modèle respecte les trois limites saisies.":"Au moins une dimension dépasse la limite saisie.")
  :"Renseigne les limites du cahier des charges avant de conclure.";
}
function fitObject(){
 if(!activeObject||!camera||!controls)return;
 const box=new THREE.Box3().setFromObject(activeObject),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());
 activeObject.position.sub(center);
 const max=Math.max(size.x,size.y,size.z,0.01),distance=max*2.2;
 camera.position.set(distance*.9,distance*.75,distance*1.1);camera.near=Math.max(max/10000,.001);camera.far=max*100;camera.updateProjectionMatrix();
 controls.target.set(0,0,0);controls.update();
}
["mmPerUnit","lengthAxis","heightAxis","maxLength","maxWidth","maxHeight"].forEach(id=>$(id).addEventListener("input",()=>updateDimensionCheck()));
$("fileInput").addEventListener("change",e=>{addFiles(e.target.files);e.target.value="";});
const drop=$("dropZone");
drop.addEventListener("dragover",e=>{e.preventDefault();drop.classList.add("dragging");});
drop.addEventListener("dragleave",()=>drop.classList.remove("dragging"));
drop.addEventListener("drop",e=>{e.preventDefault();drop.classList.remove("dragging");addFiles(e.dataTransfer.files);});
$("fileList").addEventListener("click",e=>{
 const pick=e.target.closest("[data-pick]");if(pick){selectFile(pick.dataset.pick);return;}
 const remove=e.target.closest("[data-remove]");if(remove){const id=remove.dataset.remove;files=files.filter(f=>f.id!==id);if(selectedId===id){selectedId=null;destroyViewer();$("selectedMeta").textContent="Choisis un fichier dans la liste.";$("formatPill").textContent="EN ATTENTE";$("askAi").disabled=true;status("Sélectionne un fichier pour commencer.");}renderList();}
});
$("clearAll").addEventListener("click",()=>{files=[];selectedId=null;revokeUrls();destroyViewer();renderList();$("selectedMeta").textContent="Choisis un fichier dans la liste.";$("formatPill").textContent="EN ATTENTE";$("askAi").disabled=true;$("aiAnswer").hidden=true;status("Sélectionne un fichier pour commencer.");});
$("fitModel").addEventListener("click",fitObject);
$("saveView").addEventListener("click",()=>{
 if(!renderer||!activeObject){status("Charge un modèle 3D avant d’exporter une image.");return;}
 renderer.render(scene,camera);
 renderer.domElement.toBlob(blob=>{
   if(!blob){status("Le navigateur n’a pas pu créer l’image.");return;}
   const url=URL.createObjectURL(blob),link=document.createElement("a");
   link.href=url;link.download="course-en-cours-modele-3d.png";
   document.body.appendChild(link);link.click();link.remove();
   setTimeout(()=>URL.revokeObjectURL(url),1000);
   status("Capture PNG enregistrée sur ton appareil.",true);
 },"image/png");
});
$("resetView").addEventListener("click",()=>{fitObject();if(controls){controls.reset();fitObject();}});
$("wireframe").addEventListener("click",()=>{if(!activeObject)return;wireframeOn=!wireframeOn;activeObject.traverse(child=>{if(child.isMesh){const mats=Array.isArray(child.material)?child.material:[child.material];mats.forEach(m=>{if(m)m.wireframe=wireframeOn;});}});$("wireframe").textContent=wireframeOn?"Désactiver le filaire":"Mode filaire";});
$("askAi").addEventListener("click",async()=>{
 const item=files.find(f=>f.id===selectedId);if(!item)return;
 const userQuestion=$("question").value.trim()||"Explique-moi ce fichier et indique les vérifications utiles pour le projet Course en Cours.";
 const ext=extOf(item.file.name);let context="Fichier sélectionné : "+item.file.name+"\nFormat : "+ext.toUpperCase()+"\nTaille : "+fmtSize(item.file.size)+".";
 if(modelExtensions.has(ext)&&activeObject){const box=new THREE.Box3().setFromObject(activeObject),size=box.getSize(new THREE.Vector3());context+="\nGéométrie chargée dans la visionneuse : largeur "+size.x.toFixed(2)+", hauteur "+size.y.toFixed(2)+", profondeur "+size.z.toFixed(2)+" unités du fichier.";}
 if(textExtensions.has(ext)&&$("includeCode").checked){try{const text=await item.file.text();context+="\nExtrait du fichier (peut être tronqué) :\n"+text.slice(0,700);}catch{}}
 if(nativeCad.has(ext))context+="\nLe format natif n’a pas été décodé dans le navigateur ; ne prétends pas avoir inspecté sa géométrie.";
 const question=(context+"\n\nQuestion de l’élève : "+userQuestion).slice(0,1900);
 $("askAi").disabled=true;$("aiAnswer").hidden=true;status("L’assistant analyse la demande…");
 try{const data=await api("/ai/chat",{method:"POST",body:JSON.stringify({question})});$("aiAnswer").textContent=data.answer||"Aucune réponse reçue.";$("aiAnswer").hidden=false;status("Réponse reçue. Vérifie les recommandations avant de modifier le projet.",true);}
 catch(e){status("Impossible d’interroger l’IA : "+e.message);}
 finally{$("askAi").disabled=false;}
});
window.addEventListener("beforeunload",()=>{revokeUrls();if(renderer)renderer.dispose();});
requireSession();
