document.addEventListener("DOMContentLoaded", () => {
    const overlay = document.getElementById('overlay');

    // ====== Modal ======
    function openModal(modal) {
        if (!modal) return;
        modal.classList.add('active');
        overlay.classList.add('active');

        const form = modal.querySelector('.cart-form');
        if (form) resetForm(form);
    }

    function closeModal(modal) {
        if (!modal) return;
        modal.classList.remove('active');
        overlay.classList.remove('active');
    }

    document.querySelectorAll('[data-modal-target]').forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = document.querySelector(btn.dataset.modalTarget);
            openModal(modal);
        });
    });

    document.querySelectorAll('[data-close-button]').forEach(btn => {
        btn.addEventListener('click', () => closeModal(btn.closest('.modal')));
    });

    overlay.addEventListener('click', () => {
        document.querySelectorAll('.modal.active').forEach(modal => closeModal(modal));
    });

    // ====== Modal Form ======
    function resetForm(form) {
        const qtyEl = form.querySelector('.qty');
        const priceEl = form.querySelector('.price');
        const qtyInput = form.querySelector('input[name="quantity"]');
        const optionsInput = form.querySelector('input[name="options"]');
        const totalPriceInput = form.querySelector('input[name="totalPrice"]');

        qtyEl.innerText = "1";
        qtyInput.value = 1;
        totalPriceInput.value = priceEl.dataset.basePrice;
        optionsInput.value = "[]";

        form.selectedOptions = {};
        form.quantity = 1;

        form.querySelectorAll('input[type=radio]').forEach(r => { r.checked = false; r.previousChecked = false; });

        updateFormDisplay(form);
    }

    function updateFormDisplay(form) {
        const priceEl = form.querySelector('.price');
        const qtyEl = form.querySelector('.qty');
        const qtyInput = form.querySelector('input[name="quantity"]');
        const optionsInput = form.querySelector('input[name="options"]');
        const totalPriceInput = form.querySelector('input[name="totalPrice"]');

        const basePrice = parseFloat(priceEl.dataset.basePrice);
        const totalExtra = Object.values(form.selectedOptions || {}).reduce((sum, o) => sum + o.extra, 0);
        const totalPrice = (basePrice + totalExtra) * (form.quantity || 1);

        priceEl.innerText = totalPrice + " ฿";
        qtyEl.innerText = form.quantity;
        qtyInput.value = form.quantity;
        optionsInput.value = JSON.stringify(Object.values(form.selectedOptions || {}));
        totalPriceInput.value = totalPrice;
    }

    function bindCartFormEvents() {
        document.querySelectorAll('.cart-form').forEach(form => {
            form.querySelector('.qty-btn.plus')?.addEventListener('click', () => {
                form.quantity = (form.quantity || 1) + 1;
                updateFormDisplay(form);
            });
            form.querySelector('.qty-btn.minus')?.addEventListener('click', () => {
                form.quantity = Math.max((form.quantity || 1) - 1, 1);
                updateFormDisplay(form);
            });

            form.querySelectorAll('input[type=radio]').forEach(r => {
                r.previousChecked = false;
                r.addEventListener('click', () => {
                    const name = r.name;
                    if (r.previousChecked) {
                        r.checked = false;
                        delete form.selectedOptions[name];
                    } else {
                        form.selectedOptions[name] = {
                            name: r.nextElementSibling.innerText.trim(),
                            extra: parseFloat(r.dataset.extra || 0)
                        };
                    }
                    r.previousChecked = r.checked;
                    updateFormDisplay(form);
                });
            });

            form.addEventListener('submit', async e => {
                e.preventDefault();
                if (!form.checkValidity()) { form.reportValidity(); return; }

                const payload = {
                    menu_id: form.dataset.menuId,
                    options: Object.values(form.selectedOptions || {}),
                    quantity: form.quantity || 1,
                    totalPrice: parseFloat(form.querySelector('input[name="totalPrice"]').value)
                };

                const res = await fetch("/add-to-cart", {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify(payload)
                });
                const data = await res.json();

                if (data.cartHtml) {
                    document.querySelector(".container_2").innerHTML = data.cartHtml;
                    bindCartEvents();
                    bindCartFormEvents();
                }

                closeModal(form.closest('.modal'));
            });
        });
    }

    // ====== Cart Summary ======
    function bindCartEvents() {
        document.querySelectorAll(".cart-plus").forEach(btn => {
            btn.addEventListener("click", async () => {
                const li = btn.closest("li");
                const menuId = li.dataset.menuId;
                const options = JSON.parse(li.dataset.options);
                const res = await fetch("/update-cart", {
                    method: "POST",
                    headers: {"Content-Type":"application/json"},
                    body: JSON.stringify({ menu_id: menuId, options, change: +1 })
                });
                const data = await res.json();
                if (data.cartHtml) {
                    document.querySelector(".container_2").innerHTML = data.cartHtml;
                    bindCartEvents();
                    bindCartFormEvents();
                }
            });
        });

        document.querySelectorAll(".cart-minus").forEach(btn => {
            btn.addEventListener("click", async () => {
                const li = btn.closest("li");
                const menuId = li.dataset.menuId;
                const options = JSON.parse(li.dataset.options);
                const res = await fetch("/update-cart", {
                    method: "POST",
                    headers: {"Content-Type":"application/json"},
                    body: JSON.stringify({ menu_id: menuId, options, change: -1 })
                });
                const data = await res.json();
                if (data.cartHtml) {
                    document.querySelector(".container_2").innerHTML = data.cartHtml;
                    bindCartEvents();
                    bindCartFormEvents();
                }
            });
        });
    }

    // ====== เรียก bind ครั้งแรก ======
    bindCartFormEvents();
    bindCartEvents();
});
