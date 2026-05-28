import React, { useState, useEffect } from "react"; // build:20260527061724
import { db } from './firebase.js';
import {
  collection, doc, getDocs, setDoc, writeBatch, getDoc, deleteDoc
} from 'firebase/firestore';
import SiteMap from './components/SiteMap.jsx';
import { SiteCharts, AdminCharts } from './components/Charts.jsx';
import EditSiteModal from './components/EditSiteModal.jsx';
import NotificationBell from './components/Notifications.jsx';
import AdminSettingsModal from './components/AdminSettings.jsx';
import ReferentProfile from './components/ReferentProfile.jsx';
import LogoIcon, { LogoFull } from './components/Logo.jsx';
import EventsSection from './components/Events.jsx';
import { exportGlobal, exportSite, ExportButton } from './components/ExportExcel.jsx';
import HelpGuide from './components/HelpGuide.jsx';
import LegalPage from './components/Legal.jsx';
import { ICalButton } from './components/ICalExport.jsx';
import { AnnualReportButton } from './components/AnnualReport.jsx';
import PublicDashboard from './components/PublicDashboard.jsx';
import SuperAdminView from './components/SuperAdmin.jsx';


const ADMIN_CODE = "ADMIN";
const KG_PER_LITRE = 0.65;

const C = {
  bg: "#F4EBD9", card: "#FDFAF6", green: "#2D5A27", greenMid: "#4A8C40",
  greenPale: "#ECF5E8", brown: "#7A4F2D", brownPale: "#F8EDD8",
  text: "#1C2B19", muted: "#7A8470", border: "#E0D5C5",
  danger: "#BE4B48", warn: "#C07A00",
};

const ACTION_TYPES = [
  { id: "transfert", label: "Transfert de bac", icon: "🔄", color: "#2D4F7A", bg: "#E3EEFA", hasVolume: true, volumeLabel: "Volume du bac d'apport (litres)", showKg: true, description: "Mesure du bac d'apport → calcul des biodéchets détournés" },
  { id: "recolte", label: "Récolte", icon: "🌾", color: "#7A6B2D", bg: "#F5EDD8", hasVolume: true, volumeLabel: "Volume du bac de maturation (litres)", showKg: false, isRecolte: true, description: "Volume de compost mûr valorisé" },
  { id: "apport", label: "Apport biodéchets", icon: "🗑️", color: "#2D5A27", bg: "#ECF5E8", hasVolume: false, description: "Dépôt de biodéchets par les usagers" },
  { id: "remplissage_broyat", label: "Remplissage broyat", icon: "🪵", color: "#7A4F2D", bg: "#F8EDD8", hasVolume: true, volumeLabel: "Volume de broyat ajouté (litres)", showKg: false, description: "Ajout de matière carbonée structurante" },
  { id: "brassage", label: "Brassage", icon: "🌀", color: "#4A7A6B", bg: "#E3F5EE", hasVolume: false, description: "Mélange et aération du compost" },
  { id: "manutention", label: "Manutention / Réparation", icon: "🔧", color: "#7A4A2D", bg: "#F5E8E3", hasVolume: false, description: "Entretien ou réparation du dispositif" },
  { id: "visite", label: "Visite de suivi", icon: "👁️", color: "#5C2D7A", bg: "#EDE3F5", hasVolume: false, description: "Contrôle et observation du site" },
];

const OBSERVATIONS = [
  { id: "odeur",      label: "Odeur",      icon: "💨", color: "#BE4B48", bg: "#FAEAEA" },
  { id: "moucherons",label: "Moucherons",  icon: "🦟", color: "#7A4A2D", bg: "#F5E8E3" },
  { id: "trop_sec",  label: "Trop sec",    icon: "🌵", color: "#C07A00", bg: "#FEF3E2" },
  { id: "trop_humide",label:"Trop humide", icon: "💧", color: "#3A7AC0", bg: "#E3EEFA" },
];


const TYPE_BADGES = {
  "Foyers":          { color: "#2D5A27", bg: "#ECF5E8" },
  "Foyers + Cantine":{ color: "#2D4F7A", bg: "#E3EEFA" },
  "Entreprises":     { color: "#5C2D7A", bg: "#EDE3F5" },
  "En cours":        { color: "#C07A00", bg: "#FEF3E2" },
  "Extra":           { color: "#7A8470", bg: "#F0EFEA" },
};

