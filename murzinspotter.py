import requests
from kivy.app import App
from kivy.uix.boxlayout import BoxLayout
from kivy.uix.button import Button
from kivy.uix.image import Image
from kivy.uix.label import Label
from kivy.uix.filechooser import FileChooserIconView
from kivy.uix.popup import Popup
import random

API_BASE_URL = "https://your-api-url.com"  # Replace with your API URL

class MurzinSpotterApp(App):
    def build(self):
        self.layout = BoxLayout(orientation='vertical', padding=10, spacing=10)
        self.score = 0
        
        # Display Score
        self.score_label = Label(text=f"Score: {self.score}", font_size='20sp')
        self.layout.add_widget(self.score_label)
        
        # Image Placeholder
        self.image = Image(source='', size_hint=(1, 0.5))
        self.layout.add_widget(self.image)
        
        # Upload Button
        self.upload_button = Button(text="Upload Murzin Photo", size_hint=(1, 0.2))
        self.upload_button.bind(on_press=self.open_filechooser)
        self.layout.add_widget(self.upload_button)
        
        # Rarity Button (for simulation)
        self.rarity_button = Button(text="Simulate Rarity Scoring", size_hint=(1, 0.2))
        self.rarity_button.bind(on_press=self.simulate_rarity)
        self.layout.add_widget(self.rarity_button)
        
        # View Leaderboard Button
        self.leaderboard_button = Button(text="View Leaderboard", size_hint=(1, 0.2))
        self.leaderboard_button.bind(on_press=self.view_leaderboard)
        self.layout.add_widget(self.leaderboard_button)
        
        return self.layout

    def open_filechooser(self, instance):
        self.filechooser = FileChooserIconView(size_hint=(1, 0.5))
        self.filechooser.bind(on_submit=self.load_image)
        self.layout.add_widget(self.filechooser)

    def load_image(self, chooser, selection):
        if selection:
            filepath = selection[0]
            self.image.source = filepath
            self.layout.remove_widget(self.filechooser)  # Close file chooser

    def simulate_rarity(self, instance):
        rarity_score = random.choice([10, 50, 100])
        self.score += rarity_score
        self.score_label.text = f"Score: {self.score}"
        self.update_score(self.score)

    def update_score(self, score):
        try:
            response = requests.post(f"{API_BASE_URL}/update_score", json={"username": "player1", "score": score})
            if response.status_code == 200:
                print("Score updated successfully!")
            else:
                print("Failed to update score:", response.text)
        except Exception as e:
            print("Error connecting to the server:", e)

    def view_leaderboard(self, instance):
        try:
            response = requests.get(f"{API_BASE_URL}/leaderboard")
            if response.status_code == 200:
                leaderboard = response.json()
                content = "\n".join([f"{item['username']}: {item['score']}" for item in leaderboard])
                popup = Popup(title="Leaderboard", content=Label(text=content), size_hint=(0.8, 0.8))
                popup.open()
            else:
                print("Failed to fetch leaderboard:", response.text)
        except Exception as e:
            print("Error connecting to the server:", e)

if __name__ == "__main__":
    MurzinSpotterApp().run()