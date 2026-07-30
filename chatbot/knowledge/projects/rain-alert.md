# 🌧️ Rain Alert System

A weather monitoring automation project that tracks forecasts and sends timely umbrella reminders via WhatsApp messages.

## 🎮 Overview
This project monitors weather forecasts using OpenWeatherMap API and automatically sends smartphone alerts when rain is predicted. The system checks weather conditions for a specific location and provides timely notifications to help users prepare for rainy weather.

## 🌟 Key Features
- **Weather Monitoring**: Continuous weather forecast checking
- **Rain Detection**: Intelligent rain prediction based on weather codes
- **Instant Alerts**: WhatsApp notifications with umbrella reminders
- **Location-Based**: Geographic-specific weather monitoring
- **Proxy Support**: Works behind corporate firewalls
- **Automated Alerts**: Zero maintenance alerts

## 🛠️ Technologies Used
- **Programming Language:** Python
- **Weather API:** OpenWeatherMap (real-time weather data)
- **Notification API:** Twilio WhatsApp (mobile alerts)
- **Core Libraries:** `requests`, `json`, `twilio`, `os`
- **Weather Logic:** Weather condition code interpretation

## 📁 Project Structure
```
Rain Alert/
├── main.py              # Core weather monitoring and alert logic
├── requirements.txt     # Dependencies
└── README.md           # This documentation
```

## 🚀 How It Works

### 1. Weather Data Collection
- Fetches current weather data from OpenWeatherMap
- Specifies exact location (latitude: 31.561920°, longitude: 74.348083°)
- Stores raw weather data for analysis

### 2. Rain Detection Logic
- Interprets weather condition codes (code < 700 = rain)
- Cross-references multiple weather parameters
- Sets boolean flag for rain prediction

### 3. Smart Alert System
- When rain predicted → Send WhatsApp alert
- Message includes emoji and clear message
- Supports proxy connections for enterprise environments

## 🔧 Technical Implementation

### Weather API Integration
```python
# OpenWeatherMap API integration
API = "https://api.openweathermap.org/data/2.5/weather?"
parameters = {
    "lat": latitude,      # 31.561920
    "lon": longitude,     # 74.348083
    "appid": API_KEY
}
```

### Rain Detection Algorithm
```python
# Weather code interpretation
for hour_data in content:
    condition_data = content["weather"][0]["id"]
    if int(condition_data) < 700:
        will_rain = True
```

### Alert Message System
```python
# Formatted WhatsApp alert
if will_rain:
    client.messages.create(
        body="Bring an Umbrella ☂\nIt will rain today 🌧 ",
        from_="whatsapp:+14155238886",
        to="whatsapp:+923706172268"
    )
```

## 📊 Weather Code Logic

### Weather Condition Interpretation
| Code Range | Weather Condition | Alert Action |
|------------|------------------|-------------|
| < 700      | Rain/Precipitation | Umbrella Alert |
| 700+       | Clear/Dry         | No Alert |

### OpenWeatherMap Weather Codes
- 200-231: Thunderstorm
- 300-321: Drizzle
- 500-531: Rain
- 600-622: Snow
- 700-741: Atmosphere
- 800: Clear Sky
- 801-804: Clouds

## 💡 Use Cases

### Personal Weather Planning
- **Morning Routine**: Get alerted before leaving home
- **Travel Planning**: Check weather for trips
- **Outdoor Activities**: Plan or postpone activities based on forecasts

### Professional Applications
- **Field Operations**: Crew weather checks before deployments
- **Event Planning**: Outdoor event weather monitoring
- **Logistics**: Route planning based on weather conditions

## 🏆 Learning Outcomes
This project demonstrates:
- **Weather API Integration**: Working with meteorological data APIs
- **Weather Logic**: Condition code interpretation and rain detection
- **Mobile Notifications**: Real-time automated messaging
- **Proxy Configuration**: Enterprise network compatibility
- **Error Handling**: Robust weather data processing

## 📝 Future Enhancements
- **Multiple Locations**: Track weather for multiple cities
- **Forecast Window**: Multi-day weather predictions
- **Alert Types**: Weather severity tiers (light, moderate, heavy rain)
- **Backup Alerts**: Email/SMS fallback if WhatsApp fails
- **Weather History**: Track weather patterns over time
- **Custom Alerts**: User-configurable weather conditions and messages

## ⚡ Performance Considerations
- **API Efficiency**: Optimized weather data fetching
- **Network Resilience**: Timeout and retry mechanisms
- **Message Optimization**: Concise, emoji-enhanced alert messages
- **Memory Management**: Stream processing of weather data

---
*Built with Python and weather APIs | Personal weather automation | Perfect for learning weather API integration and automated notifications*
