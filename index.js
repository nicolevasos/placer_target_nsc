/* global turf c3  */

'use strict';

const config = {
  
  accessToken: 'pk.eyJ1IjoiZG5zYWxhemFyMTAiLCJhIjoiY2tsbWZrOXJ1MDBpbDJucW1samV2bm1mYiJ9.YEsHNfZ2Uuq24dU71UPTUA',
  mapStyle: 'mapbox://styles/dnsalazar10/cloj12t1y004n01qsc1ynf5vv',
  sourceLayer: 'pop-5miles-5n5ojq',
/**Chart Title */
  title1: 'Seattle Target store Overview', 
  title: 'Population Growth 2019-2027',
  description:
    "This graph shows population growth from 2019 to 2022 and a growth forecast for 2027, within a radius of up to 5 miles to the store's round. Select a county to view historical data.",
  /*** Data fields to chart from the source data*/
  fields: [
    'pop_19',
    'pop_20',
    'pop_21',
    'pop_22',
    'pop_27',
  ],
  /*** Labels for the X Axis*/
  labels: [ '2019','2020', '2021', '2022','2027'],
  /*** The name of the data field to pull the place name from for chart labeling ("Total Votes in placeNameField, placeAdminField")*/
  placeNameField: 'name',
  /*** (_Optional_) The name of the administrative unit field to use in chart labeling ("Total Votes in placeNameField, placeAdminField")*/
  placeAdminField: 'state_abbrev',
  /**
   * This sets what type of summary math is used to calculate the initial chart, options are 'avg' or 'sum' (default)
   * Use 'avg' for data that is a rate like turnout %, pizzas per capita or per sq mile
   */
  summaryType: 'avg',
  /*** Label for the graph line */
  dataSeriesLabel: 'Voter Turnout',
  /*** Basic implementation of zooming to a clicked feature*/
  zoomToFeature: true,
  /**
   * Color to highlight features on map on click
   * TODO: add parameter for fill color too?
   */
  highlightColor: '#fff',
  /**
   * (_Optional_) Set this to 'bar' for a bar chart, default is line
   */
  chartType: 'line',
  /**
   * The name of the vector source, leave as composite if using a studio style,
   * change if loading a tileset programmatically
   */
  sourceId: 'composite'
};

/** ******************************************************************************
 * Don't edit below here unless you want to customize things further
 */
/**
 * Disable this function if you edit index.html directly
 */
(() => {
  document.title = config.title1;
  document.getElementById('sidebar-title').textContent = config.title;
  document.getElementById('sidebar-description').innerHTML = config.description;
})();

/**
 * We use C3 for charts, a layer on top of D3. For docs and examples: https://c3js.org/
 */
const chart = c3.generate({
  bindto: '#chart',
  data: {
    // TODO make the initial chart have as many points as the number of fields
    columns: [['data', 0, 0]],
    names: { data: config.dataSeriesLabel },
    // To make a bar chart uncomment this line
    type: config.chartType ? config.chartType : 'line',
    colors: {
      data: '#e50024', // Change 'your_desired_color_here' to the color you want
    },

  },
  axis: {
    x: {
      type: 'category',
      categories: config.labels,
    },
  },
  size: {
    height: 300,
  },
});

let bbFull;
let summaryData = [];
// For tracking usage of our templates
const transformRequest = (url) => {
  const isMapboxRequest =
    url.slice(8, 22) === 'api.mapbox.com' ||
    url.slice(10, 26) === 'tiles.mapbox.com';
  return {
    url: isMapboxRequest ? url.replace('?', '?pluginName=charts&') : url,
  };
};
mapboxgl.accessToken = config.accessToken;
const map = new mapboxgl.Map({
  container: 'map',
  style: config.mapStyle,
  // Change this if you want to zoom out further
  center: [-122.771,47.480],
  zoom: 7.72,
  minZoom: 7,
  maxZoom:12,
  transformRequest,
});
map.on('zoom', () => {
  // Check the current zoom level
  const zoomLevel = map.getZoom();

  // Define the minimum zoom level to display the chart
  const minZoomToShowChart = 9.59;

  // Check if the zoom level is greater than or equal to the minimum zoom level
  if (zoomLevel >= minZoomToShowChart) {
    // Show the container with the chart and its components
    document.getElementById('sidebar').style.display = 'block';
    document.getElementById('chart').style.display = 'block';
  } else {
    // Hide the container when the zoom level is below the minimum level
    document.getElementById('sidebar').style.display = 'none';
    document.getElementById('chart').style.display = 'none';
  }
});

