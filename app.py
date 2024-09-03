from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from sklearn.tree import DecisionTreeClassifier
from sklearn.preprocessing import StandardScaler
import numpy as np
from openai import OpenAI
import os

app = Flask(__name__)
CORS(app)

# Set up OpenAI client
client = OpenAI(api_key="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")

# Mock data for training
X_train = np.array([
    [20, 50, 5000, 400],
    [22, 55, 5500, 450],
    [25, 60, 6000, 500],
    [27, 65, 6500, 550],
    [30, 70, 7000, 600],
    [32, 75, 7500, 650],
])

y_train = np.array([0, 0, 1, 1, 2, 2])  # 0: Unsustainable, 1: Moderate, 2: Sustainable

# Initialize and train the classifier
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)

clf = DecisionTreeClassifier(random_state=42)
clf.fit(X_train_scaled, y_train)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json
    features = np.array([[
        data['temperature'],
        data['humidity'],
        data['light_intensity'],
        data['co2_level']
    ]])
    
    features_scaled = scaler.transform(features)
    prediction = clf.predict(features_scaled)[0]
    
    class_names = ['Unsustainable', 'Moderate', 'Sustainable']
    result = class_names[prediction]
    
    return jsonify({'prediction': result})

@app.route('/recommend', methods=['POST'])
def recommend():
    data = request.json
    prediction = data['prediction']
    recommendation, error = get_chatgpt_recommendation(prediction, data)
    
    return jsonify({
        'recommendation': recommendation,
        'error': error
    })

def get_chatgpt_recommendation(prediction, data):
    if not client.api_key:
        return None, "OpenAI API key is not set. Please configure the API key."

    prompt = f"Given a plant growth prediction of {prediction} with temperature {data['temperature']}°C, humidity {data['humidity']}%, light intensity {data['light_intensity']} lux, and CO2 level {data['co2_level']} ppm, provide a brief recommendation for improving or maintaining plant health."
    
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful assistant that provides recommendations for plant health."},
                {"role": "user", "content": prompt}
            ]
        )
        return response.choices[0].message.content.strip(), None
    except Exception as e:
        print(f"Error calling ChatGPT API: {e}")
        return None, f"Error calling ChatGPT API: {str(e)}"

if __name__ == '__main__':
    app.run(debug=True)