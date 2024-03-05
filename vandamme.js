let loadTime = new Date().getTime()
const api = 'https://' + window.location.host
const iws = `wss://${window.location.host}/site`

let tries = 0
let data
let ticketnumber
function toggleGetContext () {
  const needSomeContext = document.getElementById('needSomeContext')
  if (needSomeContext && needSomeContext.style.display === 'none') {
    needSomeContext.classList.add('maximize')
    needSomeContext.classList.remove('minimize')
    needSomeContext.style.display = 'inherit'
  } else {
    needSomeContext.classList.add('minimize')
    needSomeContext.classList.remove('maximize')
    needSomeContext.style.display = 'none'
  }
  const speechBubble = document.getElementById('wtayot-bubble')
  if (speechBubble) speechBubble.style.opacity = '0'
  Array.from(document.querySelectorAll('.metadata-label')).forEach(el => {
    el.remove()
  })
}

function getTimeUntilEvent (eventTimestamp) {
  const currentTime = new Date().getTime()
  const timeDifference = eventTimestamp - currentTime
  const seconds = Math.floor(timeDifference / 1000)
  if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = seconds % 60
    let timeString = 'in '
    if (hours > 0) {
      timeString += hours + 'h '
      if (minutes > 0 && remainingSeconds > 0) {
        timeString += 'and '
      }
    }
    if (minutes > 0) {
      timeString += minutes + 'm '
      if (remainingSeconds > 0) {
        timeString += 'and '
      }
    }
    if (remainingSeconds > 0 || (hours === 0 && minutes === 0)) {
      timeString += remainingSeconds + ' seconds'
    }
    return timeString
  } else {
    const eventDate = new Date(eventTimestamp)
    const daysOfWeek = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday'
    ]
    const dayOfWeek = daysOfWeek[eventDate.getDay()]

    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December'
    ]
    const month = months[eventDate.getMonth()]

    const dayOfMonth = eventDate.getDate()
    const year = eventDate.getFullYear()

    const hours = eventDate.getHours()
    const minutes = eventDate.getMinutes()

    const timezoneOffset = new Date().getTimezoneOffset()
    const adjustedHours = hours - Math.floor(timezoneOffset / 60)
    const dateString = `${dayOfWeek}, ${month} ${dayOfMonth}, ${year} at ${new Date(
      eventTimestamp
    ).toLocaleTimeString()}`

    return `Event is more than 24 hours away. It is scheduled for ${dateString}.`
  }
}

function isTouchDevice () {
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    navigator.msMaxTouchPoints > 0
  )
}

let socket = new WebSocket(iws)
function anon (withRenderFlag) {
  loadTime = new Date().getTime()
  const randomInt = obfuscateString(generateUniqueIdentifier())
  return fetch(api + '/user/api/auto', {
    method: 'POST',
    body: JSON.stringify({ type: 'authentication', data: randomInt }),
    headers: {
      'Content-Type': 'application/json'
    }
  })
    .then(response => response.json())
    .then(d => {
      if (!isTouchDevice()) {
        if (
          document.getElementById('wtayot-container') &&
          document.getElementById('wtayot-container').style.visibility !==
            'visible'
        )
          document.getElementById('wtayot-container').style.visibility =
            'visible'
        if (
          document.getElementById('articleSection') &&
          document.getElementById('articleSection').style.visibility !==
            'visible'
        )
          document.getElementById('articleSection').style.visibility = 'visible'
      }

      localStorage.setItem('t', d.token)
      localStorage.setItem('exp', new Date().getTime() + 10000)
      localStorage.setItem(
        'serverless-namespace',
        `https://${d.core}.${d.resource}`
      )
      if (withRenderFlag) {
        fetch(`https://${d.core}.${d.resource}/find.json?auth=` + d.token)
          .then(response => response.json())
          .then(result => {
            if (result.lastRun !== data) {
              if (result.lastRunId) {
                if (
                  (localStorage.getItem('tm') &&
                    result.lastRunId === localStorage.getItem('tm')) ||
                  Number(result.lastRunId) === ticketnumber
                ) {
                  if (!isTouchDevice() || window.screen.innerWidth > 890) {
                    document.getElementById(
                      'newTestForm'
                    ).innerHTML = `<div>✅ Done! These are your results. </div>`
                  } else {
                    setTimeout(() => {
                      if (
                        document.getElementById('wtayot-container') &&
                        document.getElementById('wtayot-container').style
                          .visibility !== 'hidden'
                      ) {
                        toggleMenu(null, true)
                      }
                    }, 10000)
                    document.getElementById(
                      'newTestForm'
                    ).innerHTML = `<div>✅ Done! Your results are ready. This dialog will close in 10 seconds.</div>`
                  }
                  ticketnumber = null
                  localStorage.removeItem('tm')
                }
              }

              data = result.lastRun
              render()
            }
            return
          })
          .catch(async error => {
            console.log('err getting last run data:', error)
            return
          })

        fetch(
          `https://${d.core}.firebaseio.com/queue/nanoseconds/stage.json?auth=` +
            d.token
        )
          .then(response => response.json())
          .then(waitlistArray => {
            const resultArray = []
            getWaitlistCount()
            if (!waitlistArray) {
              articleSection.classList.add('empty')
              return
            }
            if (
              waitlistArray &&
              waitlistArray.length < Object.keys(waitlist).length
            ) {
              return
            } else {
              articleSection.classList.remove('empty')
              waitlistArray.forEach((element, i) => {
                const [timestamp, jsonString] = element.split('|:::|')
                if (!waitlist[timestamp]) {
                  const parsedData = JSON.parse(jsonString)
                  const urls = parsedData.allUrls.map(
                    urlObject => urlObject.url
                  )
                  const title = parsedData.title
                  waitlist[timestamp] = true

                  setTimeout(function () {
                    addArticle(title, urls, timestamp)
                  }, 200 * i)
                  resultArray.push({ timestamp, title, urls })
                }
              })
            }

            return
          })
          .catch(async error => {
            console.log('err getting last run data:', error)
            return
          })
      }
    })
    .catch(error => {
      urlError.textContent = 'Error submitting URLs'
    })
}

