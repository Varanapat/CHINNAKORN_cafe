let sections = document.querySelectorAll('section');
let navLinks = document.querySelectorAll('header nav a');

// window.addEventListener('scroll', () => {
//     let scrollY = window.pageYOffset;

//     sections.forEach(sec => {
//         let offsetTop = sec.offsetTop;
//         let height = sec.offsetHeight;
//         let id = sec.getAttribute('id');

//         if (scrollY >= offsetTop - 50 && scrollY < offsetTop + height - 50) {
//             navLinks.forEach(link => {
//                 link.classList.remove('active');
//             });
//             document.querySelector('header nav a[href="#' + id + '"]').classList.add('active');
//         }
//     });
// });
// window.addEventListener('scroll', () => {
//     let scrollY = window.pageYOffset;

//     sections.forEach(sec => {
//         let offsetTop = sec.offsetTop;
//         let height = sec.offsetHeight;
//         let id = sec.getAttribute('id');

//         // เช็คค่าตัวแปร
//         console.log('scrollY:', scrollY, 'offsetTop:', offsetTop, 'height:', height, 'id:', id);

//         if (scrollY >= offsetTop - 50 && scrollY < offsetTop + height - 50) {
//             navLinks.forEach(link => link.classList.remove('active'));
//             let activeLink = document.querySelector('header nav a[href="#' + id + '"]');
//             if (activeLink) activeLink.classList.add('active');
//         }
//     });
// });


// document.addEventListener('DOMContentLoaded', () => {
//     const sections = document.querySelectorAll('section');
//     const navLinks = document.querySelectorAll('header nav a');

//     window.addEventListener('scroll', () => {
//         const scrollY = window.pageYOffset;

//         let currentSectionId = '';

//         sections.forEach(sec => {
//             const offsetTop = sec.offsetTop;
//             const height = sec.offsetHeight;
//             const id = sec.getAttribute('id');

//             // scrollY + header height ครอบ section
//             if (scrollY >= offsetTop - 100 && scrollY < offsetTop + height - 100) {
//                 currentSectionId = id;
//             }
//         });

//         navLinks.forEach(link => {
//             link.classList.remove('active');
//             if (link.getAttribute('href') === `#${currentSectionId}`) {
//                 link.classList.add('active');
//             }
//         });
//     });
// });


// document.addEventListener('DOMContentLoaded', () => {
//     const sections = document.querySelectorAll('section');
//     const navLinks = document.querySelectorAll('header nav a');
//     const headerHeight = document.querySelector('header').offsetHeight;

//     window.addEventListener('scroll', () => {
//         const scrollY = window.pageYOffset;

//         let currentSectionId = sections[0].id; // default ให้ section แรก

//         sections.forEach(sec => {
//             const offsetTop = sec.offsetTop - headerHeight - 5; // -5 เผื่อ buffer
//             const height = sec.offsetHeight;
//             const id = sec.getAttribute('id');

//             if (scrollY >= offsetTop && scrollY < offsetTop + height) {
//                 currentSectionId = id;
//             }
//         });

//         navLinks.forEach(link => {
//             if (link.getAttribute('href') === `#${currentSectionId}`) {
//                 link.classList.add('active');
//             } else {
//                 link.classList.remove('active');
//             }
//         });
//     });
// });


// window.addEventListener('scroll', () => {
//     let scrollY = window.scrollY || window.pageYOffset;
//     let currentSectionId = sections[0].id;

//     sections.forEach(sec => {
//         const rect = sec.getBoundingClientRect();
//         const secTop = rect.top + window.scrollY - headerHeight; // position จริงบนหน้า
//         const secBottom = secTop + sec.offsetHeight;

//         if (scrollY >= secTop && scrollY < secBottom) {
//             currentSectionId = sec.id;
//         }
//     });

//     navLinks.forEach(link => {
//         link.classList.toggle('active', link.getAttribute('href') === `#${currentSectionId}`);
//     });
// });

// document.addEventListener('DOMContentLoaded', () => {
//     const sections = document.querySelectorAll('section');
//     const navLinks = document.querySelectorAll('header nav a');
//     const headerHeight = document.querySelector('header').offsetHeight;

//     // ฟังก์ชัน debounce
//     function debounce(fn, delay = 50) {
//         let timer;
//         return function(...args) {
//             clearTimeout(timer);
//             timer = setTimeout(() => fn.apply(this, args), delay);
//         };
//     }

//     function scrollSpy() {
//         const scrollY = window.scrollY || window.pageYOffset;
//         let currentSectionId = sections[0].id; // default section แรก

//         sections.forEach(sec => {
//             const rect = sec.getBoundingClientRect();
//             const secTop = rect.top + window.scrollY - headerHeight - 50; // buffer 50px
//             const secBottom = secTop + sec.offsetHeight;

//             if (scrollY >= secTop && scrollY < secBottom) {
//                 currentSectionId = sec.id;
//             }
//         });

//         navLinks.forEach(link => {
//             link.classList.toggle('active', link.getAttribute('href') === `#${currentSectionId}`);
//         });
//     }

//     // ใช้ debounce กับ scroll
//     window.addEventListener('scroll', debounce(scrollSpy, 20));

//     // เรียกตอนโหลดหน้า
//     scrollSpy();
// });

document.addEventListener('DOMContentLoaded', () => {
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('header nav a');
    const header = document.querySelector('header');
    
    function debounce(fn, delay=20) {
        let timer;
        return function(...args){
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), delay);
        }
    }

    function scrollSpy() {
        const scrollY = window.scrollY;
        let currentSectionId = sections[0].id;

        sections.forEach(sec => {
            const top = sec.offsetTop - header.offsetHeight - 1; // ใช้ offsetTop แทน rect
            const bottom = top + sec.offsetHeight;
            if(scrollY >= top && scrollY < bottom){
                currentSectionId = sec.id;
            }
        });

        navLinks.forEach(link => {
            const href = link.getAttribute('href').replace('#','');
            link.classList.toggle('active', href === currentSectionId);
        });
    }

    window.addEventListener('scroll', debounce(scrollSpy, 20));
    scrollSpy(); // เรียกตอนโหลด
});


// อันนี้ไว้ทำให้ มันเลื่อนไปหาหน้าต่างๆตรง nav bar