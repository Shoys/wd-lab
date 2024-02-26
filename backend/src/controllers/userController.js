import User from '../models/User.js';

// Get user profile
export const getUserProfile = async (req, res) => {
  try {
    const userId = req.query.user;
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    // Respond with a 404 status code if the error is due to a non-existent user
    // Adjust or add error handling logic as needed based on the specific error
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'User not found' });
    }

    // Log the error for debugging purposes
    console.error('Failed to get user profile:', error);
    // For other types of errors, respond with a 500 status code
    res.status(500).json({ message: 'Server error' });
  }
};