const getBacsOMR = (kgDetournes) => Math.round(kgDetournes / 29.87);
const DEFAULT_SITES = [
  {id: "s18", name: "Angé", address: "", code: "ANGE", foyers: 0, typeSite: "Foyers", cantine: "Non concerné", periode: "2024 – 2025", capacityL: 400, referents: [], biodechets_kg: 452, compost_L: 166, pointsForts: [], pointsAmelioration: [], conclusion: "", lat: 47.3194, lng: 1.2153},
  {id: "s19", name: "Chissay-en-Touraine", address: "Commune de Chissay-en-Touraine, 41400", code: "CHISSA", foyers: 0, typeSite: "En cours", cantine: "Non concerné", periode: "", capacityL: 400, referents: [], biodechets_kg: 395, compost_L: 0, pointsForts: [], pointsAmelioration: [], conclusion: "", lat: 47.3428, lng: 1.1878},
  {id: "s10", name: "Choussy", address: "Chemin du Paradis, 41700 Choussy", code: "CHOUSS", foyers: 12, typeSite: "Foyers + Cantine", cantine: "Non concerné", periode: "Septembre 2024 – Juin 2025", capacityL: 400, referents: [{role: "Référent technique", nom: "Philippe MAZEAU", tel: "06 62 32 71 31", email: "mazeau.ph@gmail.com"}, {role: "Référent citoyen", nom: "Denis RIOLAND", tel: "06 70 31 25 01", email: "c.bourdon814@orange.fr"}], biodechets_kg: 721, compost_L: 322, pointsForts: ["Bonne situation géographique, très pertinente.", "Référent bénévole engagé avec une excellente compréhension du processus – a porté le site.", "Cantinière ayant compris exactement ce qu'il fallait faire.", "Site bien placé à côté de l'école – tout s'est très bien passé."], pointsAmelioration: ["Organiser des événements pour continuer l'animation autour du composteur.", "Pousser à convaincre certains habitants qui ne veulent pas composter dans leur jardin.", "Maintenir un carnet de suivi pour être conforme réglementairement.", "Valoriser le travail et l'engagement du référent bénévole.", "Continuer la pédagogie autour du composteur."], conclusion: "Le site de Choussy a détourné ~721 kg de biodéchets et produit 322 L de compost mûr. Le café compost, auquel une classe entière a participé, a constitué un moment fort d'éducation à l'environnement. Cette dimension intergénérationnelle donne au projet une portée qui va au-delà du simple geste de tri. À 10 ans, le potentiel de détournement dépasse 7 tonnes.", lat: 47.2469, lng: 1.4708},
  {id: "s14", name: "Chémery", address: "Commune de Chémery, 41700", code: "CHEMER", foyers: 0, typeSite: "Foyers + École", cantine: "Non concerné", periode: "Mai 2025 – Mai 2026", capacityL: 400, referents: [], biodechets_kg: 1107, compost_L: 640, pointsForts: [], pointsAmelioration: [], conclusion: "", lat: 47.2989, lng: 1.4797},
  {id: "s16", name: "Contres", address: "1 rue de la Fossé Mardeaux, 41700 Le Controis-en-Sologne", code: "CONTRE", foyers: 0, typeSite: "Entreprises", cantine: "Non concerné", periode: "Juin 2025 – Avril 2026", capacityL: 400, referents: [{role: "Référente bénévole (Animatrice Plan Climat – Val2C)", nom: "Laetitia CAUX", tel: "06 07 18 45 48", email: "lcaux@val2c.fr"}, {role: "Référente bénévole", nom: "Marcelline CHARPENTIER", tel: "06 33 54 73 44", email: "mcharpentier@val2c.fr"}], biodechets_kg: 558, compost_L: 249, pointsForts: ["Implication exceptionnelle de Laetitia Caux : contrôle hebdomadaire (T° et brassage), animations créatives, communication active. La référente la plus dynamique du programme en termes d'animation.", "Site unique du programme : village d'entreprises, public professionnel. Vocation pédagogique autant que pratique.", "Atelier tamisage innovant lors du dernier accompagnement : terreau à semis haute qualité, intégralement récupéré par les participants.", "Transfert participatif réussi : repas partagé + ateliers = format convivial adapté au milieu professionnel.", "Excellente qualité de compost malgré les volumes modestes : pédofaune très riche, aucune odeur ni nuisance.", "Installation soignée et accueillante (chemin en calcaire aménagé par les référentes).", "Proximité des bureaux de la communauté de communes : effet vitrine pour les agents et élus."], pointsAmelioration: ["Rafraîchir et réapprovisionner le stock de broyat pour maintenir l'équilibre du compost.", "Remplacer le brasseur de compost volé (commande Émeraude Création ou fourche à manche rétréci).", "Encourager les usagers à venir équipés lors des transferts (gants, chaussures) pour ne pas faire reposer l'effort uniquement sur les deux référentes.", "Envisager l'ouverture du site à d'autres structures locales pour augmenter le gisement – le retrait des cadenas est à la discrétion des référentes.", "Surveiller la qualité du matériel bois (vis, charnières) et anticiper les remplacements.", "Sensibiliser davantage sur le dosage broyat/biodéchets et l'interdiction du pain (rongeurs)."], conclusion: "Le site de Contres a détourné ~557 kg de biodéchets et produit 249 L de compost mûr d'excellente qualité, tamisé en terreau à semis lors du dernier accompagnement. Ce site unique en village d'entreprises prouve que le compostage de proximité fonctionne aussi en milieu professionnel. L'implication de Laetitia Caux est la plus remarquable du programme en termes d'animation. Malgré quelques aléas (vol du brasseur, charnières cassées), le site est sur une belle dynamique et dispose de tous les atouts pour continuer à bien fonctionner en autonomie.", lat: 47.4136, lng: 1.4358},
  {id: "s7", name: "Couddes", address: "Entrée de l'école, 41700 Couddes", code: "COUDDE", foyers: 20, typeSite: "Foyers + Cantine", cantine: "Non concerné", periode: "Juillet 2024 – Juin 2025", capacityL: 500, referents: [{role: "Référent technique", nom: "Jérôme LAPLAIGE", tel: "06 30 16 54 34", email: "agent.technique@mairiedecouddes.fr"}, {role: "Référent citoyen", nom: "Olivier CHOTARD", tel: "", email: "Olivierchocho@gmail.com"}], biodechets_kg: 1031, compost_L: 910, pointsForts: ["Référent technique d'une précision remarquable – composteur dépassant 50 °C (exceptionnel).", "Compost récolté par les élèves pour un projet de plantations en carrés potagers par les parents.", "Cantine remplissant le composteur à une vitesse record – maximum de biodéchets détournés.", "Merci aux élus d'avoir signé et accueilli ce composteur."], pointsAmelioration: ["Profiter des fêtes du village ou de l'école pour sensibiliser – l'initiative doit venir de la commune, pas des seuls référents.", "Travailler sur le gaspillage alimentaire en amont (accompagnement possible du SMIEEOM).", "Formaliser le carnet de suivi physique.", "Le site ne doit pas reposer uniquement sur deux référents."], conclusion: "Le site de Couddes a détourné ~1 031 kg de biodéchets et produit 576 L de compost mûr, valorisé directement dans les plantations scolaires. C'est l'un des sites les plus aboutis du programme : le partenariat foyers-cantine scolaire crée une boucle vertueuse où le déchet devient ressource pédagogique. Un retrait supplémentaire de 334 L post-accompagnement confirme la maturité du site. À 10 ans, le potentiel dépasse 10 tonnes.", lat: 47.2622, lng: 1.4925},
  {id: "s6", name: "Feings", address: "École, 41120 Feings", code: "FEINGS", foyers: 11, typeSite: "Foyers + Cantine", cantine: "60 repas/jour", periode: "Septembre 2024 – Juin 2025", capacityL: 400, referents: [{role: "Référent technique", nom: "Thierry BOUCHERON", tel: "06 10 19 61 89", email: "yannickrenardcontrois41@gmail.com"}], biodechets_kg: 1081, compost_L: 518, pointsForts: ["Les deux référents ont parfaitement fait leur travail – site qui fonctionne très bien.", "Référente bénévole exemplaire en communication.", "Référent technique travaillant avec précision et rigueur.", "Problème de moucherons massif très bien rattrapé grâce au travail des référents.", "Bonne quantité de biodéchets générés, confirmant l'utilité du site."], pointsAmelioration: ["Le composteur ne doit pas être géré uniquement par les agents communaux – c'est le bien de tous.", "Profiter d'événements pour organiser des cafés compost / apéros compost (en cours de négociation lors du dernier événement).", "Quelques déboires avec la cantine (distance) – à surveiller.", "Continuer à générer de l'attention autour du composteur."], conclusion: "Le site de Feings a détourné ~1 081 kg de biodéchets et produit 518 L de compost mûr. Un épisode de moucherons en décembre 2024, rapidement résolu par un apport de broyat et un brassage renforcé, illustre la capacité du site à surmonter les aléas techniques. Les volumes générés placent Feings parmi les meilleurs sites du programme. À 10 ans, le potentiel dépasse 10 tonnes de biodéchets détournés.", lat: 47.2519, lng: 1.3472},
  {id: "s11", name: "Fougères-sur-Bièvre", address: "Commune de Fougères-sur-Bièvre, 41120", code: "FOUGE", foyers: 0, typeSite: "En cours", cantine: "Non concerné", periode: "", capacityL: 400, referents: [], biodechets_kg: 680, compost_L: 0, pointsForts: [], pointsAmelioration: [], conclusion: "", lat: 47.4108, lng: 1.2819},
  {id: "s9", name: "Mareuil-sur-Cher", address: "Parking de l'école, 41110 Mareuil-sur-Cher", code: "MAREU", foyers: 12, typeSite: "Foyers + Cantine", cantine: "Non concerné", periode: "Juin 2024 – Juin 2025", capacityL: 400, referents: [{role: "Référent technique", nom: "Guy MAXENCE", tel: "06 81 42 45 74", email: "mairie@mareuilsurcher.fr"}, {role: "Référent citoyen", nom: "Jean Louis PETRUS", tel: "06 81 83 96 36", email: "mairie@mareuilsurcher.fr"}], biodechets_kg: 781, compost_L: 518, pointsForts: ["Inventivité du référent technique : transformation d'un sommier en tamis géant – astuce relayée à toutes les communes.", "Référent élu bénévole toujours présent contre vents et marées.", "Dernière récolte avec les enfants de l'école : passionnés et passionnants, goûter offert par la commune.", "Volume important de biodéchets détournés grâce à la cantine."], pointsAmelioration: ["Manque d'appui des élus – dommage car le site fonctionne bien.", "Il faut valoriser le travail fait et le nombre de biodéchets détournés.", "Au moins un élu doit continuer à animer le composteur avec ou sans l'école.", "Maintenir le site propre et attrayant pour ne pas servir de refuge aux rongeurs.", "L'accompagnement de 3 visites sur ~1 an prépare à l'autonomie – il faut être vigilant."], conclusion: "Le site de Mareuil-sur-Cher a détourné ~781 kg de biodéchets et produit 518 L de compost mûr. Après des déséquilibres carbone/azote en début de parcours, les ajustements apportés ont permis d'atteindre un fonctionnement satisfaisant. Le café compost a été l'occasion de fédérer les participants et de rappeler les bonnes pratiques. À 10 ans, le potentiel de détournement dépasse 7 tonnes si l'élan est maintenu.", lat: 47.2769, lng: 1.4372},
  {id: "s4", name: "Meusnes", address: "À côté de la salle des fêtes, 41130 Meusnes", code: "MEUSNE", foyers: 14, typeSite: "Foyers + Cantine", cantine: "60 repas/jour", periode: "Septembre 2024 – Juin 2025", capacityL: 400, referents: [{role: "Référent technique", nom: "Théo BOISTARD", tel: "06 38 71 69 28", email: "services-techniques@meusnes.fr"}, {role: "Référent citoyen", nom: "Gérard ANIN", tel: "06 07 25 45 29", email: "gerard.anin@orange.fr"}], biodechets_kg: 1197, compost_L: 432, pointsForts: ["Implication colossale du référent bénévole – moteur du site.", "Le composteur a mieux marché qu'espéré malgré les difficultés.", "Présence du Maire au café compost final – unique parmi tous les sites.", "Excellente qualité de compost confirmée malgré les problèmes initiaux.", "Le référent bénévole a pris sur lui en ramenant du compost chez lui pour libérer de la place."], pointsAmelioration: ["Tout est porté par un référent – le soutenir au maximum via la commune.", "Proposer l'installation d'un bac supplémentaire vu les volumes.", "Continuer l'apport en broyat.", "Travailler sur le gaspillage alimentaire en amont."], conclusion: "Avec ~1 197 kg de biodéchets détournés, Meusnes affiche les volumes les plus élevés du programme. Le compost mûr récolté (432 L) est d'excellente qualité. La présence du Maire au café compost et l'implication constante du référent bénévole témoignent d'un ancrage institutionnel et citoyen fort. Malgré des ajustements nécessaires sur le brassage, ce site démontre tout le potentiel du compostage partagé en milieu rural. À 10 ans, le potentiel dépasse 12 tonnes.", lat: 47.2194, lng: 1.5028},
  {id: "s15", name: "Monthou-sur-Cher", address: "", code: "MONTHO", foyers: 0, typeSite: "En cours", cantine: "Non concerné", periode: "2026", capacityL: 400, referents: [], biodechets_kg: 621, compost_L: 0, pointsForts: [], pointsAmelioration: [], conclusion: "", lat: 47.3511, lng: 1.2219},
  {id: "s8", name: "Montrichard", address: "Rue des Châtaigniers, 41400 Montrichard Val de Cher", code: "MONTRI", foyers: 16, typeSite: "Foyers", cantine: "175 repas/jour", periode: "Juillet 2024 – Mars 2026", capacityL: 500, referents: [{role: "Référent technique", nom: "Christophe HAUDEBERT", tel: "06 88 50 05 08", email: "espacesverts@montrichardvaldecher.fr"}, {role: "Référent citoyen", nom: "Christophe GUDIN", tel: "06 07 55 65 48", email: "c.gudin@montrichardvaldecher.fr"}], biodechets_kg: 962, compost_L: 581, pointsForts: ["Premier site en habitat collectif du programme – modèle de référence.", "Monsieur Gudin : rendez-vous réguliers tous les vendredis avec le référent technique, appels pour questions.", "Deuxième événement avec lots à gagner et vraie animation – modèle pour tout le territoire.", "Qualité présente malgré les volumes limités.", "Astuce anti-dégradation : panneau « vidéo surveillance » dissuasif.", "Compost récupéré et réutilisé par les habitants et la commune (parterres fleuris)."], pointsAmelioration: ["Continuer le travail de relais au sein du service technique – pousser la formation des agents.", "Formation reconnue par l'État disponible à Orléans (Cycloposteurs) ou Tours (Université de Tours).", "Consolider et valoriser un(e) référent(e) bénévole pour convaincre les résidents.", "La gardienne d'immeuble avait noté que les poubelles ne puaient plus – argument à utiliser."], conclusion: "Le site de la résidence des Châtaigniers à Montrichard a détourné ~925 kg de biodéchets et produit 581 L de compost mûr. La température de 31°C relevée lors d'une visite confirme une activité biologique soutenue. Ce site prouve que le compostage partagé est viable en habitat collectif urbain, à condition d'un accompagnement adapté et d'une référente impliquée. À 10 ans, le potentiel dépasse 9 tonnes.", lat: 47.3419, lng: 1.1944},
  {id: "s17", name: "Noyers-sur-Cher", address: "Centre-bourg, 41140 Noyers-sur-Cher", code: "NOYERS", foyers: 10, typeSite: "Foyers", cantine: "Non concerné", periode: "Octobre 2024 – Juin 2025", capacityL: 400, referents: [{role: "Référent technique", nom: "Christophe DEVELLE", tel: "06 78 54 15 40", email: "christophe-develle@bbox.fr"}, {role: "Référente citoyenne", nom: "Mélissa DUHAZE", tel: "07 81 77 65 87", email: "mel-akim2012@hotmail.fr"}], biodechets_kg: 508, compost_L: 340, pointsForts: ["Bon nombre de foyers inscrits (14) – participation encourageante.", "Nouvelle référente citoyenne motivée et réactive.", "Volume de biodéchets significatif dès le premier transfert (497 L → ~338 kg).", "Matériel rapidement remplacé après la tempête – réactivité de la commune."], pointsAmelioration: ["Remettre en place la signalétique obligatoire (panneaux d'information).", "Assurer un approvisionnement régulier en broyat pour maintenir l'équilibre C/N.", "Surveiller l'humidité du mélange – le mélange était trop sec au premier transfert.", "Organiser un café compost pour fédérer les participants et consolider la dynamique.", "Formaliser la formation de la nouvelle référente citoyenne."], conclusion: "Le site de Noyers-sur-Cher a détourné ~338 kg de biodéchets (497 L transférés) lors de son premier transfert, sans récolte de compost mûr à ce stade. Malgré un parcours jalonné d'aléas – signalétique manquante, broyat insuffisant, mélange trop sec, tempête ayant endommagé le matériel –, le site dispose d'atouts réels : 14 foyers engagés et une nouvelle référente motivée. L'accompagnement a permis de poser les bases ; c'est désormais à la commune et aux référents de faire vivre le projet.", lat: 47.2706, lng: 1.5878},
  {id: "s20", name: "Ouchamps", address: "Commune d'Ouchamps, 41120", code: "OUCHA", foyers: 0, typeSite: "En cours", cantine: "Non concerné", periode: "", capacityL: 400, referents: [], biodechets_kg: 377, compost_L: 0, pointsForts: [], pointsAmelioration: [], conclusion: "", lat: 47.3947, lng: 1.3194},
  {id: "s12", name: "Pouillé", address: "Derrière la salle polyvalente, 41110 Pouillé", code: "POUILL", foyers: 11, typeSite: "Foyers", cantine: "Non concerné", periode: "Juillet 2024 – Mars 2026", capacityL: 400, referents: [{role: "Référent technique", nom: "Pascal DEVINEAU", tel: "06 66 66 28 82", email: "devineau.pascal@orange.fr"}, {role: "Référent citoyen", nom: "Yann LE POLLOTEC", tel: "06 60 95 25 80", email: "yann.lepollotec@gmail.com"}], biodechets_kg: 654, compost_L: 333, pointsForts: ["Référent technique très pointu et précis dans son travail – site toujours bien tenu.", "Référent bénévole efficace en communication – bonne dynamique de binôme.", "Noyau solide à Pouillé qui garantit de beaux jours au site.", "Le référent technique a aussi contribué à améliorer le compostage de l'école.", "Deux cafés compost avec jeu réussis et pertinents."], pointsAmelioration: ["Continuer à créer de l'animation autour des composteurs.", "Recruter de nouveaux foyers.", "Mettre en place le carnet de suivi physique de manière systématique."], conclusion: "Avec 655 kg de biodéchets détournés et 333 L de compost mûr récoltés, le site de Pouillé démontre qu'un petit noyau de foyers bien encadré peut obtenir des résultats concrets. Le binôme de référents – l'un technique et précis, l'autre communicant et dynamique – constitue un socle solide. Le référent technique a même contribué à améliorer le compostage de l'école voisine. Si la commune parvient à recruter de nouveaux foyers, le potentiel à 10 ans dépasse 6,5 tonnes.", lat: 47.2664, lng: 1.4347},
  {id: "s22", name: "Saint-Aignan", address: "10 rue Victor Hugo, 41110 Saint-Aignan – Service jeunesse", code: "STAIG", foyers: 0, typeSite: "Foyers + Cantine", cantine: "Service jeunesse", periode: "Mai 2025 – en cours", capacityL: 3400, referents: [{role: "Référent technique (formé)", nom: "Alain DESVIGNES", tel: "+33 6 08 77 91 88", email: "dst@ville-staaignan.fr"}, {role: "Référent formé (jeunesse)", nom: "Amaury LAURENT", tel: "+33 6 40 63 87 33", email: "amauryollivier@icloud.com"}, {role: "Référent formé (jeunesse)", nom: "Baptiste DE FREITAS", tel: "+33 6 04 05 57 71", email: "enfance-jeunesse@ville-staignan.fr"}, {role: "Contact mairie", nom: "Audrey HÉRAULT", tel: "02 54 93 27 35", email: "services.techniques41@ville-staignan.fr"}], biodechets_kg: 560, compost_L: 0, pointsForts: ["Implication remarquable d'Amaury Laurent : participation enfants + brassage régulier + suivi app", "Alain Desvignes assure la gestion technique + rechargement broyat structurant", "Très peu de plastique – mélange équilibré en humidité", "Animation pédagogique réussie avec ~20 enfants le 01/04/2026", "Couverture médiatique La Nouvelle République", "Projet potager pédagogique envisagé avec le compost mûr"], pointsAmelioration: [], conclusion: "Site en progression constante avec une implication exemplaire des référents. 67 actions Véricompost dont 18 dépôts et 6 brassages. Le brassage chaque mercredi par Amaury Laurent garantit une qualité en hausse (T° >20°C). Première récolte prévue à l'automne 2026 pour le potager pédagogique.", lat: 47.2667, lng: 1.3722},
  {id: "s3", name: "Sassay", address: "Communauté de communes, 41110 Sassay", code: "SASSAY", foyers: 15, typeSite: "Foyers + Cantine", cantine: "80 repas/jour", periode: "Septembre 2023 – Avril 2026 (Cycloposteurs + Bio Tri Foule)", capacityL: 500, referents: [{role: "Référent technique & cantinier", nom: "Geoffroy LARCHER", tel: "06 22 18 97 74", email: "sassay2@wanadoo.fr"}, {role: "Référent citoyen & élu", nom: "Gérald GASCHET", tel: "06 62 29 31 06", email: "gerald.gaschet949@orange.fr"}], biodechets_kg: 1389, compost_L: 1303, pointsForts: ["Partenariat foyer-cantine EXCEPTIONNELLEMENT réussi – Geoffroy (cantinier technique) + Gérald (citoyen-élu) forment un binôme où chaque force s'exprime pleinement.", "Brassage régulier 'musclé' par le cantinier lui-même : implication opérationnelle directe, pas déléguée – très rare et très efficace.", "Décomposition ultra-rapide malgré température modérée : preuve de pédofaune excellente et d'équilibre C/N optimal.", "Zéro problème sanitaire (odeur, moucherons) : site parfaitement géré.", "Visibilité maximale : parking école, vitrine communale – rôle de modèle reproductible.", "Animation pédagogique exceptionnelle : TOUTE l'école sensibilisée, compréhension des flux de la fourche à l'assiette au compost – ancrage transgénérationnel.", "Continuité seamless Cycloposteurs → Bio Tri Foule : aucune rupture, mérite des référents reconnu.", "Volumes record du programme : 1 493 kg biodéchets, 829 L compost – site leader SMIEEOM."], pointsAmelioration: ["Broyat initial très avancé en décomposition – planifier remplacement avec calendrier.", "Documenter systématiquement le brassage hebdomadaire dans carnet de suivi (obligation légale actuellement à formaliser).", "Ancrer par écrit dans les fonctions du cantinier le rôle de gestionnaire du composteur (relais post-accompagnement)."], conclusion: "Le site de Sassay a détourné ~1 394 kg de biodéchets et produit 1 303 L de compost mûr d'excellente qualité (accompagnement Cycloposteurs + Bio Tri Foule 2023-2026). C'est le site le plus performant et le plus complet du programme SMIEEOM. Le binôme Geoffroy LARCHER (cantinier-technique) et Gérald GASCHET (citoyen-élu) a créé une alchimie remarquable : implication opérationnelle directe, communication efficace, animation pédagogique intergénérationnelle. Ce modèle foyer-cantine avec engagement cantinier systématique est unique et reproductible. À 10 ans, Sassay pourrait détourner plus de 15 tonnes de biodéchets et inspirer d'autres communes.", lat: 47.3089, lng: 1.4736},
  {id: "s1", name: "Seigy", address: "Place de la mairie, 41110 Seigy", code: "SEIGY", foyers: 23, typeSite: "Foyers", cantine: "Non concerné", periode: "Mars 2023 (Cycloposteurs) – Avril 2026 (Bio Tri Foule)", capacityL: 500, referents: [{role: "Référent technique (formé – parti à la retraite)", nom: "Patrick ROVIRA", tel: "02 54 75 12 31", email: "mairie@seigy.com"}, {role: "Référent citoyen / élu (formé – a cessé son implication)", nom: "Jean-Luc ESNAULT", tel: "06 43 36 74 25", email: "adjoint3esnault@orange.fr"}], biodechets_kg: 1491, compost_L: 1407, pointsForts: ["Excellente qualité de compost – site techniquement parfait avec une biodiversité riche.", "Volumes impressionnants : ~1 490 kg de biodéchets détournés et 1 407 L de compost mûr sur 3 cycles.", "Initiative remarquable de Patrick Rovira : remplacement des tiges plastique par du métal après l'incident voiture, pose de dalles béton, relevés de température réguliers.", "23 foyers inscrits – bonne participation communale sans cantine.", "Réussite pédagogique : animation de 30 minutes avec une classe de CM2 sur le tri des biodéchets, le retour à la terre et le cycle de vie des végétaux.", "Mobilisation communale forte : goûter offert par la mairie, présence de deux élus lors du dernier accompagnement.", "Distribution du compost mûr prévue via mail aux administrés – valorisation locale directe.", "Approvisionnement en broyat assuré grâce au broyeur prêté par le SMIEEOM – solution pérenne."], pointsAmelioration: ["Urgence absolue : identifier et former deux nouveaux référents. Patrick Rovira (agent technique formé) est parti à la retraite et Jean-Luc Esnault (élu/bénévole formé) a cessé son implication pour des raisons personnelles qui lui sont propres et entendables. Sans référent formé, le site est en non-conformité réglementaire.", "Mettre en place un carnet de suivi sur site : température, entretien, brassages, apports de broyat – obligation légale en cas de contrôle.", "S'assurer que le pourtour des composteurs reste bien dégagé pour prévenir l'installation de nuisibles.", "Surveiller l'humidité du compost mature et procéder aux réhumidifications nécessaires.", "Formaliser la communication : diffuser le chiffre des 1 490 kg détournés auprès des habitants pour valoriser le projet et motiver de nouvelles inscriptions."], conclusion: "Le site de Seigy a détourné ~1 490 kg de biodéchets et produit 1 407 L de compost mûr d'excellente qualité sur 3 cycles de transfert (2023-2026). C'est l'un des sites les plus performants du programme avec 23 foyers inscrits. L'implication de Patrick Rovira et Jean-Luc Esnault a été exemplaire, mais leur départ (retraite et arrêt volontaire) crée une urgence : le site n'a plus aucun référent formé. L'animation CM2 et la distribution prévue du compost ancrent le projet localement. Le verdict est clair : réussite technique et pédagogique, mais fragilité administrative. Le passage en autonomie nécessite impérativement la formation de deux nouveaux référents et la mise en place d'un carnet de suivi.", lat: 47.2761, lng: 1.4258},
  {id: "s13", name: "Selles-sur-Cher", address: "Levée du Parc, 41130 Selles-sur-Cher", code: "SELLES", foyers: 10, typeSite: "Foyers", cantine: "Non concerné", periode: "Juillet 2024 – Juin 2025", capacityL: 400, referents: [{role: "Référent technique", nom: "Frédéric LECLERC", tel: "07 57 49 50 85", email: "dst@selles-sur-cher.fr"}, {role: "Référent citoyen", nom: "Muriel BOISSONNET", tel: "06 76 06 93 25", email: "murielboissonnet@yahoo.fr"}], biodechets_kg: 648, compost_L: 345, pointsForts: ["Plus grand nombre de foyers inscrits du programme (19).", "Communication faite de manière exceptionnelle.", "Soutien important des élus.", "Visite des écoles avec un vrai succès.", "Emplacement stratégique et bien pensé.", "Chiffres prouvant un vrai intérêt pour ce site."], pointsAmelioration: ["Accompagnement technique pas régulier et pas bien fait – gros point noir.", "Il faut absolument que le compostage rentre dans les fonctions d'un agent technique, sinon le site mourra.", "Le site doit être bien entretenu pour encourager les gens à y aller.", "Les codes doivent être bien définis et accessibles pour tous.", "Former au moins un agent technique et l'intégrer dans ses fonctions."], conclusion: "Avec 19 foyers inscrits, Selles-sur-Cher est le site le plus mobilisé du programme. Il a détourné ~647 kg de biodéchets et produit 345 L de compost mûr tamisé. Cette forte participation citoyenne est un atout, mais elle nécessite un relais technique pérenne : l'intégration de la gestion du composteur dans les missions d'un agent communal est indispensable pour garantir la continuité. Le potentiel à 10 ans dépasse 6 tonnes.", lat: 47.2731, lng: 1.5478},
  {id: "s5", name: "Soings-en-Sologne", address: "Face à la cantine de l'école, 41230 Soings-en-Sologne", code: "SOINGS", foyers: 8, typeSite: "Foyers + Cantine", cantine: "135 repas/jour", periode: "Juillet 2024 – Juin 2025", capacityL: 400, referents: [{role: "Référent technique", nom: "Sylvain FRANKE", tel: "06 99 90 01 61", email: "frankesylvain00@gmail.com"}, {role: "Référent citoyen", nom: "Regine BLONDEL", tel: "07 70 08 57 56", email: "regine.blondel60@gmail.com"}], biodechets_kg: 1126, compost_L: 432, pointsForts: ["Site exemplaire du programme – un modèle reproductible pour d'autres communes.", "Cantinier déjà engagé contre le gaspillage : a compris immédiatement l'intérêt et proposé des biscuits anti-gaspillage.", "Passage de relais réussi entre la référente technique initiale et un nouveau référent bénévole.", "Référent technique (Sylvain Franke) présent de manière hebdomadaire – un engagement rare et exemplaire.", "Implantation stratégique : des dizaines de parents et enfants passent devant chaque jour. L'emplacement, choisi avec insistance par Bio Tri Foule malgré les réticences initiales, s'est révélé être le meilleur choix possible – un véritable site vitrine.", "Compost réutilisé dans le potager pédagogique de l'école – boucle vertueuse complète.", "Broyat toujours bien géré, site bien entretenu.", "Ce site a vocation à inspirer d'autres communes : l'emplacement stratégique, l'implication des référents, la collaboration avec le cantinier et le relais pédagogique avec l'école forment un ensemble cohérent et reproductible."], pointsAmelioration: ["Valoriser le référent technique : son implication hebdomadaire mérite une reconnaissance formelle. Sa fonction de référent compostage devrait être inscrite dans son contrat ou sa fiche de poste afin de valoriser cet engagement, mais aussi de pérenniser le suivi en cas de départ.", "Recruter davantage de foyers : soit 8 foyers supplémentaires pour doubler la participation, soit mettre à disposition de la salle des fêtes des bioseaux avec une explication du tri des biodéchets et de la possibilité de déposer ces biodéchets dans le composteur collectif.", "Maintenir l'attractivité du site : le composteur étant situé sur un lieu de passage, il est essentiel de veiller à l'état du matériel et de procéder aux réparations nécessaires pour préserver l'image du site.", "Les agents communaux doivent continuer un passage régulier : vérifier la température, tenir le carnet de suivi, alimenter en broyat."], conclusion: "Le site de Soings-en-Sologne a détourné ~1 109 kg de biodéchets et produit 432 L de compost mûr, directement intégré au potager pédagogique de l'école. C'est l'un des plus performants du programme en volume et un modèle pour d'autres communes. Le référent technique assure un passage hebdomadaire – un engagement qui mérite d'être formalisé et pérennisé. L'ancrage scolaire du projet en fait un outil éducatif concret sur le cycle de la matière. À 10 ans, le potentiel dépasse 11 tonnes.", lat: 47.3378, lng: 1.5411},
  {id: "s2", name: "Thenay", address: "Salle des fêtes, 41400 Thenay", code: "THENAY", foyers: 10, typeSite: "Foyers", cantine: "Non concerné", periode: "Septembre 2024 – Avril 2025", capacityL: 400, referents: [{role: "Référent technique", nom: "Guilherme GAUTIER", tel: "02 54 32 52 07", email: "mairie.thenay@controis-en-sologne.fr"}, {role: "Référent citoyen", nom: "Danielle PRUD'HOMME", tel: "06 07 62 13 41", email: "gogotnam@wanadoo.fr"}], biodechets_kg: 1402, compost_L: 690, pointsForts: ["Implication extraordinaire de l'agent technique : site techniquement parfait, gestion rigoureuse.", "Quantités de biodéchets générées importantes – le site a tout son sens.", "Référente bénévole greffée au projet pour la communication."], pointsAmelioration: ["Donner un second souffle au site : trouver le levier pour attirer davantage de monde.", "Manque de soutien de la commune – relancer l'implication des élus.", "Surveiller l'état du matériel (bois, charnières) sous les arbres – entretien régulier.", "Formaliser la formation de la référente bénévole (pas de formation formelle reçue)."], conclusion: "Le site de Thenay a détourné environ 994 kg de biodéchets des ordures ménagères et produit ~690 L de compost mûr en deux récoltes. Repris par Bio Tri Foule après un premier accompagnement des Cycloposteurs, le site bénéficie d'un agent technique exemplaire dont la rigueur assure un fonctionnement irréprochable. L'enjeu majeur reste la mobilisation communale : relancer l'animation et impliquer les élus pour donner un second souffle à cette installation qui, à 10 ans, pourrait détourner près de 10 tonnes de biodéchets.", lat: 47.2028, lng: 1.3628},
  {id: "s21", name: "Thésée", address: "École communale, 41140 Thésée", code: "THESEE", foyers: 10, typeSite: "Foyers + Cantine", cantine: "Non concerné", periode: "2024 – 2025", capacityL: 400, referents: [{role: "Référent bénévole (ancien)", nom: "Daniel CHARLUTEAU", tel: "", email: ""}, {role: "Référent technique (parti)", nom: "Agent technique (parti)", tel: "", email: ""}], biodechets_kg: 287, compost_L: 130, pointsForts: ["Compost mûr d'excellente qualité – mélange homogène prouvant une bonne gestion initiale.", "Bonne compréhension du contexte rural par M. Charluteau (Vice-président SMIGE).", "Apprentissage majeur : un site bien installé mais mal placé ne peut pas fonctionner."], pointsAmelioration: ["Relocaliser le composteur dans l'enceinte de l'école pour faciliter les apports de la cantine.", "Former le nouvel agent technique comme référent de site (formation reconnue par l'État).", "Organiser une campagne de recrutement de foyers si le site est relocalisé.", "Valoriser le compost produit pour un usage pédagogique ou communal."], conclusion: "Le site de Thésée a détourné ~233 kg de biodéchets (342 L transférés) et produit 130 L de compost mûr d'excellente qualité. Le faible volume s'explique par un emplacement excentré, éloigné de l'école et peu visible, ainsi que par le départ du référent technique. Ce bilan constitue un retour d'expérience précieux : un composteur bien installé mais mal positionné ne peut pas fonctionner durablement. La relocalisation dans l'enceinte de l'école est la priorité.", lat: 47.2844, lng: 1.5531},
];