async function refreshTokenCheck (withRenderFlag) {
  const exp = localStorage.getItem('exp')
  if (exp && Number(exp)) {
    if (exp - new Date().getTime() < 5000) {
      await anon(withRenderFlag)
      return
    } else {
      return false
    }
  }
}

function getNewResults () {
  fetch(
    `${localStorage.getItem('serverless-namespace')}/find.json?auth=` +
      localStorage.getItem('t')
  )
    .then(response => response.json())
    .then(result => {
      if (JSON.stringify(result.lastRun) !== JSON.stringify(data)) {
        if (result.lastRunId) {
          if (
            (localStorage.getItem('tm') &&
              result.lastRunId === localStorage.getItem('tm')) ||
            Number(result.lastRunId) === ticketnumber
          ) {
            if (!isTouchDevice() || window.screen.innerWidth > 890) {
              document.getElementById(
                'newTestForm'
              ).innerHTML = `<div>✅ Done! These are your results. </div>`
            } else {
              setTimeout(() => {
                if (
                  document.getElementById('wtayot-container') &&
                  document.getElementById('wtayot-container').style
                    .visibility !== 'hidden'
                ) {
                  toggleMenu(null, true)
                }
              }, 10000)
              document.getElementById(
                'newTestForm'
              ).innerHTML = `<div>✅ Done! Your results are ready. This dialog will close in 10 seconds.</div>`
            }
            updateSpeechBubblePosition(true)
            ticketnumber = null
            localStorage.removeItem('tm')
          }
        }
        data = result.lastRun
        render()
      }
      return
    })
    .catch(async error => {
      console.log('err getting last run data:', error)
      return
    })
}

function getWaitlistCount () {
  fetch(
    localStorage.getItem('serverless-namespace') +
      `/queue/nanoseconds/count.json?auth=` +
      localStorage.getItem('t')
  )
    .then(response => response.json())
    .then(count => {
      if (count && !document.getElementById('numWaiting')) {
        document.getElementById('articleSection').style.display = 'initial'
      }
      if (!count || Number(count) === 0) {
        updateSpeechBubblePosition(true)
        if (document.getElementById('articleSection')) {
          articleSection.classList.add('empty')
          if (ticketnumber) {
            ticketnumber = null
          }
        }
        getWaitlist()
      }
      if (Object.keys(waitlist).length !== Number(count) && Number(count) > 0) {
        articleSection.classList.remove('empty')
        document.getElementById('numWaiting').innerText = `(${count})`

        getWaitlist()
      } else {
        if (Number(count))
          document.getElementById('numWaiting').innerText = `(${count})`
      }
      return
    })
    .catch(async error => {
      console.log('err getting numWaiting', error)
      return
    })
}

