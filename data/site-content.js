import { bigBangLegacyContent } from "./legacy-big-bang.js?v=20260913-social-dock-v1";

function htmlSource(group, id) {
  return {
    en: `content/site/en/${group}/${id}.html`,
    es: `content/site/es/${group}/${id}.html`
  };
}

function createSection(id, enTitle, esTitle, extra = {}) {
  const { contentId = id, ...sectionExtra } = extra;

  return {
    id,
    title: { en: enTitle, es: esTitle },
    contentFile: htmlSource("personal", contentId),
    ...sectionExtra
  };
}

function createStructuredItem(group, id, enTitle, esTitle) {
  return {
    id,
    title: { en: enTitle, es: esTitle },
    contentFile: htmlSource(group, id)
  };
}

function createTopic(id, enTitle, esTitle, extra = {}) {
  const topic = {
    id,
    title: { en: enTitle, es: esTitle },
    ...extra
  };

  if (!extra.branches) {
    topic.contentFile = htmlSource("science", id);
  }

  return topic;
}

const starsChapterBranch = {
  id: "stars-chapters", title: { en: "Chapters", es: "Capítulos" },
  items: [
    createStructuredItem("science", "stellar-foundations", "Foundations and Physical Quantities", "Fundamentos y magnitudes físicas"),
    createStructuredItem("science", "stellar-formation", "From Clouds to Stars", "De las nubes a las estrellas"),
    createStructuredItem("science", "stellar-structure", "Stellar Structure and Hydrostatic Equilibrium", "Estructura estelar y equilibrio hidrostático"),
    createStructuredItem("science", "stellar-observation", "Observing and Classifying Stars", "Observación y clasificación de estrellas"),
    createStructuredItem("science", "stellar-evolution", "Energy, Evolution, and Stellar Endings", "Energía, evolución y destinos estelares"),
    createStructuredItem("science", "stellar-asteroseismology", "Asteroseismology", "Astrosismología"),
    createStructuredItem("science", "stellar-open-questions", "Open Questions and Model Tests", "Preguntas abiertas y pruebas de modelos")
  ]
};
const starsEquationBranch = {
  id: "stars-equations", title: { en: "Equations", es: "Ecuaciones" },
  items: [
    createStructuredItem("science/equations", "stellar-hydrostatic-equilibrium", "Stellar Hydrostatic Equilibrium", "Equilibrio hidrostático estelar"),
    createStructuredItem("science/equations", "stellar-uniform-mass", "Mass in a Uniform-Density Sphere", "Masa en una esfera de densidad uniforme"),
    createStructuredItem("science/equations", "stellar-uniform-gradient", "Pressure Gradient in a Uniform-Density Sphere", "Gradiente de presión en una esfera de densidad uniforme"),
    createStructuredItem("science/equations", "stellar-uniform-pressure", "Pressure Profile in a Uniform-Density Sphere", "Perfil de presión en una esfera de densidad uniforme"),
    createStructuredItem("science/equations", "stellar-mass-continuity", "Enclosed Stellar Mass", "Masa estelar encerrada"),
    createStructuredItem("science/equations", "stellar-ideal-gas-pressure", "Ideal Stellar Gas Pressure", "Presión del gas estelar ideal"),
    createStructuredItem("science/equations", "stellar-radiation-pressure", "Equilibrium Radiation Pressure", "Presión de radiación en equilibrio"),
    createStructuredItem("science/equations", "stellar-energy-conservation", "Energy Balance of a Stellar Mass Shell", "Balance energético de una capa de masa estelar"),
    createStructuredItem("science/equations", "stellar-radiative-gradient", "Radiative Temperature Gradient", "Gradiente radiativo de temperatura"),
    createStructuredItem("science/equations", "stellar-virial-theorem", "Ideal-Gas Stellar Virial Relation", "Relación virial estelar de gas ideal"),
    createStructuredItem("science/equations", "stellar-dynamical-time", "Stellar Dynamical Timescale", "Escala dinámica estelar"),
    createStructuredItem("science/equations", "stellar-kelvin-helmholtz-time", "Kelvin-Helmholtz Timescale", "Escala de Kelvin-Helmholtz"),
    createStructuredItem("science/equations", "stellar-nuclear-time", "Nuclear Fuel Timescale", "Escala del combustible nuclear"),
    createStructuredItem("science/equations", "stellar-tov-equilibrium", "Relativistic Stellar Equilibrium", "Equilibrio estelar relativista"),
    createStructuredItem("science/equations", "stellar-flux-distance", "Luminosity and Observed Flux", "Luminosidad y flujo observado"),
    createStructuredItem("science/equations", "stellar-effective-temperature", "Luminosity, Radius, and Effective Temperature", "Luminosidad, radio y temperatura efectiva"),
    createStructuredItem("science/equations", "stellar-acoustic-separation", "Large Acoustic Frequency Separation", "Gran separación acústica de frecuencias")
  ]
};

const quantumMechanicsEquationBranch = {
  id: "quantum-mechanics-equations",
  title: { en: "Equations", es: "Ecuaciones" },
  items: [
    createStructuredItem("science/equations", "rayleigh-jeans-law", "Rayleigh-Jeans Law", "Ley de Rayleigh-Jeans"),
    createStructuredItem("science/equations", "planck-energy-quantum", "Planck Energy Quantum", "Cuanto de Energía de Planck"),
    createStructuredItem("science/equations", "planck-blackbody-law", "Planck Blackbody Law", "Ley de Cuerpo Negro de Planck"),
    createStructuredItem("science/equations", "photoelectric-equation", "Photoelectric Equation", "Ecuación Fotoeléctrica"),
    createStructuredItem("science/equations", "spectral-transition-equation", "Spectral Transition Equation", "Ecuación de Transición Espectral"),
    createStructuredItem("science/equations", "hydrogen-energy-levels", "Hydrogen Energy Levels", "Niveles de Energía del Hidrógeno"),
    createStructuredItem("science/equations", "time-dependent-schrodinger-equation", "Time-Dependent Schrödinger Equation", "Ecuación de Schrödinger Dependiente del Tiempo"),
    createStructuredItem("science/equations", "heisenberg-uncertainty-principle", "Heisenberg Uncertainty Principle", "Principio de Incertidumbre de Heisenberg"),
    createStructuredItem("science/equations", "time-independent-schrodinger-equation", "Time-Independent Schrödinger Equation", "Ecuación de Schrödinger Independiente del Tiempo"),
    createStructuredItem("science/equations", "explicit-stationary-schrodinger-equation", "Explicit Stationary Schrödinger Equation", "Ecuación Estacionaria Explícita de Schrödinger"),
    createStructuredItem("science/equations", "free-particle-wavefunction", "Free Particle Wavefunction", "Función de Onda de Partícula Libre"),
    createStructuredItem("science/equations", "coulomb-potential", "Coulomb Potential", "Potencial de Coulomb"),
    createStructuredItem("science/equations", "hydrogen-orbital-wavefunction", "Hydrogen Orbital Wavefunction", "Función de Onda Orbital del Hidrógeno"),
    createStructuredItem("science/equations", "quantum-harmonic-oscillator-energy-levels", "Quantum Harmonic Oscillator Energy Levels", "Niveles de Energía del Oscilador Armónico Cuántico"),
    createStructuredItem("science/equations", "observable-variance", "Observable Variance", "Varianza de un Observable"),
    createStructuredItem("science/equations", "zero-point-position-variance", "Zero-Point Position Variance", "Varianza de Posición de Punto Cero"),
    createStructuredItem("science/equations", "vacuum-two-point-correlation", "Vacuum Two-Point Correlation", "Correlación de Dos Puntos del Vacío"),
    createStructuredItem("science/equations", "fluctuation-field-sample", "Fluctuation Field Sample", "Muestra de Campo Fluctuante"),
    createStructuredItem("science/equations", "cutoff-gaussian-field-sample", "Cutoff Gaussian Field Sample", "Muestra de campo gaussiano con corte"),
    createStructuredItem("science/equations", "scalar-mode-dispersion", "Free Scalar-Mode Dispersion", "Dispersión de un modo escalar libre"),
    createStructuredItem("science/equations", "mass-correlation-length-scale", "Mass Parameter and Correlation-Length Scale", "Parámetro de masa y escala de longitud de correlación"),
    createStructuredItem("science/equations", "normalization-condition", "Normalization Condition", "Condición de Normalización"),
    createStructuredItem("science/equations", "probability-current", "Probability Current", "Corriente de Probabilidad"),
    createStructuredItem("science/equations", "continuity-equation", "Continuity Equation", "Ecuación de Continuidad"),
    createStructuredItem("science/equations", "hydrogen-hamiltonian-atomic-units", "Hydrogen Hamiltonian in Atomic Units", "Hamiltoniano del Hidrógeno en Unidades Atómicas"),
    createStructuredItem("science/equations", "psi-320-wavefunction", "Hydrogen 3d₍z²₎ Wavefunction", "Función de Onda 3d₍z²₎ del Hidrógeno"),
    createStructuredItem("science/equations", "psi-320-probability-density", "Hydrogen 3d₍z²₎ Probability Density", "Densidad de Probabilidad 3d₍z²₎ del Hidrógeno"),
    createStructuredItem("science/equations", "monte-carlo-probability-measure", "Monte Carlo Sampling", "Muestreo de Monte Carlo"),
    createStructuredItem("science/equations", "continuous-expectation-integral", "Expectation under a Probability Density", "Esperanza respecto a una densidad de probabilidad"),
    createStructuredItem("science/equations", "monte-carlo-sample-average", "Monte Carlo Sample Average", "Promedio muestral de Monte Carlo"),
    createStructuredItem("science/equations", "sampling-distribution-law", "Sampling Distribution", "Ley de distribución del muestreo"),
    createStructuredItem("science/equations", "hydrogen-orbital-probability-element", "Hydrogen Orbital Probability Element", "Elemento de probabilidad de un orbital de hidrógeno")
  ]
};