const DEMO_ENTRIES = [
  {id: "e_chem_b5", siteId: "s14", date: "2026-05-11", actionType: "brassage", volumeL: null, observations: [], temperature: 30, tempsMin: 10, commentaire: "Bon état (bien structuré, aéré)", createdAt: "2026-05-20T09:18:54"},
  {id: "e_chem_b4", siteId: "s14", date: "2026-05-05", actionType: "brassage", volumeL: null, observations: [], temperature: 30, tempsMin: 10, commentaire: "Bon état (bien structuré, aéré)", createdAt: "2026-05-20T09:17:58"},
  {id: "e_chem_b3", siteId: "s14", date: "2026-04-27", actionType: "brassage", volumeL: null, observations: [], temperature: 30, tempsMin: 10, commentaire: "Bon état (bien structuré, aéré)", createdAt: "2026-05-20T09:17:14"},
  {id: "e_chem_b2", siteId: "s14", date: "2026-04-21", actionType: "brassage", volumeL: null, observations: [], temperature: 26, tempsMin: 10, commentaire: "Bon état (bien structuré, aéré)", createdAt: "2026-05-20T09:16:28"},
  {id: "e_chem_b1", siteId: "s14", date: "2026-04-15", actionType: "brassage", volumeL: null, observations: [], temperature: 25, tempsMin: 10, commentaire: "Bon état (bien structuré, aéré)", createdAt: "2026-05-20T09:15:39"},
  {id: "e1", siteId: "s1", date: "2026-04-09", actionType: "transfert", volumeL: 664, observations: [], temperature: null, tempsMin: 30, commentaire: "Dernier accompagnement SMIEEOM. 4×166 L = 664 L. Récolte 497 L compost mûr placé en benne. Animation 30 min classe CM2. Goûter mairie.", createdAt: "2026-04-09T10:00:00"},
  {id: "e2", siteId: "s1", date: "2026-04-09", actionType: "recolte", volumeL: 497, observations: [], temperature: null, tempsMin: null, commentaire: "Récolte 497 L compost mûr", createdAt: "2026-04-09T10:30:00"},
  {id: "e3", siteId: "s16", date: "2026-04-09", actionType: "transfert", volumeL: 498, observations: [], temperature: null, tempsMin: null, commentaire: "Dernier accompagnement. 3×166=498 L transférés. 1,5×166=249 L compost mûr tamisé finement en terreau à semis (atelier Laetitia). ~15 personnes, SMIEEOM présent.", createdAt: "2026-04-09T10:00:00"},
  {id: "e4", siteId: "s16", date: "2026-04-09", actionType: "recolte", volumeL: 249, observations: [], temperature: null, tempsMin: null, commentaire: "Récolte 249 L compost mûr", createdAt: "2026-04-09T10:30:00"},
  {id: "e5", siteId: "s3", date: "2026-04-02", actionType: "transfert", volumeL: 747, observations: [], temperature: null, tempsMin: null, commentaire: "Animation pédagogique toutes classes + retrait 498 L compost mûr final", createdAt: "2026-04-02T10:00:00"},
  {id: "e6", siteId: "s3", date: "2026-04-02", actionType: "recolte", volumeL: 498, observations: [], temperature: null, tempsMin: null, commentaire: "Récolte 498 L compost mûr", createdAt: "2026-04-02T10:30:00"},
  {id: "e7", siteId: "s21", date: "2026-04-01", actionType: "transfert", volumeL: 80, observations: [], temperature: null, tempsMin: null, commentaire: "Retrait 130 L compost mûr + transfert final 80 L", createdAt: "2026-04-01T10:00:00"},
  {id: "e8", siteId: "s21", date: "2026-04-01", actionType: "recolte", volumeL: 130, observations: [], temperature: null, tempsMin: null, commentaire: "Récolte 130 L compost mûr", createdAt: "2026-04-01T10:30:00"},
  {id: "e_sa_7", siteId: "s22", date: "2026-04-01", actionType: "transfert", volumeL: 830, observations: [], temperature: null, tempsMin: 90, commentaire: "Café compost – Animation pédagogique avec ~20 enfants, transfert, brassage", createdAt: "2026-04-01T10:00:00"},
  {id: "e_montho_4", siteId: "s15", date: "2026-03-31", actionType: "transfert", volumeL: 955, observations: [], temperature: null, tempsMin: null, commentaire: "Transfert estimé (621 kg / 0.65)", createdAt: "2026-03-31T10:00:00"},
  {id: "e10", siteId: "s8", date: "2026-03-28", actionType: "transfert", volumeL: 665, observations: [], temperature: null, tempsMin: null, commentaire: "Transfert + retrait 581 L compost mûr", createdAt: "2026-03-28T10:00:00"},
  {id: "e11", siteId: "s8", date: "2026-03-28", actionType: "recolte", volumeL: 581, observations: [], temperature: null, tempsMin: null, commentaire: "Récolte 581 L compost mûr", createdAt: "2026-03-28T10:30:00"},
  {id: "e12", siteId: "s8", date: "2026-03-28", actionType: "visite", volumeL: null, observations: [], temperature: 31, tempsMin: null, commentaire: "Bonne activité biologique confirmée", createdAt: "2026-03-28T10:00:00"},
  {id: "e13", siteId: "s11", date: "2026-03-28", actionType: "transfert", volumeL: 1000, observations: [], temperature: null, tempsMin: null, commentaire: "Transfert vers bac de maturation – café compost", createdAt: "2026-03-28T10:00:00"},
  {id: "e14", siteId: "s7", date: "2026-03-17", actionType: "recolte", volumeL: 334, observations: [], temperature: null, tempsMin: null, commentaire: "Retrait 334 L compost mûr après fin période", createdAt: "2026-03-17T10:00:00"},
  {id: "e15", siteId: "s12", date: "2026-03-07", actionType: "transfert", volumeL: 383, observations: [], temperature: null, tempsMin: null, commentaire: "Transfert + retrait 333 L compost mûr", createdAt: "2026-03-07T10:00:00"},
  {id: "e16", siteId: "s12", date: "2026-03-07", actionType: "recolte", volumeL: 333, observations: [], temperature: null, tempsMin: null, commentaire: "Récolte 333 L compost mûr", createdAt: "2026-03-07T10:30:00"},
  {id: "e17", siteId: "s16", date: "2026-03-06", actionType: "manutention", volumeL: null, observations: [], temperature: null, tempsMin: null, commentaire: "Brasseur de compost volé. Bac de matériel forcé. Remplacement via Émeraude Création (fournisseur collectivités).", createdAt: "2026-03-06T10:00:00"},
  {id: "e18", siteId: "s11", date: "2026-02-17", actionType: "manutention", volumeL: null, observations: [], temperature: null, tempsMin: null, commentaire: "Suite appel de Willy, système de fixation cassé. Réparation faite (cause : vis oxydable et humidité)", createdAt: "2026-02-17T10:00:00"},
  {id: "e19", siteId: "s16", date: "2026-02-17", actionType: "manutention", volumeL: null, observations: [], temperature: null, tempsMin: null, commentaire: "Suite appel Laetitia. Les vis du système de fixation réparées", createdAt: "2026-02-17T10:00:00"},
  {id: "e20", siteId: "s20", date: "2026-02-17", actionType: "manutention", volumeL: null, observations: [], temperature: null, tempsMin: null, commentaire: "Suite appel de Willy, système de fixation cassé. Réparation faite (cause : vis oxydable et humidité)", createdAt: "2026-02-17T10:00:00"},
  {id: "e21", siteId: "s16", date: "2026-02-11", actionType: "manutention", volumeL: null, observations: [], temperature: null, tempsMin: null, commentaire: "Suite appel Laetitia. Réparation + pose de câbles par Thibault", createdAt: "2026-02-11T10:00:00"},
  {id: "e22", siteId: "s16", date: "2026-02-06", actionType: "manutention", volumeL: null, observations: [], temperature: null, tempsMin: null, commentaire: "Constat : vis de 2 des 3 charnières du bac d'apport rouillées et lâchées", createdAt: "2026-02-06T10:00:00"},
  {id: "e23", siteId: "s19", date: "2026-02-04", actionType: "manutention", volumeL: null, observations: ["moucherons"], temperature: null, tempsMin: null, commentaire: "Sur appel de Christophe – présence de mouches à drain (psychodidae) en grande quantité", createdAt: "2026-02-04T10:00:00"},
  {id: "e_sa_6", siteId: "s22", date: "2026-01-28", actionType: "visite", volumeL: null, observations: [], temperature: null, tempsMin: 60, commentaire: "Visite intermédiaire – Compost anarchique – formation complémentaire", createdAt: "2026-01-28T10:00:00"},
  {id: "e24", siteId: "s14", date: "2026-01-05", actionType: "brassage", volumeL: null, observations: [], temperature: null, tempsMin: 10, commentaire: "Brassage et recouvrement de biodéchets non-recouverts. Temps de passage environ 10 minutes", createdAt: "2026-01-05T10:00:00"},
  {id: "e25", siteId: "s20", date: "2025-12-19", actionType: "transfert", volumeL: 554, observations: [], temperature: null, tempsMin: null, commentaire: "Transfert vers bac de maturation", createdAt: "2025-12-19T10:00:00"},
  {id: "e26", siteId: "s14", date: "2025-12-15", actionType: "transfert", volumeL: 940, observations: [], temperature: null, tempsMin: null, commentaire: "Transfert et animation 2 classes maternelle", createdAt: "2025-12-15T10:00:00"},
  {id: "e27", siteId: "s10", date: "2025-12-12", actionType: "transfert", volumeL: 480, observations: [], temperature: null, tempsMin: null, commentaire: "Transfert + retrait 322 L compost mûr", createdAt: "2025-12-12T10:00:00"},
  {id: "e28", siteId: "s10", date: "2025-12-12", actionType: "recolte", volumeL: 322, observations: [], temperature: null, tempsMin: null, commentaire: "Récolte 322 L compost mûr", createdAt: "2025-12-12T10:30:00"},
  {id: "e29", siteId: "s14", date: "2025-12-08", actionType: "brassage", volumeL: null, observations: [], temperature: 50, tempsMin: 10, commentaire: "Température de 50°C – temps passé 10 min – Gwen", createdAt: "2025-12-08T10:00:00"},
  {id: "e30", siteId: "s19", date: "2025-12-06", actionType: "transfert", volumeL: 581, observations: [], temperature: null, tempsMin: null, commentaire: "Transfert café compost", createdAt: "2025-12-06T10:00:00"},
  {id: "e31", siteId: "s16", date: "2025-12-04", actionType: "transfert", volumeL: 322, observations: [], temperature: null, tempsMin: null, commentaire: "Transfert participatif sur temps du midi (~10 participants actifs). Repas participatif + ateliers Laetitia. Qualité au RDV, volumes modestes. Rappel règles compostage.", createdAt: "2025-12-04T10:00:00"},
  {id: "e32", siteId: "s11", date: "2025-11-06", actionType: "manutention", volumeL: null, observations: ["moucherons"], temperature: null, tempsMin: null, commentaire: "CP envoyé par mail – Problème moucherons – Sec – Compost jeune", createdAt: "2025-11-06T10:00:00"},
  {id: "e_sa_5", siteId: "s22", date: "2025-11-05", actionType: "visite", volumeL: null, observations: [], temperature: null, tempsMin: 60, commentaire: "Visite intermédiaire – Nouveau fonctionnement – brassage régulier expliqué", createdAt: "2025-11-05T10:00:00"},
  {id: "e33", siteId: "s16", date: "2025-10-28", actionType: "visite", volumeL: null, observations: [], temperature: 18, tempsMin: null, commentaire: "18 °C – Le compost ne chauffe quasiment pas – faible volume et excès de structurant", createdAt: "2025-10-28T10:00:00"},
  {id: "e_montho_3", siteId: "s15", date: "2025-10-16", actionType: "visite", volumeL: null, observations: [], temperature: null, tempsMin: null, commentaire: "1ère visite de suivi", createdAt: "2025-10-16T10:00:00"},
  {id: "e_sa_4", siteId: "s22", date: "2025-10-16", actionType: "visite", volumeL: null, observations: [], temperature: 21, tempsMin: 60, commentaire: "1ère visite – Relevé température – site en bon fonctionnement", createdAt: "2025-10-16T10:00:00"},
  {id: "e35", siteId: "s20", date: "2025-10-08", actionType: "manutention", volumeL: null, observations: [], temperature: null, tempsMin: null, commentaire: "En présence de Willy de 13h à 13h30", createdAt: "2025-10-08T10:00:00"},
  {id: "e36", siteId: "s11", date: "2025-09-27", actionType: "manutention", volumeL: null, observations: [], temperature: null, tempsMin: null, commentaire: "Maintenance matériel", createdAt: "2025-09-27T10:00:00"},
  {id: "e37", siteId: "s20", date: "2025-09-27", actionType: "visite", volumeL: null, observations: [], temperature: null, tempsMin: null, commentaire: "Remplacement du cadenas disparu du bac de maturation", createdAt: "2025-09-27T10:00:00"},
  {id: "e_sa_3", siteId: "s22", date: "2025-09-24", actionType: "visite", volumeL: null, observations: [], temperature: null, tempsMin: 150, commentaire: "Inauguration – Lancement officiel du site", createdAt: "2025-09-24T10:00:00"},
  {id: "e_montho_2", siteId: "s15", date: "2025-09-11", actionType: "visite", volumeL: null, observations: [], temperature: null, tempsMin: null, commentaire: "Mise en place et inauguration officielle", createdAt: "2025-09-11T10:00:00"},
  {id: "e39", siteId: "s16", date: "2025-09-09", actionType: "remplissage_broyat", volumeL: null, observations: [], temperature: null, tempsMin: null, commentaire: "Livraison de broyat suite à la visite", createdAt: "2025-09-09T10:00:00"},
  {id: "e40", siteId: "s16", date: "2025-09-08", actionType: "manutention", volumeL: null, observations: ["trop_sec"], temperature: null, tempsMin: null, commentaire: "Visite avec les deux référentes. ~166 L, ~100 kg estimés. Pédofaune active. Excès de broyat, compost trop sec. Bon engagement des référentes.", createdAt: "2025-09-08T10:00:00"},
  {id: "e41", siteId: "s17", date: "2025-09-04", actionType: "visite", volumeL: null, observations: [], temperature: null, tempsMin: null, commentaire: "Remplacement matériel suite à tempête (arbres écrasés)", createdAt: "2025-09-04T10:00:00"},
  {id: "e42", siteId: "s16", date: "2025-06-26", actionType: "visite", volumeL: null, observations: [], temperature: null, tempsMin: null, commentaire: "Inauguration avec une trentaine de personnes", createdAt: "2025-06-26T10:00:00"},
  {id: "e43", siteId: "s19", date: "2025-06-26", actionType: "visite", volumeL: null, observations: [], temperature: null, tempsMin: null, commentaire: "Inauguration avec une dizaine de personnes", createdAt: "2025-06-26T10:00:00"},
  {id: "e44", siteId: "s20", date: "2025-06-25", actionType: "visite", volumeL: null, observations: [], temperature: null, tempsMin: null, commentaire: "Inauguration officielle", createdAt: "2025-06-25T10:00:00"},
  {id: "e_sa_2", siteId: "s22", date: "2025-06-24", actionType: "visite", volumeL: null, observations: [], temperature: null, tempsMin: 90, commentaire: "Réunion publique – Présentation du projet – service jeunesse + habitants", createdAt: "2025-06-24T10:00:00"},
  {id: "e45", siteId: "s8", date: "2025-06-21", actionType: "transfert", volumeL: 695, observations: [], temperature: null, tempsMin: null, commentaire: "1er transfert", createdAt: "2025-06-21T10:00:00"},
  {id: "e46", siteId: "s16", date: "2025-06-19", actionType: "visite", volumeL: null, observations: [], temperature: null, tempsMin: null, commentaire: "Installation du site", createdAt: "2025-06-19T10:00:00"},
  {id: "e_montho_1", siteId: "s15", date: "2025-06-18", actionType: "visite", volumeL: null, observations: [], temperature: null, tempsMin: null, commentaire: "Réunion publique", createdAt: "2025-06-18T10:00:00"},
  {id: "e48", siteId: "s16", date: "2025-06-16", actionType: "visite", volumeL: null, observations: [], temperature: null, tempsMin: null, commentaire: "Réunion publique le midi – une vingtaine de personnes", createdAt: "2025-06-16T10:00:00"},
  {id: "e49", siteId: "s4", date: "2025-06-14", actionType: "transfert", volumeL: 1000, observations: [], temperature: null, tempsMin: null, commentaire: "Transfert + retrait 432 L compost mûr – excellente qualité", createdAt: "2025-06-14T10:00:00"},
  {id: "e50", siteId: "s4", date: "2025-06-14", actionType: "recolte", volumeL: 432, observations: [], temperature: null, tempsMin: null, commentaire: "Récolte 432 L compost mûr", createdAt: "2025-06-14T10:30:00"},
  {id: "e51", siteId: "s5", date: "2025-06-12", actionType: "transfert", volumeL: 691, observations: [], temperature: null, tempsMin: null, commentaire: "Dernière visite – transfert + retrait 432 L compost mûr", createdAt: "2025-06-12T10:00:00"},
  {id: "e52", siteId: "s5", date: "2025-06-12", actionType: "recolte", volumeL: 432, observations: [], temperature: null, tempsMin: null, commentaire: "Récolte 432 L compost mûr", createdAt: "2025-06-12T10:30:00"},
  {id: "e53", siteId: "s6", date: "2025-06-12", actionType: "transfert", volumeL: 650, observations: [], temperature: null, tempsMin: null, commentaire: "Transfert + retrait 518 L compost mûr", createdAt: "2025-06-12T10:00:00"},
  {id: "e54", siteId: "s6", date: "2025-06-12", actionType: "recolte", volumeL: 518, observations: [], temperature: null, tempsMin: null, commentaire: "Récolte 518 L compost mûr", createdAt: "2025-06-12T10:30:00"},
  {id: "e55", siteId: "s17", date: "2025-06-12", actionType: "transfert", volumeL: 250, observations: [], temperature: null, tempsMin: null, commentaire: "Transfert + récolte 340 L compost mûr d'excellente qualité", createdAt: "2025-06-12T10:00:00"},
  {id: "e56", siteId: "s17", date: "2025-06-12", actionType: "recolte", volumeL: 340, observations: [], temperature: null, tempsMin: null, commentaire: "Récolte 340 L compost mûr", createdAt: "2025-06-12T10:30:00"},
  {id: "e57", siteId: "s13", date: "2025-06-11", actionType: "transfert", volumeL: 288, observations: [], temperature: null, tempsMin: null, commentaire: "Transfert + retrait 345 L compost mûr", createdAt: "2025-06-11T10:00:00"},
  {id: "e58", siteId: "s13", date: "2025-06-11", actionType: "recolte", volumeL: 345, observations: [], temperature: null, tempsMin: null, commentaire: "Récolte 345 L compost mûr", createdAt: "2025-06-11T10:30:00"},
  {id: "e59", siteId: "s7", date: "2025-06-10", actionType: "transfert", volumeL: 576, observations: [], temperature: null, tempsMin: null, commentaire: "Transfert + retrait 576 L compost mûr", createdAt: "2025-06-10T10:00:00"},
  {id: "e60", siteId: "s7", date: "2025-06-10", actionType: "recolte", volumeL: 576, observations: [], temperature: null, tempsMin: null, commentaire: "Récolte 576 L compost mûr", createdAt: "2025-06-10T10:30:00"},
  {id: "e61", siteId: "s9", date: "2025-06-10", actionType: "transfert", volumeL: 403, observations: [], temperature: null, tempsMin: null, commentaire: "Transfert + retrait 518 L compost mûr", createdAt: "2025-06-10T10:00:00"},
  {id: "e62", siteId: "s9", date: "2025-06-10", actionType: "recolte", volumeL: 518, observations: [], temperature: null, tempsMin: null, commentaire: "Récolte 518 L compost mûr", createdAt: "2025-06-10T10:30:00"},
  {id: "e63", siteId: "s14", date: "2025-05-29", actionType: "visite", volumeL: null, observations: [], temperature: null, tempsMin: null, commentaire: "Inauguration avec l'association", createdAt: "2025-05-29T10:00:00"},
  {id: "e64", siteId: "s14", date: "2025-05-27", actionType: "visite", volumeL: null, observations: [], temperature: null, tempsMin: null, commentaire: "Réunion publique de présentation", createdAt: "2025-05-27T10:00:00"},
  {id: "e65", siteId: "s19", date: "2025-05-27", actionType: "visite", volumeL: null, observations: [], temperature: null, tempsMin: null, commentaire: "Réunion publique – une trentaine de personnes – choix du site", createdAt: "2025-05-27T10:00:00"},
  {id: "e_sa_1", siteId: "s22", date: "2025-05-24", actionType: "visite", volumeL: null, observations: [], temperature: null, tempsMin: 240, commentaire: "Mise en place – Installation 3 bacs 1000 L + 1 bac rangement 400 L + 30 bioseaux", createdAt: "2025-05-24T10:00:00"},
  {id: "e66", siteId: "s21", date: "2025-05-02", actionType: "transfert", volumeL: 342, observations: [], temperature: null, tempsMin: null, commentaire: "1er transfert", createdAt: "2025-05-02T10:00:00"},
  {id: "e_ange_2", siteId: "s18", date: "2025-04-24", actionType: "transfert", volumeL: 695, observations: [], temperature: null, tempsMin: null, commentaire: "Transfert estimé (452 kg / 0.65)", createdAt: "2025-04-24T10:00:00"},
  {id: "e_ange_3", siteId: "s18", date: "2025-04-24", actionType: "recolte", volumeL: 166, observations: [], temperature: null, tempsMin: null, commentaire: "Récolte 166 L compost mûr", createdAt: "2025-04-24T10:30:00"},
  {id: "e69", siteId: "s8", date: "2025-04-23", actionType: "visite", volumeL: null, observations: [], temperature: 24, tempsMin: null, commentaire: "Tout se passe bien", createdAt: "2025-04-23T10:00:00"},
  {id: "e70", siteId: "s4", date: "2025-04-22", actionType: "visite", volumeL: null, observations: ["moucherons"], temperature: null, tempsMin: null, commentaire: "Vérification présence moucherons", createdAt: "2025-04-22T10:00:00"},
  {id: "e71", siteId: "s5", date: "2025-04-09", actionType: "visite", volumeL: null, observations: [], temperature: null, tempsMin: null, commentaire: "Attention : le brassage n'est pas fait régulièrement – rappels effectués", createdAt: "2025-04-09T10:00:00"},
  {id: "e72", siteId: "s5", date: "2025-04-09", actionType: "visite", volumeL: null, observations: [], temperature: 25, tempsMin: null, commentaire: "Relevé température 25°C", createdAt: "2025-04-09T10:00:00"},
  {id: "e73", siteId: "s4", date: "2025-04-07", actionType: "transfert", volumeL: 760, observations: [], temperature: null, tempsMin: null, commentaire: "Attention ! Manque de brassage constaté", createdAt: "2025-04-07T10:00:00"},
  {id: "e74", siteId: "s9", date: "2025-04-07", actionType: "transfert", volumeL: 746, observations: [], temperature: null, tempsMin: null, commentaire: "Transfert réalisé seul", createdAt: "2025-04-07T10:00:00"},
  {id: "e75", siteId: "s2", date: "2025-04-05", actionType: "transfert", volumeL: 579, observations: [], temperature: null, tempsMin: null, commentaire: "Dernière visite – transfert + récolte 331 L compost mûr", createdAt: "2025-04-05T10:00:00"},
  {id: "e76", siteId: "s2", date: "2025-04-05", actionType: "recolte", volumeL: 331, observations: [], temperature: null, tempsMin: null, commentaire: "Récolte 331 L compost mûr", createdAt: "2025-04-05T10:30:00"},
  {id: "e77", siteId: "s4", date: "2025-04-04", actionType: "visite", volumeL: null, observations: [], temperature: null, tempsMin: null, commentaire: "Rdv avec Théo – discussion sur les difficultés du site", createdAt: "2025-04-04T10:00:00"},
  {id: "e78", siteId: "s10", date: "2025-04-04", actionType: "transfert", volumeL: 581, observations: [], temperature: null, tempsMin: null, commentaire: "À 15h45 avec la présence d'une classe", createdAt: "2025-04-04T10:00:00"},
  {id: "e79", siteId: "s17", date: "2025-04-04", actionType: "transfert", volumeL: 497, observations: ["trop_sec"], temperature: null, tempsMin: null, commentaire: "1er transfert – mélange constaté trop sec", createdAt: "2025-04-04T10:00:00"},
  {id: "e80", siteId: "s4", date: "2025-04-01", actionType: "visite", volumeL: null, observations: [], temperature: null, tempsMin: null, commentaire: "Mail rapport envoyé", createdAt: "2025-04-01T10:00:00"},
  {id: "e81", siteId: "s12", date: "2025-03-29", actionType: "transfert", volumeL: 580, observations: [], temperature: null, tempsMin: null, commentaire: "1er transfert participatif", createdAt: "2025-03-29T10:00:00"},
  {id: "e82", siteId: "s1", date: "2025-03-14", actionType: "transfert", volumeL: 828, observations: [], temperature: null, tempsMin: null, commentaire: "Transfert 828 L + retrait 329 L compost mûr", createdAt: "2025-03-14T10:00:00"},
  {id: "e83", siteId: "s1", date: "2025-03-14", actionType: "recolte", volumeL: 329, observations: [], temperature: null, tempsMin: null, commentaire: "Récolte 329 L compost mûr", createdAt: "2025-03-14T10:30:00"},
  {id: "e84", siteId: "s3", date: "2025-03-08", actionType: "transfert", volumeL: 746, observations: [], temperature: null, tempsMin: null, commentaire: "Transfert weekend + retrait 331 L compost mûr – forte participation citoyenne", createdAt: "2025-03-08T10:00:00"},
  {id: "e85", siteId: "s3", date: "2025-03-08", actionType: "recolte", volumeL: 331, observations: [], temperature: null, tempsMin: null, commentaire: "Récolte 331 L compost mûr", createdAt: "2025-03-08T10:30:00"},
  {id: "e86", siteId: "s13", date: "2025-02-24", actionType: "transfert", volumeL: 664, observations: [], temperature: null, tempsMin: null, commentaire: "3 classes primaires présentes – mélange ok", createdAt: "2025-02-24T10:00:00"},
  {id: "e87", siteId: "s17", date: "2025-02-07", actionType: "manutention", volumeL: null, observations: [], temperature: null, tempsMin: null, commentaire: "Visite avec nouvelle référente – absence de panneaux, cadenas manquant, broyat très bas", createdAt: "2025-02-07T10:00:00"},
  {id: "e88", siteId: "s6", date: "2025-01-29", actionType: "transfert", volumeL: 940, observations: [], temperature: null, tempsMin: null, commentaire: "Avec deux agents techniques", createdAt: "2025-01-29T10:00:00"},
  {id: "e89", siteId: "s4", date: "2025-01-24", actionType: "manutention", volumeL: null, observations: [], temperature: null, tempsMin: 15, commentaire: "15 min", createdAt: "2025-01-24T10:00:00"},
  {id: "e90", siteId: "s7", date: "2024-12-17", actionType: "transfert", volumeL: 940, observations: [], temperature: null, tempsMin: null, commentaire: "Transfert + animation scolaire intégrée", createdAt: "2024-12-17T10:00:00"},
  {id: "e91", siteId: "s5", date: "2024-12-13", actionType: "transfert", volumeL: 940, observations: [], temperature: null, tempsMin: null, commentaire: "Transfert effectué par Jean-Luc Brinet et Sylvain Franck", createdAt: "2024-12-13T10:00:00"},
  {id: "e92", siteId: "s6", date: "2024-12-11", actionType: "manutention", volumeL: null, observations: ["moucherons"], temperature: null, tempsMin: null, commentaire: "Problème de moucherons – intervention corrective", createdAt: "2024-12-11T10:00:00"},
  {id: "e93", siteId: "s2", date: "2024-11-26", actionType: "transfert", volumeL: 883, observations: [], temperature: null, tempsMin: null, commentaire: "Transfert + récolte 359 L compost mûr", createdAt: "2024-11-26T10:00:00"},
  {id: "e94", siteId: "s2", date: "2024-11-26", actionType: "recolte", volumeL: 359, observations: [], temperature: null, tempsMin: null, commentaire: "Récolte 359 L compost mûr", createdAt: "2024-11-26T10:30:00"},
  {id: "e95", siteId: "s1", date: "2024-11-18", actionType: "manutention", volumeL: null, observations: [], temperature: null, tempsMin: null, commentaire: "Aide à remonter le composteur. Jean-Luc présent. 23 foyers inscrits.", createdAt: "2024-11-18T10:00:00"},
  {id: "e96", siteId: "s6", date: "2024-11-18", actionType: "manutention", volumeL: null, observations: [], temperature: null, tempsMin: null, commentaire: "En présence de Thierry", createdAt: "2024-11-18T10:00:00"},
  {id: "e97", siteId: "s21", date: "2024-11-07", actionType: "visite", volumeL: null, observations: [], temperature: null, tempsMin: null, commentaire: "Inauguration officielle", createdAt: "2024-11-07T10:00:00"},
  {id: "e98", siteId: "s17", date: "2024-10-19", actionType: "visite", volumeL: null, observations: [], temperature: null, tempsMin: null, commentaire: "Inauguration officielle", createdAt: "2024-10-19T10:00:00"},
  {id: "e99", siteId: "s10", date: "2024-10-18", actionType: "manutention", volumeL: null, observations: [], temperature: null, tempsMin: null, commentaire: "Tout va pour le mieux – 2ème référent absent", createdAt: "2024-10-18T10:00:00"},
  {id: "e100", siteId: "s3", date: "2024-10-16", actionType: "manutention", volumeL: null, observations: [], temperature: null, tempsMin: null, commentaire: "Reprise du relais par Bio Tri Foule – continuité assurée", createdAt: "2024-10-16T10:00:00"},
  {id: "e101", siteId: "s10", date: "2024-09-28", actionType: "visite", volumeL: null, observations: [], temperature: null, tempsMin: null, commentaire: "Inauguration officielle", createdAt: "2024-09-28T10:00:00"},
  {id: "e102", siteId: "s1", date: "2024-09-27", actionType: "manutention", volumeL: null, observations: ["trop_sec"], temperature: null, tempsMin: 45, commentaire: "RDV avec Patrick Rovira et Jean-Luc Esnault. Bacs en cours de réparation (tiges plastique → métal par Patrick). Dalles béton installées. Compostage excellent, biodiversité riche, peu d'indésirables. Compost mature légèrement sec.", createdAt: "2024-09-27T10:00:00"},
  {id: "e103", siteId: "s8", date: "2024-09-27", actionType: "manutention", volumeL: null, observations: [], temperature: null, tempsMin: null, commentaire: "Rapport ok", createdAt: "2024-09-27T10:00:00"},
  {id: "e104", siteId: "s1", date: "2024-09-25", actionType: "manutention", volumeL: null, observations: [], temperature: null, tempsMin: null, commentaire: "Composteur percuté par une voiture – signalement à Nupur (SMIEEOM)", createdAt: "2024-09-25T10:00:00"},
  {id: "e105", siteId: "s13", date: "2024-09-24", actionType: "manutention", volumeL: null, observations: [], temperature: null, tempsMin: null, commentaire: "Contrôle de fonctionnement", createdAt: "2024-09-24T10:00:00"},
  {id: "e106", siteId: "s2", date: "2024-09-23", actionType: "manutention", volumeL: null, observations: [], temperature: null, tempsMin: null, commentaire: "Prise en main du site par Bio Tri Foule", createdAt: "2024-09-23T10:00:00"},
  {id: "e107", siteId: "s5", date: "2024-09-23", actionType: "manutention", volumeL: null, observations: [], temperature: null, tempsMin: null, commentaire: "Suivi de fonctionnement", createdAt: "2024-09-23T10:00:00"},
  {id: "e108", siteId: "s6", date: "2024-09-23", actionType: "visite", volumeL: null, observations: [], temperature: null, tempsMin: null, commentaire: "Inauguration officielle", createdAt: "2024-09-23T10:00:00"},
  {id: "e109", siteId: "s12", date: "2024-09-23", actionType: "manutention", volumeL: null, observations: [], temperature: null, tempsMin: null, commentaire: "Contrôle de fonctionnement", createdAt: "2024-09-23T10:00:00"},
  {id: "e110", siteId: "s8", date: "2024-09-13", actionType: "visite", volumeL: null, observations: [], temperature: null, tempsMin: null, commentaire: "Cadenas", createdAt: "2024-09-13T10:00:00"},
  {id: "e_ange_1", siteId: "s18", date: "2024-09-13", actionType: "visite", volumeL: null, observations: [], temperature: null, tempsMin: null, commentaire: "Inauguration officielle", createdAt: "2024-09-13T10:00:00"},
  {id: "e112", siteId: "s4", date: "2024-08-28", actionType: "visite", volumeL: null, observations: [], temperature: null, tempsMin: null, commentaire: "1h30", createdAt: "2024-08-28T10:00:00"},
  {id: "e113", siteId: "s1", date: "2024-08-27", actionType: "manutention", volumeL: null, observations: [], temperature: null, tempsMin: null, commentaire: "Visite de suivi Véricompost", createdAt: "2024-08-27T10:00:00"},
  {id: "e114", siteId: "s7", date: "2024-07-23", actionType: "manutention", volumeL: null, observations: ["odeur"], temperature: null, tempsMin: null, commentaire: "Présence d'odeur due à l'ancien apport", createdAt: "2024-07-23T10:00:00"},
  {id: "e115", siteId: "s12", date: "2024-07-13", actionType: "visite", volumeL: null, observations: [], temperature: null, tempsMin: null, commentaire: "Inauguration officielle", createdAt: "2024-07-13T10:00:00"},
  {id: "e116", siteId: "s13", date: "2024-07-10", actionType: "visite", volumeL: null, observations: [], temperature: null, tempsMin: null, commentaire: "Une 20aine de personnes – 2h30", createdAt: "2024-07-10T10:00:00"},
  {id: "e117", siteId: "s5", date: "2024-07-06", actionType: "visite", volumeL: null, observations: [], temperature: null, tempsMin: null, commentaire: "Inauguration officielle", createdAt: "2024-07-06T10:00:00"},
  {id: "e118", siteId: "s7", date: "2024-07-06", actionType: "visite", volumeL: null, observations: [], temperature: null, tempsMin: null, commentaire: "Inauguration officielle", createdAt: "2024-07-06T10:00:00"},
  {id: "e119", siteId: "s8", date: "2024-07-05", actionType: "visite", volumeL: null, observations: [], temperature: null, tempsMin: null, commentaire: "Inauguration officielle", createdAt: "2024-07-05T10:00:00"},
  {id: "e120", siteId: "s9", date: "2024-06-28", actionType: "visite", volumeL: null, observations: [], temperature: null, tempsMin: null, commentaire: "Inauguration officielle", createdAt: "2024-06-28T10:00:00"},
  {id: "e121", siteId: "s1", date: "2024-03-22", actionType: "transfert", volumeL: 700, observations: [], temperature: null, tempsMin: null, commentaire: "Transfert 700 L + retrait 581 L compost mûr", createdAt: "2024-03-22T10:00:00"},
  {id: "e122", siteId: "s1", date: "2024-03-22", actionType: "recolte", volumeL: 581, observations: [], temperature: null, tempsMin: null, commentaire: "Récolte 581 L compost mûr", createdAt: "2024-03-22T10:30:00"},
  {id: "e123", siteId: "s2", date: "2023-11-10", actionType: "transfert", volumeL: 600, observations: [], temperature: null, tempsMin: null, commentaire: "Accompagnement initial Cycloposteurs – hors période Bio Tri Foule", createdAt: "2023-11-10T10:00:00"},
  {id: "e124", siteId: "s3", date: "2023-09-21", actionType: "transfert", volumeL: 550, observations: [], temperature: null, tempsMin: null, commentaire: "Premier transfert participatif + retrait 474 L compost mûr initial", createdAt: "2023-09-21T10:00:00"},
  {id: "e125", siteId: "s3", date: "2023-09-21", actionType: "recolte", volumeL: 474, observations: [], temperature: null, tempsMin: null, commentaire: "Récolte 474 L compost mûr", createdAt: "2023-09-21T10:30:00"},
  {id: "e126", siteId: "s1", date: "2023-03-28", actionType: "visite", volumeL: null, observations: [], temperature: null, tempsMin: null, commentaire: "Inauguration du site par les Cycloposteurs", createdAt: "2023-03-28T10:00:00"},
  {id: "e127", siteId: "s3", date: "2023-02-06", actionType: "visite", volumeL: null, observations: [], temperature: null, tempsMin: null, commentaire: "Inauguration officielle par les Cycloposteurs Orléans", createdAt: "2023-02-06T10:00:00"},
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtDate = (d) => new Date(d + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
const todayStr = () => new Date().toISOString().split("T")[0];
const getAction = (id) => ACTION_TYPES.find(a => a.id === id) || ACTION_TYPES[0];
const getKgDetournes = (entries) => entries.filter(e => e.actionType === "transfert").reduce((s, e) => s + (Number(e.volumeL) || 0) * KG_PER_LITRE, 0);
const getLValorises = (entries) => entries.filter(e => e.actionType === "recolte").reduce((s, e) => s + (Number(e.volumeL) || 0), 0);
const getTempsTotal = (entries) => entries.reduce((s, e) => s + (Number(e.tempsMin) || 0), 0);
const thisMonth = (entries) => { const n = new Date(); return entries.filter(e => { const d = new Date(e.date + "T12:00:00"); return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear(); }); };
const siteColor = (idx) => ["#2D5A27", "#7A4F2D", "#2D4F7A", "#6B3D7A", "#2D7A6B", "#7A5C2D"][idx % 6];
const daysSince = (entries) => { if (!entries.length) return null; const last = [...entries].sort((a, b) => b.date.localeCompare(a.date))[0]; return Math.floor((new Date() - new Date(last.date + "T12:00:00")) / 86400000); };

const getStatsByYear = (entries) => {
  const map = {};
  entries.forEach(e => {
    const y = e.date.slice(0, 4);
    if (!map[y]) map[y] = { kg: 0, lVal: 0, count: 0 };
    if (e.actionType === "transfert" && e.volumeL) map[y].kg += Number(e.volumeL) * KG_PER_LITRE;
    if (e.actionType === "recolte" && e.volumeL) map[y].lVal += Number(e.volumeL);
    map[y].count++;
  });
  return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0])).map(([year, s]) => ({ year, ...s }));
};

