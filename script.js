function getRates() {
  let city = document.getElementById("location").value;

  if (city === "hyderabad") {
    return { cement: 400, steel: 60, sand: 1200, aggregate: 1000 };
  }
  if (city === "bangalore") {
    return { cement: 430, steel: 65, sand: 1400, aggregate: 1100 };
  }
  if (city === "chennai") {
    return { cement: 410, steel: 62, sand: 1300, aggregate: 1050 };
  }
}
const cityCoordinates = {
  hyderabad: { lat: 17.3850, lng: 78.4867 },
  chennai: { lat: 13.0827, lng: 80.2707 },
  bangalore: { lat: 12.9716, lng: 77.5946 }
};

let chart;

// Main calculation function
function calculateAll() {

  // INPUTS
  let l = Number(document.getElementById("length").value);
  let w = Number(document.getElementById("width").value);
  let f = Number(document.getElementById("floors").value);
  let budget = Number(document.getElementById("budget").value);

  if (l <= 0 || w <= 0 || f <= 0) {
    alert("Please enter valid building dimensions");
    return;
  }

  // BUILT-UP AREA
  let areaSqft = l * w * f * 10.764;

  // MATERIAL QUANTITIES (thumb rules)
  let cement = areaSqft * 0.4;      // bags
  let steel = areaSqft * 3.5;       // kg
  let sand = areaSqft * 0.018;      // m3
  let aggregate = areaSqft * 0.036; // m3

  // MATERIAL RATES (₹)
  let cementRate = 400;
  let steelRate = 60;
  let sandRate = 1200;
  let aggregateRate = 1000;

  // COST CALCULATION
  // GET LOCATION-BASED RATES
let rates = getRates();

// COST CALCULATION USING LOCATION
let cementCost = cement * rates.cement;
let steelCost = steel * rates.steel;
let sandCost = sand * rates.sand;
let aggregateCost = aggregate * rates.aggregate;


  let totalCost = cementCost + steelCost + sandCost + aggregateCost;
if (budget > 0) {
  drawBudgetChart(budget, totalCost);
}

  // DISPLAY BUILT-UP AREA
  document.getElementById("areaResult").innerText =
    "Built-up Area: " + areaSqft.toFixed(2) + " sq.ft";

  // DISPLAY MATERIAL QUANTITIES
  document.getElementById("materialResult").innerHTML =
    `Cement: ${cement.toFixed(0)} bags<br>
     Steel: ${steel.toFixed(0)} kg<br>
     Sand: ${sand.toFixed(2)} m³<br>
     Aggregate: ${aggregate.toFixed(2)} m³`;

  // DISPLAY TOTAL COST
  document.getElementById("totalCost").innerText =
    "Estimated Construction Cost: ₹" + totalCost.toFixed(0);

  // BUDGET COMPARISON
  if (budget > 0) {
    let diff = budget - totalCost;
    if (diff >= 0) {
      document.getElementById("budgetResult").innerText =
        "Within Budget ✔ Savings: ₹" + diff.toFixed(0);
    } else {
      document.getElementById("budgetResult").innerText =
        "Over Budget ❌ Extra Required: ₹" + Math.abs(diff).toFixed(0);
    }
  } else {
    document.getElementById("budgetResult").innerText =
      "Enter budget to compare";
  }

  // DRAW COST DISTRIBUTION CHART
  drawChart(cementCost, steelCost, sandCost, aggregateCost);

  // SAVE DATA FOR BOQ
  window.boqData = {
    areaSqft,
    cement,
    steel,
    sand,
    aggregate,
    totalCost
  };
  // SAVE GREEN BUILDING SELECTIONS
window.greenFeatures = {
  flyash: document.getElementById("flyash").checked,
  aac: document.getElementById("aac").checked,
  solar: document.getElementById("solar").checked
};
let city = document.getElementById("location").value;
showMaterialRecommendations(city);
calculateCarbonFootprint();
}
calculateGreenRating();
updateKPIs();

// CHART FUNCTION
function drawChart(cement, steel, sand, aggregate) {

  if (chart) chart.destroy();

  chart = new Chart(document.getElementById("costChart"), {
    type: "doughnut",
    data: {
      labels: ["Cement", "Steel", "Sand", "Aggregate"],
      datasets: [{
        data: [cement, steel, sand, aggregate],
        backgroundColor: [
          "#e53935",
          "#3949ab",
          "#f9a825",
          "#6d4c41"
        ]
      }]
    },
    options: {
      plugins: {
        legend: {
          position: "bottom"
        }
      }
    }
  });
}

