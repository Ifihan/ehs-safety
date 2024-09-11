# Object Detection of EHS equipments with YOLO

## Introduction

This project is about object detection of EHS (Environment, Health and Safety) equipments with YOLO (You Only Look Once) algorithm. The project is implemented with Python and YOLO.

## Project Structure

The project is organized as follows:

```bash
ehs-safety/
│
├── app.py                 # Main application file (Flask app)
├── requirements.txt        # Dependencies for the project
├── templates/              # HTML templates for the web interface
├── static/                 # Static files (CSS, JS, images)
├── models/                 # Machine learning models
├── final_year_project.ipynb # Jupyter notebook for analysis or documentation
├── .env.example            # Example environment variable configuration
├── .gitignore              # Files ignored by Git
├── .github/                # GitHub-specific configuration and workflows
└── README.md               # This readme file
```

## Installation

To get started with the project, follow these steps:

1. Clone the repository to your GitHub account and clone:

```bash
git clone https://github.com/your-username/ehs-safety.git
```

2. Navigate to the project directory:

```bash
cd ehs-safety
```

3. Install the required dependencies:

```bash
pip install -r requirements.txt
```

4. Set up your environment variables:

- Create a .env file based on the .env.example file.
- Add your secret keys and other configuration information.

5. Export the keys from the .env file to the environment (terminal) line by line:
```bash
export CLOUDINARY_CLOUD_NAME=name
```
```bash
export CLOUDINARY_API_KEY=apikey
```
```bash
export CLOUDINARY_API_SECRET=apisecret
```


6. Run the application:

```bash
python app.py
```

The application should now be running locally on http://127.0.0.1:5000/.
