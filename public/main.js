console.log('This file is connected!!!')

const prev = document.getElementById("prev")
const next = document.getElementById("next")

prev.addEventListener("click", function () {
  console.log("Clicked prev button")
  fetch('/listing/:id', {
    method:'GET'
  })
  .then(function (res) {
    console.log(res)
  })
})

next.addEventListener("click", function () {
  console.log("Clicked next button")
})