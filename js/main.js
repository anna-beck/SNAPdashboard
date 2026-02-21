
mapboxgl.accessToken =
    'pk.eyJ1IjoiYW5uYWJ1dyIsImEiOiJjbWt6MHQ2Y3owZG9yM2dwd3Rsbmd3Z2VjIn0.8mbsdZSWQd8bNdc2tYgNrA';


let map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/dark-v10',
    zoom: 10,
    minZoom: 9,
    center: [-122.3321, 47.6062]
});


let nhoodChart = null,
    nhoodsFC = null,
    snapFC = null,
    visibleRetailers = 0;


const grades = [0, 1, 5, 10, 20];
const colors = [
    'rgb(237,248,233)',
    'rgb(186,228,179)',
    'rgb(116,196,118)',
    'rgb(49,163,84)',
    'rgb(0,109,44)',
    'rgb(0,68,27)'
];


const legend = document.getElementById('legend');
let labels = ['<strong>Retailers per neighborhood</strong>'];
let vbreak;

for (let i = 0; i < grades.length; i++) {
    vbreak = grades[i];

    let labelText;
    if (i === grades.length - 1) {
        labelText = vbreak + '+';
    } else {
        labelText = vbreak + '–' + (grades[i + 1] - 1);
    }

    labels.push(
        '<p class="break">' +
        '<span class="swatch" style="background:' + colors[i] + ';"></span>' +
        '<span class="swatch-label">' + labelText + '</span>' +
        '</p>'
    );
}

const source =
    '<p style="text-align:right; font-size:10pt; margin:0;">' +
    'Sources: <a href="https://services1.arcgis.com/RLQu0rK7h4kbsBq5/ArcGIS/rest/services/snap_retailer_location_data/FeatureServer" target="_blank">USDA FNS</a>, ' +
    '<a href="https://services.arcgis.com/ZOyb2t4B0UYuYNYH/arcgis/rest/services/nma_nhoods_main/FeatureServer/0" target="_blank">Seattle neighborhoods</a>' +
    '</p>';

legend.innerHTML = labels.join('') + source;


const NHOODS_URL =
    'https://services.arcgis.com/ZOyb2t4B0UYuYNYH/arcgis/rest/services/nma_nhoods_main/FeatureServer/0/query?outFields=*&where=1%3D1&f=geojson';

const SNAP_QUERY_BASE =
    'https://services1.arcgis.com/RLQu0rK7h4kbsBq5/arcgis/rest/services/snap_retailer_location_data/FeatureServer/0/query';


async function fetchJSON(url) {
    let response = await fetch(url);
    return await response.json();
}


function buildSnapBBoxQueryURL(bbox, offset, recordCount) {
    
    const geometry = bbox[0] + ',' + bbox[1] + ',' + bbox[2] + ',' + bbox[3];

    const params = new URLSearchParams({
        f: 'geojson',
        where: '1=1',
        outFields: '*',
        returnGeometry: 'true',
        outSR: '4326',
        geometryType: 'esriGeometryEnvelope',
        spatialRel: 'esriSpatialRelIntersects',
        inSR: '4326',
        geometry: geometry,
        resultOffset: String(offset),
        resultRecordCount: String(recordCount)
    });

    return SNAP_QUERY_BASE + '?' + params.toString();
}


async function loadSnapPointsForBBox(bbox) {
    let all = [];
    let offset = 0;
    const pageSize = 2000;

    while (true) {
        const url = buildSnapBBoxQueryURL(bbox, offset, pageSize);
        const data = await fetchJSON(url);

        if (data && data.features && data.features.length > 0) {
            all = all.concat(data.features);
        }

        const got = (data && data.features) ? data.features.length : 0;
        const exceeded = (data && data.properties && data.properties.exceededTransferLimit === true);

        
        if (got < pageSize || exceeded === false) {
            break;
        }

        offset += pageSize;

       
        if (offset > 200000) {
            break;
        }
    }

    return {
        type: 'FeatureCollection',
        features: all
    };
}


function countSnapInNeighborhoods(nhoodFC, snapPointsFC) {
    
    nhoodFC.features.forEach(function (f) {
        f.properties.retailer_count = 0;
    });

    
    snapPointsFC.features.forEach(function (pt) {
        for (let i = 0; i < nhoodFC.features.length; i++) {
            const poly = nhoodFC.features[i];
            if (turf.booleanPointInPolygon(pt, poly)) {
                poly.properties.retailer_count += 1;
                break;
            }
        }
    });

    return nhoodFC;
}


