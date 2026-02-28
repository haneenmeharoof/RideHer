let selectedDriver = null;
let arrivalProgress = 0;
let rideProgress = 0;
let rideID = null;
let currentPos = null;
let destPos = null;
let arrivalInterval = null;
let rideInterval = null;
let coordInterval = null;
// Map variables
let waitingMap = null;
let rideMap = null;
let driverMarker = null;
let pickupMarker = null;
let driverIcon = null;

const drivers = [
    { name: "Anjali ⭐ 4.8" },
    { name: "Fatima ⭐ 4.9" },
    { name: "Kavya ⭐ 4.7" }
];

window.onload = function() {
    const container = document.getElementById("drivers");

    drivers.forEach((driver, index) => {
        const div = document.createElement("div");
        div.innerText = driver.name;

        div.onclick = function() {
            document.querySelectorAll("#drivers div")
                .forEach(d => d.classList.remove("selected"));
            div.classList.add("selected");
            selectedDriver = index;
        };

        container.appendChild(div);
    });

    // initialize maps after DOM ready
    initMaps();

    // real-time geolocation watch to make pickup pointer follow user movement
    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(pos => {
            currentPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            // update pickup marker on whichever map it's on
            try {
                if (pickupMarker) {
                    try { pickupMarker.setLatLng([currentPos.lat, currentPos.lng]); } catch(e){}
                }
                if (waitingMap) waitingMap.panTo([currentPos.lat, currentPos.lng]);
                if (rideMap) rideMap.panTo([currentPos.lat, currentPos.lng]);
            } catch(e) { console.log('map update error', e); }
        }, err => {
            console.log('watchPosition error', err);
        }, { enableHighAccuracy: true, maximumAge: 3000 });
    }

    // Enter key navigation
    document.querySelectorAll("input").forEach((input, index, inputs) => {
        input.addEventListener("keydown", function(e) {
            if (e.key === "Enter") {
                e.preventDefault();
                if (inputs[index + 1]) {
                    inputs[index + 1].focus();
                }
            }
        });
    });

    // Make Enter on login submit the login form when on last field
    const loginInputs = document.querySelectorAll('#login input');
    if (loginInputs.length) {
        loginInputs.forEach((input, idx) => {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    if (idx === loginInputs.length - 1) {
                        goToBooking();
                    } else {
                        loginInputs[idx + 1].focus();
                    }
                }
            });
        });
    }
};

// LOGIN validation
function goToBooking() {
    const name = document.querySelector('#login input[placeholder="Full Name"]').value.trim();
    const phone = document.querySelector('#login input[placeholder="Phone Number"]').value.trim();
    const email = document.querySelector('#login input[placeholder="Email"]').value.trim();

    // Phone validation (numbers only, 10 digits)
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone)) {
        alert("Invalid phone number. Use 10 digits only.");
        return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert("Invalid email address.");
        return;
    }

    switchScreen("login", "booking");
}

function confirmRide() {
    if (selectedDriver === null) {
        alert("Select a driver first.");
        return;
    }

    const pickup = document.getElementById('pickup').value.trim();
    const destination = document.getElementById('destination').value.trim();
    if (!pickup || !destination) {
        alert('Enter both pickup and destination.');
        return;
    }

    // create a simple ride id
    rideID = "SR" + Math.floor(Math.random() * 100000);

    // show QR image and ride data
    document.getElementById("qrImage").src =
        "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=" + encodeURIComponent(rideID);
    document.getElementById('rideIdText').innerText = 'Ride ID: ' + rideID;
    document.getElementById('driverNameDisplay').innerText = 'Driver: ' + drivers[selectedDriver].name;
    // show driver photo (placeholder avatar)
    document.getElementById('driverPhoto').src = 'https://i.pravatar.cc/100?img=' + (10 + selectedDriver);
    document.getElementById('driverPhoto').classList.remove('hidden');

    // generate mock coordinates for live-tracking demo
    // generate mock coordinates for live-tracking demo; try to use geolocation for pickup
    const baseLat = 28.7041;
    const baseLng = 77.1025;
    const sLat = baseLat + (Math.random() - 0.5) * 0.02;
    const sLng = baseLng + (Math.random() - 0.5) * 0.02;
    const dLat = sLat + (Math.random() - 0.5) * 0.06;
    const dLng = sLng + (Math.random() - 0.5) * 0.06;
    currentPos = { lat: sLat, lng: sLng };
    destPos = { lat: dLat, lng: dLng };

    // attempt to get real device location if user allows
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
            currentPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            // recenter maps
            if (waitingMap) waitingMap.setView([currentPos.lat, currentPos.lng], 13);
        }, () => {
            // ignore error, keep mock
        }, { timeout: 4000 });
    }

    switchScreen("booking", "qrScreen");
}

