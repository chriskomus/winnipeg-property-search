/*
    Assignment 4 - Winnipeg Property Search
    Name: Chris Komus
    Date:2/09/22
*/

function load() {
  document.getElementById('search-address').addEventListener('submit', submitSearch);
  document.getElementById('address-input').addEventListener('keyup', waitForChanges);
  clearItems();
}

function submitSearch(e) {
    e.preventDefault();
    searchForAddress();
}

function searchForAddress() {
  clearItems();
  loading();

  let fullAddress = document.getElementById('address-input').value.toUpperCase().trim();

  if (fullAddress != '') {
    // If a user enters an abbreviation (ie: rd), replace it with the full street type (ie: road)
    fullAddress = fullAddress.replace(new RegExp('[.]+$'), '');
    for(let i in streetType) {
      let lastIndex = fullAddress.lastIndexOf(i);
      if (fullAddress.endsWith(i)) {
        fullAddress = fullAddress.substring(0, lastIndex) + streetType[i];
        break;
      }
    }

    // retreive data from json
    let apiUrl = 'https://data.winnipeg.ca/resource/d4mq-wa44.json?' +
                    `$where=full_address LIKE '%${fullAddress}%'` +
                    '&$order=street_number ASC' +
                    '&$limit=100';
    let encodedURL = encodeURI(apiUrl);

    fetch(encodedURL)
    .then(function (result) {
      return result.json();
    })
    .then(function (data) {
      clearItems();
      // console.log(data);

      if (data.length > 0) {
        let main = document.getElementById('list');
        for (let i=0; i<data.length; i++) {
          // Replace any nulls with empty strings
          if (data[i].zoning == null) { var zoning = '' } else { var zoning = data[i].zoning };
          if (data[i].full_address == null) { var fullAddress = '' } else { var fullAddress = data[i].full_address };
          if (data[i].neighbourhood_area == null) { var neighbourhoodArea = '' } else { var neighbourhoodArea = data[i].neighbourhood_area };
          if (data[i].total_assessed_value == null) { var assessedValue = '' } else { var assessedValue = data[i].total_assessed_value };
          if (data[i].assessment_date == null) { var assessedDate = '' } else { var assessedDate = new Date(data[i].assessment_date); assessedDate = assessedDate.toDateString() };
          if (data[i].property_class_1 == null) { var propertyClass = '' } else { var propertyClass = data[i].property_class_1 };
          if (data[i].property_use_code == null) { var propertyUse = '' } else { var propertyUse = data[i].property_use_code; propertyUse = propertyUse.split("- ").pop(); };
          if (data[i].year_built == null) { var yearBuilt = '' } else { var yearBuilt = data[i].year_built; };
          if (data[i].rooms == null) { var rooms = '' } else { var rooms = data[i].rooms; };
          if (data[i].total_living_area == null) { var totalLivingArea = '' } else { var totalLivingArea = data[i].total_living_area; };

          // Create elements
          let newDiv = document.createElement('div');
          let newH3 = document.createElement('h3');
          let newH4 = document.createElement('h4');
          let newP = document.createElement('p');
          let newP2 = document.createElement('p');

          // Set icon based on first character of zoning data
          var icon = 'building';
          if (data[i].zoning != null) {
            let zonePrefix = data[i].zoning.charAt(0);
            if (zonePrefix in zoningIcon) {
              icon = zoningIcon[zonePrefix];
            }
          }

          // Fill header and p elements
          newDiv.className = 'item';
          newH3.innerHTML =  `<div class="tooltip"><i class="fa-solid fa-${icon}"></i>
                              <span class="tooltip-text">Zone: ${titleCase(zoning)}</span></div> -
                              <span class="tooltip" id="tooltip-thumbnail-${i}">${titleCase(fullAddress)}
                              <span class="tooltip-text thumbnail"><i class="fa-solid fa-spinner fa-spin thumbnail-load"></i></span></span>`;
          newH4.innerHTML =   `<i class="fa-solid fa-map-pin"></i> - ${titleCase(neighbourhoodArea)}`;
          newP.innerHTML =    `<div class="tooltip">${(titleCase(assessedValue) * 1).toLocaleString('en-US', { style: 'currency', currency: 'USD'})}
                              <span class="tooltip-text">Assessed: ${assessedDate}</span></div>`;
          newP2.innerHTML =   `${titleCase(propertyClass)} - ${titleCase(propertyUse)}`;

          // Append Elements
          main.appendChild(newDiv);
          newDiv.appendChild(newH3);
          newDiv.appendChild(newH4);

          // Sq footage, Year Built, # of Rooms
          if (totalLivingArea != '') {
            let newSpanTotalLivingArea = document.createElement('span');
            newSpanTotalLivingArea.innerHTML = `<i class="fa-solid fa-ruler"></i> ${totalLivingArea} sq ft`;
            newDiv.appendChild(newSpanTotalLivingArea);
            newSpanTotalLivingArea.classList.add('blob');
            newSpanTotalLivingArea.classList.add('blob-orange');
          }

          if (yearBuilt != '') {
            let newSpanYear = document.createElement('span');
            newSpanYear.innerHTML = `<div class="tooltip no-underline"><i class="fa-solid fa-hammer"></i> ${yearBuilt}<span class="tooltip-text">Year Built</span></div>`;
            newDiv.appendChild(newSpanYear);
            newSpanYear.classList.add('blob');
            newSpanYear.classList.add('blob-orange');
          }

          if (rooms != '') {
            let newSpanRooms = document.createElement('span');
            newSpanRooms.innerHTML = `${rooms} Rooms`;
            newDiv.appendChild(newSpanRooms);
            newSpanRooms.classList.add('blob');
            newSpanRooms.classList.add('blob-orange');
          }

          // Append property class/use and assessed value
          newDiv.appendChild(newP2);
          newDiv.appendChild(newP);

          // Icons representing property features and their associated tooltip text and data request.
          for(let j = 0; j < propertyFeatures.length; j++) {
            let feature = propertyFeatures[j];
            let newSpan = document.createElement('span');
            if (data[i][feature[2]] == 'Yes') {
              newSpan.innerHTML = `<div class="tooltip no-underline"><i class="fa-solid fa-${feature[0]}"></i><span class="tooltip-text">${feature[1]}</span></div>`;
              newDiv.appendChild(newSpan);
              newSpan.classList.add('blob');
            }
          }

          // Show main
          main.classList.add('show');
          main.classList.remove('hide');

          // Google Maps Static Street View API
          // A mouseenter event listener is added to each tooltip-thumbnail span,
          // This creates a request and displays an image only on mouseenter,
          // rather than making 100 requests every time the page loads!
          let apiMapUrl = 'https://maps.googleapis.com/maps/api/streetview?' +
                          `location='%${fullAddress + 'Winnipeg, MB, Canada'}%'` +
                          '&size=200x200&fov=80&heading=70&pitch=0&' +
                          `key=AIzaSyBb-qYolb69COgWHwhnpRwRiDA4Kxp-3Zo`;
          let encodedMapURL = encodeURI(apiMapUrl);
          document.getElementById('tooltip-thumbnail-' + [i]).addEventListener('mouseenter', function(e) {
            if (!this.getElementsByTagName("img")[0]) {
                let newImage = document.createElement('img');
                newImage.src = encodedMapURL;
                this.getElementsByTagName("span")[0].appendChild(newImage);
            }
          });
        }
      }
      else {
        clearItems();

        let main = document.getElementById('list');
        let newH1 = document.createElement('h1');
        newH1.innerHTML = 'No addresses found.';

        main.appendChild(newH1);

        main.classList.add('show');
        main.classList.remove('hide');
      }
    });
  }
}