let waitlist = {}
function getWaitlist () {
  fetch(
    localStorage.getItem('serverless-namespace') +
      `/queue/nanoseconds/stage.json?auth=` +
      localStorage.getItem('t')
  )
    .then(response => response.json())
    .then(async waitlistArray => {
      if (!waitlistArray) {
        updateSpeechBubblePosition(true)

        await getNewResults()

        return
      }
      if (
        waitlistArray &&
        waitlistArray.length < Object.keys(waitlist).length
      ) {
        const articleSection = document.getElementById('articleSection')
        const firstArticle = articleSection.querySelector('article')

        if (firstArticle) {
          articleSection.removeChild(firstArticle)
          updateSpeechBubblePosition(true)
        }
        await getNewResults()
      } else {
        waitlistArray.forEach((element, i) => {
          const [timestamp, jsonString] = element.split('|:::|')
          if (!waitlist[timestamp]) {
            const parsedData = JSON.parse(jsonString)
            const urls = parsedData.allUrls.map(urlObject => urlObject.url)
            const title = parsedData.title
            waitlist[timestamp] = true

            setTimeout(function () {
              addArticle(title, urls, timestamp)
            }, 200 * i)
          }
        })
      }
      return
    })
    .catch(async error => {
      console.log('err getting wating list data:', error)
      return
    })
}
function connect () {
  const ws = new WebSocket(iws)
  ws.onopen = function () {
    socket = ws
    anon(true)
  }

  ws.onmessage = async function (event) {
    const message = JSON.parse(event.data)
    if (message.type === 'new_add') {
      await refreshTokenCheck(false)

      getWaitlist()
      getWaitlistCount()
    } else if (message.type === 'new_count') {
      await refreshTokenCheck(false)
      getWaitlistCount()
    } else {
      return
    }
  }

  ws.onclose = function (e) {
    console.log(
      'Socket is closed. Reconnect will be attempted in 1 second.' +
        ` - [${tries} of 3 tries]`,
      e.reason
    )
    if (tries < 3) {
      tries++
      setTimeout(function () {
        connect()
      }, 1000)
    }
  }

  ws.onerror = function (err) {
    console.error('Socket encountered error: ', err.message, 'Closing socket')
    ws.close()
  }
}
connect()

function generateUniqueIdentifier () {
  function isTouchDevice () {
    return (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      navigator.msMaxTouchPoints > 0
    )
  }
  function fitScreenAndLocalizatoin (userAgent, screenSize, isTouchScreen) {
    const touchDevice =
      isTouchScreen !== undefined ? isTouchScreen : isTouchDevice()
    const getLanguages = () => {
      if ('Next up' !== document.getElementById('nextup').innerHTML) {
        return document.getElementById('nextup').innerHTML
      }
    }

    const timezoneOffset = new Date().getTimezoneOffset()

    const deviceInfo = {
      userAgent: userAgent || navigator.userAgent,
      screenSize: screenSize || {
        width: window.innerWidth,
        height: window.innerHeight
      },
      isTouchScreen: touchDevice,
      timezoneOffset: timezoneOffset,
      languages: getLanguages()
    }

    return JSON.stringify(deviceInfo)
  }

  const userAgent = navigator.userAgent
  const screenSize = {
    width: window.innerWidth,
    height: window.innerHeight
  }
  const isTouchScreen = isTouchDevice()

  const deviceInfoJSON = fitScreenAndLocalizatoin(
    userAgent,
    screenSize,
    isTouchScreen
  )

  return deviceInfoJSON
}

let urlList = []

