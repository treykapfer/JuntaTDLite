# this is the front end server for our client app
# To run this in a virtual enviorment, type python -m pipenv shell
# then type python server.py
# packages installed: Flask

from flask import Flask, render_template
app = Flask(__name__)

@app.route("/")
def menu():
    return render_template('menu.html')

@app.route("/game")
def game():
    return render_template('game.html')

if __name__== "__main__":
    app.run(debug=True)