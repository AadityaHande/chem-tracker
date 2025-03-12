// 🔥 Firebase Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// 🔐 Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyA7YubYlcBTuXYcLm7zH0W5JD0S0QqP3bI",
  authDomain: "chem-trial.firebaseapp.com",
  projectId: "chem-trial",
  storageBucket: "chem-trial.firebasestorage.app",
  messagingSenderId: "774165499720",
  appId: "1:774165499720:web:397fccc1491b053830ed7d"
};

// 🔧 Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentRole = null;

// 🔄 Check Auth State
onAuthStateChanged(auth, async (user) => {
  if (user) {
    document.getElementById("username").innerText = user.displayName || "N/A";
    document.getElementById("useremail").innerText = user.email;

    const docRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      currentRole = docSnap.data().role || "unknown";
      document.getElementById("userrole").innerText = currentRole;

      if (currentRole === "admin") {
        document.getElementById("admin-section").style.display = "block";
        document.getElementById("add-chemical-form").style.display = "block";
      } else {
        document.getElementById("teacher-section").style.display = "block";
      }

      loadChemicals(currentRole);
    } else {
      document.getElementById("userrole").innerText = "Unknown (No Role Found)";
    }
  } else {
    window.location.href = "login.html";
  }
});

// 🔽 Load Chemicals
async function loadChemicals(role) {
  const chemTable = document.getElementById("chemicalTableBody");
  chemTable.innerHTML = "";

  const searchQuery = document.getElementById("searchInput")?.value?.toLowerCase() || "";
  const filterCategory = document.getElementById("filterCategory")?.value || "all";
  const sortBy = document.getElementById("sortSelect")?.value || "";

  let chemSnapshot = await getDocs(collection(db, "chemicals"));
  let chemList = [];

  chemSnapshot.forEach((docItem) => {
    const data = docItem.data();
    chemList.push({ id: docItem.id, ...data });
  });

  // Filter & Search
  chemList = chemList.filter(item => {
    const matchName = item.name.toLowerCase().includes(searchQuery);
    const matchCategory = filterCategory === "all" || item.category === filterCategory;
    return matchName && matchCategory;
  });

  // Sort
  if (sortBy === "name") {
    chemList.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortBy === "quantity") {
    chemList.sort((a, b) => Number(a.quantity) - Number(b.quantity));
  } else if (sortBy === "expiryDate") {
    chemList.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
  }

  // Render Table
  chemList.forEach(data => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${data.name}</td>
      <td>${data.quantity}</td>
      <td>${data.category}</td>
      <td>${data.purchaseDate}</td>
      <td>${data.expiryDate}</td>
      <td>
        ${role === 'admin' ? `
          <button onclick="editChemical('${data.id}', '${data.name}', '${data.quantity}', '${data.category}', '${data.purchaseDate}', '${data.expiryDate}')">Edit</button>
          <button onclick="deleteChemical('${data.id}')">Delete</button>
        ` : `View Only`}
      </td>
    `;
    chemTable.appendChild(row);
  });
}

// ➕ Add Chemical
const chemForm = document.getElementById("chemicalForm");
if (chemForm) {
  chemForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("chemName").value;
    const quantity = document.getElementById("chemQty").value;
    const category = document.getElementById("chemCategory").value;
    const purchaseDate = document.getElementById("chemPurchase").value;
    const expiryDate = document.getElementById("chemExpiry").value;

    await addDoc(collection(db, "chemicals"), {
      name,
      quantity,
      category,
      purchaseDate,
      expiryDate
    });

    alert("Chemical Added!");
    chemForm.reset();
    loadChemicals(currentRole);
  });
}

// ❌ Delete Chemical
window.deleteChemical = async function (id) {
  const confirmDel = confirm("Are you sure you want to delete this chemical?");
  if (!confirmDel) return;
  await deleteDoc(doc(db, "chemicals", id));
  alert("Deleted Successfully");
  loadChemicals(currentRole);
}

// ✏️ Edit Chemical
window.editChemical = async function (id, name, qty, cat, purchase, expiry) {
  const newName = prompt("Update Name", name);
  const newQty = prompt("Update Quantity", qty);
  const newCat = prompt("Update Category", cat);
  const newPurchase = prompt("Update Purchase Date", purchase);
  const newExpiry = prompt("Update Expiry Date", expiry);

  if (!newName || !newQty || !newCat || !newPurchase || !newExpiry) {
    alert("Edit cancelled. All fields are required.");
    return;
  }

  const chemRef = doc(db, "chemicals", id);
  await updateDoc(chemRef, {
    name: newName,
    quantity: newQty,
    category: newCat,
    purchaseDate: newPurchase,
    expiryDate: newExpiry
  });

  alert("Updated Successfully");
  loadChemicals(currentRole);
}

// 🔍 Trigger Reload on Filter/Search/Sort
document.getElementById("searchInput")?.addEventListener("input", () => loadChemicals(currentRole));
document.getElementById("filterCategory")?.addEventListener("change", () => loadChemicals(currentRole));
document.getElementById("sortSelect")?.addEventListener("change", () => loadChemicals(currentRole));

// 🚪 Logout
window.logout = function () {
  signOut(auth).then(() => {
    window.location.href = "login.html";
  }).catch((error) => {
    alert("Logout failed: " + error.message);
  });
};