function calcVisibleRetailers(nhoodFC, currentMapBounds) {
    let total = 0;

    nhoodFC.features.forEach(function (f) {
      
        const c = turf.centroid(f).geometry.coordinates;
        if (currentMapBounds.contains(c)) {
            total += Number(f.properties.retailer_count || 0);
        }
    });

    return total;
}


function buildTop10(nhoodFC) {
    let rows = [];

    nhoodFC.features.forEach(function (f) {
        const name = f.properties.L_HOOD || 'Neighborhood';
        const count = Number(f.properties.retailer_count || 0);
        rows.push({ name: name, count: count });
    });

    rows.sort(function (a, b) { return b.count - a.count; });
    rows = rows.slice(0, 10);

    const x = ['Neighborhood'];
    const y = ['#'];

    rows.forEach(function (r) {
        x.push(r.name);
        y.push(r.count);
    });

    return { x: x, y: y };
}


async function geojsonFetch() {

    nhoodsFC = await fetchJSON(NHOODS_URL);

    const bbox = turf.bbox(nhoodsFC);

   
    snapFC = await loadSnapPointsForBBox(bbox);

   
    nhoodsFC = countSnapInNeighborhoods(nhoodsFC, snapFC);

   
    if (map.loaded()) {
        addLayersAndUI();
    } else {
        map.once('load', addLayersAndUI);
    }
}


function addLayersAndUI() {

    
    map.addSource('nhoods', {
        type: 'geojson',
        data: nhoodsFC
    });

  
    map.addLayer({
        id: 'nhoods-fill',
        type: 'fill',
        source: 'nhoods',
        paint: {
            'fill-color': [
                'step',
                ['coalesce', ['to-number', ['get', 'retailer_count']], 0],
                colors[0],
                grades[1], colors[1],
                grades[2], colors[2],
                grades[3], colors[3],
                grades[4], colors[4],
                999999, colors[5]
            ],
            'fill-opacity': 0.75
        }
    }, 'waterway-label');

    
    map.addLayer({
        id: 'nhoods-outline',
        type: 'line',
        source: 'nhoods',
        paint: {
            'line-color': 'rgba(255,255,255,0.35)',
            'line-width': 0.8
        }
    }, 'waterway-label');

   
    map.on('click', 'nhoods-fill', function (event) {
        const p = event.features[0].properties;
        const name = p.L_HOOD || 'Neighborhood';
        const count = Number(p.retailer_count || 0);

        new mapboxgl.Popup()
            .setLngLat(event.lngLat)
            .setHTML('<strong>' + name + '</strong><br>SNAP retailers: ' + count)
            .addTo(map);
    });

    map.on('mouseenter', 'nhoods-fill', function () {
        map.getCanvas().style.cursor = 'pointer';
    });

    map.on('mouseleave', 'nhoods-fill', function () {
        map.getCanvas().style.cursor = '';
    });

    
    visibleRetailers = calcVisibleRetailers(nhoodsFC, map.getBounds());
    document.getElementById("retailer-count").innerHTML = visibleRetailers;

    
    const top = buildTop10(nhoodsFC);

    nhoodChart = c3.generate({
        size: { height: 350, width: 460 },
        data: {
            x: 'Neighborhood',
            columns: [top.x, top.y],
            type: 'bar',
            onclick: function (d) {
                const clickedName = top.x[1 + d.x];
                map.setFilter('nhoods-fill', ['==', ['get', 'L_HOOD'], clickedName]);
                map.setFilter('nhoods-outline', ['==', ['get', 'L_HOOD'], clickedName]);
            }
        },
        axis: {
            x: { type: 'category' }
        },
        legend: { show: false },
        bindto: "#nhood-chart"
    });

    
    map.on('idle', function () {
        visibleRetailers = calcVisibleRetailers(nhoodsFC, map.getBounds());
        document.getElementById("retailer-count").innerHTML = visibleRetailers;

        const t = buildTop10(nhoodsFC);
        nhoodChart.load({
            columns: [t.x, t.y]
        });
    });

    
    const reset = document.getElementById('reset');
    reset.addEventListener('click', function (event) {
        map.flyTo({
            zoom: 10,
            center: [-122.3321, 47.6062]
        });
        map.setFilter('nhoods-fill', null);
        map.setFilter('nhoods-outline', null);
    });
}


geojsonFetch();