// ─── Shared UI ────────────────────────────────────────────────────────────────

function GlobalStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,700;1,500&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { background: #F4EBD9; }
      button, input, textarea, select { font-family: 'DM Sans', sans-serif; }
      ::-webkit-scrollbar { width: 6px; }
      ::-webkit-scrollbar-thumb { background: #C4B8A8; border-radius: 3px; }
      .site-card { transition: transform 0.15s, box-shadow 0.15s; cursor: pointer; }
      .site-card:hover { transform: translateY(-3px); box-shadow: 0 10px 28px rgba(0,0,0,0.11) !important; }
      .btn-green { transition: background 0.15s; }
      .btn-green:hover { background: #1F4019 !important; }
      .tap-btn { transition: all 0.12s; }
      .tap-btn:hover { transform: translateY(-1px); }
    `}</style>
  );
}

function Badge({ label, color, bg, small }) {
  return <span style={{ background: bg, color, padding: small ? "3px 9px" : "4px 11px", borderRadius: 20, fontSize: small ? 12 : 12, fontWeight: 600, whiteSpace: "nowrap" }}>{label}</span>;
}

function StatBox({ label, value, unit = "", color = C.green, sub }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "18px 20px", textAlign: "center" }}>
      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color, lineHeight: 1 }}>
        {value}{unit && <span style={{ fontSize: 13, fontWeight: 400, color: C.muted, marginLeft: 4 }}>{unit}</span>}
      </div>
      <div style={{ fontSize: 12, color: C.muted, marginTop: 5 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: C.muted, marginTop: 2, fontStyle: "italic" }}>{sub}</div>}
    </div>
  );
}

function Field({ label, children, hint }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.text, marginBottom: hint ? 4 : 7 }}>{label}</label>
      {hint && <p style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>{hint}</p>}
      {children}
    </div>
  );
}

const inputStyle = { width: "100%", padding: "12px 14px", border: `1.5px solid ${C.border}`, borderRadius: 10, fontSize: 14, background: "#fff", color: C.text, outline: "none" };

// ─── Entry Card ───────────────────────────────────────────────────────────────

function EntryCard({ entry }) {
  const action = getAction(entry.actionType);
  const kg = entry.actionType === "transfert" && entry.volumeL ? (Number(entry.volumeL) * KG_PER_LITRE).toFixed(1) : null;
  const obs = (entry.observations || []).map(id => OBSERVATIONS.find(o => o.id === id)).filter(Boolean);

  return (
    <div style={{ background: C.card, border: `1px solid ${obs.some(o => o.id === "odeur" || o.id === "moucherons") ? "#F0C070" : C.border}`, borderRadius: 16, padding: 20 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 22 }}>{action.icon}</span>
          <div>
            <span style={{ fontWeight: 600, fontSize: 15, color: C.text }}>{action.label}</span>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{fmtDate(entry.date)}</div>
          </div>
        </div>
        <Badge label={action.label} color={action.color} bg={action.bg} small />
      </div>

      {entry.volumeL != null && (
        <div style={{ background: action.bg, borderRadius: 10, padding: "10px 14px", marginBottom: 12, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <span style={{ fontSize: 14, color: action.color, fontWeight: 600 }}>
            {entry.volumeL} L{action.isRecolte && <span style={{ fontWeight: 400, color: C.muted, marginLeft: 6 }}>compost valorisé</span>}
          </span>
          {kg && <span style={{ fontSize: 13, color: "#2D4F7A" }}>→ <strong>{kg} kg</strong> de biodéchets détournés des OMR</span>}
        </div>
      )}

      {obs.length > 0 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
          {obs.map(o => <Badge key={o.id} label={`${o.icon} ${o.label}`} color={o.color} bg={o.bg} small />)}
        </div>
      )}

      {(entry.temperature || entry.tempsMin) && (
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: entry.commentaire ? 10 : 0 }}>
          {entry.temperature && <span style={{ fontSize: 13, color: C.muted }}>🌡️ <strong style={{ color: C.text }}>{entry.temperature}°C</strong></span>}
          {entry.tempsMin && <span style={{ fontSize: 13, color: C.muted }}>⏱️ <strong style={{ color: C.text }}>{entry.tempsMin} min</strong></span>}
        </div>
      )}

      {entry.commentaire && (
        <p style={{ fontSize: 13, color: C.muted, fontStyle: "italic", borderTop: `1px solid ${C.border}`, paddingTop: 10, marginTop: 10 }}>
          "{entry.commentaire}"
        </p>
      )}
    </div>
  );
}

function EntryList({ entries }) {
  if (!entries.length) return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 48, textAlign: "center", color: C.muted }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>🌱</div>
      <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 16 }}>Aucune saisie enregistrée</p>
    </div>
  );
  return <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>{entries.map(e => <EntryCard key={e.id} entry={e} />)}</div>;
}

// ─── Login ────────────────────────────────────────────────────────────────────

function LoginScreen({ code, setCode, onLogin, error, onLegal, onPublic }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(155deg, #E8D8BE 0%, #F4EBD9 55%, #EEE4CF 100%)", padding: 24 }}>
      <div style={{ position: "fixed", top: -120, right: -120, width: 450, height: 450, borderRadius: "50%", background: "rgba(45,90,39,0.05)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: -100, left: -100, width: 350, height: 350, borderRadius: "50%", background: "rgba(122,79,45,0.07)", pointerEvents: "none" }} />
      <div style={{ width: "100%", maxWidth: 420, background: C.card, borderRadius: 24, padding: "48px 40px", border: `1px solid ${C.border}`, boxShadow: "0 8px 48px rgba(44,90,39,0.10)" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <LogoIcon size={80} />
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 30, fontWeight: 700, color: C.text, marginBottom: 8 }}>
            Compost<em>Connect</em>
          </h1>
          <p style={{ color: C.muted, fontSize: 14 }}>Suivi des composteurs partagés</p>
        </div>
        <Field label="Code d'accès">
          <input type="text" value={code} onChange={e => setCode(e.target.value.toUpperCase())} onKeyDown={e => e.key === "Enter" && onLogin()} placeholder="Ex : LILAS, ADMIN…" style={{ ...inputStyle, letterSpacing: "0.12em", fontWeight: 600, fontSize: 16, border: `2px solid ${error ? C.danger : C.border}` }} />
          {error && <p style={{ color: C.danger, fontSize: 13, marginTop: 8 }}>{error}</p>}
        </Field>
        <button className="btn-green" onClick={onLogin} style={{ width: "100%", padding: 15, background: C.green, color: "#fff", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 600, cursor: "pointer" }}>Accéder →</button>
        <p style={{ textAlign: "center", fontSize: 12, color: C.muted, marginTop: 28 }}>Entrez le code de votre site pour accéder à votre espace.</p>
        <p style={{ textAlign: "center", marginTop: 16 }}>
          <button onClick={onLegal} style={{ background: "transparent", border: "none", fontSize: 11, color: C.muted, cursor: "pointer", textDecoration: "underline", fontFamily: "'DM Sans', sans-serif" }}>
            Mentions légales & CGU
          </button>
          <span style={{ color: C.muted, margin: "0 6px" }}>·</span>
          <button onClick={onPublic} style={{ background: "transparent", border: "none", fontSize: 11, color: C.green, cursor: "pointer", textDecoration: "underline", fontFamily: "'DM Sans', sans-serif" }}>
            📊 Statistiques publiques
          </button>
        </p>
      </div>
    </div>
  );
}

// ─── Site Code Changer ───────────────────────────────────────────────────────

function SiteCodeChanger({ siteId, currentCode, onChangeSiteCode }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState('');
  if (!editing) return (
    <button onClick={() => setEditing(true)} style={{ marginLeft: 'auto', background: 'transparent', border: `1px solid #E0D5C5`, color: '#7A8470', padding: '4px 12px', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>
      Modifier
    </button>
  );
  return (
    <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
      <input value={val} onChange={e => setVal(e.target.value.toUpperCase())} placeholder={currentCode} maxLength={10}
        style={{ padding: '5px 10px', border: '1.5px solid #E0D5C5', borderRadius: 7, fontSize: 13, fontFamily: "'DM Sans',sans-serif", letterSpacing: '.08em', fontWeight: 600, width: 110, outline: 'none' }} />
      <button onClick={() => { onChangeSiteCode(siteId, val); setEditing(false); setVal(''); }}
        style={{ background: '#2D5A27', color: '#fff', border: 'none', borderRadius: 7, padding: '5px 12px', cursor: 'pointer', fontSize: 13, fontFamily: "'DM Sans',sans-serif", fontWeight: 600 }}>OK</button>
      <button onClick={() => { setEditing(false); setVal(''); }}
        style={{ background: 'transparent', border: 'none', color: '#7A8470', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>✕</button>
    </div>
  );
}

// ─── Admin Site Detail ────────────────────────────────────────────────────────

// ─── Stats par année ──────────────────────────────────────────────────────────

function StatsParAnnee({ entries }) {
  const rows = getStatsByYear(entries);
  const totKg = getKgDetournes(entries);
  const totL = getLValorises(entries);
  if (!rows.length) return null;

  const colStyle = { padding: "12px 16px", textAlign: "right", fontSize: 14 };
  const headStyle = { ...colStyle, fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em", paddingBottom: 8 };
  const rowStyle = (even) => ({ background: even ? "#F9F5EE" : C.card, borderTop: `1px solid ${C.border}` });

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden", marginBottom: 32 }}>
      <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}` }}>
        <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 600, color: C.text }}>Bilan par année</h3>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ ...headStyle, textAlign: "left" }}>Année</th>
              <th style={headStyle}>♻️ Biodéchets détournés</th>
              <th style={headStyle}>🌾 Compost mûr récolté</th>
              <th style={headStyle}>Interventions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.year} style={rowStyle(i % 2 === 0)}>
                <td style={{ ...colStyle, textAlign: "left", fontWeight: 700, color: C.text, fontFamily: "'Playfair Display', serif", fontSize: 16 }}>{r.year}</td>
                <td style={colStyle}>
                  {r.kg > 0 ? <><strong style={{ color: C.green }}>{r.kg.toFixed(1)} kg</strong></> : <span style={{ color: C.muted }}>—</span>}
                </td>
                <td style={colStyle}>
                  {r.lVal > 0 ? <><strong style={{ color: "#7A6B2D" }}>{r.lVal} L</strong></> : <span style={{ color: C.muted }}>—</span>}
                </td>
                <td style={{ ...colStyle, color: C.muted }}>{r.count}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background: "#EEF5E8", borderTop: `2px solid ${C.green}30` }}>
              <td style={{ ...colStyle, textAlign: "left", fontWeight: 700, color: C.green, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.04em" }}>Total depuis le début</td>
              <td style={colStyle}><strong style={{ color: C.green, fontSize: 16 }}>{totKg.toFixed(1)} kg</strong></td>
              <td style={colStyle}><strong style={{ color: "#7A6B2D", fontSize: 16 }}>{totL} L</strong></td>
              <td style={{ ...colStyle, color: C.muted, fontWeight: 700 }}>{entries.length}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

function AdminSiteDetail({ site, entries, allEntries = [], onBack, onLogout, onAddEntry, onEditSite, onChangeSiteCode }) {
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));
  const monthE = thisMonth(entries);
  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "32px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 32, flexWrap: "wrap" }}>
        <button onClick={onBack} style={{ background: "transparent", border: `1px solid ${C.border}`, color: C.muted, padding: "9px 16px", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>← Retour</button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700, color: C.text }}>{site.name}</h1>
          <p style={{ color: C.muted, fontSize: 13, marginTop: 2 }}>{site.address} · Code : <code style={{ background: C.greenPale, color: C.green, padding: "1px 6px", borderRadius: 4 }}>{site.code}</code></p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => onEditSite(site)} style={{ background: "transparent", border: `1px solid ${C.green}`, color: C.green, padding: "9px 16px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>✏️ Modifier</button>
          <button onClick={onLogout} style={{ background: "transparent", border: `1px solid ${C.border}`, color: C.muted, padding: "9px 16px", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>Déconnexion</button>
        </div>
      </div>
      {/* Site info */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
        {site.typeSite && (() => { const tb = TYPE_BADGES[site.typeSite] || TYPE_BADGES["Extra"]; return <Badge label={site.typeSite} color={tb.color} bg={tb.bg} />; })()}
        {site.foyers > 0 && <Badge label={`${site.foyers} foyers`} color={C.muted} bg="#F0EFEA" />}
        {site.cantine && site.cantine !== "Non concerné" && <Badge label={site.cantine} color="#2D4F7A" bg="#E3EEFA" />}
        {site.periode && <span style={{ fontSize: 12, color: C.muted, alignSelf: "center" }}>📅 {site.periode}</span>}
      </div>

      {/* Site code display */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 13, color: C.muted }}>🔑 Code d'accès référent :</span>
        <code style={{ background: C.greenPale, color: C.green, padding: '3px 10px', borderRadius: 6, fontWeight: 700, fontSize: 15 }}>{site.code}</code>
        <SiteCodeChanger siteId={site.id} currentCode={site.code} onChangeSiteCode={onChangeSiteCode} />
      </div>

      {/* Bilan qualitatif */}
      {(site.pointsForts?.length > 0 || site.pointsAmelioration?.length > 0 || site.conclusion) && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 600, color: C.text, marginBottom: 14 }}>📋 Bilan qualitatif</h3>
          {site.pointsForts?.length > 0 && (
            <div style={{ background: '#ECF5E8', border: '1px solid #C8E6C0', borderRadius: 12, padding: '14px 18px', marginBottom: 10 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#2D5A27', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.05em' }}>✅ Points forts</p>
              {site.pointsForts.map((p, i) => <p key={i} style={{ fontSize: 13, color: '#1C2B19', lineHeight: 1.6, marginBottom: 4 }}>• {p}</p>)}
            </div>
          )}
          {site.pointsAmelioration?.length > 0 && (
            <div style={{ background: '#FEF3E2', border: '1px solid #F5D5A0', borderRadius: 12, padding: '14px 18px', marginBottom: 10 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#8B5E00', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.05em' }}>⚠️ Points d'amélioration</p>
              {site.pointsAmelioration.map((p, i) => <p key={i} style={{ fontSize: 13, color: '#1C2B19', lineHeight: 1.6, marginBottom: 4 }}>• {p}</p>)}
            </div>
          )}
          {site.conclusion && (
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '14px 18px' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: C.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.05em' }}>📝 Conclusion</p>
              <p style={{ fontSize: 13, color: C.text, lineHeight: 1.7 }}>{site.conclusion}</p>
            </div>
          )}
        </div>
      )}

      {/* Referents */}
      {site.referents?.length > 0 && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "16px 20px", marginBottom: 24 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 12 }}>👤 Référents</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
            {site.referents.map((r, i) => (
              <div key={i} style={{ background: C.bg, borderRadius: 10, padding: "10px 14px" }}>
                <p style={{ fontWeight: 600, fontSize: 14, color: C.text }}>{r.nom}</p>
                <p style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{r.role}</p>
                {r.tel && <p style={{ fontSize: 12, color: C.green, marginTop: 4 }}>📞 {r.tel}</p>}
                {r.email && <p style={{ fontSize: 12, color: "#2D4F7A", marginTop: 2 }}>✉️ {r.email}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14, marginBottom: 32 }}>
        <StatBox label="Biodéchets détournés" value={(site.biodechets_kg || 0).toLocaleString("fr-FR")} unit="kg" sub="total officiel" />
        <StatBox label="Détournés ce mois" value={getKgDetournes(monthE).toFixed(1)} unit="kg" color={C.brown} />
        <StatBox label="Compost valorisé" value={(site.compost_L || 0).toLocaleString("fr-FR")} unit="L" color="#7A6B2D" sub="total officiel" />
        <StatBox label="Bacs OMR évités" value={getBacsOMR(site.biodechets_kg || 0)} unit="bacs" color="#5C2D7A" />
      </div>
      <SiteMap sites={[site]} entries={allEntries} highlightSiteId={site.id} height={260} />
      <StatsParAnnee entries={entries} />
      <SiteCharts entries={entries} />
      <button className="btn-green" onClick={onAddEntry} style={{ width: "100%", padding: 14, background: C.green, color: "#fff", border: "none", borderRadius: 14, fontSize: 15, fontWeight: 600, cursor: "pointer", marginBottom: 28 }}>
        ✏️ Ajouter une saisie pour ce site
      </button>
      <EntryList entries={sorted} />
    </div>
  );
}

// ─── Admin Dashboard ──────────────────────────────────────────────────────────

function AdminScreen({ sites, entries, onAddSite, onLogout, onAddEntryForSite, onEditSite, notifications = [], onMarkRead, onMarkAllRead, onOpenSettings, onChangeSiteCode, events = [], onAddEvent, onDeleteEvent, onOpenHelp, territory = null }) {
  const [detail, setDetail] = useState(null);
  if (detail) return <AdminSiteDetail site={detail} entries={entries.filter(e => e.siteId === detail.id)} allEntries={entries} onBack={() => setDetail(null)} onLogout={onLogout} onAddEntry={() => onAddEntryForSite(detail)} onEditSite={onEditSite} onChangeSiteCode={onChangeSiteCode} />;

  const monthE = thisMonth(entries);
  const inactiveSites = sites.filter(s => { const d = daysSince(entries.filter(e => e.siteId === s.id)); return d === null || d > 30; });

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 40, flexWrap: "wrap", gap: 16 }}>
        <div>
          <LogoFull size={44} dark />
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <NotificationBell notifications={notifications} onMarkRead={onMarkRead} onMarkAllRead={onMarkAllRead} />
          <ICalButton events={events} sites={sites} small />
          <AnnualReportButton territory={territory} sites={sites} entries={entries} />
          <ExportButton label="📥 Excel" onClick={() => exportGlobal(sites, entries)} small />
          <button onClick={onOpenHelp} style={{ background: "transparent", border: `1px solid ${C.border}`, color: C.muted, padding: "9px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>❓</button>
          <button onClick={onOpenSettings} style={{ background: "transparent", border: `1px solid ${C.border}`, color: C.muted, padding: "9px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>⚙️</button>
          <button onClick={onLogout} style={{ background: "transparent", border: `1px solid ${C.border}`, color: C.muted, padding: "9px 18px", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>Déconnexion</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 14, marginBottom: 36 }}>
        <StatBox label="Biodéchets détournés" value={(sites.reduce((s2, s) => s2 + (s.biodechets_kg || 0), 0)).toLocaleString("fr-FR")} unit="kg" sub="total officiel Excel" />
        <StatBox label="Détournés ce mois" value={getKgDetournes(monthE).toFixed(1)} unit="kg" color={C.brown} />
        <StatBox label="Compost valorisé" value={(sites.reduce((s2, s) => s2 + (s.compost_L || 0), 0)).toLocaleString("fr-FR")} unit="L" color="#7A6B2D" sub="total officiel Excel" />
        <StatBox label="Sites actifs" value={sites.length} color="#2D4F7A" />
        <StatBox label="Interventions" value={entries.length} color="#5C2D7A" />
      </div>

      {inactiveSites.length > 0 && (
        <div style={{ background: "#FEF3E2", border: "1px solid #EDBC60", borderRadius: 12, padding: "14px 20px", marginBottom: 32, display: "flex", gap: 12, alignItems: "center" }}>
          <span style={{ fontSize: 22 }}>⚠️</span>
          <div>
            <p style={{ fontWeight: 600, color: "#8B5E00", fontSize: 14 }}>Sites sans activité récente (&gt;30 jours)</p>
            <p style={{ fontSize: 13, color: "#A07020", marginTop: 2 }}>{inactiveSites.map(s => s.name).join(", ")}</p>
          </div>
        </div>
      )}

      <EventsSection events={events} sites={sites} isAdmin onAddEvent={onAddEvent} onDeleteEvent={onDeleteEvent} />
      <div style={{ marginBottom: 8 }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 600, color: C.text, marginBottom: 4 }}>Bilan global</h2>
        <p style={{ fontSize: 13, color: C.muted, marginBottom: 16 }}>Tous sites confondus</p>
        <StatsParAnnee entries={entries} />
      </div>
      <SiteMap sites={sites} entries={entries} height={380} />
      <AdminCharts sites={sites} entries={entries} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 600, color: C.text }}>Sites de compostage</h2>
        <button className="btn-green" onClick={onAddSite} style={{ background: C.green, color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", cursor: "pointer", fontSize: 14, fontWeight: 600 }}>+ Nouveau site</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 18, marginBottom: 48 }}>
        {sites.map((site, idx) => {
          const se = entries.filter(e => e.siteId === site.id).sort((a, b) => b.date.localeCompare(a.date));
          const last = se[0];
          const lastAction = last ? getAction(last.actionType) : null;
          const lastObs = last ? (last.observations || []).map(id => OBSERVATIONS.find(o => o.id === id)).filter(Boolean) : [];
          const mkKg = getKgDetournes(thisMonth(se));
          const mLVal = getLValorises(se);
          const inactive = daysSince(se) === null || daysSince(se) > 30;
          const accent = siteColor(idx);
          return (
            <div key={site.id} className="site-card" onClick={() => setDetail(site)} style={{ background: C.card, border: `1px solid ${inactive ? "#EDBC60" : C.border}`, borderRadius: 16, padding: 22, boxShadow: "0 2px 10px rgba(0,0,0,0.04)", borderLeft: `4px solid ${accent}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div>
                  <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 600, color: C.text, marginBottom: 3 }}>{site.name}</h3>
                  <p style={{ fontSize: 12, color: C.muted }}>{site.address}</p>
                </div>
                {inactive && <span style={{ fontSize: 18 }}>⚠️</span>}
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                {(() => { const tb = TYPE_BADGES[site.typeSite] || TYPE_BADGES["Extra"]; return <Badge label={site.typeSite || "?"} color={tb.color} bg={tb.bg} small />; })()}
                {site.foyers > 0 && <Badge label={`${site.foyers} foyers`} color={C.muted} bg="#F0EFEA" small />}
              </div>

              {lastAction && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: lastObs.length ? 10 : 14, background: lastAction.bg, borderRadius: 8, padding: "8px 12px" }}>
                  <span style={{ fontSize: 16 }}>{lastAction.icon}</span>
                  <span style={{ fontSize: 13, color: lastAction.color, fontWeight: 600 }}>{lastAction.label}</span>
                  <span style={{ fontSize: 12, color: C.muted, marginLeft: "auto" }}>{fmtDate(last.date)}</span>
                </div>
              )}
              {!lastAction && <div style={{ fontSize: 13, color: C.muted, marginBottom: 14, fontStyle: "italic" }}>Aucune saisie</div>}

              {lastObs.length > 0 && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
                  {lastObs.map(o => <Badge key={o.id} label={`${o.icon} ${o.label}`} color={o.color} bg={o.bg} small />)}
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: C.green }}>{mkKg.toFixed(1)} <span style={{ fontSize: 11, fontWeight: 400, color: C.muted }}>kg</span></p>
                  <p style={{ fontSize: 11, color: C.muted }}>détournés ce mois</p>
                </div>
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: "#7A6B2D" }}>{mLVal} <span style={{ fontSize: 11, fontWeight: 400, color: C.muted }}>L</span></p>
                  <p style={{ fontSize: 11, color: C.muted }}>valorisés total</p>
                </div>
              </div>
              <p style={{ fontSize: 12, color: C.muted, marginTop: 10 }}>👤 {site.referent} · {se.length} intervention{se.length !== 1 ? "s" : ""}</p>
            </div>
          );
        })}
      </div>

      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 600, color: C.text, marginBottom: 18 }}>Activité récente</h2>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden" }}>
        {[...entries].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 12).map((entry, idx, arr) => {
          const site = sites.find(s => s.id === entry.siteId);
          const siteIdx = sites.findIndex(s => s.id === entry.siteId);
          const action = getAction(entry.actionType);
          const kg = entry.actionType === "transfert" && entry.volumeL ? (Number(entry.volumeL) * KG_PER_LITRE).toFixed(1) : null;
          const obs = (entry.observations || []).map(id => OBSERVATIONS.find(o => o.id === id)).filter(Boolean);
          return (
            <div key={entry.id} style={{ padding: "13px 22px", display: "flex", alignItems: "center", gap: 12, borderBottom: idx < arr.length - 1 ? `1px solid ${C.border}` : "none", flexWrap: "wrap" }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: siteColor(siteIdx), flexShrink: 0 }} />
              <span style={{ fontSize: 16 }}>{action.icon}</span>
              <div style={{ flex: 1, minWidth: 120 }}>
                <span style={{ fontWeight: 600, fontSize: 13, color: C.text }}>{site?.name}</span>
                <span style={{ color: C.muted, fontSize: 13 }}> · {fmtDate(entry.date)}</span>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {obs.map(o => <Badge key={o.id} label={`${o.icon} ${o.label}`} color={o.color} bg={o.bg} small />)}
              </div>
              {kg && <span style={{ fontSize: 12, color: "#2D4F7A", whiteSpace: "nowrap" }}>{kg} kg détournés</span>}
              {entry.actionType === "recolte" && entry.volumeL && <span style={{ fontSize: 12, color: "#7A6B2D", whiteSpace: "nowrap" }}>{entry.volumeL} L valorisés</span>}
            </div>
          );
        })}
        {!entries.length && <div style={{ padding: 32, textAlign: "center", color: C.muted }}>Aucune saisie.</div>}
      </div>
    </div>
  );
}