function isValidUrl (inputUrl) {
  const urlRegex =
    /^(ftp|http|https):\/\/([a-zA-Z0-9]+\.)+[a-zA-Z0-9]+(\.[a-zA-Z]+)*(\/[^ "\x00-\x1F\x7F]+)?$/
  return urlRegex.test(inputUrl)
}

function isDuplicateUrl (inputUrl) {
  return urlList.includes(inputUrl)
}

function clearError (urlInput, i) {
  const urlError = document.getElementById('urlError' + i)

  urlError.textContent = ''
}
function setName () {
  const name = document.getElementById('aliasInput')
}
function removeGreyOnBlur (urlInput) {
  urlInput.classList.remove('greyed-out')
}
function removeRedOnBlur (urlInput) {
  urlInput.classList.remove('labelInputErr')
}
function addUrl () {
  const urlListElement = document.getElementById('urlList')
  const submitUrlButton = document.getElementById('submitUrlButton')
  const urlInputs = document.querySelectorAll('.urlInput')
  urlInputs.forEach((urlInput, i) => {
    urlInput.addEventListener('input', () => {
      clearError(urlInput, i)
      removeGreyOnBlur(urlInput, i)
      disableSubmitButtonOnChange(submitUrlButton)
    })
    function disableSubmitButtonOnChange () {
      submitUrlButton.style.visibility = 'inherit'
      submitUrlButton.ariaDisabled = true
      submitUrlButton.disabled = true
    }

    urlInput.addEventListener('change', () => {
      removeGreyOnBlur(urlInput, i)
      disableSubmitButtonOnChange(submitUrlButton)
    })
    const urlError = document.getElementById('urlError' + i)
    urlError.style.color = 'red'
    const url = urlInput.value.trim().toLowerCase()
    urlInput.value = url
    if (url) {
      if (urlError) {
        if (!isValidUrl(url)) {
          urlError.textContent = '    ^ Not a valid URL.'
          disableSubmitButtonOnChange(submitUrlButton)
        } else if (isDuplicateUrl(url)) {
          urlError.textContent = 'URL already added.'
          disableSubmitButtonOnChange(submitUrlButton)
        } else {
          const listItem = document.createElement('article')
          listItem.classList.add('maximize')
          listItem.classList.add('url')

          listItem.textContent = url
          if (labelInput.value) {
            submitUrlButton.style.visibility = 'inherit'
            removeRedOnBlur(labelInput)
            submitUrlButton.ariaDisabled = false
            submitUrlButton.disabled = false
          } else {
            labelInput.classList.add('labelInputErr')

            submitUrlButton.style.visibility = 'inherit'
            submitUrlButton.ariaDisabled = true
            submitUrlButton.disabled = true
          }
          urlList.push(url)
          if (urlList.length <= 4) {
            const additionalUrlsCount = Math.max(4 - urlList.length, 0)
            const additionalUrls = generateRandomUrls(additionalUrlsCount)
            additionalUrls.forEach((greyedOutUrl, ii) => {
              const rand = document.getElementById('urlInput' + (i + ii))
              if (rand && !rand.value) {
                rand.classList.add('greyed-out')

                rand.setAttribute('value', greyedOutUrl)
              }
            })
          } else if (urlList.length > 4) {
            urlError.textContent = 'You can only add up to 4 URLs.'
          }
        }
      }
    }
  })

  const urlListSection = document.getElementById('urlList')
  urlListSection.innerHTML = ''

  urlInputs.forEach((input, index) => {
    const urlListElement = document.createElement('article')
    urlListElement.id = `urlList${index}`
    urlListElement.textContent = input.value
    urlListSection.appendChild(urlListElement)
  })

  const submitButton = document.getElementById('submitUrlButton')
  submitButton.style.visibility = 'inherit'
}

function renderUrlList () {
  const urlListElement = document.getElementById('urlList')
  urlListElement.innerHTML = ''

  urlList.forEach((url, index) => {
    const listItem = document.createElement('article')
    listItem.classList.add('slide-in')
    listItem.textContent = url
    urlListElement.appendChild(listItem)
  })
}
const commonWebsites = [
  'https://microsoft.com',
  'https://ebay.com',
  'https://yahoo.com',
  'https://youtube.com',
  'https://worldstar.com',
  'https://weather.com'
]
function generateRandomUrls (count) {
  const newWebsitesArray = commonWebsites.filter(
    website => !urlList.includes(website)
  )
  const shuffledWebsites = newWebsitesArray.sort(() => Math.random() - 0.5)
  urlList = []
  return shuffledWebsites
}
function addOrdinalSuffix (number) {
  if (typeof number !== 'number' || isNaN(number)) {
    return 'Invalid input. Please provide a valid number.'
  }

  const lastDigit = number % 10
  const secondLastDigit = Math.floor((number % 100) / 10)

  if (secondLastDigit === 1) {
    return number + 'th'
  }

  switch (lastDigit) {
    case 1:
      return number + 'st'
    case 2:
      return number + 'nd'
    case 3:
      return number + 'rd'
    default:
      return number + 'th'
  }
}
function checkInput () {
  const urlInput0 = document.getElementById('urlInput0')
  const urlInputs = document.querySelectorAll('.urlInput:not(#urlInput0)')

  if (urlInput0.value.trim() === '') {
    urlInputs.forEach(input => (input.disabled = true))
  } else {
    urlInputs.forEach(input => (input.disabled = false))
  }
}

function checkForDups () {
  const urlInputs = document.querySelectorAll('.urlInput')

  const values = Array.from(urlInputs, input => input.value.trim())

  function findDuplicateIndices (arr) {
    const duplicateIndices = []

    for (let i = 1; i < arr.length; i++) {
      if (arr[i] === arr[i - 1] && arr[i].length) {
        duplicateIndices.push(i)
      }
    }

    return duplicateIndices
  }
  if (findDuplicateIndices(values).length) {
    const urlError = document.getElementById(
      'urlError' + findDuplicateIndices(values)[0]
    )
    urlError.style.color = 'red'
    urlError.textContent = '  ^ URL already added.'
    document.getElementById('validateUrl').disabled = true
  } else {
    document.getElementById('validateUrl').disabled = false
    for (let i = 0; i < values.length; i++) {
      const urlError = document.getElementById('urlError' + i)
      if (urlError) {
        urlError.style.color = ''
        urlError.textContent = ''
      }
    }
  }
  return findDuplicateIndices(values)
}
async function submitUrls () {
  const urlForm = document.getElementById('urlForm')
  const urlError = document.getElementById('urlError')
  const urlInputs = Array.from(document.querySelectorAll('.urlInput'))
  const labelInput = document.getElementById('labelInput')

  if (urlInputs.every(input => input.value === '')) {
    urlError.textContent = 'Please add at least one URL'
    return
  }

  const allUrls = urlInputs
    .filter(input => input.value !== '')
    .map((input, index) => {
      return {
        host: input.value.toLowerCase()
      }
    })
  if (allUrls.length === 4) {
    await refreshTokenCheck()
  }
  const submitUrlButton = document.getElementById('submitUrlButton')
  submitUrlButton.disabled = true
  fetch(api + '/user/api/create', {
    method: 'POST',
    body: JSON.stringify({
      type: 'mutation',
      data: { allUrls, title: labelInput.value }
    }),
    headers: {
      'Content-Type': 'application/json',
      Authorization: localStorage.getItem('t')
    }
  })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        const msUntil = data.success * 30000

        const eventTimestamp = new Date().getTime() + msUntil
        const timeUntilEvent = getTimeUntilEvent(eventTimestamp)
        if (data.tm) {
          ticketnumber = data.tm
          localStorage.setItem('tm', ticketnumber)
        }
        updateSpeechBubblePosition(true)
        if (msUntil < 300000) {
          if (!isTouchDevice() || window.screen.innerWidth > 890) {
            document.getElementById('newTestForm').innerHTML =
              `<div>🤖 Stick around! You are ` +
              addOrdinalSuffix(data.success) +
              ` in line. Your test will run ${timeUntilEvent}.</div>`
          } else {
            document.getElementById('newTestForm').innerHTML =
              `<div>🤖 Stick around! You are ` +
              addOrdinalSuffix(data.success) +
              ` in line. Your test will run ${timeUntilEvent}. Feel free to close this dialog. </div>`
          }

          updateSpeechBubblePosition(true)
        } else {
          document.getElementById('newTestForm').innerHTML =
            `<div>🤖 Well done! You are ` +
            addOrdinalSuffix(data.success) +
            ` in line. Your test will run ${timeUntilEvent}. Feel free to close this window and come back.</div>`
          updateSpeechBubblePosition(true)
        }
      }
    })
    .catch(error => {
      urlError.textContent = 'Error submitting URLs'
    })
}
function toggleMenu (e, onlyCloseFlag) {
  const needSomeContext = document.getElementById('needSomeContext')
  if (needSomeContext) {
    needSomeContext.classList.add('minimize')
    needSomeContext.classList.remove('maximize')
    needSomeContext.style.display = 'none'
  }

  const sidebar = document.getElementById('parentarticle')
  const ham = document.getElementById('mcdonalds')
  const backdrop = document.getElementById('backdrop')

  backdrop.classList.add('blur')
  document.body.classList.add('lockbody')

  if (sidebar.style.transform === 'translateX(68px)') {
    backdrop.classList.remove('blur')
    document.body.classList.remove('lockbody')
    sidebar.style.visibility = 'hidden'
    ham.classList.remove('open')
    sidebar.style.transform = 'translateX(200%)'
    if (
      document.getElementById('wtayot-container') &&
      document.getElementById('wtayot-container').style.visibility !== 'hidden'
    )
      document.getElementById('wtayot-container').style.visibility = 'hidden'
    if (
      document.getElementById('articleSection') &&
      document.getElementById('articleSection').style.visibility !== 'hidden'
    )
      document.getElementById('articleSection').style.visibility = 'hidden'
  } else if (!onlyCloseFlag) {
    sidebar.style.visibility = 'visible'
    ham.classList.add('open')
    sidebar.style.position = 'fixed'
    sidebar.style.top = '100px'
    sidebar.style.transform = 'translateX(68px)'
    if (
      document.getElementById('wtayot-container') &&
      document.getElementById('wtayot-container').style.visibility !== 'visible'
    )
      document.getElementById('wtayot-container').style.visibility = 'visible'
    if (
      document.getElementById('articleSection') &&
      document.getElementById('articleSection').style.visibility !== 'visible'
    )
      document.getElementById('articleSection').style.visibility = 'visible'
  }
}
function enableHamburger () {
  const button = document.getElementById('toggleSidebar')
  const backdrop = document.getElementById('backdrop')
  backdrop.addEventListener('click', toggleMenu)

  if (button) {
    button.addEventListener('click', toggleMenu)
  }
}

