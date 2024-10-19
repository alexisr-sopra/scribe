const wheel = document.getElementById("wheel");
const spinBtn = document.getElementById("spin-btn");
const finalValue = document.getElementById("final-value");

// Références pour les nouveaux éléments du DOM
const importBtn = document.getElementById('import-btn');
const fileInput = document.getElementById('file-input');
const infoTableBody = document.querySelector("#info-table tbody");

let myChart = null;
let rotationValues = [];

// Display value based on the randomAngle
const valueGenerator = (angleValue) => {
  for (let i of rotationValues) {
    if (angleValue >= i.minDegree && angleValue <= i.maxDegree) {
      finalValue.innerHTML = `<p>Participant: ${i.value}</p>`;
      spinBtn.disabled = false;
      break;
    }
  }
};

// Spinner count
let count = 0;
let resultValue = 101;

// Start spinning
spinBtn.addEventListener("click", () => {
  if (!myChart) return;

  spinBtn.disabled = true;
  finalValue.innerHTML = `<p>Good Luck!</p>`;
  let randomDegree = Math.floor(Math.random() * 360);
  let rotationInterval = window.setInterval(() => {
    myChart.options.rotation = myChart.options.rotation + resultValue;
    myChart.update();
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
    const participants = rows[0].slice(1);
    updateWheel(participants);
    updateTable(participants); // Appel à la fonction pour afficher le tableau
  };
  reader.readAsText(file);
};

// Fonction pour mettre à jour la roue en fonction des participants
const updateWheel = (participants) => {
  const numParticipants = participants.length;
  const data = Array(numParticipants).fill(100 / numParticipants);
  const pieColors = Array(numParticipants).fill().map((_, i) => i % 2 === 0 ? "#0e6db5" : "#0b5791");
  const sliceAngle = 360 / numParticipants;

  rotationValues = participants.map((participant, index) => {
    let maxDegree = (90 - index * sliceAngle) % 360;
    let minDegree = (90 - (index + 1) * sliceAngle + 1) % 360;

    // Si maxDegree ou minDegree sont négatifs ou égaux à 0, on ajoute 360
    if (maxDegree <= 0) {
      maxDegree = 360 + maxDegree;
    }
    if (minDegree <= 0) {
      minDegree = 360 + minDegree;
    }

    return {
      minDegree: Math.round(minDegree),
      maxDegree: Math.round(maxDegree),
      value: participant,
    };
  });

  myChart = new Chart(wheel, {
    plugins: [ChartDataLabels],
    type: "pie",
    data: {
      labels: participants,
      datasets: [
        {
          backgroundColor: pieColors,
          data: data,
        },
      ],
    },
    options: {
      responsive: true,
      animation: { duration: 0 },
      plugins: {
        tooltip: false,
        legend: { display: false },
        datalabels: {
          color: "#ffffff",
          formatter: (_, context) => context.chart.data.labels[context.dataIndex],
          font: { size: 14 },
        },
      },
    },
  });
};

// Fonction pour mettre à jour le tableau d'informations
const updateTable = (participants) => {
  infoTableBody.innerHTML = ""; // Clear existing rows
  rotationValues.forEach(participantData => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${participantData.value}</td>
      <td>${Math.round(participantData.minDegree)}</td>
      <td>${Math.round(participantData.maxDegree)}</td>
    `;
    infoTableBody.appendChild(row);
  });
};

// Ajoute un événement pour afficher le sélecteur de fichiers lors du clic sur le bouton "Import CSV"
importBtn.addEventListener('click', () => {
  fileInput.click();
});

// Lorsque le fichier est sélectionné, on le lit
fileInput.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (file) {
    readCSV(file);
  }
});
