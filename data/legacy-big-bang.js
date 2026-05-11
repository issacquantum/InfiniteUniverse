const legacyBasePath = "content/legacy/big-bang";

function createLegacyItem(id, enTitle, esTitle, source) {
  return {
    id,
    title: { en: enTitle, es: esTitle },
    source
  };
}

function createEquationDetailItem(id, enTitle, esTitle) {
  return {
    id,
    title: { en: enTitle, es: esTitle },
    contentFile: {
      en: `content/site/en/science/equations/${id}.html`,
      es: `content/site/es/science/equations/${id}.html`
    }
  };
}

const historyItems = [
  createLegacyItem(
    "what-is-the-universe",
    "What Is the Universe?",
    "¿Qué es el universo?",
    {
      type: "custom",
      file: `${legacyBasePath}/from-the-big-bang-to-the-present-universe.html`,
      extractorId: "history-intro"
    }
  ),
  createLegacyItem("the-big-bang", "The Big Bang", "El Big Bang", {
    type: "page",
    file: `${legacyBasePath}/the-big-bang.html`
  }),
  createLegacyItem(
    "early-expansion-of-the-universe",
    "Early Expansion of the Universe",
    "Expansión temprana del universo",
    {
      type: "page",
      file: `${legacyBasePath}/early-expansion-of-the-universe.html`
    }
  ),
  createLegacyItem(
    "formation-of-elementary-particles",
    "Formation of Elementary Particles",
    "Formación de partículas elementales",
    {
      type: "page",
      file: `${legacyBasePath}/formation-of-elementary-particles.html`
    }
  ),
  createLegacyItem(
    "the-dark-ages-of-the-universe",
    "The Dark Ages of the Universe",
    "Las edades oscuras del universo",
    {
      type: "page",
      file: `${legacyBasePath}/the-dark-ages-of-the-universe.html`
    }
  ),
  createLegacyItem("first-stars", "First Stars", "Primeras estrellas", {
    type: "page",
    file: `${legacyBasePath}/first-stars.html`
  }),
  createLegacyItem(
    "formation-of-galaxies",
    "Formation of Galaxies",
    "Formación de galaxias",
    {
      type: "page",
      file: `${legacyBasePath}/formation-of-galaxies.html`
    }
  ),
  createLegacyItem(
    "formation-of-stellar-systems",
    "Formation of Stellar Systems",
    "Formación de sistemas estelares",
    {
      type: "page",
      file: `${legacyBasePath}/formation-of-stellar-systems.html`
    }
  ),
  createLegacyItem("present-universe", "Present Universe", "Universo actual", {
    type: "page",
    file: `${legacyBasePath}/present.universe.html`
  }),
  createLegacyItem("age-of-the-universe", "Age of the Universe", "Edad del universo", {
    type: "page",
    file: `${legacyBasePath}/age-of-the-universe.html`
  }),
  createLegacyItem(
    "the-possible-end-of-the-universe",
    "The Possible End of the Universe",
    "El posible final del universo",
    {
      type: "page",
      file: `${legacyBasePath}/the-possible-end-of-the-universe.html`
    }
  )
];

