// const openModelButtons = document.querySelectorAll('[data-modal-target]')
// const closeModelButtons = document.querySelectorAll('[data-close-button]')
// const overlay = document.getElementById('overlay');

// // openModelButtons.forEach(button =>{
// //     button.addEventListener('click' ,()=>{
// //         const modal = document.querySelector(button.dataset.modalTarget)
// //         openModal(modal)
// //     })
// // })

// openModelButtons.forEach(button => {
//   button.addEventListener('click', (e) =>{
//     e.preventDefault();
//     const modal = document.querySelector(button.dataset.modalTarget)
//     openModal(modal)
//   })
// })

// overlay.addEventListener('click',()=>{
//     const modals = document.querySelectorAll('.modal.active')
//     modals.forEach(modal =>{
//         closeModal(modal)
//     })
// })

// closeModelButtons.forEach(button =>{
//     button.addEventListener('click' ,()=>{
//         const modal = button.closest('.modal')
//         closeModal(modal)
//     })
// })

// function openModal(modal){
//     if (modal == null) return
//     modal.classList.add('active')
//     overlay.classList.add('active')
// }

// function closeModal(modal){
//     if (modal == null) return
//     modal.classList.remove('active')
//     overlay.classList.remove('active')
// }

const openModalButtons = document.querySelectorAll('[data-modal-target]')
const closeModalButtons = document.querySelectorAll('[data-close-button]')
const overlay = document.getElementById('overlay')

// เปิด modal
openModalButtons.forEach(button => {
  button.addEventListener('click', () => {
    const modal = document.querySelector(button.dataset.modalTarget)
    openModal(modal)
  })
})

// ปิด modal เมื่อคลิก overlay
overlay.addEventListener('click', () => {
  const modals = document.querySelectorAll('.modal.active')
  modals.forEach(modal => {
    closeModal(modal)
  })
})

// ปิด modal เมื่อกดปุ่ม ×
closeModalButtons.forEach(button => {
  button.addEventListener('click', () => {
    const modal = button.closest('.modal')
    closeModal(modal)
  })
})

function openModal(modal) {
  if (modal == null) return
  modal.classList.add('active')
  overlay.classList.add('active')
}

function closeModal(modal) {
  if (modal == null) return
  modal.classList.remove('active')
  overlay.classList.remove('active')
}