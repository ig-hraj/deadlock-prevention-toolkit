# Deadlock Prevention & Recovery Toolkit

A major project that simulates an OS-style resource manager in an operating system.  
It supports:

- Deadlock **prevention** using Banker's Algorithm  
- Deadlock **detection**  
- Deadlock **recovery** (victim selection + resource release)  
- An interactive **web dashboard** for visualizing matrices and wait-for relations

## 1. Tech Stack

- Python 3  
- Flask (backend REST API)  
- HTML5, CSS3, Vanilla JavaScript (frontend)  

## 2. Features

- Dynamic number of **processes (n)** and **resource types (m)**
- Editable **Max**, **Allocation**, and **Available** inputs
- Automatic **Need matrix** computation
- **Safe state check** with safe sequence display
- **Deadlock detection** using safety-style algorithm
- **Deadlock recovery** by aborting a selected victim process
- Live **wait-for graph** as an adjacency list
- Color-coded logs:  
  - ✅ Safe / success  
  - ⚠️ Warnings  
  - ❌ Deadlocks / unsafe states

## 3. How to Run

```bash
# Install dependencies
pip install flask

# Run the application
python app.py

# Open in browser
http://127.0.0.1:5000/