// ─── Site Screen (Referent) ───────────────────────────────────────────────────

function SiteScreen({ site, entries, onAddEntry, onLogout, onOpenProfile, events = [], sites = [], onOpenHelp, onAddEvent, onDeleteEvent }) {
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));
  const monthE = thisMonth(entries);
  const kgMonth = getKgDetournes(monthE);
  const kgTotal = getKgDetournes(entries);
  const lTotal = getLValorises(entries);
  const last = sorted[0];

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "32px 24px" }}>
      <div style={{ background: C.green, borderRadius: 20, padding: "28px 32px", marginBottom: 28, color: "#fff", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.06)", pointerEvents: "none" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <div>
            <p style={{ fontSize: 13, opacity: 0.75, marginBottom: 6 }}>Votre composteur</p>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700, marginBottom: 6 }}>{site.name}</h1>
            <p style={{ fontSize: 13, opacity: 0.75 }}>📍 {site.address}</p>
            {site.referents?.[0] && <p style={{ fontSize: 13, opacity: 0.75, marginTop: 3 }}>👤 {site.referents[0].nom}{site.referents?.[1] ? ` · ${site.referents[1].nom}` : ''}</p>}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={onOpenProfile} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontSize: 12 }}>👤 Mes infos</button>
            <button onClick={onOpenHelp} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontSize: 12 }}>❓</button>
            <button onClick={onLogout} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontSize: 12 }}>Déconnexion</button>
          </div>
        </div>
        <div style={{ display: "flex", gap: 32, marginTop: 24, flexWrap: "wrap" }}>
          <div>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700 }}>{kgMonth.toFixed(1)}<span style={{ fontSize: 13, fontWeight: 400, marginLeft: 4 }}>kg</span></p>
            <p style={{ fontSize: 12, opacity: 0.7 }}>détournés ce mois</p>
          </div>
          <div>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700 }}>{kgTotal.toFixed(0)}<span style={{ fontSize: 13, fontWeight: 400, marginLeft: 4 }}>kg</span></p>
            <p style={{ fontSize: 12, opacity: 0.7 }}>détournés au total</p>
          </div>
          <div>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700 }}>{lTotal}<span style={{ fontSize: 13, fontWeight: 400, marginLeft: 4 }}>L</span></p>
            <p style={{ fontSize: 12, opacity: 0.7 }}>compost valorisé</p>
          </div>
        </div>
      </div>

      {last && (() => { const a = getAction(last.actionType); return (
        <div style={{ background: a.bg, border: `1px solid ${a.color}30`, borderRadius: 12, padding: "12px 18px", marginBottom: 24, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>{a.icon}</span>
          <div>
            <span style={{ fontSize: 14, fontWeight: 600, color: a.color }}>Dernière action : {a.label}</span>
            <span style={{ fontSize: 13, color: C.muted, marginLeft: 8 }}>{fmtDate(last.date)}</span>
          </div>
        </div>
      ); })()}

      <div style={{ display: 'flex', gap: 10, marginBottom: 28 }}>
        <button className="btn-green" onClick={onAddEntry} style={{ flex: 1, padding: 14, background: C.green, color: "#fff", border: "none", borderRadius: 14, fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
          ✏️ Nouvelle saisie
        </button>
        <ExportButton label="📥 Excel" onClick={() => exportSite(site, entries)} small />
      </div>

      <EventsSection events={events} sites={sites} isAdmin={true} siteId={site.id} onAddEvent={onAddEvent} onDeleteEvent={onDeleteEvent} />

      <SiteMap sites={[site]} entries={entries} highlightSiteId={site.id} height={240} />
      <StatsParAnnee entries={entries} />
      <SiteCharts entries={entries} />

      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 600, color: C.text, marginBottom: 16 }}>Historique</h2>
      <EntryList entries={sorted} />
    </div>
  );
}

