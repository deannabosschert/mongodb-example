// // SUBMIT USERNAME AND CATEGORY
// userdataForm.addEventListener("submit", (event) => {
//   event.preventDefault() // when entering as a new user and/or submitting, don't show the results of the previous username which would reset the form instantly
//   const userData = {
//     userId: socket.id,
//     username: usernameInput.value,
//     category: categoryInput.value
//   }

//   toggleNone(".unsplashGallery")
//   toggleNone(".userdataForm")
//   toggleNone(".userdataSet")

//   socket.emit("start", userData)

//   renderInfo(".userdataSet", 'p', `your username: <span id="username">${usernameInput.value}</span>`, 'false')
//   renderInfo(".userdataSet", 'p', `your category: ${categoryInput.value}`, 'false')
//   false
// }, false)

// FUNCTIONAL FUNCTIONS
function toggleNone(classname) {
  document.querySelector(`${classname}`).classList.toggle("none")
}

function removeNone(classname) {
  document.querySelector(`${classname}`).classList.remove("none")
}

function renderInfo(destination, element, message, empty) {
  let ding = document.querySelector(`${destination}`)
  const el = document.createElement(`${element}`)
  el.innerHTML = message
  if (empty == 'true') {
    ding.innerHTML = ""
  }
  ding.appendChild(el)
}

function scrollView(classname) {
  document.querySelector(`${classname}`).scrollIntoView({behavior: "smooth", block: "start", inline: "nearest"})
}


// RENDER SCOREBOARD GALLERY ON HOMEPAGE || RESULTGALLLERY
function renderGallery(data, classname) {
  const destination = document.querySelector(`${classname}`)
  destination.innerHTML = ""

  return data.map(data => {
    destination.innerHTML +=
      `
    <article>
    <figure>
      <img style="border: 6.5px solid ${data.color};" src="${data.url}" alt="${data.alt_description}">
    </figure>
    </article>
    `
  })
}

// LOADING STATE
function loadingState(state) {
  const loader = document.querySelector('div.loader')
  if (state === 'active') {
    loader.classList.add('loading')
  } else {
    loader.classList.remove('loading')
  }
}