const quantumEntanglementEquationBranch = {
  id: "quantum-entanglement-equations",
  title: { en: "Equations", es: "Ecuaciones" },
  items: [
    createStructuredItem("science/equations", "entangled-state-nonseparability", "Entangled State Non-Separability", "No Separabilidad del Estado Entrelazado"),
    createStructuredItem("science/equations", "bell-singlet-state", "Bell Singlet State", "Estado Singlete de Bell"),
    createStructuredItem("science/equations", "reduced-density-matrix", "Reduced Density Matrix", "Matriz de Densidad Reducida"),
    createStructuredItem("science/equations", "local-hidden-variable-factorization", "Local Hidden Variable Factorization", "Factorización Local de Variables Ocultas"),
    createStructuredItem("science/equations", "singlet-quantum-correlation", "Singlet Quantum Correlation", "Correlación Cuántica del Singlete"),
    createStructuredItem("science/equations", "chsh-bell-inequality", "CHSH (Clauser-Horne-Shimony-Holt) Bell Inequality", "Desigualdad de Bell CHSH (Clauser-Horne-Shimony-Holt)")
  ]
};

const quantumInformationEquationBranch = {
  id: "quantum-information-equations",
  title: { en: "Equations", es: "Ecuaciones" },
  items: [
    createStructuredItem("science/equations", "qubit-superposition-state", "Qubit Superposition State", "Estado de Superposición del Qubit"),
    createStructuredItem("science/equations", "qubit-normalization-condition", "Qubit Normalization Condition", "Condición de Normalización del Qubit"),
    createStructuredItem("science/equations", "landauer-principle", "Landauer's Principle", "Principio de Landauer"),
    createStructuredItem("science/equations", "density-matrix-state", "Density Matrix State", "Estado de Matriz de Densidad"),
    createStructuredItem("science/equations", "pure-state-density-operator", "Pure-State Density Operator", "Operador de densidad de un estado puro"),
    createStructuredItem("science/equations", "ensemble-density-operator", "Density Operator of an Ensemble", "Operador de densidad de un ensamble"),
    createStructuredItem("science/equations", "density-operator-trace-normalization", "Trace Normalization of a Density Operator", "Normalización de la traza del operador de densidad"),
    createStructuredItem("science/equations", "von-neumann-entropy", "Von Neumann Entropy", "Entropía de von Neumann"),
    createStructuredItem("science/equations", "shannon-entropy", "Shannon Entropy", "Entropía de Shannon"),
    createStructuredItem("science/equations", "entanglement-entropy", "Entanglement Entropy", "Entropía de Entrelazamiento"),
    createStructuredItem("science/equations", "subsystem-von-neumann-entropy", "Entropy of a Quantum Subsystem", "Entropía de un subsistema cuántico"),
    createStructuredItem("science/equations", "bipartite-partial-trace", "Partial Trace of a Bipartite State", "Traza parcial de un estado bipartito"),
    createStructuredItem("science/equations", "pure-bipartite-entropy-equality", "Equal Subsystem Entropies of a Pure Bipartite State", "Igualdad de entropías locales en un estado bipartito puro"),
    createStructuredItem("science/equations", "quantum-mutual-information", "Quantum Mutual Information", "Información Mutua Cuántica"),
    createStructuredItem("science/equations", "quantum-relative-entropy", "Quantum Relative Entropy", "Entropía Relativa Cuántica"),
    createStructuredItem("science/equations", "strong-subadditivity", "Strong Subadditivity", "Subaditividad Fuerte"),
    createStructuredItem("science/equations", "no-cloning-linearity", "No Cloning and Linearity", "No Clonamiento y Linealidad"),
    createStructuredItem("science/equations", "born-rule-povm-measurement", "Born Rule and POVM (positive operator-valued measure) Measurement", "Regla de Born y Medición POVM (positive operator-valued measure, medida de operador positivo)"),
    createStructuredItem("science/equations", "measurement-effect-operator", "Measurement Effect Operator", "Operador de efecto de una medición"),
    createStructuredItem("science/equations", "povm-completeness", "POVM Completeness", "Completitud de una POVM"),
    createStructuredItem("science/equations", "born-rule-effect-probability", "Born Probability for a Measurement Effect", "Probabilidad de Born para un efecto de medición"),
    createStructuredItem("science/equations", "conditional-pure-measurement-state", "Conditional Pure State after a Measurement", "Estado puro condicional después de una medición"),
    createStructuredItem("science/equations", "quantum-channel-kraus-representation", "Quantum Channel Kraus Representation", "Representación de Kraus de un Canal Cuántico"),
    createStructuredItem("science/equations", "kraus-operator-sum", "Kraus Operator-Sum Representation", "Representación como suma de operadores de Kraus"),
    createStructuredItem("science/equations", "kraus-trace-preservation", "Kraus Trace-Preservation Condition", "Condición de Kraus para preservar la traza"),
    createStructuredItem("science/equations", "phase-damping-coherence-decay", "Phase Damping Coherence Decay", "Decaimiento de Coherencia por Amortiguamiento de Fase"),
    createStructuredItem("science/equations", "quantum-state-fidelity", "Quantum State Fidelity", "Fidelidad de Estados Cuánticos"),
    createStructuredItem("science/equations", "holevo-information", "Holevo Information", "Información de Holevo"),
    createStructuredItem("science/equations", "hsw-capacity-and-coherent-information", "HSW (Holevo-Schumacher-Westmoreland) Capacity and Coherent Information", "Capacidad HSW (Holevo-Schumacher-Westmoreland) e Información Coherente"),
    createStructuredItem("science/equations", "optimized-holevo-information", "Optimized Single-Use Holevo Information", "Información de Holevo optimizada para un uso"),
    createStructuredItem("science/equations", "coherent-information", "Coherent Information", "Información coherente"),
    createStructuredItem("science/equations", "schumacher-compression", "Schumacher Compression", "Compresión de Schumacher"),
    createStructuredItem("science/equations", "trace-distance", "Trace Distance", "Distancia de Traza"),
    createStructuredItem("science/equations", "helstrom-state-discrimination", "Helstrom State Discrimination", "Discriminación de Estados de Helstrom"),
    createStructuredItem("science/equations", "data-processing-inequality", "Data Processing Inequality", "Desigualdad de Procesamiento de Datos"),
    createStructuredItem("science/equations", "quantum-capacity-regularized", "Regularized Quantum Capacity", "Capacidad Cuántica Regularizada"),
    createStructuredItem("science/equations", "bell-basis-states", "Bell Basis States", "Estados Base de Bell")
  ]
};

const quantumComputingEquationBranch = {
  id: "quantum-computing-equations",
  title: { en: "Equations", es: "Ecuaciones" },
  items: [
    createStructuredItem("science/equations", "qubit-superposition-state", "Qubit Superposition State", "Estado de Superposición del Qubit"),
    createStructuredItem("science/equations", "qubit-normalization-condition", "Qubit Normalization Condition", "Condición de Normalización del Qubit"),
    createStructuredItem("science/equations", "bell-state-phi-plus", "Bell State Phi Plus", "Estado de Bell Phi Más"),
    createStructuredItem("science/equations", "hadamard-gate-matrix", "Hadamard Gate Matrix", "Matriz de la Compuerta de Hadamard"),
    createStructuredItem("science/equations", "unitary-gate-condition", "Unitary Gate Condition", "Condición de Compuerta Unitaria"),
    createStructuredItem("science/equations", "shor-algorithm-polynomial-runtime", "Shor Algorithm Polynomial Runtime", "Tiempo Polinómico del Algoritmo de Shor"),
    createStructuredItem("science/equations", "grover-algorithm-quadratic-runtime", "Grover Search Query Complexity", "Complejidad de consultas de Grover"),
    createStructuredItem("science/equations", "amplitude-encoded-classical-vector", "Amplitude-Encoded Classical Vector", "Vector Clásico Codificado en Amplitudes"),
    createStructuredItem("science/equations", "l2-norm-vector-sampling", "L2-Norm (Euclidean norm) Vector Sampling", "Muestreo Vectorial de Norma L2 (norma euclidiana)"),
    createStructuredItem("science/equations", "l2-norm-matrix-sampling", "L2-Norm (Euclidean norm) Matrix Sampling", "Muestreo Matricial de Norma L2 (norma euclidiana)"),
    createStructuredItem("science/equations", "length-square-row-sampling", "Length-Square Row Sampling", "Muestreo de filas por norma al cuadrado"),
    createStructuredItem("science/equations", "conditional-column-sampling", "Conditional Length-Square Column Sampling", "Muestreo condicional de columnas por norma al cuadrado"),
    createStructuredItem("science/equations", "amplitude-measurement-distribution", "Amplitude Measurement Distribution", "Distribución de Medición de Amplitudes"),
    createStructuredItem("science/equations", "tang-recommendation-runtime", "Tang Recommendation Runtime", "Tiempo de Recomendación de Tang"),
    createStructuredItem("science/equations", "polynomial-matrix-vector-transform", "Polynomial Matrix-Vector Transform", "Transformación Polinómica Matriz-Vector"),
    createStructuredItem("science/equations", "hamiltonian-time-evolution", "Hamiltonian Time Evolution", "Evolución Temporal Hamiltoniana"),
    createStructuredItem("science/equations", "local-hamiltonian-expansion", "Local Hamiltonian Expansion", "Expansión Hamiltoniana Local"),
    createStructuredItem("science/equations", "gibbs-state-density-matrix", "Gibbs State Density Matrix", "Matriz de Densidad de Estado de Gibbs"),
    createStructuredItem("science/equations", "canonical-gibbs-state", "Canonical Gibbs State", "Estado canónico de Gibbs"),
    createStructuredItem("science/equations", "canonical-partition-function", "Canonical Partition Function", "Función de partición canónica"),
    createStructuredItem("science/equations", "inverse-thermal-energy", "Inverse Thermal Energy Parameter", "Parámetro de energía térmica inversa"),
    createStructuredItem("science/equations", "gibbs-hamiltonian-sample-complexity", "Gibbs Hamiltonian Sample Complexity", "Complejidad Muestral Hamiltoniana de Gibbs"),
    createStructuredItem("science/equations", "pure-state-hilbert-normalization", "Pure State Hilbert Normalization", "Normalización de Estado Puro en Hilbert"),
    createStructuredItem("science/equations", "density-matrix-conditions", "Density Matrix Conditions", "Condiciones de Matriz de Densidad"),
    createStructuredItem("science/equations", "product-state-factorization", "Product State Factorization", "Factorización de Estado Producto")
  ]
};

