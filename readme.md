AI was used for debugging help

# Seattle SNAP Retailer Dashboard

## Live Demo
<https://[anna-beck].github.io/[SNAPdashboard]/>


---

## Project Overview

This smart dashboard maps SNAP-authorized retailer access in Seattle by neighborhood. The dashboard uses a Mapbox GL JS choropleth map with a C3.js bar chart so it is possible to see which neighborhoods have more SNAP retailers, and how those patterns change.

The map shades Seattle neighborhoods by the number of SNAP retailers located inside each polygon. The total count shown in the info panel updates based on the current display region.

---

## Thematic Map

This project uses a choropleth map.

- Neighborhood polygons are shaded based on SNAP retailer count.
- A graduated (step) color scheme is used to symbolize counts.
- Clicking a neighborhood opens a popup showing the neighborhood name and the SNAP retailer count.

A choropleth approach is appropriate here because the point data (retailer locations) would be too visually cluttered on its own. Shading based on counts per polygon allows for immediate understanding of the distribution of SNAP retailers across Seattle neighborhoods.

---

## Dashboard

### Map (Mapbox GL JS)
- Choropleth fill layer for neighborhoods
- Outline layer for neighborhood boundaries
- Clickable popups that show the neghorhood name and the SNAP retailer count

### Dynamic Bar Chart (C3.js)
- Displays the top 10 neighborhoods by SNAP retailer count
- Updates when the map display region changes
- Clicking a bar filters the map to just selected neighborhood

### Info Panel
- Displays the number of SNAP retailers in the current display region (updates as the map moves)

### Legend
- Class breaks and labels for “Retailers per neighborhood”
- Source links included

### Reset
- Returns the map to the initial Seattle view
- Clears any neighborhood filters

---


### Data Sources
- SNAP Retailer Locations: USDA FNS
- Seattle Neighborhood Boundaries

---

## Data Links

SNAP retailers:
<https://usda-snap-retailers-usda-fns.hub.arcgis.com/datasets/8b260f9a10b0459aa441ad8588c2251c/explore?location=6.440261%2C-14.737150%2C2>

Seattle neighborhoods:
<https://services.arcgis.com/ZOyb2t4B0UYuYNYH/arcgis/rest/services/nma_nhoods_main/FeatureServer/0>

---

## Technologies Used

- Mapbox GL JS
- Turf.js
- C3.js + D3.js
- HTML / CSS / JavaScript

## Docs Used and Referenced

- <https://turfjs.org/docs/api/booleanPointInPolygon>
- <https://developers.arcgis.com/rest/services-reference/enterprise/query-feature-service-layer/>
- <https://turfjs.org/docs/api/centroid>
- <https://turfjs.org/docs/api/bbox>
