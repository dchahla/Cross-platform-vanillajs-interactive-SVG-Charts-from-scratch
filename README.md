# Happy-Charts - SVG charts from scratch in 2024 (rewriting AWS visualization core in vanilla js)
A barebone, easily portable SVG visualizations in Vanilla JavaScript

Play with the codepen [here.](https://codepen.io/urdoingitwrong/pen/abMMqRx)
See it in use [here.](https://chahla.net/static/byte-barometer/)

# Interactable SVG Charts from scratch 
---
Start to finish in 30 minutes or less.

---

| Background | Context |
| ------ | ------ |
| AWS charts are... less than to be desired on mobile. UI is hard. So is the backend. They are running the world's infustructure, god forbid someone wants to check status while on Mobile. It is 2024; let's build something better. To do that, first we must start our requirements. | ![AWS.IS.A.LOT.OF.TALK](https://res.cloudinary.com/swoopshop/image/upload/f_auto,q_auto/y1d6h5r3h1ycvkqnfhzq) |


**The charts shall...**
- Be dynamically constructed as SVGs on the client's side. 
- Allow for the inspection of a specific point. 
- Have proper labels with units of measure.
- Print data clearly for all devices. 
- Be able to invalidate cached data and re-render. 
- Be a drop-in using vanilla js, so there are no excuses. 
- Not make you feel sad when you look at them.


Before building, you will need a JSON-valid flat array of the data you want to chart. 

If you are working with logs, check out my parsing low-level print statements in native JavaScript.  Otherwise, feel free to follow along using the example provided.


You are ready to move on once you have a JSON-valid flat array. 
```

data[0]
├── string "url": https://weather.com
└── Number "content-size": 0,
└── Number "nanoseconds": 4890831,
└── Number "seconds": 0.004890831,
└── Number "bytes-per-second": 0
data[1]
├── string "url": https://amazon.com
└── Number "content-size": 6591,
└── Number "nanoseconds": 617613938,
└── Number "seconds": 0.617613938,
└── Number "bytes-per-second": 10671.71511922712
data[2]
├── string "url": https://sugarbeats.com
└── Number "content-size": 1591459,
└── Number "nanoseconds": 893689449,
└── Number "seconds": 0.893689449,
└── Number "bytes-per-second": 1780774.0728960983
data[3]
├── string "url": https://youtube.com
└── Number "content-size": 868768,
└── Number "nanoseconds": 968598554,
└── Number "seconds": 0.968598554,
└── Number "bytes-per-second": 896932.9929435349
```
```
const data = [
  {
    "url": "ttps://weather.com",
    "content-size": 0,
    "nanoseconds": 4890831,
    "seconds": 0.004890831,
    "bytes-per-second": 0
  },
  {
    "url": "https://amazon.com",
    "content-size": 6591,
    "nanoseconds": 617613938,
    "seconds": 0.617613938,
    "bytes-per-second": 10671.71511922712
  },
  {
    "url": "https://sugarbeats.com",
    "content-size": 1591459,
    "nanoseconds": 893689449,
    "seconds": 0.893689449,
    "bytes-per-second": 1780774.0728960983
  },
  {
    "url": "https://youtube.com",
    "content-size": 868768,
    "nanoseconds": 968598554,
    "seconds": 0.968598554,
    "bytes-per-second": 896932.9929435349
  }
]
```

Now that we have data. Let's chart some shit!  

First, We will need an HTML element to attach our logic to. While this can be dynamically created in JavaScript, I prefer to set the *width* and *height* upfront to be able to see how it fits on mobile. 

```
<svg id="barChartNanoseconds" class="chart" width="500" height="340"></svg>
```

To avoid recreating a situation in which we are charting things but cannot determine their units of measure. 
 *cough* Let's tackle the y-labels next.
 
- [Full article here:](https://medium.com/@dchahla/svg-charts-from-scratch-in-2024-2f95d029c3bf) - SVG charts from scratch in 2024 (rewriting AWS visualization core in vanilla js)

----

I've gotten a number of PM's on about achieving moment.js using vanilla JavaScript. Hope this helps build you something awesome. Show me a star if this helped you. 

```

const eventTimestamp = new Date().getTime() + msUntil
const timeUntilEvent = getTimeUntilEvent(eventTimestamp)

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

```