// ─── Add Entry Modal ──────────────────────────────────────────────────────────

function AddEntryModal({ siteId, siteName, isAdmin, onSave, onClose }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ siteId, date: todayStr(), actionType: "", volumeL: "", observations: [], temperature: "", tempsMin: "", commentaire: "" });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleObs = (id) => setForm(f => ({
    ...f,
    observations: f.observations.includes(id) ? f.observations.filter(o => o !== id) : [...f.observations, id]
  }));

  const selectedAction = ACTION_TYPES.find(a => a.id === form.actionType);
  const kgPreview = selectedAction?.showKg && form.volumeL ? (Number(form.volumeL) * KG_PER_LITRE).toFixed(1) : null;

  const goNext = () => { if (!form.actionType) { alert("Veuillez choisir un type d'action."); return; } setStep(2); };
  const save = () => onSave({ ...form, volumeL: form.volumeL ? Number(form.volumeL) : null, temperature: form.temperature ? Number(form.temperature) : null, tempsMin: form.tempsMin ? Number(form.tempsMin) : null });

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(20,30,18,0.55)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 100 }}>
      <div style={{ background: C.card, width: "100%", maxWidth: 640, borderRadius: "22px 22px 0 0", padding: "32px 28px", maxHeight: "92vh", overflowY: "auto", boxShadow: "0 -8px 48px rgba(0,0,0,0.18)" }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {step === 2 && <button onClick={() => setStep(1)} style={{ background: "transparent", border: "none", fontSize: 20, cursor: "pointer", color: C.muted }}>←</button>}
            <div>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 21, fontWeight: 700, color: C.text }}>
                {step === 1 ? "Nouvelle saisie" : `${selectedAction?.icon} ${selectedAction?.label}`}
              </h2>
              {siteName && <p style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>📍 {siteName}</p>}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", fontSize: 22, cursor: "pointer", color: C.muted }}>✕</button>
        </div>

        <div style={{ display: "flex", gap: 6, marginBottom: 28 }}>
          {[1, 2].map(s => <div key={s} style={{ height: 3, flex: 1, borderRadius: 2, background: s <= step ? C.green : C.border, transition: "background 0.2s" }} />)}
        </div>

        {/* STEP 1 */}
        {step === 1 && (
          <>
            <Field label="Date de l'intervention">
              <input type="date" value={form.date} max={todayStr()} onChange={e => set("date", e.target.value)} style={inputStyle} />
            </Field>
            <p style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 12 }}>Type d'action</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 28 }}>
              {ACTION_TYPES.map(action => {
                const sel = form.actionType === action.id;
                return (
                  <button key={action.id} className="tap-btn" onClick={() => set("actionType", action.id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 12px", borderRadius: 12, cursor: "pointer", textAlign: "left", background: sel ? action.bg : "transparent", border: `2px solid ${sel ? action.color : C.border}` }}>
                    <span style={{ fontSize: 20 }}>{action.icon}</span>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: sel ? 700 : 500, color: sel ? action.color : C.text, lineHeight: 1.3 }}>{action.label}</p>
                      <p style={{ fontSize: 11, color: C.muted, marginTop: 2, lineHeight: 1.3 }}>{action.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
            <button className="btn-green" onClick={goNext} style={{ width: "100%", padding: 14, background: form.actionType ? C.green : C.border, color: form.actionType ? "#fff" : C.muted, border: "none", borderRadius: 12, cursor: form.actionType ? "pointer" : "default", fontSize: 15, fontWeight: 600 }}>
              Continuer →
            </button>
          </>
        )}

        {/* STEP 2 */}
        {step === 2 && selectedAction && (
          <>
            {selectedAction.hasVolume && (
              <Field label={selectedAction.volumeLabel}>
                <input type="number" min="0" step="1" value={form.volumeL} onChange={e => set("volumeL", e.target.value)} placeholder="Ex : 120" style={{ ...inputStyle, fontSize: 20, fontWeight: 600, textAlign: "center" }} />
                {kgPreview && (
                  <div style={{ background: "#E3EEFA", borderRadius: 10, padding: "12px 16px", marginTop: 12, display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 20 }}>♻️</span>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "#2D4F7A" }}>{kgPreview} kg de biodéchets détournés des OMR</p>
                      <p style={{ fontSize: 12, color: C.muted }}>{form.volumeL} L × {KG_PER_LITRE} = {kgPreview} kg</p>
                    </div>
                  </div>
                )}
                {selectedAction.isRecolte && form.volumeL && (
                  <div style={{ background: "#F5EDD8", borderRadius: 10, padding: "12px 16px", marginTop: 12, display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 20 }}>🌾</span>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "#7A6B2D" }}>{form.volumeL} L de compost valorisé</p>
                  </div>
                )}
              </Field>
            )}

            {/* Observations */}
            <div style={{ marginBottom: 22 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 12 }}>Observations <span style={{ color: C.muted, fontWeight: 400 }}>(optionnel)</span></p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {OBSERVATIONS.map(obs => {
                  const sel = form.observations.includes(obs.id);
                  return (
                    <button key={obs.id} className="tap-btn" onClick={() => toggleObs(obs.id)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 12, cursor: "pointer", border: `2px solid ${sel ? obs.color : C.border}`, background: sel ? obs.bg : "transparent" }}>
                      <span style={{ fontSize: 24 }}>{obs.icon}</span>
                      <span style={{ fontSize: 14, fontWeight: sel ? 700 : 500, color: sel ? obs.color : C.text, flex: 1, textAlign: "left" }}>{obs.label}</span>
                      {sel && <span style={{ fontSize: 16, color: obs.color }}>✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Optionals */}
            <p style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 14 }}>Informations complémentaires <span style={{ color: C.muted, fontWeight: 400 }}>(optionnel)</span></p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
              <Field label="🌡️ Température">
                <div style={{ position: "relative" }}>
                  <input type="number" min="0" max="80" step="1" value={form.temperature} onChange={e => set("temperature", e.target.value)} placeholder="45" style={{ ...inputStyle, paddingRight: 40 }} />
                  <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: C.muted, pointerEvents: "none" }}>°C</span>
                </div>
              </Field>
              <Field label="⏱️ Temps passé">
                <div style={{ position: "relative" }}>
                  <input type="number" min="0" step="5" value={form.tempsMin} onChange={e => set("tempsMin", e.target.value)} placeholder="20" style={{ ...inputStyle, paddingRight: 44 }} />
                  <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: C.muted, pointerEvents: "none" }}>min</span>
                </div>
              </Field>
            </div>

            <Field label="💬 Commentaire">
              <textarea value={form.commentaire} onChange={e => set("commentaire", e.target.value)} placeholder="Observations, état du compost, remarques…" rows={3} style={{ ...inputStyle, resize: "vertical" }} />
            </Field>

            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={onClose} style={{ flex: 1, padding: 14, background: "transparent", border: `2px solid ${C.border}`, borderRadius: 12, cursor: "pointer", fontSize: 15, color: C.muted }}>Annuler</button>
              <button className="btn-green" onClick={save} style={{ flex: 2, padding: 14, background: C.green, color: "#fff", border: "none", borderRadius: 12, cursor: "pointer", fontSize: 15, fontWeight: 600 }}>Enregistrer</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Add Site Modal ───────────────────────────────────────────────────────────