const quantumComplexityEquationBranch = {
  id: "quantum-complexity-equations",
  title: { en: "Equations", es: "Ecuaciones" },
  items: [
    createStructuredItem("science/equations", "quantum-state-space-dimension", "Quantum State-Space Dimension", "Dimensión del Espacio de Estados Cuántico"),
    createStructuredItem("science/equations", "quantum-complexity-class-containments", "Quantum Complexity Class Containments", "Contenciones de Clases de Complejidad Cuántica"),
    createStructuredItem("science/equations", "bqp-bounded-error-definition", "BQP Bounded-Error Definition", "Definición de BQP con Error Acotado"),
    createStructuredItem("science/equations", "quantum-query-search-bound", "Quantum Query Search Bound", "Límite de consultas para la búsqueda cuántica"),
    createStructuredItem("science/equations", "qma-verifier-definition", "QMA Verifier Definition", "Definición de Verificador QMA"),
    createStructuredItem("science/equations", "local-hamiltonian-decision-gap", "Local Hamiltonian Decision Gap", "Brecha de Decisión del Hamiltoniano Local"),
    createStructuredItem("science/equations", "quantum-circuit-complexity", "Quantum Circuit Complexity", "Complejidad de Circuitos Cuánticos"),
    createStructuredItem("science/equations", "area-law-entanglement-bound", "Area-Law Entanglement Bound", "Límite del entrelazamiento según la ley de área")
  ]
};

const relativitySpacetimeEquationBranch = {
  id: "relativity-spacetime-equations",
  title: { en: "Equations", es: "Ecuaciones" },
  items: [
    createStructuredItem("science/equations", "galilean-transformations", "Galilean Transformations", "Transformaciones de Galileo"),
    createStructuredItem("science/equations", "lorentz-factor", "Lorentz Factor", "Factor de Lorentz"),
    createStructuredItem("science/equations", "lorentz-transformations", "Lorentz Transformations", "Transformaciones de Lorentz"),
    createStructuredItem("science/equations", "relativistic-time-dilation", "Relativistic Time Dilation", "Dilatación Temporal Relativista"),
    createStructuredItem("science/equations", "length-contraction", "Length Contraction", "Contracción de Longitud"),
    createStructuredItem("science/equations", "relativistic-energy-momentum", "Relativistic Energy-Momentum", "Energía-Momento Relativista"),
    createStructuredItem("science/equations", "spacetime-interval", "Spacetime Interval", "Intervalo de Espaciotiempo"),
    createStructuredItem("science/equations", "general-spacetime-interval", "General Spacetime Interval", "Intervalo General de Espaciotiempo"),
    createStructuredItem("science/equations", "proper-time-definition", "Proper Time", "Tiempo Propio"),
    createStructuredItem("science/equations", "light-cone-condition", "Light Cone Condition", "Condición del Cono de Luz"),
    createStructuredItem("science/equations", "einstein-field-equations", "Einstein Field Equations", "Ecuaciones de Campo de Einstein"),
    createStructuredItem("science/equations", "einstein-field-equations-lambda", "Einstein Field Equations with Lambda", "Ecuaciones de Campo de Einstein con Lambda"),
    createStructuredItem("science/equations", "geodesic-equation", "Geodesic Equation", "Ecuación Geodésica"),
    createStructuredItem("science/equations", "gravitational-redshift", "Gravitational Redshift", "Corrimiento Gravitacional al Rojo")
  ]
};

const blackHolesEquationBranch = {
  id: "black-holes-equations",
  title: { en: "Equations", es: "Ecuaciones" },
  items: [
    createStructuredItem("science/equations", "escape-velocity", "Escape Velocity", "Velocidad de Escape"),
    createStructuredItem("science/equations", "schwarzschild-radius", "Schwarzschild Radius", "Radio de Schwarzschild"),
    createStructuredItem("science/equations", "schwarzschild-metric", "Schwarzschild Metric", "Métrica de Schwarzschild"),
    createStructuredItem("science/equations", "kretschmann-scalar", "Kretschmann Scalar", "Escalar de Kretschmann"),
    createStructuredItem("science/equations", "light-cone-condition", "Light Cone Condition", "Condición del Cono de Luz"),
    createStructuredItem("science/equations", "trapped-surface-condition", "Trapped Surface Condition", "Condición de Superficie Atrapada"),
    createStructuredItem("science/equations", "kerr-horizon-radius", "Kerr Horizon Radius", "Radio del Horizonte de Kerr"),
    createStructuredItem("science/equations", "dimensionless-spin-parameter", "Dimensionless Spin Parameter", "Parámetro de Giro Adimensional"),
    createStructuredItem("science/equations", "penrose-process-efficiency", "Penrose Process", "Proceso de Penrose"),
    createStructuredItem("science/equations", "photon-sphere-radius", "Photon Sphere Radius", "Radio de la Esfera de Fotones"),
    createStructuredItem("science/equations", "isco-radius", "ISCO (innermost stable circular orbit) Radius", "Radio de la ISCO (innermost stable circular orbit, órbita circular estable más interna)"),
    createStructuredItem("science/equations", "eddington-luminosity", "Eddington Luminosity", "Luminosidad de Eddington"),
    createStructuredItem("science/equations", "black-hole-gravitational-redshift", "Black Hole Gravitational Redshift", "Corrimiento Gravitacional al Rojo de un Agujero Negro"),
    createStructuredItem("science/equations", "tidal-acceleration", "Tidal Acceleration", "Aceleración de Marea"),
    createStructuredItem("science/equations", "black-hole-first-law", "Black Hole First Law", "Primera Ley de los Agujeros Negros"),
    createStructuredItem("science/equations", "hawking-temperature", "Hawking Temperature", "Temperatura de Hawking"),
    createStructuredItem("science/equations", "bekenstein-hawking-entropy", "Bekenstein Hawking Entropy", "Entropía de Bekenstein Hawking"),
    createStructuredItem("science/equations", "black-hole-evaporation-time", "Black Hole Evaporation Time", "Tiempo de Evaporación de un Agujero Negro"),
    createStructuredItem("science/equations", "page-curve-unitarity", "Page Curve and Unitarity", "Curva de Page y Unitariedad")
  ]
};

const wormholesEquationBranch = {
  id: "wormholes-equations",
  title: { en: "Equations", es: "Ecuaciones" },
  items: [
    createStructuredItem("science/equations", "morris-thorne-wormhole-metric", "Morris Thorne Wormhole Metric", "Métrica de Agujero de Gusano de Morris Thorne"),
    createStructuredItem("science/equations", "wormhole-flare-out-condition", "Wormhole Flare-Out Condition", "Condición de Apertura de Agujero de Gusano"),
    createStructuredItem("science/equations", "wormhole-redshift-finite", "Finite Redshift Condition", "Condición de Corrimiento Finito"),
    createStructuredItem("science/equations", "null-energy-condition-wormhole", "Null Energy Condition Violation", "Violación de la condición de energía nula"),
    createStructuredItem("science/equations", "quantum-inequality-bound", "Quantum Inequality Bound", "Límite impuesto por una desigualdad cuántica"),
    createStructuredItem("science/equations", "wormhole-tidal-constraint", "Traversability Tidal Constraint", "Restricción de Marea para Transitabilidad"),
    createStructuredItem("science/equations", "closed-timelike-curve-condition", "Closed Timelike Curve Condition", "Condición de Curva Temporal Cerrada")
  ]
};

