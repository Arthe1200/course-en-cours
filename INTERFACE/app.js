const teams=[["conception","🧩 Conception","Choix techniques et architecture",65],["modelisation-3D","🧱 Modélisation 3D","Modèles, plans et versions",40],["materiaux","🧪 Matériaux","Matériaux et justification",80],["fabrication","🛠️ Fabrication","Impression et fabrication",30],["assemblage","🔩 Assemblage","Montage et intégration",0],["essais","🏁 Essais","Mesures et validation",0],["presentation","🎤 Présentation","Oral et communication",0]];
const adminUser="Arthe1200";
const saved=localStorage.getItem("cec-team");
const isAdmin=localStorage.getItem("cec-github-user")===adminUser;
const $=id=>document.getElementById(id);
function choose(t){localStorage.setItem("cec-team",t[0]);render(t[0])}
function render(key){const t=teams.find(x=>x[0]===key);if(!t)return; $("welcome").hidden=true;$("dashboard").hidden=false;$("teamName").textContent=t[1];$("teamDesc").textContent=t[2];$("identity").textContent=isAdmin?"👑 Arthe1200 · Administrateur":"👤 Membre · "+t[1];$("adminText").textContent=isAdmin?"Tu as tous les droits dans l'interface. Les permissions GitHub restent celles du dépôt.":"Tu peux consulter tout le projet et utiliser les outils de suivi. Les droits d'administration sont réservés à Arthe1200.";$("adminLink").classList.toggle("hidden",!isAdmin);$("cards").innerHTML=[["📅","Séances","Voir le carnet de bord"],["💬","Annotations","Remarques à traiter"],["⚠️","Problèmes","Difficultés du projet"],["💡","Idées","Propositions de l'équipe"]].map(x=>'<div class="metric"><b>'+x[0]+'</b><h3>'+x[1]+'</h3><span>'+x[2]+'</span></div>').join("");$("progress").innerHTML=teams.map(x=>'<div class="progressrow"><div class="progresshead"><span>'+x[1]+'</span><span>'+x[3]+' %</span></div><div class="bar"><div class="fill" style="width:'+x[3]+'%"></div></div></div>').join("")}
$("teams").innerHTML=teams.map(t=>'<button class="team" data-team="'+t[0]+'"><strong>'+t[1]+'</strong><span>'+t[2]+'</span></button>').join("");
document.querySelectorAll(".team").forEach(b=>b.onclick=()=>choose(teams.find(t=>t[0]===b.dataset.team)));
$("changeTeam").onclick=()=>{$("dashboard").hidden=true;$("welcome").hidden=false};
if(saved)render(saved);else{$("identity").textContent="👤 Première visite"}
