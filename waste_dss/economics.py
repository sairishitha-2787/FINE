def evaluate_economics(total_weight, breakdown):
    """
    total_weight in kg
    breakdown: dict of categories
    """
    # Conversion factors (USD per kg)
    prices = {
        "Plastic": 0.5,
        "Metal": 1.2,
        "Paper": 0.2,
        "Organic": 0.05 # Composting/Biogas
    }

    recyclable_tonnage = (breakdown["Plastic"] + breakdown["Metal"] + breakdown["Paper"]) / 1000
    landfill_tonnage = (total_weight - (breakdown["Plastic"] + breakdown["Metal"] + breakdown["Paper"])) / 1000

    # Revenue
    revenue = sum(breakdown[cat] * prices[cat] for cat in prices)

    # Costs
    sorting_cost = total_weight * 0.1 # $0.1 per kg
    logistics_cost = total_weight * 0.05 # $0.05 per kg

    operational_cost = sorting_cost + logistics_cost
    profit = revenue - operational_cost

    # Waste-to-Energy (Potential in kWh)
    # Organic waste -> Biogas -> Electricity
    # Plastic/Paper -> Incineration (not always eco-friendly but a metric)
    wte_potential = (breakdown["Organic"] * 0.2) + (breakdown["Plastic"] * 0.5) # hypothetical kWh per kg

    return {
        "Recyclable Tonnage (Metric Tons)": round(recyclable_tonnage, 3),
        "Landfill Tonnage (Metric Tons)": round(landfill_tonnage, 3),
        "Operational Cost ($)": round(operational_cost, 2),
        "Estimated Profit ($)": round(profit, 2),
        "Waste-to-Energy Potential (kWh)": round(wte_potential, 2)
    }