const artificialIntelligenceEquationBranch = {
  id: "artificial-intelligence-equations",
  title: { en: "Equations", es: "Ecuaciones" },
  items: [
    createStructuredItem("science/equations", "neural-network-layer", "Neural Network Layer", "Capa de Red Neuronal"),
    createStructuredItem("science/equations", "gradient-descent-update", "Gradient Descent Update", "Actualización por Descenso de Gradiente"),
    createStructuredItem("science/equations", "adam-optimizer-update", "Adam Optimizer Update", "Actualización del Optimizador Adam"),
    createStructuredItem("science/equations", "cross-entropy-loss", "Cross Entropy Loss", "Pérdida de Entropía Cruzada"),
    createStructuredItem("science/equations", "scaled-dot-product-attention", "Scaled Dot Product Attention", "Atención de Producto Punto Escalado"),
    createStructuredItem("science/equations", "transformer-residual-block", "Transformer Residual Block", "Bloque Residual Transformer"),
    createStructuredItem("science/equations", "language-modeling-objective", "Language Modeling Objective", "Objetivo de Modelado de Lenguaje"),
    createStructuredItem("science/equations", "diffusion-denoising-objective", "Diffusion Denoising Objective", "Objetivo de Eliminación de Ruido en Difusión"),
    createStructuredItem("science/equations", "rlhf-objective", "RLHF (reinforcement learning from human feedback) Objective", "Objetivo de RLHF (reinforcement learning from human feedback, aprendizaje por refuerzo con retroalimentación humana)"),
    createStructuredItem("science/equations", "calibration-condition", "Calibration Condition", "Condición de Calibración"),
    createStructuredItem("science/equations", "neural-scaling-law", "Neural Scaling Law", "Ley de Escalamiento Neuronal")
  ]
};

const informationTheoryEquationBranch = {
  id: "information-theory-equations",
  title: { en: "Equations", es: "Ecuaciones" },
  items: [
    createStructuredItem("science/equations", "shannon-entropy", "Shannon Entropy", "Entropía de Shannon"),
    createStructuredItem("science/equations", "classical-mutual-information", "Classical Mutual Information", "Información Mutua Clásica"),
    createStructuredItem("science/equations", "shannon-channel-capacity", "Shannon Channel Capacity", "Capacidad de Canal de Shannon"),
    createStructuredItem("science/equations", "kullback-leibler-divergence", "Kullback Leibler Divergence", "Divergencia de Kullback Leibler"),
    createStructuredItem("science/equations", "shannon-source-coding-bound", "Shannon Source Coding Bound", "Límite de Codificación de Fuente de Shannon"),
    createStructuredItem("science/equations", "q-ary-symmetric-channel-capacity", "Symmetric Noisy Channel Capacity", "Capacidad de Canal Simétrico con Ruido"),
    createStructuredItem("science/equations", "perfect-secrecy-condition", "Perfect Secrecy Condition", "Condición de Secreto Perfecto"),
    createStructuredItem("science/equations", "landauer-principle", "Landauer's Principle", "Principio de Landauer")
  ]
};

const programmingAlgorithmsEquationBranch = {
  id: "programming-algorithms-equations",
  title: { en: "Equations", es: "Ecuaciones" },
  items: [
    createStructuredItem("science/equations", "big-o-notation", "Big O Notation", "Notación Big O"),
    createStructuredItem("science/equations", "algorithmic-recurrence", "Algorithmic Recurrence", "Recurrencia Algorítmica"),
    createStructuredItem("science/equations", "dijkstra-relaxation", "Dijkstra Relaxation", "Relajación de Dijkstra"),
    createStructuredItem("science/equations", "hoare-triple", "Hoare Triple", "Triple de Hoare"),
    createStructuredItem("science/equations", "comparison-sort-lower-bound", "Comparison Sort Lower Bound", "Límite Inferior de Ordenamiento por Comparación"),
    createStructuredItem("science/equations", "dijkstra-priority-queue-complexity", "Dijkstra Priority Queue Complexity", "Complejidad de Dijkstra con Cola de Prioridad"),
    createStructuredItem("science/equations", "dynamic-programming-recurrence", "Dynamic Programming Recurrence", "Recurrencia de Programación Dinámica"),
    createStructuredItem("science/equations", "p-np-definitions", "P and NP (nondeterministic polynomial time) Definitions", "Definiciones de P y NP (tiempo polinomial no determinista)"),
    createStructuredItem("science/equations", "polynomial-time-class", "Deterministic Polynomial Time: P", "Tiempo polinómico determinista: P"),
    createStructuredItem("science/equations", "nondeterministic-polynomial-time-class", "Nondeterministic Polynomial Time: NP", "Tiempo polinómico no determinista: NP")
  ]
};

const simulationModelsEquationBranch = {
  id: "simulation-models-equations",
  title: { en: "Equations", es: "Ecuaciones" },
  items: [
    createStructuredItem("science/equations", "monte-carlo-probability-measure", "Monte Carlo Sampling", "Muestreo de Monte Carlo"),
    createStructuredItem("science/equations", "continuous-expectation-integral", "Expectation under a Probability Density", "Esperanza respecto a una densidad de probabilidad"),
    createStructuredItem("science/equations", "monte-carlo-sample-average", "Monte Carlo Sample Average", "Promedio muestral de Monte Carlo"),
    createStructuredItem("science/equations", "sampling-distribution-law", "Sampling Distribution", "Ley de distribución del muestreo"),
    createStructuredItem("science/equations", "hydrogen-orbital-probability-element", "Hydrogen Orbital Probability Element", "Elemento de probabilidad de un orbital de hidrógeno"),
    createStructuredItem("science/equations", "monte-carlo-standard-error", "Monte Carlo Standard Error", "Error Estándar de Monte Carlo"),
    createStructuredItem("science/equations", "euler-method", "Euler Method", "Método de Euler"),
    createStructuredItem("science/equations", "euler-global-error-order", "Euler Global Error Order", "Orden de Error Global de Euler"),
    createStructuredItem("science/equations", "runge-kutta-four", "Runge Kutta Four", "Runge Kutta de Cuarto Orden"),
    createStructuredItem("science/equations", "rk4-global-error-order", "RK4 (Runge-Kutta fourth-order method) Global Error Order", "Orden de Error Global de RK4 (Runge-Kutta de cuarto orden)"),
    createStructuredItem("science/equations", "finite-difference-heat-equation", "Finite Difference Heat Equation", "Ecuación de Calor por Diferencias Finitas"),
    createStructuredItem("science/equations", "heat-stability-condition", "Heat Stability Condition", "Condición de Estabilidad del Calor"),
    createStructuredItem("science/equations", "one-dimensional-ftcs-stability", "One-Dimensional FTCS Heat Stability", "Estabilidad del esquema FTCS unidimensional para calor"),
    createStructuredItem("science/equations", "two-dimensional-ftcs-stability", "Two-Dimensional FTCS Heat Stability", "Estabilidad del esquema FTCS bidimensional para calor"),
    createStructuredItem("science/equations", "simulation-rmse-error", "Simulation RMSE (root mean square error)", "Error RMSE (root mean square error, raíz del error cuadrático medio) de Simulación")
  ]
};

const fluidMechanicsEquationBranch = {
  id: "fluid-mechanics-navier-stokes-equations",
  title: { en: "Equations", es: "Ecuaciones" },
  items: [
    createStructuredItem("science/equations", "fluid-navier-stokes", "Incompressible Navier-Stokes Momentum", "Ecuación de cantidad de movimiento de Navier-Stokes incompresible"),
    createStructuredItem("science/equations", "fluid-incompressibility", "Incompressibility", "Incompresibilidad"),
    createStructuredItem("science/equations", "fluid-material-derivative", "Material Derivative", "Derivada material"),
    createStructuredItem("science/equations", "fluid-euler", "Incompressible Euler Equations", "Ecuaciones de Euler incompresibles"),
    createStructuredItem("science/equations", "fluid-vorticity", "Vorticity Transport and Stretching", "Transporte y estiramiento de vorticidad"),
    createStructuredItem("science/equations", "vorticity-definition", "Vorticity as the Curl of Velocity", "Vorticidad como rotacional de la velocidad"),
    createStructuredItem("science/equations", "vorticity-transport-equation", "Incompressible Vorticity Transport", "Transporte de vorticidad en un fluido incompresible"),
    createStructuredItem("science/equations", "fluid-enstrophy", "Enstrophy Balance", "Balance de enstrofía"),
    createStructuredItem("science/equations", "fluid-kinetic-energy", "Smooth Kinetic-Energy Balance", "Balance de energía cinética para soluciones suaves"),
    createStructuredItem("science/equations", "fluid-energy", "Leray-Hopf Energy Inequality", "Desigualdad de energía de Leray-Hopf"),
    createStructuredItem("science/equations", "fluid-weak-formulation", "Divergence-Free Weak Formulation", "Formulación débil con campos de prueba de divergencia nula"),
    createStructuredItem("science/equations", "fluid-scaling", "Navier-Stokes Scaling", "Reescalamiento de Navier-Stokes"),
    createStructuredItem("science/equations", "fluid-critical-norms", "Critical Norms and Energy Scaling", "Normas críticas y reescalamiento de la energía"),
    createStructuredItem("science/equations", "navier-stokes-mixed-norm-scaling", "Scaling of a Mixed Velocity Norm", "Escalamiento de una norma mixta de velocidad"),
    createStructuredItem("science/equations", "navier-stokes-energy-scaling", "Scaling of the Squared Spatial Velocity Norm", "Escalamiento de la norma espacial de velocidad al cuadrado"),
    createStructuredItem("science/equations", "fluid-blowup-conditions", "OpenAI Construction: Support, Energy, and Blowup", "Construcción de OpenAI: soporte, energía y singularidad"),
    createStructuredItem("science/equations", "construction-fixed-spatial-support", "Construction: Fixed Spatial Support", "Construcción: soporte espacial fijo"),
    createStructuredItem("science/equations", "construction-uniform-energy-bound", "Construction: Uniform Finite-Energy Bound", "Construcción: cota uniforme de energía finita"),
    createStructuredItem("science/equations", "construction-unbounded-peak-speed", "Construction: Unbounded Peak Speed", "Construcción: rapidez máxima no acotada"),
    createStructuredItem("science/equations", "fluid-similarity-coordinates", "OpenAI Construction: Similarity Coordinates", "Construcción de OpenAI: coordenadas de semejanza"),
    createStructuredItem("science/equations", "fluid-blowup-scales", "OpenAI Construction: Core Scaling", "Construcción de OpenAI: escalas del núcleo"),
    createStructuredItem("science/equations", "blowup-radial-length", "Construction: Radial Core Length", "Construcción: longitud radial del núcleo"),
    createStructuredItem("science/equations", "blowup-axial-length", "Construction: Axial Core Length", "Construcción: longitud axial del núcleo"),
    createStructuredItem("science/equations", "blowup-azimuthal-speed", "Construction: Azimuthal Core Speed", "Construcción: rapidez azimutal del núcleo"),
    createStructuredItem("science/equations", "blowup-axial-speed", "Construction: Axial Core Speed", "Construcción: rapidez axial del núcleo"),
    createStructuredItem("science/equations", "blowup-radial-speed-bound", "Construction: Radial Speed Bound", "Construcción: cota de rapidez radial"),
    createStructuredItem("science/equations", "blowup-core-energy-bound", "Construction: Core Energy Bound", "Construcción: cota de energía del núcleo"),
    createStructuredItem("science/equations", "blowup-core-aspect-ratio", "Construction: Core Aspect Ratio", "Construcción: relación de aspecto del núcleo"),
    createStructuredItem("science/equations", "fluid-momentum-residual", "Momentum Residual Under a Perturbation", "Residuo de cantidad de movimiento bajo una perturbación")
  ]
};