const contributorItems = [
  createLegacyItem("contributors-introduction", "Introduction", "Introducción", {
    type: "custom",
    file: `${legacyBasePath}/big-bang-contributors.html`,
    extractorId: "contributors-intro"
  }),
  createLegacyItem("albert-einstein", "Albert Einstein", "Albert Einstein", {
    type: "section",
    file: `${legacyBasePath}/big-bang-contributors.html`,
    sectionId: "einstein-bio"
  }),
  createLegacyItem("alexander-friedmann", "Alexander Friedmann", "Alexander Friedmann", {
    type: "section",
    file: `${legacyBasePath}/big-bang-contributors.html`,
    sectionId: "Alex-Friedmann"
  }),
  createLegacyItem("georges-lemaitre", "Georges Lemaître", "Georges Lemaître", {
    type: "section",
    file: `${legacyBasePath}/big-bang-contributors.html`,
    sectionId: "lemaitre-bio"
  }),
  createLegacyItem(
    "alpher-gamow-bethe",
    "Alpher, Gamow, Bethe",
    "Alpher, Gamow, Bethe",
    {
      type: "section",
      file: `${legacyBasePath}/big-bang-contributors.html`,
      sectionId: "gamow-alpher-herman-bio"
    }
  ),
  createLegacyItem("robert-dicke", "Robert Dicke", "Robert Dicke", {
    type: "section",
    file: `${legacyBasePath}/big-bang-contributors.html`,
    sectionId: "dicke-bio"
  }),
  createLegacyItem(
    "arno-penzias-robert-wilson",
    "Arno Penzias & Robert Wilson",
    "Arno Penzias y Robert Wilson",
    {
      type: "section",
      file: `${legacyBasePath}/big-bang-contributors.html`,
      sectionId: "penzias-wilson-bio"
    }
  ),
  createLegacyItem("fred-hoyle", "Fred Hoyle", "Fred Hoyle", {
    type: "section",
    file: `${legacyBasePath}/big-bang-contributors.html`,
    sectionId: "hoyle-bio"
  }),
  createLegacyItem("stephen-hawking", "Stephen Hawking", "Stephen Hawking", {
    type: "section",
    file: `${legacyBasePath}/big-bang-contributors.html`,
    sectionId: "Stephen-Hawking"
  }),
  createLegacyItem("roger-penrose", "Roger Penrose", "Roger Penrose", {
    type: "section",
    file: `${legacyBasePath}/big-bang-contributors.html`,
    sectionId: "Roger-Penrose"
  }),
  createLegacyItem("james-peebles", "James Peebles", "James Peebles", {
    type: "section",
    file: `${legacyBasePath}/big-bang-contributors.html`,
    sectionId: "James-Peebles"
  }),
  createLegacyItem("alan-guth", "Alan Guth", "Alan Guth", {
    type: "section",
    file: `${legacyBasePath}/big-bang-contributors.html`,
    sectionId: "Alan-Guth"
  }),
  createLegacyItem("andrei-linde", "Andrei Linde", "Andrei Linde", {
    type: "section",
    file: `${legacyBasePath}/big-bang-contributors.html`,
    sectionId: "Andrei-Linde"
  }),
  createLegacyItem("john-mather", "John Mather", "John Mather", {
    type: "section",
    file: `${legacyBasePath}/big-bang-contributors.html`,
    sectionId: "John-Mather"
  }),
  createLegacyItem("george-smoot", "George Smoot", "George Smoot", {
    type: "section",
    file: `${legacyBasePath}/big-bang-contributors.html`,
    sectionId: "George-Smoot"
  }),
  createLegacyItem("alexei-starobinsky", "Alexei Starobinsky", "Alexei Starobinsky", {
    type: "section",
    file: `${legacyBasePath}/big-bang-contributors.html`,
    sectionId: "Alexei-Starobinsky"
  }),
  createLegacyItem(
    "viatcheslav-mukhanov",
    "Viatcheslav Mukhanov",
    "Viatcheslav Mukhanov",
    {
      type: "section",
      file: `${legacyBasePath}/big-bang-contributors.html`,
      sectionId: "Viatcheslav-Mukhanov"
    }
  ),
  createLegacyItem("saul-perlmutter", "Saul Perlmutter", "Saul Perlmutter", {
    type: "section",
    file: `${legacyBasePath}/big-bang-contributors.html`,
    sectionId: "Saul-Perlmutter"
  }),
  createLegacyItem("brian-schmidt", "Brian Schmidt", "Brian Schmidt", {
    type: "section",
    file: `${legacyBasePath}/big-bang-contributors.html`,
    sectionId: "Brian-Schmidt"
  }),
  createLegacyItem("adam-riess", "Adam Riess", "Adam Riess", {
    type: "section",
    file: `${legacyBasePath}/big-bang-contributors.html`,
    sectionId: "Adam-Riess"
  }),
  createLegacyItem("wendy-freedman", "Wendy Freedman", "Wendy Freedman", {
    type: "section",
    file: `${legacyBasePath}/big-bang-contributors.html`,
    sectionId: "Wendy-Freedman"
  })
];

