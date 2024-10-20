const wheel = document.getElementById("wheel");
const spinBtn = document.getElementById("spin-btn");
const finalValue = document.getElementById("final-value");

// Références pour les nouveaux éléments du DOM
const importBtn = document.getElementById('import-btn');
const fileInput = document.getElementById('file-input');
const randomAngle = document.getElementById('random-angle');
const infoTableBody = document.querySelector("#info-table tbody");

let myChart = null;
let rotationValues = [];

// Display value based on the randomAngle
const valueGenerator = (angleValue) => {
  const adjustedAngle = (angleValue - 90) % 360; // Ajout de 90 pour ajuster la comparaison
  for (let i of rotationValues) {
      if (adjustedAngle >= i.minDegree && adjustedAngle < i.maxDegree) {
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
    finalValue.innerHTML = `<p>Good Luck!</p>;`

    let randomDegree = Math.floor(Math.random() * 360);

    // Affichage de l'angle choisi
    //document.getElementById("random-angle").innerHTML = `<p>Angle choisi : ${randomDegree}°</p>;`

    let rotationInterval = window.setInterval(() => {
        myChart.options.rotation = myChart.options.rotation + resultValue;
        myChart.update();

        if (myChart.options.rotation >= 360) {
            count += 1;
            resultValue -= 5;
            myChart.options.rotation = 0;
        } else if (count > 15 && myChart.options.rotation === randomDegree) {
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
        const rows = text.trim().split("\n").map(row => row.trim().split(";"));

        // Extraction des participants et des derniers passages, en supprimant les lignes ou colonnes vides
        const participants = rows[0].slice(1).filter(participant => participant.trim() !== ""); // Ignore la première colonne (étiquette "participants") et élimine les entrées vides
        const dernierPassage = rows[1].slice(1).filter(pass => pass.trim() !== ""); // Ignore la première colonne (étiquette "dernier_passage") et élimine les entrées vides
        
        updateWheel(participants, dernierPassage);
        updateTable(participants, dernierPassage); // Appel à la fonction pour afficher le tableau avec dates de passage
    };
    reader.readAsText(file);
};

// Fonction pour mettre à jour la roue en fonction des participants
const updateWheel = (participants, dernierPassage) => {
    const numParticipants = participants.length;
    const pieColors = Array(numParticipants).fill().map((_, i) => i % 2 === 0 ? "#0e6db5" : "#0b5791");

    let totalAngles = 0;

    // Calcul initial des angles
    rotationValues = participants.map((participant, index) => {
        const lastPassage = dernierPassage[index] ? 
            new Date(dernierPassage[index].split('/').reverse().join('-')) : null;
        const currentDate = new Date();

        const weeksPassed = lastPassage ? 
            Math.floor((currentDate - lastPassage) / (7 * 24 * 60 * 60 * 1000)) : 10; 

        // Base angle et malus
        const baseAngle = 360 / numParticipants;
        const malus = 0.5 * (weeksPassed ** 2) / numParticipants;
        const totalAngle = baseAngle + malus;

        // Ajout aux plages d'angles
        totalAngles += totalAngle;

        return {
            value: participant,
            malus: malus,
            weeksPassed: weeksPassed,
            baseAngle: totalAngle // Enregistre l'angle total calculé
        };
    });

    // Calcul du facteur de correction pour que la somme des angles fasse 360°
    const correctionFactor = 360 / totalAngles;

    // Appliquer le facteur de correction et recalculer les min/max angles
    let cumulativeAngle = 0;
    rotationValues = rotationValues.map((rotation, index) => {
        const correctedAngle = rotation.baseAngle * correctionFactor; // Correction de l'angle
        const minDegree = (360 - cumulativeAngle) % 360;  // Inverser pour le sens antihoraire
        const maxDegree = (360 - (cumulativeAngle + correctedAngle)) % 360; // Inverser pour le sens antihoraire

        cumulativeAngle += correctedAngle; // Mise à jour de l'angle cumulé

        return {
            ...rotation,
            minDegree: Math.round(minDegree),
            maxDegree: Math.round(maxDegree),
            correctedAngle: correctedAngle
        };
    });

    // Correction de la plage pour le premier participant
    rotationValues[0].minDegree = 360; // Le premier participant doit aller jusqu'à 360°

    // S'assurer que toutes les plages sont positives et correctes
    for (let i = 0; i < rotationValues.length; i++) {
        if (rotationValues[i].minDegree > rotationValues[i].maxDegree) {
            // S'assurer que minDegree est toujours inférieur à maxDegree
            [rotationValues[i].minDegree, rotationValues[i].maxDegree] = [rotationValues[i].maxDegree, rotationValues[i].minDegree];
        }
    }

    // Créer un tableau de données à partir des angles corrigés
    const chartData = rotationValues.map(rotation => rotation.correctedAngle);

    // Création de la roue avec les angles corrigés
    myChart = new Chart(wheel, {
        plugins: [ChartDataLabels],
        type: "pie",
        data: {
            labels: participants,
            datasets: [
                {
                    backgroundColor: pieColors,
                    data: chartData, // Utiliser les angles corrigés comme données
                },
            ],
        },
        options: {
            responsive: true,
            animation: { duration: 0 },
            rotation: +90, // Commence à 12h en sens antihoraire
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

// Fonction pour mettre à jour le tableau d'informations avec participants et dernier passage
const updateTable = (participants, dernierPassage) => {
  infoTableBody.innerHTML = ""; // Effacer les lignes existantes
  participants.forEach((participant, index) => {
      const minAngle = rotationValues[index].minDegree;
      const maxAngle = rotationValues[index].maxDegree;
      const malus = rotationValues[index].malus; // Récupérer le malus
      const weeksPassed = rotationValues[index].weeksPassed; // Récupérer weeksPassed

      const row = document.createElement("tr");
      row.innerHTML = `
          <td>${participant}</td>
          <td>${dernierPassage[index]}</td>
          <td>${malus.toFixed(2)}°</td> <!-- Affiche le malus en degrés -->
          <td>${(maxAngle - minAngle).toFixed(2)}° (${minAngle}-${maxAngle})</td> <!-- Affiche la plage d'angles -->
          <td>${weeksPassed}</td>
      `;
      infoTableBody.appendChild(row);
  });
};

// Gestion de l'importation de fichiers CSV
importBtn.addEventListener('click', () => {
    fileInput.click(); // Simule le clic sur le champ d'entrée
});

fileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        readCSV(file); // Appeler la fonction pour lire le fichier CSV
    }
});