const classicalMechanicsEquationBranch = {
  id: "classical-mechanics-equations",
  title: { en: "Equations", es: "Ecuaciones" },
  items: [
    createStructuredItem("science/equations", "newton-second-law", "Newton's Second Law", "Segunda Ley de Newton"),
    createStructuredItem("science/equations", "classical-action-principle", "Classical Action Principle", "Principio de Acción Clásico"),
    createStructuredItem("science/equations", "classical-action-functional", "Classical Action Functional", "Funcional de acción clásica"),
    createStructuredItem("science/equations", "stationary-action-condition", "Stationary Action Condition", "Condición de acción estacionaria"),
    createStructuredItem("science/equations", "euler-lagrange-equation", "Euler-Lagrange Equation", "Ecuación de Euler-Lagrange"),
    createStructuredItem("science/equations", "hamilton-equations", "Hamilton's Equations", "Ecuaciones de Hamilton"),
    createStructuredItem("science/equations", "mechanics-kinematics", "Position, Velocity and Acceleration", "Posición, velocidad y aceleración"),
    createStructuredItem("science/equations", "instantaneous-velocity", "Instantaneous Velocity", "Velocidad instantánea"),
    createStructuredItem("science/equations", "instantaneous-acceleration", "Instantaneous Acceleration", "Aceleración instantánea"),
    createStructuredItem("science/equations", "constant-acceleration-position", "Position with Constant Acceleration", "Posición con aceleración constante"),
    createStructuredItem("science/equations", "mechanics-common-forces", "Weight, Spring Force and Friction", "Peso, fuerza elástica y fricción"),
    createStructuredItem("science/equations", "weight-force", "Weight in a Gravitational Field", "Peso en un campo gravitatorio"),
    createStructuredItem("science/equations", "hooke-spring-force", "Hooke’s Spring Force", "Fuerza elástica de Hooke"),
    createStructuredItem("science/equations", "static-friction-bound", "Static Friction Bound", "Cota de fricción estática"),
    createStructuredItem("science/equations", "kinetic-friction-force", "Kinetic Friction Magnitude", "Magnitud de la fricción cinética"),
    createStructuredItem("science/equations", "mechanics-work-energy", "Work and Kinetic Energy", "Trabajo y energía cinética"),
    createStructuredItem("science/equations", "work-energy-theorem", "Work-Energy Theorem", "Teorema del trabajo y la energía"),
    createStructuredItem("science/equations", "translational-kinetic-energy", "Translational Kinetic Energy", "Energía cinética de traslación"),
    createStructuredItem("science/equations", "mechanics-impulse-momentum", "Impulse and Momentum", "Impulso y cantidad de movimiento"),
    createStructuredItem("science/equations", "linear-momentum", "Linear Momentum", "Cantidad de movimiento lineal"),
    createStructuredItem("science/equations", "impulse-momentum-theorem", "Impulse-Momentum Theorem", "Teorema del impulso y la cantidad de movimiento"),
    createStructuredItem("science/equations", "mechanics-rotation", "Torque and Rotation", "Momento de fuerza y rotación"),
    createStructuredItem("science/equations", "torque-definition", "Torque about an Origin", "Torque respecto a un origen"),
    createStructuredItem("science/equations", "angular-momentum-balance", "Angular Momentum Balance", "Balance del momento angular"),
    createStructuredItem("science/equations", "fixed-axis-rotation-law", "Fixed-Axis Rotational Dynamics", "Dinámica de rotación alrededor de un eje fijo"),
    createStructuredItem("science/equations", "mechanics-gravitation", "Newtonian Gravitation and Circular Orbits", "Gravitación newtoniana y órbitas circulares"),
    createStructuredItem("science/equations", "newtonian-gravity-vector", "Newtonian Gravitational Force Vector", "Vector de fuerza gravitatoria newtoniana"),
    createStructuredItem("science/equations", "gravitational-potential-energy", "Newtonian Gravitational Potential Energy", "Energía potencial gravitatoria newtoniana"),
    createStructuredItem("science/equations", "stellar-hydrostatic-equilibrium", "Stellar Hydrostatic Equilibrium", "Equilibrio hidrostático estelar"),
    createStructuredItem("science/equations", "circular-orbit-speed", "Circular Orbit Speed", "Rapidez en una órbita circular"),
    createStructuredItem("science/equations", "mechanics-circular-motion", "Uniform Circular Motion", "Movimiento circular uniforme"),
    createStructuredItem("science/equations", "circular-trajectory", "Uniform Circular Trajectory", "Trayectoria circular uniforme"),
    createStructuredItem("science/equations", "circular-velocity", "Velocity in Uniform Circular Motion", "Velocidad en el movimiento circular uniforme"),
    createStructuredItem("science/equations", "centripetal-acceleration", "Centripetal Acceleration", "Aceleración centrípeta"),
    createStructuredItem("science/equations", "centripetal-force-magnitude", "Centripetal Force Magnitude", "Magnitud de la fuerza centrípeta"),
    createStructuredItem("science/equations", "mechanics-oscillator", "Damped and Driven Oscillator", "Oscilador amortiguado y forzado"),
    createStructuredItem("science/equations", "driven-damped-oscillator", "Driven Damped Harmonic Oscillator", "Oscilador armónico amortiguado y forzado"),
    createStructuredItem("science/equations", "spring-natural-frequency", "Natural Angular Frequency of a Spring Oscillator", "Frecuencia angular natural de un oscilador de resorte"),
    createStructuredItem("science/equations", "mechanics-center-of-mass", "Center of Mass", "Centro de masa"),
    createStructuredItem("science/equations", "center-of-mass-definition", "Centre of Mass", "Definición del centro de masa"),
    createStructuredItem("science/equations", "center-of-mass-motion", "Motion of the Centre of Mass", "Movimiento del centro de masa"),
    createStructuredItem("science/equations", "mechanics-rotational-energy", "Angular Momentum and Rotational Energy", "Momento angular y energía de rotación"),
    createStructuredItem("science/equations", "particle-angular-momentum", "Angular Momentum of a Particle", "Momento angular de una partícula"),
    createStructuredItem("science/equations", "discrete-moment-of-inertia", "Moment of Inertia about an Axis", "Momento de inercia respecto a un eje"),
    createStructuredItem("science/equations", "rigid-body-rotational-energy", "Rigid-Body Rotational Kinetic Energy", "Energía cinética de rotación de un cuerpo rígido"),
    createStructuredItem("science/equations", "mechanics-orbital-energy", "Kepler Period and Escape Energy", "Periodo de Kepler y energía de escape"),
    createStructuredItem("science/equations", "two-body-kepler-period", "Kepler Period for Two Bodies", "Periodo de Kepler para dos cuerpos"),
    createStructuredItem("science/equations", "two-body-relative-energy", "Two-Body Relative Orbital Energy", "Energía orbital relativa de dos cuerpos"),
    createStructuredItem("science/equations", "two-body-reduced-mass", "Reduced Mass", "Masa reducida"),
    createStructuredItem("science/equations", "two-body-escape-speed", "Two-Body Relative Escape Speed", "Rapidez relativa de escape de dos cuerpos"),
    createStructuredItem("science/equations", "mechanics-small-oscillations", "Potential Curvature and Small Oscillations", "Curvatura del potencial y pequeñas oscilaciones"),
    createStructuredItem("science/equations", "potential-near-equilibrium", "Potential near a Stable Equilibrium", "Potencial cerca del equilibrio estable"),
    createStructuredItem("science/equations", "effective-spring-stiffness", "Effective Stiffness at a Potential Minimum", "Rigidez efectiva en un mínimo del potencial"),
    createStructuredItem("science/equations", "small-oscillation-frequency", "Small-Oscillation Angular Frequency", "Frecuencia angular de pequeñas oscilaciones"),
    createStructuredItem("science/equations", "mechanics-pendulum", "Pendulum Torque and Small Angles", "Momento de fuerza del péndulo y ángulos pequeños"),
    createStructuredItem("science/equations", "nonlinear-pendulum-equation", "Nonlinear Simple Pendulum Equation", "Ecuación no lineal del péndulo simple"),
    createStructuredItem("science/equations", "small-angle-pendulum-equation", "Small-Angle Pendulum Equation", "Ecuación del péndulo para ángulos pequeños"),
    createStructuredItem("science/equations", "mechanics-velocity-verlet", "Velocity Verlet Integration", "Integración de Verlet en velocidades")
  ]
};

