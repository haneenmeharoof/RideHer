let selectedDriver = null;
let arrivalProgress = 0;
let rideProgress = 0;

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

    const rideID = "SR" + Math.floor(Math.random() * 100000);

    document.getElementById("qrImage").src =
        "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=" + rideID;

    switchScreen("booking", "qrScreen");
}

function startArrival() {
    switchScreen("qrScreen", "waiting");

    let car = document.getElementById("arrivalCar");
    let arrivalTime = document.getElementById("arrivalTime");

    let interval = setInterval(() => {
        arrivalProgress += 10;
        car.style.left = arrivalProgress + "%";
        arrivalTime.innerText = Math.max(0, 5 - Math.floor(arrivalProgress / 20));

        if (arrivalProgress >= 100) {
            clearInterval(interval);
            startRide();
        }
    }, 400);
}

function startRide() {
    switchScreen("waiting", "ride");

    let car = document.getElementById("rideCar");

    let interval = setInterval(() => {
        rideProgress += 2;
        document.getElementById("progress").style.width = rideProgress + "%";
        car.style.left = rideProgress + "%";

        if (rideProgress >= 100) {
            clearInterval(interval);
            switchScreen("ride", "review");
        }
    }, 200);
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
    alert("Emergency alert sent to " + target + " 🚨");
}

// Screen switch helper
function switchScreen(hide, show) {
    document.getElementById(hide).classList.add("hidden");
    document.getElementById(show).classList.remove("hidden");
}