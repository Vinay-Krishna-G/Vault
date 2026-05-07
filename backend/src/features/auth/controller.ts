import { Request, Response, NextFunction } from 'express';
import { AuthService } from './service';
import { User } from './model';

export const AuthController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.register(req.body);
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.login(req.body);
      res.status(200).json({
        success: true,
        message: 'User logged in successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  async updateProfile(req: any, res: Response, next: NextFunction) {
    try {
      const { avatar } = req.body;
      const userId = req.user._id;

      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      if (!user.profileIdentity) {
        user.profileIdentity = {
          avatar: '🐼',
          avatarType: 'animal',
          displayName: user.username,
          bio: '',
          themePreset: 'purple',
          themePreference: 'system',
        };
      }

      if (avatar) user.profileIdentity.avatar = avatar;
      if (req.body.avatarType) user.profileIdentity.avatarType = req.body.avatarType;
      if (req.body.displayName) user.profileIdentity.displayName = req.body.displayName;
      if (req.body.bio !== undefined) user.profileIdentity.bio = req.body.bio;
      if (req.body.themePreset) user.profileIdentity.themePreset = req.body.themePreset;
      if (req.body.themePreference) user.profileIdentity.themePreference = req.body.themePreference;

      await user.save();

      const updatedUser = await User.findById(userId).select('-password');
      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: { user: updatedUser },
      });
      return;
    } catch (error) {
      next(error);
      return;
    }
  },
};