map.once('idle', () => {
  bbFull = map.getBounds();

  buildLegend();

  /** Layer for onClick highlights, to change to a fill see this tutorial: https://docs.mapbox.com/mapbox-gl-js/example/hover-styles/ */
  map.addLayer({
    id: 'highlight',
    type: 'line',
    source: 'composite',
    'source-layer': config.sourceLayer,
    paint: {
      'line-color': config.highlightColor,
      'line-width': 2,
      'line-opacity': [
        'case',
        ['boolean', ['feature-state', 'active'], false],
        0.7,
        0,
      ],
    },
  });

  function addLayerIfNotExists(layerId, layerOptions) {
    if (!map.getLayer(layerId)) {
      map.addLayer(layerOptions);
    } else {
      console.log(`Layer with id ${layerId} already exists`);
    }
  }
  

  addLayerIfNotExists('shops_2310', {
    id: 'shops_2310',
    type: 'custom',
    source: 'https://api.mapbox.com/styles/v1/dnsalazar10/cloextwxu003p01p8gfds9cec.html?title=view&access_token=pk.eyJ1IjoiZG5zYWxhemFyMTAiLCJhIjoiY2tsbWZrOXJ1MDBpbDJucW1samV2bm1mYiJ9.YEsHNfZ2Uuq24dU71UPTUA&zoomwheel=true&fresh=true#8.71/47.5116/-122.2621',
    paint: {
      'fill-color': 'rgba(200, 100, 240, 0.4)',
      'fill-outline-color': 'rgba(200, 100, 240, 1)',
    }
  });
  
  addLayerIfNotExists('lines-5miles', {
    id: 'lines-5miles',
    type: 'custom',
    source: 'https://api.mapbox.com/styles/v1/dnsalazar10/cloextwxu003p01p8gfds9cec.html?title=view&access_token=pk.eyJ1IjoiZG5zYWxhemFyMTAiLCJhIjoiY2tsbWZrOXJ1MDBpbDJucW1samV2bm1mYiJ9.YEsHNfZ2Uuq24dU71UPTUA&zoomwheel=true&fresh=true#8.71/47.5116/-122.2621',
    paint: {
      'fill-color': 'rgba(200, 100, 240, 0.4)',
      'fill-outline-color': 'rgba(200, 100, 240, 1)',
    }
  });
  

 // Function to toggle the visibility of a layer
 function toggleLayer(layerId, checkboxId) {
  const checkbox = document.getElementById(checkboxId);
  // Replace with your map's code to toggle the layer visibility
  map.setLayoutProperty(layerId, 'visibility', checkbox.checked ? 'visible' : 'none');
}

// Function to toggle the visibility of the layer control panel on hover
function toggleLayerControl() {
  var layerControl = document.getElementById('layer-control');
  layerControl.style.display = 'block';
}

// Add hover event listeners to the expand button
var expandButton = document.getElementById('expand-button');
expandButton.addEventListener('mouseenter', toggleLayerControl);
expandButton.addEventListener('mouseleave', function() {
  var layerControl = document.getElementById('layer-control');
  layerControl.style.display = 'none';
});

// Add hover event listeners to the layer control panel
var layerControl = document.getElementById('layer-control');
layerControl.addEventListener('mouseenter', function() {
  layerControl.style.display = 'block';
});
layerControl.addEventListener('mouseleave', function() {
  layerControl.style.display = 'none';
});

// Set up event listeners for checkbox changes
document.getElementById('barriosCheckbox').addEventListener('change', () => {
  toggleLayer('shops_2310', 'barriosCheckbox');
});

document.getElementById('callesCheckbox').addEventListener('change', () => {
  toggleLayer('pop-5miles', 'callesCheckbox');
});
document.getElementById('hCheckbox').addEventListener('change', () => {
  toggleLayer('lines-5miles', 'hCheckbox');
});

// Function to toggle the visibility of the 'calles' layer
function toggleLayerCalles() {
  const callesCheckbox = document.getElementById('callesCheckbox');
  if (!callesCheckbox.checked) {
    document.getElementById('sidebar').style.display = 'none';
    document.getElementById('chart').style.display = 'none';
  } else {
    document.getElementById('sidebar').style.display = 'block';
    // Check the zoom level here and show/hide the chart accordingly
    const zoomLevel = map.getZoom();
    const minZoomToShowChart = 9.59;
    if (zoomLevel >= minZoomToShowChart) {
      document.getElementById('chart').style.display = 'block';
    }
  }
}

// Add change event listener to the 'calles' layer checkbox
document.getElementById('callesCheckbox').addEventListener('change', toggleLayerCalles);


map.on('click', 'shops_2310', function(e) {
  const feature = e.features[0];
  
  const popup = new mapboxgl.Popup()
    .setLngLat(e.lngLat)
    .setHTML(`<h3><b>Ranking Position: ${feature.properties.Rank}</b></h3><p>Total Visits: ${feature.properties['Total Visits']}</p>`)
    .addTo(map);
});

map.on('mouseenter', 'shops_2310', function() {
  map.getCanvas().style.cursor = 'pointer';
});

map.on('mouseleave', 'shops_2310', function() {
  map.getCanvas().style.cursor = '';
});

map.on('click', 'lines-5miles', function(e) {
  const feature = e.features[0];
  
  const popup = new mapboxgl.Popup()
    .setLngLat(e.lngLat)
    .setHTML(`<h3><b>Road Type: ${feature.properties.road_type}</b></h3><p>Volume of Traffic: ${feature.properties.volumes}</p>`)
    .addTo(map);
});

map.on('mouseenter', 'lines-5miles', function(e) {
  const feature = e.features[0];

  const popup = new mapboxgl.Popup()
    .setLngLat(e.lngLat)
    .setHTML(`<h3><b>Road Type: ${feature.properties.road_type}</b></h3><p>Volume of Traffic: ${feature.properties.volumes}</p>`)
    .addTo(map);

  // Set a variable to track the open popup
  let openPopup = popup;

  // Prevent the cursor from reverting to the default style
  map.getCanvas().style.cursor = 'pointer';

  // Close the popup when the cursor leaves the feature
  map.on('mouseleave', 'lines-5miles', function() {
    if (openPopup) {
      openPopup.remove();
      openPopup = null;
      map.getCanvas().style.cursor = '';
    }
  });
});

  map.on('click', onMapClick);
  /**
   * 'In contrast to Map#queryRenderedFeatures, this function returns all features matching the query parameters,
   * whether or not they are rendered by the current style (i.e. visible). The domain of the query includes all
   * currently-loaded vector tiles and GeoJSON source tiles: this function does not check tiles outside the currently visible viewport.'
   * https://docs.mapbox.com/mapbox-gl-js/api/map/#map#querysourcefeatures
   *
   * To graph all features within the viewport, change this to queryRenderedFeatures and trigger on 'idle' or 'render'
   * */
  const sourceFeatures = map.querySourceFeatures(config.sourceId, {
    sourceLayer: config.sourceLayer,
  });
  processSourceFeatures(sourceFeatures);
});




