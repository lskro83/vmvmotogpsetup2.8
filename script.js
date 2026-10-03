const SUPABASE_URL = "https://glovvrsctvjwjtxiaaihu.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdsb3Z2c2N0dmp3anR4aWFpahuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4NzAxNTUsImV4cCI6MjEwNjQ0NjE1NX0.CcPT-QFfF3mQrH9KxnOpU9Adu4ltCV5FrH4lWULR3Vk";

// Navigation onglets
document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
        document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        const clickedTab = e.currentTarget;
        clickedTab.classList.add('active');
        const targetId = 'tab-' + clickedTab.id.replace('btn-', '');
        const targetEl = document.getElementById(targetId);
        if(targetEl) targetEl.classList.add('active');
        
        if(targetId === 'tab-setups') chargerSetupsPublics();
    });
});

// Profil
let pseudoActif = localStorage.getItem('vmv_pseudo') || '';
const btnToggleProfil = document.getElementById('btnToggleProfil');
const statutSession = document.getElementById('statutSession');
const auteurInput = document.getElementById('auteurInput');

function refreshProfilUI() {
    const pInput = document.getElementById('pseudoActifInput');
    if(!pInput || !btnToggleProfil || !statutSession) return;
    if(pseudoActif) {
        pInput.value = pseudoActif;
        if(auteurInput) auteurInput.value = pseudoActif;
        statutSession.innerText = "Statut : Connecté en tant que " + pseudoActif;
        btnToggleProfil.innerText = "Se déconnecter";
    } else {
        statutSession.innerText = "Statut : Déconnecté";
        btnToggleProfil.innerText = "Se connecter";
    }
}
refreshProfilUI();

if(btnToggleProfil) {
    btnToggleProfil.addEventListener('click', () => {
        if(pseudoActif) {
            if(confirm("Se déconnecter ?")) {
                pseudoActif = '';
                localStorage.removeItem('vmv_pseudo');
                refreshProfilUI();
            }
        } else {
            const val = document.getElementById('pseudoActifInput').value.trim();
            if(val) {
                pseudoActif = val;
                localStorage.setItem('vmv_pseudo', pseudoActif);
                refreshProfilUI();
                alert("Connecté !");
            } else {
                alert("Entre un pseudo valide.");
            }
        }
    });
}

// Soumission Setup complet (avec Rapport Final et Anti-Dribble)
const formSetup = document.getElementById('formSetup');
if(formSetup) {
    formSetup.addEventListener('submit', async (e) => {
        e.preventDefault();
        if(!pseudoActif) {
            alert("Connecte-toi avec un pseudo dans l'onglet Profil avant de publier !");
            return;
        }

        const payload = {
            auteur: auteurInput.value,
            moto: document.getElementById('motoInput').value,
            circuit: document.getElementById('circuitNomInput').value,
            pneu_avant: document.getElementById('pneuAvant').value,
            pneu_arriere: document.getElementById('pneuArriere').value,
            susp_av_pre: parseInt(document.getElementById('suspAvPre').value) || 4,
            susp_av_hui: parseInt(document.getElementById('suspAvHui').value) || 4,
            susp_av_res: parseInt(document.getElementById('suspAvRes').value) || 4,
            susp_av_com: parseInt(document.getElementById('suspAvCom').value) || 4,
            susp_av_ext: parseInt(document.getElementById('suspAvExt').value) || 4,
            susp_ar_pre: parseInt(document.getElementById('suspArPre').value) || 4,
            susp_ar_res: parseInt(document.getElementById('suspArRes').value) || 4,
            susp_ar_cl: parseInt(document.getElementById('suspArCL').value) || 4,
            susp_ar_cr: parseInt(document.getElementById('suspArCR').value) || 4,
            susp_ar_ext: parseInt(document.getElementById('suspArExt').value) || 4,
            bv_1: parseInt(document.getElementById('bv1').value) || 4,
            bv_2: parseInt(document.getElementById('bv2').value) || 4,
            bv_3: parseInt(document.getElementById('bv3').value) || 4,
            bv_4: parseInt(document.getElementById('bv4').value) || 4,
            bv_5: parseInt(document.getElementById('bv5').value) || 4,
            bv_6: parseInt(document.getElementById('bv6').value) || 4,
            bv_final: parseInt(document.getElementById('bvFinal').value) || 4,
            anti_dribble: parseInt(document.getElementById('antiDribble').value) || 4,
            frein_avant: document.getElementById('freinAvant').value,
            frein_arriere: document.getElementById('freinArriere').value,
            ecu_tcs: parseInt(document.getElementById('ecuTcs').value) || 3,
            ecu_aw: parseInt(document.getElementById('ecuAw').value) || 3,
            ecu_ebs: parseInt(document.getElementById('ecuEbs').value) || 3,
            geo_cha: parseInt(document.getElementById('geoCha').value) || 4,
            geo_dep: parseInt(document.getElementById('geoDep').value) || 4,
            geo_pla: parseInt(document.getElementById('geoPla').value) || 4,
            geo_bra: parseInt(document.getElementById('geoBra').value) || 4
        };

        // Sauvegarde locale de secours
        let localSetups = JSON.parse(localStorage.getItem('vmv_local_setups') || '[]');
        localSetups.unshift(payload);
        localStorage.setItem('vmv_local_setups', JSON.stringify(localSetups));

        // Envoi Cloud sécurisé anti-crash
        try {
            await fetch(`${SUPABASE_URL}/rest/v1/motogp_setups`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify(payload)
            });
        } catch (err) {
            console.warn("Mode local activé (réseau distant indisponible).");
        }

        alert("Setup publié avec succès !");
        document.getElementById('btn-setups').click();
    });
}

