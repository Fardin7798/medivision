# API Documentation — MediVision Backend

Base URL: `http://localhost:5000` (or `https://medivision-api.onrender.com` on Render)

---

## 1. Health Check
- **Endpoint**: `GET /api/health`
- **Response**:
```json
{
  "status": "healthy",
  "service": "MediVision Backend API",
  "version": "1.2.0",
  "timestamp": "2026-09-04T00:20:00.000Z"
}
```

---

## 2. Clinical Cases Library (5 Scenarios)
- **Endpoint**: `GET /api/cases`
- **Response**: Array of 5 patient cases:
  1. `case-cranial-glioma` (Cranial Glioma Resection)
  2. `case-hepatic-resection` (Hepatic Segmentectomy VI/VII)
  3. `case-lumbar-spine` (Lumbar Spine Pedicle Screw)
  4. `case-dbs-electrode` (Deep Brain Stimulation STN Lead)
  5. `case-avm-vascular` (Cerebral AVM / Aneurysm Vascular Clipping)

---

## 3. AI Segmentation Proxy
- **Endpoint**: `POST /api/segment`
- **Payload**:
```json
{
  "sliceIndex": 128,
  "plane": "axial",
  "promptType": "point",
  "promptCoordinates": [{ "x": 130, "y": 145 }],
  "labelId": "Glioma Core Target"
}
```
- **Response**:
```json
{
  "status": "success",
  "source": "medivision-ai-engine-simulated",
  "labelId": "Glioma Core Target",
  "sliceIndex": 128,
  "plane": "axial",
  "confidence": 0.948,
  "areaMm2": 385,
  "boundingBox": { "xMin": 108, "yMin": 123, "xMax": 152, "yMax": 167 },
  "isInterimSimulation": true
}
```

---

## 4. Point-Based Landmark Registration
- **Endpoint**: `POST /api/register`
- **Payload**:
```json
{
  "fixedPoints": [[0, 85, -20], [-75, -15, -30], [75, -15, -30]],
  "movingPoints": [[2, 83, -19], [-74, -16, -28], [76, -14, -31]],
  "method": "kabsch-svd"
}
```
- **Response**:
```json
{
  "status": "success",
  "source": "svd-quaternion-solver-exact",
  "solverMethod": "kabsch-svd",
  "pairedLandmarks": 3,
  "targetRegistrationErrorMm": 1.319,
  "translationVectorMm": [-1.167, 0.533, -0.367],
  "isClinicallyAcceptable": true
}
```
