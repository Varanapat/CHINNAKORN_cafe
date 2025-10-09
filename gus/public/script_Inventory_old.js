

// ฟังก์ชันเปิด/ปิดการขายเครื่องดื่ม
async function toggleDrinkStatus(id, isAvailable) {
  const currentlyAvailable = toBool(isAvailable);

  try {
    const res = await fetch(`/inventory/toggle/${encodeURIComponent(id)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_available: !currentlyAvailable })
    });

    const data = await res.json();
    const newStatus = toBool(data.is_available);

    // อัปเดตสี card
    const card = document.querySelector(`.product-card[data-id="${id}"]`);
    if (card) card.classList.toggle('unavailable', !newStatus);

    // อัปเดตปุ่ม
    const rightPanel = document.getElementById('selectedItems');
    const btn = rightPanel.querySelector(`.btn-toggle[data-id="${id}"]`) || rightPanel.querySelector('.btn-toggle');
    if (btn) {
      btn.textContent = newStatus ? 'Close Sale' : 'Open Sale';
      btn.setAttribute('onclick', `toggleDrinkStatus(${JSON.stringify(id)}, ${newStatus})`);
    }

  } catch (err) {
    console.error('toggleDrinkStatus error:', err);
    alert('Cannot Update! Please try again.');
  }
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
      else alert('Update Failed');
    })
    .catch(err => console.error('updateStock error:', err));
}