function AddSiteModal({ sites, onSave, onClose }) {
  const [form, setForm] = useState({ name: "", address: "", referentNom: "", code: "", capacityL: 300, typeSite: "Foyers", foyers: 0 });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const save = () => {
    if (!form.name || !form.code || !form.referent) { alert("Veuillez remplir les champs obligatoires (*)."); return; }
    const code = form.code.trim().toUpperCase();
    if (code === ADMIN_CODE || sites.some(s => s.code === code)) { alert("Ce code est déjà utilisé."); return; }
    onSave({ ...form, code, referents: form.referentNom ? [{ role: 'Référent principal', nom: form.referentNom, tel: '', email: '' }] : [] });
  };
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(20,30,18,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 24 }}>
      <div style={{ background: C.card, width: "100%", maxWidth: 480, borderRadius: 20, padding: 32, boxShadow: "0 8px 48px rgba(0,0,0,0.16)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: C.text }}>Nouveau site</h2>
          <button onClick={onClose} style={{ background: "transparent", border: "none", fontSize: 22, cursor: "pointer", color: C.muted }}>✕</button>
        </div>
        <Field label="Nom du site *"><input value={form.name} onChange={e => set("name", e.target.value)} placeholder="Jardin des Lilas" style={inputStyle} /></Field>
        <Field label="Adresse"><input value={form.address} onChange={e => set("address", e.target.value)} placeholder="12 rue des Lilas, Paris" style={inputStyle} /></Field>
        <Field label="Référent(e) principal(e) *"><input value={form.referentNom} onChange={e => set("referentNom", e.target.value)} placeholder="Prénom Nom" style={inputStyle} /></Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Field label="Code d'accès *"><input value={form.code} onChange={e => set("code", e.target.value.toUpperCase())} placeholder="LILAS" maxLength={10} style={{ ...inputStyle, letterSpacing: "0.1em", fontWeight: 600 }} /></Field>
          <Field label="Capacité (litres)"><input type="number" value={form.capacityL} onChange={e => set("capacityL", Number(e.target.value))} min={50} step={50} style={inputStyle} /></Field>
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 13, background: "transparent", border: `2px solid ${C.border}`, borderRadius: 12, cursor: "pointer", fontSize: 14, color: C.muted }}>Annuler</button>
          <button className="btn-green" onClick={save} style={{ flex: 2, padding: 13, background: C.green, color: "#fff", border: "none", borderRadius: 12, cursor: "pointer", fontSize: 14, fontWeight: 600 }}>Créer le site</button>
        </div>
      </div>
    </div>
  );
}

