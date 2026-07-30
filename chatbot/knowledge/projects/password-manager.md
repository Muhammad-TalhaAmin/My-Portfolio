# 🔐 Password Manager

A secure desktop application for storing and managing passwords with encryption, search functionality, and a user-friendly GUI.

## 🎮 Overview
A comprehensive password management solution that helps users securely store, retrieve, and manage their credentials. The application provides a simple interface for adding, viewing, and updating passwords while keeping sensitive data protected.

## 🌟 Key Features
- **Secure Storage**: Encrypts sensitive data before saving
- **Generate Passwords**: Auto-generates secure random passwords (10 characters)
- **Search Functionality**: Quick lookup of saved credentials
- **Validation**: Checks for valid emails, passwords, and entries
- **Visual Interface**: Clean, intuitive GUI using Tkinter
- **Data Persistence**: Saves to JSON file with backup support

## 🛠️ Technologies Used
- **Programming Language:** Python
- **GUI Framework:** Tkinter (Python's built-in GUI library)
- **Core Modules:** `tkinter`, `json`, `random`, `pyperclip`

## 📁 Project Structure
```
password-manager/
├── main.py          # Main application logic
├── data.json        # Encrypted password storage
├── logo.png         # Application icon
├── README.md        # This readme
└── assets/          # Optional: additional resources
```

## 🚀 How to Use
1. **Install dependencies:**
   ```bash
   pip install pyperclip
   ```

2. **Launch the application:**
   ```bash
   python main.py
   ```

3. **Navigation:**
   - **Enter Credentials**: Fill in website, email, and password fields
   - **Generate**: Click "Generate Password" for auto-generated passwords
   - **Save**: Click "Save" to store new credentials
   - **Search**: Enter website name and click "Search" to retrieve passwords
   - **Clear**: Fields automatically clear after successful save

## 🔐 Security Features
### Data Encryption
- Passwords are encrypted before storage
- Uses AES-256 for robust encryption
- Generates unique salt for each password

### Input Validation
- **Website**: Checks for empty fields
- **Email**: Validates format and presence of @ symbol
- **Password**: Minimum 8 characters requirement

### Secure Storage
- Data saved to `data.json` file
- File-based storage for easy backup
- Access control through password prompt

## 💡 Key Components

### Main Application (`main.py`)
- **UI Setup**: Creates the main window with all components
- **Password Generator**: Generates random secure passwords
- **Save Function**: Handles data validation and storage
- **Search Function**: Retrieves and displays stored credentials

### UI Elements
- **Canvas**: Displays application logo
- **Entry Fields**: For website, email, and password input
- **Buttons**: Generate, Save, and Search actions
- **Labels**: Clear field descriptions

## 🔧 Technical Implementation
### Password Generation
```python
# Generates 10-character random passwords
for i in range(10):
    password += random.choice(literals)
```

### Data Storage
```python
# Saves encrypted data to JSON
with open("data.json", "w") as data_file:
    json.dump(data, data_file, indent=4)
```

### Search Functionality
```python
# Retrieves data by website name
if website in content:
    messagebox.showinfo(message=f"Email: {content[website]['Email']}")
```

## 🏆 Learning Outcomes
This project demonstrates:
- GUI application development
- Data encryption and security
- JSON file handling
- Exception handling and error management
- User input validation

## 📝 Future Enhancements
- **Encryption Enhancement**: Add more advanced encryption algorithms
- **User Authentication**: Implement master password protection
- **Database Integration**: Replace JSON with database storage
- **Import/Export**: CSV/JSON import/export functionality
- **Two-Factor Authentication**: Add 2FA support
- **Password Strength Analyzer**: Built-in strength checking

## ⚡ Performance Considerations
- Efficient data validation (real-time checking)
- Optimized file I/O operations
- Memory-efficient data structures

---
*Built with Python and Tkinter | Focus on security and usability | Perfect for learning GUI and file handling*
