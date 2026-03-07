from flask import Flask, jsonify
from flask_cors import CORS
import json
# Import the functions/blueprints from your subfolders
from models.server import audio_bp
from AmazonRekognition.main import image_bp

app = Flask(__name__)
CORS(app)



@app.route('/', methods=['GET'])
def health_check():
    """
    This route provides a simple health check. 
    It confirms the API Gateway and Server are responsive.
    """
    return jsonify({
        "status": "Healthy",
        "message": "EmerMedi AI Engine is operational.",
        "endpoints": {
            "audio_analysis": "/predict",
            "visual_analysis": "/predict-image"
        }
    }), 200



# Register the blueprints
app.register_blueprint(audio_bp)
app.register_blueprint(image_bp)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)