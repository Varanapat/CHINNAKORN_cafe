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
async function selectItem(id, name, category, isAvailable, stock_qty) {
  isAvailable = toBool(isAvailable);
  selectedItem = { id, name, category, isAvailable, stock_qty };

  const rightPanel = document.getElementById('selectedItems');
  let html = `<h3>${escapeHtml(name)}</h3><hr>`;

  if (category === 'drink') {
    html += `
      <button 
        class="btn btn-bg" 
        data-id="${id}" 
        onclick="toggleDrinkStatus(${id}, ${isAvailable})">
        ${isAvailable ? 'Close Sale' : 'Open Sale'}
      </button>
    `;
  } else if (category === 'bakery') {
    try {
      // 🔹 ดึงข้อมูล stock จากฐานข้อมูล
      const res = await fetch(`/api/stock/${id}`);
      const data = await res.json();
      const dbStock = data.stock_qty ?? 0;

      html += `
  <h5><strong>Stock:</strong> <span id="stock-${id}">${dbStock}</span></h5>
  <div class="stock-controls">
    <div class="d-flex gap-2 mb-2 mt-5">
      <button class="btn btn-sm btn-long flex-fill" onclick="updateStock(${id}, -1)">–</button>
      <button class="btn btn-sm btn-long flex-fill" onclick="updateStock(${id}, 1)">+</button>
      <button class="btn btn-sm btn-bg flex-fill" onclick="editStock(${id})">แก้ไข</button>
    </div>
  </div>
`;

      // <button class="btn btn-bg btn-lg w-100 mt-4" onclick="saveStock(${id})">
      //   Save
      // </button>

    } catch (err) {
      console.error('Error loading stock:', err);
      html += `<p><strong>Stock:</strong> <span style="color:red;">Error</span></p>`;
    }
  }

  rightPanel.innerHTML = html;
}


function toggleDrinkStatus(id, currentStatus) {
  // console.log("btn click");

  const newStatus = !currentStatus;
  fetch(`/inventory/toggle/${id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ is_available: newStatus })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        const card = document.querySelector(`.product-card[data-id="${id}"]`);
        if (card) card.classList.toggle('unavailable', !data.is_available);
        selectItem(id, selectedItem.name, 'drink', data.is_available, selectedItem.stockQty);
      } else {
        alert('Update failed: ' + (data.message || 'Unknown'));
      }
    })
    .catch(err => {
      console.error('Error toggling drink status:', err);
    })
    .finally(() => {
      window.location.reload();
    })
}


// ฟังก์ชันเพิ่ม/ลด stock (เรียก backend)
async function updateStock(id, change) {
  try {
    const res = await fetch(`/inventory/stock/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ change })
    });

    const data = await res.json();
    if (data.newStock <= 1) {
      window.location.reload();
    }

    if (!data.success) {
      alert(data.message);
    }

    const stockElem = document.getElementById(`stock-${id}`);
    stockElem.textContent = data.newStock;

    // 🔹 อัปเดต class ตาม stock ใหม่
    const card = document.querySelector(`.product-card[data-id="${id}"]`);
    if (card) {
      if (data.newStock <= 0) {
        card.classList.add('unavailable');
      } else {
        card.classList.remove('unavailable');
      }
    }

    res.json({ success: true });

  } catch (err) {
    console.error('Update stock error:', err);
  }

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
            <p>เลือกสินค้า</p>
        </div>`;
}


async function saveStock(id) {
  const currentStock = parseInt(document.getElementById(`stock-${id}`).innerText);

  try {
    const res = await fetch(`/inventory/stock/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ change: 0 }) // ไม่เปลี่ยนค่า แค่บันทึก
    });

    const data = await res.json();

    if (data.success) {
      alert(`✅ Stock saved successfully!\n\nCurrent stock: ${currentStock}`);
    } else {
      alert(`❌ Save failed: ${data.message || "Unknown error"}`);
    }
  } catch (err) {
    console.error('Save stock error:', err);
    alert('⚠️ Error saving stock. Please try again.');
  }
}