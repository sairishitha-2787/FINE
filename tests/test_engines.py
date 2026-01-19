import unittest
import numpy as np
from waste_dss.engine import get_location_profile
from waste_dss.routing import get_optimized_route, calculate_savings
from waste_dss.economics import evaluate_economics

class TestWasteDSSEngines(unittest.TestCase):
    def setUp(self):
        self.test_coords = [
            (17.3850, 78.4867),
            (17.3950, 78.4967),
            (17.4050, 78.5067)
        ]

    def test_geospatial_engine(self):
        profile = get_location_profile(17.3850, 78.4867)
        self.assertIn('Point Type', profile)
        self.assertIn('Total Weight (kg)', profile)
        self.assertIn('Category Breakdown', profile)
        self.assertIn('Hazard Level', profile)
        self.assertIn(profile['Point Type'], ['Residential', 'Commercial', 'Industrial'])

    def test_routing_engine(self):
        best_path, best_dist = get_optimized_route(self.test_coords)
        self.assertEqual(len(best_path), len(self.test_coords))

        # Test savings calculation
        savings = calculate_savings(10.0, 8.0)
        self.assertIn("Fuel Saved (Liters)", savings)
        self.assertGreater(savings["Fuel Saved (Liters)"], 0)

    def test_economics_engine(self):
        profile = get_location_profile(17.3850, 78.4867)
        report = evaluate_economics(profile['Total Weight (kg)'], profile['Category Breakdown'])
        self.assertIn('Recyclable Tonnage (Metric Tons)', report)
        self.assertIn('Estimated Profit ($)', report)
        self.assertIn('Waste-to-Energy Potential (kWh)', report)

if __name__ == '__main__':
    unittest.main()
