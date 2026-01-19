# Waste Management Decision Support System (DSS)

## Overview
The Waste Management Decision Support System (DSS) is an innovative full-stack application built with Streamlit and Mapbox (via Folium) that enables urban planners and waste management companies to generate and analyze synthetic waste data.

### 🚀 Core Features

#### 1. Geospatial Synthetic Data Engine
- **Interactive Map**: Focused on Hyderabad, India, allowing users to select locations by clicking.
- **On-Click Profiling**: Automatically identifies location types (Residential, Industrial, Commercial).
- **Urban Density Scaling**: Estimates the number of units/houses based on proximity to city density centers.
- **Statistical Interpolation**: Generates high-fidelity synthetic waste datasets including Total Weight, Category Breakdown (Plastic, Metal, Organic, Paper), and Hazard Level.

#### 2. Routing & Efficiency Analytics
- **Optimized Route Generator**: Uses **Ant Colony Optimization (ACO)** to find the most efficient collection path for a cluster of points.
- **Comparison Engine**: Compares the optimized route against a traditional static route.
- **Savings Dashboard**:
  - **Fuel Saved**: Estimated in liters based on reduced mileage.
  - **Time Saved**: Reduction in daily collection hours.
  - **Trips Saved**: Redundant vehicle trips eliminated.

#### 3. Techno-Economic Evaluation
- **Recycling Impact Report**: Tracks diverted vs. landfill waste tonnage.
- **Financial Modeling**: Calculates Operational Costs (logistics, sorting) vs. Estimated Profit from sold recyclables.
- **Waste-to-Energy Potential**: Estimations of energy recovery potential (kWh) from organic and plastic waste.

#### 4. High-Contrast Visuals
- Interactive bar charts for waste categories.
- Heat map visualization for waste hotspots.
- Dark-themed, high-contrast UI for professional urban monitoring.

## 🛠️ Tech Stack
- **Frontend/UI**: Streamlit
- **Geospatial**: Folium, Folium Plugins (HeatMap, PolyLine)
- **Algorithms**: Ant Colony Optimization (ACO), Deterministic Heuristics
- **Data Visualization**: Plotly Express
- **Language**: Python 3.9+

## 📦 Installation & Setup

1. **Navigate to the directory**:
   ```bash
   cd waste_dss
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the Application**:
   ```bash
   streamlit run app.py
   ```

## 👥 Team Credits
- **Sai Rishitha**
- **Vedha Sri**
- **Hamsika Goud**
- **Mokshitha Vemula**

**Mentor**: Dr. Segun Emmanuel Ibitoye