function printDataTable (id, data) {
  const toggleSidebarDiv = document.createElement('div')
  toggleSidebarDiv.id = 'toggleSidebar'

  const mcdonaldsDiv = document.createElement('div')
  mcdonaldsDiv.id = 'mcdonalds'
  mcdonaldsDiv.className = 'menu ham'
  mcdonaldsDiv.setAttribute('data-menu', '3')

  const iconDiv = document.createElement('div')
  iconDiv.className = 'icon'
  mcdonaldsDiv.appendChild(iconDiv)

  toggleSidebarDiv.appendChild(mcdonaldsDiv)

  const container = document.getElementById(id)
  container.appendChild(toggleSidebarDiv)

  const table = document.createElement('table')

  const headerRow = table.insertRow(0)

  const keys = Object.keys(data[0]).reverse()

  keys.forEach(key => {
    const headerCell = headerRow.insertCell()
    headerCell.classList.add('td')
    headerCell.textContent = key
  })

  data.forEach(item => {
    const row = table.insertRow()
    keys.forEach(key => {
      const cell = row.insertCell()
      cell.textContent = item[key]
      if (key === 'url') {
        cell.style.wordBreak = 'break-all'
      }
    })
  })

  container.appendChild(table)
}

const calculateYScale = metric => {
  const maxValue = Math.max(...data.map(item => item[metric]))
  return 250 / maxValue
}

