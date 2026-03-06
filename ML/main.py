from flask import Flask
from flask_cors import CORS
# Import the functions/blueprints from your subfolders
from models.server import audio_bp
from AmazonRekognition.main import image_bp

app = Flask(__name__)
CORS(app)

# Register the blueprints
app.register_blueprint(audio_bp)
app.register_blueprint(image_bp)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)