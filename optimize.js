const puppeteer = require('puppeteer');
const geneticAlgorithm = require('geneticalgorithm');

// Fonction pour évaluer les performances d'une page
async function evaluatePagePerformance(browser, url, resourceOrder) {
  const page = await browser.newPage();
  
  // Interception des requêtes pour modifier l'ordre de chargement
  await page.setRequestInterception(true);
  page.on('request', (request) => {
    // Logique pour réordonner les ressources basée sur resourceOrder
    // ...
    request.continue();
  });

  const navigationPromise = page.goto(url, {waitUntil: 'networkidle0'});

  const performanceMetrics = await page.evaluate(() => {
    const timing = performance.timing;
    return {
      timeToFirstByte: timing.responseStart - timing.navigationStart,
      domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
      loadTime: timing.loadEventEnd - timing.navigationStart,
    };
  });

  await navigationPromise;
  await page.close();

  // Calcul du score de fitness basé sur les métriques
  return calculateFitness(performanceMetrics);
}

// Exemple de fonction calculateFitness
function calculateFitness(performanceMetrics) {
  // Définissez des poids pour chaque métrique
  const weights = {
    timeToFirstByte: 0.2,
    domContentLoaded: 0.3,
    loadTime: 0.5
  };

  // Normalisez et pondérez chaque métrique
  // Note: Plus basse est la valeur, meilleure est la performance
  const normalizedTTFB = 1 / (1 + performanceMetrics.timeToFirstByte);
  const normalizedDCL = 1 / (1 + performanceMetrics.domContentLoaded);
  const normalizedLoadTime = 1 / (1 + performanceMetrics.loadTime);

  // Calculez le score de fitness pondéré
  const fitnessScore = 
    weights.timeToFirstByte * normalizedTTFB +
    weights.domContentLoaded * normalizedDCL +
    weights.loadTime * normalizedLoadTime;

  return fitnessScore;
}

// Exemple de fonction generateInitialPopulation
function generateInitialPopulation(resourceList, populationSize) {
  const population = [];

  for (let i = 0; i < populationSize; i++) {
    // Créez une copie de la liste des ressources
    const shuffledResources = [...resourceList];
    
    // Mélangez l'ordre des ressources de manière aléatoire
    for (let j = shuffledResources.length - 1; j > 0; j--) {
      const k = Math.floor(Math.random() * (j + 1));
      [shuffledResources[j], shuffledResources[k]] = [shuffledResources[k], shuffledResources[j]];
    }

    // Ajoutez cet ordre de chargement à la population
    population.push(shuffledResources);
  }

  return population;
}

// // Exemple d'utilisation
// const resourceList = [
//   { type: 'script', url: 'main.js' },
//   { type: 'style', url: 'styles.css' },
//   { type: 'script', url: 'vendor.js' },
//   { type: 'style', url: 'typography.css' },
//   { type: 'script', url: 'analytics.js' }
// ];

// const initialPopulation = generateInitialPopulation(resourceList, 50);
// console.log('Population initiale générée:', initialPopulation.length);

// // Exemple de calcul de fitness (normalement appelé après l'évaluation des performances)
// const exampleMetrics = {
//   timeToFirstByte: 100,
//   domContentLoaded: 500,
//   loadTime: 1200
// };

// const fitnessScore = calculateFitness(exampleMetrics);
// console.log('Score de fitness calculé:', fitnessScore);

// Configuration de l'algorithme génétique
const geneticAlgorithmConfig = {
  mutationFunction: (order) => {
    // Logique de mutation de l'ordre des ressources
    return mutatedOrder;
  },
  crossoverFunction: (motherOrder, fatherOrder) => {
    // Logique de croisement des ordres de ressources
    return childOrder;
  },
  fitnessFunction: async (order) => {
    const browser = await puppeteer.launch();
    const fitness = await evaluatePagePerformance(browser, 'https://www.cdiscount.com', order);
    await browser.close();
    return fitness;
  },
  populationSize: 50,
  generations: 100,
};

const GA = geneticAlgorithm(geneticAlgorithmConfig);


// Exécution de l'algorithme génétique
(async () => {
  const initialPopulation = generateInitialPopulation();
  const result = await GA.evolve(initialPopulation);
  console.log('Meilleur ordre de chargement:', result);
})();