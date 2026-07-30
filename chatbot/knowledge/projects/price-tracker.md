# 🛒 PriceTracker

An Amazon price monitoring automation project that tracks product prices and sends email alerts when items drop to desired levels.

## 🎮 Overview
This project automatically monitors Amazon product prices, logs price history, and sends email notifications when products reach user-defined target prices. Built with Python using web scraping, CSV logging, and Gmail SMTP for email alerts.

## 🌟 Key Features
- **Product Price Tracking**: Monitors Amazon product prices continuously
- **Price History Logging**: CSV-based price history tracking
- **Email Alerts**: Gmail SMTP integration for instant notifications
- **Smart Detection**: Custom price threshold triggering
- **Web Scraping**: BeautifulSoup for HTML parsing
- **Automated Logging**: Timestamped price records

## 🛠️ Technologies Used
- **Programming Language:** Python
- **Web Scraping:** BeautifulSoup (HTML parsing)
- **Data Storage:** CSV files for price history
- **Email Integration:** Gmail SMTP for notifications
- **Security:** Environment variables and .env files
- **Dependencies:** requests, beautifulsoup4, python-dotenv

## 📁 Project Structure
```
day47_pricetracker/
├── main.py              # Core price tracking and alert logic
├── data.csv            # Price history (data file)
├── .env                # Environment variables (.env file)
├── .gitignore          # Git ignore patterns
├── requirements.txt    # Python dependencies
├── README.md           # This documentation
└── .venv               # Virtual environment
```

## 🚀 How It Works

### 1. Web Scraping
- Fetches Amazon product page HTML using requests
- Uses BeautifulSoup to parse and extract price information
- Targets specific Amazon product pages

### 2. Price Processing
- Extracts price from HTML (`a-offscreen` class)
- Converts to numeric value (removing currency symbols)
- Compares against desired price threshold

### 3. Data Logging
- Appends current price to CSV file
- Includes timestamp and product information
- Maintains historical price records

### 4. Alert System
- When price ≤ desired price → send email alert
- Uses Gmail SMTP with TLS encryption
- Includes product link and price information

## 🔧 Technical Implementation

### Product Configuration
```python
ITEM = "Adjustable-dumbbell-upgraded-Kettlebells-Exercise"
URL = f"https://www.amazon.com/{ITEM}/dp/B0DB1FDJ9C/..."
DESIRED_PRICE = 20000  # PKR target
```

### Web Scraping Logic
```python
response = requests.get(URL, headers=header)
soup = BeautifulSoup(response.text, "html.parser")
price = soup.find(class_="a-offscreen").get_text()
without_currency = (price.split("PKR")[1]).replace(",", "")
floated_value = float(without_currency)
```

### Email Alert System
```python
if floated_value <= DESIRED_PRICE:
    with smtplib.SMTP("smtp.gmail.com", 587) as connection:
        connection.starttls()
        connection.login(my_email, password)
        connection.sendmail(
            from_addr=my_email,
            to_addrs="recipient@gmail.com",
            msg=f"Subject:PRICE TRACKER\n\nThe {ITEM} has reached PKR {DESIRED_PRICE}\nBuy at: {URL}"
        )
```

## 📊 Features Explained

### Price Monitoring
- **Real-time Checking**: Extracts current price from live page
- **Automated Execution**: Scheduled via GitHub Actions
- **Reliable Parsing**: Targets specific Amazon HTML elements
- **Currency Handling**: Converts to numeric values for comparison

### Data Logging
- **Timestamping**: Records when prices were checked
- **Product Info**: Stores product names alongside prices
- **CSV Format**: Easy to import into spreadsheets
- **Append Mode**: Continuously builds price history

### Alert Mechanism
- **Trigger Logic**: Price ≤ desired threshold
- **Email Format**: Clear subject and body with product details
- **Security**: Uses environment variables for credentials
- **Reliability**: TLS encryption for secure email sending

## 🏆 Learning Outcomes
This project demonstrates:
- **Web Scraping**: HTML parsing with BeautifulSoup
- **Data Management**: CSV file handling and timestamping
- **Email Automation**: SMTP protocol and secure communication
- **Environment Security**: Secure credential management
- **Automation**: Scheduling and monitoring systems

## 📝 Future Enhancements
- **Multiple Products**: Track multiple Amazon items
- **Alert Categories**: Different alert types (price drop, new low)
- **Dashboard**: Web dashboard for price monitoring
- **Historical Analysis**: Price trend charts and predictions
- **Mobile Alerts**: Push notifications and SMS
- **Price Comparison**: Compare prices across retailers

## ⚡ Performance Considerations
- **Web Efficiency**: Minimal requests with proper headers
- **Memory Management**: Streamed CSV writing
- **Network Reliability**: Timeout and retry mechanisms
- **Security**: Environment variable and encrypted email

---
*Built with Python and Amazon automation | Perfect for learning web scraping and email integration | Price tracking made simple*
