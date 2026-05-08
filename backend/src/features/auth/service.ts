import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from './model';
import { AppError } from '../../utils/AppError';
import { config } from '../../config';

interface RegisterDTO {
  username: string;
  email: string;
  password: string;
  profileIdentity: { avatar: string; color: string };
}

interface LoginDTO {
  email: string;
  password: string;
}

const signToken = (userId: string) =>
  jwt.sign({ id: userId }, config.jwt.secret as string, { expiresIn: '1d' });

export const AuthService = {
  async register(data: RegisterDTO) {
    const [existingEmail, existingUsername] = await Promise.all([
      User.findOne({ email: data.email.toLowerCase() }),
      User.findOne({ username: data.username }),
    ]);
    if (existingEmail) throw new AppError('Email is already registered', 400);
    if (existingUsername) throw new AppError('Username is already taken', 400);

    const hashedPassword = await bcrypt.hash(data.password, 12);
    const user = await User.create({ ...data, password: hashedPassword });
    const token = signToken(user._id.toString());
    const { password, ...userWithoutPassword } = user.toObject();
    return { user: userWithoutPassword, token };
  },

  async login(data: LoginDTO) {
    const user = await User.findOne({ email: data.email.toLowerCase() }).select('+password');
    if (!user) throw new AppError('Invalid email or password', 401);

    const isMatch = await bcrypt.compare(data.password, user.password);
    if (!isMatch) throw new AppError('Invalid email or password', 401);

    const token = signToken(user._id.toString());
    const { password, ...userWithoutPassword } = user.toObject();
    return { user: userWithoutPassword, token };
  },
};