// ─── Error Boundary ──────────────────────────────────────────────────────────

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 32, fontFamily: "'DM Sans', sans-serif", maxWidth: 600, margin: "60px auto" }}>
          <h2 style={{ color: '#BE4B48', marginBottom: 12 }}>⚠️ Erreur d'affichage</h2>
          <p style={{ color: '#4A5A48', marginBottom: 16 }}>Un problème technique est survenu. Message :</p>
          <pre style={{ background: '#F4EBD9', padding: 16, borderRadius: 8, fontSize: 12, whiteSpace: 'pre-wrap', color: '#1C2B19' }}>
            {this.state.error.message}
          </pre>
          <button onClick={() => window.location.reload()} style={{ marginTop: 20, padding: '10px 20px', background: '#2D5A27', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: 14 }}>
            Recharger la page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Main App ─────────────────────────────────────────────────────────────────

const SUPER_ADMIN_CODE = 'SUPERADMIN2026';

export default function App() {
  const [screen, setScreen] = useState("login");
  const [loginCode, setLoginCode] = useState("");
  const [loginError, setLoginError] = useState("");
  const [currentSite, setCurrentSite] = useState(null);
  const [sites, setSites] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEntry, setShowEntry] = useState(false);
  const [showAddSite, setShowAddSite] = useState(false);
  const [adminEntrySite, setAdminEntrySite] = useState(null);
  const [editSite, setEditSite] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [adminSettings, setAdminSettings] = useState({ adminEmail: 'thibault.faverais@perso.be', emailAlerts: true, alertTypes: ['odeur','moucherons','trop_sec','trop_humide'] });
  const [showSettings, setShowSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [adminCode, setAdminCode] = useState('ADMIN');
  const [events, setEvents] = useState([]);
  const [showHelp, setShowHelp] = useState(false);
  const [showLegal, setShowLegal] = useState(false);
  const [showPublic, setShowPublic] = useState(false);
  const [territories, setTerritories] = useState([]);
  const [currentTerritory, setCurrentTerritory] = useState(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  const DATA_VERSION = 'v6';

  useEffect(() => {
    (async () => {
      try {
        const [
          sitesSnap, entriesSnap, notifSnap, settingsSnap,
          codesSnap, eventsSnap, territoriesSnap
        ] = await Promise.all([
          getDocs(collection(db, 'sites')),
          getDocs(collection(db, 'entries')),
          getDocs(collection(db, 'notifications')),
          getDoc(doc(db, 'config', 'admin')),
          getDoc(doc(db, 'config', 'codes')),
          getDocs(collection(db, 'events')),
          getDocs(collection(db, 'territories')),
        ]);

        if (sitesSnap.docs.length === 0) {
          const batch = writeBatch(db);
          DEFAULT_SITES.forEach(s => batch.set(doc(db, 'sites', s.id), s));
          DEMO_ENTRIES.forEach(e => batch.set(doc(db, 'entries', e.id), e));
          await batch.commit();
          setSites(DEFAULT_SITES);
          setEntries(DEMO_ENTRIES);
        } else {
          setSites(sitesSnap.docs.map(d => d.data()).sort((a, b) => a.name.localeCompare(b.name)));
          setEntries(entriesSnap.docs.map(d => d.data()).sort((a, b) => b.date.localeCompare(a.date)));
        }

        const loadedAdminCode = codesSnap.exists() && codesSnap.data().adminCode ? codesSnap.data().adminCode : 'ADMIN';
        setAdminCode(loadedAdminCode);
        setNotifications(notifSnap.docs.map(d => d.data()).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
        if (settingsSnap.exists()) setAdminSettings(settingsSnap.data());
        setEvents(eventsSnap.docs.map(d => d.data()).sort((a, b) => a.date.localeCompare(b.date)));

        if (territoriesSnap.docs.length === 0) {
          const defaultTerritory = {
            id: 'smieeom', name: 'SMIEEOM Val de Cher',
            adminCode: loadedAdminCode,
            adminEmail: settingsSnap.exists() ? (settingsSnap.data().adminEmail || '') : '',
            color: '#2D5A27', description: "Val de Cher — territoire d'origine",
            createdAt: new Date().toISOString(),
          };
          await setDoc(doc(db, 'territories', 'smieeom'), defaultTerritory);
          setTerritories([defaultTerritory]);
        } else {
          setTerritories(territoriesSnap.docs.map(d => d.data()));
        }

      } catch (err) {
        console.error('Firestore error:', err);
        setSites(DEFAULT_SITES);
        setEntries(DEMO_ENTRIES);
      }
      setLoading(false);
    })();
  }, []);

  const handleLogin = () => {
    const c = loginCode.trim().toUpperCase();
    if (!c) return;
    if (c === SUPER_ADMIN_CODE) {
      setIsSuperAdmin(true); setScreen("superadmin"); setLoginError(""); setLoginCode("");
    } else if (c === adminCode) {
      setScreen("admin"); setLoginError(""); setLoginCode("");
    }
    else {
      const site = sites.find(s => s.code === c);
      if (site) { setCurrentSite(site); setScreen("site"); setLoginError(""); setLoginCode(""); }
      else setLoginError("Code invalide. Vérifiez votre code d'accès.");
    }
  };

  const addEntry = async (entryData) => {
    const newEntry = { ...entryData, id: `e${Date.now()}`, createdAt: new Date().toISOString() };
    try {
      await setDoc(doc(db, 'entries', newEntry.id), newEntry);
      setEntries(prev => [newEntry, ...prev]);

      // Create notification + send email if problems reported
      const problemObs = (newEntry.observations || []).filter(o => ['odeur','moucherons','trop_sec','trop_humide'].includes(o));
      if (problemObs.length > 0) {
        const site = sites.find(s => s.id === newEntry.siteId);
        const notif = {
          id: `n${Date.now()}`,
          siteId: newEntry.siteId,
          siteName: site?.name || '?',
          observations: problemObs,
          date: newEntry.date,
          commentaire: newEntry.commentaire || '',
          read: false,
          createdAt: newEntry.createdAt,
        };
        await setDoc(doc(db, 'notifications', notif.id), notif);
        setNotifications(prev => [notif, ...prev]);

        // Send email alert
        const alertTypes = adminSettings.alertTypes || [];
        const shouldEmail = adminSettings.emailAlerts && problemObs.some(o => alertTypes.includes(o));
        if (shouldEmail) {
          try {
            await fetch('/api/send-alert', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                siteName: site?.name || '?',
                siteAddress: site?.address || '',
                referentName: site?.referents?.[0]?.nom || '',
                observations: problemObs,
                date: newEntry.date,
                commentaire: newEntry.commentaire || '',
                adminEmail: adminSettings.adminEmail,
              }),
            });
          } catch (e) { console.error('Email error:', e); }
        }
      }
    } catch (err) { console.error('Save entry error:', err); }
    setShowEntry(false); setAdminEntrySite(null);
  };

  const markRead = async (id) => {
    try {
      await setDoc(doc(db, 'notifications', id), { read: true }, { merge: true });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (e) {}
  };

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.read);
    await Promise.all(unread.map(n => setDoc(doc(db, 'notifications', n.id), { read: true }, { merge: true })));
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const addTerritory = (t) => setTerritories(prev => [...prev, t]);

  const syncData = async () => {
    if (!window.confirm('Synchroniser les 21 sites et 132 entrées depuis les données Excel ? Les données existantes en Firestore seront mises à jour (pas supprimées).')) return;
    try {
      const batch = writeBatch(db);
      DEFAULT_SITES.forEach(s => batch.set(doc(db, 'sites', s.id), s));
      await batch.commit();
      setSites(DEFAULT_SITES);
      // Add missing entries (check by id)
      const existingSnap = await getDocs(collection(db, 'entries'));
      const existingIds = new Set(existingSnap.docs.map(d => d.id));
      const newEntries = DEMO_ENTRIES.filter(e => !existingIds.has(e.id));
      if (newEntries.length > 0) {
        const batch2 = writeBatch(db);
        newEntries.forEach(e => batch2.set(doc(db, 'entries', e.id), e));
        await batch2.commit();
        setEntries(prev => [...prev, ...newEntries].sort((a, b) => b.date.localeCompare(a.date)));
      }
      alert('Synchronisation terminée. ' + DEFAULT_SITES.length + ' sites mis à jour, ' + newEntries.length + ' nouvelles saisies ajoutées. (22 sites, 139 entrées au total)');
    } catch (e) { alert('Erreur sync: ' + e.message); }
  };

  const addEvent = (ev) => setEvents(prev => [...prev, ev].sort((a, b) => a.date.localeCompare(b.date)));

  const deleteEvent = async (evId) => {
    try {
      await deleteDoc(doc(db, 'events', evId));
      setEvents(prev => prev.filter(e => e.id !== evId));
    } catch (e) {}
  };

  const changeSiteCode = async (siteId, newCode) => {
    const code = newCode.trim().toUpperCase();
    if (code.length < 3) { alert('Code trop court (min. 3 caractères)'); return; }
    if (sites.some(s => s.id !== siteId && s.code === code)) { alert('Ce code est déjà utilisé par un autre site.'); return; }
    if (code === adminCode) { alert("Ce code est réservé à l'administrateur."); return; }
    const site = sites.find(s => s.id === siteId);
    if (!site) return;
    const updated = { ...site, code };
    try {
      await setDoc(doc(db, 'sites', siteId), updated);
      setSites(prev => prev.map(s => s.id === siteId ? updated : s));
    } catch (e) { alert('Erreur lors de la modification.'); }
  };

  const handleSiteUpdate = (updated) => {
    setSites(prev => prev.map(s => s.id === updated.id ? updated : s));
    if (currentSite?.id === updated.id) setCurrentSite(updated);
    setShowProfile(false);
  };

  const handleEditSite = (updated) => {
    setSites(prev => prev.map(s => s.id === updated.id ? updated : s));
    setEditSite(null);
  };

  const addSite = async (siteData) => {
    const newSite = { ...siteData, id: `s${Date.now()}` };
    try {
      await setDoc(doc(db, 'sites', newSite.id), newSite);
      setSites(prev => [...prev, newSite]);
    } catch (err) { console.error('Save site error:', err); }
    setShowAddSite(false);
  };

  const logout = () => { setScreen("login"); setCurrentSite(null); };

  if (loading) return (
    <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", background: C.bg, fontFamily: "'DM Sans', sans-serif", color: C.muted }}>
      <div style={{ textAlign: "center" }}><div style={{ fontSize: 40, marginBottom: 12 }}>🌿</div><p>Chargement…</p></div>
    </div>
  );

  return (
    <>
      <GlobalStyles />
      <ErrorBoundary>
      <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'DM Sans', sans-serif", color: C.text }}>
        {screen === "login" && <LoginScreen code={loginCode} setCode={setLoginCode} onLogin={handleLogin} error={loginError} onLegal={() => setShowLegal(true)} onPublic={() => setShowPublic(true)} />}
        {screen === "superadmin" && <SuperAdminView territories={territories} allSites={sites} allEntries={entries} onEnterTerritory={t => { setCurrentTerritory(t); setScreen('admin'); }} onAddTerritory={addTerritory} onLogout={logout} onSyncData={syncData} />}
        {screen === "admin" && <AdminScreen sites={sites} entries={entries} onAddSite={() => setShowAddSite(true)} onLogout={logout} onAddEntryForSite={site => setAdminEntrySite(site)} onEditSite={setEditSite} notifications={notifications} onMarkRead={markRead} onMarkAllRead={markAllRead} onOpenSettings={() => setShowSettings(true)} onChangeSiteCode={changeSiteCode} events={events} onAddEvent={addEvent} onDeleteEvent={deleteEvent} onOpenHelp={() => setShowHelp(true)} territory={currentTerritory} />}
        {screen === "site" && <SiteScreen site={currentSite} entries={entries.filter(e => e.siteId === currentSite.id)} onAddEntry={() => setShowEntry(true)} onLogout={logout} onOpenProfile={() => setShowProfile(true)} events={events} sites={sites} onOpenHelp={() => setShowHelp(true)} onAddEvent={addEvent} onDeleteEvent={deleteEvent} />}
        {showEntry && screen === "site" && <AddEntryModal siteId={currentSite?.id} onSave={addEntry} onClose={() => setShowEntry(false)} />}
        {adminEntrySite && <AddEntryModal siteId={adminEntrySite.id} siteName={adminEntrySite.name} isAdmin onSave={addEntry} onClose={() => setAdminEntrySite(null)} />}
        {showAddSite && <AddSiteModal sites={sites} onSave={addSite} onClose={() => setShowAddSite(false)} />}
        {editSite && <EditSiteModal site={editSite} onSave={handleEditSite} onClose={() => setEditSite(null)} />}
        {showSettings && <AdminSettingsModal onClose={() => setShowSettings(false)} onSettingsLoaded={setAdminSettings} />}
        {showProfile && currentSite && <ReferentProfile site={currentSite} onSave={handleSiteUpdate} onClose={() => setShowProfile(false)} />}
        {showHelp && <HelpGuide isAdmin={screen === 'admin'} onClose={() => setShowHelp(false)} />}
        {showPublic && <PublicDashboard onClose={() => setShowPublic(false)} />}
        {showLegal && <LegalPage onClose={() => setShowLegal(false)} />}
      </div>
      </ErrorBoundary>
    </>
  );
}