document.getElementById('resetButton').onclick = () => {
  document.getElementById('resetButton').style.backgroundColor = 'red';
  if (summaryData) {
    updateChartFromFeatures(summaryData);
    highlightFeature();
  }
  if (bbFull) {
    map.fitBounds(bbFull);
  }
  
};

function onMapClick(e) {
  const clickedFeature = map
    .queryRenderedFeatures(e.point)
    .filter((item) => item.layer['source-layer'] === config.sourceLayer)[0];
  if (clickedFeature) {
    if (config.zoomToFeature) {
      const bb = turf.bbox(clickedFeature.geometry);
      map.fitBounds(bb, {
        padding: 150,
      });
    }
    highlightFeature(clickedFeature.id);
    updateChartFromClick(clickedFeature);
  }
}

function processSourceFeatures(features) {
  const uniqueFeatures = filterDuplicates(features);

  const data = uniqueFeatures.reduce(
    (acc, current) => {
      config.fields.forEach((field, idx) => {
        acc[idx] += current.properties[field];
      });
      return acc;
    },
    config.fields.map(() => 0),
  );

  // Save the queried data for resetting later
  if (config.summaryType === 'avg') {
    summaryData = data.map((i) => i / uniqueFeatures.length);
  } else {
    summaryData = data;
  }
  updateChartFromFeatures(summaryData);
}