const electromagnetismEquationBranch = {
  id: "electromagnetism-equations",
  title: { en: "Equations", es: "Ecuaciones" },
  items: [
    createStructuredItem("science/equations", "lorentz-force-law", "Lorentz Force Law", "Ley de Fuerza de Lorentz"),
    createStructuredItem("science/equations", "electromagnetic-wave-speed", "Electromagnetic Wave Speed", "Velocidad de Onda Electromagnética"),
    createStructuredItem("science/equations", "maxwell-equations-differential", "Maxwell's Equations", "Ecuaciones de Maxwell"),
    createStructuredItem("science/equations", "gauss-electric-law", "Gauss’s Law for the Electric Field", "Ley de Gauss para el campo eléctrico"),
    createStructuredItem("science/equations", "gauss-magnetic-law", "Gauss’s Law for Magnetism", "Ley de Gauss para el magnetismo"),
    createStructuredItem("science/equations", "faraday-induction-law", "Faraday’s Law of Induction", "Ley de inducción de Faraday"),
    createStructuredItem("science/equations", "ampere-maxwell-law", "Ampère-Maxwell Law", "Ley de Ampère-Maxwell"),
    createStructuredItem("science/equations", "electromagnetic-wave-equation", "Electromagnetic Wave Equation", "Ecuación de Onda Electromagnética"),
    createStructuredItem("science/equations", "poynting-vector", "Poynting Vector", "Vector de Poynting")
  ]
};

const thermodynamicsEquationBranch = {
  id: "thermodynamics-statistical-mechanics-equations",
  title: { en: "Equations", es: "Ecuaciones" },
  items: [
    createStructuredItem("science/equations", "first-law-thermodynamics", "First Law of Thermodynamics", "Primera Ley de la Termodinámica"),
    createStructuredItem("science/equations", "boltzmann-entropy", "Boltzmann Entropy", "Entropía de Boltzmann"),
    createStructuredItem("science/equations", "second-law-entropy-inequality", "Second Law Entropy Inequality", "Desigualdad Entrópica de la Segunda Ley"),
    createStructuredItem("science/equations", "clausius-entropy-inequality", "Clausius Entropy Inequality", "Desigualdad de entropía de Clausius"),
    createStructuredItem("science/equations", "isolated-total-entropy-change", "Entropy Change of an Isolated Total System", "Cambio de entropía de un sistema total aislado"),
    createStructuredItem("science/equations", "gibbs-state-density-matrix", "Gibbs State Density Matrix", "Matriz de Densidad de Estado de Gibbs"),
    createStructuredItem("science/equations", "canonical-gibbs-state", "Canonical Gibbs State", "Estado canónico de Gibbs"),
    createStructuredItem("science/equations", "canonical-partition-function", "Canonical Partition Function", "Función de partición canónica"),
    createStructuredItem("science/equations", "inverse-thermal-energy", "Inverse Thermal Energy Parameter", "Parámetro de energía térmica inversa"),
    createStructuredItem("science/equations", "jarzynski-equality", "Jarzynski Equality", "Igualdad de Jarzynski")
  ]
};

const mathematicalFoundationsEquationBranch = {
  id: "mathematical-foundations-equations",
  title: { en: "Equations", es: "Ecuaciones" },
  items: [
    createStructuredItem("science/equations", "derivative-notation", "Derivative Notation", "Notación de Derivada"),
    createStructuredItem("science/equations", "definite-integral", "Definite Integral", "Integral Definida"),
    createStructuredItem("science/equations", "matrix-vector-transformation", "Matrix-Vector Transformation", "Transformación Matriz-Vector"),
    createStructuredItem("science/equations", "eigenvalue-equation", "Eigenvalue Equation", "Ecuación de Autovalor"),
    createStructuredItem("science/equations", "bayes-theorem", "Bayes' Theorem", "Teorema de Bayes")
  ]
};

const quantumFieldTheoryEquationBranch = {
  id: "quantum-field-theory-equations",
  title: { en: "Equations", es: "Ecuaciones" },
  items: [
    createStructuredItem("science/equations", "scalar-field-lagrangian", "Scalar Field Lagrangian", "Lagrangiano de Campo Escalar"),
    createStructuredItem("science/equations", "renormalization-group-equation", "Renormalization Group Equation", "Ecuación del Grupo de Renormalización"),
    createStructuredItem("science/equations", "qft-microcausality", "QFT Microcausality", "Microcausalidad en Teoría Cuántica de Campos"),
    createStructuredItem("science/equations", "feynman-propagator", "Feynman Propagator", "Propagador de Feynman"),
    createStructuredItem("science/equations", "vacuum-energy-integral", "Vacuum Energy Integral", "Integral de Energía del Vacío")
  ]
};

const neuroscienceConsciousnessEquationBranch = {
  id: "neuroscience-consciousness-equations",
  title: { en: "Equations", es: "Ecuaciones" },
  items: [
    createStructuredItem("science/equations", "recurrent-state-update", "Recurrent State Update", "Actualización Recurrente de Estado"),
    createStructuredItem("science/equations", "leaky-integrate-fire-neuron", "Leaky Integrate-and-Fire Neuron", "Neurona de Integración y Disparo con Fuga")
  ]
};

const complexSystemsEquationBranch = {
  id: "complex-systems-emergence-equations",
  title: { en: "Equations", es: "Ecuaciones" },
  items: [
    createStructuredItem("science/equations", "dynamical-system-equation", "Dynamical System Equation", "Ecuación de Sistema Dinámico"),
    createStructuredItem("science/equations", "logistic-map-equation", "Logistic Map", "Mapa Logístico"),
    createStructuredItem("science/equations", "graph-adjacency-matrix", "Graph Adjacency Matrix", "Matriz de Adyacencia de Grafo")
  ]
};

const chemistryMolecularStructureEquationBranch = {
  id: "chemistry-molecular-structure-equations",
  title: { en: "Equations", es: "Ecuaciones" },
  items: [
    createStructuredItem("science/equations", "gibbs-free-energy", "Gibbs Free Energy", "Energía Libre de Gibbs"),
    createStructuredItem("science/equations", "chemical-equilibrium-constant", "Chemical Equilibrium Constant", "Constante de Equilibrio Químico"),
    createStructuredItem("science/equations", "arrhenius-equation", "Arrhenius Equation", "Ecuación de Arrhenius"),
    createStructuredItem("science/equations", "kohn-sham-equations", "Kohn-Sham Equations", "Ecuaciones de Kohn-Sham")
  ]
};

const biologyLifeSystemsEquationBranch = {
  id: "biology-life-systems-equations",
  title: { en: "Equations", es: "Ecuaciones" },
  items: [
    createStructuredItem("science/equations", "central-dogma-flow", "Central Dogma Flow", "Flujo del Dogma Central"),
    createStructuredItem("science/equations", "logistic-growth-equation", "Logistic Growth", "Crecimiento Logístico"),
    createStructuredItem("science/equations", "hardy-weinberg-equilibrium", "Hardy-Weinberg Equilibrium", "Equilibrio de Hardy-Weinberg")
  ]
};

