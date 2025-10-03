let sections = document.querySelectorAll('section');
let navLinks = document.querySelectorAll('header nav a');

window.addEventListener('scroll', () => {
    let scrollY = window.pageYOffset;

    sections.forEach(sec => {
        let offsetTop = sec.offsetTop;
        let height = sec.offsetHeight;
        let id = sec.getAttribute('id');

        if (scrollY >= offsetTop - 50 && scrollY < offsetTop + height - 50) {
            navLinks.forEach(link => {
                link.classList.remove('active');
            });
            document.querySelector('header nav a[href="#' + id + '"]').classList.add('active');
        }
    });
});
// อันนี้ไว้ทำให้ มันเลื่อนไปหาหน้าต่างๆตรง nav bar