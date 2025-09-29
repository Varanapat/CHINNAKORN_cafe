document.addEventListener("DOMContentLoaded", () => {
  // วนลูปทุก modal
  document.querySelectorAll(".modal").forEach(modal => {
    const priceEl = modal.querySelector(".price");
    const selectedOptionsEl = modal.querySelector(".selected-options");
    const qtyEl = modal.querySelector(".qty");

    const basePrice = parseFloat(priceEl.dataset.basePrice);
    let selectedOptions = {};
    let quantity = 1;

    // เมื่อเลือก option
    modal.querySelectorAll("input[type=radio]").forEach(input => {
      input.addEventListener("change", e => {
        const label = e.target.nextElementSibling.innerText.trim();
        const extraText = e.target.closest(".option_container").querySelector("span").innerText;
        const extraPrice = parseFloat(extraText.replace(/[^\d]/g, "")) || 0;

        selectedOptions[e.target.name] = {
          name: label,
          extra: extraPrice
        };

        updateDisplay();
      });
    });

    // ปุ่มบวก/ลบจำนวน
    modal.querySelector(".qty-btn.plus").addEventListener("click", () => {
      quantity++;
      qtyEl.innerText = quantity;
      updateDisplay();
    });

    modal.querySelector(".qty-btn.minus").addEventListener("click", () => {
      if (quantity > 1) {
        quantity--;
        qtyEl.innerText = quantity;
        updateDisplay();
      }
    });

    function updateDisplay() {
      // คำนวณราคาใหม่
      let totalExtra = Object.values(selectedOptions).reduce((sum, opt) => sum + opt.extra, 0);
      let totalPrice = (basePrice + totalExtra) * quantity;

      // อัปเดตราคา
      priceEl.innerText = totalPrice + " ฿";

      // แสดง option ที่เลือก (ต่อกันในบรรทัดเดียว)
      let chosenList = Object.values(selectedOptions).map(opt => {
        return opt.extra > 0 
          ? `${opt.name} (+${opt.extra} ฿)` 
          : `${opt.name}`;   // ถ้า 0 บาท แสดงชื่อเฉยๆ
      });

      selectedOptionsEl.innerText = chosenList.join(" , ");
    }
  });
});