function startArrival() {
    // move to waiting and simulate driver approach
    switchScreen("qrScreen", "waiting");

    document.getElementById('driverNameWaiting').innerText = 'Driver: ' + drivers[selectedDriver].name;

    let car = document.getElementById("arrivalCar");
    let arrivalTime = document.getElementById("arrivalTime");

    // Reset any existing movement
    if (arrivalInterval) clearInterval(arrivalInterval);
    arrivalProgress = 0;

    // set up map markers for realistic movement
    const driverStart = {
        lat: currentPos.lat + (Math.random() * 0.02 + 0.01),
        lng: currentPos.lng + (Math.random() * 0.02 + 0.01)
    };

    // center waiting map
    if (waitingMap) waitingMap.setView([currentPos.lat, currentPos.lng], 13);

    // add pickup marker
    if (pickupMarker) waitingMap.removeLayer(pickupMarker);
    pickupMarker = L.marker([currentPos.lat, currentPos.lng]).addTo(waitingMap).bindPopup('Pickup');

    // driver icon - use map marker pointer for realism
    driverIcon = L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41]
    });
    if (driverMarker) waitingMap.removeLayer(driverMarker);
    driverMarker = L.marker([driverStart.lat, driverStart.lng], { icon: driverIcon }).addTo(waitingMap).bindPopup('Driver');

        // ensure waiting map renders properly and shows both markers
        setTimeout(() => {
            try {
                if (waitingMap) {
                    waitingMap.invalidateSize();
                    const group = L.featureGroup([pickupMarker, driverMarker]);
                    waitingMap.fitBounds(group.getBounds(), { padding: [40, 40] });
                }
            } catch (e) { console.log('waitingMap fit error', e); }

            // set OSM iframe fallback for waiting map (shows even if Leaflet has issues)
            try {
                const wif = document.getElementById('waitingIframe');
                if (wif) {
                    const bounds = [pickupMarker.getLatLng(), driverMarker.getLatLng()];
                    const lat = (bounds[0].lat + bounds[1].lat) / 2;
                    const lng = (bounds[0].lng + bounds[1].lng) / 2;
                    const delta = 0.01;
                    const bbox = (lng - delta) + ',' + (lat - delta) + ',' + (lng + delta) + ',' + (lat + delta);
                    wif.src = 'https://www.openstreetmap.org/export/embed.html?bbox=' + bbox + '&layer=mapnik&marker=' + lat + '%2C' + lng;
                    wif.classList.remove('hidden');
                }
            } catch (e) { /* ignore */ }
        }, 200);

    // compute ETA & total demo duration in seconds (short and snappy)
    const distKm = haversine(driverStart.lat, driverStart.lng, currentPos.lat, currentPos.lng);
    // estimate seconds proportional to distance, clamp to a short demo range
    const totalArrivalSec = Math.min(12, Math.max(3, Math.round(distKm * 60)));

    // move the driver marker toward pickup over totalArrivalSec seconds
    let elapsed = 0;
    const tickMs = 200;
    const steps = Math.max(1, Math.ceil((totalArrivalSec * 1000) / tickMs));
    let step = 0;
    const startLat = driverStart.lat;
    const startLng = driverStart.lng;

    arrivalTime.innerText = totalArrivalSec + 's';
    arrivalInterval = setInterval(() => {
        step++;
        elapsed += tickMs / 1000;
        const t = Math.min(1, step / steps);
        const newLat = startLat + (currentPos.lat - startLat) * t;
        const newLng = startLng + (currentPos.lng - startLng) * t;
        driverMarker.setLatLng([newLat, newLng]);
        const remainingSec = Math.max(0, Math.ceil(totalArrivalSec - elapsed));
        arrivalTime.innerText = remainingSec + 's';

        if (t >= 1) {
            clearInterval(arrivalInterval);
            arrivalInterval = null;
            setTimeout(() => startRide(), 300);
        }
    }, tickMs);
}