const calculateYRangeLong = (metric, maxLabels = 10) => {
  const maxValue = Math.ceil(Math.max(...data.map(item => item[metric])))
  const step = Math.ceil(maxValue / maxLabels)
  const range = Array.from({ length: maxLabels + 1 }, (_, i) => i * step)
  return range
}
const calculateYRange = metric => {
  const maxValue = Math.ceil(Math.max(...data.map(item => item[metric])))
  const range = Array.from({ length: maxValue + 1 }, (_, i) => i)
  return range
}

const calculateYLabels = metric => {
  const range = calculateYRangeLong(metric)
  const yScale = 300 / range.length
  return range.map((value, index) => ({
    y: 300 - index * yScale,
    label: value
  }))
}
window.addEventListener('resize', event => {
  const speechBubble = document.getElementById('wtayot-bubble')

  if (speechBubble) {
    speechBubble.remove()
  }
})

window.addEventListener('orientationchange', event => {
  Array.from(document.querySelectorAll('.metadata-table')).forEach(el => {
    el.remove()
  })
})

const createBarChart = (svgId, choice, unit) => {
  const svg = document.getElementById(svgId)
  const yLabels = calculateYLabels(choice)
  yLabels.forEach((label, index) => {
    const newYLabel = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'text'
    )
    newYLabel.setAttribute('id', `label${index}`)
    newYLabel.setAttribute('x', 0)
    newYLabel.setAttribute('y', label.y)
    if (label.label === 0 && unit) {
      newYLabel.textContent = label.label + ` (${unit})`
    } else {
      newYLabel.textContent = label.label.toString().substring(0, 79)
    }
    newYLabel.setAttribute('font-size', '11')

    svg.appendChild(newYLabel)
  })
  data.forEach((item, index) => {
    function computeIdealWidth (minPlotPoints) {
      const maxWidth = 500
      const availWidth = window.screen.availWidth
      let maxAllowedWidth = availWidth / minPlotPoints
      const factor =
        window.screen.availWidth < 800
          ? Math.floor(window.screen.availWidth / 5)
          : 120
      maxAllowedWidth = Math.min(maxAllowedWidth, factor)
      const idealWidth = Math.min(maxAllowedWidth, maxWidth)
      return idealWidth
    }

    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
    const recty = item[choice] * calculateYScale(choice)
    rect.setAttribute('id', `rect${index}`)
    rect.setAttribute('x', index * computeIdealWidth(data.length) + 100)
    rect.setAttribute('y', 300 - recty)
    rect.setAttribute('width', 10)
    rect.setAttribute('height', 0)

    setTimeout(() => {
      rect.setAttribute('height', recty)
    }, 100 * index)
    svg.appendChild(rect)
    const title = document.createElement('div')
    title.textContent = `URL: ${item.url}\n 
    Bytes: ${item['content-size']}\nNanoseconds: ${item.nanoseconds}\nBytes per Second: ${item['bytes-per-second']}`
    const titlelabel = document.createElement('div')
    titlelabel.textContent = `URL: ${item.url}\n 
    Bytes: ${item['content-size']}\nNanoseconds: ${item.nanoseconds}\nBytes per Second: ${item['bytes-per-second']}`
    rect.addEventListener('mouseover', e => {
      if (!isTouchDevice()) {
        setTimeout(() => {
          Array.from(document.querySelectorAll('.metadata-label')).forEach(
            el => {
              el.remove()
            }
          )
          titlelabel.classList.add(`metadata-label`)
          titlelabel.style.display = 'block'
          titlelabel.style.position = 'absolute'
          titlelabel.style.left = e.clientX + 'px'
          titlelabel.style.top = e.pageY + 'px'
          document.getElementById('chartSection').appendChild(titlelabel)
        }, 200)
      }
    })

    rect.addEventListener('click', e => {
      Array.from(document.querySelectorAll('.metadata-table')).forEach(el => {
        el.remove()
      })
      Array.from(document.querySelectorAll('.metadata-label')).forEach(el => {
        el.remove()
      })
      if (!isTouchDevice()) {
        title.addEventListener('mouseover', () => {
          title.isActive = true
        })
      } else {
        const offset =
          window.screen.availWidth < window.screen.availHeight ? 330 : 300
        if (window.screen.availWidth < window.screen.availHeight) {
          let chg = e.pageY - e.offsetY

          window.scrollTo({
            top: chg,
            left: 0,
            behavior: 'smooth'
          })
        } else {
          let chg = e.clientY < 330 ? e.pageY - e.offsetY : e.pageY + 50

          window.scrollTo({
            top: chg,
            left: 0,
            behavior: 'smooth'
          })
        }
      }
      setTimeout(() => {
        return
        //stub for adding historical time series data
        Array.from(document.querySelectorAll('.metadata-table')).forEach(el => {
          el.remove()
        })

        title.classList.add(`metadata-table`)
        const newgraph = svg.cloneNode(true)
        title.textContent = `URL: ${item.url}\nSeconds: ${item.seconds}\nNanoseconds: ${item.nanoseconds}\nBytes per Second: ${item.bytespersecond}`

        title.appendChild(newgraph)

        title.style.position = 'absolute'
        title.style.visibility = 'visible'
        title.style.left = e.clientX + 'px'
        title.style.top = e.pageY + 'px'
        if (isTouchDevice()) {
        }
        document.getElementById('chartSection').appendChild(title)
      }, 400)
    })

    rect.addEventListener('mouseout', e => {
      if (!isTouchDevice()) {
        setTimeout(() => {
          if (!title.isActive) {
            Array.from(document.querySelectorAll('.metadata-table')).forEach(
              el => {
                el.remove()
              }
            )
          }
        }, 300)
      }
    })

    text.setAttribute('x', index * computeIdealWidth(data.length) + 93)
    text.setAttribute('y', 300)
    text.style.transform = 'rotate(-90deg)'
    text.style.transformOrigin = `${
      index * computeIdealWidth(data.length) + 93
    }px ${300}px`

    text.textContent = item.url.toString().substring(0, 39)
    text.setAttribute('font-size', '11px')

    svg.appendChild(text)
  })

  const svgRect = svg.getBoundingClientRect()
  const yAxisLabel = document.createElementNS(
    'http://www.w3.org/2000/svg',
    'text'
  )
  yAxisLabel.setAttribute('x', svgRect.width / 2)
  yAxisLabel.setAttribute('y', svgRect.height - 330)
  yAxisLabel.classList.add('tableTitle')
  yAxisLabel.textContent = `[${choice}]`
  svg.appendChild(yAxisLabel)
}

