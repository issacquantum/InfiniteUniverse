import { bigBangLegacyContent } from "./legacy-big-bang.js?v=20260620-expanded-tabs-hide-v1";

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
    createStructuredItem("science/equations", "normalization-condition", "Normalization Condition", "Condición de Normalización"),
    createStructuredItem("science/equations", "probability-current", "Probability Current", "Corriente de Probabilidad"),
    createStructuredItem("science/equations", "continuity-equation", "Continuity Equation", "Ecuación de Continuidad"),
    createStructuredItem("science/equations", "hydrogen-hamiltonian-atomic-units", "Hydrogen Hamiltonian in Atomic Units", "Hamiltoniano del Hidrógeno en Unidades Atómicas"),
    createStructuredItem("science/equations", "psi-320-wavefunction", "Hydrogen 3d₍z²₎ Wavefunction", "Función de Onda 3d₍z²₎ del Hidrógeno"),
    createStructuredItem("science/equations", "psi-320-probability-density", "Hydrogen 3d₍z²₎ Probability Density", "Densidad de Probabilidad 3d₍z²₎ del Hidrógeno"),
    createStructuredItem("science/equations", "monte-carlo-probability-measure", "Monte Carlo Sampling", "Muestreo de Monte Carlo")
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
    createStructuredItem("science/equations", "von-neumann-entropy", "Von Neumann Entropy", "Entropía de von Neumann"),
    createStructuredItem("science/equations", "shannon-entropy", "Shannon Entropy", "Entropía de Shannon"),
    createStructuredItem("science/equations", "entanglement-entropy", "Entanglement Entropy", "Entropía de Entrelazamiento"),
    createStructuredItem("science/equations", "quantum-mutual-information", "Quantum Mutual Information", "Información Mutua Cuántica"),
    createStructuredItem("science/equations", "quantum-relative-entropy", "Quantum Relative Entropy", "Entropía Relativa Cuántica"),
    createStructuredItem("science/equations", "strong-subadditivity", "Strong Subadditivity", "Subaditividad Fuerte"),
    createStructuredItem("science/equations", "no-cloning-linearity", "No Cloning and Linearity", "No Clonamiento y Linealidad"),
    createStructuredItem("science/equations", "born-rule-povm-measurement", "Born Rule and POVM (positive operator-valued measure) Measurement", "Regla de Born y Medición POVM (positive operator-valued measure, medida de operador positivo)"),
    createStructuredItem("science/equations", "quantum-channel-kraus-representation", "Quantum Channel Kraus Representation", "Representación de Kraus de un Canal Cuántico"),
    createStructuredItem("science/equations", "phase-damping-coherence-decay", "Phase Damping Coherence Decay", "Decaimiento de Coherencia por Amortiguamiento de Fase"),
    createStructuredItem("science/equations", "quantum-state-fidelity", "Quantum State Fidelity", "Fidelidad de Estados Cuánticos"),
    createStructuredItem("science/equations", "holevo-information", "Holevo Information", "Información de Holevo"),
    createStructuredItem("science/equations", "hsw-capacity-and-coherent-information", "HSW (Holevo-Schumacher-Westmoreland) Capacity and Coherent Information", "Capacidad HSW (Holevo-Schumacher-Westmoreland) e Información Coherente"),
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
    createStructuredItem("science/equations", "grover-algorithm-quadratic-runtime", "Grover Algorithm Quadratic Runtime", "Tiempo Cuadrático del Algoritmo de Grover"),
    createStructuredItem("science/equations", "amplitude-encoded-classical-vector", "Amplitude-Encoded Classical Vector", "Vector Clásico Codificado en Amplitudes"),
    createStructuredItem("science/equations", "l2-norm-vector-sampling", "L2-Norm (Euclidean norm) Vector Sampling", "Muestreo Vectorial de Norma L2 (norma euclidiana)"),
    createStructuredItem("science/equations", "l2-norm-matrix-sampling", "L2-Norm (Euclidean norm) Matrix Sampling", "Muestreo Matricial de Norma L2 (norma euclidiana)"),
    createStructuredItem("science/equations", "amplitude-measurement-distribution", "Amplitude Measurement Distribution", "Distribución de Medición de Amplitudes"),
    createStructuredItem("science/equations", "tang-recommendation-runtime", "Tang Recommendation Runtime", "Tiempo de Recomendación de Tang"),
    createStructuredItem("science/equations", "polynomial-matrix-vector-transform", "Polynomial Matrix-Vector Transform", "Transformación Polinómica Matriz-Vector"),
    createStructuredItem("science/equations", "hamiltonian-time-evolution", "Hamiltonian Time Evolution", "Evolución Temporal Hamiltoniana"),
    createStructuredItem("science/equations", "local-hamiltonian-expansion", "Local Hamiltonian Expansion", "Expansión Hamiltoniana Local"),
    createStructuredItem("science/equations", "gibbs-state-density-matrix", "Gibbs State Density Matrix", "Matriz de Densidad de Estado de Gibbs"),
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
    createStructuredItem("science/equations", "quantum-query-search-bound", "Quantum Query Search Bound", "Cota Cuántica de Búsqueda por Consultas"),
    createStructuredItem("science/equations", "qma-verifier-definition", "QMA Verifier Definition", "Definición de Verificador QMA"),
    createStructuredItem("science/equations", "local-hamiltonian-decision-gap", "Local Hamiltonian Decision Gap", "Brecha de Decisión del Hamiltoniano Local"),
    createStructuredItem("science/equations", "quantum-circuit-complexity", "Quantum Circuit Complexity", "Complejidad de Circuitos Cuánticos"),
    createStructuredItem("science/equations", "area-law-entanglement-bound", "Area-Law Entanglement Bound", "Cota de Entrelazamiento por Ley de Área")
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
    createStructuredItem("science/equations", "null-energy-condition-wormhole", "Null Energy Condition", "Condición de Energía Nula"),
    createStructuredItem("science/equations", "quantum-inequality-bound", "Quantum Inequality Bound", "Cota de Desigualdad Cuántica"),
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
    createStructuredItem("science/equations", "p-np-definitions", "P and NP (nondeterministic polynomial time) Definitions", "Definiciones de P y NP (tiempo polinomial no determinista)")
  ]
};

