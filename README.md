### About this site

This site was produced around 2017, and then it was updated in 2026 using Claude.

### Coding Sources

[simple bar chart](https://www.amcharts.com/demos/simple-column-chart/)
[US geoJSON/geolocation data source](https://leafletjs.com/examples/choropleth/)
[igismap example](https://www.igismap.com/portfolio/climate/) (similar to this site, but with some major changes)
[choropleth/shading example](https://github.com/timwis/leaflet-choropleth)

---

### Data Methodology

Most metrics are sourced directly from published state-level tables and require no transformation. The following metrics involve a calculation or aggregation step.

#### Cost of Living Adjusted Income

**Source columns:** BLS 2025 median annual earnings by state; BEA Regional Price Parities (RPP) by state.

**Formula:**
```
Adjusted Income = Annual Earnings ÷ (RPP ÷ 100)
```

The BEA's Regional Price Parity index expresses each state's price level relative to the national average (100 = U.S. average). Dividing nominal earnings by (RPP ÷ 100) converts the figure into real purchasing-power terms. For example, a state with a median annual income of $60,000 and an RPP of 120 has an adjusted income of $60,000 ÷ 1.20 = $50,000 — meaning a dollar goes less far there than the nominal wage suggests.

---

#### Natural Disaster Risk — Expected Annual Loss Score (FEMA NRI)

**Source:** FEMA National Risk Index (NRI), state-level table, December 2025 release (`NRI_Table_States.csv`), downloaded from [OpenFEMA](https://www.fema.gov/about/openfema/data-sets/national-risk-index-data). The file contains one row per state with pre-computed composite scores across 18 natural hazard types: avalanche, coastal flooding, cold wave, drought, earthquake, hail, heat wave, hurricane, ice storm, inland flooding, landslide, lightning, strong wind, tornado, tsunami, volcanic activity, wildfire, and winter weather.

**Column used:** `EAL_SCORE` — the Expected Annual Loss composite score. This is a normalized 0–100 index where 100 represents the state with the highest modeled expected annual loss (California). It combines estimated annual financial losses to buildings and agriculture, and human losses (expressed as a population equivalence dollar value), weighted by the historical frequency and severity of each hazard type in each state.

No aggregation was required: unlike the county-level datasets used elsewhere in this project, the NRI state table provides a single row per state with the score already computed at the state level by FEMA.

**Note:** A higher EAL Score means a state faces greater expected annual losses from natural disasters — it reflects both the *frequency and severity of hazards* and the *value of what is exposed* (buildings, people, farmland). It is not a per-capita or rate-adjusted measure, so large, populous states (California, Texas, Florida) tend to score high partly due to their size and exposure. For a rate-adjusted view, FEMA also publishes an `ALR_NPCTL` (Annual Loss Rate National Percentile) which accounts for the value of what is at risk.
