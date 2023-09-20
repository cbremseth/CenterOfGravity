//Initialize map
var map = L.map("map").setView([40.04443758460859, -101], 4);

//Set up some variables
let lastLatLng = null;
let resultMarker = null;
let markers = [];
const popup = L.popup();

//Add tilelayer to map
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution:
    '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(map);

//Handle map clicks
function onMapClick(e) {
  lastLatLng = e.latlng;
  addLocationToMarkers(lastLatLng);
}

//Calculation functions

//Calculate distance
function distance(x1, y1, x2, y2) {
  return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
}

//Calculate midpoint of two points
function midpoint(markers) {
  let x = 0;
  let y = 0;

  for (const [px, py] of markers) {
    x += px;
    y += py;
  }
  x /= 2;
  y /= 2;
  return [x, y];
}

//Weiszfeld algorithm for calculating geometric median
function geometricMedian(markers, tolerance = 1e-6) {
  let x = 0,
    y = 0;

  for (const [px, py] of markers) {
    x += px;
    y += py;
  }
  x /= markers.length;
  y /= markers.length;

  let diff = tolerance + 1;

  while (diff > tolerance) {
    let numX = 0,
      numY = 0,
      den = 0;

    for (const [px, py] of markers) {
      const d = distance(x, y, px, py);
      if (d !== 0) {
        const w = 1 / d;
        numX += w * px;
        numY += w * py;
        den += w;
      }
    }

    const newX = numX / den;
    const newY = numY / den;
    diff = distance(x, y, newX, newY);

    x = newX;
    y = newY;
  }

  return [x, y];
}

// Leaflet markers for map
let leafletMarkers = [];

// Function to add a new point input to the form
function addPointInput(lat, lng) {
  const container = document.getElementById("pointsContainer");
  const pointDiv = document.createElement("div");
  const deleteButton = document.createElement("button");

  deleteButton.textContent = "Delete";
  deleteButton.type = "button";
  deleteButton.addEventListener("click", function () {
    // Remove the div and find the corresponding marker to remove it
    pointDiv.remove();
    const index = markers.findIndex(
      (marker) => marker[0] === lat && marker[1] === lng
    );
    if (index > -1) {
      markers.splice(index, 1);
      leafletMarkers[index].remove();
      leafletMarkers.splice(index, 1);
    }
  });

  pointDiv.innerHTML = `
    Latitude: <input type="text" class="lat-input" value="${lat}">
    Longitude: <input type="text" class="lng-input" value="${lng}">
  `;
  pointDiv.appendChild(deleteButton);
  container.appendChild(pointDiv);

  // Return the reference to the form row
  return pointDiv;
}

// Update the form when adding a new marker
function addLocationToMarkers(location) {
  const latLng = [location.lat, location.lng];
  markers.push(latLng);

  // Create the form row and get its reference
  const pointDiv = addPointInput(location.lat, location.lng);

  // Add a marker to the map at the given location and get its reference
  const leafletMarker = L.marker(latLng).addTo(map);
  leafletMarkers.push(leafletMarker);

  // Attach a click event to the marker
  leafletMarker.on("click", function () {
    const index = leafletMarkers.indexOf(leafletMarker);
    if (index > -1) {
      // Remove the marker and its form row
      leafletMarkers.splice(index, 1);
      markers.splice(index, 1);
      leafletMarker.remove();
      pointDiv.remove();
    }
  });
}

// Function to calculate midpoint or geometric median based on form data
function calculateFromForm() {
  const latInputs = document.querySelectorAll(".lat-input");
  const lngInputs = document.querySelectorAll(".lng-input");
  const points = [];

  if (latInputs.length < 2) {
    alert("Must have at least two points!");
    return;
  }
  for (let i = 0; i < latInputs.length; i++) {
    const lat = parseFloat(latInputs[i].value);
    const lng = parseFloat(lngInputs[i].value);
    points.push([lat, lng]);
  }

  let result;
  if (points.length === 2) {
    result = midpoint(points);
  } else if (points.length > 2) {
    result = geometricMedian(points);
  }

  if (result) {
    console.log(`Result: (${result[0]}, ${result[1]})`);
    resultMarker = L.marker([result[0], result[1]]);
    resultMarker.addTo(map);
    // Display the result in the resultField
    document.getElementById(
      "resultField"
    ).textContent = `Result Point: Latitude ${result[0]}, Longitude ${result[1]}`;
  }
}
// Function to add a point from the input fields
function addPointFromInput() {
  const lat = parseFloat(document.getElementById("newLat").value);
  const lng = parseFloat(document.getElementById("newLng").value);
  if (!isNaN(lat) && !isNaN(lng)) {
    addLocationToMarkers({ lat, lng });
  }
}

function resetAll() {
  // Remove all markers from the map
  for (const marker of leafletMarkers) {
    marker.remove();
  }
  // Clear the markers arrays
  markers = [];
  leafletMarkers = [];
  resultMarker.remove();
  resultMarker = null;
  // Clear the form
  const pointsContainer = document.getElementById("pointsContainer");
  while (pointsContainer.firstChild) {
    pointsContainer.removeChild(pointsContainer.firstChild);
  }
  // Clear the result field
  document.getElementById("resultField").textContent = "";
}

// Attach an event listener to the "Calculate" button
document
  .getElementById("calculateButton")
  .addEventListener("click", calculateFromForm);

// Attach event listener to the "Add" button for adding points manually
document
  .getElementById("addPointButton")
  .addEventListener("click", addPointFromInput);

document.getElementById("resetButton").addEventListener("click", resetAll);

// Attach the map click event
map.on("click", onMapClick);