const simulationModelsEquationBranch = {
  id: "simulation-models-equations",
  title: { en: "Equations", es: "Ecuaciones" },
  items: [
    createStructuredItem("science/equations", "monte-carlo-probability-measure", "Monte Carlo Sampling", "Muestreo de Monte Carlo"),
    createStructuredItem("science/equations", "monte-carlo-standard-error", "Monte Carlo Standard Error", "Error Estándar de Monte Carlo"),
    createStructuredItem("science/equations", "euler-method", "Euler Method", "Método de Euler"),
    createStructuredItem("science/equations", "euler-global-error-order", "Euler Global Error Order", "Orden de Error Global de Euler"),
    createStructuredItem("science/equations", "runge-kutta-four", "Runge Kutta Four", "Runge Kutta de Cuarto Orden"),
    createStructuredItem("science/equations", "rk4-global-error-order", "RK4 (Runge-Kutta fourth-order method) Global Error Order", "Orden de Error Global de RK4 (Runge-Kutta de cuarto orden)"),
    createStructuredItem("science/equations", "finite-difference-heat-equation", "Finite Difference Heat Equation", "Ecuación de Calor por Diferencias Finitas"),
    createStructuredItem("science/equations", "heat-stability-condition", "Heat Stability Condition", "Condición de Estabilidad del Calor"),
    createStructuredItem("science/equations", "simulation-rmse-error", "Simulation RMSE (root mean square error)", "Error RMSE (root mean square error, raíz del error cuadrático medio) de Simulación")
  ]
};

