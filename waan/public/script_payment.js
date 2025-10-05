const totalAmount = Number(document.body.dataset.total || 0);

// Payment method selection
document.querySelectorAll('.payment-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.payment-btn').forEach(b => b.classList.remove('selected'));
        this.classList.add('selected');

        const paymentType = this.dataset.payment;
        const cashSection = document.getElementById('cash-section');
        const qrSection = document.getElementById('qr-section');

        if (paymentType === 'cash') {
            cashSection.style.display = 'block';
            qrSection.style.display = 'none';
        } else {
            cashSection.style.display = 'none';
            qrSection.style.display = 'block';
        }

        // Reset
        document.getElementById('change-display').style.display = 'none';
        document.getElementById('qr-code-container').innerHTML = '<p style="color: #666;">กด "ยืนยันชำระเงิน" เพื่อสร้าง QR Code</p>';
    });
});

// Tip selection (เงินสด)
document.querySelectorAll('.tip-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.tip-btn').forEach(b => b.classList.remove('selected'));
        this.classList.add('selected');

        const amount = Number(this.dataset.amount);
        calculateChange(amount);

        // Clear custom input
        document.getElementById('custom-amount').value = '';
    });
});

// Custom amount input (เงินสด)
document.getElementById('custom-amount').addEventListener('input', function() {
    const amount = Number(this.value);
    if (amount > 0) {
        // Clear tip buttons selection
        document.querySelectorAll('.tip-btn').forEach(b => b.classList.remove('selected'));
        calculateChange(amount);
    } else {
        document.getElementById('change-display').style.display = 'none';
    }
});

// คำนวณเงินทอน
function calculateChange(cashReceived) {
    const change = cashReceived - totalAmount;
    const changeDisplay = document.getElementById('change-display');
    const changeAmount = document.getElementById('change-amount');

    changeDisplay.style.display = 'block';

    if (change >= 0) {
        changeAmount.textContent = change.toFixed(2);
        changeDisplay.classList.remove('error');
        changeDisplay.classList.add('success');
    } else {
        changeAmount.textContent = 'เงินไม่พอ';
        changeDisplay.classList.remove('success');
        changeDisplay.classList.add('error');
    }
}

// Checkout function
async function handleCheckout() {
    const selectedPayment = document.querySelector('.payment-btn.selected').dataset.payment;

    if (selectedPayment === 'cash') {
        // ชำระเงินสด
        const selectedBtn = document.querySelector('.tip-btn.selected');
        const customAmount = document.getElementById('custom-amount').value;

        let cashReceived = 0;
        if (customAmount) {
            cashReceived = Number(customAmount);
        } else if (selectedBtn) {
            cashReceived = Number(selectedBtn.dataset.amount);
        }

        if (cashReceived === 0) {
            alert('กรุณาเลือกหรือระบุจำนวนเงินที่ลูกค้าชำระ');
            return;
        }

        if (cashReceived < totalAmount) {
            alert('จำนวนเงินไม่เพียงพอ');
            return;
        }

        try {
            const res = await fetch('/payment/cash', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    cashReceived
                })
            });

            const data = await res.json();

            if (data.success) {
                alert(`ชำระเงินสำเร็จ\nเงินทอน: ${data.change.toFixed(2)} ฿`);
                window.location.href = '/payment-success';
            } else {
                alert(data.message || 'เกิดข้อผิดพลาด');
            }
        } catch (err) {
            console.error('Error:', err);
            alert('เกิดข้อผิดพลาดในการชำระเงิน');
        }

    } else if (selectedPayment === 'qr') {
        // ชำระด้วย QR Code
        try {
            const res = await fetch('/payment/qr', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await res.json();

            if (data.success) {
                // บันทึก QR data ใน session แล้ว redirect ไปหน้า QR
                window.location.replace('/qr-payment');
            } else {
                alert(data.message || 'ไม่สามารถสร้าง QR Code ได้');
            }
        } catch (err) {
            console.error('Error:', err);
            alert('เกิดข้อผิดพลาดในการสร้าง QR Code');
        }
    }
}