function enableInputs () {
  const headerLabel = document.getElementById('header_label')
  if (headerLabel) {
    headerLabel.addEventListener('click', () => toggleEditAlias())
  }
}

function toggleEditAlias () {
  const editableInput = document.getElementById('editableInput')
  const headerLabel = document.getElementById('header_label')
  if (editableInput.style.visibility !== 'hidden') {
    editableInput.style.visibility = 'hidden'
    editableInput.style.width = '0px'
    headerLabel.style.visibility = 'inherit'
    headerLabel.style.width = 'inherit'
  } else {
    editableInput.style.visibility = 'inherit'
    editableInput.style.width = 'inherit'
    if (headerLabel.style.visibility !== 'hidden') {
      headerLabel.style.visibility = 'hidden'
      headerLabel.style.width = '0px'
    }
  }
}

function toggleNewTestForm () {
  const newTestForm = document.getElementById('newTestForm')
  if (newTestForm) {
    if (newTestForm.style.display !== 'none') {
      newTestForm.style.display = 'none'
      newTestForm.style.height = '0px'
      document.getElementById('wtayot-button').style.display = 'inherit'
    } else {
      newTestForm.style.display = 'table-caption'
      newTestForm.style.height = 'initial'
      document.getElementById('wtayot-button').style.display = 'none'
    }
  }
}
function resizeSVGs () {
  const svgs = document.querySelectorAll('.chart')
  const screenWidth = window.innerWidth
  const scaler = window.devicePixelRatio
  const isPortrait = screenWidth < window.innerHeight
  if (isPortrait && isTouchDevice && window.innerWidth < 600) {
    const scale = screenWidth / (520 + scaler * 2)
    svgs.forEach(function (svg) {
      svg.style.transform = 'scale(' + scale + ')'
    })
  } else {
    svgs.forEach(function (svg) {
      svg.style.transform = 'scale(1)'
    })
  }
}

