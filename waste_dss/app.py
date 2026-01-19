import streamlit as st
import pandas as pd
import numpy as np
import folium
from streamlit_folium import st_folium
import plotly.express as px
from folium.plugins import HeatMap
from engine import get_location_profile
from routing import get_optimized_route, calculate_savings
from economics import evaluate_economics

st.set_page_config(page_title="Waste Management DSS", layout="wide")

# Custom CSS for high contrast
st.markdown("""
    <style>
    .main {
        background-color: #0e1117;
        color: #ffffff;
    }
    .stMetric {
        background-color: #1f2937;
        padding: 10px;
        border-radius: 5px;
        border: 1px solid #3b82f6;
    }
    .stSidebar {
        background-color: #111827;
    }
    h1, h2, h3 {
        color: #3b82f6 !important;
    }
    </style>
    """, unsafe_allow_html=True)

st.title("🏙️ Waste Management Decision Support System (DSS)")
st.subheader("Innovating Urban Waste with Geospatial Synthetic Intelligence")

# Credits
st.sidebar.markdown(f"""
<div style="background-color: #1e3a8a; padding: 20px; border-radius: 10px; border: 2px solid #3b82f6;">
    <h3 style="color: white; margin-top: 0;">👥 Team Credits</h3>
    <p style="color: #bfdbfe; font-weight: bold; margin-bottom: 5px;">Developers:</p>
    <ul style="color: white; list-style-type: none; padding-left: 0;">
        <li>🔹 Sai Rishitha</li>
        <li>🔹 Vedha Sri</li>
        <li>🔹 Hamsika Goud</li>
        <li>🔹 Mokshitha Vemula</li>
    </ul>
    <hr style="border-color: #3b82f6;">
    <p style="color: #bfdbfe; font-weight: bold; margin-bottom: 5px;">Mentor:</p>
    <p style="color: white; font-size: 1.1em;">Dr. Segun Emmanuel Ibitoye</p>
</div>
""", unsafe_allow_html=True)

if 'points' not in st.session_state:
    st.session_state.points = []
if 'profiles' not in st.session_state:
    st.session_state.profiles = []

# Map Section
st.write("### 📍 Location-Based Synthetic Data Engine")
with st.expander("ℹ️ How the Synthetic Data Engine works"):
    st.write("""
    The **Geospatial Synthetic Data Engine** uses coordinate-based deterministic algorithms to:
    1. **Identify Point Type**: Heuristic classification into Residential, Commercial, or Industrial zones.
    2. **Estimate Units**: Uses urban density scaling based on proximity to city centers.
    3. **Generate Waste Profiles**: Replicates real-world urban architecture using statistical interpolation of typical category breakdowns (Plastic, Metal, Organic, Paper) and hazard levels.
    """)
st.info("Click on the map to generate a waste profile for that location (Focused on Hyderabad).")

# Hyderabad center
CENTER_START = [17.3850, 78.4867]

m = folium.Map(location=CENTER_START, zoom_start=12, tiles="CartoDB dark_matter")

# Add existing points
for i, p in enumerate(st.session_state.points):
    profile = st.session_state.profiles[i]
    color = "blue"
    if profile["Point Type"] == "Industrial": color = "red"
    elif profile["Point Type"] == "Commercial": color = "green"

    folium.Marker(
        [p[0], p[1]],
        popup=f"{profile['Point Type']} - {profile['Total Weight (kg)']}kg",
        icon=folium.Icon(color=color)
    ).add_to(m)

# Capture Clicks
output = st_folium(m, width=1200, height=500)

if output and output.get("last_clicked"):
    clicked_lat = output["last_clicked"]["lat"]
    clicked_lon = output["last_clicked"]["lng"]

    # Check if point already exists to avoid duplicates on every rerun
    if not any(np.isclose(clicked_lat, p[0]) and np.isclose(clicked_lon, p[1]) for p in st.session_state.points):
        profile = get_location_profile(clicked_lat, clicked_lon)
        st.session_state.points.append((clicked_lat, clicked_lon))
        st.session_state.profiles.append(profile)
        st.rerun()

