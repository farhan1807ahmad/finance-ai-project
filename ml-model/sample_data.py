"""
Sample synthetic expense data for training ML models.
Used as fallback when real database has insufficient records (<10).
"""

from datetime import datetime, timedelta
import random

def generate_sample_data():
    """
    Generate 50 rows of realistic synthetic expense data.
    Returns list of dicts with keys: description, amount, category, date, notes
    """
    categories = ['Food', 'Transport', 'Shopping', 'Bills', 'Health', 'Entertainment', 'Other']
    
    # Define realistic spending patterns per category (in INR)
    category_amounts = {
        'Food': (300, 2000),           # ₹300-2000
        'Transport': (50, 1500),       # ₹50-1500
        'Shopping': (500, 5000),       # ₹500-5000
        'Bills': (1000, 10000),        # ₹1000-10000
        'Health': (200, 3000),         # ₹200-3000
        'Entertainment': (100, 2000),  # ₹100-2000
        'Other': (100, 1000)           # ₹100-1000
    }
    
    data = []
    base_date = datetime.now() - timedelta(days=180)  # Last 6 months
    
    for i in range(50):
        # Distribute dates over last 6 months
        date = base_date + timedelta(days=random.randint(0, 180))
        
        # Pick a random category
        category = random.choice(categories)
        
        # Generate amount based on category
        min_amt, max_amt = category_amounts[category]
        amount = round(random.uniform(min_amt, max_amt), 2)
        
        # Create realistic descriptions
        descriptions = {
            'Food': ['Groceries', 'Restaurant dinner', 'Coffee shop', 'Lunch', 'Snacks', 'Grocery store'],
            'Transport': ['Taxi/Uber', 'Bus fare', 'Petrol', 'Auto rickshaw', 'Train ticket', 'Parking'],
            'Shopping': ['Clothes', 'Electronics', 'Shoes', 'Books', 'Accessories', 'Home items'],
            'Bills': ['Electricity bill', 'Water bill', 'Internet bill', 'Phone bill', 'Rent', 'Insurance'],
            'Health': ['Medicine', 'Doctor visit', 'Gym membership', 'Hospital', 'Dentist', 'Pharmacy'],
            'Entertainment': ['Movie tickets', 'Gaming', 'Streaming', 'Concert', 'Sports', 'Games'],
            'Other': ['Miscellaneous', 'Tips', 'Gifts', 'Donation', 'Misc expense']
        }
        
        description = random.choice(descriptions[category])
        
        data.append({
            'description': description,
            'amount': amount,
            'category': category,
            'date': date.isoformat(),
            'notes': f'Auto-generated sample data #{i+1}'
        })
    
    return data


if __name__ == '__main__':
    # For testing
    data = generate_sample_data()
    print(f"Generated {len(data)} sample records")
    for record in data[:5]:
        print(record)
