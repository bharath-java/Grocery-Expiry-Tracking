@echo off
cd %~dp0
echo Installing Appium Python dependencies...
pip install -r requirements.txt
echo Running Mobile Appium tests...
python appium_test.py
pause
