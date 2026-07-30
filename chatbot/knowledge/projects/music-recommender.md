### How It Works

1. Data Loading: Reads the CSV file containing 18 samples with age, gender, and genre
2. Model Training: Trains a decision tree to learn patterns between demographics and music preferences
3. Evaluation: Tests the model on unseen data to measure accuracy
4. Persistence: Saves the model for future use without retraining
5. Visualization: Creates an interpretable tree diagram showing decision logic
6. Prediction: Enables quick genre prediction for new users
## Example Predictions

The model can predict genres for new users based on their age and gender. For example:
- User (age=21, gender=1) → Predicts HipHop
- Different age/gender combinations yield various genre predictions
Technical Details
- Algorithm: Decision Tree Classifier
- Features: 2 (age, gender)
- Classes: 5 (Acoustic, Classical, Dance, HipHop, Jazz)
- Training samples: 12
- Test samples: 6
- Final accuracy: 83.33%
## Applications

- Personal music recommendation system
- Understanding demographic-based music preferences
- Baseline model for music genre classification tasks

---