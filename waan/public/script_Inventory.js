let selectedItem = null;

// เลือกสินค้า
function selectItem(id, name, category, isAvailable, stockQty) {
    selectedItem = { id, name, category, isAvailable, stockQty };

    const rightPanel = document.getElementById('selectedItems');
    let html = `<h3>${name}</h3><hr>`;

    if (category === 'drink') {
        html += `<button class="btn btn-toggle" onclick="toggleDrinkStatus(${id}, ${isAvailable})">
                    ${isAvailable ? 'ปิดการขาย' : 'เปิดการขาย'}
                 </button>`;
    } else if (category === 'bakery') {
        html += `<div class="stock-control">
                    <button onclick="updateStock(${id}, -1)">–</button>
                    <span id="stock-${id}">${stockQty}</span>
                    <button onclick="updateStock(${id}, 1)">+</button>
                 </div>`;
    }


    rightPanel.innerHTML = html;
}

// ล้างการเลือกสินค้า
function clearSelection() {
    selectedItem = null;
    document.getElementById('selectedItems').innerHTML = `
        <div class="empty-state">
            <p>กรุณาเลือกสินค้า</p>
        </div>`;
}

// เปลี่ยนแท็บ เครื่องดื่ม ↔ เบเกอรี่
document.addEventListener('DOMContentLoaded', function() {
    const drinks = document.getElementById('drinks-section');
    const bakery = document.getElementById('bakery-section');

    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            const cat = this.dataset.category;

            // กำหนด display ชัดเจน
            if (cat === 'drinks') {
                drinks.style.display = 'grid';
                bakery.style.display = 'none';
            } else if (cat === 'bakery') {
                drinks.style.display = 'none';
                bakery.style.display = 'grid';
            }
        });
    });
});


// เปิด/ปิดการขายเครื่องดื่ม
function toggleDrinkStatus(id, isAvailable) {
    fetch(`/inventory/toggle/${id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_available: !isAvailable })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) location.reload();
            else alert('ไม่สามารถเปลี่ยนสถานะได้');
        })
        .catch(err => console.error('toggleDrinkStatus error:', err));
}

// เพิ่ม/ลดจำนวนเบเกอรี่
function updateStock(id, delta) {
    fetch(`/inventory/stock/${id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ change: delta })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) document.getElementById(`stock-${id}`).innerText = data.newStock;
            else alert('อัปเดตจำนวนไม่สำเร็จ');
        })
        .catch(err => console.error('updateStock error:', err));
}