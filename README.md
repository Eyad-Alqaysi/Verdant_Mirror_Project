
# Verdant Mirror - 3D Plant Simulation and Analysis

## Overview

Verdant Mirror is a web-based application that combines advanced machine learning models and 3D visualization to assist farmers in making informed decisions about crop cultivation. By analyzing environmental factors such as temperature, humidity, light intensity, and CO2 levels, the application predicts the suitability of the environment for planting and provides recommendations for improving or maintaining plant health.

## Features

- **3D Plant Simulation:** Interactive 3D visualization of plant growth based on environmental conditions.
- **Machine Learning Predictions:** Classifies environments as Sustainable, Moderate, or Unsustainable for farming.
- **ChatGPT Recommendations:** Provides personalized recommendations to optimize farming conditions using OpenAI's GPT-3.5.

## Technologies Used

- **Frontend:**
  - HTML, CSS, JavaScript
  - Three.js for 3D rendering
- **Backend:**
  - Python, Flask
  - Scikit-learn for machine learning model
  - OpenAI API for generating recommendations
- **Model:**
  - Decision Tree Classifier for predicting environmental suitability

## Project Structure

```bash
├── index.html         # Main HTML file
├── styles.css         # CSS for styling the web interface
├── main.js            # JavaScript for 3D rendering and interaction
├── app.py             # Flask backend server
└── README.md          # Project documentation
```

## Getting Started

### Prerequisites

- Python 3.x
- Flask
- Scikit-learn
- OpenAI Python client
- Three.js (included via CDN)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/verdant-mirror.git
   cd verdant-mirror
   ```

2. Install the required Python packages:
   ```bash
   pip install flask scikit-learn openai flask-cors
   ```

3. Set up your OpenAI API key in the \`app.py\` file:
   ```python
   client = OpenAI(api_key="your-openai-api-key")
   ```

### Running the Application

1. Start the Flask server:
   ```bash
   python app.py
   ```

2. Open `index.html` in your web browser to interact with the application.

### Usage

- Enter the environmental parameters (Temperature, Humidity, Light Intensity, CO2 Level) and click "Analysis."
- The system will predict whether the environment is sustainable, moderate, or unsustainable for planting.
- Based on the prediction, a 3D model of the plant will be displayed.
- The system will then provide a recommendation using ChatGPT to optimize plant growth.

## Future Enhancements

- Expand the dataset to improve the accuracy of the prediction model.
- Integrate additional environmental factors for more precise analysis.
- Enhance the 3D visualization with more plant species and growth stages.
