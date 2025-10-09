// เปลี่ยนหมวดหมู่
document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.querySelector(".search-bar input");
  const drinksSection = document.getElementById("drinks-section");
  const bakerySection = document.getElementById("bakery-section");
  const categoryButtons = document.querySelectorAll(".category-btn");

  // ตั้งค่าให้แท็บเครื่องดื่ม/เบเกอรี่สลับได้
  categoryButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      categoryButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const category = btn.dataset.category;
      if (category === "drinks") {
        drinksSection.style.display = "grid";
        bakerySection.style.display = "none";
      } else {
        drinksSection.style.display = "none";
        bakerySection.style.display = "grid";
      }
      searchProduct(); // อัปเดตผลค้นหาเมื่อเปลี่ยนหมวด
    });
  });

  // ฟังก์ชันค้นหา
  function searchProduct() {
    const searchValue = searchInput.value.toLowerCase();
    const activeCategory = document.querySelector(".category-btn.active").dataset.category;
    const visibleSection = activeCategory === "drinks" ? drinksSection : bakerySection;

    const products = visibleSection.querySelectorAll(".product-card, .no-products");

    products.forEach((item) => {
      const name = item.querySelector(".product-name")?.textContent.toLowerCase() || "";
      if (name.includes(searchValue) || item.classList.contains("no-products")) {
        item.style.display = "";
      } else {
        item.style.display = "none";
      }
    });
  }

  // ค้นหาเมื่อพิมพ์
  searchInput.addEventListener("keyup", searchProduct);
});


// Helper: แปลงค่าทุกแบบให้เป็น boolean
function toBool(val) {
  return val === true || val === 'true' || val === 1 || val === '1';
}

// Helper: escape HTML ป้องกัน XSS (เช่นชื่อเมนูมี < > " ')
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ฟังก์ชันเลือกสินค้า (เบเกอรี่ + เครื่องดื่ม)
function selectItem(id, name, category, isAvaliable, stockQty) {
  isAvaliable = toBool(isAvaliable);
  selectedItem = { id, name, category, isAvaliable, stockQty };

  const rightPanel = document.getElementById('selectedItems');
  let html = `<h3>${escapeHtml(name)}</h3><hr>`;

  if (category === 'drink') {
    html += `
      <p><strong>Stock:</strong> ${stockQty ?? '-'}</p>
      <button 
        class="btn btn-toggle btn-primary" 
        data-id="${id}" 
        onclick="toggleDrinkStatus(${(id)}, ${isAvaliable})">
        ${isAvaliable ? 'Close Sale' : 'Open Sale'}
      </button>
    `;
  } else if (category === 'bakery') {
    html += `
      <p><strong>Stock:</strong> <span id="stock-${id}">${stockQty ?? 0}</span></p>
      <div class="stock-controls">
        <button class="btn btn-sm btn-danger" onclick="updateStock(${id}, -1)">–</button>
        <button class="btn btn-sm btn-success" onclick="updateStock(${id}, 1)">+</button>
        <button class="btn btn-sm btn-warning" onclick="editStock(${id})">Edit</button>
      </div>
    `;
}

  rightPanel.innerHTML = html;
}

function toggleDrinkStatus(id, currentStatus) {
  console.log("btn click");
  
  const newStatus = !currentStatus;
  fetch(`/inventory/toggle/${id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ is_avaliable: newStatus })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      const card = document.querySelector(`.product-card[data-id="${id}"]`);
      if (card) card.classList.toggle('unavaliable', !data.is_avaliable);
      selectItem(id, selectedItem.name, 'drink', data.is_avaliable, selectedItem.stockQty);
    } else {
      alert('Update failed: ' + (data.message || 'Unknown'));
    }
  });
}

// ฟังก์ชันเพิ่ม/ลด stock (เรียก backend)
function updateStock(id, delta) {
  fetch(`/inventory/stock/${id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ change: delta })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      // อัปเดตเลข stock ใน span
      document.getElementById(`stock-${id}`).innerText = data.newStock;
    } else {
      alert('Update Failed: ' + (data.message || 'Unknown'));
    }
  })
  .catch(err => console.error('updateStock error:', err));
}

// ฟังก์ชันแก้ไข stock แบบกรอกจำนวน
function editStock(id) {
  const current = parseInt(document.getElementById(`stock-${id}`).innerText);
  const newStock = parseInt(prompt("Enter new stock quantity:", current));
  if (isNaN(newStock) || newStock < 0) return;

  const delta = newStock - current;
  updateStock(id, delta);
}

// ล้างการเลือกสินค้า
function clearSelection() {
  selectedItem = null;
  document.getElementById('selectedItems').innerHTML = `
        <div class="empty-state">
            <p>Please Select Products</p>
        </div>`;
}