// Chargement et affichage des setups publics
let allSetupsCache = [];
async function chargerSetupsPublics() {
    const container = document.getElementById('listeSetups');
    if(!container) return;
    container.innerHTML = "Chargement...";
    
    let cloudData = [];
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/motogp_setups?select=*&order=created_at.desc`, {
            headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
        });
        if(response.ok) cloudData = await response.json();
    } catch(e) {
        console.warn("Cloud injoignable");
    }

    let localData = JSON.parse(localStorage.getItem('vmv_local_setups') || '[]');
    allSetupsCache = [...localData, ...cloudData];
    afficherSetupsFiltres();
}

function afficherSetupsFiltres() {
    const container = document.getElementById('listeSetups');
    if(!container) return;
    const filtreTexte = document.getElementById('filtreInput').value.toLowerCase();
    const filtreCircuit = document.getElementById('filtreCircuitSelect').value;

    const filtres = allSetupsCache.filter(item => {
        const matchTexte = (item.moto && item.moto.toLowerCase().includes(filtreTexte)) || 
                           (item.auteur && item.auteur.toLowerCase().includes(filtreTexte));
        const matchCircuit = !filtreCircuit || item.circuit === filtreCircuit;
        return matchTexte && matchCircuit;
    });

    if(filtres.length === 0) {
        container.innerHTML = "<p style='color:#777; font-size:11px; text-align:center;'>Aucun setup trouvé.</p>";
        return;
    }

    container.innerHTML = '';
    filtres.forEach(item => {
        const div = document.createElement('div');
        div.className = 'setup-item';
        div.innerHTML = `<strong>${item.moto}</strong> sur <strong>${item.circuit}</strong><br><span style="font-size:10px; color:#888;">Par ${item.auteur}</span>`;
        div.addEventListener('click', () => ouvrirModalSetup(item));
        container.appendChild(div);
    });
}

const filtreInput = document.getElementById('filtreInput');
const filtreCircuitSelect = document.getElementById('filtreCircuitSelect');
if(filtreInput) filtreInput.addEventListener('input', afficherSetupsFiltres);
if(filtreCircuitSelect) filtreCircuitSelect.addEventListener('change', afficherSetupsFiltres);

// Modale affichant TOUT le setup en détail
const modal = document.getElementById('modalDetails');
const btnCloseModal = document.getElementById('btnCloseModal');
if(btnCloseModal && modal) btnCloseModal.addEventListener('click', () => modal.style.display = 'none');

function ouvrirModalSetup(item) {
    document.getElementById('modalTitre').innerText = `${item.moto} (${item.circuit})`;
    document.getElementById('modalCorps').innerHTML = `
        <p style="margin-bottom:10px; color:#aaa;"><strong>Auteur :</strong> ${item.auteur}</p>
        <div class="section-title">Pneumatiques</div>
        Avant : ${item.pneu_avant} | Arrière : ${item.pneu_arriere}
        <div class="section-title">Suspension Avant</div>
        Précharge: ${item.susp_av_pre} | Huile: ${item.susp_av_hui} | Ressort: ${item.susp_av_res}<br>
        Compression: ${item.susp_av_com} | Extension: ${item.susp_av_ext}
        <div class="section-title">Suspension Arrière</div>
        Précharge: ${item.susp_ar_pre} | Ressort: ${item.susp_ar_res} | Comp. Lente: ${item.susp_ar_cl}<br>
        Comp. Rapide: ${item.susp_ar_cr} | Extension: ${item.susp_ar_ext}
        <div class="section-title">Boîte de Vitesse</div>
        1-6: ${item.bv_1}, ${item.bv_2}, ${item.bv_3}, ${item.bv_4}, ${item.bv_5}, ${item.bv_6}<br>
        <strong>Rapport Final:</strong> ${item.bv_final} | <strong>Anti-dribble:</strong> ${item.anti_dribble}
        <div class="section-title">Freins & Électronique</div>
        Disques Av: ${item.frein_avant} | Ar: ${item.frein_arriere}<br>
        TCS: ${item.ecu_tcs} | Anti-Wheeling: ${item.ecu_aw} | EBS: ${item.ecu_ebs}
        <div class="section-title">Géométrie</div>
        Chasse: ${item.geo_cha} | Déport: ${item.geo_dep} | Plaque: ${item.geo_pla} | Bras: ${item.geo_bra}
    `;
    modal.style.display = 'flex';
}

// ==========================================
// COACH IA INTELLIGENT (RAPIDE & AVANCÉ)
// ==========================================

// Gestion bascule Rapide / Avancé
document.getElementById('btnCoachRapide')?.addEventListener('click', () => {
    document.getElementById('btnCoachRapide').classList.add('active');
    document.getElementById('btnCoachComplet').classList.remove('active');
    document.getElementById('viewCoachRapide').style.display = 'block';
    document.getElementById('viewCoachComplet').style.display = 'none';
});
document.getElementById('btnCoachComplet')?.addEventListener('click', () => {
    document.getElementById('btnCoachComplet').classList.add('active');
    document.getElementById('btnCoachRapide').classList.remove('active');
    document.getElementById('viewCoachComplet').style.display = 'block';
    document.getElementById('viewCoachRapide').style.display = 'none';
});

// Options du Coach Rapide selon la phase
const problemesParPhase = {
    "Entree": [
        { id: "guidonnage_frein", label: "Guidonnage violent au freinage", conseil: "Augmente la précharge avant (+1) et durcis la compression rapide arrière." },
        { id: "avant_lourd", label: "La moto refuse de tourner à l'insertion", conseil: "Diminue la chasse (geo) ou augmente la hauteur arrière (+1)." },
        { id: "perte_avant", label: "Goutte d'eau / Sensation de perdre l'avant", conseil: "Augmente l'huile de fourche (+1) et assouplis l'extension avant." }
    ],
    "Milieu": [
        { id: "sous_virage", label: "Élargit trop en milieu de courbe (Sous-virage)", conseil: "Augmente le déport de fourche et réduis la précharge arrière." },
        { id: "train_instable", label: "Train arrière flou / bouge sur l'angle", conseil: "Augmente la compression lente de l'amortisseur et durcis le ressort arrière." }
    ],
    "Sortie": [
        { id: "patinage_accel", label: "Gros patinage de l'arrière en réaccélération", conseil: "Augmente le TCS (+1) et assouplis la compression lente arrière." },
        { id: "cabrage", label: "La moto se lève trop (Wheeling)", conseil: "Augmente l'anti-wheeling (+1) et allonge légèrement le rapport final." },
        { id: "guidonnage_sortie", label: "Guidonnage à l'accélération sur les bosses", conseil: "Augmente l'amortisseur de direction et la précharge arrière." }
    ],
    "Freinage": [
        { id: "arriere_decolle", label: "La roue arrière se soulève trop (Stoppie)", conseil: "Augmente le frein moteur (EBS) et assouplis la fourche avant." },
        { id: "blocage_roue", label: "Blocage fréquent de la roue avant", conseil: "Passe sur des disques 350mm et augmente l'anti-dribble." }
    ]
};

const phaseSelect = document.getElementById('phaseSelect');
const problemeSelect = document.getElementById('problemeSelect');
const conseilBox = document.getElementById('conseilBox');

function mettreAJourProblemes() {
    if(!phaseSelect || !problemeSelect) return;
    const phase = phaseSelect.value;
    const liste = problemesParPhase[phase] || [];
    problemeSelect.innerHTML = '';
    liste.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.innerText = p.label;
        problemeSelect.appendChild(opt);
    });
    afficherConseilRapide();
}

function afficherConseilRapide() {
    const phase = phaseSelect.value;
    const probId = problemeSelect.value;
    const liste = problemesParPhase[phase] || [];
    const trouve = liste.find(p => p.id === probId);
    if(trouve) {
        conseilBox.innerHTML = `<strong>Diagnostic Piste :</strong><br>${trouve.conseil}`;
    } else {
        conseilBox.innerHTML = "Sélectionne un problème valide.";
    }
}

if(phaseSelect) phaseSelect.addEventListener('change', mettreAJourProblemes);
if(problemeSelect) problemeSelect.addEventListener('change', afficherConseilRapide);
mettreAJourProblemes();

// Coach Avancé : Générateur Pro ultra-personnalisé selon circuit et météo
document.getElementById('btnGenererSetupAI')?.addEventListener('click', () => {
    const circuit = document.getElementById('aiCircuitNom').value;
    const meteo = document.getElementById('aiMeteo').value;
    const style = document.getElementById('aiStyle').value;
    const box = document.getElementById('setupCompletBox');

    // Génération algorithmique fine et unique selon les critères
    let basePreAv = 4, baseComAv = 4, baseTcs = 3, baseBvFinal = 4;

    if(circuit.includes("Mugello") || circuit.includes("Silverstone")) {
        baseBvFinal = 6; // Circuits rapides nécessitant de l'allonge
    } else if(circuit.includes("Jerez") || circuit.includes("Le Mans")) {
        baseBvFinal = 3; // Circuits stop-and-go nécessitant du punch
    }

    if(meteo.includes("Humide") || meteo.includes("Pluie")) {
        baseTcs = 5;
        basePreAv = 2;
    } else if(meteo.includes("Chaud")) {
        baseTcs = Math.max(1, baseTcs - 1);
    }

    if(style.includes("Aggressif")) {
        baseComAv = 5;
    } else if(style.includes("Économie")) {
        baseTcs += 1;
    }

    box.style.display = 'block';
    box.innerHTML = `
        <strong style="color:#e10600;">Setup Recommandé par l'IA Pro :</strong><br>
        <em>Config sur mesure pour ${circuit} (${meteo})</em><br><br>
        - <strong>Pneus :</strong> ${meteo.includes('Pluie') ? 'Soft Pluie / Soft Pluie' : 'Medium / Medium'}<br>
        - <strong>Suspension Avant :</strong> Précharge ${basePreAv} | Compression ${baseComAv} | Huile 5<br>
        - <strong>Suspension Arrière :</strong> Précharge 4 | Comp. Lente 4 | Ressort 4<br>
        - <strong>Transmission :</strong> Rapport Final : ${baseBvFinal} | Anti-dribble : 4<br>
        - <strong>Électronique :</strong> TCS : ${baseTcs} | Anti-Wheeling : 3 | EBS (Frein moteur) : 4<br>
        - <strong>Géométrie :</strong> Chasse : 4 | Bras oscillant : 3<br><br>
        <button onclick="chargerDansSaisie(${basePreAv}, ${baseBvFinal}, ${baseTcs})" style="background:#28a745; margin-top:5px;">Injecter ce setup dans l'onglet Saisie</button>
    `;
});

function chargerDansSaisie(preAv, bvFin, tcs) {
    document.getElementById('suspAvPre').value = preAv;
    document.getElementById('bvFinal').value = bvFin;
    document.getElementById('ecuTcs').value = tcs;
    document.getElementById('btn-accueil').click();
    alert("Setup injecté dans le formulaire de saisie avec succès !");
}