let activeFeatureId;
function highlightFeature(id) {
  if (activeFeatureId) {
    map.setFeatureState(
      {
        source: config.sourceId,
        sourceLayer: config.sourceLayer,
        id: activeFeatureId,
      },
      { active: false },
    );
  }
  if (id) {
    map.setFeatureState(
      {
        source: config.sourceId,
        sourceLayer: config.sourceLayer,
        id,
      },
      { active: true },
    );
  }
  activeFeatureId = id;
}
// Because tiled features can be split along tile boundaries we must filter out duplicates
// https://docs.mapbox.com/mapbox-gl-js/api/map/#map#querysourcefeatures
function filterDuplicates(features) {
  return Array.from(new Set(features.map((item) => item.id))).map((id) => {
    return features.find((a) => a.id === id);
  });
}

function updateChartFromFeatures(features) {
  chart.load({
    columns: [['data'].concat(features)],
    names: { data: `${config.dataSeriesLabel}` },
  });
}

/**
 * This function takes in the clicked feature and builds a data object for the chart using fields
 * specified in the config object.
 * @param {Object} feature
 */
function updateChartFromClick(feature) {
  const data = config.fields.reduce((acc, field) => {
    acc.push(feature.properties[field]);
    return acc;
  }, []);

  chart.load({
    columns: [['data'].concat(data)],
    names: {
      // Update this to match data fields if you don't have the same data schema, it will look for `name` and `state_abbrev` fields
      data: config.placeAdminField
        ? `${config.dataSeriesLabel} in ${
            feature.properties[config.placeNameField]
          }, ${feature.properties[config.placeAdminField]}`
        : `${config.dataSeriesLabel} in ${
            feature.properties[config.placeNameField]
          }`,
    },
  });
}

/**
 * Builds out a legend from the viz layer
 */
function buildLegend() {
  const legend = document.getElementById('legend');
  const legendColors = document.getElementById('legend-colors');
  const legendValues = document.getElementById('legend-values');

  if (config.autoLegend) {
    legend.classList.add('block-ml');
    const style = map.getStyle();
    const layer = style.layers.find((i) => i.id === config.studioLayerName);
    const fill = layer.paint['fill-color'];
    // Remove the interpolate expression to get the stops
    const stops = fill.slice(3);
    stops.forEach((stop, index) => {
      // Every other value is a value, and then a color. Only iterate over the values
      if (index % 2 === 0) {
        // Default to 1 decimal unless specified in config
        const valueEl = `<div class='col align-center'>${stop.toFixed(
          typeof config.autoLegendDecimals !== 'undefined'
            ? config.autoLegendDecimals
            : 1,
        )}</div>`;
        const colorEl = `<div class='col h12' style='background-color:${
          stops[index + 1]
        }'></div>`;
        legendColors.innerHTML += colorEl;
        legendValues.innerHTML += valueEl;
      }
    });
  } else if (config.legendValues) {
    legend.classList.add('block-ml');
    config.legendValues.forEach((stop, idx) => {
      const key = `<div class='col h12' style='background-color:${config.legendColors[idx]}'></div>`;
      const value = `<div class='col align-center'>${stop}</div>`;
      legendColors.innerHTML += key;
      legendValues.innerHTML += value;
    });
  }
}


