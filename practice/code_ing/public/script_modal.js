const openModalButtons = document.querySelectorAll('[data-modal-target]');
const closeModalButtons = document.querySelectorAll('[data-close-button]');
const overlay = document.getElementById('overlay');

// เปิด modal
openModalButtons.forEach(button => {
    button.addEventListener('click', () => {
        const modal = document.querySelector(button.dataset.modalTarget);
        openModal(modal);
    });
});

// ปิด modal เมื่อคลิก overlay
overlay.addEventListener('click', () => {
    const modals = document.querySelectorAll('.modal.active');
    modals.forEach(modal => {
        closeModal(modal);
    });
});

// ปิด modal เมื่อกดปุ่ม ×
closeModalButtons.forEach(button => {
    button.addEventListener('click', () => {
        const modal = button.closest('.modal');
        closeModal(modal);
    });
});

function openModal(modal) {
    if (modal == null) return;
    modal.classList.add('active');
    overlay.classList.add('active');

}

function closeModal(modal) {
    if (modal == null) return;
    modal.classList.remove('active');
    overlay.classList.remove('active');


}

// ถ้ากดเพิ่มเข้าตะกร้า ให้มันปิดโมเดลไปด้วยเลย
document.querySelectorAll('.add-to-cart').forEach(button => {
    button.addEventListener('click', (e) => {
        const form = button.closest("form");

        // ถ้า input ที่เป็น required ยังไม่ได้เลือก
        if (!form.checkValidity()) {
            e.preventDefault();       // กันไม่ให้ submit
            form.reportValidity();    // โชว์ข้อความเตือน browser
            return;                   // ออกจาก function ไม่ปิด modal
        }

        // ถ้า valid แล้ว (เลือกครบ)
        const modal = button.closest('.modal');
        closeModal(modal);
    });
});