function downloadBOQ() {

  if (!window.boqData) {
    alert("Please calculate estimation first");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
doc.setFont("helvetica", "normal");
doc.setFontSize(10);

  let y = 20;

  // ================= TITLE =================
  doc.setFontSize(16);
  doc.text("BILL OF QUANTITIES (BOQ)", 20, y);
  y += 12;

  // ================= PROJECT INFO =================
  doc.setFontSize(11);
  doc.text("Project Location:", 20, y);
  y += 8;

  if (window.projectLat && window.projectLng) {
    doc.text(
      `Latitude: ${window.projectLat.toFixed(5)}, Longitude: ${window.projectLng.toFixed(5)}`,
      20,
      y
    );
  } else {
    doc.text("Location not selected", 20, y);
  }

  y += 12;

  // ================= BOQ TABLE HEADER =================
  doc.setFontSize(12);
  doc.text("Material BOQ Table", 20, y);
  y += 8;

  doc.setFontSize(10);
  doc.text("Item", 20, y);
  doc.text("Quantity", 80, y);
  doc.text("Unit", 120, y);
  doc.text("Remarks", 150, y);
  y += 4;

  doc.line(20, y, 190, y);
  y += 8;

  // ================= BOQ TABLE ROWS =================
  doc.text("Cement", 20, y);
  doc.text(window.boqData.cement.toFixed(0), 80, y);
  doc.text("Bags", 120, y);
  doc.text("OPC / PPC", 150, y);
  y += 8;

  doc.text("Steel", 20, y);
  doc.text(window.boqData.steel.toFixed(0), 80, y);
  doc.text("Kg", 120, y);
  doc.text("TMT Bars", 150, y);
  y += 8;

  doc.text("Sand", 20, y);
  doc.text(window.boqData.sand.toFixed(2), 80, y);
  doc.text("m³", 120, y);
  doc.text("M-Sand / River", 150, y);
  y += 8;

  doc.text("Aggregate", 20, y);
  doc.text(window.boqData.aggregate.toFixed(2), 80, y);
  doc.text("m³", 120, y);
  doc.text("20mm", 150, y);
  y += 12;

  // ================= TOTAL COST =================
  doc.setFontSize(12);
  doc.text(
    "Total Estimated Cost: Rs. " + Math.round(window.boqData.totalCost),
    20,
    y
  );
  y += 12;

  // ================= GREEN BUILDING FEATURES =================
  doc.setFontSize(12);
  doc.text("Green Building Features:", 20, y);
  y += 8;

  doc.setFontSize(10);
  let hasGreen = false;

  if (window.greenFeatures?.flyash) {
    doc.text("- Fly ash bricks", 20, y);
    y += 6;
    hasGreen = true;
  }
  if (window.greenFeatures?.aac) {
    doc.text("- AAC blocks", 20, y);
    y += 6;
    hasGreen = true;
  }
  if (window.greenFeatures?.solar) {
    doc.text("- Solar panels", 20, y);
    y += 6;
    hasGreen = true;
  }

  if (!hasGreen) {
    doc.text("- No green building features selected", 20, y);
    y += 6;
  }

  y += 8;

  // ================= GREEN RATING =================
doc.setFontSize(12);
doc.text("Green Building Rating:", 20, y);
y += 8;

doc.setFontSize(10);

let ratingText = "Rating: ";

if (window.greenFeatures?.solar && window.greenFeatures?.aac && window.greenFeatures?.flyash) {
  ratingText += "Excellent (5/5)";
} else if (
  (window.greenFeatures?.solar && window.greenFeatures?.aac) ||
  (window.greenFeatures?.solar && window.greenFeatures?.flyash)
) {
  ratingText += "Very Good (4/5)";
} else if (
  window.greenFeatures?.solar ||
  window.greenFeatures?.aac ||
  window.greenFeatures?.flyash
) {
  ratingText += "Good (3/5)";
} else {
  ratingText += "Basic (2/5)";
}

doc.text(ratingText, 20, y);
y += 10;


  // ================= CARBON FOOTPRINT =================
doc.setFontSize(12);
doc.text("Carbon Footprint Summary:", 20, y);
y += 8;

doc.setFontSize(10);
doc.text(
  "Estimated Carbon Emission: " + window.carbonData.total.toFixed(2) + " units",
  20,
  y
);
y += 6;

doc.text(
  "Carbon Reduction Achieved: " + window.carbonData.reduction + " percent",
  20,
  y
);


  // ================= SAVE =================
  doc.save("Construction_BOQ_Final.pdf");
  alert("BOQ PDF downloaded successfully");
}


let budgetChart;

function drawBudgetChart(budget, actual) {

  if (budgetChart) budgetChart.destroy();

  budgetChart = new Chart(document.getElementById("budgetChart"), {
    type: "bar",
    data: {
      labels: ["Budget", "Estimated Cost"],
      datasets: [{
        data: [budget, actual],
        backgroundColor: ["#2e7d32", "#c62828"]
      }]
    },
    options: {
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}
let marker;        // project marker
let map;           // map object
let supplierMarkers = []; // store supplier markers

function initMap() {

  const defaultLocation = { lat: 17.3850, lng: 78.4867 };

  map = new google.maps.Map(document.getElementById("map"), {
    zoom: 12,
    center: defaultLocation
  });

  // Project location marker
  marker = new google.maps.Marker({
    position: defaultLocation,
    map: map,
    title: "Construction Project Site",
    icon: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
  });

  document.getElementById("coords").innerText =
    "Latitude: " + defaultLocation.lat +
    " | Longitude: " + defaultLocation.lng;

  // Click to select project location
  map.addListener("click", function (event) {
    const clickedLocation = event.latLng;

    marker.setPosition(clickedLocation);
    map.setCenter(clickedLocation);

    window.projectLat = clickedLocation.lat();
    window.projectLng = clickedLocation.lng();

    document.getElementById("coords").innerText =
      "Latitude: " + window.projectLat.toFixed(6) +
      " | Longitude: " + window.projectLng.toFixed(6);

    // Show supplier markers near project
    showSupplierMarkers(window.projectLat, window.projectLng);
  });
  // Show suppliers for default location
showSupplierMarkers(defaultLocation.lat, defaultLocation.lng);
}
function showSupplierMarkers(lat, lng) {

  // Clear old markers
  supplierMarkers.forEach(m => m.setMap(null));
  supplierMarkers = [];

  // MULTIPLE SHOPS DATA (DEMO)
  const suppliers = [
    // Cement shops
    {
      name: "Cement Shop A",
      type: "Cement",
      position: { lat: lat + 0.010, lng: lng + 0.008 },
      icon: "https://maps.google.com/mapfiles/ms/icons/red-dot.png"
    },
    {
      name: "Cement Shop B",
      type: "Cement",
      position: { lat: lat - 0.012, lng: lng + 0.010 },
      icon: "https://maps.google.com/mapfiles/ms/icons/red-dot.png"
    },

    // Steel shops
    {
      name: "Steel Supplier X",
      type: "Steel",
      position: { lat: lat + 0.015, lng: lng - 0.010 },
      icon: "https://maps.google.com/mapfiles/ms/icons/green-dot.png"
    },
    {
      name: "Steel Supplier Y",
      type: "Steel",
      position: { lat: lat - 0.014, lng: lng - 0.012 },
      icon: "https://maps.google.com/mapfiles/ms/icons/green-dot.png"
    },

    // Sand suppliers
    {
      name: "Sand Yard 1",
      type: "Sand",
      position: { lat: lat + 0.018, lng: lng + 0.014 },
      icon: "https://maps.google.com/mapfiles/ms/icons/yellow-dot.png"
    },
    {
      name: "Sand Yard 2",
      type: "Sand",
      position: { lat: lat - 0.016, lng: lng + 0.016 },
      icon: "https://maps.google.com/mapfiles/ms/icons/yellow-dot.png"
    }
  ];

  // ADD ALL MARKERS
  suppliers.forEach(shop => {

    const m = new google.maps.Marker({
      position: shop.position,
      map: map,
      title: shop.name,
      icon: shop.icon
    });

    const info = new google.maps.InfoWindow({
      content: `
        <strong>${shop.name}</strong><br>
        Material: ${shop.type}<br>
        Distance: Nearby
      `
    });

    m.addListener("click", () => {
      info.open(map, m);
    });

    supplierMarkers.push(m);
  });
}
function showMaterialRecommendations(city) {

  let suggestions = [];

  if (city === "hyderabad") {
    suggestions = [
      "Use Fly Ash Bricks – locally available",
      "Prefer M-Sand due to sand regulations",
      "OPC 53 grade cement recommended",
      "TMT Fe 500 steel suitable for RCC"
    ];
  }

  if (city === "bangalore") {
    suggestions = [
      "Use AAC blocks – better thermal performance",
      "M-Sand preferred over river sand",
      "PPC cement suitable for moderate climate",
      "Fe 500D steel recommended"
    ];
  }

  if (city === "chennai") {
    suggestions = [
      "Use corrosion-resistant steel",
      "PPC cement preferred (coastal climate)",
      "M-Sand recommended",
      "Waterproofing additives suggested"
    ];
  }

  let list = document.getElementById("materialSuggestions");
  list.innerHTML = "";

  suggestions.forEach(item => {
    let li = document.createElement("li");
    li.innerText = item;
    list.appendChild(li);
  });
}
function calculateDistance(lat1, lon1, lat2, lon2) {

  const R = 6371; // Earth radius in km

  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // distance in km
}
function calculateCarbonFootprint() {

  if (!window.boqData) return;

  // Base carbon values (relative units)
  let cementCO2 = window.boqData.cement * 0.9;
  let steelCO2 = window.boqData.steel * 0.02;

  let totalCO2 = cementCO2 + steelCO2;
  let savedCO2 = 0;

  // Apply green building reductions
  if (window.greenFeatures?.flyash) {
    savedCO2 += cementCO2 * 0.25; // 25% reduction
  }

  if (window.greenFeatures?.aac) {
    savedCO2 += cementCO2 * 0.15; // 15% reduction
  }

  if (window.greenFeatures?.solar) {
    savedCO2 += totalCO2 * 0.20; // operational saving
  }

  let finalCO2 = totalCO2 - savedCO2;
  let savingPercent = ((savedCO2 / totalCO2) * 100).toFixed(1);

  document.getElementById("carbonResult").innerHTML =
    `Estimated CO₂ Emission: <b>${finalCO2.toFixed(2)}</b> units<br>
     Carbon Reduction: <b>${savingPercent}%</b>`;
     // Save carbon data for BOQ
window.carbonData = {
  total: finalCO2,
  reduction: savingPercent
};
}
google.charts.load("current", { packages: ["corechart"] });
google.charts.setOnLoadCallback(() => {
  drawMaterialChart();
  drawCarbonChart();
});
function drawMaterialChart() {

  if (!window.boqData) return;

  const data = google.visualization.arrayToDataTable([
    ["Material", "Quantity"],
    ["Cement (bags)", window.boqData.cement],
    ["Steel (kg)", window.boqData.steel],
    ["Sand (m3)", window.boqData.sand],
    ["Aggregate (m3)", window.boqData.aggregate]
  ]);

  const options = {
    title: "Material Quantity Distribution",
    pieHole: 0.4
  };

  const chart = new google.visualization.PieChart(
    document.getElementById("materialChart")
  );

  chart.draw(data, options);
}
function drawBudgetChart() {

  if (!window.boqData) return;

  const budget = window.boqData.totalCost * 1.1; // assumed budget
  const actual = window.boqData.totalCost;

  const data = google.visualization.arrayToDataTable([
    ["Type", "Cost"],
    ["Budget", budget],
    ["Actual", actual]
  ]);

  const options = {
    title: "Budget vs Actual Cost",
    bars: "vertical"
  };

  const chart = new google.visualization.ColumnChart(
    document.getElementById("budgetChart")
  );

  chart.draw(data, options);
}
function showChart(type) {

  const charts = {
    material: "materialChart",
    budget: "budgetChart",
    carbon: "carbonChart"
  };

  // Hide all charts
  document.querySelectorAll(".chart-view").forEach(c => {
    c.classList.add("hidden");
  });

  // Show selected chart
  document.getElementById(charts[type]).classList.remove("hidden");

  // Update active button
  document.querySelectorAll(".tab-buttons button").forEach(btn => {
    btn.classList.remove("active");
  });

  event.target.classList.add("active");
}
function calculateGreenRating() {

  let score = 0;

 if (document.getElementById("flyash").checked) score += 15;
if (document.getElementById("aac").checked) score += 15;
if (document.getElementById("solar").checked) score += 25;
if (document.getElementById("rainwater")?.checked) score += 15;
if (document.getElementById("lowvoc")?.checked) score += 10;
if (document.getElementById("recycledsteel")?.checked) score += 10;
if (document.getElementById("insulation")?.checked) score += 10;


  let stars = "★☆☆☆☆";
  let label = "Poor";

  if (score >= 80) {
    stars = "★★★★★";
    label = "Excellent";
  } else if (score >= 60) {
    stars = "★★★★☆";
    label = "Very Good";
  } else if (score >= 40) {
    stars = "★★★☆☆";
    label = "Good";
  }

  document.getElementById("greenRating").innerHTML =
    `🌱 Rating: <b>${stars}</b> <br> <small>${label}</small>`;
}
function updateMapByCity(city) {

  const location = cityCoordinates[city];
  if (!location || !map || !marker) return;

  // Move map
  map.setCenter(location);
  // Remove old boundary
if (cityCircle) cityCircle.setMap(null);

// Draw city boundary
cityCircle = new google.maps.Circle({
  strokeColor: "#2e7d32",
  strokeOpacity: 0.8,
  strokeWeight: 2,
  fillColor: "#a5d6a7",
  fillOpacity: 0.2,
  map: map,
  center: location,
  radius: cityBoundaryRadius[city]
});

  map.setZoom(cityZoom[city] || 12);

  // Move project marker
  marker.setPosition(location);

  // Save project location
  window.projectLat = location.lat;
  window.projectLng = location.lng;

  // Update coordinates text
  document.getElementById("coords").innerText =
    "Latitude: " + location.lat.toFixed(6) +
    " | Longitude: " + location.lng.toFixed(6);

  // Refresh supplier markers
  showSupplierMarkers(location.lat, location.lng);
  showClimateWarning(city);

}
const cityZoom = {
  hyderabad: 11,
  bangalore: 12,
  chennai: 11
};
let cityCircle;

const cityBoundaryRadius = {
  hyderabad: 15000,
  bangalore: 12000,
  chennai: 14000
};
function showClimateWarning(city) {

  let message = "Select a city to view climate advisory";

  if (city === "chennai") {
    message =
      "⚠️ Coastal climate detected: Use corrosion-resistant steel, PPC cement, and waterproofing additives.";
  } 
  else if (city === "bangalore") {
    message =
      "🌧️ Moderate rainfall zone: Ensure proper drainage and AAC blocks for thermal comfort.";
  } 
  else if (city === "hyderabad") {
    message =
      "☀️ Hot-dry climate: Fly ash bricks, reflective roofing, and thermal insulation are recommended.";
  }

  document.getElementById("climateWarning").innerText = message;
}
function updateKPIs() {

  // Total cost
  if (window.boqData) {
    document.getElementById("kpiCost").innerText =
      "Rs. " + Math.round(window.boqData.totalCost);
  }

  // Green rating
  if (window.greenFeatures) {
    let score = 0;
    if (window.greenFeatures.flyash) score += 30;
    if (window.greenFeatures.aac) score += 30;
    if (window.greenFeatures.solar) score += 40;

    let rating = "Basic";
    if (score >= 80) rating = "Excellent";
    else if (score >= 60) rating = "Very Good";
    else if (score >= 40) rating = "Good";

    document.getElementById("kpiRating").innerText = rating;
  }

  // Carbon reduction
  if (window.carbonData) {
    document.getElementById("kpiCarbon").innerText =
      window.carbonData.reduction + "%";
  }

  // Nearest supplier (safe placeholder)
  document.getElementById("kpiDistance").innerText = "2.1 km";
}
function animateValue(id, start, end) {
  const el = document.getElementById(id);
  let current = start;
  const step = Math.max(1, Math.floor((end - start) / 30));

  const interval = setInterval(() => {
    current += step;
    if (current >= end) {
      el.innerText = "Rs. " + end;
      clearInterval(interval);
    } else {
      el.innerText = "Rs. " + current;
    }
  }, 20);
}
// ===== Step 4: Empty-state messages (run on page load) =====
document.getElementById("materialResult").innerText =
  "Enter building details and click Calculate to see material quantities.";

document.getElementById("totalCost").innerText = "—";

document.getElementById("carbonResult").innerText =
  "Select green options and calculate to view carbon impact.";