function startRide() {
    switchScreen("waiting", "ride");

    document.getElementById('driverNameRide').innerText = 'Driver: ' + drivers[selectedDriver].name;

    // center ride map between pickup and destination
    if (rideMap) rideMap.setView([ (currentPos.lat + destPos.lat)/2, (currentPos.lng + destPos.lng)/2 ], 13);

    // place markers
    if (pickupMarker) rideMap.removeLayer(pickupMarker);
    pickupMarker = L.marker([currentPos.lat, currentPos.lng]).addTo(rideMap).bindPopup('Pickup');
    if (driverMarker) rideMap.removeLayer(driverMarker);
    driverMarker = L.marker([currentPos.lat, currentPos.lng], { icon: driverIcon }).addTo(rideMap).bindPopup('Driver');

    // ensure map tiles render and map fits markers
    setTimeout(() => {
        try {
            if (rideMap) {
                rideMap.invalidateSize();
                const group = L.featureGroup([pickupMarker, driverMarker]);
                rideMap.fitBounds(group.getBounds(), { padding: [40, 40] });
            }
        } catch (e) { console.log('rideMap fit error', e); }
    }, 250);

    // set OSM iframe fallback for ride map
    try {
        const rif = document.getElementById('rideIframe');
        if (rif) {
            const lat = (currentPos.lat + destPos.lat) / 2;
            const lng = (currentPos.lng + destPos.lng) / 2;
            const delta = Math.max(0.01, Math.abs(currentPos.lat - destPos.lat) + 0.01);
            const bbox = (lng - delta) + ',' + (lat - delta) + ',' + (lng + delta) + ',' + (lat + delta);
            rif.src = 'https://www.openstreetmap.org/export/embed.html?bbox=' + bbox + '&layer=mapnik&marker=' + lat + '%2C' + lng;
            rif.classList.remove('hidden');
        }
    } catch (e) { /* ignore */ }

    // compute distance and set speed for ride
    const totalDist = haversine(currentPos.lat, currentPos.lng, destPos.lat, destPos.lng);
    const rideSpeedKmph = 120; // faster for demo
    let remaining = totalDist;

    // move marker continuously over a short demo duration (seconds)
    const totalRideSec = Math.min(16, Math.max(5, Math.round(totalDist * 120)));
    let elapsed = 0;
    const tickMs = 250;
    const steps = Math.max(1, Math.ceil((totalRideSec * 1000) / tickMs));
    let step = 0;
    const startLatR = currentPos.lat;
    const startLngR = currentPos.lng;

    if (rideInterval) clearInterval(rideInterval);
    rideInterval = setInterval(() => {
        step++;
        elapsed += tickMs / 1000;
        const t = Math.min(1, step / steps);
        const newLat = startLatR + (destPos.lat - startLatR) * t;
        const newLng = startLngR + (destPos.lng - startLngR) * t;
        driverMarker.setLatLng([newLat, newLng]);

        const percent = Math.min(100, Math.round(t * 100));
        document.getElementById("progress").style.width = percent + "%";
        document.getElementById('coords').innerText = 'Lat: ' + newLat.toFixed(5) + ', Lng: ' + newLng.toFixed(5);

        if (t >= 1) {
            clearInterval(rideInterval);
            rideInterval = null;
            setTimeout(() => switchScreen("ride", "review"), 300);
        }
    }, tickMs);
}

function finishRide() {
    switchScreen("review", "thankyou");
}

function resetApp() {
    location.reload();
}

// SOS toggle
function toggleSOS() {
    document.getElementById("sosPopup").classList.toggle("hidden");
}

// SOS alert
function sendSOS(target) {
    // Simulated SOS: show alert and log; in a real app this should hit backend & notify contacts
    alert("Emergency alert sent to " + target + " 🚨");
    console.log('SOS ->', target, 'ride:', rideID, 'pos:', document.getElementById('coords')?.innerText || 'unknown');
    document.getElementById("sosPopup").classList.add('hidden');
}

// Initialize Leaflet maps
function initMaps() {
    // load Leaflet dynamically if L not present
    if (typeof L === 'undefined') {
        const s = document.createElement('script');
        s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        s.onload = () => setupMaps();
        document.head.appendChild(s);
    } else setupMaps();
}

function setupMaps() {
    waitingMap = L.map('waitingMap', { zoomControl: false }).setView([28.7041, 77.1025], 13);
    rideMap = L.map('rideMap', { zoomControl: false }).setView([28.7041, 77.1025], 13);
    // use CartoDB Voyager tiles for a cleaner look without API key
    const nice = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png', { maxZoom: 19 });
    nice.addTo(waitingMap);
    nice.addTo(rideMap);
}

// Haversine distance in kilometers
function haversine(lat1, lon1, lat2, lon2) {
    function toRad(v) { return v * Math.PI / 180; }
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// Screen switch helper
function switchScreen(hide, show) {
    document.getElementById(hide).classList.add("hidden");
    document.getElementById(show).classList.remove("hidden");
    // if maps are shown, ensure Leaflet recalculates sizes and recenters
    setTimeout(() => {
        try {
            if (show === 'waiting' && waitingMap) waitingMap.invalidateSize();
            if (show === 'ride' && rideMap) rideMap.invalidateSize();
        } catch (e) { console.log('invalidateSize error', e); }
    }, 220);
}