const historyEquationItems = [
  createEquationDetailItem("hubbles-law-distance-velocity", "Hubble's Law", "Ley de Hubble"),
  createEquationDetailItem("first-friedmann-equation", "First Friedmann Equation", "Primera ecuación de Friedmann"),
  createEquationDetailItem("hubble-parameter-time", "Time-Dependent Hubble Parameter", "Parámetro de Hubble dependiente del tiempo"),
  createEquationDetailItem("hubble-time", "Hubble Time", "Tiempo de Hubble"),
  createEquationDetailItem("universe-age-integral", "Universe Age Integral", "Integral de la edad del universo"),
  createEquationDetailItem("hubble-parameter-redshift", "Hubble Parameter and Redshift", "Parámetro de Hubble y corrimiento al rojo"),
  createEquationDetailItem("friedmann-acceleration-equation", "Friedmann Acceleration Equation", "Ecuación de aceleración de Friedmann"),
  createEquationDetailItem("mass-energy-equivalence", "Mass-Energy Equivalence", "Equivalencia masa-energía"),
  createEquationDetailItem("electron-positron-pair-production", "Electron-Positron Pair Production", "Producción de pares electrón-positrón"),
  createEquationDetailItem("quark-antiquark-pair-production", "Quark-Antiquark Pair Production", "Producción de pares quark-antiquark"),
  createEquationDetailItem("higgs-vacuum-expectation-value", "Higgs Vacuum Expectation Value", "Valor esperado del vacío del Higgs"),
  createEquationDetailItem("proton-quark-composition", "Proton Quark Composition", "Composición en quarks del protón"),
  createEquationDetailItem("neutron-quark-composition", "Neutron Quark Composition", "Composición en quarks del neutrón"),
  createEquationDetailItem("matter-antimatter-annihilation", "Matter-Antimatter Annihilation", "Aniquilación materia-antimateria"),
  createEquationDetailItem("proton-neutron-nucleosynthesis", "Proton-Neutron Nucleosynthesis", "Nucleosíntesis protón-neutrón"),
  createEquationDetailItem("atom-formation-recombination", "Atomic Recombination", "Recombinación atómica"),
  createEquationDetailItem("molecular-formation", "Molecular Formation", "Formación molecular"),
  createEquationDetailItem("structure-formation-sequence", "Structure Formation", "Formación de estructuras"),
  createEquationDetailItem("proton-proton-chain-reaction", "Proton-Proton Chain Reaction", "Reacción de la cadena protón-protón"),
  createEquationDetailItem("newton-gravitational-force", "Newtonian Gravitational Force", "Fuerza gravitacional newtoniana")
];

const historyEquationMap = {
  "the-big-bang": [
    "hubbles-law-distance-velocity",
    "first-friedmann-equation"
  ],
  "early-expansion-of-the-universe": [
    "hubble-parameter-time"
  ],
  "formation-of-elementary-particles": [
    "mass-energy-equivalence",
    "electron-positron-pair-production",
    "quark-antiquark-pair-production",
    "higgs-vacuum-expectation-value",
    "proton-quark-composition",
    "neutron-quark-composition",
    "matter-antimatter-annihilation",
    "proton-neutron-nucleosynthesis",
    "atom-formation-recombination",
    "molecular-formation",
    "structure-formation-sequence"
  ],
  "present-universe": [
    "first-friedmann-equation"
  ],
  "age-of-the-universe": [
    "hubble-time",
    "universe-age-integral",
    "hubble-parameter-redshift"
  ],
  "the-possible-end-of-the-universe": [
    "friedmann-acceleration-equation"
  ],
  "formation-of-stellar-systems": [
    "proton-proton-chain-reaction",
    "mass-energy-equivalence",
    "newton-gravitational-force"
  ]
};

export const bigBangLegacyContent = {
  branches: [
    {
      id: "history-of-the-universe",
      title: {
        en: "History of the Universe",
        es: "Historia del universo"
      },
      items: historyItems
    },
    {
      id: "minds-behind-the-big-bang",
      title: {
        en: "Minds Behind the Big Bang",
        es: "Mentes detrás del Big Bang"
      },
      items: contributorItems
    },
    {
      id: "history-of-the-universe-equations",
      title: {
        en: "Equations",
        es: "Ecuaciones"
      },
      items: historyEquationItems,
      hidden: true
    }
  ],
  historyEquationMap,
  internalLinkMap: {
    "big-bang-contributors.html": {
      branchId: "minds-behind-the-big-bang",
      itemId: "contributors-introduction"
    },
    "the-big-bang.html": {
      branchId: "history-of-the-universe",
      itemId: "the-big-bang"
    },
    "early-expansion-of-the-universe.html": {
      branchId: "history-of-the-universe",
      itemId: "early-expansion-of-the-universe"
    },
    "formation-of-elementary-particles.html": {
      branchId: "history-of-the-universe",
      itemId: "formation-of-elementary-particles"
    },
    "the-dark-ages-of-the-universe.html": {
      branchId: "history-of-the-universe",
      itemId: "the-dark-ages-of-the-universe"
    },
    "first-stars.html": {
      branchId: "history-of-the-universe",
      itemId: "first-stars"
    },
    "formation-of-galaxies.html": {
      branchId: "history-of-the-universe",
      itemId: "formation-of-galaxies"
    },
    "formation-of-stellar-systems.html": {
      branchId: "history-of-the-universe",
      itemId: "formation-of-stellar-systems"
    },
    "present.universe.html": {
      branchId: "history-of-the-universe",
      itemId: "present-universe"
    },
    "age-of-the-universe.html": {
      branchId: "history-of-the-universe",
      itemId: "age-of-the-universe"
    },
    "the-possible-end-of-the-universe.html": {
      branchId: "history-of-the-universe",
      itemId: "the-possible-end-of-the-universe"
    }
  }
};
