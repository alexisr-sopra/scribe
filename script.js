const wheel = document.getElementById("wheel");
const spinBtn = document.getElementById("spin-btn");
const finalValue = document.getElementById("final-value");

// Références pour les nouveaux éléments du DOM
const importBtn = document.getElementById('import-btn');
const fileInput = document.getElementById('file-input');

// Object that stores values of minimum and maximum angle for a value
const rotationValues = [
  { minDegree: 0, maxDegree: 30, value: 2 },
  { minDegree: 31, maxDegree: 90, value: 1 },
  { minDegree: 91, maxDegree: 150, value: 6 },
  { minDegree: 151, maxDegree: 210, value: 5 },
  { minDegree: 211, maxDegree: 270, value: 4 },
  { minDegree: 271, maxDegree: 330, value: 3 },
  { minDegree: 331, maxDegree: 360, value: 2 },
];

// Size of each piece (default values, to be updated with CSV)
let data = [16, 16, 16, 16, 16, 16];

// Background color for each piece
var pieColors = [
  "#8b35bc",
  "#b163da",
  "#8b35bc",
  "#b163da",
  "#8b35bc",
  "#b163da",
];

// Create chart
let myChart = new Chart(wheel, {
  // Plugin for displaying text on pie chart
  plugins: [ChartDataLabels],
  // Chart Type Pie
  type: "pie",
  data: {
    // Labels (initial default values, to be updated with CSV)
    labels: [1, 2, 3, 4, 5, 6],
    // Settings for dataset/pie
    datasets: [
      {
        backgroundColor: pieColors,
        data: data,
      },
    ],
  },
  options: {
    // Responsive chart
    responsive: true,
    animation: { duration: 0 },
    plugins: {
      // Hide tooltip and legend
      tooltip: false,
      legend: {
        display: false,
      },
      // Display labels inside pie chart
      datalabels: {
        color: "#ffffff",
        formatter: (_, context) => context.chart.data.labels[context.dataIndex],
        font: { size: 24 },
      },
    },
  },
});

// Display value based on the randomAngle
const valueGenerator = (angleValue) => {
  for (let i of rotationValues) {
    // If the angleValue is between min and max then display it
    if (angleValue >= i.minDegree && angleValue <= i.maxDegree) {
      finalValue.innerHTML = `<p>Value: ${i.value}</p>`;
      spinBtn.disabled = false;
      break;
    }
  }
};

// Spinner count
let count = 0;
// 100 rotations for animation and last rotation for result
let resultValue = 101;

// Start spinning
spinBtn.addEventListener("click", () => {
  spinBtn.disabled = true;
  // Empty final value
  finalValue.innerHTML = `<p>Good Luck!</p>`;
  // Generate random degrees to stop at
  let randomDegree = Math.floor(Math.random() * (355 - 0 + 1) + 0);
  // Interval for rotation animation
  let rotationInterval = window.setInterval(() => {
    // Set rotation for piechart
    myChart.options.rotation = myChart.options.rotation + resultValue;
    // Update chart with new value;
    myChart.update();
    // If rotation > 360 reset it back to 0
    if (myChart.options.rotation >= 360) {
      count += 1;
      resultValue -= 5;
      myChart.options.rotation = 0;
    } else if (count > 15 && myChart.options.rotation == randomDegree) {
      valueGenerator(randomDegree);
      clearInterval(rotationInterval);
      count = 0;
      resultValue = 101;
    }
  }, 10);
});

// Fonction pour lire le fichier CSV
const readCSV = (file) => {
  const reader = new FileReader();
  reader.onload = function (e) {
    const text = e.target.result;
    const rows = text.split("\n").map(row => row.split(";"));

    // Extraction des noms de participants et ajustement de la roue
    const participants = rows[0].slice(1);  // Première ligne, sauf le premier élément
    updateWheel(participants);
  };
  reader.readAsText(file);
};

// Fonction pour mettre à jour la roue en fonction des participants
const updateWheel = (participants) => {
  const numParticipants = participants.length;

  // Mise à jour des sections et couleurs
  const data = Array(numParticipants).fill(100 / numParticipants);  // Part égale pour chaque participant
  const pieColors = Array(numParticipants).fill().map((_, i) => i % 2 === 0 ? "#8b35bc" : "#b163da");

  // Mise à jour du graphique
  myChart.data.labels = participants;
  myChart.data.datasets[0].data = data;
  myChart.data.datasets[0].backgroundColor = pieColors;
  myChart.update();
};

// Ajoute un événement pour afficher le sélecteur de fichiers lors du clic sur le bouton "Import CSV"
importBtn.addEventListener('click', () => {
  fileInput.click(); // Ouvre l'explorateur de fichiers pour sélectionner un fichier CSV
});

// Lorsque le fichier est sélectionné, on le lit
fileInput.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (file) {
    readCSV(file);
  }
});
