# RAILOPTIMA Frontend Interactive Update

This version keeps the existing FastAPI, database, ML models, traffic data and optimization engine intact and upgrades the frontend interaction layer.

## Added interactions
- Clickable railway network nodes with selected-section detail state.
- Asset Intelligence search across asset ID, section and asset type.
- Asset risk filters: All / Critical / Attention / Healthy.
- Asset refresh button with loading animation.
- Click any asset row to open a detailed condition modal.
- Asset modal links directly to the Block Planner.
- Keyboard `/` shortcut focuses the asset search box.
- Traffic Forecast section/date controls plus LOW/MEDIUM/HIGH filtering.
- Maintenance Backlog risk filters with live record count.
- More visible live/dataset telemetry states and micro-interactions.
- Responsive modal, filters and controls for smaller screens.
- Existing backend-connected block generation and approval workflow preserved.

## Run
Use the same backend/frontend commands from README.md. No new backend service is required.
