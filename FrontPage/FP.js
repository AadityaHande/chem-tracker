// Retrieve stored chemicals or initialize to an empty array
let chemicals = JSON.parse(localStorage.getItem("chemicals")) || [];
// Global flag to indicate if the current user has editing privileges (admin or teacher)
let allowedToEdit = false;

/* --------------------- Firebase Authentication & Role Checking --------------------- */
// This function listens for authentication state changes and retrieves the user's custom claims.
function initAuth() {
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            // Update UI with Firebase user details: display email and role (no name)
            document.getElementById("userEmail").innerText = user.email;
            if (user.photoURL) {
                document.getElementById("userAvatar").src = user.photoURL;
            }
            // Force token refresh to retrieve the latest custom claims (admin/teacher)
            user.getIdTokenResult(true)
                .then((idTokenResult) => {
                    let roleText = "User"; // default role
                    if (idTokenResult.claims.admin) {
                        allowedToEdit = true;
                        roleText = "Admin";
                    } else if (idTokenResult.claims.teacher) {
                        allowedToEdit = true;
                        roleText = "Teacher";
                    } else {
                        allowedToEdit = false;
                    }
                    // Update the role element in the header
                    document.getElementById("userRole").innerText = roleText;
                    
                    // Optionally, show/hide the add button based on role
                    let addBtn = document.getElementById("addChemicalBtn");
                    if (allowedToEdit && addBtn) {
                        addBtn.style.display = "block";
                    } else if (addBtn) {
                        addBtn.style.display = "none";
                    }
                })
                .catch((error) => {
                    console.error("Error retrieving token claims:", error);
                });
        } else {
            // User is not signed in; redirect to login page.
            window.location.href = "../login/login.html";
        }
    });
}

/* --------------------- Chemical Tracker Functions --------------------- */

function searchChemicals() {
    let searchQuery = document.getElementById("searchBar").value.toLowerCase();
    let filteredChemicals = chemicals.filter(chem => chem.name.toLowerCase().includes(searchQuery));
    displayChemicals(filteredChemicals);
}

function sortChemicals() {
    let sortBy = document.getElementById("sort").value;
    chemicals.sort((a, b) => {
        let quantityA = convertToBaseUnit(a.quantity, a.unit);
        let quantityB = convertToBaseUnit(b.quantity, b.unit);
        if (sortBy === "low-quantity") {
            return quantityA - quantityB;
        } else if (sortBy === "high-quantity") {
            return quantityB - quantityA;
        } else if (sortBy === "latest-time") {
            return new Date(b.time) - new Date(a.time);
        }
    });
    saveToLocalStorage();
    displayChemicals(chemicals);
}

function displayChemicals(list) {
    const chemicalList = document.getElementById("chemicalList");
    chemicalList.innerHTML = "";
    list.forEach((chem) => {
        chemicalList.innerHTML += `
            <li class="chemical-item">
                <span>${chem.name} - ${chem.quantity} ${chem.unit}</span>
                <div>
                    <button class="edit-btn" onclick="editChemical('${chem.name}')">Edit</button>
                    <button class="add-btn" onclick="addQuantity('${chem.name}')">Add</button>
                    <button class="delete-btn" onclick="deleteChemical('${chem.name}')">Delete</button>
                </div>
            </li>`;
    });
}

function addChemical() {
    if (!allowedToEdit) {
        alert("You do not have permission to add chemicals.");
        return;
    }
    let name = prompt("Enter chemical name:");
    let quantity = parseFloat(prompt("Enter quantity:"));
    let unit = prompt("Enter unit (ml, litre, g, kg, etc.):").toLowerCase();
    let time = new Date().toISOString();

    if (!name || isNaN(quantity) || !unit) {
        alert("Invalid input!");
        return;
    }

    let exists = chemicals.some(chem => chem.name.toLowerCase() === name.toLowerCase());
    if (exists) {
        alert("Chemical already exists!");
        return;
    }

    chemicals.push({ name, quantity, unit, time });
    saveToLocalStorage();
    displayChemicals(chemicals);
}

function editChemical(name) {
    if (!allowedToEdit) {
        alert("You do not have permission to edit chemicals.");
        return;
    }
    let chemical = chemicals.find(chem => chem.name === name);
    if (!chemical) {
        alert("Chemical not found!");
        return;
    }

    let newQuantity = parseFloat(prompt(`Enter new quantity for ${name} (${chemical.unit}):`));
    let newUnit = prompt(`Enter new unit for ${name} (${chemical.unit}):`).toLowerCase();

    if (isNaN(newQuantity) || newQuantity < 0 || !newUnit) {
        alert("Invalid input!");
        return;
    }

    chemical.quantity = newQuantity;
    chemical.unit = newUnit;
    chemical.time = new Date().toISOString();
    saveToLocalStorage();
    displayChemicals(chemicals);
}

function addQuantity(name) {
    if (!allowedToEdit) {
        alert("You do not have permission to add quantity.");
        return;
    }
    let chemical = chemicals.find(chem => chem.name === name);
    if (!chemical) {
        alert("Chemical not found!");
        return;
    }

    let additionalQuantity = parseFloat(prompt(`Enter quantity to add for ${name} (${chemical.unit}):`));
    if (isNaN(additionalQuantity) || additionalQuantity <= 0) {
        alert("Invalid quantity!");
        return;
    }

    // Ask user for unit selection
    let selectedUnit = prompt("Select unit: ml, litre, g, kg").toLowerCase();
    const validUnits = ["ml", "litre", "g", "kg"];

    if (!validUnits.includes(selectedUnit)) {
        alert("Invalid unit! Please enter ml, litre, g, or kg.");
        return;
    }

    // Convert existing and new quantity to a common base unit
    let baseCurrent = convertToBaseUnit(chemical.quantity, chemical.unit);
    let baseNew = convertToBaseUnit(additionalQuantity, selectedUnit);
    
    // Update stored quantity and set the latest unit used
    chemical.quantity = (baseCurrent + baseNew) / convertToBaseUnit(1, selectedUnit);
    chemical.unit = selectedUnit;
    chemical.time = new Date().toISOString();

    saveToLocalStorage();
    displayChemicals(chemicals);
}

function deleteChemical(name) {
    if (!allowedToEdit) {
        alert("You do not have permission to delete chemicals.");
        return;
    }
    chemicals = chemicals.filter(chem => chem.name !== name);
    saveToLocalStorage();
    displayChemicals(chemicals);
}

function saveToLocalStorage() {
    localStorage.setItem("chemicals", JSON.stringify(chemicals));
}

function loadFromLocalStorage() {
    let storedChemicals = localStorage.getItem("chemicals");
    if (storedChemicals) {
        chemicals = JSON.parse(storedChemicals);
        displayChemicals(chemicals);
    }
}

function toggleDarkMode() {
    document.body.classList.toggle("dark-mode");
    let mode = document.body.classList.contains("dark-mode") ? "dark" : "light";
    localStorage.setItem("theme", mode);
}

// Converts a quantity to a base unit value for comparison (ml for liquids, g for solids)
function convertToBaseUnit(quantity, unit) {
    const unitConversion = {
        "ml": 1,
        "litre": 1000,
        "g": 1,
        "kg": 1000,
    };
    return quantity * (unitConversion[unit] || 1);
}

/* --------------------- Window Load --------------------- */
window.onload = function () {
    // Initialize Firebase authentication and role check
    initAuth();
    // Load chemicals from local storage
    loadFromLocalStorage();
    // Apply dark mode if previously set
    if (localStorage.getItem("theme") === "dark") {
        document.body.classList.add("dark-mode");
    }
};