const personalCosmologyEquationBranch = {
  id: "my-work-influences-equations",
  title: { en: "Equations", es: "Ecuaciones" },
  hidden: true,
  items: [
    createStructuredItem("science/equations", "spacetime-interval", "Spacetime Interval", "Intervalo de Espaciotiempo"),
    createStructuredItem("science/equations", "general-spacetime-interval", "General Spacetime Interval", "Intervalo General de Espaciotiempo"),
    createStructuredItem("science/equations", "proper-time-definition", "Proper Time", "Tiempo Propio"),
    createStructuredItem("science/equations", "relativistic-particle-action", "Relativistic Particle Action", "Acción de Partícula Relativista"),
    createStructuredItem("science/equations", "geodesic-equation", "Geodesic Equation", "Ecuación Geodésica"),
    createStructuredItem("science/equations", "boltzmann-entropy", "Boltzmann Entropy", "Entropía de Boltzmann"),
    createStructuredItem("science/equations", "reduced-density-matrix", "Reduced Density Matrix", "Matriz de Densidad Reducida"),
    createStructuredItem("science/equations", "finite-observer-reduced-state", "Finite Observer Reduced State", "Estado Reducido de un Observador Finito"),
    createStructuredItem("science/equations", "environment-reduced-state", "Environment Reduced State", "Estado Reducido por Ambiente"),
    createStructuredItem("science/equations", "decohered-record-state", "Decohered Record State", "Estado de Registros Decoheridos"),
    createStructuredItem("science/equations", "hamiltonian-time-evolution", "Hamiltonian Time Evolution", "Evolución Temporal Hamiltoniana"),
    createStructuredItem("science/equations", "einstein-field-equations", "Einstein Field Equations", "Ecuaciones de Campo de Einstein"),
    createStructuredItem("science/equations", "einstein-field-equations-lambda", "Einstein Field Equations with Lambda", "Ecuaciones de Campo de Einstein con Lambda"),
    createStructuredItem("science/equations", "adm-line-element", "ADM (Arnowitt-Deser-Misner) Line Element", "Elemento de Línea ADM (Arnowitt-Deser-Misner)"),
    createStructuredItem("science/equations", "flrw-metric", "FLRW (Friedmann-Lemaitre-Robertson-Walker) Metric", "Métrica FLRW (Friedmann-Lemaitre-Robertson-Walker)"),
    createStructuredItem("science/equations", "flrw-comoving-proper-time", "FLRW (Friedmann-Lemaitre-Robertson-Walker) Comoving Proper Time", "Tiempo Propio Comóvil FLRW (Friedmann-Lemaitre-Robertson-Walker)"),
    createStructuredItem("science/equations", "first-friedmann-equation", "First Friedmann Equation", "Primera Ecuación de Friedmann"),
    createStructuredItem("science/equations", "cosmological-horizons", "Cosmological Horizons", "Horizontes Cosmológicos"),
    createStructuredItem("science/equations", "flrw-particle-horizon", "FLRW Particle Horizon", "Horizonte de partículas en FLRW"),
    createStructuredItem("science/equations", "flrw-event-horizon", "FLRW Cosmological Event Horizon", "Horizonte cosmológico de eventos en FLRW"),
    createStructuredItem("science/equations", "time-dependent-schrodinger-equation", "Time-Dependent Schrödinger Equation", "Ecuación de Schrödinger Dependiente del Tiempo"),
    createStructuredItem("science/equations", "path-integral-kernel", "Path Integral Kernel", "Núcleo de Integral de Camino"),
    createStructuredItem("science/equations", "page-wootters-stationary-state", "Page-Wootters Stationary State", "Estado Estacionario de Page-Wootters"),
    createStructuredItem("science/equations", "relational-total-energy-constraint", "Total-Energy Constraint in a Relational Clock Model", "Restricción de energía total en un modelo de reloj relacional"),
    createStructuredItem("science/equations", "conditional-clock-state", "System State Conditioned on a Clock Reading", "Estado del sistema condicionado a una lectura del reloj"),
    createStructuredItem("science/equations", "qft-microcausality", "QFT (quantum field theory) Microcausality", "Microcausalidad en teoría cuántica de campos"),
    createStructuredItem("science/equations", "feynman-propagator", "Feynman Propagator", "Propagador de Feynman"),
    createStructuredItem("science/equations", "wheeler-dewitt-equation", "Wheeler-DeWitt Equation", "Ecuación de Wheeler-DeWitt"),
    createStructuredItem("science/equations", "semiclassical-wkb-time-emergence", "Semiclassical WKB (Wentzel-Kramers-Brillouin) Time Emergence", "Emergencia Semiclásica del Tiempo WKB (Wentzel-Kramers-Brillouin)"),
    createStructuredItem("science/equations", "gravitational-wkb-ansatz", "Gravitational WKB Ansatz", "Ansatz WKB gravitatorio"),
    createStructuredItem("science/equations", "semiclassical-matter-evolution", "Matter Evolution in Semiclassical WKB Time", "Evolución de la materia en tiempo WKB semiclásico"),
    createStructuredItem("science/equations", "renormalization-group-equation", "Renormalization Group Equation", "Ecuación del Grupo de Renormalización"),
    createStructuredItem("science/equations", "vacuum-energy-integral", "Vacuum Energy Integral", "Integral de Energía del Vacío"),
    createStructuredItem("science/equations", "schwarzschild-radius", "Schwarzschild Radius", "Radio de Schwarzschild"),
    createStructuredItem("science/equations", "kretschmann-scalar", "Kretschmann Scalar", "Escalar de Kretschmann"),
    createStructuredItem("science/equations", "bekenstein-hawking-entropy", "Bekenstein Hawking Entropy", "Entropía de Bekenstein Hawking"),
    createStructuredItem("science/equations", "hilbert-dimension-entropy-bound", "Hilbert Dimension Entropy Bound", "Límite entrópico de la dimensión de Hilbert"),
    createStructuredItem("science/equations", "von-neumann-entropy", "Von Neumann Entropy", "Entropía de von Neumann"),
    createStructuredItem("science/equations", "quantum-mutual-information", "Quantum Mutual Information", "Información Mutua Cuántica"),
    createStructuredItem("science/equations", "mode-indexed-ontology", "Mode-Indexed Ontology", "Ontología indexada por modo"),
    createStructuredItem("science/equations", "ultimate-totality-union", "Ultimate Totality as a Union of Modes", "Totalidad Última como unión de modos"),
    createStructuredItem("science/equations", "mode-indexed-content", "Mode-Indexed Absolute Content", "Contenido absoluto indexado por modo"),
    createStructuredItem("science/equations", "law-compatible-physical-reality", "Physical Reality as a Law-Compatible Subset", "Realidad física como subconjunto compatible con las leyes")
  ]
};