const updateSpeechBubblePosition = function (isAdd) {
  const articleSection = document.getElementById('articleSection')
  const articles = articleSection.getElementsByTagName('article')
  const speechBubble = document.getElementById('wtayot-bubble')
  if (speechBubble) {
    speechBubble.style.setProperty(
      'top',
      `${articleSection.clientHeight + 10}px`
    )
    speechBubble.style.visibility = 'visible'
    speechBubble.style.display = 'initial'
  }
}

let clickTimeout
const openArticleDetails = function (
  detailsElement,
  maximizeButton,
  minimizeButton
) {
  if (!detailsElement.classList.contains('maximize')) {
    detailsElement.style.visibility = 'visible'
    detailsElement.classList.add('maximize')
    detailsElement.classList.remove('minimize')
    maximizeButton.style.display = 'none'
    detailsElement.style.height = 'auto'
    minimizeButton.style.display = 'inline'
  } else {
    detailsElement.style.visibility = 'hidden'
    detailsElement.classList.remove('maximize')
    detailsElement.classList.add('minimize')
    maximizeButton.style.display = 'inline'
    minimizeButton.style.display = 'none'
    detailsElement.style.height = 0
  }
}

const addArticle = function (textContent, details, timestamp) {
  const speechBubble = document.getElementById('wtayot-bubble')
  if (speechBubble) {
    speechBubble.style.visibility = 'hidden'
  }
  const section = document.getElementById('articleSection')
  const newArticle = document.createElement('article')
  newArticle.id = timestamp
  newArticle.classList.add('slide-in')
  const paragraph = document.createElement('span')
  paragraph.textContent = textContent
  const detailsElement = document.createElement('div')
  detailsElement.style.height = 0
  detailsElement.style.visibility = 'hidden'
  detailsElement.classList.add('details')
  details.forEach(url => {
    const urlDiv = document.createElement('div')
    urlDiv.textContent = `'${url}'`
    detailsElement.appendChild(urlDiv)
  })
  const addButton = document.createElement('button')
  addButton.textContent = 'Details'
  addButton.onclick = function () {
    openArticleDetails(detailsElement, addButton, closeButton)
  }
  const closeButton = document.createElement('button')
  closeButton.textContent = 'Close'
  closeButton.style.display = 'none'
  closeButton.onclick = function () {
    openArticleDetails(detailsElement, addButton, closeButton)
  }

  newArticle.appendChild(paragraph)
  newArticle.appendChild(addButton)
  newArticle.appendChild(closeButton)
  newArticle.appendChild(detailsElement)
  section.appendChild(newArticle)
  if (speechBubble) {
    clearTimeout(clickTimeout)
    clickTimeout = setTimeout(() => {
      updateSpeechBubblePosition(true)
    }, 1200)
  }
}

const removeArticle = function (event) {
  const speechBubble = document.getElementById('wtayot-bubble')
  if (speechBubble) {
    speechBubble.style.visibility = 'hidden'
    speechBubble.style.display = 'none'
  }
  event.preventDefault()
  const button = event.currentTarget
  const article = button.parentNode
  article.classList.remove('slide-in')
  article.classList.add('slide-out')
  const html = document.querySelector('html')
  html.style.overflowX = 'hidden'
  article.classList.add(article.dataset.animationClass)
  article.addEventListener('oanimationend', removeHandler)
  article.addEventListener('animationend', removeHandler)
  article.addEventListener('webkitAnimationEnd', removeHandler)
  function removeHandler () {
    article.remove()
    html.style.removeProperty('overflow-x')
    article.removeEventListener('oanimationend', removeHandler)
    article.removeEventListener('animationend', removeHandler)
    article.removeEventListener('webkitAnimationEnd', removeHandler)
  }

  clearTimeout(clickTimeout)
  clickTimeout = setTimeout(() => {
    updateSpeechBubblePosition(false)
  }, 1200)
}

function render () {
  if (data) {
    document.getElementById('data-container').innerHTML = null
    document.getElementById('barChartNanoseconds').innerHTML = null
    document.getElementById('barChartBytespersecond').innerHTML = null
    document.getElementById('barChartContentSize').innerHTML = null
    printDataTable('data-container', data)
    enableHamburger()
    createBarChart('barChartNanoseconds', 'nanoseconds', 'ns')
    createBarChart('barChartBytespersecond', 'bytes-per-second', 'B/s')
    createBarChart('barChartContentSize', 'content-size', 'bytes')
  }
}

window.addEventListener('load', () => {
  enableInputs()
})
