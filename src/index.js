import { initializeApp } from 'firebase/app';
import {
  getFirestore, collection, getDocs, query, where
} from 'firebase/firestore';

document.addEventListener('DOMContentLoaded', () => {
  // Firebase configuration
  const firebaseConfig = {
    apiKey: "AIzaSyBL8WjzYYCN3YrHwM5oNicUObeVd1-1eug",
    authDomain: "agrinsight-final.firebaseapp.com",
    projectId: "agrinsight-final",
    storageBucket: "agrinsight-final.appspot.com",
    messagingSenderId: "662094576335",
    appId: "1:662094576335:web:cb56a40ba19c96304455ba"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  // Get references to the dropdown elements and table
  const stateDropdown = document.getElementById("stateDropdown");
  const districtDropdown = document.getElementById("districtDropdown");
  const cropDropdown = document.getElementById("cropDropdown");
  
  if (!stateDropdown || !districtDropdown || !cropDropdown) {
    console.error('Dropdown or table elements not found in the DOM');
    return;
  }

  // Reference to the collection
  const testdataCollection = collection(db, "crop_production(andhra&telangana");

  // Chart instance
  let chart = null;

  // Fetch and populate state dropdown
  const stateSet = new Set();
  getDocs(testdataCollection).then((querySnapshot) => {
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const stateName = data.StateName;

      if (!stateSet.has(stateName)) {
        stateSet.add(stateName);

        // Create and append state option
        const stateOption = document.createElement("option");
        stateOption.value = stateName;
        stateOption.textContent = stateName;
        stateDropdown.appendChild(stateOption);
      }
    });
  }).catch(err => {
    console.error('Error fetching documents:', err.message);
  });

  // Handle state dropdown change
  stateDropdown.addEventListener("change", () => {
    const selectedState = stateDropdown.value;
    const q = query(testdataCollection, where("StateName", "==", selectedState));

    getDocs(q).then((querySnapshot) => {
      // Clear existing options in district and crop dropdowns
      districtDropdown.innerHTML = '';
      cropDropdown.innerHTML = '';

      const districtSet = new Set();
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const district = data.District;

        if (!districtSet.has(district)) {
          districtSet.add(district);

          // Create and append new district options
          const districtOption = document.createElement("option");
          districtOption.value = district;
          districtOption.textContent = district;
          districtDropdown.appendChild(districtOption);
        }
      });
    }).catch(err => {
      console.error('Error fetching documents:', err.message);
    });
  });

  // Handle district dropdown change
  districtDropdown.addEventListener("change", () => {
    const selectedState = stateDropdown.value;
    const selectedDistrict = districtDropdown.value;
    const q = query(testdataCollection,
      where("StateName", "==", selectedState),
      where("District", "==", selectedDistrict)
    );

    getDocs(q).then((querySnapshot) => {
      // Clear existing options in crop dropdown
      cropDropdown.innerHTML = '';

      const cropSet = new Set();
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const crop = data.Crop;

        if (!cropSet.has(crop)) {
          cropSet.add(crop);

          // Create and append new crop options
          const cropOption = document.createElement("option");
          cropOption.value = crop;
          cropOption.textContent = crop;
          cropDropdown.appendChild(cropOption);
        }
      });
    }).catch(err => {
      console.error('Error fetching documents:', err.message);
    });
  });

  // Handle crop dropdown change and render chart
  cropDropdown.addEventListener("change", () => {
    const selectedState = stateDropdown.value;
    const selectedDistrict = districtDropdown.value;
    const selectedCrop = cropDropdown.value;
    const q = query(testdataCollection,
      where("StateName", "==", selectedState),
      where("District", "==", selectedDistrict),
      where("Crop", "==", selectedCrop)
    );

    getDocs(q).then((querySnapshot) => {
      // Prepare data for the chart
      const productionData = {};
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const year = data.Year;
        const production = data.Production;
        
        if (year && production) {
          if (!productionData[year]) {
            productionData[year] = 0;
          }
          productionData[year] += production;
        }
        
        // Extract and display additional data
        const seasonalText = `Season: ${data.Season || 'N/A'} and Harvest time: ${data.Harvest || 'N/A'}`;
        const rainfallText = `Rainfall level(mm/annum): ${data.Rainfall || 'N/A'} and Irrigation level(litre/day): ${data.Irrigation || 'N/A'}`;
        const soilText = `Soil requirements: ${data["Soil Requirements"] || 'N/A'} and Soil pH: ${data["Soil pH"] || 'N/A'}`;
        const costText = `Cost of cultivation: Rs.${data["Cost of cultivation"] || 'N/A'}`;
        const npktext = `NPK Ratio: ${data["NPK ratio"] || 'N/A'}`;

        document.getElementById("seasonal").innerHTML = seasonalText;
        document.getElementById("water").innerHTML = rainfallText;
        document.getElementById("soil").innerHTML = soilText;
        document.getElementById("chemical").innerHTML = npktext;
        document.getElementById("cost").innerHTML = costText;
      });

      // Prepare data for Chart.js
      const years = Object.keys(productionData).sort();
      const productions = years.map(year => productionData[year]);

      // Destroy existing chart instance if it exists
      if (chart) {
        chart.destroy();
      }

      // Render chart
      const ctx = document.getElementById('productionChart').getContext('2d');
      chart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: years,
          datasets: [{
            label: `Production(tonnes/hectare) for ${selectedCrop} in ${selectedDistrict}, ${selectedState}`,
            data: productions,
            backgroundColor: 'rgb(193, 225, 193)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
            fill: false
          }]
        },
        options: {
          scales: {
            y: {
              beginAtZero: true
            }
          },
          responsive: false,
          maintainAspectRatio: true
        }
      });
    }).catch(err => {
      console.error('Error fetching documents:', err.message);
    });
  });
});

// Select the dropdown and the ul element
const dropdown = document.getElementById('districtdd');
const list = document.getElementById('cropList');

// Function to update the list based on the selected option
function updateList(selectedOption) {
  // Clear existing list items
  list.innerHTML = '';

  // Depending on the selected option, populate the list accordingly
  switch (selectedOption) {
    case 'PRAKASAM':
      list.innerHTML = '<li>Coconut</li> <li>Rice</li> <li>Cotton</li> <li>Maize</li> <li>Mango</li>';
      break;
    case 'KRISHNA':
      list.innerHTML = '<li>Coconut</li> <li>Sugarcane</li> <li>Rice</li> <li>Cotton</li> <li>Maize</li>';
      break;
    case 'NIZAMABAD':
      list.innerHTML = '<li>Sugarcane</li> <li>Rice</li> <li>Maize</li> <li>Turmeric</li> <li>Coconut</li>';
      break;
    case 'WARANGAL':
      list.innerHTML = '<li>Cotton</li> <li>Rice</li> <li>Maize</li> <li>Turmeric</li> <li>Onion</li>';
      break;
    default:
      break;
  }
}

// Event listener for dropdown change
dropdown.addEventListener('change', function() {
  const selectedOption = dropdown.value;
  updateList(selectedOption);
});