export const siteContent = {
  title: "Issac Tabares",
  ui: {
    languageLabel: { en: "EN/ES", es: "EN/ES" },
    skipToContent: { en: "Skip to content", es: "Saltar al contenido" },
    readingSettingsButtonLabel: { en: "Reading settings", es: "Ajustes de lectura" },
    readingSettingsTitle: { en: "Reading Settings", es: "Ajustes de lectura" },
    readingSettingsDescription: {
      en: "Adjust reading comfort without changing the site's identity.",
      es: "Ajusta la comodidad de lectura sin cambiar la identidad del sitio."
    },
    readingSettingsTextSizeLabel: { en: "Text Size", es: "Tamaño del Texto" },
    readingSettingsTextSizeDefault: { en: "Default", es: "Normal" },
    readingSettingsTextSizeLarge: { en: "Large", es: "Grande" },
    readingSettingsTextSizeXLarge: { en: "Largest", es: "Máximo" },
    readingSettingsReadingModeLabel: { en: "Reading Mode", es: "Modo de Lectura" },
    readingSettingsReducedMotionLabel: { en: "Reduced Motion", es: "Movimiento Reducido" },
    readingSettingsHighContrastLabel: { en: "Higher Contrast", es: "Mayor Contraste" },
    readingSettingsMediaNotesLabel: { en: "Media Notes", es: "Notas de Medios" },
    readingSettingsReadableFontLabel: { en: "Readable Font", es: "Tipografía Legible" },
    readingSettingsLinkVisibilityLabel: { en: "Visible Links", es: "Enlaces Visibles" },
    readingSettingsResetLabel: { en: "Reset", es: "Restablecer" },
    socialAriaLabel: { en: "Social links", es: "Enlaces sociales" },
    personalSectionsAria: { en: "Personal sections", es: "Secciones personales" },
    knowledgeWorldsAria: { en: "Knowledge Worlds", es: "Mundos de conocimiento" },
    topicNavigationAria: { en: "Topic navigation", es: "Navegación de temas" },
    branchNavigationAria: { en: "Cosmology branches", es: "Ramas de cosmología" },
    legacyItemNavigationAria: { en: "Detailed legacy topics", es: "Temas detallados" },
    focusedPathCloseHint: {
      en: "Press again to return",
      es: "Presiona de nuevo para volver"
    },
    focusedPathCloseAria: {
      en: "Press again to close this tab and return to the main section.",
      es: "Presiona de nuevo para cerrar esta pestaña y volver a la sección principal."
    },
    localDockTitle: { en: "Links", es: "Enlaces" },
    openedLabel: { en: "Opened", es: "Abierto" },
    contentLoading: {
      en: "Loading content...",
      es: "Cargando contenido..."
    },
    contentUnavailable: {
      en: "This content could not be loaded right now.",
      es: "Este contenido no pudo cargarse en este momento."
    },
    legacyLoading: {
      en: "Loading content...",
      es: "Cargando contenido..."
    },
    legacyUnavailable: {
      en: "This content could not be loaded right now.",
      es: "Este contenido no pudo cargarse en este momento."
    },
    copyright: {
      en: "All rights reserved.",
      es: "Todos los derechos reservados."
    }
  },
  sitePurposeSection: createSection("site-purpose-notices-privacy", "Site Purpose, Notices & Privacy", "Propósito del sitio, avisos y privacidad"),
  personalSections: [
    createSection("origins-interests", "My Life", "Mi vida", {
      contentId: "origins",
      chapters: [
        createStructuredItem("personal", "origins", "Origins", "Orígenes"),
        createStructuredItem("personal", "learning-path", "Learning Path", "Camino de aprendizaje"),
        createStructuredItem("personal", "music", "Music", "Música"),
        createStructuredItem("personal", "practice-worlds", "Favorite Video Games", "Videojuegos favoritos")
      ]
    }),
    createSection("systems-work", "Professional Career", "Trayectoria profesional"),
    createSection("personal-cosmology", "My Theory", "Mi teoría", {
      branches: [personalCosmologyEquationBranch],
      hideBranchNavigation: true,
      hideDetailNavigation: true
    }),
    createSection("library-influences", "Library and Influences", "Biblioteca e influencias")
  ],
  knowledgeWorlds: [
    {
      id: "physical-foundations",
      title: { en: "Physical Foundations", es: "Fundamentos físicos" },
      topics: [
        createTopic("classical-mechanics", "Classical Mechanics", "Mecánica clásica", {
          contentFile: htmlSource("science", "classical-mechanics"),
          branches: [classicalMechanicsEquationBranch],
          hideBranchNavigation: true,
          hideDetailNavigation: true
        }),
        createTopic("fluid-mechanics-navier-stokes", "Fluid Mechanics and Navier-Stokes", "Mecánica de Fluidos y Navier-Stokes", {
          contentFile: htmlSource("science", "fluid-mechanics-navier-stokes"),
          branches: [fluidMechanicsEquationBranch],
          hideBranchNavigation: true,
          hideDetailNavigation: true
        }),
        createTopic("electromagnetism", "Electromagnetism", "Electromagnetismo", {
          contentFile: htmlSource("science", "electromagnetism"),
          branches: [electromagnetismEquationBranch],
          hideBranchNavigation: true,
          hideDetailNavigation: true
        }),
        createTopic("thermodynamics-statistical-mechanics", "Thermodynamics & Statistical Mechanics", "Termodinámica y mecánica estadística", {
          contentFile: htmlSource("science", "thermodynamics-statistical-mechanics"),
          branches: [thermodynamicsEquationBranch],
          hideBranchNavigation: true,
          hideDetailNavigation: true
        }),
        createTopic("probability-statistics", "Probability & Statistics", "Probabilidad y Estadística", {
          contentFile: htmlSource("science", "probability-statistics"),
          branches: [{ id: "probability-statistics-equations", title: { en: "Equations", es: "Ecuaciones" }, items: [
              createStructuredItem("science/equations", "probability-axioms", "Probability axioms", "Axiomas de probabilidad"),
              createStructuredItem("science/equations", "conditional-bayes", "Conditional probability and Bayes", "Probabilidad condicional y Bayes"),
              createStructuredItem("science/equations", "expectation-variance", "Expectation and variance", "Esperanza y varianza"),
    createStructuredItem("science/equations", "random-variable-expectation", "Expectation of a Random Variable", "Esperanza de una variable aleatoria"),
    createStructuredItem("science/equations", "random-variable-variance", "Variance of a Random Variable", "Varianza de una variable aleatoria")
          ] }], hideBranchNavigation: true, hideDetailNavigation: true
        }),
        createTopic("mathematical-analysis", "Mathematical Analysis & Differential Equations", "Análisis Matemático y Ecuaciones Diferenciales", {
          contentFile: htmlSource("science", "mathematical-analysis"),
          branches: [{ id: "mathematical-analysis-equations", title: { en: "Equations", es: "Ecuaciones" }, items: [
              createStructuredItem("science/equations", "weak-derivative", "Weak derivative", "Derivada débil"),
              createStructuredItem("science/equations", "sobolev-norm", "Sobolev norm", "Norma de Sobolev")
          ] }], hideBranchNavigation: true, hideDetailNavigation: true
        }),
        createTopic("mathematical-foundations", "Mathematical Foundations", "Fundamentos matemáticos", {
          contentFile: htmlSource("science", "mathematical-foundations"),
          branches: [mathematicalFoundationsEquationBranch],
          hideBranchNavigation: true,
          hideDetailNavigation: true
        })
      ]
    },
    {
      id: "quantum-foundations",
      title: { en: "Quantum Foundations", es: "Fundamentos cuánticos" },
      topics: [
        createTopic("quantum-mechanics", "Quantum Mechanics", "Mecánica cuántica", {
          contentFile: htmlSource("science", "quantum-mechanics"),
          branches: [quantumMechanicsEquationBranch],
          hideBranchNavigation: true,
          hideDetailNavigation: true
        }),
        createTopic("quantum-entanglement", "Quantum Entanglement", "Entrelazamiento cuántico", {
          contentFile: htmlSource("science", "quantum-entanglement"),
          branches: [quantumEntanglementEquationBranch],
          hideBranchNavigation: true,
          hideDetailNavigation: true
        }),
        createTopic("quantum-information", "Quantum Information", "Información cuántica", {
          contentFile: htmlSource("science", "quantum-information"),
          branches: [quantumInformationEquationBranch],
          hideBranchNavigation: true,
          hideDetailNavigation: true
        }),
        createTopic("quantum-computing", "Quantum Computing", "Computación cuántica", {
          contentFile: htmlSource("science", "quantum-computing"),
          branches: [quantumComputingEquationBranch],
          hideBranchNavigation: true,
          hideDetailNavigation: true
        }),
        createTopic("quantum-complexity", "Quantum Complexity", "Complejidad cuántica", {
          contentFile: htmlSource("science", "quantum-complexity"),
          branches: [quantumComplexityEquationBranch],
          hideBranchNavigation: true,
          hideDetailNavigation: true
        })
      ]
    },
    {
      id: "matter-life-mind",
      title: { en: "Matter, Life & Mind", es: "Materia, vida y mente" },
      topics: [
        createTopic("quantum-field-theory", "Quantum Field Theory", "Teoría cuántica de campos", {
          contentFile: htmlSource("science", "quantum-field-theory"),
          branches: [quantumFieldTheoryEquationBranch],
          hideBranchNavigation: true,
          hideDetailNavigation: true
        }),
        createTopic("chemistry-molecular-structure", "Chemistry & Molecular Structure", "Química y estructura molecular", {
          contentFile: htmlSource("science", "chemistry-molecular-structure"),
          branches: [chemistryMolecularStructureEquationBranch],
          hideBranchNavigation: true,
          hideDetailNavigation: true
        }),
        createTopic("biology-life-systems", "Biology & Life Systems", "Biología y sistemas vivos", {
          contentFile: htmlSource("science", "biology-life-systems"),
          branches: [biologyLifeSystemsEquationBranch],
          hideBranchNavigation: true,
          hideDetailNavigation: true
        }),
        createTopic("dinosaurs", "Dinosaurs & Prehistoric Life", "Dinosaurios y vida prehistórica"),
        createTopic("neuroscience-consciousness", "Neuroscience of Consciousness", "Neurociencia de la conciencia", {
          contentFile: htmlSource("science", "neuroscience-consciousness"),
          branches: [neuroscienceConsciousnessEquationBranch],
          hideBranchNavigation: true,
          hideDetailNavigation: true
        })
      ]
    },
    {
      id: "spacetime-cosmos",
      title: { en: "Spacetime & Cosmos", es: "Espaciotiempo y cosmos" },
      topics: [
        createTopic("relativity-spacetime", "Relativity & Spacetime", "Relatividad y espaciotiempo", {
          contentFile: htmlSource("science", "relativity-spacetime"),
          branches: [relativitySpacetimeEquationBranch],
          hideBranchNavigation: true,
          hideDetailNavigation: true
        }),
        createTopic("stars", "Stars", "Estrellas", {
          contentFile: htmlSource("science", "stars"),
          branches: [starsChapterBranch, starsEquationBranch],
          hideBranchNavigation: true,
          hideDetailNavigation: true
        }),
        createTopic("black-holes", "Black Holes", "Agujeros negros", {
          contentFile: htmlSource("science", "black-holes"),
          branches: [blackHolesEquationBranch],
          hideBranchNavigation: true,
          hideDetailNavigation: true
        }),
        createTopic("wormholes", "Wormholes", "Agujeros de gusano", {
          contentFile: htmlSource("science", "wormholes"),
          branches: [wormholesEquationBranch],
          hideBranchNavigation: true,
          hideDetailNavigation: true
        }),
        createTopic(
          "cosmology-early-universe",
          "Cosmology & the Early Universe",
          "Cosmología y el universo temprano",
          { branches: bigBangLegacyContent.branches }
        )
      ]
    },
    {
      id: "intelligence-computation",
      title: { en: "Intelligence & Computation", es: "Inteligencia y computación" },
      topics: [
        createTopic("artificial-intelligence", "Artificial Intelligence", "Inteligencia artificial", {
          contentFile: htmlSource("science", "artificial-intelligence"),
          branches: [artificialIntelligenceEquationBranch],
          hideBranchNavigation: true,
          hideDetailNavigation: true
        }),
        createTopic("information-theory", "Information Theory", "Teoría de la información", {
          contentFile: htmlSource("science", "information-theory"),
          branches: [informationTheoryEquationBranch],
          hideBranchNavigation: true,
          hideDetailNavigation: true
        }),
        createTopic("programming-algorithms", "Programming & Algorithms", "Programación y algoritmos", {
          contentFile: htmlSource("science", "programming-algorithms"),
          branches: [programmingAlgorithmsEquationBranch],
          hideBranchNavigation: true,
          hideDetailNavigation: true
        }),
        createTopic("simulation-models", "Simulation & Models", "Simulación y modelos", {
          contentFile: htmlSource("science", "simulation-models"),
          branches: [simulationModelsEquationBranch],
          hideBranchNavigation: true,
          hideDetailNavigation: true
        })
      ]
    },
    {
      id: "systems-method",
      title: { en: "Systems & Method", es: "Sistemas y método" },
      topics: [
        createTopic("complex-systems-emergence", "Complex Systems & Emergence", "Sistemas complejos y emergencia", {
          contentFile: htmlSource("science", "complex-systems-emergence"),
          branches: [complexSystemsEquationBranch],
          hideBranchNavigation: true,
          hideDetailNavigation: true
        }),
        createTopic("philosophy-science", "Philosophy of Science", "Filosofía de la ciencia")
      ]
    },
    {
      id: "model-lab",
      title: { en: "Model Lab", es: "Laboratorio de modelos" },
      topics: [
        createTopic("model-lab", "Interactive Models", "Modelos interactivos")
      ]
    }
  ]
};
