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
  {
    "id": "s1",
    "name": "Seigy",
    "address": "Place de la mairie, 41110 Seigy",
    "code": "SEIGY",
    "foyers": 23,
    "typeSite": "Foyers",
    "cantine": null,
    "periode": "Mars 2023 – Avril 2026",
    "capacityL": 500,
    "lat": 47.2761,
    "lng": 1.4258,
    "referents": [
      {
        "role": "Référent technique",
        "nom": "Patrick ROVIRA",
        "tel": "02 54 75 12 31",
        "email": "mairie@seigy.com"
      },
      {
        "role": "Référent citoyen / élu",
        "nom": "Jean-Luc ESNAULT",
        "tel": "06 43 36 74 25",
        "email": "adjoint3esnault@orange.fr"
      }
    ]
  },
  {
    "id": "s2",
    "name": "Thenay",
    "address": "Salle des fêtes, 41400 Thenay",
    "code": "THENAY",
    "foyers": 10,
    "typeSite": "Foyers",
    "cantine": null,
    "periode": "Nov. 2023 – Avril 2025",
    "capacityL": 400,
    "lat": 47.2028,
    "lng": 1.3628,
    "referents": [
      {
        "role": "Référent technique",
        "nom": "Guilherme GAUTIER",
        "tel": "02 54 32 52 07",
        "email": "mairie.thenay@controis-en-sologne.fr"
      },
      {
        "role": "Référent citoyen",
        "nom": "Danielle PRUD'HOMME",
        "tel": "06 07 62 13 41",
        "email": "gogotnam@wanadoo.fr"
      }
    ]
  },
  {
    "id": "s3",
    "name": "Sassay",
    "address": "Communauté de communes, 41110 Sassay",
    "code": "SASSAY",
    "foyers": 15,
    "typeSite": "Foyers + Cantine",
    "cantine": "80 repas/jour",
    "periode": "Sept. 2023 – Avril 2026",
    "capacityL": 500,
    "lat": 47.3089,
    "lng": 1.4736,
    "referents": [
      {
        "role": "Référent technique & cantinier",
        "nom": "Geoffroy LARCHER",
        "tel": "06 22 18 97 74",
        "email": "sassay2@wanadoo.fr"
      },
      {
        "role": "Référent citoyen & élu",
        "nom": "Gérald GASCHET",
        "tel": "06 62 29 31 06",
        "email": "gerald.gaschet949@orange.fr"
      }
    ]
  },
  {
    "id": "s4",
    "name": "Meusnes",
    "address": "À côté de la salle des fêtes, 41130 Meusnes",
    "code": "MEUSNE",
    "foyers": 14,
    "typeSite": "Foyers + Cantine",
    "cantine": "60 repas/jour",
    "periode": "Sept. 2024 – Juin 2025",
    "capacityL": 400,
    "lat": 47.2194,
    "lng": 1.5028,
    "referents": [
      {
        "role": "Référent technique",
        "nom": "Théo BOISTARD",
        "tel": "06 38 71 69 28",
        "email": "services-techniques@meusnes.fr"
      },
      {
        "role": "Référent citoyen",
        "nom": "Gérard ANIN",
        "tel": "06 07 25 45 29",
        "email": "gerard.anin@orange.fr"
      }
    ]
  },
  {
    "id": "s5",
    "name": "Soings-en-Sologne",
    "address": "Face à la cantine de l'école, 41230 Soings-en-Sologne",
    "code": "SOINGS",
    "foyers": 8,
    "typeSite": "Foyers + Cantine",
    "cantine": "135 repas/jour",
    "periode": "Juil. 2024 – Juin 2025",
    "capacityL": 400,
    "lat": 47.3378,
    "lng": 1.5411,
    "referents": [
      {
        "role": "Référent technique",
        "nom": "Sylvain FRANKE",
        "tel": "06 99 90 01 61",
        "email": "frankesylvain00@gmail.com"
      },
      {
        "role": "Référent citoyen",
        "nom": "Regine BLONDEL",
        "tel": "07 70 08 57 56",
        "email": "regine.blondel60@gmail.com"
      }
    ]
  },
  {
    "id": "s6",
    "name": "Feings",
    "address": "École, 41120 Feings",
    "code": "FEINGS",
    "foyers": 11,
    "typeSite": "Foyers + Cantine",
    "cantine": "60 repas/jour",
    "periode": "Sept. 2024 – Juin 2025",
    "capacityL": 400,
    "lat": 47.2519,
    "lng": 1.3472,
    "referents": [
      {
        "role": "Référent technique",
        "nom": "Thierry BOUCHERON",
        "tel": "06 10 19 61 89",
        "email": "yannickrenardcontrois41@gmail.com"
      }
    ]
  },
  {
    "id": "s7",
    "name": "Couddes",
    "address": "Entrée de l'école, 41700 Couddes",
    "code": "COUDDE",
    "foyers": 20,
    "typeSite": "Foyers",
    "cantine": "Non concerné",
    "periode": "Juil. 2024 – Juin 2025",
    "capacityL": 500,
    "lat": 47.2622,
    "lng": 1.4925,
    "referents": [
      {
        "role": "Référent technique",
        "nom": "Jérôme LAPLAIGE",
        "tel": "06 30 16 54 34",
        "email": "agent.technique@mairiedecouddes.fr"
      }
    ]
  },
  {
    "id": "s8",
    "name": "Montrichard",
    "address": "Rue des Châtaigniers, 41400 Montrichard",
    "code": "MONTRI",
    "foyers": 16,
    "typeSite": "Foyers + Cantine",
    "cantine": "175 repas/jour",
    "periode": "Juil. 2024 – Mars 2026",
    "capacityL": 500,
    "lat": 47.3419,
    "lng": 1.1944,
    "referents": [
      {
        "role": "Référent technique",
        "nom": "Christophe HAUDEBERT",
        "tel": "06 88 50 05 08",
        "email": "espacesverts@montrichardvaldecher.fr"
      },
      {
        "role": "Référent citoyen",
        "nom": "Christophe GUDIN",
        "tel": "06 07 55 65 48",
        "email": "c.gudin@montrichardvaldecher.fr"
      }
    ]
  },
  {
    "id": "s9",
    "name": "Mareuil-sur-Cher",
    "address": "Parking de l'école, 41110 Mareuil-sur-Cher",
    "code": "MAREU",
    "foyers": 12,
    "typeSite": "Foyers",
    "cantine": null,
    "periode": "Juin 2024 – Juin 2025",
    "capacityL": 400,
    "lat": 47.2769,
    "lng": 1.4372,
    "referents": [
      {
        "role": "Référent technique",
        "nom": "Guy MAXENCE",
        "tel": "06 81 42 45 74",
        "email": "mairie@mareuilsurcher.fr"
      },
      {
        "role": "Référent citoyen",
        "nom": "Jean Louis PETRUS",
        "tel": "06 81 83 96 36",
        "email": "mairie@mareuilsurcher.fr"
      }
    ]
  },
  {
    "id": "s10",
    "name": "Choussy",
    "address": "Chemin du Paradis, 41700 Choussy",
    "code": "CHOUSS",
    "foyers": 12,
    "typeSite": "Foyers + Cantine",
    "cantine": null,
    "periode": "Sept. 2024 – Juin 2025",
    "capacityL": 400,
    "lat": 47.2469,
    "lng": 1.4708,
    "referents": [
      {
        "role": "Référent technique",
        "nom": "Philippe MAZEAU",
        "tel": "06 62 32 71 31",
        "email": "mazeau.ph@gmail.com"
      },
      {
        "role": "Référent citoyen",
        "nom": "Denis RIOLAND",
        "tel": "06 70 31 25 01",
        "email": "c.bourdon814@orange.fr"
      }
    ]
  },
  {
    "id": "s11",
    "name": "Fougères-sur-Bièvre",
    "address": "Proximité école, 41120 Fougères-sur-Bièvre",
    "code": "FOUGE",
    "foyers": 0,
    "typeSite": "En cours",
    "cantine": null,
    "periode": "2025 – 2026",
    "capacityL": 400,
    "lat": 47.4108,
    "lng": 1.2819,
    "referents": [
      {
        "role": "Référent (contact terrain)",
        "nom": "Willy",
        "tel": "",
        "email": ""
      }
    ]
  },
  {
    "id": "s12",
    "name": "Pouillé",
    "address": "Derrière la salle polyvalente, 41110 Pouillé",
    "code": "POUILL",
    "foyers": 11,
    "typeSite": "Foyers",
    "cantine": null,
    "periode": "Juil. 2024 – Mars 2026",
    "capacityL": 400,
    "lat": 47.2664,
    "lng": 1.4347,
    "referents": [
      {
        "role": "Référent technique",
        "nom": "Pascal DEVINEAU",
        "tel": "06 66 66 28 82",
        "email": "devineau.pascal@orange.fr"
      },
      {
        "role": "Référent citoyen",
        "nom": "Yann LE POLLOTEC",
        "tel": "06 60 95 25 80",
        "email": "yann.lepollotec@gmail.com"
      }
    ]
  },
  {
    "id": "s13",
    "name": "Selles-sur-Cher",
    "address": "Levée du Parc, 41130 Selles-sur-Cher",
    "code": "SELLES",
    "foyers": 10,
    "typeSite": "Foyers",
    "cantine": null,
    "periode": "Juil. 2024 – Juin 2025",
    "capacityL": 400,
    "lat": 47.2731,
    "lng": 1.5478,
    "referents": [
      {
        "role": "Référent technique",
        "nom": "Frédéric LECLERC",
        "tel": "07 57 49 50 85",
        "email": "dst@selles-sur-cher.fr"
      },
      {
        "role": "Référent citoyen",
        "nom": "Muriel BOISSONNET",
        "tel": "06 76 06 93 25",
        "email": "murielboissonnet@yahoo.fr"
      }
    ]
  },
  {
    "id": "s14",
    "name": "Chémery",
    "address": "Commune de Chémery, 41700",
    "code": "CHEMER",
    "foyers": 0,
    "typeSite": "En cours",
    "cantine": null,
    "periode": "2025 – En cours",
    "capacityL": 400,
    "lat": 47.2989,
    "lng": 1.4797,
    "referents": [
      {
        "role": "Référente (contact terrain)",
        "nom": "Gwen",
        "tel": "",
        "email": ""
      }
    ]
  },
  {
    "id": "s15",
    "name": "Monthou-sur-Cher",
    "address": "Monthou-sur-Cher, 41400",
    "code": "MONTHO",
    "foyers": 0,
    "typeSite": "Extra",
    "cantine": null,
    "periode": "2025 – 2026",
    "capacityL": 400,
    "lat": 47.3511,
    "lng": 1.2219,
    "referents": []
  },
  {
    "id": "s16",
    "name": "Contres",
    "address": "1 rue de la Fossé Mardeaux, 41700 Le Controis-en-Sologne",
    "code": "CONTRE",
    "foyers": 0,
    "typeSite": "Entreprises",
    "cantine": null,
    "periode": "Juin 2025 – Avril 2026",
    "capacityL": 400,
    "lat": 47.4136,
    "lng": 1.4358,
    "referents": [
      {
        "role": "Référente technique",
        "nom": "Laetitia CAUX",
        "tel": "06 07 18 45 48",
        "email": "lcaux@val2c.fr"
      },
      {
        "role": "Référente citoyenne",
        "nom": "Marcelline CHARPENTIER",
        "tel": "06 33 54 73 44",
        "email": "mcharpentier@val2c.fr"
      }
    ]
  },
  {
    "id": "s17",
    "name": "Noyers-sur-Cher",
    "address": "Centre-bourg, 41140 Noyers-sur-Cher",
    "code": "NOYERS",
    "foyers": 10,
    "typeSite": "Foyers",
    "cantine": null,
    "periode": "Oct. 2024 – Juin 2025",
    "capacityL": 400,
    "lat": 47.2706,
    "lng": 1.5878,
    "referents": [
      {
        "role": "Référent technique",
        "nom": "Christophe DEVELLE",
        "tel": "06 78 54 15 40",
        "email": "christophe-develle@bbox.fr"
      },
      {
        "role": "Référente citoyenne",
        "nom": "Mélissa DUHAZE",
        "tel": "07 81 77 65 87",
        "email": "mel-akim2012@hotmail.fr"
      }
    ]
  },
  {
    "id": "s18",
    "name": "Angé",
    "address": "Angé, 41400",
    "code": "ANGE",
    "foyers": 10,
    "typeSite": "Foyers",
    "cantine": null,
    "periode": "Sept. 2024 – 2025",
    "capacityL": 400,
    "lat": 47.3194,
    "lng": 1.2153,
    "referents": []
  },
  {
    "id": "s19",
    "name": "Chissay-en-Touraine",
    "address": "Commune de Chissay-en-Touraine, 41400",
    "code": "CHISSA",
    "foyers": 0,
    "typeSite": "En cours",
    "cantine": null,
    "periode": "2025 – En cours",
    "capacityL": 400,
    "lat": 47.3428,
    "lng": 1.1878,
    "referents": [
      {
        "role": "Référent (contact terrain)",
        "nom": "Christophe",
        "tel": "",
        "email": ""
      }
    ]
  },
  {
    "id": "s20",
    "name": "Ouchamps",
    "address": "Commune d'Ouchamps, 41120",
    "code": "OUCHA",
    "foyers": 0,
    "typeSite": "En cours",
    "cantine": null,
    "periode": "2025 – En cours",
    "capacityL": 400,
    "lat": 47.3947,
    "lng": 1.3194,
    "referents": [
      {
        "role": "Référent (contact terrain)",
        "nom": "Willy",
        "tel": "",
        "email": ""
      }
    ]
  },
  {
    "id": "s21",
    "name": "Thésée",
    "address": "École communale, 41140 Thésée",
    "code": "THESEE",
    "foyers": 10,
    "typeSite": "Foyers + Cantine",
    "cantine": null,
    "periode": "Sept. 2024 – Avril 2026",
    "capacityL": 400,
    "lat": 47.2844,
    "lng": 1.5531,
    "referents": []
  },
  {
    "id": "s22",
    "name": "Saint-Aignan",
    "address": "Saint-Aignan, 41110",
    "code": "STAIG",
    "foyers": 0,
    "typeSite": "En cours",
    "cantine": null,
    "periode": "2025 – 2026",
    "capacityL": 400,
    "referents": [],
    "lat": 47.2667,
    "lng": 1.375
  }
];