function clearItems() {
  let main = document.getElementById('list');
  main.classList.remove('show');
  main.classList.add('hide');

  let list = document.getElementById('list')
  while (list.firstChild) {
      list.firstChild.remove()
  }
}

function loading() {
  let main = document.getElementById('list');
  let newH1 = document.createElement('h1');
  newH1.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
  main.appendChild(newH1);
}

// Change string to title case
function titleCase(str) {
  str = str.toLowerCase().split(' ');
  for (var i = 0; i < str.length; i++) {
    str[i] = str[i].charAt(0).toUpperCase() + str[i].slice(1);
  }
  return str.join(' ');
}

// Delay processing on input text changes to prevent too many page updates.
// When first keyup event happens on the input box, start the timer.
// Everytime a key is pressed reset the timer. The searchForAddress() function
// is provided to delayProcessing() and will fire once the timer runs out.
var waitForChanges = delayProcessing();

function delayProcessing() {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => { searchForAddress(); }, 500);
  };
}

// If a user enters an abbreviation (ie: rd), replace it with the full street type (ie: road)
var streetType = {
'ST': 'STREET',
'RD': 'ROAD',
'DR': 'DRIVE',
'PL': 'PLACE',
'AVE': 'AVENUE',
'CRES': 'CRESCENT',
'BLVD': 'BOULEVARD',
'HWY': 'HIGHWAY',
'LNDG': 'LANDING',
'LN': 'LANE',
'MT': 'MOUNT',
'TRWY': 'THROUGHWAY',
'SQ': 'SQUARE'
};

// Set icon based on first character of zoning data
var zoningIcon = {
  'A': 'tractor', // agriculture
  'P': 'tree', // park
  'R': 'house-chimney-window', // residential
  'C': 'building', // commercial
  'M': 'industry', // industrial
};

// Icons representing property features and their associated tooltip text and data reference.
var propertyFeatures = [
  ['water-ladder', 'Inground Pool', 'pool'],
  ['warehouse', 'Attached Garage', 'attached_garage'],
  ['warehouse', 'Detached Garage', 'detached_garage'],
  ['arrow-down-short-wide', 'Basement', 'basement'],
  ['couch', 'Finished Basement', 'basement_finish'],
  ['fire', 'Fireplace', 'fire_place'],
  ['wind', 'Central Air Conditioning', 'air_conditioning']
];

document.addEventListener('DOMContentLoaded', load);
