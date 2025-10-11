

// const overlay = document.getElementById('overlay');

// // ===== ฟังก์ชันเปิด/ปิด modal =====
// function openModal(modal) {
//   if (!modal) return;
//   modal.classList.add('active');
//   overlay.classList.add('active');
// }

// function closeModal(modal) {
//   if (!modal) return;
//   modal.classList.remove('active');
//   overlay.classList.remove('active');
// }

// // ===== Modal ของเมนู =====
// const openModalButtons = document.querySelectorAll('[data-modal-target]');
// const closeModalButtons = document.querySelectorAll('[data-close-button]');

// openModalButtons.forEach(button => {
//   button.addEventListener('click', () => {
//     const modal = document.querySelector(button.dataset.modalTarget);
//     openModal(modal);
//   });
// });

// closeModalButtons.forEach(button => {
//   button.addEventListener('click', () => {
//     const modal = button.closest('.modal');
//     closeModal(modal);
//   });
// });

// // ===== Modal ตะกร้า =====
// const cartIcon = document.getElementById('cart-icon');
// const cartModal = document.getElementById('cart-modal');
// const closeBtn = document.getElementById('close-modal');

// cartIcon.addEventListener('click', () => openModal(cartModal));
// closeBtn.addEventListener('click', () => closeModal(cartModal));

// // ===== Overlay กดปิดได้ทุก modal =====
// overlay.addEventListener('click', () => {
//   document.querySelectorAll('.modal.active').forEach(modal => closeModal(modal));
// });

// // ===== ปุ่มเพิ่มสินค้าใน modal ปิด modal อัตโนมัติ =====
// document.querySelectorAll('.add-to-cart').forEach(button => {
//   button.addEventListener('click', e => {
//     const form = button.closest('form');
//     if (!form.checkValidity()) {
//       e.preventDefault();
//       form.reportValidity();
//       return;
//     }
//     const modal = button.closest('.modal');
//     closeModal(modal);
//   });
// });


document.addEventListener('DOMContentLoaded', () => {
  const overlay = document.getElementById('overlay');
  const cartIcon = document.getElementById('cart-icon');
  const cartModal = document.getElementById('cart-modal');
  const closeBtn = document.getElementById('close-modal');

  function openModal(modal) {
    if (!modal) return;
    modal.classList.add('active');
    overlay.classList.add('active');
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.classList.remove('active');
    overlay.classList.remove('active');
  }

  // เปิด modal ตะกร้า
  cartIcon.addEventListener('click', () => openModal(cartModal));
  closeBtn.addEventListener('click', () => closeModal(cartModal));

  // overlay ปิดทุก modal
  overlay.addEventListener('click', () => {
    document.querySelectorAll('.modal.active').forEach(modal => closeModal(modal));
  });

  // ปุ่มเพิ่มลงตะกร้า
  document.querySelectorAll('.add-to-cart').forEach(button => {
    button.addEventListener('click', e => {
      const form = button.closest('form');
      if (!form.checkValidity()) {
        e.preventDefault();
        form.reportValidity();
        return;
      }
      const modal = button.closest('.modal');
      closeModal(modal);
    });
  });

  // Modal เมนู (เหมือนเดิม)
  const openModalButtons = document.querySelectorAll('[data-modal-target]');
  const closeModalButtons = document.querySelectorAll('[data-close-button]');

  openModalButtons.forEach(button => {
    button.addEventListener('click', () => {
      const modal = document.querySelector(button.dataset.modalTarget);
      openModal(modal);
    });
  });

  closeModalButtons.forEach(button => {
    button.addEventListener('click', () => {
      const modal = button.closest('.modal');
      closeModal(modal);
    });
  });
});