if st.session_state.points:
    # Dashboard
    col1, col2 = st.columns([1, 1])

    with col1:
        st.write("### 📊 Waste Breakdown")
        df_list = []
        for i, p in enumerate(st.session_state.points):
            prof = st.session_state.profiles[i]
            temp_df = pd.DataFrame(prof["Category Breakdown"].items(), columns=["Category", "Weight"])
            temp_df["Point"] = f"P{i+1}"
            df_list.append(temp_df)

        full_df = pd.concat(df_list)
        fig = px.bar(full_df, x="Point", y="Weight", color="Category",
                     title="Waste Category Breakdown per Point",
                     color_discrete_sequence=px.colors.qualitative.Bold)
        fig.update_layout(template="plotly_dark")
        st.plotly_chart(fig, width="stretch")

    with col2:
        st.write("### 🔥 Waste Hotspot Heatmap")
        heat_map = folium.Map(location=CENTER_START, zoom_start=11, tiles="CartoDB dark_matter")
        heat_data = [[p[0], p[1], prof["Total Weight (kg)"]] for p, prof in zip(st.session_state.points, st.session_state.profiles)]
        HeatMap(heat_data).add_to(heat_map)
        st_folium(heat_map, width=600, height=400, key="heatmap")

    # Routing Section
    st.divider()
    st.write("### 🚚 Routing & Efficiency Analytics")

    if 'optimized_route' not in st.session_state:
        st.session_state.optimized_route = None

    if len(st.session_state.points) >= 2:
        if st.button("Generate Optimized Route"):
            with st.spinner("Optimizing route..."):
                best_path, best_dist = get_optimized_route(st.session_state.points)

                # Static route distance (as added)
                static_dist = 0
                for i in range(len(st.session_state.points) - 1):
                    static_dist += np.sqrt((st.session_state.points[i][0] - st.session_state.points[i+1][0])**2 +
                                        (st.session_state.points[i][1] - st.session_state.points[i+1][1])**2)
                static_dist += np.sqrt((st.session_state.points[-1][0] - st.session_state.points[0][0])**2 +
                                    (st.session_state.points[-1][1] - st.session_state.points[0][1])**2)

                savings = calculate_savings(static_dist, best_dist)
                st.session_state.optimized_route = {
                    "best_path": best_path,
                    "best_dist": best_dist,
                    "savings": savings
                }

        if st.session_state.optimized_route:
            res = st.session_state.optimized_route
            savings = res["savings"]
            best_path = res["best_path"]
            best_dist = res["best_dist"]

            sc1, sc2, sc3 = st.columns(3)
            sc1.metric("Fuel Saved", f"{savings['Fuel Saved (Liters)']} L", delta=f"{savings['Fuel Saved (Liters)']} L")
            sc2.metric("Time Saved", f"{savings['Time Saved (Hours)']} hrs", delta=f"{savings['Time Saved (Hours)']} hrs")
            sc3.metric("Trips Saved", f"{savings['Trips Saved']}", delta=f"{savings['Trips Saved']}")

            st.write(f"**Optimization Result:** ACO reduced the total distance from {savings['Static Distance (km)']} km to {savings['Optimized Distance (km)']} km.")

            # Display Route on Map
            route_map = folium.Map(location=CENTER_START, zoom_start=12, tiles="CartoDB dark_matter")
            ordered_points = [st.session_state.points[i] for i in best_path]
            ordered_points.append(ordered_points[0]) # close loop
            folium.PolyLine(ordered_points, color="cyan", weight=5, opacity=0.8).add_to(route_map)
            for i, p in enumerate(st.session_state.points):
                folium.Marker(p, icon=folium.DivIcon(html=f'<div style="font-size: 12pt; color: white; background: blue; border-radius: 50%; width: 20px; height: 20px; text-align: center;">{i+1}</div>')).add_to(route_map)
            st_folium(route_map, width=1200, height=500, key="route_map")
    else:
        st.warning("Add at least 2 points to generate routing analytics.")

    # Techno-Economic Section
    st.divider()
    st.write("### 💰 Techno-Economic Evaluation (Recycling Profit)")

    total_w = sum(p["Total Weight (kg)"] for p in st.session_state.profiles)
    aggregated_breakdown = {"Plastic": 0, "Metal": 0, "Organic": 0, "Paper": 0}
    for p in st.session_state.profiles:
        for cat in aggregated_breakdown:
            aggregated_breakdown[cat] += p["Category Breakdown"][cat]

    eco_report = evaluate_economics(total_w, aggregated_breakdown)

    ec1, ec2, ec3, ec4 = st.columns(4)
    ec1.metric("Recyclable Waste", f"{eco_report['Recyclable Tonnage (Metric Tons)']} MT")
    ec2.metric("Operational Cost", f"${eco_report['Operational Cost ($)']}")
    ec3.metric("Estimated Profit", f"${eco_report['Estimated Profit ($)']}")
    ec4.metric("WtE Potential", f"{eco_report['Waste-to-Energy Potential (kWh)']} kWh")

    st.write("#### Recycling Impact Summary")
    st.table(pd.DataFrame([eco_report]).T.rename(columns={0: "Value"}))

st.sidebar.button("Reset Data", on_click=lambda: st.session_state.clear())
