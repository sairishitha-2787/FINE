import sys
import os
sys.path.append(os.getcwd())
from waste_dss.engine import get_location_profile
from waste_dss.routing import get_optimized_route, calculate_savings
from waste_dss.economics import evaluate_economics

def test_engine():
    lat, lon = 17.3850, 78.4867
    profile = get_location_profile(lat, lon)
    print("Profile:", profile)
    assert "Point Type" in profile
    assert "Total Weight (kg)" in profile
    assert profile["Estimated Units"] > 0

def test_routing():
    points = [(17.3850, 78.4867), (17.4000, 78.5000), (17.3700, 78.4700)]
    path, dist = get_optimized_route(points)
    print("Path:", path, "Dist:", dist)
    assert len(path) == 3
    assert dist > 0

def test_economics():
    total_w = 1000
    breakdown = {"Plastic": 200, "Metal": 100, "Organic": 500, "Paper": 200}
    eco = evaluate_economics(total_w, breakdown)
    print("Economics:", eco)
    assert eco["Estimated Profit ($)"] is not None

if __name__ == "__main__":
    test_engine()
    test_routing()
    test_economics()
    print("All tests passed!")