const DEMO_ENTRIES = [
  {
    "id": "e1",
    "siteId": "s1",
    "date": "2023-03-28",
    "actionType": "visite",
    "volumeL": null,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "Inauguration du site par les Cycloposteurs",
    "createdAt": "2023-03-28T10:00:00"
  },
  {
    "id": "e2",
    "siteId": "s1",
    "date": "2024-03-22",
    "actionType": "transfert",
    "volumeL": 700,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "Transfert 700 L",
    "createdAt": "2024-03-22T10:00:00"
  },
  {
    "id": "e3",
    "siteId": "s1",
    "date": "2024-03-22",
    "actionType": "recolte",
    "volumeL": 581,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "Retrait 581 L compost mûr",
    "createdAt": "2024-03-22T10:00:00"
  },
  {
    "id": "e4",
    "siteId": "s1",
    "date": "2024-08-27",
    "actionType": "visite",
    "volumeL": null,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "Visite de suivi Véricompost",
    "createdAt": "2024-08-27T10:00:00"
  },
  {
    "id": "e5",
    "siteId": "s1",
    "date": "2024-09-25",
    "actionType": "manutention",
    "volumeL": null,
    "observations": [
      "manutention"
    ],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "Composteur percuté par une voiture – signalement SMIEEOM",
    "createdAt": "2024-09-25T10:00:00"
  },
  {
    "id": "e6",
    "siteId": "s1",
    "date": "2024-09-27",
    "actionType": "visite",
    "volumeL": null,
    "observations": [
      "trop_sec"
    ],
    "temperature": null,
    "tempsMin": 45,
    "commentaire": "RDV Patrick Rovira et Jean-Luc Esnault. Réparation bacs (tiges plastique→métal). Dalles béton installées. Compost excellent, biodiversité riche. Compost mature légèrement sec.",
    "createdAt": "2024-09-27T10:00:00"
  },
  {
    "id": "e7",
    "siteId": "s1",
    "date": "2024-11-18",
    "actionType": "visite",
    "volumeL": null,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "Aide à remonter le composteur. 23 foyers inscrits.",
    "createdAt": "2024-11-18T10:00:00"
  },
  {
    "id": "e8",
    "siteId": "s1",
    "date": "2025-03-14",
    "actionType": "transfert",
    "volumeL": 828,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "Transfert 828 L",
    "createdAt": "2025-03-14T10:00:00"
  },
  {
    "id": "e9",
    "siteId": "s1",
    "date": "2025-03-14",
    "actionType": "recolte",
    "volumeL": 329,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "Retrait 329 L compost mûr",
    "createdAt": "2025-03-14T10:00:00"
  },
  {
    "id": "e10",
    "siteId": "s1",
    "date": "2026-04-09",
    "actionType": "transfert",
    "volumeL": 664,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "Dernier accompagnement SMIEEOM. 4×166 L. Animation 30 min classe CM2. Goûter mairie.",
    "createdAt": "2026-04-09T10:00:00"
  },
  {
    "id": "e11",
    "siteId": "s1",
    "date": "2026-04-09",
    "actionType": "recolte",
    "volumeL": 497,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "Récolte 497 L compost mûr placé en benne",
    "createdAt": "2026-04-09T10:00:00"
  },
  {
    "id": "e12",
    "siteId": "s2",
    "date": "2023-11-10",
    "actionType": "transfert",
    "volumeL": 600,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "Inauguration + transfert Cycloposteurs – hors période Bio Tri Foule",
    "createdAt": "2023-11-10T10:00:00"
  },
  {
    "id": "e13",
    "siteId": "s2",
    "date": "2024-09-23",
    "actionType": "visite",
    "volumeL": null,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "Prise en main du site par Bio Tri Foule",
    "createdAt": "2024-09-23T10:00:00"
  },
  {
    "id": "e14",
    "siteId": "s2",
    "date": "2024-11-26",
    "actionType": "transfert",
    "volumeL": 883,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "Café compost + transfert",
    "createdAt": "2024-11-26T10:00:00"
  },
  {
    "id": "e15",
    "siteId": "s2",
    "date": "2024-11-26",
    "actionType": "recolte",
    "volumeL": 359,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "Récolte 359 L compost mûr",
    "createdAt": "2024-11-26T10:00:00"
  },
  {
    "id": "e16",
    "siteId": "s2",
    "date": "2025-04-05",
    "actionType": "transfert",
    "volumeL": 579,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "Dernière visite – transfert",
    "createdAt": "2025-04-05T10:00:00"
  },
  {
    "id": "e17",
    "siteId": "s2",
    "date": "2025-04-05",
    "actionType": "recolte",
    "volumeL": 331,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "Récolte finale 331 L compost mûr",
    "createdAt": "2025-04-05T10:00:00"
  },
  {
    "id": "e18",
    "siteId": "s3",
    "date": "2023-02-06",
    "actionType": "visite",
    "volumeL": null,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "Inauguration officielle par les Cycloposteurs Orléans",
    "createdAt": "2023-02-06T10:00:00"
  },
  {
    "id": "e19",
    "siteId": "s3",
    "date": "2023-09-21",
    "actionType": "transfert",
    "volumeL": 550,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "Premier transfert participatif",
    "createdAt": "2023-09-21T10:00:00"
  },
  {
    "id": "e20",
    "siteId": "s3",
    "date": "2023-09-21",
    "actionType": "recolte",
    "volumeL": 474,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "Retrait 474 L compost mûr initial",
    "createdAt": "2023-09-21T10:00:00"
  },
  {
    "id": "e21",
    "siteId": "s3",
    "date": "2024-10-16",
    "actionType": "visite",
    "volumeL": null,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "Reprise du relais par Bio Tri Foule – continuité assurée",
    "createdAt": "2024-10-16T10:00:00"
  },
  {
    "id": "e22",
    "siteId": "s3",
    "date": "2025-03-08",
    "actionType": "transfert",
    "volumeL": 746,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "Transfert weekend – forte participation citoyenne",
    "createdAt": "2025-03-08T10:00:00"
  },
  {
    "id": "e23",
    "siteId": "s3",
    "date": "2025-03-08",
    "actionType": "recolte",
    "volumeL": 331,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "Retrait 331 L compost mûr",
    "createdAt": "2025-03-08T10:00:00"
  },
  {
    "id": "e24",
    "siteId": "s3",
    "date": "2026-04-02",
    "actionType": "transfert",
    "volumeL": 747,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "Animation pédagogique toutes classes",
    "createdAt": "2026-04-02T10:00:00"
  },
  {
    "id": "e25",
    "siteId": "s3",
    "date": "2026-04-02",
    "actionType": "recolte",
    "volumeL": 498,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "Retrait 498 L compost mûr final",
    "createdAt": "2026-04-02T10:00:00"
  },
  {
    "id": "e26",
    "siteId": "s4",
    "date": "2024-08-28",
    "actionType": "visite",
    "volumeL": null,
    "observations": [],
    "temperature": null,
    "tempsMin": 90,
    "commentaire": "Inauguration officielle",
    "createdAt": "2024-08-28T10:00:00"
  },
  {
    "id": "e27",
    "siteId": "s4",
    "date": "2025-01-24",
    "actionType": "visite",
    "volumeL": null,
    "observations": [],
    "temperature": null,
    "tempsMin": 15,
    "commentaire": "Visite de suivi",
    "createdAt": "2025-01-24T10:00:00"
  },
  {
    "id": "e28",
    "siteId": "s4",
    "date": "2025-04-01",
    "actionType": "visite",
    "volumeL": null,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "Diagnostic – mail rapport envoyé",
    "createdAt": "2025-04-01T10:00:00"
  },
  {
    "id": "e29",
    "siteId": "s4",
    "date": "2025-04-04",
    "actionType": "visite",
    "volumeL": null,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "RDV avec Théo – discussion sur les difficultés du site",
    "createdAt": "2025-04-04T10:00:00"
  },
  {
    "id": "e30",
    "siteId": "s4",
    "date": "2025-04-07",
    "actionType": "transfert",
    "volumeL": 760,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "Attention – manque de brassage constaté",
    "createdAt": "2025-04-07T10:00:00"
  },
  {
    "id": "e31",
    "siteId": "s4",
    "date": "2025-04-22",
    "actionType": "visite",
    "volumeL": null,
    "observations": [
      "moucherons"
    ],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "Vérification présence moucherons",
    "createdAt": "2025-04-22T10:00:00"
  },
  {
    "id": "e32",
    "siteId": "s4",
    "date": "2025-06-14",
    "actionType": "transfert",
    "volumeL": 1000,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "Transfert + retrait 432 L compost mûr – excellente qualité",
    "createdAt": "2025-06-14T10:00:00"
  },
  {
    "id": "e33",
    "siteId": "s4",
    "date": "2025-06-14",
    "actionType": "recolte",
    "volumeL": 432,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "Récolte 432 L compost mûr – excellente qualité",
    "createdAt": "2025-06-14T10:00:00"
  },
  {
    "id": "e34",
    "siteId": "s5",
    "date": "2024-07-06",
    "actionType": "visite",
    "volumeL": null,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "Inauguration officielle",
    "createdAt": "2024-07-06T10:00:00"
  },
  {
    "id": "e35",
    "siteId": "s5",
    "date": "2024-09-23",
    "actionType": "visite",
    "volumeL": null,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "Suivi de fonctionnement",
    "createdAt": "2024-09-23T10:00:00"
  },
  {
    "id": "e36",
    "siteId": "s5",
    "date": "2024-12-13",
    "actionType": "transfert",
    "volumeL": 940,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "Café compost – transfert effectué par Jean-Luc Brinet et Sylvain Franck",
    "createdAt": "2024-12-13T10:00:00"
  },
  {
    "id": "e37",
    "siteId": "s5",
    "date": "2025-04-09",
    "actionType": "visite",
    "volumeL": null,
    "observations": [],
    "temperature": 25,
    "tempsMin": null,
    "commentaire": "Diagnostic – brassage non fait régulièrement, rappels effectués",
    "createdAt": "2025-04-09T10:00:00"
  },
  {
    "id": "e38",
    "siteId": "s5",
    "date": "2025-06-12",
    "actionType": "transfert",
    "volumeL": 691,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "Dernière visite – transfert",
    "createdAt": "2025-06-12T10:00:00"
  },
  {
    "id": "e39",
    "siteId": "s5",
    "date": "2025-06-12",
    "actionType": "recolte",
    "volumeL": 432,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "Retrait 432 L compost mûr",
    "createdAt": "2025-06-12T10:00:00"
  },
  {
    "id": "e40",
    "siteId": "s6",
    "date": "2024-09-23",
    "actionType": "visite",
    "volumeL": null,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "Inauguration officielle",
    "createdAt": "2024-09-23T10:00:00"
  },
  {
    "id": "e41",
    "siteId": "s6",
    "date": "2024-11-18",
    "actionType": "visite",
    "volumeL": null,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "Visite avec Thierry",
    "createdAt": "2024-11-18T10:00:00"
  },
  {
    "id": "e42",
    "siteId": "s6",
    "date": "2024-12-11",
    "actionType": "manutention",
    "volumeL": null,
    "observations": [
      "moucherons"
    ],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "Problème de moucherons – intervention corrective",
    "createdAt": "2024-12-11T10:00:00"
  },
  {
    "id": "e43",
    "siteId": "s6",
    "date": "2025-01-29",
    "actionType": "transfert",
    "volumeL": 940,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "Café compost – avec deux agents techniques",
    "createdAt": "2025-01-29T10:00:00"
  },
  {
    "id": "e44",
    "siteId": "s6",
    "date": "2025-06-12",
    "actionType": "transfert",
    "volumeL": 650,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "Transfert final",
    "createdAt": "2025-06-12T10:00:00"
  },
  {
    "id": "e45",
    "siteId": "s6",
    "date": "2025-06-12",
    "actionType": "recolte",
    "volumeL": 518,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "Retrait 518 L compost mûr",
    "createdAt": "2025-06-12T10:00:00"
  },
  {
    "id": "e46",
    "siteId": "s7",
    "date": "2024-07-06",
    "actionType": "visite",
    "volumeL": null,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "Inauguration officielle",
    "createdAt": "2024-07-06T10:00:00"
  },
  {
    "id": "e47",
    "siteId": "s7",
    "date": "2024-07-23",
    "actionType": "visite",
    "volumeL": null,
    "observations": [
      "odeur"
    ],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "Présence d'odeur due à l'ancien apport",
    "createdAt": "2024-07-23T10:00:00"
  },
  {
    "id": "e48",
    "siteId": "s7",
    "date": "2024-12-17",
    "actionType": "transfert",
    "volumeL": 940,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "Café compost + animation scolaire intégrée",
    "createdAt": "2024-12-17T10:00:00"
  },
  {
    "id": "e49",
    "siteId": "s7",
    "date": "2025-06-10",
    "actionType": "transfert",
    "volumeL": 576,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "Transfert final",
    "createdAt": "2025-06-10T10:00:00"
  },
  {
    "id": "e50",
    "siteId": "s7",
    "date": "2025-06-10",
    "actionType": "recolte",
    "volumeL": 576,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "Retrait 576 L compost mûr",
    "createdAt": "2025-06-10T10:00:00"
  },
  {
    "id": "e51",
    "siteId": "s7",
    "date": "2026-03-17",
    "actionType": "recolte",
    "volumeL": 334,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "Retrait 334 L compost mûr post-accompagnement",
    "createdAt": "2026-03-17T10:00:00"
  },
  {
    "id": "e52",
    "siteId": "s8",
    "date": "2024-07-05",
    "actionType": "visite",
    "volumeL": null,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "Inauguration officielle",
    "createdAt": "2024-07-05T10:00:00"
  },
  {
    "id": "e53",
    "siteId": "s8",
    "date": "2024-09-13",
    "actionType": "manutention",
    "volumeL": null,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "Changement de cadenas",
    "createdAt": "2024-09-13T10:00:00"
  },
  {
    "id": "e54",
    "siteId": "s8",
    "date": "2024-09-27",
    "actionType": "visite",
    "volumeL": null,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "Rapport OK",
    "createdAt": "2024-09-27T10:00:00"
  },
  {
    "id": "e55",
    "siteId": "s8",
    "date": "2025-04-23",
    "actionType": "visite",
    "volumeL": null,
    "observations": [],
    "temperature": 24,
    "tempsMin": null,
    "commentaire": "Tout se passe bien",
    "createdAt": "2025-04-23T10:00:00"
  },
  {
    "id": "e56",
    "siteId": "s8",
    "date": "2025-06-21",
    "actionType": "transfert",
    "volumeL": 695,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "1er transfert",
    "createdAt": "2025-06-21T10:00:00"
  },
  {
    "id": "e57",
    "siteId": "s8",
    "date": "2026-03-28",
    "actionType": "transfert",
    "volumeL": 665,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "2ème transfert",
    "createdAt": "2026-03-28T10:00:00"
  },
  {
    "id": "e58",
    "siteId": "s8",
    "date": "2026-03-28",
    "actionType": "recolte",
    "volumeL": 581,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "Retrait 581 L compost mûr",
    "createdAt": "2026-03-28T10:00:00"
  },
  {
    "id": "e59",
    "siteId": "s9",
    "date": "2024-06-28",
    "actionType": "visite",
    "volumeL": null,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "Inauguration officielle",
    "createdAt": "2024-06-28T10:00:00"
  },
  {
    "id": "e60",
    "siteId": "s9",
    "date": "2025-04-07",
    "actionType": "transfert",
    "volumeL": 746,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "1er transfert – réalisé seul",
    "createdAt": "2025-04-07T10:00:00"
  },
  {
    "id": "e61",
    "siteId": "s9",
    "date": "2025-06-10",
    "actionType": "transfert",
    "volumeL": 403,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "2ème transfert",
    "createdAt": "2025-06-10T10:00:00"
  },
  {
    "id": "e62",
    "siteId": "s9",
    "date": "2025-06-10",
    "actionType": "recolte",
    "volumeL": 518,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "Retrait 518 L compost mûr",
    "createdAt": "2025-06-10T10:00:00"
  },
  {
    "id": "e63",
    "siteId": "s10",
    "date": "2024-09-28",
    "actionType": "visite",
    "volumeL": null,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "Inauguration officielle",
    "createdAt": "2024-09-28T10:00:00"
  },
  {
    "id": "e64",
    "siteId": "s10",
    "date": "2024-10-18",
    "actionType": "visite",
    "volumeL": null,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "Tout va pour le mieux – 2ème référent absent",
    "createdAt": "2024-10-18T10:00:00"
  },
  {
    "id": "e65",
    "siteId": "s10",
    "date": "2025-04-04",
    "actionType": "transfert",
    "volumeL": 581,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "Café compost – avec une classe",
    "createdAt": "2025-04-04T10:00:00"
  },
  {
    "id": "e66",
    "siteId": "s10",
    "date": "2025-12-12",
    "actionType": "transfert",
    "volumeL": 480,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "2ème transfert",
    "createdAt": "2025-12-12T10:00:00"
  },
  {
    "id": "e67",
    "siteId": "s10",
    "date": "2025-12-12",
    "actionType": "recolte",
    "volumeL": 322,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "Retrait 322 L compost mûr",
    "createdAt": "2025-12-12T10:00:00"
  },
  {
    "id": "e68",
    "siteId": "s11",
    "date": "2025-09-27",
    "actionType": "manutention",
    "volumeL": null,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "Maintenance matériel",
    "createdAt": "2025-09-27T10:00:00"
  },
  {
    "id": "e69",
    "siteId": "s11",
    "date": "2025-11-06",
    "actionType": "visite",
    "volumeL": null,
    "observations": [
      "moucherons",
      "trop_sec"
    ],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "Problème moucherons – sec – compost jeune",
    "createdAt": "2025-11-06T10:00:00"
  },
  {
    "id": "e70",
    "siteId": "s11",
    "date": "2026-02-17",
    "actionType": "manutention",
    "volumeL": null,
    "observations": [
      "trop_humide"
    ],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "Réparation système de fixation – vis oxydées par humidité",
    "createdAt": "2026-02-17T10:00:00"
  },
  {
    "id": "e71",
    "siteId": "s11",
    "date": "2026-03-28",
    "actionType": "transfert",
    "volumeL": 1000,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "Café compost – transfert vers bac de maturation",
    "createdAt": "2026-03-28T10:00:00"
  },
  {
    "id": "e72",
    "siteId": "s12",
    "date": "2024-07-13",
    "actionType": "visite",
    "volumeL": null,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "Inauguration officielle",
    "createdAt": "2024-07-13T10:00:00"
  },
  {
    "id": "e73",
    "siteId": "s12",
    "date": "2024-09-23",
    "actionType": "visite",
    "volumeL": null,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "Contrôle de fonctionnement",
    "createdAt": "2024-09-23T10:00:00"
  },
  {
    "id": "e74",
    "siteId": "s12",
    "date": "2025-03-29",
    "actionType": "transfert",
    "volumeL": 580,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "1er transfert participatif",
    "createdAt": "2025-03-29T10:00:00"
  },
  {
    "id": "e75",
    "siteId": "s12",
    "date": "2026-03-07",
    "actionType": "transfert",
    "volumeL": 383,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "Café compost + transfert",
    "createdAt": "2026-03-07T10:00:00"
  },
  {
    "id": "e76",
    "siteId": "s12",
    "date": "2026-03-07",
    "actionType": "recolte",
    "volumeL": 333,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "Retrait 333 L compost mûr",
    "createdAt": "2026-03-07T10:00:00"
  },
  {
    "id": "e77",
    "siteId": "s13",
    "date": "2024-07-10",
    "actionType": "visite",
    "volumeL": null,
    "observations": [],
    "temperature": null,
    "tempsMin": 150,
    "commentaire": "Inauguration – une vingtaine de personnes",
    "createdAt": "2024-07-10T10:00:00"
  },
  {
    "id": "e78",
    "siteId": "s13",
    "date": "2024-09-24",
    "actionType": "visite",
    "volumeL": null,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "Contrôle de fonctionnement",
    "createdAt": "2024-09-24T10:00:00"
  },
  {
    "id": "e79",
    "siteId": "s13",
    "date": "2025-02-24",
    "actionType": "transfert",
    "volumeL": 664,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "Café compost – 3 classes primaires présentes",
    "createdAt": "2025-02-24T10:00:00"
  },
  {
    "id": "e80",
    "siteId": "s13",
    "date": "2025-06-11",
    "actionType": "transfert",
    "volumeL": 288,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "2ème transfert",
    "createdAt": "2025-06-11T10:00:00"
  },
  {
    "id": "e81",
    "siteId": "s13",
    "date": "2025-06-11",
    "actionType": "recolte",
    "volumeL": 345,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "Retrait 345 L compost mûr",
    "createdAt": "2025-06-11T10:00:00"
  },
  {
    "id": "e82",
    "siteId": "s14",
    "date": "2025-05-27",
    "actionType": "visite",
    "volumeL": null,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "Réunion publique de présentation",
    "createdAt": "2025-05-27T10:00:00"
  },
  {
    "id": "e83",
    "siteId": "s14",
    "date": "2025-06-14",
    "actionType": "visite",
    "volumeL": null,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "Inauguration officielle",
    "createdAt": "2025-06-14T10:00:00"
  },
  {
    "id": "e84",
    "siteId": "s14",
    "date": "2025-12-08",
    "actionType": "brassage",
    "volumeL": null,
    "observations": [],
    "temperature": 50,
    "tempsMin": 10,
    "commentaire": "Température 50°C – bon signe d'activité biologique",
    "createdAt": "2025-12-08T10:00:00"
  },
  {
    "id": "e85",
    "siteId": "s14",
    "date": "2025-12-15",
    "actionType": "transfert",
    "volumeL": 940,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "Café compost + animation 2 classes maternelle",
    "createdAt": "2025-12-15T10:00:00"
  },
  {
    "id": "e86",
    "siteId": "s14",
    "date": "2026-01-05",
    "actionType": "brassage",
    "volumeL": null,
    "observations": [],
    "temperature": null,
    "tempsMin": 10,
    "commentaire": "Brassage et recouvrement de biodéchets non-recouverts",
    "createdAt": "2026-01-05T10:00:00"
  },
  {
    "id": "e87",
    "siteId": "s16",
    "date": "2025-06-16",
    "actionType": "visite",
    "volumeL": null,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "Réunion publique le midi – une vingtaine de personnes",
    "createdAt": "2025-06-16T10:00:00"
  },
  {
    "id": "e88",
    "siteId": "s16",
    "date": "2025-06-26",
    "actionType": "visite",
    "volumeL": null,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "Inauguration avec une trentaine de personnes",
    "createdAt": "2025-06-26T10:00:00"
  },
  {
    "id": "e89",
    "siteId": "s16",
    "date": "2025-09-08",
    "actionType": "visite",
    "volumeL": null,
    "observations": [
      "trop_sec"
    ],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "Visite avec les deux référentes. ~166 L, ~100 kg estimés. Compost trop sec.",
    "createdAt": "2025-09-08T10:00:00"
  },
  {
    "id": "e90",
    "siteId": "s16",
    "date": "2025-09-09",
    "actionType": "remplissage_broyat",
    "volumeL": null,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "Livraison de broyat suite à la visite – excès de structurant corrigé",
    "createdAt": "2025-09-09T10:00:00"
  },
  {
    "id": "e91",
    "siteId": "s16",
    "date": "2025-10-28",
    "actionType": "visite",
    "volumeL": null,
    "observations": [
      "trop_sec"
    ],
    "temperature": 18,
    "tempsMin": null,
    "commentaire": "18°C – compost ne chauffe quasiment pas – faible volume et excès de structurant",
    "createdAt": "2025-10-28T10:00:00"
  },
  {
    "id": "e92",
    "siteId": "s16",
    "date": "2025-12-04",
    "actionType": "transfert",
    "volumeL": 322,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "Café compost participatif sur temps du midi – ~10 participants. Qualité au RDV, volumes modestes.",
    "createdAt": "2025-12-04T10:00:00"
  },
  {
    "id": "e93",
    "siteId": "s16",
    "date": "2026-02-11",
    "actionType": "manutention",
    "volumeL": null,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "Réparation charnières – vis rouillées et lâchées",
    "createdAt": "2026-02-11T10:00:00"
  },
  {
    "id": "e94",
    "siteId": "s16",
    "date": "2026-03-06",
    "actionType": "manutention",
    "volumeL": null,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "Vol du brasseur de compost. Remplacement via Émeraude Création.",
    "createdAt": "2026-03-06T10:00:00"
  },
  {
    "id": "e95",
    "siteId": "s16",
    "date": "2026-04-09",
    "actionType": "transfert",
    "volumeL": 498,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "Dernier accompagnement. 3×166=498 L transférés. ~15 personnes, SMIEEOM présent.",
    "createdAt": "2026-04-09T10:00:00"
  },
  {
    "id": "e96",
    "siteId": "s16",
    "date": "2026-04-09",
    "actionType": "recolte",
    "volumeL": 249,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "249 L compost mûr tamisé finement en terreau à semis (atelier Laetitia)",
    "createdAt": "2026-04-09T10:00:00"
  },
  {
    "id": "e97",
    "siteId": "s17",
    "date": "2024-10-19",
    "actionType": "visite",
    "volumeL": null,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "Inauguration officielle",
    "createdAt": "2024-10-19T10:00:00"
  },
  {
    "id": "e98",
    "siteId": "s17",
    "date": "2025-02-07",
    "actionType": "visite",
    "volumeL": null,
    "observations": [
      "trop_sec"
    ],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "Visite avec nouvelle référente – absence de panneaux, cadenas manquant, broyat très bas",
    "createdAt": "2025-02-07T10:00:00"
  },
  {
    "id": "e99",
    "siteId": "s17",
    "date": "2025-04-04",
    "actionType": "transfert",
    "volumeL": 497,
    "observations": [
      "trop_sec"
    ],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "1er transfert – mélange constaté trop sec",
    "createdAt": "2025-04-04T10:00:00"
  },
  {
    "id": "e100",
    "siteId": "s17",
    "date": "2025-06-12",
    "actionType": "transfert",
    "volumeL": 250,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "2ème transfert",
    "createdAt": "2025-06-12T10:00:00"
  },
  {
    "id": "e101",
    "siteId": "s17",
    "date": "2025-06-12",
    "actionType": "recolte",
    "volumeL": 340,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "Récolte 340 L compost mûr d'excellente qualité",
    "createdAt": "2025-06-12T10:00:00"
  },
  {
    "id": "e102",
    "siteId": "s17",
    "date": "2025-09-04",
    "actionType": "manutention",
    "volumeL": null,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "Remplacement matériel suite à tempête – arbres écrasés",
    "createdAt": "2025-09-04T10:00:00"
  },
  {
    "id": "e103",
    "siteId": "s19",
    "date": "2025-05-27",
    "actionType": "visite",
    "volumeL": null,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "Réunion publique – une trentaine de personnes",
    "createdAt": "2025-05-27T10:00:00"
  },
  {
    "id": "e104",
    "siteId": "s19",
    "date": "2025-06-26",
    "actionType": "visite",
    "volumeL": null,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "Inauguration avec une dizaine de personnes",
    "createdAt": "2025-06-26T10:00:00"
  },
  {
    "id": "e105",
    "siteId": "s19",
    "date": "2025-12-06",
    "actionType": "transfert",
    "volumeL": 581,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "Café compost",
    "createdAt": "2025-12-06T10:00:00"
  },
  {
    "id": "e106",
    "siteId": "s19",
    "date": "2026-02-04",
    "actionType": "visite",
    "volumeL": null,
    "observations": [
      "moucherons"
    ],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "Présence de mouches à drain en grande quantité",
    "createdAt": "2026-02-04T10:00:00"
  },
  {
    "id": "e107",
    "siteId": "s20",
    "date": "2025-06-25",
    "actionType": "visite",
    "volumeL": null,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "Inauguration officielle",
    "createdAt": "2025-06-25T10:00:00"
  },
  {
    "id": "e108",
    "siteId": "s20",
    "date": "2025-09-27",
    "actionType": "manutention",
    "volumeL": null,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "Remplacement du cadenas disparu du bac de maturation",
    "createdAt": "2025-09-27T10:00:00"
  },
  {
    "id": "e109",
    "siteId": "s20",
    "date": "2025-10-08",
    "actionType": "visite",
    "volumeL": null,
    "observations": [],
    "temperature": null,
    "tempsMin": 30,
    "commentaire": "Visite avec Willy",
    "createdAt": "2025-10-08T10:00:00"
  },
  {
    "id": "e110",
    "siteId": "s20",
    "date": "2025-12-19",
    "actionType": "transfert",
    "volumeL": 554,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "Transfert vers bac de maturation",
    "createdAt": "2025-12-19T10:00:00"
  },
  {
    "id": "e111",
    "siteId": "s20",
    "date": "2026-02-17",
    "actionType": "manutention",
    "volumeL": null,
    "observations": [
      "trop_humide"
    ],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "Réparation système de fixation – vis oxydables et humidité",
    "createdAt": "2026-02-17T10:00:00"
  },
  {
    "id": "e112",
    "siteId": "s21",
    "date": "2024-11-07",
    "actionType": "visite",
    "volumeL": null,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "Inauguration officielle",
    "createdAt": "2024-11-07T10:00:00"
  },
  {
    "id": "e113",
    "siteId": "s21",
    "date": "2025-05-02",
    "actionType": "transfert",
    "volumeL": 342,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "1er transfert",
    "createdAt": "2025-05-02T10:00:00"
  },
  {
    "id": "e114",
    "siteId": "s21",
    "date": "2026-04-01",
    "actionType": "transfert",
    "volumeL": 80,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "Transfert final",
    "createdAt": "2026-04-01T10:00:00"
  },
  {
    "id": "e115",
    "siteId": "s21",
    "date": "2026-04-01",
    "actionType": "recolte",
    "volumeL": 130,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "Retrait 130 L compost mûr",
    "createdAt": "2026-04-01T10:00:00"
  },
  {
    "id": "e116",
    "siteId": "s18",
    "date": "2024-09-13",
    "actionType": "visite",
    "volumeL": null,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "Inauguration officielle",
    "createdAt": "2024-09-13T10:00:00"
  },
  {
    "id": "e117",
    "siteId": "s18",
    "date": "2025-04-24",
    "actionType": "visite",
    "volumeL": null,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "2ème visite de suivi",
    "createdAt": "2025-04-24T10:00:00"
  },
  {
    "id": "e118",
    "siteId": "s18",
    "date": "2025-09-27",
    "actionType": "visite",
    "volumeL": null,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "Bilan de site",
    "createdAt": "2025-09-27T10:00:00"
  },
  {
    "id": "e119",
    "siteId": "s18",
    "date": "2025-04-24",
    "actionType": "transfert",
    "volumeL": 695,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "Transfert estimé (452 kg / 0.65)",
    "createdAt": "2025-04-24T10:00:00"
  },
  {
    "id": "e120",
    "siteId": "s18",
    "date": "2025-09-27",
    "actionType": "recolte",
    "volumeL": 166,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "Récolte 166 L compost mûr",
    "createdAt": "2025-09-27T10:00:00"
  },
  {
    "id": "e121",
    "siteId": "s15",
    "date": "2025-06-18",
    "actionType": "visite",
    "volumeL": null,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "Réunion publique",
    "createdAt": "2025-06-18T10:00:00"
  },
  {
    "id": "e122",
    "siteId": "s15",
    "date": "2025-09-11",
    "actionType": "visite",
    "volumeL": null,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "Mise en place et inauguration officielle",
    "createdAt": "2025-09-11T10:00:00"
  },
  {
    "id": "e123",
    "siteId": "s15",
    "date": "2025-10-16",
    "actionType": "visite",
    "volumeL": null,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "1ère visite de suivi",
    "createdAt": "2025-10-16T10:00:00"
  },
  {
    "id": "e124",
    "siteId": "s15",
    "date": "2026-03-31",
    "actionType": "visite",
    "volumeL": null,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "2ème visite de suivi",
    "createdAt": "2026-03-31T10:00:00"
  },
  {
    "id": "e125",
    "siteId": "s15",
    "date": "2026-03-31",
    "actionType": "transfert",
    "volumeL": 955,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "Transfert estimé (621 kg / 0.65)",
    "createdAt": "2026-03-31T10:00:00"
  },
  {
    "id": "e126",
    "siteId": "s22",
    "date": "2025-06-24",
    "actionType": "visite",
    "volumeL": null,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "Réunion publique",
    "createdAt": "2025-06-24T10:00:00"
  },
  {
    "id": "e127",
    "siteId": "s22",
    "date": "2025-09-24",
    "actionType": "visite",
    "volumeL": null,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "Inauguration officielle",
    "createdAt": "2025-09-24T10:00:00"
  },
  {
    "id": "e128",
    "siteId": "s22",
    "date": "2025-10-16",
    "actionType": "visite",
    "volumeL": null,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "1ère visite de suivi",
    "createdAt": "2025-10-16T10:00:00"
  },
  {
    "id": "e129",
    "siteId": "s22",
    "date": "2026-04-01",
    "actionType": "visite",
    "volumeL": null,
    "observations": [],
    "temperature": null,
    "tempsMin": null,
    "commentaire": "2ème visite de suivi",
    "createdAt": "2026-04-01T10:00:00"
  }
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
        <StatBox label="Biodéchets détournés" value={getKgDetournes(entries).toFixed(1)} unit="kg" sub="total cumulé" />
        <StatBox label="Détournés ce mois" value={getKgDetournes(monthE).toFixed(1)} unit="kg" color={C.brown} />
        <StatBox label="Compost valorisé" value={getLValorises(entries)} unit="L" color="#7A6B2D" />
        <StatBox label="Bacs OMR évités" value={getBacsOMR(getKgDetournes(entries))} unit="bacs" color="#5C2D7A" />
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
        <StatBox label="Biodéchets détournés" value={getKgDetournes(entries).toFixed(0)} unit="kg" sub="total cumulé" />
        <StatBox label="Détournés ce mois" value={getKgDetournes(monthE).toFixed(1)} unit="kg" color={C.brown} />
        <StatBox label="Compost valorisé" value={getLValorises(entries)} unit="L" color="#7A6B2D" sub="total récolté" />
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
        {screen === "superadmin" && <SuperAdminView territories={territories} allSites={sites} allEntries={entries} onEnterTerritory={t => { setCurrentTerritory(t); setScreen('admin'); }} onAddTerritory={addTerritory} onLogout={logout} />}
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
