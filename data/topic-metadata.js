// Presentation and reading relationships for registered science topics.
export const topicMetadata = {
  "fluid-mechanics-navier-stokes": {
    "icon": "fluid-flow",
    "signature": "fluid-flow",
    "mood": "physics",
    "prerequisites": [
      "mathematical-analysis",
      "classical-mechanics"
    ],
    "related": [
      "simulation-models",
      "thermodynamics-statistical-mechanics"
    ]
  },
  "classical-mechanics": {
    "icon": "circle-dot",
    "signature": "circle-dot",
    "mood": "physics",
    "prerequisites": [
      "mathematical-foundations"
    ],
    "related": [
      "mathematical-analysis",
      "fluid-mechanics-navier-stokes",
      "relativity-spacetime"
    ]
  },
  "electromagnetism": {
    "icon": "radio-tower",
    "signature": "waves",
    "mood": "waves",
    "prerequisites": [
      "mathematical-analysis"
    ],
    "related": [
      "relativity-spacetime",
      "quantum-field-theory",
      "simulation-models"
    ]
  },
  "thermodynamics-statistical-mechanics": {
    "icon": "flame",
    "signature": "flame",
    "mood": "physics",
    "prerequisites": [
      "probability-statistics",
      "classical-mechanics"
    ],
    "related": [
      "information-theory",
      "chemistry-molecular-structure",
      "biology-life-systems"
    ]
  },
  "mathematical-foundations": {
    "icon": "sigma",
    "signature": "sigma",
    "mood": "physics",
    "prerequisites": [],
    "related": [
      "mathematical-analysis",
      "probability-statistics",
      "programming-algorithms"
    ]
  },
  "quantum-mechanics": {
    "icon": "atom",
    "signature": "orbit",
    "mood": "quantum",
    "prerequisites": [
      "mathematical-foundations",
      "probability-statistics"
    ],
    "related": [
      "quantum-entanglement",
      "quantum-information",
      "quantum-computing",
      "quantum-field-theory"
    ]
  },
  "quantum-entanglement": {
    "icon": "network",
    "signature": "network",
    "mood": "quantum",
    "prerequisites": [
      "quantum-mechanics"
    ],
    "related": [
      "quantum-information",
      "quantum-computing"
    ]
  },
  "quantum-information": {
    "icon": "binary",
    "signature": "binary",
    "mood": "quantum",
    "prerequisites": [
      "quantum-mechanics",
      "information-theory"
    ],
    "related": [
      "quantum-entanglement",
      "quantum-computing"
    ]
  },
  "quantum-computing": {
    "icon": "cpu",
    "signature": "cpu",
    "mood": "quantum",
    "prerequisites": [
      "quantum-mechanics",
      "programming-algorithms"
    ],
    "related": [
      "quantum-information",
      "quantum-complexity"
    ]
  },
  "quantum-complexity": {
    "icon": "workflow",
    "signature": "workflow",
    "mood": "quantum",
    "prerequisites": [
      "quantum-computing",
      "programming-algorithms"
    ],
    "related": [
      "information-theory",
      "philosophy-science"
    ]
  },
  "quantum-field-theory": {
    "icon": "waves",
    "signature": "waves",
    "mood": "quantum",
    "prerequisites": [
      "quantum-mechanics",
      "mathematical-analysis",
      "relativity-spacetime"
    ],
    "related": [
      "electromagnetism",
      "cosmology-early-universe"
    ]
  },
  "chemistry-molecular-structure": {
    "icon": "flask-conical",
    "signature": "flask-conical",
    "mood": "mind",
    "prerequisites": [
      "quantum-mechanics",
      "thermodynamics-statistical-mechanics"
    ],
    "related": [
      "biology-life-systems",
      "simulation-models"
    ]
  },
  "biology-life-systems": {
    "icon": "dna",
    "signature": "dna",
    "mood": "life",
    "prerequisites": [
      "chemistry-molecular-structure",
      "probability-statistics"
    ],
    "related": [
      "neuroscience-consciousness",
      "complex-systems-emergence"
    ]
  },
  "neuroscience-consciousness": {
    "icon": "brain",
    "signature": "brain",
    "mood": "mind",
    "prerequisites": [
      "biology-life-systems",
      "probability-statistics"
    ],
    "related": [
      "artificial-intelligence",
      "philosophy-science"
    ]
  },
  "relativity-spacetime": {
    "icon": "orbit",
    "signature": "orbit",
    "mood": "cosmos",
    "prerequisites": [
      "classical-mechanics",
      "mathematical-analysis"
    ],
    "related": [
      "black-holes",
      "cosmology-early-universe",
      "wormholes"
    ]
  },
  "black-holes": {
    "icon": "circle-dot-dashed",
    "signature": "circle-dot-dashed",
    "mood": "cosmos",
    "prerequisites": [
      "relativity-spacetime"
    ],
    "related": [
      "thermodynamics-statistical-mechanics",
      "quantum-information",
      "cosmology-early-universe"
    ]
  },
  "wormholes": {
    "icon": "scan",
    "signature": "scan",
    "mood": "cosmos",
    "prerequisites": [
      "relativity-spacetime",
      "quantum-field-theory"
    ],
    "related": [
      "black-holes",
      "philosophy-science"
    ]
  },
  "cosmology-early-universe": {
    "icon": "telescope",
    "signature": "telescope",
    "mood": "cosmos",
    "prerequisites": [
      "relativity-spacetime",
      "thermodynamics-statistical-mechanics"
    ],
    "related": [
      "quantum-field-theory",
      "black-holes"
    ]
  },
  "artificial-intelligence": {
    "icon": "bot",
    "signature": "network",
    "mood": "systems",
    "prerequisites": [
      "probability-statistics",
      "programming-algorithms"
    ],
    "related": [
      "information-theory",
      "neuroscience-consciousness",
      "simulation-models"
    ]
  },
  "information-theory": {
    "icon": "binary",
    "signature": "binary",
    "mood": "systems",
    "prerequisites": [
      "probability-statistics"
    ],
    "related": [
      "quantum-information",
      "artificial-intelligence",
      "thermodynamics-statistical-mechanics"
    ]
  },
  "programming-algorithms": {
    "icon": "code-2",
    "signature": "code-2",
    "mood": "systems",
    "prerequisites": [
      "mathematical-foundations"
    ],
    "related": [
      "quantum-computing",
      "artificial-intelligence",
      "simulation-models"
    ]
  },
  "simulation-models": {
    "icon": "boxes",
    "signature": "boxes",
    "mood": "model-lab",
    "prerequisites": [
      "mathematical-analysis",
      "programming-algorithms"
    ],
    "related": [
      "probability-statistics",
      "fluid-mechanics-navier-stokes",
      "model-lab"
    ]
  },
  "complex-systems-emergence": {
    "icon": "network",
    "signature": "network",
    "mood": "systems",
    "prerequisites": [
      "probability-statistics",
      "mathematical-analysis"
    ],
    "related": [
      "biology-life-systems",
      "thermodynamics-statistical-mechanics",
      "simulation-models"
    ]
  },
  "philosophy-science": {
    "icon": "scroll",
    "signature": "scroll",
    "mood": "systems",
    "prerequisites": [],
    "related": [
      "probability-statistics",
      "quantum-mechanics",
      "simulation-models"
    ]
  },
  "model-lab": {
    "icon": "box",
    "signature": "boxes",
    "mood": "model-lab",
    "prerequisites": [],
    "related": [
      "simulation-models",
      "classical-mechanics",
      "quantum-mechanics"
    ]
  },
  "probability-statistics": {
    "icon": "chart-no-axes-combined",
    "signature": "chart-no-axes-combined",
    "mood": "physics",
    "prerequisites": [
      "mathematical-foundations"
    ],
    "related": [
      "mathematical-analysis",
      "information-theory",
      "thermodynamics-statistical-mechanics",
      "quantum-mechanics",
      "artificial-intelligence",
      "biology-life-systems",
      "simulation-models"
    ]
  },
  "mathematical-analysis": {
    "icon": "sigma",
    "signature": "sigma",
    "mood": "physics",
    "prerequisites": [
      "mathematical-foundations"
    ],
    "related": [
      "classical-mechanics",
      "fluid-mechanics-navier-stokes",
      "electromagnetism",
      "quantum-mechanics",
      "quantum-field-theory",
      "relativity-spacetime",
      "simulation-models"
    ]
  }
};