const classicalMechanicsEquationBranch = {
  id: "classical-mechanics-equations",
  title: { en: "Equations", es: "Ecuaciones" },
  items: [
    createStructuredItem("science/equations", "newton-second-law", "Newton's Second Law", "Segunda Ley de Newton"),
    createStructuredItem("science/equations", "classical-action-principle", "Classical Action Principle", "Principio de Acción Clásico"),
    createStructuredItem("science/equations", "euler-lagrange-equation", "Euler-Lagrange Equation", "Ecuación de Euler-Lagrange"),
    createStructuredItem("science/equations", "hamilton-equations", "Hamilton's Equations", "Ecuaciones de Hamilton")
  ]
};

const electromagnetismEquationBranch = {
  id: "electromagnetism-equations",
  title: { en: "Equations", es: "Ecuaciones" },
  items: [
    createStructuredItem("science/equations", "lorentz-force-law", "Lorentz Force Law", "Ley de Fuerza de Lorentz"),
    createStructuredItem("science/equations", "electromagnetic-wave-speed", "Electromagnetic Wave Speed", "Velocidad de Onda Electromagnética"),
    createStructuredItem("science/equations", "maxwell-equations-differential", "Maxwell's Equations", "Ecuaciones de Maxwell"),
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
    createStructuredItem("science/equations", "gibbs-state-density-matrix", "Gibbs State Density Matrix", "Matriz de Densidad de Estado de Gibbs"),
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
    createStructuredItem("science/equations", "time-dependent-schrodinger-equation", "Time-Dependent Schrödinger Equation", "Ecuación de Schrödinger Dependiente del Tiempo"),
    createStructuredItem("science/equations", "path-integral-kernel", "Path Integral Kernel", "Núcleo de Integral de Camino"),
    createStructuredItem("science/equations", "page-wootters-stationary-state", "Page-Wootters Stationary State", "Estado Estacionario de Page-Wootters"),
    createStructuredItem("science/equations", "qft-microcausality", "QFT (quantum field theory) Microcausality", "Microcausalidad en teoría cuántica de campos"),
    createStructuredItem("science/equations", "feynman-propagator", "Feynman Propagator", "Propagador de Feynman"),
    createStructuredItem("science/equations", "wheeler-dewitt-equation", "Wheeler-DeWitt Equation", "Ecuación de Wheeler-DeWitt"),
    createStructuredItem("science/equations", "semiclassical-wkb-time-emergence", "Semiclassical WKB (Wentzel-Kramers-Brillouin) Time Emergence", "Emergencia Semiclásica del Tiempo WKB (Wentzel-Kramers-Brillouin)"),
    createStructuredItem("science/equations", "renormalization-group-equation", "Renormalization Group Equation", "Ecuación del Grupo de Renormalización"),
    createStructuredItem("science/equations", "vacuum-energy-integral", "Vacuum Energy Integral", "Integral de Energía del Vacío"),
    createStructuredItem("science/equations", "schwarzschild-radius", "Schwarzschild Radius", "Radio de Schwarzschild"),
    createStructuredItem("science/equations", "kretschmann-scalar", "Kretschmann Scalar", "Escalar de Kretschmann"),
    createStructuredItem("science/equations", "bekenstein-hawking-entropy", "Bekenstein Hawking Entropy", "Entropía de Bekenstein Hawking"),
    createStructuredItem("science/equations", "hilbert-dimension-entropy-bound", "Hilbert Dimension Entropy Bound", "Cota Entrópica de Dimensión de Hilbert"),
    createStructuredItem("science/equations", "von-neumann-entropy", "Von Neumann Entropy", "Entropía de von Neumann"),
    createStructuredItem("science/equations", "quantum-mutual-information", "Quantum Mutual Information", "Información Mutua Cuántica")
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
    createSection("origins", "Origins", "Orígenes"),
    createSection("learning-path", "Learning Path", "Camino de aprendizaje"),
    createSection("music", "Music", "Música"),
    createSection("systems-work", "Systems Work", "Trabajo con sistemas"),
    createSection("practice-worlds", "Practice Worlds", "Mundos de práctica"),
    createSection("personal-cosmology", "Personal Cosmology", "Cosmología personal", {
      branches: [personalCosmologyEquationBranch],
      hideBranchNavigation: true,
      hideDetailNavigation: true
    })
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
