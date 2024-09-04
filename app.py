from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from joblib import load
import numpy as np
from openai import OpenAI
import os

app = Flask(__name__)
CORS(app)

# Set up OpenAI client
client = OpenAI(api_key="")

# Load the Random Forest Classifier model
model_path = 'static/rfc_model.joblib'
rfc_model = load(model_path)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json
    features = np.array([[
        data['temperature'],
        data['soil_type'],
        data['annual_rainfall'],
        data['dry_season_duration']
    ]])
    
    prediction = rfc_model.predict(features)[0]
    
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

    prompt = f"""Given a plant growth prediction of {prediction} with the following conditions:
    - Temperature: {data['temperature']}°C
    - Soil Type: {data['soil_type']}
    - Annual Rainfall: {data['annual_rainfall']} mm
    - Dry Season Duration: {data['dry_season_duration']} months
    
    Provide a brief recommendation for improving or maintaining plant health."""
    
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